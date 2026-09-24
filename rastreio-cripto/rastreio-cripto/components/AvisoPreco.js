import { t } from '@/lib/dicionario';
import { formatarDinheiro } from '@/lib/formato';

// Mostra de onde veio o preco usado na pagina e se ele foi confirmado.
// Nenhum preco e apresentado como certo sem uma segunda fonte.
export default function AvisoPreco({ locale, token }) {
  const txt = t(locale);
  const status = token.preco_status;
  if (!status) return null;

  const f = token.preco_fontes || {};
  const $ = (v) => (v ? formatarDinheiro(v, locale) : txt.precoFonteSemDado);
  const nConfirmam = [f.dex, f.gecko, f.cex].filter(Boolean).length;

  const tipo = {
    confirmado: 'ok',
    corrigido: 'atencao',
    fonte_unica: 'atencao',
    divergente: 'erro',
    salto_suspeito: 'erro',
    sem_preco: 'erro',
  }[status] || 'atencao';

  return (
    <section className={`aviso-preco aviso-preco-${tipo}`}>
      <strong>{txt.precoStatusTitulo[status]}</strong>
      <p>{txt.precoStatusTexto[status](nConfirmam)}</p>
      <details>
        <summary>{txt.precoFontesVer}</summary>
        <ul>
          <li>DexScreener (on-chain): {$(f.dex)}</li>
          <li>GeckoTerminal (on-chain): {$(f.gecko)}</li>
          <li>{txt.precoFonteCorretoras}: {$(f.cex)}</li>
        </ul>
      </details>
    </section>
  );
}
