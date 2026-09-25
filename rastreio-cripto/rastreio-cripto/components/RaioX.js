'use client';

import { useState } from 'react';
import { t } from '@/lib/dicionario';
import { formatarDinheiro } from '@/lib/formato';

// Corretoras ficam FORA desta tabela: saque e deposito nao sao compra nem
// venda. Elas aparecem num quadro proprio logo abaixo.
const LINHAS = [
  ['projeto', 'catProjeto', 'catProjetoAjuda'],
  ['grandes', 'catGrandes', 'catGrandesAjuda'],
  ['demais', 'catDemais', 'catDemaisAjuda'],
];

export default function RaioX({ locale, periodos, completos = {}, desdeTexto = null }) {
  const txt = t(locale);
  const [aba, setAba] = useState('7d');
  const r = periodos[aba];
  const nomes = { '24h': txt.periodo24h, '7d': txt.periodo7d, '15d': txt.periodo15d };
  const vazio = LINHAS.every(([k]) => r[k].nCompras + r[k].nVendas === 0);
  const c = r.corretoras;
  const temCorretoras = c && c.nCompras + c.nVendas > 0;

  // Maior quantidade da tabela: define o tamanho das barrinhas (vale mesmo sem preco).
  const maior = Math.max(1e-12, ...LINHAS.flatMap(([k]) => [r[k].comprasQtd || 0, r[k].vendasQtd || 0]));

  return (
    <section className="bloco">
      <h2>{txt.raioTitulo}</h2>
      <p className="sub">{txt.raioSub}</p>

      <div className="abas" role="tablist">
        {['24h', '7d', '15d'].map((k) => (
          <button key={k} className="aba" role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>
            {nomes[k]}
          </button>
        ))}
      </div>

      {completos[aba] === false && desdeTexto && (
        <p className="periodo-incompleto">{txt.periodoIncompleto(desdeTexto)}</p>
      )}

      {vazio ? (
        <p className="estado-curto">{txt.raioVazio}</p>
      ) : (
        <div className="rolagem">
          <table className="tabela-resumo raio">
            <thead>
              <tr>
                <th>{txt.raioCategoria}</th>
                <th>{txt.saldoCompras}</th>
                <th>{txt.saldoVendas}</th>
                <th>{txt.raioSaldo}</th>
              </tr>
            </thead>
            <tbody>
              {LINHAS.map(([k, nome, ajuda]) => {
                const l = r[k];
                const saldo = l.compras == null || l.vendas == null ? null : l.compras - l.vendas;
                return (
                  <tr key={k}>
                    <th scope="row">
                      {txt[nome]}
                      <small>{txt[ajuda]}</small>
                    </th>
                    <td>
                      <span className="barrinha entrada" style={{ width: `${((l.comprasQtd || 0) / maior) * 100}%` }} />
                      {formatarDinheiro(l.compras, locale)} <small>({l.nCompras})</small>
                    </td>
                    <td>
                      <span className="barrinha saida" style={{ width: `${((l.vendasQtd || 0) / maior) * 100}%` }} />
                      {formatarDinheiro(l.vendas, locale)} <small>({l.nVendas})</small>
                    </td>
                    <td className={saldo > 0 ? 'entrada' : saldo < 0 ? 'saida' : ''}>
                      {saldo == null ? '—' : <>{saldo > 0 ? '+' : saldo < 0 ? '−' : ''}{formatarDinheiro(Math.abs(saldo), locale)}</>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {temCorretoras && (
        <div className="raio-corretoras">
          <strong>{txt.raioCorretorasTitulo}</strong>
          <p>
            {txt.raioCorretorasTexto(
              formatarDinheiro(c.compras, locale), c.nCompras,
              formatarDinheiro(c.vendas, locale), c.nVendas
            )}
          </p>
        </div>
      )}
    </section>
  );
}
