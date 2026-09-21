'use client';

import { useState } from 'react';
import { t } from '@/lib/dicionario';
import { formatarDinheiro } from '@/lib/formato';

/**
 * Mostra o balanco de compras e vendas em 24h, 7 dias e 30 dias,
 * mais um grafico de barras por dia.
 * Todos os numeros ja vem calculados do servidor.
 */
export default function Balanco({ locale, periodos, serieDiaria }) {
  const txt = t(locale);
  const [aba, setAba] = useState('24h');

  const nomes = { '24h': txt.periodo24h, '7d': txt.periodo7d, '30d': txt.periodo30d };
  const b = periodos[aba];

  const maior = Math.max(
    1,
    ...serieDiaria.map((d) => Math.max(d.compras, d.vendas))
  );

  // O grafico acompanha a aba escolhida.
  const dias = aba === '24h' ? 7 : aba === '7d' ? 7 : 30;
  const serie = serieDiaria.slice(-dias);

  return (
    <section className="bloco">
      <h2>{txt.periodoTitulo}</h2>
      <p className="sub">{txt.periodoAjuda}</p>

      <div className="abas" role="tablist">
        {['24h', '7d', '30d'].map((k) => (
          <button
            key={k}
            className="aba"
            role="tab"
            aria-selected={aba === k}
            onClick={() => setAba(k)}
          >
            {nomes[k]}
          </button>
        ))}
      </div>

      <BalancaBarra locale={locale} balanco={b} />

      <div className="grafico" aria-hidden="true">
        {serie.map((d) => (
          <div className="grafico-dia" key={d.dia} title={d.dia}>
            <div
              className="grafico-venda"
              style={{ height: `${(d.vendas / maior) * 50}%` }}
            />
            <div
              className="grafico-compra"
              style={{ height: `${(d.compras / maior) * 50}%` }}
            />
          </div>
        ))}
      </div>
      <div className="grafico-legenda">
        <span>{serie[0]?.dia}</span>
        <span>{serie[serie.length - 1]?.dia}</span>
      </div>
    </section>
  );
}

export function BalancaBarra({ locale, balanco }) {
  const txt = t(locale);
  const temDados = balanco.compras + balanco.vendas > 0;

  return (
    <div className="balanca">
      <div
        className="balanca-barra"
        role="img"
        aria-label={`${txt.saldoCompras} ${balanco.pctCompra.toFixed(0)}%, ${txt.saldoVendas} ${balanco.pctVenda.toFixed(0)}%`}
      >
        {temDados ? (
          <>
            <div className="balanca-lado balanca-compra" style={{ width: `${balanco.pctCompra}%` }}>
              {balanco.pctCompra >= 18 && `${balanco.pctCompra.toFixed(0)}%`}
            </div>
            <div className="balanca-lado balanca-venda" style={{ width: `${balanco.pctVenda}%` }}>
              {balanco.pctVenda >= 18 && `${balanco.pctVenda.toFixed(0)}%`}
            </div>
          </>
        ) : (
          <div className="balanca-vazia" />
        )}
      </div>

      <div className="balanca-legenda">
        <span>
          {txt.saldoCompras}: <strong>{formatarDinheiro(balanco.compras, locale)}</strong>{' '}
          ({balanco.nCompras})
        </span>
        <span>
          {txt.saldoVendas}: <strong>{formatarDinheiro(balanco.vendas, locale)}</strong>{' '}
          ({balanco.nVendas})
        </span>
      </div>
    </div>
  );
}
