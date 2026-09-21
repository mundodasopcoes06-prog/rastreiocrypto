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
    trocarIdioma: 'English',
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
    trocarIdioma: 'Português',
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
    liquidez_caiu: {
      titulo: 'Liquidez caiu forte em pouco tempo',
      texto: 'A liquidez disponível para negociar caiu {pct}% desde a nossa leitura anterior. Liquidez sumindo é o principal sinal associado a puxada de tapete, mas também acontece quando provedores legítimos retiram fundos.',
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
      texto: 'Este token tem menos de 30 dias de vida. Projetos novos concentram a maior parte dos casos de puxada de tapete.',
    },
  },
  en: {
    dev_vendendo: {
      titulo: 'Wallet linked to the project sending tokens out',
      texto: 'A wallet that received tokens early in the project\'s life sent {qtd} ({pct}% of total supply) to {destino}. Historically this shows up before large sales, but it can also be payment, a listing, or an agreed distribution.',
    },
    liquidez_caiu: {
      titulo: 'Liquidity dropped sharply in a short time',
      texto: 'Liquidity available for trading fell {pct}% since our previous read. Disappearing liquidity is the main signal associated with a rug pull, but it also happens when legitimate providers withdraw funds.',
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
      texto: 'This token is less than 30 days old. New projects account for most rug pull cases.',
    },
  },
};

export function textoAlerta(locale, codigo, valores = {}) {
  const base = (alertas[locale] || alertas.pt)[codigo];
  if (!base) return { titulo: codigo, texto: '' };
  let texto = base.texto;
  for (const [k, v] of Object.entries(valores)) {
    texto = texto.replaceAll(`{${k}}`, v);
  }
  return { titulo: base.titulo, texto };
}
