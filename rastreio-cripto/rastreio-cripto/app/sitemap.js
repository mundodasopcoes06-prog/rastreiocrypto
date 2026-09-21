import { db } from '@/lib/supabase';
import { SITE_URL } from '@/lib/site';
import { IDIOMAS } from '@/lib/dicionario';

// Refaz a lista toda vez que o Google pede (o site nao tem cache).
export const dynamic = 'force-dynamic';

/**
 * Mapa do site: diz ao Google quais paginas existem.
 * Inclui a home de cada idioma e os tokens ja pesquisados por alguem
 * (sao infinitos tokens possiveis; so listamos os que o site ja leu).
 */
export default async function sitemap() {
  const entradas = IDIOMAS.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  }));

  try {
    const { data } = await db()
      .from('tokens')
      .select('chain, address, last_ingest_at')
      .not('last_ingest_at', 'is', null)
      .order('last_view_at', { ascending: false })
      .limit(1000);

    for (const t of data || []) {
      for (const locale of IDIOMAS) {
        entradas.push({
          url: `${SITE_URL}/${locale}/token/${t.chain}/${encodeURIComponent(t.address)}`,
          lastModified: t.last_ingest_at ? new Date(t.last_ingest_at) : new Date(),
          changeFrequency: 'hourly',
          priority: 0.7,
        });
      }
    }
  } catch (e) {
    // Se o banco falhar, o mapa sai so com as duas homes. Nao trava o site.
    console.warn('sitemap:', e.message);
  }

  return entradas;
}
