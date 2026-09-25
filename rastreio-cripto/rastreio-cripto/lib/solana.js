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
// Ate 24/09/2026 a Helius so tinha o endpoint antigo (Enhanced Transactions,
// 100 creditos por chamada). Nesse dia ela lancou o Parsed Events, com a
// mesma informacao por 10 creditos -- 10x mais barato. E o que usamos agora.
export const CREDITOS_POR_PAGINA_SOL = 10;

/**
 * Uma pagina de transacoes que citam o endereco do token, da mais nova
 * para a mais antiga.
 *   continuarDe: o "paginationToken" da resposta anterior, para continuar
 *                de onde parou.
 *
 * LIMITE DA FONTE (documentado pela Helius): so voltam transacoes em que
 * o proprio endereco do token aparece. Transferencias simples entre
 * carteiras que nao citam o endereco do token podem ficar de fora.
 */
export async function paginaSolana(mint, { continuarDe = null } = {}) {
  // So campos documentados: a Helius RECUSA a requisicao inteira se receber
  // um campo que nao conhece. A ordem padrao ja e "mais nova primeiro".
  const corpo = { address: mint, limit: TAMANHO_PAGINA_SOL };
  if (continuarDe) corpo.paginationToken = continuarDe;

  const r = await fetch(`https://mainnet.helius-rpc.com/v1/parsed-events/transaction-history?api-key=${chave()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  if (!r.ok) throw new Error(`Helius respondeu ${r.status}`);
  const j = await r.json();
  const lista = Array.isArray(j?.data) ? j.data : [];

  const transferencias = [];
  let maisAntigaTs = null;
  for (const item of lista) {
    const p = item?.parsed;
    // A data de TODA transacao da pagina conta para saber ate onde a pagina
    // chegou -- inclusive as que falharam ou nao foram decodificadas.
    if (p?.blockTime && (maisAntigaTs === null || p.blockTime < maisAntigaTs)) maisAntigaTs = p.blockTime;
    if (!p || item.parserStatus !== 'OK') continue;
    // Transacao que FALHOU na blockchain (ex: "slippage" estourado): a Helius
    // ainda lista as transferencias que ela TENTOU fazer, mas nenhum token
    // mudou de mao. Contar isso inventaria compras e vendas que nao existiram.
    if (p.transactionStatus && p.transactionStatus !== 'OK') continue;
    for (const tt of p.tokenTransfers || []) {
      if (tt.mint !== mint) continue;
      const casas = Number(tt.decimals) || 0;
      const qtd = Number(tt.rawTokenAmount) / Math.pow(10, casas);
      if (!qtd || !isFinite(qtd)) continue;
      transferencias.push({
        chain: 'solana',
        token_address: mint,
        tx_hash: item.signature,
        ts: new Date((p.blockTime || 0) * 1000).toISOString(),
        from_addr: tt.fromUserAccount || null,
        to_addr: tt.toUserAccount || null,
        amount: qtd,
        // A Helius ja classifica o tipo da transacao (swap, transfer...).
        // Maiusculo pra bater com o resto do codigo, que espera 'SWAP'.
        dica_tipo: p.summary?.type ? String(p.summary.type).toUpperCase() : null,
        // Quem pagou a taxa costuma ser quem iniciou a operacao.
        iniciador: p.feePayer || null,
        programas: (p.instructions || []).map((i) => i.programId).filter(Boolean),
      });
    }
  }
  return {
    transacoes: lista.length,
    proximoToken: j?.paginationToken || null,
    maisAntigaTs,
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
