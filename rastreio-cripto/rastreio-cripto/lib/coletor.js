// ============================================================
// COLETOR
// Le a blockchain, classifica o que encontrou e grava no Supabase.
// E chamado pela leitura continua (a cada 10 minutos, /api/indexar) e
// tambem quando alguem abre a pagina de um token.
// ============================================================

import { db } from './supabase';
import { criadorDoContrato, supplyEthereum } from './ethereum';
import { dadosDoMint, metadadosSolana, CREDITOS_POR_PAGINA_SOL } from './solana';
import { situacaoDoToken } from './precos';
import { classificar, detectarCarteirasProjeto, categoriasDoMovimento } from './analise';
import { lerMovimentosEthereum, lerMovimentosSolana, JANELA_MS } from './indexador';

// Teto diario de creditos da Helius gasto na leitura continua da Solana.
// O plano gratuito tem 1 milhao por mes; 15 mil por dia deixa folga para
// o resto do site (dados do token, maiores donos).
const LIMITE_DIARIO_HELIUS = 15000;
import { maioresDonos } from './donos';
import { lerCorretoras } from './cex';
import { precoGeckoTerminal } from './geckoterminal';
import { validarPreco, validarLiquidez } from './validacao';

function nomePool(dex) {
  if (!dex || dex === 'pool') return 'Pool de negociação';
  return `Pool ${dex.charAt(0).toUpperCase()}${dex.slice(1)}`;
}

export function normalizarEndereco(chain, addr) {
  if (!addr) return '';
  return chain === 'ethereum' ? addr.toLowerCase() : addr;
}

/** Carrega a lista de enderecos conhecidos como um Map rapido de consultar. */
export async function carregarRotulos() {
  const { data, error } = await db().from('address_labels').select('*');
  if (error) throw error;
  const mapa = new Map();
  for (const r of data || []) {
    mapa.set(`${r.chain}:${r.address}`, { label: r.label, category: r.category });
  }
  return mapa;
}

/**
 * Busca o token no banco; se nao existir, cria.
 * Usa upsert em vez de "select, depois insert" porque duas requisicoes
 * podem chegar ao mesmo tempo (ex: o navegador pre-carregando varios
 * resultados da busca de uma vez). Com upsert, a segunda tentativa e
 * ignorada em silencio em vez de dar erro de duplicidade.
 */
export async function garantirToken(chain, address) {
  const addr = normalizarEndereco(chain, address);
  const s = db();

  const { error: erroCriacao } = await s
    .from('tokens')
    .upsert({ chain, address: addr }, { onConflict: 'chain,address', ignoreDuplicates: true });

  if (erroCriacao) throw erroCriacao;

  const { data, error } = await s
    .from('tokens').select('*').eq('chain', chain).eq('address', addr).single();

  if (error) throw error;
  return data;
}

/**
 * Faz a leitura completa de um token.
 * Devolve quantos movimentos novos entraram.
 */
export async function coletar(chain, address, { prazoMs = 35000 } = {}) {
  const prazo = Date.now() + prazoMs;
  const s = db();
  const addr = normalizarEndereco(chain, address);
  const token = await garantirToken(chain, addr);

  // ---- 1. Preco, liquidez e volume: TRES fontes, em paralelo ----
  //   DexScreener (on-chain) + GeckoTerminal (on-chain, independente)
  //   + corretoras via CoinGecko (atualizada no maximo a cada 30 min).
  const cexVelho =
    !token.cex_data_at || Date.now() - new Date(token.cex_data_at).getTime() > 30 * 60 * 1000;
  const [situacao, gecko, cexNovo] = await Promise.all([
    situacaoDoToken(chain, addr),
    precoGeckoTerminal(chain, addr),
    cexVelho ? lerCorretoras(chain, addr, token.symbol || null) : Promise.resolve(null),
  ]);
  const cex = cexNovo || token.cex_data || null;

  // Na primeira leitura o simbolo ainda nao era conhecido quando as
  // corretoras foram consultadas. Refazemos a checagem agora (evita que
  // um token "empacotado", como o sPENDLE, use o preco do token original).
  const simboloOnChain = situacao?.simbolo || gecko?.simbolo || token.symbol || null;
  if (cex?.simboloCoinGecko && simboloOnChain) {
    cex.simboloDivergente = cex.simboloCoinGecko.toUpperCase() !== simboloOnChain.toUpperCase();
  }

  // ---- 2. Dados do proprio contrato ----
  const atualizacaoToken = {
    last_ingest_at: new Date().toISOString(),
  };
  if (situacao?.simbolo) atualizacaoToken.symbol = situacao.simbolo;
  if (situacao?.nome) atualizacaoToken.name = situacao.nome;
  // Guarda a data do par de negociacao mais antigo que ja vimos.
  if (
    situacao?.criado_em &&
    (!token.created_on_chain_at || new Date(situacao.criado_em) < new Date(token.created_on_chain_at))
  ) {
    atualizacaoToken.created_on_chain_at = situacao.criado_em;
  }

  let casas = token.decimals ?? 18;

  if (chain === 'ethereum') {
    if (!token.creator) {
      const { criador } = await criadorDoContrato(addr);
      if (criador) atualizacaoToken.creator = criador;
    }
  } else {
    const mint = await dadosDoMint(addr);
    if (mint.decimals !== undefined) { casas = mint.decimals; atualizacaoToken.decimals = mint.decimals; }
    if (mint.total_supply) atualizacaoToken.total_supply = mint.total_supply;
    // Guardamos mesmo quando e null: null significa "autoridade renunciada".
    atualizacaoToken.mint_authority = mint.mint_authority ?? null;
    atualizacaoToken.freeze_authority = mint.freeze_authority ?? null;

    if (!atualizacaoToken.symbol) {
      const meta = await metadadosSolana(addr);
      if (meta.simbolo) atualizacaoToken.symbol = meta.simbolo;
      if (meta.nome) atualizacaoToken.name = meta.nome;
    }
  }

  // ---- 3. Movimentos: continua de onde parou, sem buracos ----
  const limite = Date.now() - JANELA_MS;
  let leitura;
  if (chain === 'ethereum') {
    if (!token.total_supply) {
      const sup = await supplyEthereum(addr, casas);
      if (sup) atualizacaoToken.total_supply = sup;
    }
    // Reserva ~10s no fim para classificar e gravar.
    leitura = await lerMovimentosEthereum(addr, token, { prazo: prazo - 10000 });
    const brutasEth = leitura.brutas;
    if (brutasEth.length) {
      casas = brutasEth[0].decimals ?? casas;
      atualizacaoToken.decimals = casas;
      if (!atualizacaoToken.symbol && brutasEth[0].simbolo) atualizacaoToken.symbol = brutasEth[0].simbolo;
      if (!atualizacaoToken.name && brutasEth[0].nome) atualizacaoToken.name = brutasEth[0].nome;
    }
  } else {
    const reservar = async () => {
      const { data, error } = await s.rpc('reservar_creditos', {
        p_provedor: 'helius', p_qtd: CREDITOS_POR_PAGINA_SOL, p_limite: LIMITE_DIARIO_HELIUS,
      });
      return !error && data === true;
    };
    leitura = await lerMovimentosSolana(addr, token, { prazo: prazo - 10000, reservar });
  }
  Object.assign(atualizacaoToken, leitura.cursores, { ultima_indexacao: new Date().toISOString() });
  let brutas = leitura.brutas.filter((t) => new Date(t.ts).getTime() >= limite);

  // ---- 4. Pools de negociacao ----
  // Sem saber quais carteiras sao pools, nao da pra saber o que foi
  // compra e o que foi venda em tokens pequenos (que nao estao na lista fixa).
  const pools = new Map();
  for (const p of token.pools || []) pools.set(p.address, p);
  for (const p of situacao?.pools || []) {
    const a = normalizarEndereco(chain, p.address);
    pools.set(a, { address: a, dex: p.dex, origem: 'dexscreener' });
  }
  if (chain === 'solana') {
    // Numa troca (SWAP), quem pagou a taxa e o usuario.
    // Quem estava do outro lado do token e a pool (ou um intermediario dela).
    for (const t of brutas) {
      if (t.dica_tipo !== 'SWAP' || !t.iniciador) continue;
      for (const a of [t.from_addr, t.to_addr]) {
        if (a && a !== t.iniciador && !pools.has(a)) {
          pools.set(a, { address: a, dex: 'pool', origem: 'padrao' });
        }
      }
    }
  }
  atualizacaoToken.pools = [...pools.values()].slice(-60);

  // ---- 5. Classificacao ----
  const rotulos = await carregarRotulos();
  for (const p of atualizacaoToken.pools) {
    const chave = `${chain}:${p.address}`;
    if (rotulos.has(chave)) continue;
    rotulos.set(chave, {
      label: nomePool(p.dex),
      category: 'dex',
      // Pool vinda da DexScreener e fato; pool deduzida pelo padrao e indicio.
      indicio: p.origem === 'padrao',
    });
  }
  const supply = atualizacaoToken.total_supply ?? token.total_supply ?? null;
  // Nenhum preco e aceito sem ser conferido em outra fonte.
  // Roda AQUI (e nao logo apos buscar as fontes) porque so agora o total
  // emitido e conhecido -- inclusive na primeira leitura de um token novo,
  // que e justamente o caso mais arriscado.
  const liquidezValidada = validarLiquidez(situacao?.liquidity_usd ?? null, gecko?.liquidez ?? null);
  const validacao = validarPreco({
    dex: situacao?.price_usd ?? null,
    gecko: gecko?.preco ?? null,
    cex: cex?.precoReferencia
      ? { preco: cex.precoReferencia, confiavel: cex.listado && !cex.simboloDivergente }
      : null,
    anterior: token.preco_validado
      ? { preco: Number(token.preco_validado), em: token.preco_validado_at }
      : null,
    supply: Number(supply) || null,
    liquidez: liquidezValidada,
  });

  // So o preco VALIDADO entra nos calculos. Se nao deu pra confirmar,
  // fica null e os valores em dolar simplesmente nao sao mostrados.
  const preco = validacao.preco;

  const tokenAtualizado = { ...token, ...atualizacaoToken };
  const carteirasProjetoMapa = detectarCarteirasProjeto(tokenAtualizado, brutas);
  // Junta com as carteiras do projeto ja identificadas em leituras anteriores.
  // Sem isso, uma leitura sem movimento do criador "esquecia" quem e do projeto.
  const { data: carteirasSalvas } = await s
    .from('project_wallets').select('address, reason').eq('chain', chain).eq('token_address', addr);
  for (const c of carteirasSalvas || []) {
    if (!carteirasProjetoMapa.has(c.address)) carteirasProjetoMapa.set(c.address, c.reason);
  }
  // Pool, corretora e endereco de queima NUNCA sao carteira do projeto, mesmo
  // tendo recebido tokens do criador (e o que acontece quando o criador vende
  // na pool ou deposita na corretora). Sem isso, a pool virava "carteira do
  // projeto" e toda compra nela era contada como o projeto mandando tokens.
  for (const endereco of [...carteirasProjetoMapa.keys()]) {
    const r = rotulos.get(`${chain}:${endereco}`);
    if (r && r.category !== 'projeto') carteirasProjetoMapa.delete(endereco);
  }
  const carteirasProjeto = new Set(carteirasProjetoMapa.keys());

  const classificadas = brutas.map((t) =>
    classificar(
      {
        ...t,
        from_addr: normalizarEndereco(chain, t.from_addr),
        to_addr: normalizarEndereco(chain, t.to_addr),
      },
      { rotulos, carteirasProjeto, preco, supply }
    )
  );

  // ---- 6. Gravacao ----
  // Cada movimento e gravado junto com as categorias em que entra; o banco
  // soma nos totais na mesma operacao e ignora o que ja tinha sido gravado.
  let novos = 0;
  if (classificadas.length) {
    const linhas = classificadas.map((t) => ({
      chain: t.chain,
      token_address: t.token_address,
      tx_hash: t.tx_hash,
      ts: t.ts,
      from_addr: t.from_addr || '',
      to_addr: t.to_addr || '',
      amount: t.amount,
      usd_value: t.usd_value,
      kind: t.kind,
      actor: t.actor,
      actor_label: t.actor_label,
      counterparty: t.counterparty || '',
      confidence: t.confidence,
      supply_pct: t.supply_pct,
      categorias: categoriasDoMovimento(t, carteirasProjeto),
    }));
    for (let i = 0; i < linhas.length; i += 500) {
      const { data, error } = await s.rpc('registrar_movimentos', { p: linhas.slice(i, i + 500) });
      if (error) {
        // Sem gravar, os cursores NAO podem avancar: senao ficaria um buraco.
        console.error('Erro ao gravar movimentos:', error.message);
        for (const k of Object.keys(leitura.cursores)) delete atualizacaoToken[k];
        break;
      }
      novos += Number(data) || 0;
    }
  }

  // Carteiras do projeto que descobrimos
  if (carteirasProjetoMapa.size) {
    const linhas = [...carteirasProjetoMapa.entries()].map(([endereco, motivo]) => ({
      chain, token_address: addr, address: endereco, reason: motivo,
    }));
    await s.from('project_wallets').upsert(linhas, { onConflict: 'chain,token_address,address' });
  }

  // Resultado da validacao fica guardado no token.
  atualizacaoToken.preco_status = validacao.status;
  atualizacaoToken.preco_fontes = { ...validacao.fontes, salto: validacao.salto };
  if (validacao.preco) {
    atualizacaoToken.preco_validado = validacao.preco;
    atualizacaoToken.preco_validado_at = new Date().toISOString();
  }
  if (cexNovo) {
    atualizacaoToken.cex_data = cexNovo;
    atualizacaoToken.cex_data_at = new Date().toISOString();
  }

  // Fotografia de preco e liquidez (so com valores validados), no maximo a
  // cada 25 minutos, para o grafico de liquidez nao crescer sem controle.
  const fotoVelha =
    !token.ultimo_snapshot_at || Date.now() - new Date(token.ultimo_snapshot_at).getTime() > 25 * 60000;
  if ((situacao || gecko) && fotoVelha) {
    atualizacaoToken.ultimo_snapshot_at = new Date().toISOString();
    await s.from('token_snapshots').insert({
      chain, token_address: addr,
      price_usd: validacao.preco,
      liquidity_usd: liquidezValidada,
      volume_24h: situacao?.volume_24h ?? gecko?.volume24h ?? null,
      buys_24h: situacao?.buys_24h ?? null,
      sells_24h: situacao?.sells_24h ?? null,
    });
  }

  // Maiores donos: no maximo uma consulta a cada 30 minutos por token.
  const donosVelhos =
    !token.top_holders_at || Date.now() - new Date(token.top_holders_at).getTime() > 30 * 60 * 1000;
  if (donosVelhos) {
    const donos = await maioresDonos(chain, addr, supply);
    if (donos) {
      atualizacaoToken.top_holders = donos;
      atualizacaoToken.top_holders_at = new Date().toISOString();
    }
  }

  const { error: erroToken } = await s.from('tokens').update(atualizacaoToken).eq('chain', chain).eq('address', addr);
  if (erroToken) console.warn('Erro ao atualizar token:', erroToken.message);

  // Apaga o que passou do prazo (movimentos 7 dias; totais 16 dias).
  try { await s.rpc('limpar_antigos'); } catch (e) { /* nao pode travar a pagina */ }

  return { lidos: brutas.length, novos, cobertura_completa: !!atualizacaoToken.cobertura_completa };
}

/** Le tudo que a pagina do token precisa mostrar. */
export async function lerToken(chain, address) {
  const s = db();
  const addr = normalizarEndereco(chain, address);

  const { data: token } = await s
    .from('tokens').select('*').eq('chain', chain).eq('address', addr).maybeSingle();

  if (!token) return null;

  // Totais completos (24h, 7 dias, 15 dias e serie por dia): vem somados do
  // banco, entao nao dependem do limite de 1.000 linhas por consulta.
  // Movimentos um por um: os ate 5.000 mais recentes, para a lista e para os
  // sinais de padrao (buscados em partes de 1.000, que e o teto por consulta).
  const lerRecentes = async () => {
    const todas = [];
    for (let i = 0; i < 5000; i += 1000) {
      const { data, error } = await s.from('transfers').select('*')
        .eq('chain', chain).eq('token_address', addr)
        .order('ts', { ascending: false }).range(i, i + 999);
      if (error || !data?.length) break;
      todas.push(...data);
      if (data.length < 1000) break;
    }
    return todas;
  };

  const [transferencias, { data: agregados }, { data: snapshots }, { data: carteiras }, rotulos] = await Promise.all([
    lerRecentes(),
    s.rpc('ler_agregados', { p_chain: chain, p_token: addr }),
    s.from('token_snapshots').select('*')
      .eq('chain', chain).eq('token_address', addr)
      .order('ts', { ascending: false }).limit(200),
    s.from('project_wallets').select('address, reason')
      .eq('chain', chain).eq('token_address', addr),
    carregarRotulos(),
  ]);

  // Enderecos que ja sabemos o que sao (corretoras, pools, queima...).
  // Servem para nao confundir uma pool ou corretora com "uma pessoa".
  const conhecidos = new Map();
  for (const [chave, r] of rotulos) {
    if (chave.startsWith(`${chain}:`)) conhecidos.set(chave.slice(chain.length + 1), r);
  }
  for (const p of token.pools || []) {
    if (!conhecidos.has(p.address)) {
      conhecidos.set(p.address, { label: nomePool(p.dex), category: 'dex' });
    }
  }

  // Pool, corretora e queima nunca contam como carteira do projeto.
  const carteirasValidas = (carteiras || []).filter((c) => {
    const r = conhecidos.get(c.address);
    return !r || r.category === 'projeto';
  });

  // Valores em dolar sao recalculados AGORA, com o ultimo preco validado.
  // Assim, se um preco errado tiver sido gravado no passado, ele nao
  // contamina mais nada: o banco guarda so as quantidades de tokens.
  // So mostramos preco se a leitura MAIS RECENTE o aprovou. Qualquer outro
  // status (divergente, salto, mercado impossivel, sem preco) esconde os
  // valores em dolar -- nunca caimos de volta num preco antigo guardado.
  const STATUS_APROVADOS = ['confirmado', 'corrigido', 'fonte_unica'];
  const precoAtual = STATUS_APROVADOS.includes(token.preco_status)
    ? Number(token.preco_validado) || null
    : null;
  const supply = Number(token.total_supply) || null;
  const recalculadas = (transferencias || []).map((t) => ({
    ...t,
    usd_value: precoAtual ? Number(t.amount) * precoAtual : null,
    supply_pct: supply ? (Number(t.amount) / supply) * 100 : t.supply_pct,
  }));

  return {
    token: { ...token, preco_atual: precoAtual },
    transferencias: recalculadas,
    agregados: agregados || [],
    snapshots: snapshots || [],
    carteirasProjeto: new Set(carteirasValidas.map((c) => c.address)),
    motivosProjeto: new Map(carteirasValidas.map((c) => [c.address, c.reason])),
    conhecidos,
  };
}

/** Marca que alguem abriu este token (contador de visitas). */
export async function registrarVisita(chain, address) {
  const s = db();
  const addr = normalizarEndereco(chain, address);
  await garantirToken(chain, addr);
  const { data } = await s.from('tokens').select('views').eq('chain', chain).eq('address', addr).maybeSingle();
  await s.from('tokens')
    .update({ last_view_at: new Date().toISOString(), views: (data?.views || 0) + 1 })
    .eq('chain', chain).eq('address', addr);
}
