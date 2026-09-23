import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IDIOMAS, t } from '@/lib/dicionario';
import { lerToken, registrarVisita } from '@/lib/coletor';
import {
  balanco, porDia, gerarAlertas, termometro, resumoProjeto, raioX,
  analisarLiquidez, analisarDonos, idadeEmDias, fusoDoIdioma, LIMITE_LIQUIDEZ_CONFIAVEL_USD,
} from '@/lib/analise';
import { montarNarrativa } from '@/lib/narrativa';
import { formatarDinheiro, formatarNumero, formatarDataHora, encurtarEndereco, linkExplorador } from '@/lib/formato';
import Balanco from '@/components/Balanco';
import Alertas from '@/components/Alertas';
import LinhaDoTempo from '@/components/LinhaDoTempo';
import Atualizador from '@/components/Atualizador';
import CarteirasProjeto from '@/components/CarteirasProjeto';
import RaioX from '@/components/RaioX';
import Liquidez from '@/components/Liquidez';
import Donos from '@/components/Donos';
import Corretoras from '@/components/Corretoras';
import Anuncio from '@/components/Anuncio';
import { SITE_URL } from '@/lib/site';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const REDES = ['ethereum', 'solana'];

export async function generateMetadata({ params }) {
  const { locale, chain, address } = params;
  const txt = t(locale);
  if (!IDIOMAS.includes(locale) || !REDES.includes(chain)) return {};

  const addr = decodeURIComponent(address);
  let nome = addr;
  try {
    const { data } = await db()
      .from('tokens').select('symbol, name')
      .eq('chain', chain).eq('address', chain === 'ethereum' ? addr.toLowerCase() : addr)
      .maybeSingle();
    if (data?.symbol) nome = data.name ? `${data.symbol} (${data.name})` : data.symbol;
  } catch (e) { /* usa o endereco mesmo, sem travar a pagina */ }

  const caminho = `${locale}/token/${chain}/${address}`;
  const descricao = locale === 'en'
    ? `On-chain buy and sell activity for ${nome} on ${chain === 'ethereum' ? 'Ethereum' : 'Solana'}, explained in plain language.`
    : `Movimentações de compra e venda do token ${nome} na blockchain ${chain === 'ethereum' ? 'Ethereum' : 'Solana'}, explicadas em linguagem simples.`;
  const titulo = `${nome} — ${txt.siteNome}`;
  const url = `${SITE_URL}/${caminho}`;

  return {
    title: titulo,
    description: descricao,
    alternates: {
      canonical: url,
      languages: {
        pt: `${SITE_URL}/pt/token/${chain}/${address}`,
        en: `${SITE_URL}/en/token/${chain}/${address}`,
      },
    },
    openGraph: {
      title: titulo,
      description: descricao,
      url,
      siteName: txt.siteNome,
      locale: locale === 'pt' ? 'pt_BR' : 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao },
  };
}

export default async function PaginaToken({ params }) {
  const { locale, chain } = params;
  const address = decodeURIComponent(params.address);

  if (!IDIOMAS.includes(locale) || !REDES.includes(chain)) notFound();

  const txt = t(locale);

  await registrarVisita(chain, address);

  const dados = await lerToken(chain, address);
  const token = dados?.token || { chain, address, symbol: null, name: null };
  const movimentos = dados?.transferencias || [];
  const snapshots = dados?.snapshots || [];
  const carteirasProjeto = dados?.carteirasProjeto || new Set();
  const motivosProjeto = dados?.motivosProjeto || new Map();
  const conhecidos = dados?.conhecidos || new Map();

  const ultimoSnapshot = snapshots[0] || null;

  // ---- Todos os calculos da pagina ----
  const periodos = {
    '24h': balanco(movimentos, 24),
    '7d': balanco(movimentos, 24 * 7),
    '30d': balanco(movimentos, 24 * 30),
  };
  const serieDiaria = porDia(movimentos, 30);
  const projeto = resumoProjeto(movimentos, carteirasProjeto);
  const raio = {
    '24h': raioX(movimentos, 24, carteirasProjeto),
    '7d': raioX(movimentos, 24 * 7, carteirasProjeto),
    '30d': raioX(movimentos, 24 * 30, carteirasProjeto),
  };
  const liquidez = analisarLiquidez(snapshots);
  const donos = analisarDonos(token, conhecidos, carteirasProjeto);
  const idade = idadeEmDias(token);

  const alertas = gerarAlertas({
    token, transferencias: movimentos, carteirasProjeto, conhecidos,
    liquidez, donos, fuso: fusoDoIdioma(locale),
  });
  const termo = termometro(alertas);
  const { manchete, paragrafo } = montarNarrativa({ locale, periodos, projeto, raio7d: raio['7d'], liquidez });

  const nome = token.symbol || token.name || encurtarEndereco(address);
  const nomesNivel = { baixo: txt.termometroBaixo, medio: txt.termometroMedio, alto: txt.termometroAlto };

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
          <div className={`idade ${idade !== null && idade < 30 ? 'nova' : ''}`}>
            {idade === null ? (
              txt.idadeDesconhecida
            ) : (
              <>
                {txt.idadeTitulo} <strong>{formatarDataHora(token.created_on_chain_at, locale).slice(0, 10)}</strong>{' '}
                ({txt.idadeDias(idade)})
                {idade < 30 && <span className="idade-selo">{txt.idadeNovo}</span>}
              </>
            )}
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
          {(() => {
            const liquidezAtual = liquidez.ultimo ?? liquidez.pontos?.[liquidez.pontos.length - 1]?.v ?? null;
            return liquidezAtual !== null && liquidezAtual < LIMITE_LIQUIDEZ_CONFIAVEL_USD ? (
              <section className="aviso-confiabilidade">
                <strong>{txt.avisoLiquidezBaixaTitulo}</strong>
                <p>{txt.avisoLiquidezBaixaTexto(formatarDinheiro(liquidezAtual, locale))}</p>
              </section>
            ) : null;
          })()}

          <section className={`veredicto nivel-${termo.nivel}`}>
            <div className="termometro" aria-label={`${txt.termometroTitulo}: ${nomesNivel[termo.nivel]}`}>
              <span className="termometro-rotulo">{txt.termometroTitulo}</span>
              <div className="termometro-escala" aria-hidden="true">
                {['baixo', 'medio', 'alto'].map((n) => (
                  <span key={n} className={`seg seg-${n} ${termo.nivel === n ? 'ativo' : ''}`}>{nomesNivel[n]}</span>
                ))}
              </div>
              <span className="termometro-resumo">
                {txt.termometroResumo(termo.altos, termo.medios)} {txt.termometroAviso}
              </span>
            </div>

            <h2>{txt.veredictoTitulo}</h2>
            <p className="frase-principal">{manchete}</p>
            {paragrafo && <p className="narrativa">{paragrafo}</p>}
          </section>

          <Alertas locale={locale} alertas={alertas} chain={chain} />

          <CarteirasProjeto locale={locale} chain={chain} resumo={projeto} motivosProjeto={motivosProjeto} />

          <Balanco locale={locale} periodos={periodos} serieDiaria={serieDiaria} />

          <RaioX locale={locale} periodos={raio} />

          <Corretoras locale={locale} cex={token.cex_data} />

          <Liquidez locale={locale} liquidez={liquidez} />

          <Donos locale={locale} chain={chain} donos={donos} />

          <Anuncio locale={locale} />

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

          <LinhaDoTempo
            locale={locale}
            movimentos={movimentos.slice(0, 200)}
            simbolo={token.symbol}
            motivosProjeto={motivosProjeto}
          />
        </>
      )}

      <p className="aviso">{txt.avisoGeral}</p>
    </div>
  );
}
