import { NextResponse } from 'next/server';
import { coletarBitcoin } from '@/lib/bitcoin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Chamada pela rotina automatica (GitHub Actions) a cada 15 min.
// Protegida pela mesma senha CRON_SECRET que voce ja usa no outro cron.
export async function GET(request) {
  const auth = request.headers.get('authorization') || '';
  const esperado = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || auth !== esperado) {
    return NextResponse.json({ ok: false, erro: 'nao autorizado' }, { status: 401 });
  }
  try {
    const r = await coletarBitcoin();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error('coletarBitcoin:', e);
    return NextResponse.json({ ok: false, erro: e.message }, { status: 500 });
  }
}
