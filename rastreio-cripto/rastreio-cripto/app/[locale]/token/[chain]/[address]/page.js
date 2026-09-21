import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IDIOMAS, t } from '@/lib/dicionario';
import { lerToken, registrarVisita } from '@/lib/coletor';
import { balanco, porDia, gerarAlertas } from '@/lib/analise';
import { formatarDinheiro, formatarNumero, encurtarEndereco, linkExplorador } from '@/lib/formato';
import Balanco from '@/components/Balanco';
import Alertas from '@/components/Alertas';
import LinhaDoTempo from '@/components/LinhaDoTempo';
import Atualizador from '@/components/Atualizador';

export const dynamic = 'force-dynamic';

const REDES = ['ethereum', 'solana'];

export default async function PaginaToken({ params }) {
  const { locale, chain } = params;
  const address = decodeURIComponent(params.address);

  if (!IDIOMAS.includes(locale) || !REDES.includes(chain)) notFound();

  const txt = t(locale);

  // Marca a visita: e isso que coloca o token na fila da rotina automatica.
  await registrarVisita(chain, address);

  const dados = await lerToken(chain, address);
  const token = dados?.token || { chain, address, symbol: null, name: null };
  const movimentos = dados?.transferencias || [];
  const snapshots = dados?.snapshots || [];
  const carteirasProjeto = dados?.carteirasProjeto || new Set();

  const ultimoSnapshot = snapshots[0] || null;

  const periodos = {
    '24h': balanco(movimentos, 24),
    '7d': balanco(movimentos, 24 * 7),
    '30d': balanco(movimentos, 24 * 30),
  };

  const serieDiaria = porDia(movimentos, 30);

  const alertas = gerarAlertas({ token, transferencias: movimentos, snapshots, carteirasProjeto });

  // A frase principal da pagina.
  const b = periodos['24h'];
  let frase;
  if (b.movimentos === 0) {
    frase = txt.semDados;
  } else if (b.pctCompra > 58) {
    frase = `${txt.pressaoCompra} — ${formatarDinheiro(b.compras, locale)} ${txt.saldoCompras.toLowerCase()} contra ${formatarDinheiro(b.vendas, locale)} ${txt.saldoVendas.toLowerCase()} nas últimas 24 horas.`;
  } else if (b.pctVenda > 58) {
    frase = `${txt.pressaoVenda} — ${formatarDinheiro(b.vendas, locale)} ${txt.saldoVendas.toLowerCase()} contra ${formatarDinheiro(b.compras, locale)} ${txt.saldoCompras.toLowerCase()} nas últimas 24 horas.`;
  } else {
    frase = `${txt.pressaoEquilibrio} — ${b.movimentos} ${locale === 'pt' ? 'movimentos nas últimas 24 horas' : 'movements in the last 24 hours'}.`;
  }

  const nome = token.symbol || token.name || encurtarEndereco(address);

  return (
    <div className="envoltorio">
      <div className="topo-token">
        <div>
          <h1>{nome}{token.name && token.symbol ? ` · ${token.name}` : ''}</h1>
          <div className="contrato">
            {chain === 'ethereum' ? txt.redeEthereum : txt.redeSolana}{' '}
            <a href={linkExplorador(chain, 'address', address)} target="_blank" rel="noreferrer noopener">
              {address}
            </a>
          </div>
        </div>
        <Link href={`/${locale}`} className="idioma">{txt.voltar}</Link>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <Atualizador
          locale={locale}
          chain={chain}
          address={address}
          ultimaLeitura={token.last_ingest_at || null}
          vazio={movimentos.length === 0}
        />
      </div>

      {movimentos.length === 0 ? (
        <div className="estado">{txt.coletando}</div>
      ) : (
        <>
          <section className="veredicto">
            <h2>{txt.veredictoTitulo}</h2>
            <p className="frase-principal">{frase}</p>
          </section>

          <Balanco locale={locale} periodos={periodos} serieDiaria={serieDiaria} />

          <Alertas locale={locale} alertas={alertas} />

          <section className="bloco">
            <h2>{txt.fichaTitulo}</h2>
            <div className="ficha" style={{ marginTop: '1rem' }}>
              <div>
                <span>{txt.fichaPreco}</span>
                <strong>{formatarDinheiro(ultimoSnapshot?.price_usd, locale)}</strong>
              </div>
              <div>
                <span>{txt.fichaLiquidez}</span>
                <strong>{formatarDinheiro(ultimoSnapshot?.liquidity_usd, locale)}</strong>
              </div>
              <div>
                <span>{txt.fichaVolume}</span>
                <strong>{formatarDinheiro(ultimoSnapshot?.volume_24h, locale)}</strong>
              </div>
              <div>
                <span>{txt.fichaSupply}</span>
                <strong>{token.total_supply ? formatarNumero(Number(token.total_supply), locale) : txt.naoDisponivel}</strong>
              </div>
              {chain === 'ethereum' && (
                <div>
                  <span>{txt.fichaCriador}</span>
                  <strong>
                    {token.creator ? (
                      <a href={linkExplorador(chain, 'address', token.creator)} target="_blank" rel="noreferrer noopener">
                        {encurtarEndereco(token.creator)}
                      </a>
                    ) : txt.naoDisponivel}
                  </strong>
                </div>
              )}
              {chain === 'solana' && (
                <div>
                  <span>{txt.fichaEmissao}</span>
                  <strong style={{ color: token.mint_authority ? 'var(--saida)' : 'var(--entrada)' }}>
                    {token.mint_authority ? txt.sim : txt.nao}
                  </strong>
                </div>
              )}
            </div>
          </section>

          <LinhaDoTempo locale={locale} movimentos={movimentos.slice(0, 200)} simbolo={token.symbol} />
        </>
      )}

      <p className="aviso">{txt.avisoGeral}</p>
    </div>
  );
}
