import { t } from '@/lib/dicionario';
import { encurtarEndereco, linkExplorador, tempoRelativo } from '@/lib/formato';

const NOME_TIPO = {
  pool: 'tipoPool',
  corretora: 'tipoCorretora',
  queima: 'tipoQueima',
  projeto: 'tipoProjeto',
  desconhecido: 'tipoDesconhecido',
  outro: 'tipoDesconhecido',
};

export default function Donos({ locale, chain, donos }) {
  const txt = t(locale);

  if (!donos) {
    return (
      <section className="bloco">
        <h2>{txt.donosTitulo}</h2>
        <p className="sub">{txt.donosSub}</p>
        <p className="estado-curto">{txt.donosIndisponivel}</p>
      </section>
    );
  }

  const maior = Math.max(1, ...donos.donos.map((d) => d.pct));

  return (
    <section className="bloco">
      <h2>{txt.donosTitulo}</h2>
      <p className="sub">{txt.donosSub}</p>
      <p className="donos-resumo">{txt.donosResumo(donos.top10.toFixed(0), donos.desconhecidos.toFixed(0))}</p>

      <ol className="donos">
        {donos.donos.map((d) => (
          <li key={d.address} className={`dono ${d.tipo}`}>
            <span className="dono-quem">
              {d.label || txt[NOME_TIPO[d.tipo]]}
              <a href={linkExplorador(chain, 'address', d.address)} target="_blank" rel="noreferrer noopener">
                {encurtarEndereco(d.address)}
              </a>
            </span>
            <span className="dono-barra">
              <span style={{ width: `${(d.pct / maior) * 100}%` }} />
            </span>
            <span className="dono-pct">{d.pct < 0.01 ? '<0.01' : d.pct.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
          </li>
        ))}
      </ol>

      <p className="ajuda">
        {txt.donosAviso}
        {donos.em && ` ${txt.donosLido}: ${tempoRelativo(donos.em, locale)}.`}
      </p>
    </section>
  );
}
