import { NextResponse } from 'next/server';
import { coletar, registrarVisita } from '@/lib/coletor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // a leitura pode demorar alguns segundos

const REDES = ['ethereum', 'solana'];

export async function POST(request) {
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Corpo invalido.' }, { status: 400 });
  }

  const { chain, address } = corpo || {};
  if (!REDES.includes(chain) || !address) {
    return NextResponse.json({ erro: 'Informe chain (ethereum ou solana) e address.' }, { status: 400 });
  }

  try {
    await registrarVisita(chain, address);
    const r = await coletar(chain, address);
    return NextResponse.json({ ok: true, lidos: r.lidos });
  } catch (e) {
    console.error('coletar:', e);
    return NextResponse.json({ ok: false, erro: e.message }, { status: 500 });
  }
}
