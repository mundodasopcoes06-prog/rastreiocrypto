import { createClient } from '@supabase/supabase-js';

// Cliente usado apenas no SERVIDOR.
// A service_role key nunca chega ao navegador do visitante.
let cliente = null;

export function db() {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Faltam as variaveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  cliente = createClient(url, key, {
    auth: { persistSession: false },
    global: {
      // Impede que a Vercel guarde uma copia antiga da resposta do banco.
      // Sem isso, uma leitura feita ha pouco pode continuar sendo devolvida
      // mesmo depois que os dados no Supabase ja mudaram — foi exatamente
      // isso que travou o PENDLE.
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
  return cliente;
}
