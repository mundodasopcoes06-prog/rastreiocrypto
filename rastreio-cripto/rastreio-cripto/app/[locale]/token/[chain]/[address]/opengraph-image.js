import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Rastreio Cripto';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Busca so o simbolo/nome do token direto na API do Supabase (sem
// carregar o coletor inteiro, que traz libs pesadas demais pra uma
// funcao "de borda" (edge) como esta).
async function buscarNome(chain, address) {
  try {
    const addr = chain === 'ethereum' ? address.toLowerCase() : address;
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tokens?chain=eq.${chain}&address=eq.${encodeURIComponent(addr)}&select=symbol,name`;
    const r = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!r.ok) return null;
    const linhas = await r.json();
    return linhas?.[0] || null;
  } catch (e) {
    return null;
  }
}

export default async function Imagem({ params }) {
  const { chain, address } = params;
  const dados = await buscarNome(chain, decodeURIComponent(address));
  const simbolo = dados?.symbol || `${address.slice(0, 4)}…${address.slice(-4)}`;
  const nomeCompleto = dados?.name || null;
  const rede = chain === 'ethereum' ? 'Ethereum' : 'Solana';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#0b1113',
          color: '#f4f7f6',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, color: '#5fd0a8', letterSpacing: 2 }}>
          RASTREIO CRIPTO · {rede.toUpperCase()}
        </div>
        <div style={{ display: 'flex', fontSize: 96, fontWeight: 700, marginTop: 20 }}>
          {simbolo}
        </div>
        {nomeCompleto && (
          <div style={{ display: 'flex', fontSize: 34, color: '#c7d3d0', marginTop: 4 }}>
            {nomeCompleto}
          </div>
        )}
        <div style={{ display: 'flex', fontSize: 26, color: '#9fb0ac', marginTop: 40 }}>
          Movimentações on-chain, explicadas: fato ou indício.
        </div>
      </div>
    ),
    { ...size }
  );
}
