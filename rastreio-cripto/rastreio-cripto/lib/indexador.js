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
const BLOCO_INFINITO = 99999999; // formato usado na documentacao da Etherscan
// Paginas da Helius por direcao em cada rodada (cada pagina = 100 transacoes, 10 creditos).
const MAX_PAGINAS_SOL_POR_RODADA = 15;
// Teto de transferencias lidas por rodada na Ethereum. Ler e GRAVAR precisa
// caber nos 60 segundos da Vercel; o que passar disso fica para a proxima
// rodada (o cursor garante que nada se perde). Sem esse teto, a primeira
// leitura de um token movimentado estourava o tempo e a Vercel cortava tudo.
export const MAX_LINHAS_POR_RODADA_ETH = 5000;

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
  const podeContinuar = () => tempoOk() && brutas.length < MAX_LINHAS_POR_RODADA_ETH;

  async function varrer(inicio, fim, ordem) {
    const linhas = [];
    for (let p = 1; p <= MAX_PAGINAS_ETH; p++) {
      if (!tempoOk() || brutas.length + linhas.length >= MAX_LINHAS_POR_RODADA_ETH) return { linhas, esgotou: false };
      const lote = await pagina(addr, { inicio, fim, ordem, pagina: p });
      await respirar();
      linhas.push(...lote);
      if (lote.length < TAMANHO_PAGINA_ETH) return { linhas, esgotou: true };
    }
    return { linhas, esgotou: false };
  }

  const minTs = (linhas) => Math.min(...linhas.map((l) => ms(l.ts)));
  const blocos = (linhas) => linhas.map((l) => l.bloco);

  // So guardamos BLOCOS COMPLETOS. Se a varredura parou no meio (tempo, teto de
  // linhas ou limite de 10.000 da Etherscan), o bloco da borda pode ter vindo
  // pela metade: ele e descartado agora e lido inteiro na proxima rodada.
  // Assim NENHUM movimento e lido duas vezes -- o que importa porque, depois
  // de 7 dias, o banco nao guarda mais o movimento um por um e nao teria como
  // reconhecer a repeticao (ela seria somada de novo nos totais).
  function aparar(linhas, esgotou, ordem) {
    if (esgotou || !linhas.length) return linhas;
    const borda = ordem === 'asc' ? Math.max(...blocos(linhas)) : Math.min(...blocos(linhas));
    const completos = linhas.filter((l) => l.bloco !== borda);
    // Um unico bloco com mais de 10.000 transferencias (nunca visto na pratica)
    // nao cabe numa consulta; nesse caso extremo, fica com o que veio.
    return completos.length ? completos : linhas;
  }

  // Cursores: "topo" = ultimo bloco lido por inteiro; "base" = primeiro bloco
  // lido por inteiro. A proxima leitura comeca no bloco seguinte, sem repetir.
  if (topo == null) {
    // Primeira leitura: do mais novo para o mais antigo, ate 15 dias atras.
    let fim = BLOCO_INFINITO;
    while (podeContinuar()) {
      const r = await varrer(alvo, fim, 'desc');
      const linhas = aparar(r.linhas, r.esgotou, 'desc');
      brutas.push(...linhas);
      if (linhas.length) {
        if (topo == null) topo = Math.max(...blocos(linhas)); // o bloco mais novo sempre vem inteiro
        base = Math.min(...blocos(linhas));
        desde = minTs(linhas);
      }
      if (r.esgotou) { base = alvo; desde = limiteMs; if (topo == null) topo = alvo; break; }
      if (!linhas.length) break;
      fim = base - 1;
    }
    if (topo != null) { emDia = true; ate = agora; }
  } else {
    // 1) Para frente: a partir do bloco seguinte ao ultimo lido.
    let inicio = topo + 1;
    while (podeContinuar()) {
      const r = await varrer(inicio, BLOCO_INFINITO, 'asc');
      const linhas = aparar(r.linhas, r.esgotou, 'asc');
      brutas.push(...linhas);
      if (linhas.length) {
        topo = Math.max(topo, ...blocos(linhas));
        ate = Math.max(ate ?? 0, ...linhas.map((l) => ms(l.ts)));
      }
      if (r.esgotou) { emDia = true; ate = agora; break; }
      if (!linhas.length) break;
      inicio = topo + 1;
    }

    // 2) Para tras: completa o historico ate 15 dias atras.
    if (base != null && base > alvo) {
      let fim = base - 1;
      while (podeContinuar()) {
        const r = await varrer(alvo, fim, 'desc');
        const linhas = aparar(r.linhas, r.esgotou, 'desc');
        brutas.push(...linhas);
        if (linhas.length) {
          base = Math.min(base, ...blocos(linhas));
          desde = Math.min(desde ?? Infinity, minTs(linhas));
        }
        if (r.esgotou) { base = alvo; desde = limiteMs; break; }
        if (!linhas.length) break;
        fim = base - 1;
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
  const paginaBruta = api.paginaSolana || paginaSolReal;
  // Se a Helius falhar (ex.: 429 insistente), NAO derruba a leitura: guarda o
  // que ja foi lido nesta rodada e para ali. Os cursores so avancam depois
  // de uma pagina lida com sucesso, entao a proxima rodada continua do ponto
  // exato, sem buraco.
  let falhaHelius = null;
  const pagina = async (a, opcoes) => {
    try { return await paginaBruta(a, opcoes); } catch (e) { falhaHelius = e.message; return null; }
  };
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
  const primeiraLeitura = ate == null;
  let paginasRestantes = MAX_PAGINAS_SOL_POR_RODADA;
  let maisAntigaLidaMs = null; // ate onde (para tras) a corrida do topo ja chegou
  const anotar = (pg) => {
    if (pg.maisAntigaTs != null) {
      const m = pg.maisAntigaTs * 1000;
      maisAntigaLidaMs = maisAntigaLidaMs == null ? m : Math.min(maisAntigaLidaMs, m);
    }
  };

  if (cursorTopo == null) {
    // Sem corrida em andamento: comeca uma nova, descobrindo o alvo agora.
    if (tempoOk() && (await reservar())) {
      paginasRestantes--;
      const pg0 = await pagina(addr, { continuarDe: null });
      if (!pg0) return { brutas, semOrcamento, falhaHelius, cursores: {} }; // nada lido: nada muda
      anotar(pg0);
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
    if (!pg) break;
    anotar(pg);
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

  // A Solana marca o horario por SEGUNDO: outra transacao do mesmo segundo
  // pode ser confirmada logo depois da nossa leitura. Por isso so declaramos
  // "completo ate" o segundo ANTERIOR a transacao mais nova lida; o ultimo
  // segundo e relido na proxima rodada (repetidos sao ignorados pelo banco).
  const seguro = (t) => (t != null ? t - 1000 : t);
  if (fechouLacuna) {
    ate = seguro(alvoTopo) ?? agora;
    cursorTopo = null;
    alvoTopo = null;
    if (desde == null) desde = Math.max(fronteiraConhecida, limiteMs);
  } else if (primeiraLeitura && alvoTopo != null && maisAntigaLidaMs != null && cursorTopo) {
    // Primeira leitura de um token movimentado: nao deu para ir ate 15 dias
    // numa rodada so. Em vez de esperar o historico inteiro para mostrar
    // qualquer coisa, o que ja foi lido (do agora para tras, sem buraco) ja
    // vale: as ultimas horas ficam completas desde ja, e o resto do historico
    // continua do MESMO ponto nas proximas rodadas (sem reler nada).
    // O segundo mais antigo pode ter vindo pela metade: so declaramos
    // completo a partir do segundo seguinte.
    ate = seguro(alvoTopo);
    desde = maisAntigaLidaMs + 1000;
    cursorHistorico = cursorTopo;
    cursorTopo = null;
    alvoTopo = null;
    fechouLacuna = true; // o topo desta rodada esta coberto; o historico segue abaixo
  }
  // Se nao fechou, "ate" fica como estava -- os dados lidos ja foram
  // gravados (brutas), mas so contam como "sem buraco ate agora" quando
  // a lacuna realmente fechar. cursorTopo e alvoTopo ficam guardados
  // pra proxima rodada continuar exatamente daqui.

  // 2) Completa o historico ate 15 dias atras, retomando de onde parou.
  // So retoma se houver um ponto de partida guardado. Sem ele, comecaria do
  // topo e releria transacoes; as com mais de 7 dias ja nao estao no banco
  // uma por uma para serem reconhecidas, e seriam SOMADAS DUAS VEZES.
  if (desde != null && desde > limiteMs + 60000 && !semOrcamento && cursorHistorico) {
    let cur = cursorHistorico;
    for (let p = 0; p < paginasRestantes; p++) {
      if (!tempoOk()) break;
      if (!(await reservar())) { semOrcamento = true; break; }
      const pg = await pagina(addr, { continuarDe: cur });
      if (!pg) break;
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
    falhaHelius,
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
