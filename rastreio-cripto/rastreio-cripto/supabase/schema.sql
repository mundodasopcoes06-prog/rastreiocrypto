-- ============================================================
-- RASTREIO CRIPTO - estrutura do banco de dados
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em RUN.
-- Pode rodar de novo sem medo: tudo usa "if not exists".
-- ============================================================

-- ------------------------------------------------------------
-- 1) Tokens que o site ja conheceu
-- ------------------------------------------------------------
create table if not exists public.tokens (
  id             bigserial primary key,
  chain          text        not null,              -- 'ethereum' ou 'solana'
  address        text        not null,              -- endereco do contrato / mint
  symbol         text,
  name           text,
  decimals       int         default 18,
  creator        text,                              -- quem criou o contrato (Ethereum)
  mint_authority text,                              -- quem ainda pode emitir (Solana)
  freeze_authority text,                            -- quem ainda pode congelar (Solana)
  total_supply   numeric,
  created_on_chain_at timestamptz,
  last_view_at   timestamptz default now(),         -- ultima vez que alguem abriu
  last_ingest_at timestamptz,                       -- ultima coleta concluida
  views          int         default 0,
  unique (chain, address)
);

create index if not exists tokens_last_view_idx on public.tokens (last_view_at desc);

-- ------------------------------------------------------------
-- 2) Movimentacoes lidas da blockchain
-- ------------------------------------------------------------
create table if not exists public.transfers (
  id            bigserial primary key,
  chain         text        not null,
  token_address text        not null,
  tx_hash       text        not null,
  ts            timestamptz not null,               -- hora exata do movimento
  from_addr     text,
  to_addr       text,
  amount        numeric,                            -- quantidade de tokens
  usd_value     numeric,                            -- valor estimado em dolar
  kind          text,                               -- 'compra' | 'venda' | 'transferencia'
  actor         text,                               -- 'corretora' | 'dex' | 'projeto' | 'baleia' | 'queima' | 'desconhecido'
  actor_label   text,                               -- 'Binance', 'Uniswap V3', etc (quando identificado)
  counterparty  text,                               -- o endereco do outro lado
  confidence    text        default 'indicio',      -- 'confirmado' | 'indicio'
  supply_pct    numeric,                            -- % do supply total movimentado
  unique (chain, tx_hash, from_addr, to_addr, amount)
);

create index if not exists transfers_token_ts_idx
  on public.transfers (chain, token_address, ts desc);

create index if not exists transfers_ts_idx on public.transfers (ts);

-- ------------------------------------------------------------
-- 3) Enderecos conhecidos (corretoras, DEX, queima...)
--    Quando o endereco esta aqui, o site mostra como FATO.
--    Quando nao esta, o site mostra como INDICIO.
-- ------------------------------------------------------------
create table if not exists public.address_labels (
  chain     text not null,
  address   text not null,
  label     text not null,                          -- 'Binance', 'Coinbase', 'Uniswap V3'
  category  text not null,                          -- 'corretora' | 'dex' | 'queima' | 'ponte' | 'projeto'
  source    text default 'lista publica',
  primary key (chain, address)
);

-- ------------------------------------------------------------
-- 4) Fotografia de preco e liquidez ao longo do tempo
--    E o que permite detectar queda brusca de liquidez.
-- ------------------------------------------------------------
create table if not exists public.token_snapshots (
  id            bigserial primary key,
  chain         text        not null,
  token_address text        not null,
  ts            timestamptz not null default now(),
  price_usd     numeric,
  liquidity_usd numeric,
  volume_24h    numeric,
  buys_24h      int,
  sells_24h     int
);

create index if not exists snapshots_token_ts_idx
  on public.token_snapshots (chain, token_address, ts desc);

-- ------------------------------------------------------------
-- 5) Carteiras suspeitas de pertencerem ao projeto / time
--    Isso e SEMPRE indicio, nunca fato.
-- ------------------------------------------------------------
create table if not exists public.project_wallets (
  chain         text not null,
  token_address text not null,
  address       text not null,
  reason        text,                               -- por que achamos que e do projeto
  detected_at   timestamptz default now(),
  primary key (chain, token_address, address)
);

-- ------------------------------------------------------------
-- 6) Seguranca: ninguem le nem escreve direto pelo navegador.
--    Todo acesso passa pelo servidor com a service_role key.
-- ------------------------------------------------------------
alter table public.tokens           enable row level security;
alter table public.transfers        enable row level security;
alter table public.address_labels   enable row level security;
alter table public.token_snapshots  enable row level security;
alter table public.project_wallets  enable row level security;

-- ------------------------------------------------------------
-- 7) Limpeza automatica: guardamos no maximo 31 dias.
--    A rota /api/atualizar chama esta funcao a cada coleta.
-- ------------------------------------------------------------
create or replace function public.limpar_antigos()
returns void
language sql
as $$
  delete from public.transfers       where ts < now() - interval '31 days';
  delete from public.token_snapshots where ts < now() - interval '31 days';
$$;
