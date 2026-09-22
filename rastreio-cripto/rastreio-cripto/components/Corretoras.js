import { t } from '@/lib/dicionario';
import { formatarDinheiro } from '@/lib/formato';

export default function Corretoras({ locale, cex }) {
  const txt = t(locale);

  if (!cex) {
    return (
      <section className="bloco">
        <h2>{txt.cexTitulo}</h2>
        <p className="sub">{txt.cexSub}</p>
        <p className="estado-curto">{txt.cexIndisponivel}</p>
      </section>
    );
  }

  if (!cex.listado) {
    return (
      <section className="bloco">
        <h2>{txt.cexTitulo}</h2>
        <p className="sub">{txt.cexSub}</p>
        <p className="estado-curto">{txt.cexNaoListado}</p>
      </section>
    );
  }

  const v = cex.variacao24h;

  return (
    <section className="bloco">
      <h2>{txt.cexTitulo}</h2>
      <p className="sub">{txt.cexSub}</p>

      {v !== null && v !== undefined && (
        <p className={`cex-variacao ${v >= 0 ? 'entrada' : 'saida'}`}>
          {v >= 0 ? txt.cexVariacaoAlta(v.toFixed(1)) : txt.cexVariacaoBaixa(Math.abs(v).toFixed(1))}
        </p>
      )}

      <ul className="cex-lista">
        {cex.corretoras.map((c) => (
          <li key={c.chave} className="cex-item">
            <div className="cex-linha">
              <span className="cex-nome">{c.nome}</span>
              <span className="cex-par">{c.par}</span>
              <span className="cex-preco">{formatarDinheiro(c.precoUsd, locale)}</span>
              <span className="cex-vol">{txt.cexVolume(formatarDinheiro(c.volumeUsd, locale))}</span>
              {c.url && (
                <a href={c.url} target="_blank" rel="noreferrer noopener">{txt.cexVerNaCorretora}</a>
              )}
            </div>
            {c.fluxo ? (
              <p className="cex-fluxo">
                {txt.cexFluxo(formatarDinheiro(c.fluxo.compraUsd, locale), formatarDinheiro(c.fluxo.vendaUsd, locale))}
              </p>
            ) : (
              <p className="ajuda">{txt.cexSemFluxo}</p>
            )}
          </li>
        ))}
      </ul>

      <p className="ajuda" style={{ marginTop: '1rem' }}>{txt.cexAviso}</p>
    </section>
  );
}
