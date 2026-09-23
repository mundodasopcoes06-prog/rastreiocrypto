import Link from 'next/link';
import { t } from '@/lib/dicionario';
import { SITE_URL } from '@/lib/site';
import Busca from '@/components/Busca';
import Anuncio from '@/components/Anuncio';

// Esta e a pagina de verdade da raiz "/" do site (sem redirecionamento
// e sem reescrita nenhuma). Mostra o mesmo conteudo da home em
// portugues, direto, para que qualquer visitante -- inclusive o robo
// do Google -- receba uma pagina completa (200) assim que acessa "/".
const locale = 'pt';

export function generateMetadata() {
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
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: titulo, description: txt.buscaAjuda },
  };
}

export default function RaizDoSite() {
  const txt = t(locale);

  return (
    <div lang="pt-BR">
      <header className="cabecalho">
        <div className="cabecalho-interno envoltorio">
          <Link href="/pt" className="marca">
            {txt.siteNome}
            <span>{txt.siteResumo}</span>
          </Link>
          <Link href="/en" className="idioma">{txt.trocarIdioma}</Link>
        </div>
      </header>

      <main>
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
      </main>

      <footer className="rodape">
        <div className="envoltorio rodape-interno">
          <span>{txt.rodape}</span>
          <Link href="/pt/privacidade">{txt.rodapePrivacidade}</Link>
        </div>
      </footer>
    </div>
  );
}
