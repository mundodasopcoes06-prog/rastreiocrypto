-- ============================================================
-- ENDERECOS CONHECIDOS - lista inicial
-- Cole no SQL Editor do Supabase e clique em RUN, depois do schema.sql
--
-- IMPORTANTE: esta e uma lista de partida com enderecos publicamente
-- divulgados. Corretoras trocam de carteira com frequencia. Confira
-- cada endereco no Etherscan / Solscan antes de confiar, e va
-- acrescentando novos conforme encontrar. Quanto maior esta lista,
-- mais o site consegue dizer "FATO" em vez de "INDICIO".
-- ============================================================

insert into public.address_labels (chain, address, label, category) values
-- ---------- ETHEREUM: corretoras ----------
('ethereum','0x28c6c06298d514db089934071355e5743bf21d60','Binance','corretora'),
('ethereum','0x21a31ee1afc51d94c2efccaa2092ad1028285549','Binance','corretora'),
('ethereum','0xdfd5293d8e347dfe59e90efd55b2956a1343963d','Binance','corretora'),
('ethereum','0xbe0eb53f46cd790cd13851d5eff43d12404d33e8','Binance','corretora'),
('ethereum','0xf977814e90da44bfa03b6295a0616a897441acec','Binance','corretora'),
('ethereum','0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43','Coinbase','corretora'),
('ethereum','0x503828976d22510aad0201ac7ec88293211d23da','Coinbase','corretora'),
('ethereum','0x71660c4005ba85c37ccec55d0c4493e66fe775d3','Coinbase','corretora'),
('ethereum','0xe853c56864a2ebe4576a807d26fdc4a0ada51919','Kraken','corretora'),
('ethereum','0x6cc5f688a315f3dc28a7781717a9a798a59fda7b','OKX','corretora'),
('ethereum','0xf89d7b9c864f589bbf53a82105107622b35eaa40','Bybit','corretora'),
('ethereum','0x6262998ced04146fa42253a5c0af90ca02dfd2a3','Crypto.com','corretora'),
('ethereum','0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec','Bitfinex','corretora'),
('ethereum','0x0d0707963952f2fba59dd06f2b425ace40b492fe','Gate.io','corretora'),
('ethereum','0x2b5634c42055806a59e9107ed44d43c426e58258','KuCoin','corretora'),

-- ---------- ETHEREUM: corretoras descentralizadas (DEX) ----------
('ethereum','0x7a250d5630b4cf539739df2c5dacb4c659f2488d','Uniswap V2','dex'),
('ethereum','0xe592427a0aece92de3edee1f18e0157c05861564','Uniswap V3','dex'),
('ethereum','0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45','Uniswap V3','dex'),
('ethereum','0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad','Uniswap Universal','dex'),
('ethereum','0x1111111254eeb25477b68fb85ed929f73a960582','1inch','dex'),
('ethereum','0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f','SushiSwap','dex'),
('ethereum','0xdef1c0ded9bec7f1a1670819833240f027b25eff','0x Protocol','dex'),

-- ---------- ETHEREUM: queima ----------
('ethereum','0x0000000000000000000000000000000000000000','Endereco de queima','queima'),
('ethereum','0x000000000000000000000000000000000000dead','Endereco de queima','queima'),

-- ---------- SOLANA: corretoras ----------
('solana','5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9','Binance','corretora'),
('solana','2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S','Binance','corretora'),
('solana','H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS','Coinbase','corretora'),
('solana','FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5','Kraken','corretora'),
('solana','5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD','OKX','corretora'),
('solana','AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2','Bybit','corretora'),
('solana','GJR8VBkkHfdYSS5UU6Kj4jMoStRcQ4PAGXVLu4CSgSYA','Gate.io','corretora'),

-- ---------- SOLANA: corretoras descentralizadas e programas ----------
('solana','675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8','Raydium','dex'),
('solana','JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4','Jupiter','dex'),
('solana','whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc','Orca','dex'),
('solana','6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P','Pump.fun','dex'),
('solana','11111111111111111111111111111111','Endereco de queima','queima')

on conflict (chain, address) do update
  set label = excluded.label,
      category = excluded.category;
