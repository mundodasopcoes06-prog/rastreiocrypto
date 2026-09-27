// Narrativa (versao rastreio): conta o que os SINAIS dizem, sem dolar.
export function montarNarrativa({ locale, termo, projeto, liquidez }) {
  const en = locale === 'en';
  let manchete;
  if (termo.nivel === 'alto') manchete = en
    ? 'This token raises several attention signals — read them below before deciding anything.'
    : 'Este token acende vários sinais de atenção — leia-os abaixo antes de decidir qualquer coisa.';
  else if (termo.nivel === 'medio') manchete = en
    ? 'This token raises some attention signals worth checking below.'
    : 'Este token acende alguns sinais de atenção que vale conferir abaixo.';
  else manchete = en
    ? 'We found no strong manipulation signals in the window we can read.'
    : 'Não encontramos sinais fortes de manipulação na janela que conseguimos ler.';

  const frases = [];
  if (projeto?.nCarteiras === 0) {
    frases.push(en ? "We could not identify the project's wallets." : 'Não identificamos as carteiras do projeto.');
  }
  if (liquidez && liquidez.tipo && liquidez.tipo !== 'poucos') {
    const v = Math.abs(liquidez.variacao).toFixed(0);
    const m = en
      ? { brusca:`Liquidity dropped ${v}% suddenly.`, gradual:`Liquidity has been falling gradually (${v}%).`, subiu:`Liquidity grew ${v}%.`, estavel:'Liquidity is stable.' }
      : { brusca:`A liquidez caiu ${v}% de forma repentina.`, gradual:`A liquidez vem caindo aos poucos (${v}%).`, subiu:`A liquidez subiu ${v}%.`, estavel:'A liquidez está estável.' };
    frases.push(m[liquidez.tipo]);
  }
  if (termo.altos + termo.medios > 0) frases.push(en
    ? `In total: ${termo.altos} high-level and ${termo.medios} medium-level signals.`
    : `No total: ${termo.altos} sinal(is) de nível alto e ${termo.medios} de nível médio.`);
  return { manchete, paragrafo: frases.join(' ') };
}
