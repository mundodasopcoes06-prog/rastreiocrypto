// ============================================================
// SEGUNDA FONTE ON-CHAIN: GeckoTerminal
// Servico independente da DexScreener (base de dados propria, da
// equipe do CoinGecko). Gratuito, sem chave. Usado SO para conferir:
// nenhum preco da DexScreener e aceito sem essa segunda opiniao.
// ============================================================

const REDE_GT = { ethereum: 'eth', solana: 'solana' };

export async function precoGeckoTerminal(chain, address) {
  try {
    const r = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${REDE_GT[chain]}/tokens/${address}`,
      { cache: 'no-store', headers: { Accept: 'application/json' } }
    );
    if (!r.ok) return null;
    const j = await r.json();
    const a = j?.data?.attributes;
    if (!a) return null;
    const preco = Number(a.price_usd);
    return {
      preco: preco > 0 ? preco : null,
      liquidez: Number(a.total_reserve_in_usd) || null,
      volume24h: Number(a.volume_usd?.h24) || null,
      simbolo: a.symbol || null,
    };
  } catch (e) {
    console.warn('precoGeckoTerminal:', e.message);
    return null;
  }
}
