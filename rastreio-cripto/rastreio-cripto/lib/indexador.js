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
// ------------------------------------------------------------
export async function lerMovimentosSolana(addr, token, { prazo, reservar, api = {} }) {
  const pagina = api.paginaSolana || paginaSolReal;
  const agora = api.agora ? api.agora() : Date.now();
  const tempoOk = () => (api.agora ? api.agora() : Date.now()) < prazo;

  const limiteMs = agora - JANELA_MS;
  let desde = ms(token.cobertura_desde);
  let ate = ms(token.cobertura_ate);
  let base = token.assinatura_base || null;
  let semOrcamento = false;
  const brutas = [];

  // 1) Para frente: tudo desde a ultima leitura (1 minuto de folga; repetidos sao ignorados).
  const inicioFrenteMs = ate ? Math.max(limiteMs, ate - 60000) : limiteMs;
  let antes = null;
  let esgotou = false;
  let maisAntigaMs = null;
  let ultimaAssinatura = null;
  for (let p = 0; p < MAX_PAGINAS_SOL_POR_RODADA && tempoOk(); p++) {
    if (!(await reservar())) { semOrcamento = true; break; }
    const pg = await pagina(addr, { antesDe: antes, desdeTs: inicioFrenteMs / 1000 });
    brutas.push(...pg.transferencias);
    if (pg.maisAntigaTs) maisAntigaMs = pg.maisAntigaTs * 1000;
    if (pg.ultimaAssinatura) ultimaAssinatura = pg.ultimaAssinatura;
    if (pg.transacoes < TAMANHO_PAGINA_SOL) { esgotou = true; break; }
    antes = pg.ultimaAssinatura;
  }

  if (esgotou) {
    if (ate == null || desde == null) desde = inicioFrenteMs; // primeira leitura cobriu tudo
    ate = agora;
  } else if (maisAntigaMs != null) {
    // Nao deu para alcancar a leitura anterior: ficou um buraco.
    // A cobertura continua passa a valer so a partir do que foi lido agora.
    desde = maisAntigaMs;
    base = ultimaAssinatura;
    ate = agora;
  }

  // 2) Para tras: completa ate 15 dias atras.
  if (esgotou && base && desde != null && desde > limiteMs + 60000) {
    let antes2 = base;
    for (let p = 0; p < MAX_PAGINAS_SOL_POR_RODADA && tempoOk(); p++) {
      if (!(await reservar())) { semOrcamento = true; break; }
      const pg = await pagina(addr, { antesDe: antes2, desdeTs: limiteMs / 1000 });
      brutas.push(...pg.transferencias);
      if (pg.maisAntigaTs) desde = Math.min(desde, pg.maisAntigaTs * 1000);
      if (pg.ultimaAssinatura) base = pg.ultimaAssinatura;
      if (pg.transacoes < TAMANHO_PAGINA_SOL) { desde = limiteMs; base = null; break; }
      antes2 = pg.ultimaAssinatura;
    }
  } else if (desde != null && desde <= limiteMs + 60000) {
    base = null;
  }

  const emDia = ate != null && agora - ate < 60000;
  const completa = desde != null && desde <= limiteMs + 60000 && emDia;
  return {
    brutas,
    semOrcamento,
    cursores: {
      assinatura_base: base,
      cobertura_desde: desde != null ? new Date(desde).toISOString() : null,
      cobertura_ate: ate != null ? new Date(ate).toISOString() : null,
      cobertura_completa: completa,
    },
  };
}
