import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { coletar } from '@/lib/coletor';

// ============================================================
// LEITURA CONTINUA
// Chamada a cada 10 minutos pelo GitHub Actions. Le todos os tokens que
// alguem pesquisou nos ultimos 15 dias, comecando pelos que estao ha mais
// tempo sem leitura. Cada leitura continua de onde a anterior parou.
// ============================================================

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_TOKENS = 30;          // quantos tokens acompanhar ao mesmo tempo
const ORCAMENTO_MS = 50000;     // deixa folga antes do limite de 60s da Vercel

export async function GET(request) {
  // So o agendador (que conhece o segredo) pode chamar esta rota.
  const segredo = process.env.CRON_SECRET;
  const enviado = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!segredo || enviado !== segredo) {
    return NextResponse.json({ erro: 'nao autorizado' }, { status: 401 });
  }

  const fim = Date.now() + ORCAMENTO_MS;
  const quinzeDias = new Date(Date.now() - 15 * 86400000).toISOString();
  const { data: tokens, error } = await db()
    .from('tokens')
    .select('chain, address, symbol')
    .gte('last_view_at', quinzeDias)
    .order('ultima_indexacao', { ascending: true, nullsFirst: true })
    .limit(MAX_TOKENS);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const feitos = [];
  for (const t of tokens || []) {
    const restante = fim - Date.now();
    // So comeca um token se der tempo de ler E gravar antes do limite da Vercel;
    // o resto fica para a proxima rodada, na frente da fila.
    if (restante < 20000) break;
    try {
      const r = await coletar(t.chain, t.address, { prazoMs: Math.min(20000, restante - 12000) });
      feitos.push({ token: t.symbol || t.address, novos: r.novos, completo: r.cobertura_completa });
    } catch (e) {
      feitos.push({ token: t.symbol || t.address, erro: e.message });
    }
  }
  return NextResponse.json({ ok: true, acompanhados: tokens?.length || 0, lidosNestaRodada: feitos });
}
