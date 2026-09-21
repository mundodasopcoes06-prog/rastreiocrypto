'use client';

import { useState } from 'react';
import Link from 'next/link';
import { t } from '@/lib/dicionario';
import { formatarDinheiro } from '@/lib/formato';

export default function Busca({ locale }) {
  const txt = t(locale);
  const [termo, setTermo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resultados, setResultados] = useState(null);

  async function buscar(e) {
    e.preventDefault();
    const q = termo.trim();
    if (q.length < 2) return;

    setCarregando(true);
    setResultados(null);
    try {
      const r = await fetch(`/api/buscar?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      setResultados(j.resultados || []);
    } catch {
      setResultados([]);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <form className="campo-busca" onSubmit={buscar}>
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder={txt.buscaPlaceholder}
          aria-label={txt.buscaTitulo}
          autoComplete="off"
        />
        <button className="botao" type="submit" disabled={carregando || termo.trim().length < 2}>
          {carregando ? txt.buscando : txt.buscaBotao}
        </button>
      </form>

      {resultados !== null && (
        <div className="resultados">
          {resultados.length === 0 ? (
            <p className="ajuda">{txt.semResultado}</p>
          ) : (
            <>
              <h2>{txt.resultadosTitulo}</h2>
              {resultados.map((r) => (
                <Link
                  key={`${r.chain}:${r.address}`}
                  href={`/${locale}/token/${r.chain}/${r.address}`}
                  className="resultado"
                  prefetch={false}
                >
                  <span className="sigla">{r.simbolo}</span>
                  <span className="nome">{r.nome}</span>
                  <span className="rede">
                    {r.chain === 'ethereum' ? txt.redeEthereum : txt.redeSolana}
                  </span>
                  <span className="liq">{formatarDinheiro(r.liquidez, locale)}</span>
                </Link>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
}
