// Todos os textos do site em portugues e ingles.
// Para trocar uma palavra, altere aqui — ela muda no site inteiro.

export const IDIOMAS = ['pt', 'en'];
export const IDIOMA_PADRAO = 'pt';

const textos = {
  pt: {
    siteNome: 'Rastreio Cripto',
    siteResumo: 'A blockchain é pública. Aqui ela fica legível.',

    buscaTitulo: 'Qual token você quer investigar?',
    buscaAjuda: 'Digite o nome, a sigla ou cole o endereço do contrato. Ethereum e Solana.',
    buscaPlaceholder: 'Ex.: BONK, PEPE ou 0x6982…',
    buscaBotao: 'Investigar',
    buscando: 'Procurando…',
    semResultado: 'Nada encontrado com esse nome. Tente a sigla exata ou cole o endereço do contrato.',
    resultadosTitulo: 'Encontramos estes tokens',
    buscaSiglaDuplicada: 'Atenção: mais de um resultado usa a mesma sigla. Cópias de tokens conhecidos costumam ter liquidez muito menor — confira o endereço do contrato antes de escolher.',
    buscaLiquidezBaixa: 'liquidez baixa',
    redeEthereum: 'Ethereum',
    redeSolana: 'Solana',

    explicaTitulo: 'Como ler esta página',
    explicaFato: 'Fato',
    explicaFatoTexto: 'A carteira está numa lista pública de endereços já identificados. Quando dizemos que a Binance vendeu, ela vendeu.',
    explicaIndicio: 'Indício',
    explicaIndicioTexto: 'A carteira não está identificada. O padrão do movimento sugere algo, mas é leitura nossa, não certeza.',
    avisoGeral: 'Isto não é recomendação de investimento. É leitura de dados públicos da blockchain, com margem de erro.',

    coletando: 'Lendo a blockchain agora. Isso leva alguns segundos na primeira vez.',
    semDados: 'Ainda não há movimentos registrados para este token na janela que acompanhamos.',
    atualizarAgora: 'Buscar movimentos novos',
    atualizando: 'Lendo a blockchain…',
    ultimaLeitura: 'Última leitura',

    veredictoTitulo: 'O que está acontecendo',
    saldoCompras: 'Entrou (compra)',
    saldoVendas: 'Saiu (venda)',
    saldoLiquido: 'Saldo',
    pressaoCompra: 'Mais compra que venda',
    pressaoVenda: 'Mais venda que compra',
    pressaoEquilibrio: 'Compra e venda equilibradas',

    periodo24h: '24 horas',
    periodo7d: '7 dias',
    periodo30d: '30 dias',
    periodoTitulo: 'Balanço de compras e vendas',
    periodoAjuda: 'Guardamos os últimos 30 dias de movimentos.',

    alertasTitulo: 'Sinais de atenção',
    semAlertas: 'Nenhum sinal de atenção na janela analisada.',

    movimentosTitulo: 'Movimentos, um por um',
    movimentosAjuda: 'Do mais recente para o mais antigo, com a hora exata.',
    colunaHora: 'Hora',
    colunaTipo: 'O que foi',
    colunaQuem: 'Quem',
    colunaQuanto: 'Quanto',
    colunaValor: 'Valor',
    colunaSupply: '% do total',
    verNoExplorador: 'Ver na blockchain',

    tipoCompra: 'Compra',
    tipoVenda: 'Venda',
    tipoTransferencia: 'Transferência',

    atorCorretora: 'Corretora',
    atorDex: 'Corretora descentralizada',
    atorProjeto: 'Carteira ligada ao projeto',
    atorBaleia: 'Carteira grande',
    atorQueima: 'Queima de tokens',
    atorDesconhecido: 'Carteira não identificada',

    fichaTitulo: 'Ficha do token',
    fichaRede: 'Rede',
    fichaContrato: 'Contrato',
    fichaPreco: 'Preço',
    fichaLiquidez: 'Liquidez',
    fichaVolume: 'Volume em 24h',
    fichaSupply: 'Total emitido',
    fichaCriador: 'Quem criou',
    fichaEmissao: 'Ainda pode emitir mais',
    sim: 'Sim',
    nao: 'Não',
    naoDisponivel: 'Não disponível',

    voltar: 'Nova busca',
    rodape: 'Dados lidos diretamente das blockchains Ethereum e Solana.',
    rodapePrivacidade: 'Privacidade e cookies',
    trocarIdioma: 'English',

    // ---- topo ----
    idadeTitulo: 'Negociado desde',
    idadeDias: (d) => d === 0 ? 'hoje' : d === 1 ? 'há 1 dia' : `há ${d} dias`,
    idadeNovo: 'token novo',
    idadeDesconhecida: 'Data de início desconhecida',
    termometroTitulo: 'Nível de atenção',
    termometroBaixo: 'Baixo',
    termometroMedio: 'Médio',
    termometroAlto: 'Alto',
    termometroResumo: (a, m) => `${a} ${a === 1 ? 'sinal forte' : 'sinais fortes'} e ${m} ${m === 1 ? 'sinal moderado' : 'sinais moderados'} nesta leitura.`,
    termometroAviso: 'Resume os sinais abaixo. Não é nota do projeto nem recomendação.',
    porque: 'Por quê',

    // ---- carteiras do projeto ----
    projetoTitulo: 'O que as carteiras do projeto estão fazendo',
    projetoSub: 'Carteiras que criaram o contrato, controlam a emissão ou receberam tokens direto delas. A ligação com o projeto é deduzida (indício).',
    projetoNenhuma: 'Não conseguimos identificar carteiras do projeto neste token. Na Solana isso é comum quando o criador renunciou ao controle do contrato; na Ethereum, quando o criador nunca movimentou o token.',
    projetoParado: 'Nenhuma movimentação das carteiras do projeto nos últimos 30 dias.',
    projetoQtd: (n) => `${n} ${n === 1 ? 'carteira identificada' : 'carteiras identificadas'}`,
    projetoUltimo: 'Último movimento',
    projetoVerCarteiras: 'Ver as carteiras',
    acaoVenderam: 'Venderam na bolsa descentralizada',
    acaoParaCorretora: 'Mandaram para corretoras',
    acaoTransferiram: 'Mandaram para outras carteiras',
    acaoQueimaram: 'Queimaram (destruíram) tokens',
    acaoCompraram: 'Compraram',
    acaoDeCorretora: 'Receberam de corretoras',
    acaoReceberam: 'Receberam de outras carteiras',
    motivoProjetoCriador: 'criou o contrato ou controla a emissão',
    motivoProjetoRecebeu: 'recebeu tokens direto da carteira que controla o contrato',

    // ---- raio-x ----
    raioTitulo: 'Raio-x: quem está comprando e quem está vendendo',
    raioSub: 'As mesmas compras e vendas do balanço, separadas por tipo de carteira.',
    raioCategoria: 'Quem',
    raioSaldo: 'Saldo',
    catCorretoras: 'Corretoras identificadas',
    catProjeto: 'Carteiras do projeto',
    catGrandes: 'Carteiras grandes não identificadas',
    catDemais: 'Demais carteiras',
    catCorretorasAjuda: 'Fato: endereços públicos de corretoras.',
    catProjetoAjuda: 'Indício: ligação deduzida com o criador do contrato.',
    catGrandesAjuda: 'Indício: operações acima de $10 mil ou de 0,1% do total emitido.',
    catDemaisAjuda: 'Operações menores, de carteiras sem identificação.',
    raioVazio: 'Sem compras ou vendas neste período.',

    // ---- liquidez ----
    liqTitulo: 'Liquidez ao longo do tempo',
    liqSub: 'Liquidez é o dinheiro disponível nas pools para quem quer comprar ou vender. Registramos um ponto a cada leitura do site.',
    liqPoucos: 'Ainda temos poucas leituras deste token para comparar. Cada vez que alguém abre esta página, um novo ponto é registrado.',
    liqEstavel: (v) => `Liquidez estável: variou ${v}% no período registrado.`,
    liqSubiu: (v) => `Liquidez aumentou ${v}% no período registrado.`,
    liqBrusca: (v, m) => `Queda de ${v}% — e ${m}% de uma vez só, entre duas leituras. Queda repentina é o formato clássico de puxada de tapete.`,
    liqGradual: (v, q) => `Queda de ${v}%, aos poucos, em ${q} retiradas. Retirada gradual pode ser saída silenciosa de quem controla a pool.`,
    liqPeriodo: (n, de, ate) => `${n} leituras, de ${de} a ${ate}.`,

    // ---- donos ----
    donosTitulo: 'Quem guarda mais tokens agora',
    donosSub: 'As 10 carteiras com mais tokens neste momento, em % do total emitido.',
    donosResumo: (t, d) => `As 10 maiores carteiras têm ${t}% de todos os tokens. Carteiras sem identificação somam ${d}%.`,
    donosIndisponivel: 'Não foi possível ler os maiores donos agora. Tente atualizar mais tarde.',
    donosAviso: 'Algumas carteiras sem identificação podem ser pools, contratos de travamento ou cofres do próprio projeto que não estão na nossa lista.',
    donosLido: 'Lido',
    tipoPool: 'Pool de negociação',
    tipoCorretora: 'Corretora',
    tipoQueima: 'Endereço de queima',
    tipoProjeto: 'Carteira do projeto',
    tipoDesconhecido: 'Não identificada',

    // ---- motivos dos movimentos ----
    motivoPoolPadrao: 'pool deduzida pelo padrão da transação, não está na lista oficial',
    motivoDexPrograma: (dex) => `passou pelo programa ${dex}; a direção (compra ou venda) foi deduzida de quem pagou a taxa`,
    motivoProjeto: (r) => `carteira ligada ao projeto porque ${r}`,
    motivoBaleia: (usd, pct) => `carteira sem nome público; chamamos de grande porque movimentou ${usd}${pct ? ` (${pct}% do total emitido)` : ''}`,
    motivoDesconhecido: 'carteira sem nome público: não sabemos quem é',
    motivoTransferencia: 'passagem direta entre carteiras; não foi compra nem venda na bolsa',
    fuso: 'horário de Brasília',

    // ---- confiabilidade do preco (liquidez muito baixa) ----
    avisoLiquidezBaixaTitulo: 'Atenção: liquidez muito baixa neste token',
    avisoLiquidezBaixaTexto: (v) => `A pool de negociação deste token tem apenas ${v} de liquidez agora. Com tão pouco dinheiro disponível, uma única negociação grande pode distorcer bastante o "preço de tabela" — e todo valor em dólar nesta página é calculado a partir desse preço. Trate os valores abaixo com cautela extra; se houver uma seção "Nas corretoras" nesta página, ela pode ser uma referência mais confiável.`,

    // ---- validacao do preco (3 fontes) ----
    precoStatusTitulo: {
      confirmado: 'Preço confirmado em fontes independentes',
      corrigido: 'Preço corrigido pela referência das corretoras',
      fonte_unica: 'Preço de uma única fonte',
      divergente: 'Preço não confirmado: as fontes discordam',
      salto_suspeito: 'Preço rejeitado: salto suspeito',
      sem_preco: 'Preço indisponível',
    },
    precoStatusTexto: {
      confirmado: (n) => `O preço usado nesta página foi conferido e bate em ${n} fontes independentes.`,
      corrigido: () => 'Uma fonte on-chain trouxe um preço fora da realidade. Descartamos esse valor e usamos o preço das corretoras, que movimentam muito mais dinheiro e são mais difíceis de distorcer.',
      fonte_unica: () => 'Só uma fonte respondeu agora, então não conseguimos confirmar o preço em outro lugar. Trate os valores em dólar com cautela.',
      divergente: () => 'As fontes on-chain informam preços muito diferentes e o token não está em corretoras para desempatar. Para não mostrar um número errado, os valores em dólar foram ocultados. As quantidades de tokens continuam corretas.',
      salto_suspeito: () => 'O preço mudou mais de 10 vezes desde a última leitura sem confirmação independente. Os valores em dólar foram ocultados até que o preço seja confirmado. As quantidades de tokens continuam corretas.',
      sem_preco: () => 'Nenhuma fonte informou preço para este token agora. As quantidades de tokens continuam corretas.',
    },
    precoFontesVer: 'Ver o preço em cada fonte',
    precoFonteCorretoras: 'Corretoras (CoinGecko)',
    precoFonteSemDado: 'sem dado',

    // ---- corretoras centralizadas (CEX) ----
    cexTitulo: 'Nas corretoras',
    cexSub: 'Preço e volume nas maiores corretoras centralizadas. É um mundo separado da blockchain: aqui não é possível saber quais carteiras negociaram, só o total movimentado.',
    cexIndisponivel: 'Não foi possível consultar as corretoras agora. Tente atualizar a página mais tarde.',
    cexNaoListado: 'Este token não está listado nas grandes corretoras que verificamos (Binance, Coinbase, KuCoin, OKX, Bybit, Gate.io, MEXC). Isso é comum em tokens novos ou de nicho — o volume dele existe só nas pools on-chain mostradas acima.',
    cexVariacaoAlta: (pct) => `Considerando todas as corretoras, o preço subiu ${pct}% nas últimas 24 horas.`,
    cexVariacaoBaixa: (pct) => `Considerando todas as corretoras, o preço caiu ${pct}% nas últimas 24 horas.`,
    cexVolume: (v) => `volume 24h: ${v}`,
    cexVerNaCorretora: 'Ver na corretora',
    cexFluxo: (c, v) => `Nas últimas 24h, ordens a mercado compraram ${c} e venderam ${v} nesta corretora.`,
    cexSemFluxo: 'Esta corretora não divulga publicamente a divisão entre compra e venda — só o volume total.',
    cexAviso: 'Preço e volume vêm das próprias corretoras (via CoinGecko, confirmado pelo endereço do contrato — não pelo nome, para evitar confusão com tokens clonados). Diferente do restante da página, aqui nunca é possível saber quais carteiras negociaram.',
    cexSimboloDivergente: (simbolo) => `Atenção: as corretoras abaixo negociam ${simbolo}, não necessariamente o mesmo token desta página. Pode ser a versão "normal" de um token que aqui aparece de forma diferente (empacotada, investida/staked, etc). Use como referência de contexto, não como o preço exato deste contrato.`,

    // ---- pagina de privacidade ----
    privTitulo: 'Privacidade e cookies',
    privParagrafos: [
      'O Rastreio Cripto lê dados públicos das blockchains Ethereum e Solana e os organiza para leitura. Não pedimos cadastro, e-mail ou qualquer dado pessoal para usar o site.',
      'Como qualquer site, guardamos registros técnicos básicos de acesso (como endereço IP e navegador usado), gerados automaticamente pelos serviços que hospedam o site (Vercel e Supabase), usados apenas para manter o site funcionando e detectar abuso.',
      'Este site pode exibir anúncios fornecidos pelo Google (Google AdSense). O Google e seus parceiros podem usar cookies para exibir anúncios com base em visitas suas a este e a outros sites. Você pode desativar a personalização de anúncios visitando as Configurações de Anúncios do Google, em adssettings.google.com.',
      'Este site pode conter links de afiliados de corretoras de criptomoedas. Se você se cadastrar em uma corretora através de um desses links, o Rastreio Cripto pode receber uma comissão, sem custo adicional para você. Isso não influencia as análises e alertas mostrados sobre nenhum token.',
      'As informações mostradas neste site são leituras públicas da blockchain, algumas classificadas como indício (interpretação nossa) e não como fato. Nada aqui é recomendação de investimento.',
      'Dúvidas sobre esta política podem ser enviadas para o contato disponível na página inicial do repositório do projeto.',
    ],

    // ---- anuncio de afiliado ----
    anuncioEtiqueta: 'Publicidade',
    anuncioTitulo: 'Quer negociar este token?',
    anuncioTexto: (c) => `Abra uma conta na ${c} para comprar e vender. Este é um link de afiliado: se você se cadastrar por ele, o Rastreio Cripto pode receber uma comissão, sem custo extra para você.`,
    anuncioBotao: (c) => `Abrir conta na ${c}`,
  },

  en: {
    siteNome: 'Rastreio Cripto',
    siteResumo: 'The blockchain is public. Here it becomes readable.',

    buscaTitulo: 'Which token do you want to investigate?',
    buscaAjuda: 'Type the name, the ticker, or paste the contract address. Ethereum and Solana.',
    buscaPlaceholder: 'e.g. BONK, PEPE or 0x6982…',
    buscaBotao: 'Investigate',
    buscando: 'Searching…',
    semResultado: 'Nothing found with that name. Try the exact ticker or paste the contract address.',
    resultadosTitulo: 'We found these tokens',
    buscaSiglaDuplicada: 'Warning: more than one result uses the same ticker. Copies of known tokens usually have much lower liquidity — check the contract address before choosing.',
    buscaLiquidezBaixa: 'low liquidity',
    redeEthereum: 'Ethereum',
    redeSolana: 'Solana',

    explicaTitulo: 'How to read this page',
    explicaFato: 'Confirmed',
    explicaFatoTexto: 'The wallet is on a public list of already identified addresses. When we say Binance sold, Binance sold.',
    explicaIndicio: 'Indication',
    explicaIndicioTexto: 'The wallet is not identified. The pattern suggests something, but it is our reading, not a certainty.',
    avisoGeral: 'This is not investment advice. It is a reading of public blockchain data, with a margin of error.',

    coletando: 'Reading the blockchain now. This takes a few seconds the first time.',
    semDados: 'No movements recorded for this token in the window we track.',
    atualizarAgora: 'Fetch new movements',
    atualizando: 'Reading the blockchain…',
    ultimaLeitura: 'Last read',

    veredictoTitulo: 'What is going on',
    saldoCompras: 'In (buying)',
    saldoVendas: 'Out (selling)',
    saldoLiquido: 'Net',
    pressaoCompra: 'More buying than selling',
    pressaoVenda: 'More selling than buying',
    pressaoEquilibrio: 'Buying and selling are balanced',

    periodo24h: '24 hours',
    periodo7d: '7 days',
    periodo30d: '30 days',
    periodoTitulo: 'Buying and selling balance',
    periodoAjuda: 'We keep the last 30 days of movements.',

    alertasTitulo: 'Things to watch',
    semAlertas: 'No warning signs in the analysed window.',

    movimentosTitulo: 'Movements, one by one',
    movimentosAjuda: 'Newest first, with the exact time.',
    colunaHora: 'Time',
    colunaTipo: 'What it was',
    colunaQuem: 'Who',
    colunaQuanto: 'How much',
    colunaValor: 'Value',
    colunaSupply: '% of total',
    verNoExplorador: 'View on chain',

    tipoCompra: 'Buy',
    tipoVenda: 'Sell',
    tipoTransferencia: 'Transfer',

    atorCorretora: 'Exchange',
    atorDex: 'Decentralised exchange',
    atorProjeto: 'Wallet linked to the project',
    atorBaleia: 'Large wallet',
    atorQueima: 'Token burn',
    atorDesconhecido: 'Unidentified wallet',

    fichaTitulo: 'Token file',
    fichaRede: 'Network',
    fichaContrato: 'Contract',
    fichaPreco: 'Price',
    fichaLiquidez: 'Liquidity',
    fichaVolume: '24h volume',
    fichaSupply: 'Total supply',
    fichaCriador: 'Created by',
    fichaEmissao: 'Can still mint more',
    sim: 'Yes',
    nao: 'No',
    naoDisponivel: 'Not available',

    voltar: 'New search',
    rodape: 'Data read directly from the Ethereum and Solana blockchains.',
    rodapePrivacidade: 'Privacy and cookies',
    trocarIdioma: 'Português',

    // ---- top ----
    idadeTitulo: 'Trading since',
    idadeDias: (d) => d === 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`,
    idadeNovo: 'new token',
    idadeDesconhecida: 'Start date unknown',
    termometroTitulo: 'Attention level',
    termometroBaixo: 'Low',
    termometroMedio: 'Medium',
    termometroAlto: 'High',
    termometroResumo: (a, m) => `${a} strong and ${m} moderate ${a + m === 1 ? 'signal' : 'signals'} in this read.`,
    termometroAviso: 'Summarises the signals below. Not a project rating or advice.',
    porque: 'Why',

    // ---- project wallets ----
    projetoTitulo: 'What the project wallets are doing',
    projetoSub: 'Wallets that created the contract, control minting, or received tokens directly from them. The link to the project is inferred (indication).',
    projetoNenhuma: 'We could not identify project wallets for this token. On Solana this is common when the creator renounced control; on Ethereum, when the creator never moved the token.',
    projetoParado: 'No movement from project wallets in the last 30 days.',
    projetoQtd: (n) => `${n} ${n === 1 ? 'wallet identified' : 'wallets identified'}`,
    projetoUltimo: 'Last movement',
    projetoVerCarteiras: 'See the wallets',
    acaoVenderam: 'Sold on decentralised exchanges',
    acaoParaCorretora: 'Sent to exchanges',
    acaoTransferiram: 'Sent to other wallets',
    acaoQueimaram: 'Burned (destroyed) tokens',
    acaoCompraram: 'Bought',
    acaoDeCorretora: 'Received from exchanges',
    acaoReceberam: 'Received from other wallets',
    motivoProjetoCriador: 'created the contract or controls minting',
    motivoProjetoRecebeu: 'received tokens directly from the wallet that controls the contract',

    // ---- x-ray ----
    raioTitulo: 'X-ray: who is buying and who is selling',
    raioSub: 'The same buys and sells as the balance, split by type of wallet.',
    raioCategoria: 'Who',
    raioSaldo: 'Net',
    catCorretoras: 'Identified exchanges',
    catProjeto: 'Project wallets',
    catGrandes: 'Large unidentified wallets',
    catDemais: 'Everyone else',
    catCorretorasAjuda: 'Confirmed: public exchange addresses.',
    catProjetoAjuda: 'Indication: link to the contract creator is inferred.',
    catGrandesAjuda: 'Indication: trades above $10k or 0.1% of total supply.',
    catDemaisAjuda: 'Smaller trades from unidentified wallets.',
    raioVazio: 'No buys or sells in this period.',

    // ---- liquidity ----
    liqTitulo: 'Liquidity over time',
    liqSub: 'Liquidity is the money available in pools for people who want to buy or sell. We record one point each time the site reads this token.',
    liqPoucos: 'We still have few reads of this token to compare. Every time someone opens this page, a new point is recorded.',
    liqEstavel: (v) => `Liquidity is stable: it changed ${v}% over the recorded period.`,
    liqSubiu: (v) => `Liquidity grew ${v}% over the recorded period.`,
    liqBrusca: (v, m) => `Down ${v}% — ${m}% of it in one go, between two reads. A sudden drop is the classic shape of a rug pull.`,
    liqGradual: (v, q) => `Down ${v}%, bit by bit, across ${q} withdrawals. Gradual withdrawal can be a quiet exit by whoever controls the pool.`,
    liqPeriodo: (n, de, ate) => `${n} reads, from ${de} to ${ate}.`,

    // ---- holders ----
    donosTitulo: 'Who holds the most tokens now',
    donosSub: 'The 10 wallets holding the most tokens right now, as % of total supply.',
    donosResumo: (t, d) => `The top 10 wallets hold ${t}% of all tokens. Unidentified wallets add up to ${d}%.`,
    donosIndisponivel: 'Could not read the top holders right now. Try refreshing later.',
    donosAviso: 'Some unidentified wallets may be pools, lock contracts or project treasuries that are not on our list.',
    donosLido: 'Read',
    tipoPool: 'Trading pool',
    tipoCorretora: 'Exchange',
    tipoQueima: 'Burn address',
    tipoProjeto: 'Project wallet',
    tipoDesconhecido: 'Unidentified',

    // ---- movement reasons ----
    motivoPoolPadrao: 'pool inferred from the transaction pattern, not on the official list',
    motivoDexPrograma: (dex) => `went through the ${dex} program; direction (buy or sell) inferred from who paid the fee`,
    motivoProjeto: (r) => `wallet linked to the project because it ${r}`,
    motivoBaleia: (usd, pct) => `wallet with no public name; we call it large because it moved ${usd}${pct ? ` (${pct}% of total supply)` : ''}`,
    motivoDesconhecido: 'wallet with no public name: we do not know who it is',
    motivoTransferencia: 'direct transfer between wallets; not a buy or sell on an exchange',
    fuso: 'UTC',

    // ---- price reliability (very low liquidity) ----
    avisoLiquidezBaixaTitulo: 'Warning: very low liquidity for this token',
    avisoLiquidezBaixaTexto: (v) => `This token's trading pool currently has only ${v} in liquidity. With so little money available, a single large trade can badly distort the "quoted price" — and every dollar value on this page is calculated from that price. Treat the figures below with extra caution; if this page has an "On exchanges" section, it may be a more reliable reference.`,

    // ---- price validation (3 sources) ----
    precoStatusTitulo: {
      confirmado: 'Price confirmed by independent sources',
      corrigido: 'Price corrected using the exchange reference',
      fonte_unica: 'Price from a single source',
      divergente: 'Price not confirmed: sources disagree',
      salto_suspeito: 'Price rejected: suspicious jump',
      sem_preco: 'Price unavailable',
    },
    precoStatusTexto: {
      confirmado: (n) => `The price used on this page was checked and matches across ${n} independent sources.`,
      corrigido: () => 'One on-chain source returned an unrealistic price. We discarded it and used the exchange price, which moves far more money and is much harder to distort.',
      fonte_unica: () => 'Only one source responded right now, so we could not confirm the price elsewhere. Treat dollar values with caution.',
      divergente: () => 'On-chain sources report very different prices and the token is not on exchanges to break the tie. To avoid showing a wrong number, dollar values are hidden. Token amounts remain correct.',
      salto_suspeito: () => 'The price moved more than 10x since the last read without independent confirmation. Dollar values are hidden until the price is confirmed. Token amounts remain correct.',
      sem_preco: () => 'No source reported a price for this token right now. Token amounts remain correct.',
    },
    precoFontesVer: 'See the price from each source',
    precoFonteCorretoras: 'Exchanges (CoinGecko)',
    precoFonteSemDado: 'no data',

    // ---- centralised exchanges (CEX) ----
    cexTitulo: 'On exchanges',
    cexSub: 'Price and volume on the largest centralised exchanges. This is a separate world from the blockchain: here it is never possible to know which wallets traded, only the total moved.',
    cexIndisponivel: 'Could not check exchanges right now. Try refreshing the page later.',
    cexNaoListado: 'This token is not listed on the major exchanges we check (Binance, Coinbase, KuCoin, OKX, Bybit, Gate.io, MEXC). This is common for new or niche tokens — its volume only exists in the on-chain pools shown above.',
    cexVariacaoAlta: (pct) => `Across all exchanges, the price rose ${pct}% over the last 24 hours.`,
    cexVariacaoBaixa: (pct) => `Across all exchanges, the price fell ${pct}% over the last 24 hours.`,
    cexVolume: (v) => `24h volume: ${v}`,
    cexVerNaCorretora: 'View on exchange',
    cexFluxo: (c, v) => `Over the last 24h, market orders bought ${c} and sold ${v} on this exchange.`,
    cexSemFluxo: 'This exchange does not publicly break down buys vs sells — only total volume.',
    cexAviso: 'Price and volume come from the exchanges themselves (via CoinGecko, confirmed by contract address — not by name, to avoid confusion with cloned tokens). Unlike the rest of this page, it is never possible here to know which wallets traded.',
    cexSimboloDivergente: (simbolo) => `Note: the exchanges below trade ${simbolo}, which may not be the exact same token as this page. This can happen with a token's "plain" version when this page is about a wrapped or staked form of it. Use it as context, not as this exact contract's precise price.`,

    // ---- privacy page ----
    privTitulo: 'Privacy and cookies',
    privParagrafos: [
      'Rastreio Cripto reads public data from the Ethereum and Solana blockchains and organises it for reading. We do not require sign-up, e-mail, or any personal data to use the site.',
      'Like any website, we keep basic technical access logs (such as IP address and browser used), generated automatically by the services that host the site (Vercel and Supabase), used only to keep the site running and to detect abuse.',
      'This site may display ads provided by Google (Google AdSense). Google and its partners may use cookies to serve ads based on your visits to this and other sites. You can opt out of personalised advertising by visiting Google Ads Settings at adssettings.google.com.',
      'This site may contain affiliate links to cryptocurrency exchanges. If you sign up with an exchange through one of these links, Rastreio Cripto may earn a commission, at no extra cost to you. This does not influence the analysis and alerts shown for any token.',
      'The information shown on this site is a public reading of the blockchain, some of it classified as an indication (our interpretation) rather than a fact. Nothing here is investment advice.',
      'Questions about this policy can be sent to the contact listed on the project repository home page.',
    ],

    // ---- affiliate banner ----
    anuncioEtiqueta: 'Advertisement',
    anuncioTitulo: 'Want to trade this token?',
    anuncioTexto: (c) => `Open an account on ${c} to buy and sell. This is an affiliate link: if you sign up through it, Rastreio Cripto may earn a commission, at no extra cost to you.`,
    anuncioBotao: (c) => `Open an account on ${c}`,
  },
};

export function t(locale) {
  return textos[locale] || textos[IDIOMA_PADRAO];
}

// Textos dos alertas. Cada alerta tem um codigo; aqui vira frase.
const alertas = {
  pt: {
    dev_vendendo: {
      titulo: 'Carteira ligada ao projeto enviando tokens para fora',
      texto: 'Uma carteira que recebeu tokens logo no início da vida do projeto mandou {qtd} ({pct}% do total emitido) para {destino}. Historicamente isso aparece antes de vendas grandes, mas também pode ser pagamento, listagem ou distribuição combinada.',
    },
    emissao_aberta: {
      titulo: 'O projeto ainda pode criar mais tokens',
      texto: 'A autoridade de emissão não foi renunciada: quem controla o contrato pode gerar novos tokens e diluir quem já comprou. Isso é um fato lido do contrato, não uma suposição.',
    },
    congelamento_aberto: {
      titulo: 'O projeto ainda pode congelar carteiras',
      texto: 'A autoridade de congelamento não foi renunciada: quem controla o contrato pode impedir que carteiras negociem. Fato lido do contrato.',
    },
    saida_para_corretora: {
      titulo: 'Volume alto indo para corretoras',
      texto: '{qtd} em tokens foi enviado para carteiras de corretoras identificadas nas últimas 24 horas. Depósito em corretora costuma anteceder venda, mas não é venda por si só.',
    },
    entrada_de_corretora: {
      titulo: 'Volume alto saindo de corretoras',
      texto: '{qtd} em tokens saiu de carteiras de corretoras identificadas nas últimas 24 horas. Normalmente indica gente retirando para guardar, o que reduz a oferta disponível para venda.',
    },
    rajada_saida: {
      titulo: 'Rajada anormal de saídas em poucos minutos',
      texto: 'Registramos {n} saídas grandes em menos de 10 minutos. Concentração assim aparece tanto em ataques a contratos quanto em movimentações programadas do próprio projeto.',
    },
    concentracao: {
      titulo: 'Poucas carteiras movimentam quase tudo',
      texto: 'As {n} maiores carteiras respondem por {pct}% de tudo que se moveu na janela. Quanto mais concentrado, mais o preço depende da decisão de poucas pessoas.',
    },
    token_novo: {
      titulo: 'Token muito recente',
      texto: 'O primeiro par de negociação deste token foi criado há {dias} dias. Projetos novos concentram a maior parte dos casos de puxada de tapete.',
    },
    liquidez_brusca: {
      titulo: 'Liquidez sumiu de uma vez',
      texto: 'A liquidez caiu {pct}% no período que registramos, sendo {maior}% entre duas leituras seguidas. Queda repentina é o formato clássico de puxada de tapete, mas também acontece quando um grande provedor legítimo sai.',
    },
    liquidez_gradual: {
      titulo: 'Liquidez sendo retirada aos poucos',
      texto: 'A liquidez caiu {pct}% ao longo de {quedas} retiradas menores. Saída em pedaços chama menos atenção do que uma retirada única.',
    },
    valores_repetidos: {
      titulo: 'Possível negociação artificial: a mesma quantia repetida',
      texto: 'Nos últimos 7 dias, {n} compras e vendas tiveram exatamente a mesma quantidade (cerca de {valor} cada), feitas por apenas {carteiras} carteira(s), num intervalo de {horas} hora(s). Isso representa {pct}% do volume da semana. Robôs de volume costumam fazer isso para o token parecer mais negociado do que é.',
    },
    vai_e_volta: {
      titulo: 'Possível negociação artificial: a mesma carteira compra e vende',
      texto: 'Uma carteira comprou {compras} vezes e vendeu {vendas} vezes nos últimos 7 dias, movimentando {qtd}. Encontramos {carteiras} carteira(s) com esse comportamento. Comprar e vender de si mesmo infla o volume sem mudar de dono — mas robôs de arbitragem legítimos também agem assim.',
    },
    carteiras_irmas: {
      titulo: 'Carteiras abastecidas pela mesma origem',
      texto: 'Uma mesma carteira distribuiu tokens para {n} carteiras diferentes, e {venderam} delas já venderam (cerca de {qtd}). Parecem investidores independentes, mas a origem comum sugere que podem ser a mesma pessoa ou grupo. Só enxergamos distribuição feita com o próprio token.',
    },
    irmas_projeto: {
      titulo: 'Carteira do projeto abasteceu carteiras que estão vendendo',
      texto: 'Uma carteira ligada ao projeto distribuiu tokens para {n} carteiras, e {venderam} delas já venderam (cerca de {qtd}). É um padrão comum de venda disfarçada: o projeto espalha tokens para vender por várias portas.',
    },
    horario_venda: {
      titulo: 'Vendas sempre no mesmo horário',
      texto: '{quem} vendeu em {dias} dias diferentes, sempre por volta das {hora} ({fuso}), somando {qtd}. Repetição assim costuma indicar venda programada — alguém executando uma estratégia fixa todos os dias.',
    },
    horario_compra: {
      titulo: 'Compras sempre no mesmo horário',
      texto: '{quem} comprou em {dias} dias diferentes, sempre por volta das {hora} ({fuso}), somando {qtd}. Repetição assim costuma indicar compra programada — pode ser acumulação planejada ou robô.',
    },
    donos_concentrados: {
      titulo: 'Poucas carteiras sem identificação guardam muito',
      texto: 'Carteiras sem identificação entre as 10 maiores guardam {pct}% de todos os tokens. Se poucas delas venderem juntas, o preço pode desabar. Parte disso pode ser pool ou cofre do projeto que não conhecemos.',
    },
    liquidez_baixa_confianca: {
      titulo: 'Liquidez baixa demais para confiar no preço',
      texto: 'A liquidez atual é de apenas {liquidez}. Nesse patamar, um único negócio grande pode distorcer bastante o preço de referência, inflando ou reduzindo todos os valores em dólar desta página.',
    },
  },
  en: {
    dev_vendendo: {
      titulo: 'Wallet linked to the project sending tokens out',
      texto: 'A wallet that received tokens early in the project\'s life sent {qtd} ({pct}% of total supply) to {destino}. Historically this shows up before large sales, but it can also be payment, a listing, or an agreed distribution.',
    },
    emissao_aberta: {
      titulo: 'The project can still create more tokens',
      texto: 'The mint authority has not been renounced: whoever controls the contract can issue new tokens and dilute existing holders. This is a fact read from the contract, not a guess.',
    },
    congelamento_aberto: {
      titulo: 'The project can still freeze wallets',
      texto: 'The freeze authority has not been renounced: whoever controls the contract can stop wallets from trading. Fact read from the contract.',
    },
    saida_para_corretora: {
      titulo: 'High volume moving into exchanges',
      texto: '{qtd} worth of tokens was sent to identified exchange wallets in the last 24 hours. Depositing on an exchange often precedes selling, but it is not a sale by itself.',
    },
    entrada_de_corretora: {
      titulo: 'High volume leaving exchanges',
      texto: '{qtd} worth of tokens left identified exchange wallets in the last 24 hours. This usually means people withdrawing to hold, which reduces the supply available to sell.',
    },
    rajada_saida: {
      titulo: 'Unusual burst of outflows within minutes',
      texto: 'We recorded {n} large outflows in under 10 minutes. This kind of clustering appears both in contract exploits and in scheduled moves by the project itself.',
    },
    concentracao: {
      titulo: 'A few wallets move almost everything',
      texto: 'The top {n} wallets account for {pct}% of everything that moved in the window. The more concentrated, the more the price depends on a few people\'s decisions.',
    },
    token_novo: {
      titulo: 'Very recent token',
      texto: 'The first trading pair for this token was created {dias} days ago. New projects account for most rug pull cases.',
    },
    liquidez_brusca: {
      titulo: 'Liquidity vanished in one go',
      texto: 'Liquidity fell {pct}% over the period we recorded, {maior}% of it between two consecutive reads. A sudden drop is the classic shape of a rug pull, but it also happens when a large legitimate provider leaves.',
    },
    liquidez_gradual: {
      titulo: 'Liquidity being withdrawn bit by bit',
      texto: 'Liquidity fell {pct}% across {quedas} smaller withdrawals. Leaving in pieces draws less attention than a single withdrawal.',
    },
    valores_repetidos: {
      titulo: 'Possible fake trading: the same amount over and over',
      texto: 'In the last 7 days, {n} buys and sells had exactly the same size (about {valor} each), made by only {carteiras} wallet(s), within {horas} hour(s). That is {pct}% of the week\'s volume. Volume bots do this to make a token look more traded than it is.',
    },
    vai_e_volta: {
      titulo: 'Possible fake trading: the same wallet buys and sells',
      texto: 'One wallet bought {compras} times and sold {vendas} times in the last 7 days, moving {qtd}. We found {carteiras} wallet(s) behaving like this. Trading with yourself inflates volume without changing owners — though legitimate arbitrage bots also do this.',
    },
    carteiras_irmas: {
      titulo: 'Wallets funded from the same source',
      texto: 'A single wallet sent tokens to {n} different wallets, and {venderam} of them have already sold (about {qtd}). They look like independent investors, but the common source suggests they may be the same person or group. We only see funding done with the token itself.',
    },
    irmas_projeto: {
      titulo: 'Project wallet funded wallets that are now selling',
      texto: 'A wallet linked to the project sent tokens to {n} wallets, and {venderam} of them have already sold (about {qtd}). This is a common disguised-selling pattern: spread tokens out, then sell through many doors.',
    },
    horario_venda: {
      titulo: 'Sales always at the same time',
      texto: '{quem} sold on {dias} different days, always around {hora} ({fuso}), totalling {qtd}. This kind of repetition usually points to scheduled selling — someone running a fixed strategy every day.',
    },
    horario_compra: {
      titulo: 'Buys always at the same time',
      texto: '{quem} bought on {dias} different days, always around {hora} ({fuso}), totalling {qtd}. This kind of repetition usually points to scheduled buying — planned accumulation or a bot.',
    },
    donos_concentrados: {
      titulo: 'A few unidentified wallets hold a lot',
      texto: 'Unidentified wallets among the top 10 hold {pct}% of all tokens. If a few of them sell together, the price can crash. Part of this may be a pool or project treasury we do not know about.',
    },
    liquidez_baixa_confianca: {
      titulo: 'Liquidity too low to trust the price',
      texto: 'Current liquidity is only {liquidez}. At this level, a single large trade can badly distort the reference price, inflating or shrinking every dollar figure on this page.',
    },
  },
};

// Por que cada alerta e INDICIO (e nao fato). Aparece ao lado do selo.
const motivosAlerta = {
  pt: {
    dev_vendendo: 'a ligação da carteira com o projeto é deduzida: ela recebeu tokens de quem criou o contrato.',
    liquidez_brusca: 'medimos a liquidez só quando alguém abre a página; não sabemos quem retirou nem por quê.',
    liquidez_gradual: 'medimos a liquidez só quando alguém abre a página; não sabemos quem retirou nem por quê.',
    saida_para_corretora: 'depositar numa corretora não é vender; é só o passo que costuma vir antes.',
    entrada_de_corretora: 'sacar de uma corretora não é comprar; é o passo que costuma vir depois.',
    rajada_saida: 'a concentração no tempo é real, mas o motivo é leitura nossa.',
    valores_repetidos: 'quantias idênticas e poucas carteiras são o padrão de robôs de volume, mas não provam quem está por trás.',
    vai_e_volta: 'comprar e vender repetidamente é padrão de volume falso, mas robôs de arbitragem legítimos fazem igual.',
    carteiras_irmas: 'a origem comum é fato na blockchain; que sejam a mesma pessoa é dedução.',
    irmas_projeto: 'a ligação da origem com o projeto é deduzida, e o motivo da distribuição também.',
    horario_venda: 'a repetição de horário é fato; que seja estratégia programada é dedução.',
    horario_compra: 'a repetição de horário é fato; que seja estratégia programada é dedução.',
    concentracao: 'mostra quem mais movimentou, não quem mais tem.',
    donos_concentrados: 'os saldos são fato, mas carteiras "sem identificação" podem ser pools ou cofres que não conhecemos.',
    emissao_aberta: 'lido diretamente do contrato.',
    congelamento_aberto: 'lido diretamente do contrato.',
    token_novo: 'data do primeiro par de negociação registrado.',
    liquidez_baixa_confianca: 'a liquidez é medida diretamente na pool; o que é dedução é o quanto isso compromete os preços calculados.',
  },
  en: {
    dev_vendendo: 'the wallet\'s link to the project is inferred: it received tokens from the contract creator.',
    liquidez_brusca: 'we only measure liquidity when someone opens the page; we do not know who withdrew or why.',
    liquidez_gradual: 'we only measure liquidity when someone opens the page; we do not know who withdrew or why.',
    saida_para_corretora: 'depositing on an exchange is not selling; it is the step that usually comes before.',
    entrada_de_corretora: 'withdrawing from an exchange is not buying; it is the step that usually comes after.',
    rajada_saida: 'the clustering is real, but the reason is our reading.',
    valores_repetidos: 'identical amounts and few wallets are the pattern of volume bots, but do not prove who is behind them.',
    vai_e_volta: 'repeated buying and selling is a fake-volume pattern, but legitimate arbitrage bots do the same.',
    carteiras_irmas: 'the common source is an on-chain fact; that they are the same person is inferred.',
    irmas_projeto: 'the source\'s link to the project is inferred, and so is the reason for the distribution.',
    horario_venda: 'the repeated timing is a fact; that it is a scheduled strategy is inferred.',
    horario_compra: 'the repeated timing is a fact; that it is a scheduled strategy is inferred.',
    concentracao: 'shows who moved the most, not who holds the most.',
    donos_concentrados: 'balances are a fact, but "unidentified" wallets may be pools or treasuries we do not know.',
    emissao_aberta: 'read directly from the contract.',
    congelamento_aberto: 'read directly from the contract.',
    token_novo: 'date of the first recorded trading pair.',
    liquidez_baixa_confianca: 'liquidity is measured directly from the pool; how much it undermines the calculated prices is inference.',
  },
};

// Os valores chegam no formato brasileiro ($1.234,56). Em ingles, trocamos
// ponto por virgula ($1,234.56). Porcentagens (1.20) viram 1,20 em portugues.
function ajustarNumero(locale, v) {
  if (typeof v !== 'string') return v;
  if (locale === 'en' && v.startsWith('$')) {
    return v.replace(/[.,]/g, (c) => (c === '.' ? ',' : '.'));
  }
  if (locale !== 'en' && /^\d+\.\d+$/.test(v)) return v.replace('.', ',');
  return v;
}

export function textoAlerta(locale, codigo, valores = {}) {
  const base = (alertas[locale] || alertas.pt)[codigo];
  if (!base) return { titulo: codigo, texto: '' };
  let texto = base.texto;
  for (const [k, v] of Object.entries(valores)) {
    texto = texto.replaceAll(`{${k}}`, ajustarNumero(locale, v));
  }
  texto = texto.replaceAll('{fuso}', t(locale).fuso);
  const motivo = (motivosAlerta[locale] || motivosAlerta.pt)[codigo] || '';
  return { titulo: base.titulo, texto, motivo };
}

/** Motivo curto de um movimento individual, para mostrar ao lado do selo. */
export function motivoMovimento(locale, m, { motivosProjeto, formatarUsd }) {
  const txt = t(locale);
  if (m.confidence === 'confirmado') return null;
  if (m.actor === 'dex') {
    if (m.actor_label === 'Pool de negociação') return txt.motivoPoolPadrao;
    return txt.motivoDexPrograma(m.actor_label || 'DEX');
  }
  if (m.actor === 'projeto') {
    const bruto = motivosProjeto.get(m.from_addr) || motivosProjeto.get(m.to_addr) || '';
    const r = bruto.startsWith('criou') ? txt.motivoProjetoCriador : txt.motivoProjetoRecebeu;
    return txt.motivoProjeto(r);
  }
  if (m.actor === 'baleia') {
    const pct = m.supply_pct ? Number(m.supply_pct).toFixed(2) : null;
    return txt.motivoBaleia(formatarUsd(Number(m.usd_value)), pct);
  }
  if (m.kind === 'transferencia') return txt.motivoTransferencia;
  return txt.motivoDesconhecido;
}
