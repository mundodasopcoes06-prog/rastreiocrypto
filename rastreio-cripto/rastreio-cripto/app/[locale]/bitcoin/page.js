import { notFound } from 'next/navigation';
import Link from 'next/link';
import { IDIOMAS, t } from '@/lib/dicionario';
import { SITE_URL } from '@/lib/site';
import { lerBitcoin } from '@/lib/bitcoin';
import BitcoinPainel from '@/components/BitcoinPainel';
import Anuncio from '@/components/Anuncio';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const { locale } = params;
  const txt = t(locale);
  const url = `${SITE_URL}/${locale}/bitcoin`;
  return {
    title: `${txt.btcTitulo} — ${txt.siteNome}`,
    description: txt.btcSub,
    alternates: { canonical: url, languages: { pt: `${SITE_URL}/pt/bitcoin`, en: `${SITE_URL}/en/bitcoin` } },
    openGraph: { title: `${txt.btcTitulo} — ${txt.siteNome}`, description: txt.btcSub, url, type: 'website' },
  };
}

export default async function PaginaBitcoin({ params }) {
  const { locale } = params;
  if (!IDIOMAS.includes(locale)) notFound();
  const txt = t(locale);

  let dados = { corretoras: { '24h': z(), '7d': z(), '15d': z() }, movimentos: [] };
  try { dados = await lerBitcoin(); } catch (e) { /* pagina abre mesmo sem dados */ }

  return (
    <div className="envoltorio">
      <div className="topo-token">
        <div>
          <h1>{txt.btcTitulo}</h1>
          <div className="contrato">{txt.btcSub}</div>
        </div>
        <Link href={`/${locale}`} className="idioma">{txt.voltar}</Link>
      </div>

      <BitcoinPainel locale={locale} dados={dados} />
      <Anuncio locale={locale} />
      <p className="aviso">{txt.avisoGeral}</p>
    </div>
  );
}

function z() { return { entrada: 0, saida: 0, nEntrada: 0, nSaida: 0, liquido: 0 }; }
