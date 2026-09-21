// ============================================================
// COLETOR
// Le a blockchain, classifica o que encontrou e grava no Supabase.
// E chamado quando alguem abre a pagina de um token (sob demanda).
// ============================================================

import { db } from './supabase';
import { transferenciasEthereum, criadorDoContrato, supplyEthereum } from './ethereum';
import { transferenciasSolana, dadosDoMint, metadadosSolana } from './solana';
import { situacaoDoToken } from './precos';
import { classificar, detectarCarteirasProjeto } from './analise';
import { maioresDonos } from './donos';

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
export async function coletar(chain, address) {
  const s = db();
  const addr = normalizarEndereco(chain, address);
  const token = await garantirToken(chain, addr);

  // ---- 1. Preco, liquidez e volume (DexScreener, gratuito) ----
  const situacao = await situacaoDoToken(chain, addr);

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

  // ---- 3. Movimentos ----
  let brutas = [];
  if (chain === 'ethereum') {
    brutas = await transferenciasEthereum(addr, 200);
    if (brutas.length) {
      casas = brutas[0].decimals ?? casas;
      atualizacaoToken.decimals = casas;
      if (!atualizacaoToken.symbol && brutas[0].simbolo) atualizacaoToken.symbol = brutas[0].simbolo;
      if (!atualizacaoToken.name && brutas[0].nome) atualizacaoToken.name = brutas[0].nome;
    }
    if (!token.total_supply) {
      const sup = await supplyEthereum(addr, casas);
      if (sup) atualizacaoToken.total_supply = sup;
    }
  } else {
    brutas = await transferenciasSolana(addr, 100);
  }

  // Guardamos no maximo 31 dias.
  const limite = Date.now() - 31 * 86400000;
  brutas = brutas.filter((t) => new Date(t.ts).getTime() >= limite);

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
  const preco = situacao?.price_usd ?? null;

  const tokenAtualizado = { ...token, ...atualizacaoToken };
  const carteirasProjetoMapa = detectarCarteirasProjeto(tokenAtualizado, brutas);
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
    }));

    // Grava em blocos para nao estourar o tamanho da requisicao.
    for (let i = 0; i < linhas.length; i += 100) {
      const { error } = await s
        .from('transfers')
        .upsert(linhas.slice(i, i + 100), {
          onConflict: 'chain,tx_hash,from_addr,to_addr,amount',
          ignoreDuplicates: true,
        });
      if (error) console.warn('Erro ao gravar movimentos:', error.message);
    }
  }

  // Carteiras do projeto que descobrimos
  if (carteirasProjetoMapa.size) {
    const linhas = [...carteirasProjetoMapa.entries()].map(([endereco, motivo]) => ({
      chain, token_address: addr, address: endereco, reason: motivo,
    }));
    await s.from('project_wallets').upsert(linhas, { onConflict: 'chain,token_address,address' });
  }

  // Fotografia de preco e liquidez
  if (situacao) {
    await s.from('token_snapshots').insert({
      chain, token_address: addr,
      price_usd: situacao.price_usd,
      liquidity_usd: situacao.liquidity_usd,
      volume_24h: situacao.volume_24h,
      buys_24h: situacao.buys_24h,
      sells_24h: situacao.sells_24h,
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

  // Apaga o que passou de 31 dias. Antes isso era feito pela rotina
  // automatica, que foi removida; agora roda a cada leitura.
  try { await s.rpc('limpar_antigos'); } catch (e) { /* nao pode travar a pagina */ }

  return { lidos: brutas.length, token: { ...tokenAtualizado } };
}

/** Le tudo que a pagina do token precisa mostrar. */
export async function lerToken(chain, address) {
  const s = db();
  const addr = normalizarEndereco(chain, address);

  const { data: token } = await s
    .from('tokens').select('*').eq('chain', chain).eq('address', addr).maybeSingle();

  if (!token) return null;

  const desde = new Date(Date.now() - 30 * 86400000).toISOString();

  const [{ data: transferencias }, { data: snapshots }, { data: carteiras }, rotulos] = await Promise.all([
    s.from('transfers').select('*')
      .eq('chain', chain).eq('token_address', addr).gte('ts', desde)
      .order('ts', { ascending: false }).limit(2000),
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

  return {
    token,
    transferencias: transferencias || [],
    snapshots: snapshots || [],
    carteirasProjeto: new Set((carteiras || []).map((c) => c.address)),
    motivosProjeto: new Map((carteiras || []).map((c) => [c.address, c.reason])),
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
