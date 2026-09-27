# Rastreio Cripto — estado do projeto (backup)

Data deste backup: 27/09/2026
Root Directory na Vercel: rastreio-cripto/rastreio-cripto

## O que este backup contém
O projeto REAL (indexador contínuo, agregados, ethereum.js novo) JÁ com a
reforma aplicada e testada (next build passou limpo):
- Sem cálculo de compra/venda em dólar. Foco em SINAIS.
- Raio-X e "carteiras do projeto" em QUANTIDADE de token + % + contagem.
- Página do token com Alertas em destaque, sem bloco de balanço.
- Bitcoin: painel de grandes movimentos em /pt/bitcoin (link na home).
- bitcoin.js já com o filtro de troco/auto-transferência (só movimento real).
- AdSense, afiliado MEXC e indexador: INTACTOS.

## Estado do banco (Supabase) — já configurado por você
Rotinas automáticas ativas (cron.job):
- job 1  limpa-transfers-48h      0 * * * *   (de hora em hora)
- job 2  vacuum-transfers-diario  0 6 * * *   (libera espaço, transfers)
- job 5  limpeza-diaria           0 3 * * *   (roda limpar_antigos)
- job 6  vacuum-bitcoin-diario    0 6 * * *   (libera espaço, bitcoin)

Função limpar_antigos (apaga o que é velho — banco nunca estoura):
  transfers          > 2 dias (indexador JANELA_DIAS=3, plano gratuito)
  token_snapshots    > 16 dias
  agregados          > 16 dias
  bitcoin_movimentos > 15 dias

Tabelas do Bitcoin já criadas: bitcoin_movimentos, bitcoin_estado.

## Pendências (quando quiser, sem pressa)
1. Subir este projeto no GitHub (pasta rastreio-cripto/rastreio-cripto),
   sobrescrevendo os arquivos. Commit único.
2. Bitcoin — tirar o zero das corretoras: cadastrar endereços de corretora
   verificados em address_labels com chain='bitcoin'. A lista começa vazia
   de propósito (o site só chama de corretora o que é fato).
3. Agendar a coleta do Bitcoin (rota /api/bitcoin) no mesmo lugar do
   indexar, se ainda não agendou. Ex. pg_cron:
     select cron.schedule('bitcoin-15min','*/15 * * * *', $$
       select net.http_get(
         url := 'https://rastreiocrypto.vercel.app/api/bitcoin',
         headers := jsonb_build_object('Authorization','Bearer SUA_CRON_SECRET')
       ); $$);
4. Opcional: mover o link do Bitcoin da home para o menu do topo.

## Ajustes rápidos
- Corte de "grande movimento" do BTC: lib/bitcoin.js, constante CORTE_BTC (50).
- Textos do site (PT/EN): lib/dicionario.js.
- Limite de baleia (% do supply): lib/analise.js, LIMITE_BALEIA_PCT_SUPPLY.
