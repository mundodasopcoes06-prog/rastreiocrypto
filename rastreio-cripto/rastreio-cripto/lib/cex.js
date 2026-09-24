// ============================================================
// CORRETORAS CENTRALIZADAS (CEX)
// Preco e volume nas grandes corretoras (Binance, Coinbase, KuCoin,
// OKX, Bybit, Gate.io, MEXC). Isso e um mundo separado da blockchain:
// aqui NUNCA da pra saber quais carteiras negociaram, so o total.
//
// Como confirmamos que e o token certo (evita o problema de tokens
// clonados com o mesmo nome/simbolo, ja visto em Solana):
//   1. Perguntamos ao CoinGecko pelo ENDERECO DO CONTRATO (nao pelo
//      nome). Se o endereco nao estiver cadastrado la, tratamos como
//      "nao listado" -- nunca adivinhamos pelo simbolo.
//   2. Para a Binance especificamente, os dados de vela (kline) dela
//      trazem quanto do volume foi comprado "a mercado" vs vendido,
//      o que da uma nocao real de pressao de compra/venda por la.
//      As outras corretoras nao expoem essa divisao publicamente.
// ============================================================

const CORRETORAS_ALVO = [
  { chave: 'binance', nome: 'Binance', match: ['binance'] },
  { chave: 'coinbase', nome: 'Coinbase', match: ['coinbase', 'gdax'] },
  { chave: 'kucoin', nome: 'KuCoin', match: ['kucoin'] },
  { chave: 'okx', nome: 'OKX', match: ['okx', 'okex'] },
  { chave: 'bybit', nome: 'Bybit', match: ['bybit'] },
  { chave: 'gate', nome: 'Gate.io', match: ['gate'] },
  { chave: 'mexc', nome: 'MEXC', match: ['mexc'] },
];

async function buscarCoinGecko(chain, address) {
  // O id de plataforma do CoinGecko e igual ao nosso: 'ethereum' ou 'solana'.
  const url = `https://api.coingecko.com/api/v3/coins/${chain}/contract/${address}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (r.status === 404) return null; // CoinGecko nao conhece este endereco
  if (!r.ok) throw new Error(`CoinGecko ${r.status}`);
  return r.json();
}

/** Pega, para cada corretora-alvo, o par com maior volume nela. */
function combinarPorCorretora(tickers) {
  const melhores = new Map();
  for (const ti of tickers || []) {
    const nomeMercado = (ti.market?.name || '').toLowerCase();
    const alvo = CORRETORAS_ALVO.find((c) => c.match.some((m) => nomeMercado.includes(m)));
    if (!alvo) continue;

    const volumeUsd = Number(ti.converted_volume?.usd) || 0;
    const atual = melhores.get(alvo.chave);
    if (!atual || volumeUsd > atual.volumeUsd) {
      melhores.set(alvo.chave, {
        chave: alvo.chave,
        nome: alvo.nome,
        par: `${ti.base}/${ti.target}`,
        precoUsd: Number(ti.converted_last?.usd) || null,
        volumeUsd,
        url: ti.trade_url || null,
      });
    }
  }
  return [...melhores.values()].sort((a, b) => b.volumeUsd - a.volumeUsd);
}

/** Soma 24 velas de 1 hora da Binance para achar compra x venda "a mercado". */
async function buscarFluxoBinance(par) {
  const symbol = par.replace('/', '').toUpperCase();
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) return null;
  const velas = await r.json();
  if (!Array.isArray(velas) || !velas.length) return null;

  let volumeTotalUsd = 0;
  let volumeCompraUsd = 0;
  for (const v of velas) {
    volumeTotalUsd += Number(v[7]) || 0; // volume em USDT (quote asset volume)
    volumeCompraUsd += Number(v[10]) || 0; // parte comprada "a mercado", em USDT
  }
  return { compraUsd: volumeCompraUsd, vendaUsd: Math.max(0, volumeTotalUsd - volumeCompraUsd) };
}

/**
 * Le o panorama do token nas grandes corretoras centralizadas.
 * Retorna:
 *   null                          -> erro ao consultar (tenta de novo depois)
 *   { listado: false, ... }       -> confirmado que nao esta nas corretoras verificadas
 *   { listado: true, corretoras, variacao24h, simboloDivergente } -> encontrado
 *
 * simboloOnChain: o simbolo que o proprio site leu da blockchain para
 * este contrato (ex: "sPENDLE"). Serve para detectar quando o CoinGecko
 * devolve dados de um token DIFERENTE (ex: o "PENDLE" comum) associado
 * ao mesmo registro -- coisa que ja vimos acontecer com tokens que tem
 * uma versao "empacotada" ou "investida" (wrapped/staked). Nesses casos
 * avisamos, em vez de apresentar como se fosse o preco do proprio token.
 */
export async function lerCorretoras(chain, address, simboloOnChain = null) {
  try {
    const dados = await buscarCoinGecko(chain, address);
    if (!dados) return { listado: false, corretoras: [], variacao24h: null };

    const corretoras = combinarPorCorretora(dados.tickers);
    const variacao24h = dados.market_data?.price_change_percentage_24h ?? null;

    const binance = corretoras.find((c) => c.chave === 'binance');
    if (binance) {
      try {
        const fluxo = await buscarFluxoBinance(binance.par);
        if (fluxo) binance.fluxo = fluxo;
      } catch (e) { /* o fluxo e um complemento; sem ele, o resto continua valendo */ }
    }

    // Se o simbolo que a CoinGecko conhece para este endereco for
    // diferente do que a propria blockchain nos deu, os dois provavelmente
    // nao sao a mesma coisa (ex: um token "staked" cujo contrato aparece
    // agrupado com o token original na CoinGecko).
    const simboloCoinGecko = dados.symbol ? dados.symbol.toUpperCase() : null;
    const simboloDivergente =
      !!simboloOnChain && !!simboloCoinGecko && simboloOnChain.toUpperCase() !== simboloCoinGecko;

    // Preco de referencia das corretoras (media ponderada que o proprio
    // CoinGecko calcula sobre todos os mercados). E a terceira fonte usada
    // para validar o preco on-chain -- a mais dificil de "quebrar", porque
    // vem de mercados com volume muito maior que uma pool isolada.
    const precoReferencia = Number(dados.market_data?.current_price?.usd) || null;

    return {
      listado: corretoras.length > 0,
      corretoras,
      variacao24h,
      simboloCoinGecko,
      simboloDivergente,
      precoReferencia,
    };
  } catch (e) {
    console.warn('lerCorretoras:', e.message);
    return null;
  }
}
