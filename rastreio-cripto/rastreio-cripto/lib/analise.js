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

// Abaixo disso, a liquidez e tao pequena que o preco "de tabela" da pool
// pode ter sido distorcido por uma unica negociacao grande -- vale para
// QUALQUER token, nao so os pequenos. Serve de disjuntor geral.
export const LIMITE_LIQUIDEZ_CONFIAVEL_USD = 50000;

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
    confidence = de.indicio ? 'indicio' : 'confirmado';
    counterparty = to_addr;
  } else if (para?.category === 'dex') {
    // Tokens entrando na pool: alguem vendeu.
    kind = 'venda';
    actor = 'dex';
    actor_label = para.label;
    confidence = para.indicio ? 'indicio' : 'confirmado';
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
    // Troca que passou por um programa de DEX conhecido.
    // Quem pagou a taxa (iniciador) e o usuario: se o token saiu dele,
    // ele vendeu; se o token chegou nele, ele comprou.
    actor = 'dex';
    actor_label = programaDex.label;
    confidence = 'indicio';
    const ini = transferencia.iniciador;
    if (transferencia.dica_tipo === 'SWAP' && ini && from_addr === ini) {
      kind = 'venda';
      counterparty = from_addr;
    } else if (transferencia.dica_tipo === 'SWAP' && ini && to_addr === ini) {
      kind = 'compra';
      counterparty = to_addr;
    } else {
      kind = 'transferencia';
    }
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
// Utilidades
// ------------------------------------------------------------
const valor = (t) => Number(t.usd_value) || 0;
const eNegocio = (t) => t.kind === 'compra' || t.kind === 'venda';
const usdTxt = (n) => `$${Math.round(n).toLocaleString('pt-BR')}`;

function eGrande(t) {
  return valor(t) >= LIMITE_BALEIA_USD || Number(t.supply_pct || 0) >= LIMITE_BALEIA_PCT_SUPPLY;
}

/** Hora e dia de um movimento no fuso escolhido (Brasilia para PT, UTC para EN). */
function horaNoFuso(iso, fuso) {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, minuto: Number(p.hour) * 60 + Number(p.minute) };
}

function distanciaMinutos(a, b) {
  const d = Math.abs(a - b) % 1440;
  return Math.min(d, 1440 - d);
}

export function fusoDoIdioma(locale) {
  return locale === 'en' ? 'UTC' : 'America/Sao_Paulo';
}

// ------------------------------------------------------------
// 1) O que as carteiras do projeto estao fazendo
// ------------------------------------------------------------
function acoesVazias() {
  return {
    venderam: 0, paraCorretora: 0, transferiram: 0, queimaram: 0,
    compraram: 0, deCorretora: 0, receberam: 0, n: 0,
  };
}

export function resumoProjeto(transferencias, carteirasProjeto) {
  const periodos = { '24h': acoesVazias(), '7d': acoesVazias(), '30d': acoesVazias() };
  const horas = { '24h': 24, '7d': 168, '30d': 720 };
  let ultimo = null;

  for (const t of transferencias) {
    const saiu = carteirasProjeto.has(t.from_addr);
    const entrou = carteirasProjeto.has(t.to_addr);
    if (!saiu && !entrou) continue;
    if (saiu && entrou) continue; // movimento interno entre carteiras do proprio projeto

    let acao;
    if (saiu) {
      if (t.actor === 'queima') acao = 'queimaram';
      else if (t.actor === 'dex' && t.kind === 'venda') acao = 'venderam';
      else if (t.actor === 'corretora') acao = 'paraCorretora';
      else acao = 'transferiram';
    } else {
      if (t.actor === 'dex' && t.kind === 'compra') acao = 'compraram';
      else if (t.actor === 'corretora') acao = 'deCorretora';
      else acao = 'receberam';
    }

    if (!ultimo || new Date(t.ts) > new Date(ultimo)) ultimo = t.ts;
    for (const k of Object.keys(periodos)) {
      if (dentroDe(t.ts, horas[k])) {
        periodos[k][acao] += valor(t);
        periodos[k].n++;
      }
    }
  }

  return { periodos, ultimo, nCarteiras: carteirasProjeto.size };
}

// ------------------------------------------------------------
// 2) Raio-x: quem comprou e quem vendeu, por tipo de carteira
// ------------------------------------------------------------
export const CATEGORIAS = ['corretoras', 'projeto', 'grandes', 'demais'];

export function categoriaDe(t, carteirasProjeto) {
  if (t.actor === 'corretora') return 'corretoras';
  if (t.actor === 'projeto' || (t.counterparty && carteirasProjeto.has(t.counterparty))) return 'projeto';
  return eGrande(t) ? 'grandes' : 'demais';
}

export function raioX(transferencias, horas, carteirasProjeto) {
  const r = {};
  for (const c of CATEGORIAS) r[c] = { compras: 0, vendas: 0, nCompras: 0, nVendas: 0 };
  for (const t of transferencias) {
    if (!eNegocio(t) || !dentroDe(t.ts, horas)) continue;
    const c = categoriaDe(t, carteirasProjeto);
    if (t.kind === 'compra') { r[c].compras += valor(t); r[c].nCompras++; }
    else { r[c].vendas += valor(t); r[c].nVendas++; }
  }
  return r;
}

// ------------------------------------------------------------
// 3) Negociacao artificial
// ------------------------------------------------------------

/** Varias compras/vendas com a MESMA quantidade, vindas de poucas carteiras. */
export function detectarValoresRepetidos(transferencias, conhecidos) {
  const semana = transferencias.filter((t) => eNegocio(t) && dentroDe(t.ts, 168) && Number(t.amount) > 0);
  const volumeSemana = semana.reduce((s, t) => s + valor(t), 0);

  const grupos = new Map();
  for (const t of semana) {
    // Mesma quantidade com margem de ~0,5% (3 algarismos significativos).
    const chave = Number(t.amount).toPrecision(3);
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(t);
  }

  let melhor = null;
  for (const lista of grupos.values()) {
    if (lista.length < 6) continue;
    const carteiras = new Set(
      lista.map((t) => t.counterparty).filter((a) => a && !conhecidos.has(a))
    );
    if (carteiras.size === 0) continue;
    // Muitas operacoes iguais para poucas carteiras: uma carteira a cada 3 operacoes, no maximo.
    if (carteiras.size > Math.max(2, Math.floor(lista.length / 3))) continue;
    if (!melhor || lista.length > melhor.lista.length) melhor = { lista, carteiras };
  }
  if (!melhor) return null;

  const { lista, carteiras } = melhor;
  const tempos = lista.map((t) => new Date(t.ts).getTime());
  const total = lista.reduce((s, t) => s + valor(t), 0);
  return {
    n: lista.length,
    carteiras: carteiras.size,
    compras: lista.filter((t) => t.kind === 'compra').length,
    vendas: lista.filter((t) => t.kind === 'venda').length,
    valorCada: total / lista.length,
    horas: Math.max(1, Math.round((Math.max(...tempos) - Math.min(...tempos)) / 3600000)),
    pctVolume: volumeSemana > 0 ? (total / volumeSemana) * 100 : 0,
    exemplo: [...carteiras][0],
  };
}

/** A mesma carteira comprando E vendendo varias vezes (vai-e-volta). */
export function detectarVaiEVolta(transferencias, conhecidos) {
  const porCarteira = new Map();
  for (const t of transferencias) {
    if (!eNegocio(t) || !dentroDe(t.ts, 168)) continue;
    const a = t.counterparty;
    if (!a || conhecidos.has(a)) continue;
    if (!porCarteira.has(a)) porCarteira.set(a, { compras: 0, vendas: 0, usd: 0 });
    const c = porCarteira.get(a);
    if (t.kind === 'compra') c.compras++; else c.vendas++;
    c.usd += valor(t);
  }
  const suspeitas = [...porCarteira.entries()]
    .filter(([, c]) => c.compras >= 3 && c.vendas >= 3)
    .sort((a, b) => b[1].compras + b[1].vendas - (a[1].compras + a[1].vendas));
  if (!suspeitas.length) return null;
  const [endereco, c] = suspeitas[0];
  return { carteiras: suspeitas.length, endereco, compras: c.compras, vendas: c.vendas, usd: c.usd };
}

// ------------------------------------------------------------
// 4) Carteiras irmas: varias carteiras abastecidas pela mesma origem
//    (so enxergamos abastecimento feito com o proprio token)
// ------------------------------------------------------------
export function detectarCarteirasIrmas(transferencias, conhecidos, carteirasProjeto) {
  const destinos = new Map();
  for (const t of transferencias) {
    if (['dex', 'corretora', 'queima'].includes(t.actor)) continue;
    if (!t.from_addr || !t.to_addr || conhecidos.has(t.from_addr) || conhecidos.has(t.to_addr)) continue;
    if (!destinos.has(t.from_addr)) destinos.set(t.from_addr, new Set());
    destinos.get(t.from_addr).add(t.to_addr);
  }

  const vendas = new Map();
  for (const t of transferencias) {
    if (t.kind !== 'venda' || !t.counterparty) continue;
    vendas.set(t.counterparty, (vendas.get(t.counterparty) || 0) + valor(t));
  }

  let melhor = null;
  for (const [origem, set] of destinos) {
    if (set.size < 4) continue;
    const venderam = [...set].filter((d) => vendas.has(d));
    if (venderam.length < 2) continue;
    const usd = venderam.reduce((s, d) => s + vendas.get(d), 0);
    if (!melhor || venderam.length > melhor.nVenderam) {
      melhor = { origem, nDestinos: set.size, nVenderam: venderam.length, usdVendido: usd, doProjeto: carteirasProjeto.has(origem) };
    }
  }
  return melhor;
}

// ------------------------------------------------------------
// 5) Mesmo horario todo dia
// ------------------------------------------------------------
export function detectarHorarioRepetido(transferencias, conhecidos, fuso) {
  const grupos = new Map();
  for (const t of transferencias) {
    if (!eNegocio(t)) continue;
    let chave, nome, endereco = null;
    if (t.actor === 'corretora' && t.actor_label) {
      chave = `c:${t.actor_label}:${t.kind}`;
      nome = t.actor_label;
    } else {
      if (!t.counterparty || conhecidos.has(t.counterparty)) continue;
      chave = `w:${t.counterparty}:${t.kind}`;
      endereco = t.counterparty;
    }
    if (!grupos.has(chave)) grupos.set(chave, { nome, endereco, kind: t.kind, eventos: [] });
    grupos.get(chave).eventos.push({ ...horaNoFuso(t.ts, fuso), usd: valor(t) });
  }

  const achados = [];
  for (const g of grupos.values()) {
    const diasAtivos = new Set(g.eventos.map((e) => e.dia));
    const minimo = g.nome ? 5 : 4; // corretoras tem muito movimento: exigimos mais
    if (diasAtivos.size < minimo) continue;

    let melhor = null;
    for (const centro of g.eventos) {
      const batem = g.eventos.filter((e) => distanciaMinutos(e.minuto, centro.minuto) <= 30);
      const dias = new Set(batem.map((e) => e.dia));
      if (!melhor || dias.size > melhor.dias) {
        melhor = { dias: dias.size, minuto: centro.minuto, batem };
      }
    }
    // Precisa repetir em varios dias E a maior parte da atividade tem que
    // estar nesse horario (senao e so um robo que opera o dia todo).
    if (melhor.dias < minimo || melhor.batem.length / g.eventos.length < 0.6) continue;

    const m = Math.round(melhor.minuto / 15) * 15 % 1440;
    achados.push({
      nome: g.nome,
      endereco: g.endereco,
      kind: g.kind,
      dias: melhor.dias,
      hora: `${String(Math.floor(m / 60)).padStart(2, '0')}h${String(m % 60).padStart(2, '0')}`,
      usd: melhor.batem.reduce((s, e) => s + e.usd, 0),
    });
  }
  return achados.sort((a, b) => b.dias - a.dias).slice(0, 3);
}

// ------------------------------------------------------------
// 6) Liquidez ao longo do tempo
// ------------------------------------------------------------
export function analisarLiquidez(snapshots) {
  const pts = snapshots
    .filter((s) => Number(s.liquidity_usd) > 0)
    .map((s) => ({ ts: s.ts, v: Number(s.liquidity_usd) }))
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));

  if (pts.length < 2) return { tipo: 'poucos', pontos: pts, leituras: pts.length };

  const primeiro = pts[0].v;
  const ultimo = pts[pts.length - 1].v;
  const variacao = ((ultimo - primeiro) / primeiro) * 100;

  let maiorQueda = 0;
  let quedas = 0;
  for (let i = 1; i < pts.length; i++) {
    const q = ((pts[i - 1].v - pts[i].v) / pts[i - 1].v) * 100;
    if (q > maiorQueda) maiorQueda = q;
    if (q > 1) quedas++;
  }

  let tipo = 'estavel';
  if (variacao <= -20) tipo = maiorQueda >= 0.6 * Math.abs(variacao) ? 'brusca' : 'gradual';
  else if (variacao >= 20) tipo = 'subiu';

  // No maximo 60 pontos no grafico.
  const passo = Math.max(1, Math.ceil(pts.length / 60));
  const pontos = pts.filter((_, i) => i % passo === 0 || i === pts.length - 1);

  return {
    tipo, pontos, leituras: pts.length,
    primeiro, ultimo, variacao, maiorQueda, quedas,
    desde: pts[0].ts, ate: pts[pts.length - 1].ts,
  };
}

// ------------------------------------------------------------
// 7) Maiores donos
// ------------------------------------------------------------
export function analisarDonos(token, conhecidos, carteirasProjeto) {
  const lista = Array.isArray(token.top_holders) ? token.top_holders : [];
  if (!lista.length) return null;

  const donos = lista.map((d) => {
    const r = conhecidos.get(d.address);
    let tipo = 'desconhecido';
    if (r?.category === 'dex') tipo = 'pool';
    else if (r?.category === 'corretora') tipo = 'corretora';
    else if (r?.category === 'queima') tipo = 'queima';
    else if (r) tipo = 'outro';
    else if (carteirasProjeto.has(d.address)) tipo = 'projeto';
    return { ...d, pct: Number(d.pct) || 0, tipo, label: r?.label || null };
  });

  const soma = (f) => donos.filter(f).reduce((s, d) => s + d.pct, 0);
  return {
    donos,
    top10: soma(() => true),
    desconhecidos: soma((d) => d.tipo === 'desconhecido' || d.tipo === 'projeto'),
    maiorDesconhecido: donos.find((d) => d.tipo === 'desconhecido' || d.tipo === 'projeto') || null,
    em: token.top_holders_at,
  };
}

// ------------------------------------------------------------
// 8) Idade do token
// ------------------------------------------------------------
export function idadeEmDias(token) {
  if (!token.created_on_chain_at) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(token.created_on_chain_at).getTime()) / 86400000));
}

// ------------------------------------------------------------
// SINAIS DE ATENCAO
// Cada item devolve { codigo, nivel, fato, valores }
// nivel: 'alto' | 'medio' | 'info'
// ------------------------------------------------------------
export function gerarAlertas({ token, transferencias, carteirasProjeto, conhecidos, liquidez, donos, fuso }) {
  const alertas = [];
  const ultimas24h = transferencias.filter((t) => dentroDe(t.ts, 24));

  // Contrato ainda pode emitir ou congelar (FATO, lido do contrato)
  if (token.chain === 'solana') {
    if (token.mint_authority) alertas.push({ codigo: 'emissao_aberta', nivel: 'alto', fato: true, valores: {} });
    if (token.freeze_authority) alertas.push({ codigo: 'congelamento_aberto', nivel: 'medio', fato: true, valores: {} });
  }

  // Carteira do projeto mandando volume para fora
  const saidasProjeto = ultimas24h.filter((t) => carteirasProjeto.has(t.from_addr) && valor(t) > 0);
  if (saidasProjeto.length) {
    const maior = saidasProjeto.reduce((a, b) => (valor(b) > valor(a) ? b : a));
    alertas.push({
      codigo: 'dev_vendendo', nivel: 'alto', fato: false,
      valores: {
        qtd: usdTxt(valor(maior)),
        pct: maior.supply_pct ? Number(maior.supply_pct).toFixed(2) : '—',
        destino: maior.actor_label || 'uma carteira não identificada',
      },
    });
  }

  // Liquidez
  if (liquidez.tipo === 'brusca') {
    alertas.push({
      codigo: 'liquidez_brusca', nivel: 'alto', fato: false,
      valores: { pct: Math.abs(liquidez.variacao).toFixed(0), maior: liquidez.maiorQueda.toFixed(0) },
    });
  } else if (liquidez.tipo === 'gradual') {
    alertas.push({
      codigo: 'liquidez_gradual', nivel: 'medio', fato: false,
      valores: { pct: Math.abs(liquidez.variacao).toFixed(0), quedas: liquidez.quedas },
    });
  }

  // Liquidez baixa demais para confiar no preco. Vale para qualquer token:
  // numa pool pequena, uma unica negociacao grande pode distorcer bastante
  // o "preco de tabela", inflando todos os valores em dolar da pagina.
  const liquidezAtual = liquidez.ultimo ?? liquidez.pontos?.[liquidez.pontos.length - 1]?.v ?? null;
  if (liquidezAtual !== null && liquidezAtual < LIMITE_LIQUIDEZ_CONFIAVEL_USD) {
    alertas.push({
      codigo: 'liquidez_baixa_confianca', nivel: 'alto', fato: true,
      valores: { liquidez: usdTxt(liquidezAtual) },
    });
  }

  // Fluxo para corretoras nas ultimas 24h
  const paraCorretora = ultimas24h.filter((t) => t.actor === 'corretora' && t.kind === 'venda').reduce((s, t) => s + valor(t), 0);
  const deCorretora = ultimas24h.filter((t) => t.actor === 'corretora' && t.kind === 'compra').reduce((s, t) => s + valor(t), 0);
  if (paraCorretora > LIMITE_BALEIA_USD && paraCorretora > deCorretora * 1.5) {
    alertas.push({ codigo: 'saida_para_corretora', nivel: 'medio', fato: false, valores: { qtd: usdTxt(paraCorretora) } });
  }
  if (deCorretora > LIMITE_BALEIA_USD && deCorretora > paraCorretora * 1.5) {
    alertas.push({ codigo: 'entrada_de_corretora', nivel: 'info', fato: false, valores: { qtd: usdTxt(deCorretora) } });
  }

  // Rajada de saidas grandes em menos de 10 minutos
  const grandes = ultimas24h.filter((t) => valor(t) >= LIMITE_BALEIA_USD).sort((a, b) => new Date(a.ts) - new Date(b.ts));
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

  // Negociacao artificial: mesma quantidade repetida
  const repetidos = detectarValoresRepetidos(transferencias, conhecidos);
  if (repetidos) {
    alertas.push({
      codigo: 'valores_repetidos',
      nivel: repetidos.pctVolume >= 30 ? 'alto' : 'medio',
      fato: false,
      valores: {
        n: repetidos.n,
        valor: `$${repetidos.valorCada < 100 ? repetidos.valorCada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(repetidos.valorCada).toLocaleString('pt-BR')}`,
        carteiras: repetidos.carteiras,
        horas: repetidos.horas,
        pct: repetidos.pctVolume < 1 ? '<1' : repetidos.pctVolume.toFixed(0),
      },
      endereco: repetidos.exemplo,
    });
  }

  // Negociacao artificial: a mesma carteira comprando e vendendo
  const vaiEVolta = detectarVaiEVolta(transferencias, conhecidos);
  if (vaiEVolta) {
    alertas.push({
      codigo: 'vai_e_volta', nivel: 'medio', fato: false,
      valores: { compras: vaiEVolta.compras, vendas: vaiEVolta.vendas, qtd: usdTxt(vaiEVolta.usd), carteiras: vaiEVolta.carteiras },
      endereco: vaiEVolta.endereco,
    });
  }

  // Carteiras irmas
  const irmas = detectarCarteirasIrmas(transferencias, conhecidos, carteirasProjeto);
  if (irmas) {
    alertas.push({
      codigo: irmas.doProjeto ? 'irmas_projeto' : 'carteiras_irmas',
      nivel: irmas.doProjeto ? 'alto' : 'medio',
      fato: false,
      valores: { n: irmas.nDestinos, venderam: irmas.nVenderam, qtd: usdTxt(irmas.usdVendido) },
      endereco: irmas.origem,
    });
  }

  // Mesmo horario, varios dias
  for (const h of detectarHorarioRepetido(transferencias, conhecidos, fuso)) {
    alertas.push({
      codigo: h.kind === 'compra' ? 'horario_compra' : 'horario_venda',
      nivel: 'medio', fato: false,
      valores: { quem: h.nome || 'Uma mesma carteira não identificada', dias: h.dias, hora: h.hora, qtd: usdTxt(h.usd) },
      endereco: h.endereco,
    });
  }

  // Concentracao de movimento (quem MOVIMENTA)
  const porCarteira = new Map();
  for (const t of transferencias) {
    if (!valor(t) || !t.from_addr || conhecidos.has(t.from_addr)) continue;
    porCarteira.set(t.from_addr, (porCarteira.get(t.from_addr) || 0) + valor(t));
  }
  const totalMovimentado = [...porCarteira.values()].reduce((a, b) => a + b, 0);
  if (totalMovimentado > 0 && porCarteira.size >= 5) {
    const top5 = [...porCarteira.values()].sort((a, b) => b - a).slice(0, 5).reduce((a, b) => a + b, 0);
    const pct = (top5 / totalMovimentado) * 100;
    if (pct >= 70) alertas.push({ codigo: 'concentracao', nivel: 'medio', fato: false, valores: { n: 5, pct: pct.toFixed(0) } });
  }

  // Concentracao de posse (quem GUARDA)
  if (donos && donos.desconhecidos >= 40) {
    alertas.push({
      codigo: 'donos_concentrados',
      nivel: donos.desconhecidos >= 60 ? 'alto' : 'medio',
      fato: false,
      valores: { pct: donos.desconhecidos.toFixed(0) },
    });
  }

  // Token recem-criado (FATO: data do primeiro par de negociacao)
  const idade = idadeEmDias(token);
  if (idade !== null && idade < 30) {
    alertas.push({ codigo: 'token_novo', nivel: idade < 7 ? 'alto' : 'medio', fato: true, valores: { dias: idade } });
  }

  const ordem = { alto: 0, medio: 1, info: 2 };
  return alertas.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

// ------------------------------------------------------------
// TERMOMETRO: resume os sinais num nivel so
// ------------------------------------------------------------
export function termometro(alertas) {
  const altos = alertas.filter((a) => a.nivel === 'alto').length;
  const medios = alertas.filter((a) => a.nivel === 'medio').length;
  const pontos = altos * 3 + medios * 2;
  let nivel = 'baixo';
  if (altos >= 2 || pontos >= 8) nivel = 'alto';
  else if (altos >= 1 || pontos >= 4) nivel = 'medio';
  return { nivel, altos, medios };
}
