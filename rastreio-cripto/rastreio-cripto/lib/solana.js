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

export const TAMANHO_PAGINA_SOL = 100;
// Cada pagina custa cerca de 100 creditos da Helius (plano gratuito: 1 milhao/mes).
export const CREDITOS_POR_PAGINA_SOL = 100;

/**
 * Uma pagina de transacoes que citam o endereco do token, da mais nova
 * para a mais antiga.
 *   antesDe: assinatura -- continua a partir dela (paginacao)
 *   desdeTs: segundos Unix -- nao traz nada mais antigo que isso
 *
 * LIMITE DA FONTE (documentado pela Helius): so voltam transacoes em que
 * o proprio endereco do token aparece. Transferencias simples entre
 * carteiras que nao citam o endereco do token podem ficar de fora.
 */
export async function paginaSolana(mint, { antesDe = null, desdeTs = null } = {}) {
  const params = new URLSearchParams({
    'api-key': chave(),
    limit: String(TAMANHO_PAGINA_SOL),
    'sort-order': 'desc',
  });
  if (antesDe) params.set('before-signature', antesDe);
  if (desdeTs) params.set('gte-time', String(Math.floor(desdeTs)));

  const r = await fetch(`https://api.helius.xyz/v0/addresses/${mint}/transactions?${params}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Helius respondeu ${r.status}`);
  const lista = await r.json();
  if (!Array.isArray(lista)) return { transacoes: 0, ultimaAssinatura: null, maisAntigaTs: null, transferencias: [] };

  const transferencias = [];
  for (const tx of lista) {
    for (const tt of tx.tokenTransfers || []) {
      if (tt.mint !== mint) continue;
      const qtd = Number(tt.tokenAmount);
      if (!qtd || !isFinite(qtd)) continue;
      transferencias.push({
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
  const ultima = lista[lista.length - 1];
  return {
    transacoes: lista.length,
    ultimaAssinatura: ultima?.signature || null,
    maisAntigaTs: ultima?.timestamp || null,
    transferencias,
  };
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
