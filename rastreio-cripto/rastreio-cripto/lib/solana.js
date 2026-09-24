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
 * os tokens que alguem olhou recentemente, e por isso o limite de paginas
 * abaixo e mais conservador que o do lado Ethereum.
 *
 * Mesmo motivo do lado Ethereum: sem rotina automatica, um token bem
 * negociado pode ter mais de 100 transacoes entre duas visitas. Viramos
 * pagina (parametro "before" da Helius) ate reencontrar a ultima leitura,
 * respeitando um teto de paginas para nao gastar credito demais numa
 * unica visita.
 */
export async function transferenciasSolana(mint, { desde = null, limite = null } = {}) {
  const TAMANHO_PAGINA = 100; // maximo aceito pela Helius por chamada
  const MAX_PAGINAS = 3; // ate 300 transacoes (300 creditos) por visita

  let brutas = [];
  let antesDe = null;
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const url = `https://api.helius.xyz/v0/addresses/${mint}/transactions?api-key=${chave()}&limit=${TAMANHO_PAGINA}`
      + (antesDe ? `&before=${antesDe}` : '');
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`Helius respondeu ${r.status}`);
    const lista = await r.json();
    if (!Array.isArray(lista) || !lista.length) break;

    brutas = brutas.concat(lista);
    const ultima = lista[lista.length - 1];
    const maisAntigaMs = (ultima.timestamp || 0) * 1000;

    const alcancouDesde = desde && maisAntigaMs <= new Date(desde).getTime();
    const alcancouLimite = limite && maisAntigaMs < limite;
    if (alcancouDesde || alcancouLimite || lista.length < TAMANHO_PAGINA) break;

    antesDe = ultima.signature;
  }

  const saida = [];
  for (const tx of brutas) {
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
