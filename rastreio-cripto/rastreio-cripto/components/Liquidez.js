import { t } from '@/lib/dicionario';
import { formatarDinheiro, formatarDataHora } from '@/lib/formato';

export default function Liquidez({ locale, liquidez }) {
  const txt = t(locale);
  const L = liquidez;

  if (L.tipo === 'poucos') {
    return (
      <section className="bloco">
        <h2>{txt.liqTitulo}</h2>
        <p className="sub">{txt.liqSub}</p>
        <p className="estado-curto">{txt.liqPoucos}</p>
      </section>
    );
  }

  const v = Math.abs(L.variacao).toFixed(0);
  const frase = {
    brusca: txt.liqBrusca(v, L.maiorQueda.toFixed(0)),
    gradual: txt.liqGradual(v, L.quedas),
    subiu: txt.liqSubiu(v),
    estavel: txt.liqEstavel(L.variacao.toFixed(0)),
  }[L.tipo];

  // Desenho: linha simples, esquerda = leitura mais antiga.
  const W = 600, H = 120, pad = 6;
  const vals = L.pontos.map((p) => p.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const faixa = max - min || 1;
  const x = (i) => pad + (i / Math.max(1, L.pontos.length - 1)) * (W - pad * 2);
  const y = (val) => H - pad - ((val - min) / faixa) * (H - pad * 2);
  const linha = L.pontos.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const cor = L.tipo === 'brusca' || L.tipo === 'gradual' ? 'var(--saida)' : L.tipo === 'subiu' ? 'var(--entrada)' : 'var(--estrutura)';

  return (
    <section className="bloco">
      <h2>{txt.liqTitulo}</h2>
      <p className="sub">{txt.liqSub}</p>

      <p className={`liq-frase ${L.tipo}`}>{frase}</p>

      <svg className="liq-grafico" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={frase}>
        <polyline points={linha} fill="none" stroke={cor} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="grafico-legenda">
        <span>{formatarDinheiro(L.primeiro, locale)}</span>
        <span>{formatarDinheiro(L.ultimo, locale)}</span>
      </div>
      <p className="ajuda">
        {txt.liqPeriodo(L.leituras, formatarDataHora(L.desde, locale), formatarDataHora(L.ate, locale))}
      </p>
    </section>
  );
}
