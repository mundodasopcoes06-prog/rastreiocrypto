Rastreio Cripto
Lê as blockchains Ethereum e Solana e traduz a movimentação de um token
para linguagem que qualquer pessoa entende.
Fato — a carteira está numa lista pública identificada (Binance, Uniswap, queima).
Indício — é leitura de padrão feita pelo site, não certeza.
Em português e inglês. Guarda 30 dias de histórico.
Para colocar no ar
Siga o arquivo PASSO-A-PASSO.md. Ele parte do zero.
Mapa dos arquivos
Arquivo	Para que serve
`PASSO-A-PASSO.md`	O guia de instalação
`supabase/schema.sql`	Cria as tabelas do banco
`supabase/rotulos.sql`	Lista inicial de corretoras e DEX conhecidas
`lib/dicionario.js`	Todos os textos, em português e inglês
`lib/analise.js`	Classifica compra/venda e gera os sinais de atenção
`lib/coletor.js`	Lê a blockchain e grava no banco
`lib/ethereum.js`	Leitura da rede Ethereum (Etherscan)
`lib/solana.js`	Leitura da rede Solana (Helius)
`lib/precos.js`	Preço, liquidez e busca por nome (DexScreener)
`app/[locale]/token/...`	A página de investigação do token
`app/api/atualizar`	Rota chamada de 15 em 15 minutos
`.github/workflows/atualizar.yml`	A rotina automática
Rodar no seu computador (opcional)
```bash
npm install
cp .env.example .env.local   # e preencha as chaves
npm run dev
```
Abre em `http://localhost:3000`.
