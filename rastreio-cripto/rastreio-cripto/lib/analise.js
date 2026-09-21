// ============================================================
// O CEREBRO DO SITE
// Aqui a movimentacao crua da blockchain vira frase em portugues.
//
// Regra que nunca muda:
//   - endereco que esta na nossa lista publica  -> confidence 'confirmado'
//   - qualquer leitura de padrao                -> confidence 'indicio'
// ============================================================

// A partir de quanto consideramos uma carteira "grande".
export const LIMITE_BALEIA_USD = 10000;
export const LIMITE_BALEIA_PCT_SUPPLY = 0.1; // 0,1% do total emitido

/**
 * Classifica uma transferencia.
 * rotulos: Map com chave 'chain:endereco' -> { label, category }
 * carteirasProjeto: Set de enderecos suspeitos de pertencerem ao projeto
 */
export function classificar(transferencia, { rotulos, carteirasProjeto, preco, supply }) {
  const { chain, from_addr, to_addr, amount } = transferencia;

  const de = from_addr ? rotulos.get(`${chain}:${from_addr}`) : null;
  const para = to_addr ? rotulos.get(`${chain}:${to_addr}`) : null;

  // Na Solana a propria transacao diz em quais programas ela passou.
  const programaDex = (transferencia.programas || [])
    .map((p) => rotulos.get(`${chain}:${p}`))
    .find((r) => r && r.category === 'dex');

  const usd = preco ? amount * preco : null;
  const pctSupply = supply ? (amount / supply) * 100 : null;

  let kind = 'transferencia';
  let actor = 'desconhecido';
  let actor_label = null;
  let confidence = 'indicio';
  let counterparty = to_addr;

  if (para?.category === 'queima') {
    kind = 'transferencia';
    actor = 'queima';
    actor_label = para.label;
    confidence = 'confirmado';
  } else if (de?.category === 'dex') {
    // Tokens saindo da pool: alguem comprou.
    kind = 'compra';
    actor = 'dex';
    actor_label = de.label;
    confidence = 'confirmado';
    counterparty = to_addr;
  } else if (para?.category === 'dex') {
    // Tokens entrando na pool: alguem vendeu.
    kind = 'venda';
    actor = 'dex';
    actor_label = para.label;
    confidence = 'confirmado';
    counterparty = from_addr;
  } else if (de?.category === 'corretora') {
    // Saque de corretora: tira oferta do mercado.
    kind = 'compra';
    actor = 'corretora';
    actor_label = de.label;
    confidence = 'confirmado';
    counterparty = to_addr;
  } else if (para?.category === 'corretora') {
    // Deposito em corretora: costuma vir antes de venda.
    kind = 'venda';
    actor = 'corretora';
    actor_label = para.label;
    confidence = 'confirmado';
    counterparty = from_addr;
  } else if (programaDex) {
    kind = transferencia.dica_tipo === 'SWAP' ? 'venda' : 'transferencia';
    actor = 'dex';
    actor_label = programaDex.label;
    confidence = 'indicio';
  } else if (carteirasProjeto.has(from_addr) || carteirasProjeto.has(to_addr)) {
    actor = 'projeto';
    confidence = 'indicio';
    kind = carteirasProjeto.has(from_addr) ? 'venda' : 'compra';
    counterparty = carteirasProjeto.has(from_addr) ? to_addr : from_addr;
  } else {
    const grande =
      (usd !== null && usd >= LIMITE_BALEIA_USD) ||
      (pctSupply !== null && pctSupply >= LIMITE_BALEIA_PCT_SUPPLY);
    actor = grande ? 'baleia' : 'desconhecido';
    confidence = 'indicio';
  }

  return {
    ...transferencia,
    usd_value: usd,
    supply_pct: pctSupply,
    kind,
    actor,
    actor_label,
    counterparty,
    confidence,
  };
}

/**
 * Descobre quais carteiras provavelmente pertencem ao projeto.
 * Ponto de partida: quem criou o contrato / quem tem a autoridade de emissao.
 * Em seguida: quem recebeu tokens diretamente dessas carteiras.
 * Isso e sempre INDICIO.
 */
export function detectarCarteirasProjeto(token, transferencias) {
  const raiz = new Set(
    [token.creator, token.mint_authority, token.freeze_authority]
      .filter(Boolean)
      .map((a) => (token.chain === 'ethereum' ? a.toLowerCase() : a))
  );

  const encontradas = new Map();
  for (const a of raiz) {
    encontradas.set(a, 'criou o contrato ou controla a emissao');
  }

  // Ordena do mais antigo para o mais novo para seguir o caminho dos tokens.
  const ordenadas = [...transferencias].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  for (const t of ordenadas) {
    if (t.from_addr && raiz.has(t.from_addr) && t.to_addr && !encontradas.has(t.to_addr)) {
      encontradas.set(t.to_addr, 'recebeu tokens direto da carteira que controla o contrato');
    }
  }

  return encontradas;
}

// ------------------------------------------------------------
// Balanco de compras e vendas
// ------------------------------------------------------------
function dentroDe(ts, horas) {
  return Date.now() - new Date(ts).getTime() <= horas * 3600 * 1000;
}

export function balanco(transferencias, horas) {
  const janela = transferencias.filter((t) => dentroDe(t.ts, horas));
  let compras = 0, vendas = 0, nCompras = 0, nVendas = 0;

  for (const t of janela) {
    const valor = t.usd_value ?? 0;
    if (t.kind === 'compra') { compras += valor; nCompras++; }
    else if (t.kind === 'venda') { vendas += valor; nVendas++; }
  }

  const total = compras + vendas;
  return {
    compras, vendas,
    nCompras, nVendas,
    liquido: compras - vendas,
    pctCompra: total > 0 ? (compras / total) * 100 : 50,
    pctVenda: total > 0 ? (vendas / total) * 100 : 50,
    movimentos: janela.length,
  };
}

/** Barrinhas de compra x venda por dia, para o grafico. */
export function porDia(transferencias, dias) {
  const mapa = new Map();
  const hoje = new Date();

  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    mapa.set(d.toISOString().slice(0, 10), { dia: d.toISOString().slice(0, 10), compras: 0, vendas: 0 });
  }

  for (const t of transferencias) {
    const dia = new Date(t.ts).toISOString().slice(0, 10);
    const linha = mapa.get(dia);
    if (!linha) continue;
    const valor = t.usd_value ?? 0;
    if (t.kind === 'compra') linha.compras += valor;
    else if (t.kind === 'venda') linha.vendas += valor;
  }

  return [...mapa.values()];
}

// ------------------------------------------------------------
// Sinais de atencao
// Cada item devolve { codigo, nivel, valores }
// nivel: 'alto' | 'medio' | 'info'
// ------------------------------------------------------------
export function gerarAlertas({ token, transferencias, snapshots, carteirasProjeto }) {
  const alertas = [];
  const ultimas24h = transferencias.filter((t) => dentroDe(t.ts, 24));

  // 1) Contrato ainda pode emitir ou congelar (FATO, lido do contrato)
  if (token.chain === 'solana') {
    if (token.mint_authority) alertas.push({ codigo: 'emissao_aberta', nivel: 'alto', fato: true, valores: {} });
    if (token.freeze_authority) alertas.push({ codigo: 'congelamento_aberto', nivel: 'medio', fato: true, valores: {} });
  }

  // 2) Carteira do projeto mandando volume para fora
  const saidasProjeto = ultimas24h.filter(
    (t) => carteirasProjeto.has(t.from_addr) && (t.usd_value ?? 0) > 0
  );
  if (saidasProjeto.length) {
    const maior = saidasProjeto.reduce((a, b) => ((b.usd_value ?? 0) > (a.usd_value ?? 0) ? b : a));
    alertas.push({
      codigo: 'dev_vendendo',
      nivel: 'alto',
      fato: false,
      valores: {
        qtd: maior.usd_value ? `$${Math.round(maior.usd_value).toLocaleString('pt-BR')}` : '—',
        pct: maior.supply_pct ? maior.supply_pct.toFixed(2) : '—',
        destino: maior.actor_label || 'uma carteira não identificada',
      },
    });
  }

  // 3) Liquidez caiu entre duas leituras
  if (snapshots.length >= 2) {
    const agora = snapshots[0];
    const antes = snapshots[snapshots.length - 1];
    if (antes.liquidity_usd > 0 && agora.liquidity_usd !== null) {
      const queda = ((antes.liquidity_usd - agora.liquidity_usd) / antes.liquidity_usd) * 100;
      if (queda >= 20) {
        alertas.push({
          codigo: 'liquidez_caiu',
          nivel: queda >= 50 ? 'alto' : 'medio',
          fato: false,
          valores: { pct: queda.toFixed(0) },
        });
      }
    }
  }

  // 4) Fluxo para corretoras nas ultimas 24h
  const paraCorretora = ultimas24h
    .filter((t) => t.actor === 'corretora' && t.kind === 'venda')
    .reduce((s, t) => s + (t.usd_value ?? 0), 0);
  const deCorretora = ultimas24h
    .filter((t) => t.actor === 'corretora' && t.kind === 'compra')
    .reduce((s, t) => s + (t.usd_value ?? 0), 0);

  if (paraCorretora > LIMITE_BALEIA_USD && paraCorretora > deCorretora * 1.5) {
    alertas.push({
      codigo: 'saida_para_corretora',
      nivel: 'medio',
      fato: false,
      valores: { qtd: `$${Math.round(paraCorretora).toLocaleString('pt-BR')}` },
    });
  }
  if (deCorretora > LIMITE_BALEIA_USD && deCorretora > paraCorretora * 1.5) {
    alertas.push({
      codigo: 'entrada_de_corretora',
      nivel: 'info',
      fato: false,
      valores: { qtd: `$${Math.round(deCorretora).toLocaleString('pt-BR')}` },
    });
  }

  // 5) Rajada de saidas grandes em menos de 10 minutos
  const grandes = ultimas24h
    .filter((t) => (t.usd_value ?? 0) >= LIMITE_BALEIA_USD)
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));
  for (let i = 0; i < grandes.length; i++) {
    const inicio = new Date(grandes[i].ts).getTime();
    let n = 1;
    for (let j = i + 1; j < grandes.length; j++) {
      if (new Date(grandes[j].ts).getTime() - inicio <= 10 * 60 * 1000) n++;
      else break;
    }
    if (n >= 5) {
      alertas.push({ codigo: 'rajada_saida', nivel: 'alto', fato: false, valores: { n } });
      break;
    }
  }

  // 6) Concentracao: poucas carteiras respondendo por quase tudo
  const porCarteira = new Map();
  for (const t of transferencias) {
    const v = t.usd_value ?? 0;
    if (!v || !t.from_addr) continue;
    porCarteira.set(t.from_addr, (porCarteira.get(t.from_addr) || 0) + v);
  }
  const totalMovimentado = [...porCarteira.values()].reduce((a, b) => a + b, 0);
  if (totalMovimentado > 0 && porCarteira.size >= 5) {
    const top5 = [...porCarteira.values()].sort((a, b) => b - a).slice(0, 5).reduce((a, b) => a + b, 0);
    const pct = (top5 / totalMovimentado) * 100;
    if (pct >= 70) {
      alertas.push({ codigo: 'concentracao', nivel: 'medio', fato: false, valores: { n: 5, pct: pct.toFixed(0) } });
    }
  }

  // 7) Token recem-criado
  if (token.created_on_chain_at) {
    const dias = (Date.now() - new Date(token.created_on_chain_at).getTime()) / 86400000;
    if (dias < 30) alertas.push({ codigo: 'token_novo', nivel: 'medio', fato: true, valores: {} });
  }

  const ordem = { alto: 0, medio: 1, info: 2 };
  return alertas.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}
