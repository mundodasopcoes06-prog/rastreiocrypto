// ============================================================
// INDEXADOR -- leitura continua, sem buracos
//
// Cada token guarda ate onde ja foi lido. A cada rodada o indexador:
//   1. vai PARA FRENTE: pega tudo o que aconteceu desde a ultima leitura;
//   2. vai PARA TRAS: completa o historico ate 15 dias atras.
// Assim, depois de sincronizado, o banco tem TODAS as transferencias do
// periodo. Enquanto nao sincroniza, o site sabe exatamente desde quando
// os dados estao completos e avisa isso na pagina.
// ============================================================

import {
  blocoPorTempo as blocoPorTempoReal,
  paginaTransferencias as paginaEthReal,
  respirar as respirarReal,
  TAMANHO_PAGINA_ETH,
  MAX_PAGINAS_ETH,
} from './ethereum';
import { paginaSolana as paginaSolReal, TAMANHO_PAGINA_SOL } from './solana';

export const JANELA_DIAS = 15;
export const JANELA_MS = JANELA_DIAS * 86400000;
const BLOCO_INFINITO = 999999999;
// Paginas da Helius por direcao em cada rodada (cada pagina = 100 transacoes).
const MAX_PAGINAS_SOL_POR_RODADA = 4;

const ms = (iso) => (iso ? new Date(iso).getTime() : null);

// ------------------------------------------------------------
// ETHEREUM -- cobertura completa por faixa de blocos
// ------------------------------------------------------------
export async function lerMovimentosEthereum(addr, token, { prazo, api = {} }) {
  const blocoPorTempo = api.blocoPorTempo || blocoPorTempoReal;
  const pagina = api.paginaTransferencias || paginaEthReal;
  const respirar = api.respirar || respirarReal;
  const agora = api.agora ? api.agora() : Date.now();
  const tempoOk = () => (api.agora ? api.agora() : Date.now()) < prazo;

  const limiteMs = agora - JANELA_MS;
  const alvo = await blocoPorTempo(limiteMs / 1000);

  let topo = token.bloco_topo != null ? Number(token.bloco_topo) : null;
  let base = token.bloco_base != null ? Number(token.bloco_base) : null;
  let desde = ms(token.cobertura_desde);
  let ate = ms(token.cobertura_ate);
  let emDia = false;
  const brutas = [];

  // Varre uma faixa de blocos, pagina por pagina (ate 10.000 registros).
  // "esgotou" = chegou ao fim da faixa; senao parou por tempo ou pelo teto.
  async function varrer(inicio, fim, ordem) {
    const linhas = [];
    for (let p = 1; p <= MAX_PAGINAS_ETH; p++) {
      if (!tempoOk()) return { linhas, esgotou: false };
      const lote = await pagina(addr, { inicio, fim, ordem, pagina: p });
      await respirar();
      linhas.push(...lote);
      if (lote.length < TAMANHO_PAGINA_ETH) return { linhas, esgotou: true };
    }
    return { linhas, esgotou: false };
  }

  const minTs = (linhas) => Math.min(...linhas.map((l) => ms(l.ts)));

  if (topo == null) {
    // Primeira leitura: do mais novo para o mais antigo, ate 15 dias atras.
    let fim = BLOCO_INFINITO;
    while (tempoOk()) {
      const { linhas, esgotou } = await varrer(alvo, fim, 'desc');
      brutas.push(...linhas);
      if (linhas.length) {
        const blocos = linhas.map((l) => l.bloco);
        topo = Math.max(topo ?? 0, ...blocos);
        const menor = Math.min(...blocos);
        base = base == null ? menor : Math.min(base, menor);
        desde = minTs(linhas);
      }
      if (esgotou) { base = alvo; desde = limiteMs; break; }
      if (!linhas.length) break;
      // Seguranca: um unico bloco com mais de 10.000 transferencias travaria o laco.
      fim = base === fim ? base - 1 : base;
    }
    if (topo != null || base === alvo) {
      if (topo == null) topo = alvo; // periodo sem nenhuma transferencia
      emDia = true;
      ate = agora;
    }
  } else {
    // 1) Para frente: tudo desde o ultimo bloco lido.
    let inicio = topo;
    while (tempoOk()) {
      const { linhas, esgotou } = await varrer(inicio, BLOCO_INFINITO, 'asc');
      brutas.push(...linhas);
      if (linhas.length) {
        topo = Math.max(topo, ...linhas.map((l) => l.bloco));
        ate = Math.max(ate ?? 0, ...linhas.map((l) => ms(l.ts)));
      }
      if (esgotou) { emDia = true; ate = agora; break; }
      if (!linhas.length) break;
      inicio = topo === inicio ? topo + 1 : topo;
    }

    // 2) Para tras: completa o historico ate 15 dias atras.
    if (base != null && base > alvo) {
      let fim = base;
      while (tempoOk()) {
        const { linhas, esgotou } = await varrer(alvo, fim, 'desc');
        brutas.push(...linhas);
        if (linhas.length) {
          base = Math.min(base, ...linhas.map((l) => l.bloco));
          desde = Math.min(desde ?? Infinity, minTs(linhas));
        }
        if (esgotou) { base = alvo; desde = limiteMs; break; }
        if (!linhas.length) break;
        fim = base === fim ? base - 1 : base;
      }
    } else if (base != null && base <= alvo) {
      desde = limiteMs; // a janela de 15 dias andou e ja esta toda coberta
    }
  }

  const completa = desde != null && desde <= limiteMs + 60000 && emDia;
  return {
    brutas,
    cursores: {
      bloco_topo: topo,
      bloco_base: base,
      cobertura_desde: desde != null ? new Date(desde).toISOString() : null,
      cobertura_ate: ate != null ? new Date(ate).toISOString() : null,
      cobertura_completa: completa,
    },
  };
}

// ------------------------------------------------------------
// SOLANA -- leitura continua dentro do orcamento de creditos
//
// A Parsed Events nao tem um filtro de data no servidor (so paginacao
// por cursor opaco), entao cada rodada sempre comeca do topo e vai
// paginando pra tras. Isso nao desperdica credito: e exatamente a
// quantidade de dados novos desde a ultima vez, nem mais nem menos.
// Para completar o historico dos 15 dias, a segunda parte retoma de um
// cursor guardado, separado do topo.
// ------------------------------------------------------------
export async function lerMovimentosSolana(addr, token, { prazo, reservar, api = {} }) {
  const pagina = api.paginaSolana || paginaSolReal;
  const agora = api.agora ? api.agora() : Date.now();
  const tempoOk = () => (api.agora ? api.agora() : Date.now()) < prazo;

  const limiteMs = agora - JANELA_MS;
  let desde = ms(token.cobertura_desde);
  let ate = ms(token.cobertura_ate);
  let cursorHistorico = token.assinatura_base || null;
  let cursorTopo = token.cursor_topo_solana || null;
  // O "alvo": ate onde essa corrida vai valer quando (e se) fechar a lacuna.
  // So e estabelecido uma vez, na primeira pagina da corrida -- nunca muda
  // no meio, senao uma rajada grande faria o alvo fugir pra sempre.
  let alvoTopo = ms(token.topo_alvo_solana);
  let semOrcamento = false;
  let fechouLacuna = false;
  const brutas = [];

  // 1) Do topo para baixo, ate reencontrar o que ja foi lido da ultima vez.
  // Se uma rodada anterior nao deu conta de fechar essa lacuna (rajada
  // grande demais para uma rodada so), continuamos EXATAMENTE de onde
  // paramos, sem nunca reler o topo de novo -- so quando a lacuna fechar
  // de vez e que vale a pena descobrir "o topo" outra vez.
  const fronteiraConhecida = ate ?? limiteMs;
  let paginasRestantes = MAX_PAGINAS_SOL_POR_RODADA;

  if (cursorTopo == null) {
    // Sem corrida em andamento: comeca uma nova, descobrindo o alvo agora.
    if (tempoOk() && (await reservar())) {
      paginasRestantes--;
      const pg0 = await pagina(addr, { continuarDe: null });
      for (const t of pg0.transferencias) {
        if (new Date(t.ts).getTime() >= fronteiraConhecida) brutas.push(t);
      }
      alvoTopo = pg0.transferencias.length
        ? Math.max(...pg0.transferencias.map((t) => new Date(t.ts).getTime()))
        : agora;
      const maisAntigaMs0 = pg0.maisAntigaTs != null ? pg0.maisAntigaTs * 1000 : null;
      if (!pg0.proximoToken || pg0.transacoes < TAMANHO_PAGINA_SOL || (maisAntigaMs0 != null && maisAntigaMs0 <= fronteiraConhecida)) {
        fechouLacuna = true;
      } else {
        cursorTopo = pg0.proximoToken;
      }
    } else {
      semOrcamento = true;
    }
  }

  // Continua fechando a lacuna em aberto, com o resto do orcamento da rodada.
  while (!fechouLacuna && cursorTopo != null && paginasRestantes > 0) {
    if (!tempoOk()) break;
    if (!(await reservar())) { semOrcamento = true; break; }
    paginasRestantes--;
    const pg = await pagina(addr, { continuarDe: cursorTopo });
    for (const t of pg.transferencias) {
      if (new Date(t.ts).getTime() >= fronteiraConhecida) brutas.push(t);
    }
    const maisAntigaMs = pg.maisAntigaTs != null ? pg.maisAntigaTs * 1000 : null;
    if (!pg.proximoToken || pg.transacoes < TAMANHO_PAGINA_SOL || (maisAntigaMs != null && maisAntigaMs <= fronteiraConhecida)) {
      fechouLacuna = true;
      break;
    }
    cursorTopo = pg.proximoToken;
  }

  if (fechouLacuna) {
    ate = alvoTopo ?? agora;
    cursorTopo = null;
    alvoTopo = null;
    if (desde == null) desde = Math.max(fronteiraConhecida, limiteMs);
  }
  // Se nao fechou, "ate" fica como estava -- os dados lidos ja foram
  // gravados (brutas), mas so contam como "sem buraco ate agora" quando
  // a lacuna realmente fechar. cursorTopo e alvoTopo ficam guardados
  // pra proxima rodada continuar exatamente daqui.

  // 2) Completa o historico ate 15 dias atras, retomando de onde parou.
  if (desde != null && desde > limiteMs + 60000 && !semOrcamento) {
    let cur = cursorHistorico;
    for (let p = 0; p < paginasRestantes; p++) {
      if (!tempoOk()) break;
      if (!(await reservar())) { semOrcamento = true; break; }
      const pg = await pagina(addr, { continuarDe: cur });
      for (const t of pg.transferencias) {
        if (new Date(t.ts).getTime() >= limiteMs) brutas.push(t);
      }
      const maisAntigaMs = pg.maisAntigaTs != null ? pg.maisAntigaTs * 1000 : null;
      if (maisAntigaMs != null) desde = Math.min(desde, maisAntigaMs);
      if (!pg.proximoToken || pg.transacoes < TAMANHO_PAGINA_SOL || (maisAntigaMs != null && maisAntigaMs <= limiteMs)) {
        desde = limiteMs; cursorHistorico = null; break;
      }
      cur = pg.proximoToken;
      cursorHistorico = cur;
    }

  } else if (desde != null && desde <= limiteMs + 60000) {
    cursorHistorico = null;
  }

  // "Em dia" significa que a varredura do topo chegou ate a fronteira
  // conhecida NESTA rodada -- nao que a ultima transacao seja recente
  // (um token calmo pode ficar minutos sem nenhum movimento e continuar
  // 100% em dia).
  const completa = desde != null && desde <= limiteMs + 60000 && fechouLacuna;
  return {
    brutas,
    semOrcamento,
    cursores: {
      assinatura_base: cursorHistorico,
      cursor_topo_solana: cursorTopo,
      topo_alvo_solana: alvoTopo != null ? new Date(alvoTopo).toISOString() : null,
      cobertura_desde: desde != null ? new Date(desde).toISOString() : null,
      cobertura_ate: ate != null ? new Date(ate).toISOString() : null,
      cobertura_completa: completa,
    },
  };
}
