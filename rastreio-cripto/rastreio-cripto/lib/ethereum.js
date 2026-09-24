// Leitura da rede Ethereum usando a API V2 da Etherscan.
// Uma unica chave funciona para varias redes; aqui usamos chainid=1 (Ethereum).

const BASE = 'https://api.etherscan.io/v2/api';
const CHAIN_ID = 1;

function chave() {
  const k = process.env.ETHERSCAN_API_KEY;
  if (!k) throw new Error('Falta a variavel ETHERSCAN_API_KEY.');
  return k;
}

async function chamar(params) {
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
    throw new Error(`Etherscan: ${j.result}`);
  }
  return j.result;
}

// Espera entre chamadas para respeitar o limite do plano gratuito.
export function respirar(ms = 260) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Ultimas transferencias de um token ERC-20.
 * Devolve ja no formato padrao que o resto do site entende.
 *
 * O site so le a blockchain quando alguem abre a pagina (sem rotina
 * automatica). Para um token bem negociado, isso significa que, entre
 * duas visitas, podem ter acontecido MAIS de 200 transferencias -- e
 * pegar so as 200 mais recentes deixaria um buraco silencioso no meio
 * do periodo, fazendo o balanco de 24h parecer bem menor do que e de
 * verdade. Por isso viramos paginas pra tras ate reencontrar a ultima
 * leitura (parametro "desde"), ate um limite de seguranca por visita.
 */
export async function transferenciasEthereum(contrato, { desde = null, limite = null } = {}) {
  const TAMANHO_PAGINA = 1000; // maximo aceito pela Etherscan por pagina
  const MAX_PAGINAS = 5; // ate 5.000 registros numa unica visita

  let tudo = [];
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const bruto = await chamar({
      module: 'account',
      action: 'tokentx',
      contractaddress: contrato,
      page: pagina,
      offset: TAMANHO_PAGINA,
      sort: 'desc',
    });
    if (!Array.isArray(bruto) || !bruto.length) break;
    tudo = tudo.concat(bruto);

    const maisAntigoMs = Number(bruto[bruto.length - 1].timeStamp) * 1000;
    // Para de virar pagina quando: ja alcancou a ultima leitura anterior,
    // ja passou dos 31 dias que guardamos, ou a pagina veio incompleta
    // (significa que acabou o historico do contrato).
    const alcancouDesde = desde && maisAntigoMs <= new Date(desde).getTime();
    const alcancouLimite = limite && maisAntigoMs < limite;
    if (alcancouDesde || alcancouLimite || bruto.length < TAMANHO_PAGINA) break;

    await respirar();
  }

  return tudo.map((t) => {
    const casas = parseInt(t.tokenDecimal || '18', 10);
    const qtd = Number(t.value) / Math.pow(10, casas);
    return {
      chain: 'ethereum',
      token_address: contrato.toLowerCase(),
      tx_hash: t.hash,
      ts: new Date(Number(t.timeStamp) * 1000).toISOString(),
      from_addr: (t.from || '').toLowerCase(),
      to_addr: (t.to || '').toLowerCase(),
      amount: qtd,
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
