import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { coletar } from '@/lib/coletor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Quantos tokens atualizamos por rodada.
// Mantenha baixo: o plano gratuito da Helius tem limite mensal de creditos.
const POR_RODADA = 6;

export async function GET(request) {
  const enviado = request.nextUrl.searchParams.get('secret')
    || (request.headers.get('authorization') || '').replace('Bearer ', '');

  if (!process.env.CRON_SECRET || enviado !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: 'Senha invalida.' }, { status: 401 });
  }

  const s = db();

  // Fila: os tokens que alguem olhou mais recentemente.
  const { data: fila, error } = await s
    .from('tokens')
    .select('chain, address')
    .gte('last_view_at', new Date(Date.now() - 7 * 86400000).toISOString())
    .order('last_view_at', { ascending: false })
    .limit(POR_RODADA);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const relatorio = [];
  for (const t of fila || []) {
    try {
      const r = await coletar(t.chain, t.address);
      relatorio.push({ ...t, lidos: r.lidos });
    } catch (e) {
      relatorio.push({ ...t, erro: e.message });
    }
    // Pausa entre tokens para respeitar o limite das APIs gratuitas.
    await new Promise((r) => setTimeout(r, 400));
  }

  await s.rpc('limpar_antigos');

  return NextResponse.json({ ok: true, atualizados: relatorio.length, relatorio });
}
