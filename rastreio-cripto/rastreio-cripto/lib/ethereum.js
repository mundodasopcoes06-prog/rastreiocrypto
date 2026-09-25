// Leitura da rede Ethereum usando a API V2 da Etherscan.
// Uma unica chave funciona para varias redes; aqui usamos chainid=1 (Ethereum).

const BASE = 'https://api.etherscan.io/v2/api';
const CHAIN_ID = 1;

function chave() {
  const k = process.env.ETHERSCAN_API_KEY;
  if (!k) throw new Error('Falta a variavel ETHERSCAN_API_KEY.');
  return k;
}

async function chamar(params, tentativa = 1) {
  const url = new URL(BASE);
  url.searchParams.set('chainid', String(CHAIN_ID));
  url.searchParams.set('apikey', chave());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const r = await fetch(url.toString(), { cache: 'no-store' });
  if (!r.ok) throw new Error(`Etherscan respondeu ${r.status}`);
  const j = await r.json();

  // status "0" com "No transactions found" nao e erro: e token sem movimento.
  if (j.status === '0' && typeof j.result === 'string') {
    if (/no transactions found|no records found/i.test(j.result)) return [];
    // Duas leituras ao mesmo tempo podem passar do limite de 5 por segundo:
    // espera e tenta de novo, em vez de perder a leitura.
    if (/rate limit/i.test(j.result) && tentativa <= 3) {
      await new Promise((res) => setTimeout(res, 1100 * tentativa));
      return chamar(params, tentativa + 1);
    }
    throw new Error(`Etherscan: ${j.result}`);
  }
  return j.result;
}

// Espera entre chamadas para respeitar o limite do plano gratuito.
export function respirar(ms = 260) {
  return new Promise((res) => setTimeout(res, ms));
}

/** Numero do bloco mais proximo de um horario (segundos Unix). */
export async function blocoPorTempo(tsSegundos) {
  const r = await chamar({
    module: 'block',
    action: 'getblocknobytime',
    timestamp: Math.floor(tsSegundos),
    closest: 'after',
  });
  const n = Number(r);
  if (!Number.isFinite(n)) throw new Error('Etherscan nao devolveu o bloco para o horario pedido.');
  return n;
}

export const TAMANHO_PAGINA_ETH = 1000;
// A Etherscan so entrega ate 10.000 registros por consulta (pagina x tamanho).
export const MAX_PAGINAS_ETH = 10;

/**
 * Uma pagina de transferencias do token dentro de uma faixa de blocos.
 * ordem: 'asc' (do mais antigo para o mais novo) ou 'desc'.
 * Ler por faixa de blocos e o que permite pegar TODAS as transferencias,
 * sem o teto de 10.000 registros de uma consulta unica.
 */
export async function paginaTransferencias(contrato, { inicio, fim, ordem, pagina }) {
  const bruto = await chamar({
    module: 'account',
    action: 'tokentx',
    contractaddress: contrato,
    startblock: inicio,
    endblock: fim,
    page: pagina,
    offset: TAMANHO_PAGINA_ETH,
    sort: ordem,
  });
  if (!Array.isArray(bruto)) return [];
  return bruto.map((t) => {
    const casas = parseInt(t.tokenDecimal || '18', 10);
    return {
      chain: 'ethereum',
      token_address: contrato.toLowerCase(),
      tx_hash: t.hash,
      bloco: Number(t.blockNumber),
      ts: new Date(Number(t.timeStamp) * 1000).toISOString(),
      from_addr: (t.from || '').toLowerCase(),
      to_addr: (t.to || '').toLowerCase(),
      amount: Number(t.value) / Math.pow(10, casas),
      simbolo: t.tokenSymbol,
      nome: t.tokenName,
      decimals: casas,
    };
  });
}

/** Quem publicou o contrato na rede. */
export async function criadorDoContrato(contrato) {
  try {
    const r = await chamar({
      module: 'contract',
      action: 'getcontractcreation',
      contractaddresses: contrato,
    });
    if (Array.isArray(r) && r[0]) {
      return {
        criador: (r[0].contractCreator || '').toLowerCase(),
        txCriacao: r[0].txHash || null,
      };
    }
  } catch (e) {
    // Endpoint indisponivel nao pode derrubar a pagina inteira.
    console.warn('criadorDoContrato:', e.message);
  }
  return { criador: null, txCriacao: null };
}

/** Quantidade total de tokens emitidos. */
export async function supplyEthereum(contrato, casas = 18) {
  try {
    const r = await chamar({
      module: 'stats',
      action: 'tokensupply',
      contractaddress: contrato,
    });
    if (typeof r === 'string') return Number(r) / Math.pow(10, casas);
  } catch (e) {
    console.warn('supplyEthereum:', e.message);
  }
  return null;
}
