# Rastreio Cripto — foco em ALERTAS (build verde, testado)

Mudanca desta versao:
- A pagina do token agora e SO alertas + contexto. Saiu a lista de
  transferencias (LinhaDoTempo) e o Raio-X por transferencia.
- Alertas continuam ricos: o que foi, quanto (% do supply), quantas
  carteiras, em quanto tempo, endereco + link "ver na blockchain".
- Alerta novo: "Acumulo silencioso" (carteira que so compra e nao vende).
- Bitcoin: mostra o saldo de corretoras + os 30 maiores movimentos.
- Janela de volta para 15 dias (JANELA_DIAS=15).
- AdSense, MEXC e indexador: intactos.

## Subir no GitHub
Root Directory da Vercel: rastreio-cripto/rastreio-cripto
Entre nessa pasta -> Add file -> Upload files -> arraste TUDO deste
pacote -> Commit ("foco em alertas + 15 dias"). Sobrescreve o que existe.

## SQL para rodar no Supabase (uma vez) — janela de 15 dias
Como agora a pagina nao mostra a lista gigante e o vacuum ja roda, da
para guardar 15 dias. Rode no SQL Editor:

  create or replace function public.limpar_antigos()
  returns void language sql as $$
    delete from public.transfers          where ts   < now() - interval '15 days';
    delete from public.token_snapshots    where ts   < now() - interval '16 days';
    delete from public.agregados          where hora < now() - interval '16 days';
    delete from public.bitcoin_movimentos where ts   < now() - interval '15 days';
  $$;

IMPORTANTE: depois de subir, ACOMPANHE o "Database size" no Supabase por
alguns dias. 15 dias de movimento deve caber (estimativa ~200-300 MB),
mas se o numero passar de ~400 MB, baixe a janela: troque os '15 days'
por '7 days' na funcao acima E o JANELA_DIAS de 15 para 7 em
lib/indexador.js. (Se quiser folga total, o Supabase Pro resolve.)

## Onde ajustar
- Janela dos sinais: lib/indexador.js (JANELA_DIAS) + funcao limpar_antigos.
- Corte de "grande" do BTC: lib/bitcoin.js (CORTE_BTC).
- Textos (PT/EN) e alertas: lib/dicionario.js.
- Endereco de corretora do BTC: address_labels com chain='bitcoin'.
