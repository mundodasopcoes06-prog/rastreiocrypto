import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IDIOMAS, t } from '@/lib/dicionario';

export function generateStaticParams() {
  return IDIOMAS.map((locale) => ({ locale }));
}

export default function LayoutIdioma({ children, params }) {
  const { locale } = params;
  if (!IDIOMAS.includes(locale)) notFound();

  const txt = t(locale);
  const outro = locale === 'pt' ? 'en' : 'pt';

  return (
    <div lang={locale === 'pt' ? 'pt-BR' : 'en'}>
      <header className="cabecalho">
        <div className="cabecalho-interno">
          <Link href={`/${locale}`} className="marca">
            {txt.siteNome}
            <span>{txt.siteResumo}</span>
          </Link>
          <Link href={`/${outro}`} className="idioma">
            {txt.trocarIdioma}
          </Link>
        </div>
      </header>

      <main>{children}</main>

      <footer className="rodape">
        <div className="envoltorio">{txt.rodape}</div>
      </footer>
    </div>
  );
}
