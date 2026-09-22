import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { VERIFICACOES } from '@/lib/verificacoes';

export const metadata = {
  title: 'Rastreio Cripto',
  description: 'A blockchain e publica. Aqui ela fica legivel.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {VERIFICACOES.googleSearchConsole && (
          <meta name="google-site-verification" content={VERIFICACOES.googleSearchConsole} />
        )}
        {VERIFICACOES.googleAdsense && (
          <meta name="google-adsense-account" content={`ca-${VERIFICACOES.googleAdsense}`} />
        )}
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
