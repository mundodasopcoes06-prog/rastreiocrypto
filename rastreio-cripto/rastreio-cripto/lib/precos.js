// Preco, liquidez e volume vem da DexScreener.
// E gratuita e nao exige chave de API.

const BASE = 'https://api.dexscreener.com/latest/dex';

// Como a DexScreener chama cada rede.
const REDE = { ethereum: 'ethereum', solana: 'solana' };

// Formato de um endereco de contrato em cada rede -- usado para saber
// se o termo digitado e um endereco (e nao um nome/sigla).
const ENDERECO_ETH = /^0x[a-fA-F0-9]{40}$/;
const ENDERECO_SOLANA = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function pareceEndereco(termo) {
  return ENDERECO_ETH.test(termo) || ENDERECO_SOLANA.test(termo);
}

function mesmoEndereco(chain, a, b) {
  if (!a || !b) return false;
  return chain === 'ethereum' ? a.toLowerCase() === b.toLowerCase() : a === b;
}

/**
 * Procura tokens por nome, sigla ou endereco.
 * E o que alimenta a caixa de busca do site.
 */
export async function procurarToken(termo) {
  const r = await fetch(`${BASE}/search?q=${encodeURIComponent(termo)}`, {
    cache: 'no-store',
  });
  if (!r.ok) return [];
  const j = await r.json();
  let pares = j?.pairs || [];

  // Se a pessoa colou um ENDERECO, o resultado tem que ser so sobre
  // aquele contrato -- nunca sobre outro token que apenas negocia
  // CONTRA ele (ex: uma pool "XPTO/PENDLE", onde o PENDLE e so o
  // par de referencia, nao o token que a pessoa quer ver).
  if (pareceEndereco(termo)) {
    pares = pares.filter((p) => {
      const chain = Object.keys(REDE).find((k) => REDE[k] === p.chainId);
      return chain && mesmoEndereco(chain, p.baseToken?.address, termo);
    });
  }

  // Um token aparece em varios pares. Ficamos com o par de maior liquidez.
  const porToken = new Map();
  for (const p of pares) {
    const chain = Object.keys(REDE).find((k) => REDE[k] === p.chainId);
    if (!chain) continue; // so Ethereum e Solana nesta fase
    const addr = p.baseToken?.address;
    if (!addr) continue;

    const id = `${chain}:${addr.toLowerCase()}`;
    const liq = Number(p.liquidity?.usd || 0);
    const atual = porToken.get(id);
    if (atual && atual.liquidez >= liq) continue;

    porToken.set(id, {
      chain,
      address: chain === 'ethereum' ? addr.toLowerCase() : addr,
      simbolo: p.baseToken?.symbol || '—',
      nome: p.baseToken?.name || '—',
      preco: Number(p.priceUsd) || null,
      liquidez: liq,
      volume24h: Number(p.volume?.h24 || 0),
      variacao24h: Number(p.priceChange?.h24 ?? 0),
    });
  }

  return [...porToken.values()]
    .sort((a, b) => b.liquidez - a.liquidez)
    .slice(0, 12);
}

/** Situacao atual de preco e liquidez de um token especifico. */
export async function situacaoDoToken(chain, address) {
  try {
    const r = await fetch(`${BASE}/tokens/${address}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();

    // CRITICO: a DexScreener devolve QUALQUER par que envolva este
    // endereco -- inclusive pares onde ele e so a "moeda de troco" de
    // OUTRO token (ex: uma pool "sPENDLE/PENDLE", onde o par principal
    // e o sPENDLE). Sem este filtro, se essa pool cruzada tiver mais
    // liquidez que os pares diretos do nosso token, o site acaba
    // mostrando o nome, o simbolo e o preco do OUTRO token. Por isso
    // exigimos que o nosso endereco seja exatamente o baseToken do par.
    const pares = (j?.pairs || []).filter(
      (p) => p.chainId === REDE[chain] && mesmoEndereco(chain, p.baseToken?.address, address)
    );
    if (!pares.length) return null;

    // Somamos a liquidez de todos os pares, e usamos o maior par como preco.
    const maior = pares.reduce((a, b) =>
      Number(b.liquidity?.usd || 0) > Number(a.liquidity?.usd || 0) ? b : a
    );

    return {
      price_usd: Number(maior.priceUsd) || null,
      liquidity_usd: pares.reduce((s, p) => s + Number(p.liquidity?.usd || 0), 0),
      volume_24h: pares.reduce((s, p) => s + Number(p.volume?.h24 || 0), 0),
      buys_24h: pares.reduce((s, p) => s + Number(p.txns?.h24?.buys || 0), 0),
      sells_24h: pares.reduce((s, p) => s + Number(p.txns?.h24?.sells || 0), 0),
      simbolo: maior.baseToken?.symbol || null,
      nome: maior.baseToken?.name || null,
      // Idade: usamos o par de negociacao MAIS ANTIGO, nao o maior.
      criado_em: (() => {
        const datas = pares.map((p) => Number(p.pairCreatedAt)).filter((n) => n > 0);
        return datas.length ? new Date(Math.min(...datas)).toISOString() : null;
      })(),
      // Enderecos das pools de negociacao. Na Ethereum sao exatamente as
      // carteiras que enviam/recebem o token numa compra/venda.
      pools: pares
        .filter((p) => p.pairAddress)
        .map((p) => ({ address: p.pairAddress, dex: p.dexId || 'dex' })),
    };
  } catch (e) {
    console.warn('situacaoDoToken:', e.message);
    return null;
  }
}
