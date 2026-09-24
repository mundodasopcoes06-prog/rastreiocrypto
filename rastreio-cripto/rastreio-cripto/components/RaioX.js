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

export default function RaioX({ locale, periodos }) {
  const txt = t(locale);
  const [aba, setAba] = useState('7d');
  const r = periodos[aba];
  const nomes = { '24h': txt.periodo24h, '7d': txt.periodo7d, '30d': txt.periodo30d };
  const vazio = LINHAS.every(([k]) => r[k].nCompras + r[k].nVendas === 0);
  const c = r.corretoras;
  const temCorretoras = c && c.nCompras + c.nVendas > 0;

  // Maior valor da tabela: define o tamanho das barrinhas.
  const maior = Math.max(1, ...LINHAS.flatMap(([k]) => [r[k].compras, r[k].vendas]));

  return (
    <section className="bloco">
      <h2>{txt.raioTitulo}</h2>
      <p className="sub">{txt.raioSub}</p>

      <div className="abas" role="tablist">
        {['24h', '7d', '30d'].map((k) => (
          <button key={k} className="aba" role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>
            {nomes[k]}
          </button>
        ))}
      </div>

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
                const saldo = l.compras - l.vendas;
                return (
                  <tr key={k}>
                    <th scope="row">
                      {txt[nome]}
                      <small>{txt[ajuda]}</small>
                    </th>
                    <td>
                      <span className="barrinha entrada" style={{ width: `${(l.compras / maior) * 100}%` }} />
                      {formatarDinheiro(l.compras, locale)} <small>({l.nCompras})</small>
                    </td>
                    <td>
                      <span className="barrinha saida" style={{ width: `${(l.vendas / maior) * 100}%` }} />
                      {formatarDinheiro(l.vendas, locale)} <small>({l.nVendas})</small>
                    </td>
                    <td className={saldo > 0 ? 'entrada' : saldo < 0 ? 'saida' : ''}>
                      {saldo > 0 ? '+' : saldo < 0 ? '−' : ''}{formatarDinheiro(Math.abs(saldo), locale)}
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
