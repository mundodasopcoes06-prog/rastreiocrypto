'use client';

import { useState } from 'react';
import { t } from '@/lib/dicionario';

// Raio-X sem dolar: mostra, por tipo de carteira, quanto ENTROU e quanto
// SAIU medido em % do total emitido, com o numero de operacoes.
// Corretora: "entradas" = saques; "saidas" = depositos.
const LINHAS = [
  ['corretoras', 'catProjeto'], // rotulos abaixo sao sobrescritos por chaves proprias
];

const CATS = [
  ['projeto', 'catProjeto', 'catProjetoAjuda'],
  ['grandes', 'catGrandes', 'catGrandesAjuda'],
  ['demais', 'catDemais', 'catDemaisAjuda'],
  ['corretoras', 'cexTitulo', null],
];

export default function RaioX({ locale, periodos }) {
  const txt = t(locale);
  const [aba, setAba] = useState('7d');
  const r = periodos[aba];
  const nomes = { '24h': txt.periodo24h, '7d': txt.periodo7d, '15d': txt.periodo15d };

  const vazio = CATS.every(([k]) => r[k].nEntram + r[k].nSaem === 0);
  const fmtPct = (v) => (v > 0 ? `${v < 0.01 ? '<0,01' : v.toFixed(2)}%` : '—');
  const maior = Math.max(0.0001, ...CATS.flatMap(([k]) => [r[k].entram, r[k].saem]));

  return (
    <section className="bloco">
      <h2>{txt.raioTitulo}</h2>
      <p className="sub">{txt.raioSub}</p>
      <p className="ajuda">{txt.raioMedida}</p>

      <div className="abas" role="tablist">
        {['24h', '7d', '15d'].map((k) => (
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
                <th>{txt.raioEntradas}</th>
                <th>{txt.raioSaidas}</th>
              </tr>
            </thead>
            <tbody>
              {CATS.map(([k, nome, ajuda]) => {
                const l = r[k];
                if (l.nEntram + l.nSaem === 0) return null;
                return (
                  <tr key={k}>
                    <th scope="row">
                      {txt[nome]}
                      {ajuda && <small>{txt[ajuda]}</small>}
                    </th>
                    <td>
                      <span className="barrinha entrada" style={{ width: `${(l.entram / maior) * 100}%` }} />
                      {fmtPct(l.entram)} <small>({l.nEntram})</small>
                    </td>
                    <td>
                      <span className="barrinha saida" style={{ width: `${(l.saem / maior) * 100}%` }} />
                      {fmtPct(l.saem)} <small>({l.nSaem})</small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
