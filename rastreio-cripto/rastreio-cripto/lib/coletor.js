// ============================================================
// COLETOR
// Le a blockchain, classifica o que encontrou e grava no Supabase.
// E chamado em dois momentos:
//   - quando alguem abre a pagina de um token (sob demanda)
//   - a cada 15 minutos pela rotina automatica
// ============================================================

import { db } from './supabase';
import { transferenciasEthereum, criadorDoContrato, supplyEthereum } from './ethereum';
import { transferenciasSolana, dadosDoMint, metadadosSolana } from './solana';
import { situacaoDoToken } from './precos';
import { classificar, detectarCarteirasProjeto } from './analise';

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

/** Busca o token no banco; se nao existir, cria. */
export async function garantirToken(chain, address) {
  const addr = normalizarEndereco(chain, address);
  const s = db();

  const { data: existente } = await s
    .from('tokens').select('*').eq('chain', chain).eq('address', addr).maybeSingle();

  if (existente) return existente;

  const { data, error } = await s
    .from('tokens')
    .insert({ chain, address: addr })
    .select().single();

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
  if (situacao?.criado_em && !token.created_on_chain_at) {
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

  // ---- 4. Classificacao ----
  const rotulos = await carregarRotulos();
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

  // ---- 5. Gravacao ----
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

  await s.from('tokens').update(atualizacaoToken).eq('chain', chain).eq('address', addr);

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

  const [{ data: transferencias }, { data: snapshots }, { data: carteiras }] = await Promise.all([
    s.from('transfers').select('*')
      .eq('chain', chain).eq('token_address', addr).gte('ts', desde)
      .order('ts', { ascending: false }).limit(2000),
    s.from('token_snapshots').select('*')
      .eq('chain', chain).eq('token_address', addr)
      .order('ts', { ascending: false }).limit(200),
    s.from('project_wallets').select('address, reason')
      .eq('chain', chain).eq('token_address', addr),
  ]);

  return {
    token,
    transferencias: transferencias || [],
    snapshots: snapshots || [],
    carteirasProjeto: new Set((carteiras || []).map((c) => c.address)),
  };
}

/** Marca que alguem abriu este token — e o que define a fila da rotina automatica. */
export async function registrarVisita(chain, address) {
  const s = db();
  const addr = normalizarEndereco(chain, address);
  await garantirToken(chain, addr);
  const { data } = await s.from('tokens').select('views').eq('chain', chain).eq('address', addr).maybeSingle();
  await s.from('tokens')
    .update({ last_view_at: new Date().toISOString(), views: (data?.views || 0) + 1 })
    .eq('chain', chain).eq('address', addr);
}
