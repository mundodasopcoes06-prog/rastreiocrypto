import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Rastreio Cripto';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Imagem padrao mostrada quando o link do site e compartilhado
// (WhatsApp, Telegram, Twitter/X etc). Cada pagina de token tem
// a sua propria versao desta imagem (veja o arquivo equivalente
// dentro de app/[locale]/token/[chain]/[address]/), esta aqui e
// so o modelo generico usado pela home e demais paginas.
export default function Imagem() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          backgroundColor: '#0b1113',
          color: '#f4f7f6',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, color: '#5fd0a8', letterSpacing: 2 }}>
          RASTREIO CRIPTO
        </div>
        <div style={{ display: 'flex', fontSize: 62, fontWeight: 700, marginTop: 24, lineHeight: 1.15 }}>
          A blockchain é pública.
        </div>
        <div style={{ display: 'flex', fontSize: 62, fontWeight: 700, lineHeight: 1.15 }}>
          Aqui ela fica legível.
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#9fb0ac', marginTop: 32 }}>
          Ethereum e Solana — fato ou indício, sempre explicado.
        </div>
      </div>
    ),
    { ...size }
  );
}
