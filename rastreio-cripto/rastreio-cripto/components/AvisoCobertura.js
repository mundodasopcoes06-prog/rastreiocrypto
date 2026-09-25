import { t } from '@/lib/dicionario';
import { formatarDataHora, tempoRelativo } from '@/lib/formato';

// Diz ao leitor, sem rodeio, ate onde os dados desta pagina estao completos.
export default function AvisoCobertura({ locale, token }) {
  const txt = t(locale);
  const agora = Date.now();
  const desde = token.cobertura_desde ? new Date(token.cobertura_desde).getTime() : null;
  const ate = token.cobertura_ate ? new Date(token.cobertura_ate).getTime() : null;
  const emDia = ate != null && agora - ate < 30 * 60000;
  const quinzeDias = desde != null && desde <= agora - 15 * 86400000 + 3600000;
  const solana = token.chain === 'solana';

  const frases = [];
  let tipo = 'atencao';
  if (desde == null) {
    frases.push(txt.coberturaIniciando);
  } else if (solana) {
    frases.push(txt.coberturaSolana, txt.coberturaSolanaDesde(formatarDataHora(token.cobertura_desde, locale)));
  } else if (quinzeDias && emDia) {
    tipo = 'ok';
    frases.push(txt.coberturaCompletaEth(tempoRelativo(token.cobertura_ate, locale)));
  } else {
    frases.push(txt.coberturaParcial(formatarDataHora(token.cobertura_desde, locale)));
  }
  if (desde != null && !emDia && ate != null) frases.push(txt.coberturaAtrasada(tempoRelativo(token.cobertura_ate, locale)));

  return (
    <section className={`aviso-preco aviso-preco-${tipo}`}>
      <p>{frases.join(' ')}</p>
    </section>
  );
}
