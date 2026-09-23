import { notFound } from 'next/navigation';
import { IDIOMAS, t } from '@/lib/dicionario';
import { SITE_URL } from '@/lib/site';
import Busca from '@/components/Busca';
import Anuncio from '@/components/Anuncio';

export function generateMetadata({ params }) {
  const { locale } = params;
  const txt = t(locale);
  const titulo = `${txt.siteNome} — ${txt.siteResumo}`;
  const url = `${SITE_URL}/${locale}`;
  return {
    title: titulo,
    description: txt.buscaAjuda,
    alternates: {
      canonical: url,
      languages: { pt: `${SITE_URL}/pt`, en: `${SITE_URL}/en` },
    },
    openGraph: {
      title: titulo,
      description: txt.buscaAjuda,
      url,
      siteName: txt.siteNome,
      locale: locale === 'pt' ? 'pt_BR' : 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: titulo, description: txt.buscaAjuda },
  };
}

export default function Home({ params }) {
  const { locale } = params;
  if (!IDIOMAS.includes(locale)) notFound();
  const txt = t(locale);

  return (
    <div className="envoltorio">
      <section className="capa">
        <h1>{txt.buscaTitulo}</h1>
        <p className="frase">{txt.buscaAjuda}</p>
        <Busca locale={locale} />
      </section>

      <section className="bloco" style={{ marginBottom: '4rem' }}>
        <h2>{txt.explicaTitulo}</h2>
        <div className="legenda" style={{ marginTop: '1rem' }}>
          <div>
            <span className="selo selo-confirmado">{txt.explicaFato}</span>
            <p>{txt.explicaFatoTexto}</p>
          </div>
          <div>
            <span className="selo selo-indicio">{txt.explicaIndicio}</span>
            <p>{txt.explicaIndicioTexto}</p>
          </div>
        </div>
        <p className="ajuda" style={{ marginTop: '1.5rem' }}>{txt.avisoGeral}</p>
      </section>

      <Anuncio locale={locale} />
    </div>
  );
}
