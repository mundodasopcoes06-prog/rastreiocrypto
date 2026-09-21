// ============================================================
// NARRATIVA
// Transforma os numeros ja calculados num paragrafo em linguagem simples.
// Nao calcula nada novo: so conta a historia do que a pagina mostra.
// ============================================================

import { formatarDinheiro } from './formato';

export function montarNarrativa({ locale, periodos, projeto, raio7d, liquidez }) {
  const en = locale === 'en';
  const $ = (n) => formatarDinheiro(n, locale);
  const b = periodos['24h'];
  const s = periodos['7d'];

  // 1) Manchete: o que aconteceu nas ultimas 24 horas
  let manchete;
  if (b.nCompras + b.nVendas === 0) {
    manchete = en ? 'No buying or selling in the last 24 hours.' : 'Nenhuma compra ou venda nas últimas 24 horas.';
  } else if (b.pctCompra > 58) {
    manchete = en
      ? `More buying than selling: ${$(b.compras)} bought against ${$(b.vendas)} sold in the last 24 hours.`
      : `Mais compra que venda: ${$(b.compras)} em compras contra ${$(b.vendas)} em vendas nas últimas 24 horas.`;
  } else if (b.pctVenda > 58) {
    manchete = en
      ? `More selling than buying: ${$(b.vendas)} sold against ${$(b.compras)} bought in the last 24 hours.`
      : `Mais venda que compra: ${$(b.vendas)} em vendas contra ${$(b.compras)} em compras nas últimas 24 horas.`;
  } else {
    manchete = en
      ? `Buying and selling are balanced: ${$(b.compras)} bought and ${$(b.vendas)} sold in the last 24 hours.`
      : `Compra e venda equilibradas: ${$(b.compras)} em compras e ${$(b.vendas)} em vendas nas últimas 24 horas.`;
  }

  const frases = [];

  // 2) A semana
  if (s.nCompras + s.nVendas > 0) {
    const liq = s.liquido;
    frases.push(en
      ? `Over 7 days the balance is ${liq >= 0 ? 'positive' : 'negative'} by ${$(Math.abs(liq))}.`
      : `Na semana, o saldo está ${liq >= 0 ? 'positivo' : 'negativo'} em ${$(Math.abs(liq))}.`);
  }

  // 3) Carteiras do projeto
  const p = projeto.periodos['7d'];
  if (projeto.nCarteiras === 0) {
    frases.push(en ? 'We could not identify the project\'s wallets.' : 'Não identificamos as carteiras do projeto.');
  } else if (p.n === 0) {
    frases.push(en ? 'Project wallets did not move tokens this week.' : 'As carteiras do projeto não movimentaram tokens nesta semana.');
  } else {
    const partes = [];
    const add = (v, pt, ing) => { if (v > 0) partes.push(en ? `${ing} ${$(v)}` : `${pt} ${$(v)}`); };
    add(p.venderam, 'venderam', 'sold');
    add(p.paraCorretora, 'mandaram para corretoras', 'sent to exchanges');
    add(p.transferiram, 'passaram para outras carteiras', 'passed to other wallets');
    add(p.queimaram, 'queimaram', 'burned');
    add(p.compraram, 'compraram', 'bought');
    add(p.receberam + p.deCorretora, 'receberam', 'received');
    if (partes.length) {
      frases.push(en
        ? `This week, project wallets ${juntar(partes, 'and')}.`
        : `Nesta semana, as carteiras do projeto ${juntar(partes, 'e')}.`);
    }
  }

  // 4) Corretoras (so cita o que teve valor)
  const c = raio7d.corretoras;
  if (c.compras > 0 && c.vendas > 0) {
    frases.push(en
      ? `At identified exchanges, withdrawals added up to ${$(c.compras)} and deposits to ${$(c.vendas)} this week.`
      : `Nas corretoras identificadas, os saques somaram ${$(c.compras)} e os depósitos ${$(c.vendas)} na semana.`);
  } else if (c.vendas > 0) {
    frases.push(en
      ? `${$(c.vendas)} was deposited into identified exchanges this week, with no withdrawals.`
      : `Foram depositados ${$(c.vendas)} em corretoras identificadas na semana, sem saques.`);
  } else if (c.compras > 0) {
    frases.push(en
      ? `${$(c.compras)} was withdrawn from identified exchanges this week, with no deposits.`
      : `Foram sacados ${$(c.compras)} de corretoras identificadas na semana, sem depósitos.`);
  }

  // 5) Carteiras grandes sem nome
  const g = raio7d.grandes;
  if (g.compras > 0 || g.vendas > 0) {
    const partes = [];
    if (g.compras > 0) partes.push(en ? `bought ${$(g.compras)}` : `compraram ${$(g.compras)}`);
    if (g.vendas > 0) partes.push(en ? `sold ${$(g.vendas)}` : `venderam ${$(g.vendas)}`);
    frases.push(en
      ? `Large unidentified wallets ${partes.join(' and ')}.`
      : `Carteiras grandes sem identificação ${partes.join(' e ')}.`);
  }

  // 6) Liquidez
  if (liquidez.tipo !== 'poucos') {
    const v = Math.abs(liquidez.variacao).toFixed(0);
    const agora = $(liquidez.ultimo);
    const mapa = en
      ? { brusca: `Liquidity dropped ${v}% suddenly and is now ${agora}.`,
          gradual: `Liquidity has been falling gradually (${v}%) and is now ${agora}.`,
          subiu: `Liquidity grew ${v}% and is now ${agora}.`,
          estavel: `Liquidity is stable at ${agora}.` }
      : { brusca: `A liquidez caiu ${v}% de forma repentina e está em ${agora}.`,
          gradual: `A liquidez vem caindo aos poucos (${v}%) e está em ${agora}.`,
          subiu: `A liquidez subiu ${v}% e está em ${agora}.`,
          estavel: `A liquidez está estável em ${agora}.` };
    frases.push(mapa[liquidez.tipo]);
  }

  return { manchete, paragrafo: frases.join(' ') };
}

function juntar(lista, e) {
  if (lista.length <= 1) return lista.join('');
  return `${lista.slice(0, -1).join(', ')} ${e} ${lista[lista.length - 1]}`;
}
