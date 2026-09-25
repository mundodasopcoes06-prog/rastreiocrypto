import { t, textoAlerta } from '@/lib/dicionario';
import { encurtarEndereco, linkExplorador } from '@/lib/formato';

export default function Alertas({ locale, alertas, chain, base = null }) {
  const txt = t(locale);

  return (
    <section className="bloco">
      <h2>{txt.alertasTitulo}</h2>
      <p className="sub">{txt.avisoGeral}</p>
      {base && <p className="ajuda">{txt.alertasBase(base.n, base.desde)}</p>}

      {alertas.length === 0 ? (
        <p className="ajuda">{txt.semAlertas}</p>
      ) : (
        alertas.map((a, i) => {
          const { titulo, texto, motivo } = textoAlerta(locale, a.codigo, a.valores);
          return (
            <div className={`alerta ${a.nivel}`} key={`${a.codigo}-${i}`}>
              <h3>{titulo}</h3>
              <p>{texto}</p>
              {a.endereco && (
                <p className="alerta-endereco">
                  <a href={linkExplorador(chain, 'address', a.endereco)} target="_blank" rel="noreferrer noopener">
                    {encurtarEndereco(a.endereco)}
                  </a>
                </p>
              )}
              <p className="motivo">
                <span className={`selo ${a.fato ? 'selo-confirmado' : 'selo-indicio'}`}>
                  {a.fato ? txt.explicaFato : txt.explicaIndicio}
                </span>{' '}
                {motivo}
              </p>
            </div>
          );
        })
      )}
    </section>
  );
}
