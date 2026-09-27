# Rastreio Cripto — projeto reformado e testado (build verde)

Este é o SEU projeto real (com indexador, agregados, ethereum.js novo)
JÁ com a reforma aplicada por cima:
- Sem cálculo de compra/venda em dólar. Foco em SINAIS.
- Raio-X e "carteiras do projeto" agora em QUANTIDADE de token + % + contagem.
- Página do token com os Alertas em destaque, sem o bloco de Balanço.
- Bitcoin: painel de grandes movimentos em /pt/bitcoin (e /en/bitcoin).
- AdSense, afiliado MEXC e o indexador: INTACTOS.

Compilei o projeto inteiro aqui (next build) e passou limpo.

## Como subir (de uma vez, pra acabar com o "Frankenstein")

O Root Directory da sua Vercel é: rastreio-cripto/rastreio-cripto
Todo o conteúdo deste pacote vai DENTRO dessa pasta.

Jeito recomendado (substituir tudo):
1. No GitHub, entre em rastreio-cripto/rastreio-cripto (a pasta interna).
2. Add file -> Upload files.
3. Arraste TODAS as pastas/arquivos deste pacote (app, components, lib,
   supabase, public, e os arquivos soltos) para dentro da janela.
4. Escreva "reforma rastreio + bitcoin" e Commit changes.
   (Como os nomes/caminhos são os mesmos, isso sobrescreve os arquivos
   errados de hoje pelas versões certas.)
5. Espere a Vercel ficar VERDE (Ready) e teste.

## Testes depois de subir
- Abra um token (ex.: PEPE): carrega sem erro, Alertas em destaque, sem
  balanço de compra/venda, Raio-X em quantidade/%.
- Abra /pt/bitcoin: o painel abre (vazio até a rotina rodar).
- Home: aparece "Ver movimentos do Bitcoin →".

## Bitcoin — ligar a coleta
As tabelas bitcoin_* já foram criadas por você no Supabase.
A rotina do BTC é a rota /api/bitcoin (protegida pela sua CRON_SECRET).
Você pode agendá-la no mesmo lugar onde já agenda o indexar (pg_cron no
Supabase OU GitHub Actions). Ex. pg_cron:

  select cron.schedule('bitcoin-15min','*/15 * * * *', $$
    select net.http_get(
      url := 'https://rastreiocrypto.vercel.app/api/bitcoin',
      headers := jsonb_build_object('Authorization','Bearer SUA_CRON_SECRET')
    ); $$);

Corte de "grande movimento": lib/bitcoin.js, constante CORTE_BTC (50).
Endereços de corretora do BTC: inserir em address_labels com chain='bitcoin'.

## O que NÃO precisa fazer
- Nada de mexer em ethereum.js, indexador.js, coletor de dados: intactos.
- Nada de rodar migração nova (você já rodou o SQL do banco).
