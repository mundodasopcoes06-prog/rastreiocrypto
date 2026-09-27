'use client';
import { useState } from 'react';
import { t } from '@/lib/dicionario';
import { formatarNumero } from '@/lib/formato';

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
  const maior = Math.max(1e-12, ...LINHAS.flatMap(([k]) => [r[k].comprasQtd || 0, r[k].vendasQtd || 0]));
  const qt = (n) => formatarNumero(Number(n) || 0, locale);

  return (
    <section className="bloco">
      <h2>{txt.raioTitulo}</h2>
      <p className="sub">{txt.raioSub}</p>
      <p className="ajuda">{txt.raioMedida}</p>
      <div className="abas" role="tablist">
        {['24h', '7d', '15d'].map((k) => (
          <button key={k} className="aba" role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>{nomes[k]}</button>
        ))}
      </div>
      {vazio ? (
        <p className="estado-curto">{txt.raioVazio}</p>
      ) : (
        <div className="rolagem">
          <table className="tabela-resumo raio">
            <thead>
              <tr><th>{txt.raioCategoria}</th><th>{txt.raioEntradas}</th><th>{txt.raioSaidas}</th></tr>
            </thead>
            <tbody>
              {LINHAS.map(([k, nome, ajuda]) => {
                const l = r[k];
                if (l.nCompras + l.nVendas === 0) return null;
                return (
                  <tr key={k}>
                    <th scope="row">{txt[nome]}<small>{txt[ajuda]}</small></th>
                    <td><span className="barrinha entrada" style={{ width: `${((l.comprasQtd || 0) / maior) * 100}%` }} />{qt(l.comprasQtd)} <small>({l.nCompras})</small></td>
                    <td><span className="barrinha saida" style={{ width: `${((l.vendasQtd || 0) / maior) * 100}%` }} />{qt(l.vendasQtd)} <small>({l.nVendas})</small></td>
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
          <p>{txt.raioCorretorasTexto(qt(c.comprasQtd), c.nCompras, qt(c.vendasQtd), c.nVendas)}</p>
        </div>
      )}
    </section>
  );
}
