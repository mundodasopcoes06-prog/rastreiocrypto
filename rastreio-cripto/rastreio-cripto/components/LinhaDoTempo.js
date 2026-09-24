import { t, motivoMovimento } from '@/lib/dicionario';
import {
  formatarNumero,
  formatarDinheiro,
  formatarDataHora,
  tempoRelativo,
  encurtarEndereco,
  linkExplorador,
} from '@/lib/formato';

/**
 * Traduz um movimento da blockchain no que ele realmente foi.
 * Compra e venda so existem em pools (DEX). Corretora e saque ou
 * deposito. O resto e transferencia entre carteiras.
 */
function descrever(m, txt) {
  const nomeLocal = !m.actor_label || m.actor_label === 'Pool de negociação'
    ? txt.localPoolDesconhecida
    : m.actor_label.replace(/^Pool\s+/i, '');

  if (m.actor === 'dex') {
    if (m.kind === 'compra') return { tipo: txt.tipoCompraDex, classe: 'compra', modelo: txt.movCompraDex, a: m.counterparty, local: nomeLocal };
    if (m.kind === 'venda') return { tipo: txt.tipoVendaDex, classe: 'venda', modelo: txt.movVendaDex, a: m.counterparty, local: nomeLocal };
    return { tipo: txt.tipoTrocaDex, classe: 'neutro', modelo: txt.movTrocaDex, a: m.from_addr, local: nomeLocal };
  }
  if (m.actor === 'corretora') {
    if (m.kind === 'compra') return { tipo: txt.tipoSaque, classe: 'saque', modelo: txt.movSaque, a: m.to_addr, local: m.actor_label };
    return { tipo: txt.tipoDeposito, classe: 'deposito', modelo: txt.movDeposito, a: m.from_addr, local: m.actor_label };
  }
  if (m.actor === 'queima') {
    return { tipo: txt.tipoMovQueima, classe: 'neutro', modelo: txt.movQueima, a: m.from_addr };
  }
  if (m.actor === 'projeto') {
    if (m.kind === 'venda') return { tipo: txt.tipoEnvioProjeto, classe: 'projeto', modelo: txt.movEnvioProjeto, a: m.from_addr, b: m.to_addr };
    return { tipo: txt.tipoRecebeProjeto, classe: 'projeto', modelo: txt.movRecebeProjeto, a: m.from_addr, b: m.to_addr };
  }
  return { tipo: txt.tipoTransferencia, classe: 'neutro', modelo: txt.movTransferencia, a: m.from_addr, b: m.to_addr };
}

function Endereco({ chain, endereco }) {
  if (!endereco) return <span>—</span>;
  return (
    <a className="quem-end-inline" href={linkExplorador(chain, 'address', endereco)} target="_blank" rel="noreferrer noopener">
      {encurtarEndereco(endereco)}
    </a>
  );
}

/** Monta a frase trocando {a}, {b} e {local} por links e nomes. */
function Frase({ modelo, chain, a, b, local }) {
  const partes = modelo.split(/(\{a\}|\{b\}|\{local\})/);
  return (
    <span className="frase-mov">
      {partes.map((p, i) => {
        if (p === '{a}') return <Endereco key={i} chain={chain} endereco={a} />;
        if (p === '{b}') return <Endereco key={i} chain={chain} endereco={b} />;
        if (p === '{local}') return <strong key={i}>{local}</strong>;
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}

export default function LinhaDoTempo({ locale, movimentos, simbolo, motivosProjeto }) {
  const txt = t(locale);
  const contexto = { motivosProjeto: motivosProjeto || new Map(), formatarUsd: (n) => formatarDinheiro(n, locale) };

  return (
    <section className="bloco">
      <h2>{txt.movimentosTitulo}</h2>
      <p className="sub">{txt.movimentosAjuda}</p>

      <div className="rolagem">
        <table className="movimentos">
          <thead>
            <tr>
              <th>{txt.colunaHora}</th>
              <th>{txt.colunaTipo}</th>
              <th>{txt.colunaQuem}</th>
              <th>{txt.colunaQuanto}</th>
              <th>{txt.colunaValor}</th>
              <th>{txt.colunaSupply}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {movimentos.map((m) => {
              const d = descrever(m, txt);
              const motivo = motivoMovimento(locale, m, contexto);

              return (
                <tr key={`${m.tx_hash}-${m.id}`}>
                  <td className="hora">
                    {formatarDataHora(m.ts, locale)}
                    <small>{tempoRelativo(m.ts, locale)}</small>
                  </td>

                  <td>
                    <span className={`etiqueta-tipo ${d.classe}`}>{d.tipo}</span>
                  </td>

                  <td>
                    <Frase modelo={d.modelo} chain={m.chain} a={d.a} b={d.b} local={d.local} />{' '}
                    <span className={`selo ${m.confidence === 'confirmado' ? 'selo-confirmado' : 'selo-indicio'}`}>
                      {m.confidence === 'confirmado' ? txt.explicaFato : txt.explicaIndicio}
                    </span>
                    {motivo && <span className="motivo-linha">{motivo}</span>}
                  </td>

                  <td className="num">
                    {formatarNumero(Number(m.amount), locale)} {simbolo || ''}
                  </td>

                  <td className="num">
                    {formatarDinheiro(m.usd_value === null || m.usd_value === undefined ? null : Number(m.usd_value), locale)}
                  </td>

                  <td className="num">
                    {m.supply_pct ? `${Number(m.supply_pct).toFixed(3)}%` : '—'}
                  </td>

                  <td className="num">
                    <a href={linkExplorador(m.chain, 'tx', m.tx_hash)} target="_blank" rel="noreferrer noopener">
                      {txt.verNoExplorador}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
