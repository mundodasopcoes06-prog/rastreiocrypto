// ============================================================
// NARRATIVA (versao "rastreio")
// Conta em uma frase o que os SINAIS dizem. Nao usa preco nem
// compra/venda em dolar. Recebe tudo ja calculado.
// ============================================================

export function montarNarrativa({ locale, termo, projeto, liquidez }) {
  const en = locale === 'en';

  let manchete;
  if (termo.nivel === 'alto') {
    manchete = en
      ? 'This token raises several attention signals — read them below before deciding anything.'
      : 'Este token acende vários sinais de atenção — leia-os abaixo antes de decidir qualquer coisa.';
  } else if (termo.nivel === 'medio') {
    manchete = en
      ? 'This token raises some attention signals worth checking below.'
      : 'Este token acende alguns sinais de atenção que vale conferir abaixo.';
  } else {
    manchete = en
      ? 'We found no strong manipulation signals in the window we can read.'
      : 'Não encontramos sinais fortes de manipulação na janela que conseguimos ler.';
  }

  const frases = [];

  // Atividade das carteiras do projeto (em % do total emitido)
  const p = projeto?.periodos?.['7d'];
  if (projeto?.nCarteiras === 0) {
    frases.push(en ? 'We could not identify the project\'s wallets.' : 'Não identificamos as carteiras do projeto.');
  } else if (p && p.n > 0) {
    const saiu = (p.venderam || 0) + (p.paraCorretora || 0) + (p.transferiram || 0) + (p.queimaram || 0);
    const entrou = (p.compraram || 0) + (p.deCorretora || 0) + (p.receberam || 0);
    const f = (v) => `${v < 0.01 ? '<0,01' : v.toFixed(2)}%`;
    if (saiu > 0 && saiu >= entrou) {
      frases.push(en
        ? `This week the project wallets moved out about ${f(saiu)} of total supply.`
        : `Nesta semana, as carteiras do projeto tiraram cerca de ${f(saiu)} do total emitido.`);
    } else if (entrou > 0) {
      frases.push(en
        ? `This week the project wallets took in about ${f(entrou)} of total supply.`
        : `Nesta semana, as carteiras do projeto receberam cerca de ${f(entrou)} do total emitido.`);
    }
  }

  // Liquidez
  if (liquidez && liquidez.tipo && liquidez.tipo !== 'poucos') {
    const v = Math.abs(liquidez.variacao).toFixed(0);
    const mapa = en
      ? { brusca: `Liquidity dropped ${v}% suddenly.`, gradual: `Liquidity has been falling gradually (${v}%).`,
          subiu: `Liquidity grew ${v}%.`, estavel: 'Liquidity is stable.' }
      : { brusca: `A liquidez caiu ${v}% de forma repentina.`, gradual: `A liquidez vem caindo aos poucos (${v}%).`,
          subiu: `A liquidez subiu ${v}%.`, estavel: 'A liquidez está estável.' };
    frases.push(mapa[liquidez.tipo]);
  }

  // Resumo dos sinais
  if (termo.altos + termo.medios > 0) {
    frases.push(en
      ? `In total: ${termo.altos} high-level and ${termo.medios} medium-level signals.`
      : `No total: ${termo.altos} sinal(is) de nível alto e ${termo.medios} de nível médio.`);
  }

  return { manchete, paragrafo: frases.join(' ') };
}
