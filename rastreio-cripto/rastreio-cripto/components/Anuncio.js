import { t } from '@/lib/dicionario';
import { AFILIADO } from '@/lib/afiliados';

/**
 * Banner de afiliado. So aparece se AFILIADO.ativo for true
 * e o link nao for mais o de exemplo.
 */
export default function Anuncio({ locale }) {
  const txt = t(locale);
  const pronto = AFILIADO.ativo && AFILIADO.url && !AFILIADO.url.includes('exemplo.com');
  if (!pronto) return null;

  return (
    <section className="bloco anuncio">
      <span className="anuncio-etiqueta">{txt.anuncioEtiqueta}</span>
      <div className="anuncio-corpo">
        <div>
          <h3>{txt.anuncioTitulo}</h3>
          <p>{txt.anuncioTexto(AFILIADO.corretora)}</p>
        </div>
        
          className="botao"
          href={AFILIADO.url}
          target="_blank"
          rel="sponsored noopener noreferrer"
        >
          {txt.anuncioBotao(AFILIADO.corretora)}
        </a>
      </div>
    </section>
  );
}
