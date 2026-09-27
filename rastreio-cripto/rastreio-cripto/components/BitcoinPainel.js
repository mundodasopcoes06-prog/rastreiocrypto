'use client';

import { useState } from 'react';
import { t } from '@/lib/dicionario';
import { formatarNumero, formatarDataHora, encurtarEndereco } from '@/lib/formato';

const CAT = { entrada_corretora: 'btcCatEntrada', saida_corretora: 'btcCatSaida', transferencia_grande: 'btcCatTransf' };
const linkBtc = (tipo, v) => `https://mempool.space/${tipo === 'tx' ? 'tx' : 'address'}/${v}`;

export default function BitcoinPainel({ locale, dados }) {
  const txt = t(locale);
  const [aba, setAba] = useState('24h');
  const nomes = { '24h': txt.periodo24h, '7d': txt.periodo7d, '15d': txt.periodo15d };
  const f = dados.corretoras[aba];
  const maiores = [...(dados.movimentos||[])].sort((a,b)=>Number(b.amount_btc)-Number(a.amount_btc)).slice(0,30);
  const btc = (n) => `${formatarNumero(n, locale)} BTC`;

  return (
    <>
      <section className="bloco">
        <h2>{txt.btcFluxoTitulo}</h2>
        <div className="abas" role="tablist">
          {['24h', '7d', '15d'].map((k) => (
            <button key={k} className="aba" role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>
              {nomes[k]}
            </button>
          ))}
        </div>
        <div className="ficha" style={{ marginTop: '1rem' }}>
          <div><span>{txt.btcEntrada}</span><strong className="saida">{btc(f.entrada)} <small>({f.nEntrada})</small></strong></div>
          <div><span>{txt.btcSaida}</span><strong className="entrada">{btc(f.saida)} <small>({f.nSaida})</small></strong></div>
          <div><span>{txt.btcLiquido}</span>
            <strong className={f.liquido > 0 ? 'saida' : f.liquido < 0 ? 'entrada' : ''}>
              {f.liquido > 0 ? '+' : f.liquido < 0 ? '−' : ''}{btc(Math.abs(f.liquido))}
            </strong>
          </div>
        </div>
        <p className="ajuda" style={{ marginTop: '1rem' }}>{txt.btcLiquidoAjuda}</p>
      </section>

      <section className="bloco">
        <h2>{txt.btcMovimentosTitulo}</h2>
        {maiores.length === 0 ? (
          <p className="estado-curto">{txt.btcVazio}</p>
        ) : (
          <div className="rolagem">
            <table className="movimentos">
              <thead>
                <tr>
                  <th>{txt.btcColHora}</th>
                  <th>{txt.btcColTipo}</th>
                  <th>{txt.btcColQtd}</th>
                  <th>{txt.btcColDe}</th>
                  <th>{txt.btcColPara}</th>
                </tr>
              </thead>
              <tbody>
                {maiores.map((m) => (
                  <tr key={`${m.tx_hash}-${m.id}`}>
                    <td className="hora">{formatarDataHora(m.ts, locale)}</td>
                    <td><span className={`etiqueta-tipo ${m.categoria === 'saida_corretora' ? 'saque' : m.categoria === 'entrada_corretora' ? 'deposito' : 'neutro'}`}>{txt[CAT[m.categoria]]}</span></td>
                    <td className="num">{formatarNumero(Number(m.amount_btc), locale)} BTC</td>
                    <td>{m.from_label || (m.from_addr ? <a href={linkBtc('address', m.from_addr)} target="_blank" rel="noreferrer noopener">{encurtarEndereco(m.from_addr)}</a> : '—')}</td>
                    <td>{m.to_label || (m.to_addr ? <a href={linkBtc('address', m.to_addr)} target="_blank" rel="noreferrer noopener">{encurtarEndereco(m.to_addr)}</a> : '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="ajuda" style={{ marginTop: '1rem' }}>{txt.btcAviso}</p>
      </section>
    </>
  );
}
