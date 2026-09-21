// ============================================================
// MAIORES DONOS DO TOKEN
// Quem tem mais tokens guardados AGORA (nao quem movimentou).
//   - Solana:   Helius RPC (getTokenLargestAccounts), 1 credito por chamada
//   - Ethereum: Ethplorer (gratuito, chave publica "freekey")
// Qualquer falha aqui devolve null: a pagina continua funcionando.
// ============================================================

async function rpcSolana(metodo, params) {
  const k = process.env.HELIUS_API_KEY;
  if (!k) throw new Error('Falta HELIUS_API_KEY');
  const r = await fetch(`https://mainnet.helius-rpc.com/?api-key=${k}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ jsonrpc: '2.0', id: 'donos', method: metodo, params }),
  });
  if (!r.ok) throw new Error(`Helius ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}

async function donosSolana(mint, supply) {
  if (!supply) return null;
  const maiores = await rpcSolana('getTokenLargestAccounts', [mint]);
  const contas = (maiores?.value || []).filter((c) => Number(c.uiAmount) > 0);
  if (!contas.length) return null;

  // Cada "conta de token" pertence a uma carteira dona. Descobrimos quem e.
  const info = await rpcSolana('getMultipleAccounts', [
    contas.map((c) => c.address),
    { encoding: 'jsonParsed' },
  ]);

  const porDono = new Map();
  contas.forEach((c, i) => {
    const dono = info?.value?.[i]?.data?.parsed?.info?.owner || c.address;
    porDono.set(dono, (porDono.get(dono) || 0) + Number(c.uiAmount));
  });

  return [...porDono.entries()]
    .map(([address, qtd]) => ({ address, pct: (qtd / supply) * 100 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);
}

async function donosEthereum(contrato) {
  const r = await fetch(
    `https://api.ethplorer.io/getTopTokenHolders/${contrato}?apiKey=freekey&limit=10`,
    { cache: 'no-store' }
  );
  if (!r.ok) throw new Error(`Ethplorer ${r.status}`);
  const j = await r.json();
  const lista = j?.holders;
  if (!Array.isArray(lista) || !lista.length) return null;
  return lista
    .map((h) => ({ address: String(h.address || '').toLowerCase(), pct: Number(h.share) || 0 }))
    .filter((h) => h.address)
    .slice(0, 10);
}

export async function maioresDonos(chain, address, supply) {
  try {
    return chain === 'solana'
      ? await donosSolana(address, supply)
      : await donosEthereum(address);
  } catch (e) {
    console.warn('maioresDonos:', e.message);
    return null;
  }
}
