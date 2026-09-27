// ============================================================
// BITCOIN — rastreio de GRANDES movimentos (sem preco, sem compra/venda)
//
// Por que Bitcoin e diferente: nao tem DEX nem "compra/venda on-chain".
// So existem transferencias de saldo (UTXO). Entao aqui a gente le SO
// os movimentos GRANDES e diz uma de tres coisas, sempre factual:
//   - saida_corretora     : saiu de uma carteira de corretora conhecida
//   - entrada_corretora   : entrou numa carteira de corretora conhecida
//   - transferencia_grande: grande movimento entre carteiras nao rotuladas
//
// "Corretora" so quando o endereco esta em address_labels(chain='bitcoin')
// = FATO. Sem rotulo, e "carteira nao identificada". Nunca inventamos.
//
// Fonte: mempool.space (publica, sem chave). Como nao expoe filtro de
// "transacao grande", lemos os blocos novos desde o ultimo que ja vimos
// e ficamos so com as saidas acima do corte em BTC.
// ============================================================

import { db } from './supabase';

const BASE = 'https://mempool.space/api';
// Corte: so movimento >= isto (em BTC) entra. Ajustavel.
export const CORTE_BTC = 50;
// Quantos blocos no maximo processar por rodada (protege cota/tempo).
const MAX_BLOCOS_POR_RODADA = 6;
const SATS = 1e8;

async function j(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`mempool.space ${r.status} em ${url}`);
  return r.json();
}
async function txt(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`mempool.space ${r.status} em ${url}`);
  return r.text();
}

/** Carrega os rotulos de Bitcoin como Map endereco -> label. */
async function rotulosBitcoin() {
  const { data } = await db().from('address_labels').select('address,label').eq('chain', 'bitcoin');
  const m = new Map();
  for (const r of data || []) m.set(r.address, r.label);
  return m;
}

/**
 * Le os blocos novos desde o ultimo processado e grava os grandes
 * movimentos. Feito para rodar na rotina automatica (a cada 15 min).
 */
export async function coletarBitcoin() {
  const s = db();
  const rotulos = await rotulosBitcoin();

  const alturaAtual = Number(await txt(`${BASE}/blocks/tip/height`));
  if (!Number.isFinite(alturaAtual)) throw new Error('altura invalida');

  const { data: estado } = await s.from('bitcoin_estado').select('ultimo_bloco').eq('id', 1).maybeSingle();
  let desde = Number(estado?.ultimo_bloco) || (alturaAtual - 1);
  if (desde >= alturaAtual) return { novos: 0, ateBloco: alturaAtual };

  const primeiro = Math.max(desde + 1, alturaAtual - MAX_BLOCOS_POR_RODADA + 1);
  let gravados = 0;

  for (let altura = primeiro; altura <= alturaAtual; altura++) {
    const hash = await txt(`${BASE}/block-height/${altura}`);
    const info = await j(`${BASE}/block/${hash}`);
    const carimbo = new Date((info.timestamp || 0) * 1000).toISOString();

    const linhas = [];
    // Paginacao de 25 em 25; paramos o bloco quando nao houver mais txs.
    for (let idx = 0; ; idx += 25) {
      let txs;
      try { txs = await j(`${BASE}/block/${hash}/txs/${idx}`); }
      catch { break; }
      if (!Array.isArray(txs) || txs.length === 0) break;

      for (const tx of txs) {
        // Origem provavel: o maior endereco de entrada (para rotular corretora).
        const origem = (tx.vin || [])
          .map((i) => i.prevout).filter(Boolean)
          .sort((a, b) => (b.value || 0) - (a.value || 0))[0];
        const fromAddr = origem?.scriptpubkey_address || null;
        const fromLabel = fromAddr ? rotulos.get(fromAddr) || null : null;

        for (const o of tx.vout || []) {
          const btc = (o.value || 0) / SATS;
          if (btc < CORTE_BTC) continue;
          const toAddr = o.scriptpubkey_address || null;
          const toLabel = toAddr ? rotulos.get(toAddr) || null : null;

          let categoria = 'transferencia_grande';
          if (toLabel) categoria = 'entrada_corretora';
          else if (fromLabel) categoria = 'saida_corretora';

          linhas.push({
            tx_hash: tx.txid, ts: carimbo, amount_btc: btc,
            from_addr: fromAddr, to_addr: toAddr,
            from_label: fromLabel, to_label: toLabel, categoria,
          });
        }
      }
      if (txs.length < 25) break;
    }

    if (linhas.length) {
      for (let i = 0; i < linhas.length; i += 100) {
        const { error } = await s.from('bitcoin_movimentos')
          .upsert(linhas.slice(i, i + 100), { onConflict: 'tx_hash,from_addr,to_addr,amount_btc', ignoreDuplicates: true });
        if (error) console.warn('btc upsert:', error.message);
        else gravados += Math.min(100, linhas.length - i);
      }
    }
    desde = altura;
  }

  await s.from('bitcoin_estado').update({ ultimo_bloco: desde, atualizado_em: new Date().toISOString() }).eq('id', 1);
  try { await s.rpc('limpar_antigos'); } catch (e) { /* nao trava */ }
  return { novos: gravados, ateBloco: desde };
}

/** Le o painel do Bitcoin: saldo liquido de corretoras + grandes movimentos. */
export async function lerBitcoin() {
  const s = db();
  const desde = new Date(Date.now() - 15 * 86400000).toISOString();
  const { data } = await s.from('bitcoin_movimentos').select('*').gte('ts', desde).order('ts', { ascending: false }).limit(500);
  const movs = data || [];

  const somaJanela = (horas) => {
    const lim = Date.now() - horas * 3600000;
    let entrada = 0, saida = 0, nEntrada = 0, nSaida = 0;
    for (const m of movs) {
      if (new Date(m.ts).getTime() < lim) continue;
      if (m.categoria === 'entrada_corretora') { entrada += Number(m.amount_btc); nEntrada++; }
      else if (m.categoria === 'saida_corretora') { saida += Number(m.amount_btc); nSaida++; }
    }
    // Saldo liquido de corretoras: entrada (possivel venda) - saida (possivel guarda).
    return { entrada, saida, nEntrada, nSaida, liquido: entrada - saida };
  };

  return {
    corretoras: { '24h': somaJanela(24), '7d': somaJanela(168), '15d': somaJanela(360) },
    movimentos: movs.slice(0, 100),
  };
}
