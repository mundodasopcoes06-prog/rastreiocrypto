import { t, motivoMovimento } from '@/lib/dicionario';
import {
  formatarNumero,
  formatarDinheiro,
  formatarDataHora,
  tempoRelativo,
  encurtarEndereco,
  linkExplorador,
} from '@/lib/formato';

const NOMES_ATOR = {
  corretora: 'atorCorretora',
  dex: 'atorDex',
  projeto: 'atorProjeto',
  baleia: 'atorBaleia',
  queima: 'atorQueima',
  desconhecido: 'atorDesconhecido',
};

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
              const tipo =
                m.kind === 'compra' ? txt.tipoCompra
                : m.kind === 'venda' ? txt.tipoVenda
                : txt.tipoTransferencia;
              const motivo = motivoMovimento(locale, m, contexto);

              return (
                <tr key={`${m.tx_hash}-${m.id}`}>
                  <td className="hora">
                    {formatarDataHora(m.ts, locale)}
                    <small>{tempoRelativo(m.ts, locale)}</small>
                  </td>

                  <td>
                    <span className={`etiqueta-tipo ${m.kind}`}>{tipo}</span>
                  </td>

                  <td>
                    <span className="quem-nome">
                      {m.actor_label || txt[NOMES_ATOR[m.actor] || 'atorDesconhecido']}{' '}
                      <span className={`selo ${m.confidence === 'confirmado' ? 'selo-confirmado' : 'selo-indicio'}`}>
                        {m.confidence === 'confirmado' ? txt.explicaFato : txt.explicaIndicio}
                      </span>
                    </span>
                    {motivo && <span className="motivo-linha">{motivo}</span>}
                    <a
                      className="quem-end"
                      href={linkExplorador(m.chain, 'address', m.counterparty || m.from_addr)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {encurtarEndereco(m.counterparty || m.from_addr)}
                    </a>
                  </td>

                  <td className="num">
                    {formatarNumero(Number(m.amount), locale)} {simbolo || ''}
                  </td>

                  <td className="num">{formatarDinheiro(Number(m.usd_value), locale)}</td>

                  <td className="num">
                    {m.supply_pct ? `${Number(m.supply_pct).toFixed(3)}%` : '—'}
                  </td>

                  <td className="num">
                    <a
                      href={linkExplorador(m.chain, 'tx', m.tx_hash)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
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
