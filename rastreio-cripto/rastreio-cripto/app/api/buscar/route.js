import { NextResponse } from 'next/server';
import { procurarToken } from '@/lib/precos';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const termo = (request.nextUrl.searchParams.get('q') || '').trim();
  if (termo.length < 2) return NextResponse.json({ resultados: [] });

  try {
    const resultados = await procurarToken(termo);
    return NextResponse.json({ resultados });
  } catch (e) {
    console.error('busca:', e);
    return NextResponse.json({ resultados: [], erro: e.message }, { status: 200 });
  }
}
