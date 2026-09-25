import { t } from '@/lib/dicionario';
import { formatarDinheiro, formatarDataHora, encurtarEndereco, linkExplorador } from '@/lib/formato';

const ACOES = [
  ['venderam', 'acaoVenderam', 'saida'],
  ['paraCorretora', 'acaoParaCorretora', 'saida'],
  ['transferiram', 'acaoTransferiram', 'saida'],
  ['queimaram', 'acaoQueimaram', ''],
  ['compraram', 'acaoCompraram', 'entrada'],
  ['deCorretora', 'acaoDeCorretora', 'entrada'],
  ['receberam', 'acaoReceberam', 'entrada'],
];

/** Secao fixa: aparece sempre, mesmo quando o projeto nao fez nada. */
export default function CarteirasProjeto({ locale, chain, resumo, motivosProjeto }) {
  const txt = t(locale);
  const { periodos, qtd = {}, ultimo, nCarteiras } = resumo;
  const $ = (n) => (n > 0 ? formatarDinheiro(n, locale) : '—');
  const houve = (p, k) => (qtd[p]?.[k] ?? periodos[p]?.[k] ?? 0) > 0;

  // So mostramos as linhas que tiveram algum movimento em 15 dias
  // (pela quantidade de tokens: vale mesmo quando o preco esta oculto).
  const linhas = ACOES.filter(([k]) => houve('15d', k));

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
                  <td>{$(periodos['24h'][k])}</td>
                  <td>{$(periodos['7d'][k])}</td>
                  <td>{$(periodos['15d'][k])}</td>
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
