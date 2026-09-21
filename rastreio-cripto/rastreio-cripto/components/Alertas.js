import { t, textoAlerta } from '@/lib/dicionario';

export default function Alertas({ locale, alertas }) {
  const txt = t(locale);

  return (
    <section className="bloco">
      <h2>{txt.alertasTitulo}</h2>
      <p className="sub">{txt.avisoGeral}</p>

      {alertas.length === 0 ? (
        <p className="ajuda">{txt.semAlertas}</p>
      ) : (
        alertas.map((a, i) => {
          const { titulo, texto } = textoAlerta(locale, a.codigo, a.valores);
          return (
            <div className={`alerta ${a.nivel}`} key={`${a.codigo}-${i}`}>
              <h3>
                {titulo}{' '}
                <span className={`selo ${a.fato ? 'selo-confirmado' : 'selo-indicio'}`}>
                  {a.fato ? txt.explicaFato : txt.explicaIndicio}
                </span>
              </h3>
              <p>{texto}</p>
            </div>
          );
        })
      )}
    </section>
  );
}
