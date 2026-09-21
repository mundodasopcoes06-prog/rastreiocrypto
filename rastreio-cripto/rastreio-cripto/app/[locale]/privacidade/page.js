import { notFound } from 'next/navigation';
import { IDIOMAS, t } from '@/lib/dicionario';
import { SITE_URL } from '@/lib/site';

export function generateMetadata({ params }) {
  const { locale } = params;
  const txt = t(locale);
  return { title: `${txt.privTitulo} — ${txt.siteNome}`, alternates: { canonical: `${SITE_URL}/${locale}/privacidade` } };
}

export default function Privacidade({ params }) {
  const { locale } = params;
  if (!IDIOMAS.includes(locale)) notFound();
  const txt = t(locale);

  return (
    <div className="envoltorio">
      <section className="bloco" style={{ marginTop: '2rem' }}>
        <h1 style={{ marginTop: 0 }}>{txt.privTitulo}</h1>
        {txt.privParagrafos.map((p, i) => <p key={i}>{p}</p>)}
      </section>
    </div>
  );
}
