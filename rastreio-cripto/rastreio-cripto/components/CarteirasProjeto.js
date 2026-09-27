import { t } from '@/lib/dicionario';
import { formatarDataHora, encurtarEndereco, linkExplorador } from '@/lib/formato';

const ACOES = [
  ['venderam', 'acaoVenderam', 'saida'],
  ['paraCorretora', 'acaoParaCorretora', 'saida'],
  ['transferiram', 'acaoTransferiram', 'saida'],
  ['queimaram', 'acaoQueimaram', ''],
  ['compraram', 'acaoCompraram', 'entrada'],
  ['deCorretora', 'acaoDeCorretora', 'entrada'],
  ['receberam', 'acaoReceberam', 'entrada'],
];

/** Secao fixa. Valores em % do total emitido (sem dolar). Janela: 24h/7d/15d. */
export default function CarteirasProjeto({ locale, chain, resumo, motivosProjeto }) {
  const txt = t(locale);
  const { periodos, ultimo, nCarteiras } = resumo;
  const pct = (v) => (v > 0 ? `${v < 0.01 ? '<0,01' : v.toFixed(2)}%` : '—');

  const linhas = ACOES.filter(([k]) => periodos['15d'][k] > 0);

  return (
    <section className="bloco">
      <h2>{txt.projetoTitulo}</h2>
      <p className="sub">{txt.projetoSub}</p>

      {nCarteiras === 0 ? (
        <p className="estado-curto">{txt.projetoNenhuma}</p>
      ) : linhas.length === 0 ? (
        <p className="estado-curto">{txt.projetoParado}</p>
      ) : (
        <div className="rolagem">
          <table className="tabela-resumo">
            <thead>
              <tr>
                <th />
                <th>{txt.periodo24h}</th>
                <th>{txt.periodo7d}</th>
                <th>{txt.periodo15d}</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(([k, rotulo, cor]) => (
                <tr key={k}>
                  <th scope="row" className={cor}>{txt[rotulo]}</th>
                  <td>{pct(periodos['24h'][k])}</td>
                  <td>{pct(periodos['7d'][k])}</td>
                  <td>{pct(periodos['15d'][k])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nCarteiras > 0 && (
        <details className="detalhes">
          <summary>
            {txt.projetoQtd(nCarteiras)}
            {ultimo && ` · ${txt.projetoUltimo}: ${formatarDataHora(ultimo, locale)}`}
          </summary>
          <ul>
            {[...motivosProjeto.entries()].map(([end, motivo]) => (
              <li key={end}>
                <a href={linkExplorador(chain, 'address', end)} target="_blank" rel="noreferrer noopener">
                  {encurtarEndereco(end)}
                </a>{' '}
                — {motivo.startsWith('criou') ? txt.motivoProjetoCriador : txt.motivoProjetoRecebeu}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
