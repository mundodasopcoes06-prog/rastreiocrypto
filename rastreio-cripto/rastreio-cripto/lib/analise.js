// ============================================================
// O CEREBRO DO SITE  (versao "rastreio", sem depender de preco)
//
// Mudanca principal desta versao:
//   - NENHUM sinal depende mais de valor em dolar.
//   - Toda magnitude e medida de forma exata e sem preco:
//       * % do total emitido (supply_pct)  -> vem exato da blockchain
//       * participacao na QUANTIDADE movimentada na janela
//       * contagem de operacoes / carteiras / dias / horario
//   - Preco continua existindo so como referencia no topo da pagina,
//     nunca entra em conta de sinal.
//
// Regra que nunca muda:
//   - endereco na lista publica  -> confidence 'confirmado' (FATO)
//   - qualquer leitura de padrao -> confidence 'indicio'
// ============================================================

// A partir de quanto uma carteira/movimento e "grande", SEM usar preco.
export const LIMITE_BALEIA_PCT_SUPPLY = 0.1; // 0,1% do total emitido
// Quando o total emitido nao e conhecido, um movimento e "grande" se
// representar pelo menos esta fatia da QUANTIDADE movimentada na janela.
export const LIMITE_BALEIA_PCT_JANELA = 2;   // 2% do que se moveu na janela

// Liquidez baixa: preco de tabela facil de distorcer / rug mais provavel.
export const LIMITE_LIQUIDEZ_CONFIAVEL_USD = 50000;

// ------------------------------------------------------------
// Utilidades sem preco
// ------------------------------------------------------------
const qtd = (t) => Number(t.amount) || 0;            // quantidade de token (exata)
const pctSup = (t) => Number(t.supply_pct) || 0;     // % do supply (exata)
const eNegocio = (t) => t.kind === 'compra' || t.kind === 'venda';
const eNegociacaoDex = (t) => t.actor === 'dex' && eNegocio(t);

function dentroDe(ts, horas) {
  return Date.now() - new Date(ts).getTime() <= horas * 3600 * 1000;
}

/** "Grande" sem preco: por % do supply; se supply desconhecido, por peso relativo. */
function eGrande(t, totalJanela = 0) {
  if (pctSup(t) >= LIMITE_BALEIA_PCT_SUPPLY) return true;
  if (!Number(t.supply_pct) && totalJanela > 0) {
    return (qtd(t) / totalJanela) * 100 >= LIMITE_BALEIA_PCT_JANELA;
  }
  return false;
}

/** Texto de magnitude sem dolar: usa % do supply quando existe. */
function magTxt(t) {
  const p = pctSup(t);
  if (p > 0) return `${p < 0.01 ? '<0,01' : p.toFixed(2)}% do total`;
  return `${Math.round(qtd(t)).toLocaleString('pt-BR')} tokens`;
}

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
// Classificacao de uma transferencia (identidade = fato; padrao = indicio)
// ------------------------------------------------------------
export function classificar(transferencia, { rotulos, carteirasProjeto, preco, supply }) {
  const { chain, from_addr, to_addr, amount } = transferencia;
  const de = from_addr ? rotulos.get(`${chain}:${from_addr}`) : null;
  const para = to_addr ? rotulos.get(`${chain}:${to_addr}`) : null;
  const programaDex = (transferencia.programas || [])
    .map((p) => rotulos.get(`${chain}:${p}`)).find((r) => r && r.category === 'dex');

  // usd_value fica só como referencia opcional; nunca alimenta sinal.
  const usd = preco ? amount * preco : null;
  const pctSupply = supply ? (amount / supply) * 100 : null;

  let kind = 'transferencia', actor = 'desconhecido', actor_label = null,
      confidence = 'indicio', counterparty = to_addr;

  if (para?.category === 'queima') {
    kind = 'transferencia'; actor = 'queima'; actor_label = para.label; confidence = 'confirmado';
  } else if (de?.category === 'dex') {
    kind = 'compra'; actor = 'dex'; actor_label = de.label; confidence = de.indicio ? 'indicio' : 'confirmado'; counterparty = to_addr;
  } else if (para?.category === 'dex') {
    kind = 'venda'; actor = 'dex'; actor_label = para.label; confidence = para.indicio ? 'indicio' : 'confirmado'; counterparty = from_addr;
  } else if (de?.category === 'corretora') {
    kind = 'compra'; actor = 'corretora'; actor_label = de.label; confidence = 'confirmado'; counterparty = to_addr;
  } else if (para?.category === 'corretora') {
    kind = 'venda'; actor = 'corretora'; actor_label = para.label; confidence = 'confirmado'; counterparty = from_addr;
  } else if (programaDex) {
    actor = 'dex'; actor_label = programaDex.label; confidence = 'indicio';
    const ini = transferencia.iniciador;
    if (transferencia.dica_tipo === 'SWAP' && ini && from_addr === ini) { kind = 'venda'; counterparty = from_addr; }
    else if (transferencia.dica_tipo === 'SWAP' && ini && to_addr === ini) { kind = 'compra'; counterparty = to_addr; }
    else kind = 'transferencia';
  } else if (carteirasProjeto.has(from_addr) || carteirasProjeto.has(to_addr)) {
    actor = 'projeto'; confidence = 'indicio';
    kind = carteirasProjeto.has(from_addr) ? 'venda' : 'compra';
    counterparty = carteirasProjeto.has(from_addr) ? to_addr : from_addr;
  } else {
    // "Baleia" agora SEM preco: so por % do supply.
    actor = (pctSupply !== null && pctSupply >= LIMITE_BALEIA_PCT_SUPPLY) ? 'baleia' : 'desconhecido';
    confidence = 'indicio';
  }

  return { ...transferencia, usd_value: usd, supply_pct: pctSupply, kind, actor, actor_label, counterparty, confidence };
}

export function detectarCarteirasProjeto(token, transferencias) {
  const raiz = new Set(
    [token.creator, token.mint_authority, token.freeze_authority].filter(Boolean)
      .map((a) => (token.chain === 'ethereum' ? a.toLowerCase() : a))
  );
  const encontradas = new Map();
  for (const a of raiz) encontradas.set(a, 'criou o contrato ou controla a emissao');
  const ordenadas = [...transferencias].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  for (const t of ordenadas) {
    if (t.from_addr && raiz.has(t.from_addr) && t.to_addr && !encontradas.has(t.to_addr)) {
      encontradas.set(t.to_addr, 'recebeu tokens direto da carteira que controla o contrato');
    }
  }
  return encontradas;
}

export function idadeEmDias(token) {
  if (!token.created_on_chain_at) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(token.created_on_chain_at).getTime()) / 86400000));
}

// ------------------------------------------------------------
// 1) O que as carteiras do projeto estao fazendo  (em % do supply + contagem)
// ------------------------------------------------------------
function acoesVazias() {
  return { venderam: 0, paraCorretora: 0, transferiram: 0, queimaram: 0,
           compraram: 0, deCorretora: 0, receberam: 0, n: 0 };
}
export function resumoProjeto(transferencias, carteirasProjeto) {
  const periodos = { '24h': acoesVazias(), '7d': acoesVazias(), '15d': acoesVazias() };
  const horas = { '24h': 24, '7d': 168, '15d': 360 };
  let ultimo = null;
  for (const t of transferencias) {
    const saiu = carteirasProjeto.has(t.from_addr);
    const entrou = carteirasProjeto.has(t.to_addr);
    if (!saiu && !entrou) continue;
    if (saiu && entrou) continue;
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
      if (dentroDe(t.ts, horas[k])) { periodos[k][acao] += pctSup(t); periodos[k].n++; }
    }
  }
  return { periodos, ultimo, nCarteiras: carteirasProjeto.size };
}

// ------------------------------------------------------------
// 2) Raio-x: quem move o token, por tipo de carteira  (contagem + % do supply)
//    Sem dolar: mede numero de operacoes e soma de % do supply.
// ------------------------------------------------------------
export const CATEGORIAS = ['corretoras', 'projeto', 'grandes', 'demais'];
export function categoriaDe(t, carteirasProjeto, totalJanela) {
  if (t.actor === 'corretora') return 'corretoras';
  if (t.actor === 'projeto' || (t.counterparty && carteirasProjeto.has(t.counterparty))) return 'projeto';
  return eGrande(t, totalJanela) ? 'grandes' : 'demais';
}
export function raioX(transferencias, horas, carteirasProjeto) {
  const janela = transferencias.filter((t) => eNegocio(t) && dentroDe(t.ts, horas)
    && (t.actor === 'dex' || t.actor === 'corretora'));
  const totalJanela = janela.reduce((s, t) => s + qtd(t), 0);
  const r = {};
  for (const c of CATEGORIAS) r[c] = { entram: 0, saem: 0, nEntram: 0, nSaem: 0 };
  for (const t of janela) {
    const c = t.actor === 'corretora' ? 'corretoras' : categoriaDe(t, carteirasProjeto, totalJanela);
    // "entram" = compra/saque (tokens vindo para a mao de alguem)
    // "saem"   = venda/deposito (tokens saindo para a pool/corretora)
    if (t.kind === 'compra') { r[c].entram += pctSup(t); r[c].nEntram++; }
    else { r[c].saem += pctSup(t); r[c].nSaem++; }
  }
  return r;
}

// ------------------------------------------------------------
// 3) Negociacao artificial (tudo por contagem e % da QUANTIDADE)
// ------------------------------------------------------------
export function detectarValoresRepetidos(transferencias, conhecidos) {
  const semana = transferencias.filter((t) => eNegociacaoDex(t) && dentroDe(t.ts, 168) && qtd(t) > 0);
  const quantidadeSemana = semana.reduce((s, t) => s + qtd(t), 0);
  const grupos = new Map();
  for (const t of semana) {
    const chave = Number(t.amount).toPrecision(3); // mesma quantidade ~0,5%
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(t);
  }
  let melhor = null;
  for (const lista of grupos.values()) {
    if (lista.length < 6) continue;
    const carteiras = new Set(lista.map((t) => t.counterparty).filter((a) => a && !conhecidos.has(a)));
    if (carteiras.size === 0) continue;
    if (carteiras.size > Math.max(2, Math.floor(lista.length / 3))) continue;
    if (!melhor || lista.length > melhor.lista.length) melhor = { lista, carteiras };
  }
  if (!melhor) return null;
  const { lista, carteiras } = melhor;
  const tempos = lista.map((t) => new Date(t.ts).getTime());
  const totalQtd = lista.reduce((s, t) => s + qtd(t), 0);
  return {
    n: lista.length,
    carteiras: carteiras.size,
    compras: lista.filter((t) => t.kind === 'compra').length,
    vendas: lista.filter((t) => t.kind === 'venda').length,
    horas: Math.max(1, Math.round((Math.max(...tempos) - Math.min(...tempos)) / 3600000)),
    pctVolume: quantidadeSemana > 0 ? (totalQtd / quantidadeSemana) * 100 : 0, // % da quantidade
    exemplo: [...carteiras][0],
  };
}

export function detectarVaiEVolta(transferencias, conhecidos) {
  const porCarteira = new Map();
  for (const t of transferencias) {
    if (!eNegociacaoDex(t) || !dentroDe(t.ts, 168)) continue;
    const a = t.counterparty;
    if (!a || conhecidos.has(a)) continue;
    if (!porCarteira.has(a)) porCarteira.set(a, { compras: 0, vendas: 0 });
    const c = porCarteira.get(a);
    if (t.kind === 'compra') c.compras++; else c.vendas++;
  }
  const suspeitas = [...porCarteira.entries()]
    .filter(([, c]) => c.compras >= 3 && c.vendas >= 3)
    .sort((a, b) => (b[1].compras + b[1].vendas) - (a[1].compras + a[1].vendas));
  if (!suspeitas.length) return null;
  const [endereco, c] = suspeitas[0];
  return { carteiras: suspeitas.length, endereco, compras: c.compras, vendas: c.vendas };
}

export function detectarCarteirasIrmas(transferencias, conhecidos, carteirasProjeto) {
  const destinos = new Map();
  for (const t of transferencias) {
    if (['dex', 'corretora', 'queima'].includes(t.actor)) continue;
    if (!t.from_addr || !t.to_addr || conhecidos.has(t.from_addr) || conhecidos.has(t.to_addr)) continue;
    if (!destinos.has(t.from_addr)) destinos.set(t.from_addr, new Set());
    destinos.get(t.from_addr).add(t.to_addr);
  }
  const venderam = new Map(); // carteira -> nº de vendas
  for (const t of transferencias) {
    if (!eNegociacaoDex(t) || t.kind !== 'venda' || !t.counterparty) continue;
    venderam.set(t.counterparty, (venderam.get(t.counterparty) || 0) + 1);
  }
  let melhor = null;
  for (const [origem, set] of destinos) {
    if (set.size < 4) continue;
    const venderamLista = [...set].filter((d) => venderam.has(d));
    if (venderamLista.length < 2) continue;
    if (!melhor || venderamLista.length > melhor.nVenderam) {
      melhor = { origem, nDestinos: set.size, nVenderam: venderamLista.length, doProjeto: carteirasProjeto.has(origem) };
    }
  }
  return melhor;
}

export function detectarHorarioRepetido(transferencias, conhecidos, fuso) {
  const grupos = new Map();
  for (const t of transferencias) {
    if (!eNegociacaoDex(t)) continue;
    if (!t.counterparty || conhecidos.has(t.counterparty)) continue;
    const chave = `w:${t.counterparty}:${t.kind}`;
    if (!grupos.has(chave)) grupos.set(chave, { endereco: t.counterparty, kind: t.kind, eventos: [] });
    grupos.get(chave).eventos.push(horaNoFuso(t.ts, fuso));
  }
  const achados = [];
  for (const g of grupos.values()) {
    const diasAtivos = new Set(g.eventos.map((e) => e.dia));
    const minimo = 4;
    if (diasAtivos.size < minimo) continue;
    let melhor = null;
    for (const centro of g.eventos) {
      const batem = g.eventos.filter((e) => distanciaMinutos(e.minuto, centro.minuto) <= 30);
      const dias = new Set(batem.map((e) => e.dia));
      if (!melhor || dias.size > melhor.dias) melhor = { dias: dias.size, minuto: centro.minuto, batem };
    }
    if (melhor.dias < minimo || melhor.batem.length / g.eventos.length < 0.6) continue;
    const m = (Math.round(melhor.minuto / 15) * 15) % 1440;
    achados.push({
      endereco: g.endereco, kind: g.kind, dias: melhor.dias,
      hora: `${String(Math.floor(m / 60)).padStart(2, '0')}h${String(m % 60).padStart(2, '0')}`,
    });
  }
  return achados.sort((a, b) => b.dias - a.dias).slice(0, 3);
}

// ------------------------------------------------------------
// 4) Liquidez ao longo do tempo (mantida: risco real de rug)
// ------------------------------------------------------------
export function analisarLiquidez(snapshots) {
  const pts = snapshots.filter((s) => Number(s.liquidity_usd) > 0)
    .map((s) => ({ ts: s.ts, v: Number(s.liquidity_usd) }))
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));
  if (pts.length < 2) return { tipo: 'poucos', pontos: pts, leituras: pts.length };
  const primeiro = pts[0].v, ultimo = pts[pts.length - 1].v;
  const variacao = ((ultimo - primeiro) / primeiro) * 100;
  let maiorQueda = 0, quedas = 0;
  for (let i = 1; i < pts.length; i++) {
    const q = ((pts[i - 1].v - pts[i].v) / pts[i - 1].v) * 100;
    if (q > maiorQueda) maiorQueda = q;
    if (q > 1) quedas++;
  }
  let tipo = 'estavel';
  if (variacao <= -20) tipo = maiorQueda >= 0.6 * Math.abs(variacao) ? 'brusca' : 'gradual';
  else if (variacao >= 20) tipo = 'subiu';
  const passo = Math.max(1, Math.ceil(pts.length / 60));
  const pontos = pts.filter((_, i) => i % passo === 0 || i === pts.length - 1);
  return { tipo, pontos, leituras: pts.length, primeiro, ultimo, variacao, maiorQueda, quedas,
           desde: pts[0].ts, ate: pts[pts.length - 1].ts };
}

// ------------------------------------------------------------
// 5) Maiores donos (mantido: % de posse, sem preco)
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
    donos, top10: soma(() => true),
    desconhecidos: soma((d) => d.tipo === 'desconhecido' || d.tipo === 'projeto'),
    maiorDesconhecido: donos.find((d) => d.tipo === 'desconhecido' || d.tipo === 'projeto') || null,
    em: token.top_holders_at,
  };
}

// ------------------------------------------------------------
// SINAIS DE ATENCAO  (nenhum usa preco)
// Cada item: { codigo, nivel, fato, valores, endereco? }
// nivel: 'alto' | 'medio' | 'info'
// ------------------------------------------------------------
export function gerarAlertas({ token, transferencias, carteirasProjeto, conhecidos, liquidez, donos, fuso }) {
  const alertas = [];
  const ultimas24h = transferencias.filter((t) => dentroDe(t.ts, 24));
  const totalJanela24 = ultimas24h.reduce((s, t) => s + qtd(t), 0);

  if (token.chain === 'solana') {
    if (token.mint_authority) alertas.push({ codigo: 'emissao_aberta', nivel: 'alto', fato: true, valores: {} });
    if (token.freeze_authority) alertas.push({ codigo: 'congelamento_aberto', nivel: 'medio', fato: true, valores: {} });
  }

  // Carteira do projeto mandando volume para fora (em % do supply)
  const saidasProjeto = ultimas24h.filter((t) => carteirasProjeto.has(t.from_addr) && qtd(t) > 0);
  if (saidasProjeto.length) {
    const maior = saidasProjeto.reduce((a, b) => (pctSup(b) > pctSup(a) ? b : a));
    alertas.push({
      codigo: 'dev_vendendo', nivel: 'alto', fato: false,
      valores: { pct: pctSup(maior) ? pctSup(maior).toFixed(2) : '—', n: saidasProjeto.length,
                 destino: maior.actor_label || 'uma carteira não identificada' },
    });
  }

  // Liquidez
  if (liquidez.tipo === 'brusca') {
    alertas.push({ codigo: 'liquidez_brusca', nivel: 'alto', fato: false,
      valores: { pct: Math.abs(liquidez.variacao).toFixed(0), maior: liquidez.maiorQueda.toFixed(0) } });
  } else if (liquidez.tipo === 'gradual') {
    alertas.push({ codigo: 'liquidez_gradual', nivel: 'medio', fato: false,
      valores: { pct: Math.abs(liquidez.variacao).toFixed(0), quedas: liquidez.quedas } });
  }
  const liquidezAtual = liquidez.ultimo ?? liquidez.pontos?.[liquidez.pontos.length - 1]?.v ?? null;
  if (liquidezAtual !== null && liquidezAtual < LIMITE_LIQUIDEZ_CONFIAVEL_USD) {
    alertas.push({ codigo: 'liquidez_baixa_confianca', nivel: 'medio', fato: true,
      valores: { liquidez: `$${Math.round(liquidezAtual).toLocaleString('pt-BR')}` } });
  }

  // Fluxo para/de corretoras nas 24h (contagem + % do supply somado)
  const paraC = ultimas24h.filter((t) => t.actor === 'corretora' && t.kind === 'venda');
  const deC = ultimas24h.filter((t) => t.actor === 'corretora' && t.kind === 'compra');
  const somaPct = (arr) => arr.reduce((s, t) => s + pctSup(t), 0);
  if (paraC.length >= 3 && paraC.length > deC.length * 1.5) {
    alertas.push({ codigo: 'saida_para_corretora', nivel: 'medio', fato: false,
      valores: { n: paraC.length, pct: somaPct(paraC) ? somaPct(paraC).toFixed(2) : '—' } });
  }
  if (deC.length >= 3 && deC.length > paraC.length * 1.5) {
    alertas.push({ codigo: 'entrada_de_corretora', nivel: 'info', fato: false,
      valores: { n: deC.length, pct: somaPct(deC) ? somaPct(deC).toFixed(2) : '—' } });
  }

  // Rajada de saidas grandes em <10min (grande = % supply, sem preco)
  const grandes = ultimas24h.filter((t) => eGrande(t, totalJanela24))
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));
  for (let i = 0; i < grandes.length; i++) {
    const inicio = new Date(grandes[i].ts).getTime();
    let n = 1;
    for (let j = i + 1; j < grandes.length; j++) {
      if (new Date(grandes[j].ts).getTime() - inicio <= 10 * 60 * 1000) n++; else break;
    }
    if (n >= 5) { alertas.push({ codigo: 'rajada_saida', nivel: 'alto', fato: false, valores: { n } }); break; }
  }

  const repetidos = detectarValoresRepetidos(transferencias, conhecidos);
  if (repetidos) {
    alertas.push({ codigo: 'valores_repetidos',
      nivel: repetidos.pctVolume >= 30 ? 'alto' : 'medio', fato: false,
      valores: { n: repetidos.n, carteiras: repetidos.carteiras, horas: repetidos.horas,
                 pct: repetidos.pctVolume < 1 ? '<1' : repetidos.pctVolume.toFixed(0) },
      endereco: repetidos.exemplo });
  }

  const vaiEVolta = detectarVaiEVolta(transferencias, conhecidos);
  if (vaiEVolta) {
    alertas.push({ codigo: 'vai_e_volta', nivel: 'medio', fato: false,
      valores: { compras: vaiEVolta.compras, vendas: vaiEVolta.vendas, carteiras: vaiEVolta.carteiras },
      endereco: vaiEVolta.endereco });
  }

  const irmas = detectarCarteirasIrmas(transferencias, conhecidos, carteirasProjeto);
  if (irmas) {
    alertas.push({ codigo: irmas.doProjeto ? 'irmas_projeto' : 'carteiras_irmas',
      nivel: irmas.doProjeto ? 'alto' : 'medio', fato: false,
      valores: { n: irmas.nDestinos, venderam: irmas.nVenderam }, endereco: irmas.origem });
  }

  for (const h of detectarHorarioRepetido(transferencias, conhecidos, fuso)) {
    alertas.push({ codigo: h.kind === 'compra' ? 'horario_compra' : 'horario_venda',
      nivel: 'medio', fato: false,
      valores: { quem: 'Uma mesma carteira não identificada', dias: h.dias, hora: h.hora },
      endereco: h.endereco });
  }

  // Concentracao de movimento (quem MOVIMENTA) - por QUANTIDADE
  const porCarteira = new Map();
  for (const t of transferencias) {
    if (!qtd(t) || !t.from_addr || conhecidos.has(t.from_addr)) continue;
    porCarteira.set(t.from_addr, (porCarteira.get(t.from_addr) || 0) + qtd(t));
  }
  const totalMov = [...porCarteira.values()].reduce((a, b) => a + b, 0);
  if (totalMov > 0 && porCarteira.size >= 5) {
    const top5 = [...porCarteira.values()].sort((a, b) => b - a).slice(0, 5).reduce((a, b) => a + b, 0);
    const pct = (top5 / totalMov) * 100;
    if (pct >= 70) alertas.push({ codigo: 'concentracao', nivel: 'medio', fato: false, valores: { n: 5, pct: pct.toFixed(0) } });
  }

  if (donos && donos.desconhecidos >= 40) {
    alertas.push({ codigo: 'donos_concentrados',
      nivel: donos.desconhecidos >= 60 ? 'alto' : 'medio', fato: false,
      valores: { pct: donos.desconhecidos.toFixed(0) } });
  }

  const idade = idadeEmDias(token);
  if (idade !== null && idade < 30) {
    alertas.push({ codigo: 'token_novo', nivel: idade < 7 ? 'alto' : 'medio', fato: true, valores: { dias: idade } });
  }

  const ordem = { alto: 0, medio: 1, info: 2 };
  return alertas.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

export function termometro(alertas) {
  const altos = alertas.filter((a) => a.nivel === 'alto').length;
  const medios = alertas.filter((a) => a.nivel === 'medio').length;
  const pontos = altos * 3 + medios * 2;
  let nivel = 'baixo';
  if (altos >= 2 || pontos >= 8) nivel = 'alto';
  else if (altos >= 1 || pontos >= 4) nivel = 'medio';
  return { nivel, altos, medios };
}
