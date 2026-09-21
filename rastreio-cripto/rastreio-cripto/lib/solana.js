// Leitura da rede Solana usando a Helius.
// Duas portas diferentes: a API de transacoes ja traduzidas e o RPC comum.

function chave() {
  const k = process.env.HELIUS_API_KEY;
  if (!k) throw new Error('Falta a variavel HELIUS_API_KEY.');
  return k;
}

const rpcUrl = () => `https://mainnet.helius-rpc.com/?api-key=${chave()}`;

async function rpc(metodo, params) {
  const r = await fetch(rpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ jsonrpc: '2.0', id: 'rastreio', method: metodo, params }),
  });
  if (!r.ok) throw new Error(`Helius RPC respondeu ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(`Helius RPC: ${j.error.message}`);
  return j.result;
}

/**
 * Ultimas transacoes que envolvem este token.
 * A Helius devolve a transacao ja traduzida, com quem mandou e quem recebeu.
 *
 * ATENCAO DE CUSTO: cada chamada aqui consome 100 creditos do plano gratuito
 * (1.000.000 por mes = cerca de 10.000 chamadas). Por isso o site so atualiza
 * os tokens que alguem olhou recentemente.
 */
export async function transferenciasSolana(mint, quantidade = 100) {
  const url = `https://api.helius.xyz/v0/addresses/${mint}/transactions?api-key=${chave()}&limit=${Math.min(quantidade, 100)}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Helius respondeu ${r.status}`);
  const lista = await r.json();
  if (!Array.isArray(lista)) return [];

  const saida = [];
  for (const tx of lista) {
    const transferencias = tx.tokenTransfers || [];
    for (const tt of transferencias) {
      if (tt.mint !== mint) continue;
      const qtd = Number(tt.tokenAmount);
      if (!qtd || !isFinite(qtd)) continue;
      saida.push({
        chain: 'solana',
        token_address: mint,
        tx_hash: tx.signature,
        ts: new Date((tx.timestamp || 0) * 1000).toISOString(),
        from_addr: tt.fromUserAccount || null,
        to_addr: tt.toUserAccount || null,
        amount: qtd,
        // A Helius ja classifica o tipo da transacao (SWAP, TRANSFER...).
        dica_tipo: tx.type || null,
        // Quem pagou a taxa costuma ser quem iniciou a operacao.
        iniciador: tx.feePayer || null,
        programas: (tx.instructions || []).map((i) => i.programId).filter(Boolean),
      });
    }
  }
  return saida;
}

/**
 * Dados do proprio token: casas decimais, total emitido,
 * e as duas autoridades que mais importam para risco.
 */
export async function dadosDoMint(mint) {
  try {
    const info = await rpc('getAccountInfo', [mint, { encoding: 'jsonParsed' }]);
    const p = info?.value?.data?.parsed?.info;
    if (!p) return {};
    const casas = Number(p.decimals ?? 0);
    return {
      decimals: casas,
      total_supply: p.supply ? Number(p.supply) / Math.pow(10, casas) : null,
      mint_authority: p.mintAuthority || null,      // null = nao pode emitir mais
      freeze_authority: p.freezeAuthority || null,  // null = nao pode congelar
    };
  } catch (e) {
    console.warn('dadosDoMint:', e.message);
    return {};
  }
}

/** Nome e sigla do token, quando o projeto publicou os metadados. */
export async function metadadosSolana(mint) {
  try {
    const a = await rpc('getAsset', { id: mint });
    return {
      simbolo: a?.token_info?.symbol || a?.content?.metadata?.symbol || null,
      nome: a?.content?.metadata?.name || null,
    };
  } catch (e) {
    return { simbolo: null, nome: null };
  }
}
