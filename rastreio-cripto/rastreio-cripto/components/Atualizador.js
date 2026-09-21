'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/dicionario';
import { tempoRelativo } from '@/lib/formato';

/**
 * Cuida da leitura sob demanda.
 * Se o token nunca foi lido, ou a ultima leitura ja passou de 3 minutos,
 * dispara sozinho assim que a pagina abre.
 */
export default function Atualizador({ locale, chain, address, ultimaLeitura, vazio }) {
  const txt = t(locale);
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);

  const atualizar = useCallback(async () => {
    setOcupado(true);
    setErro(null);
    try {
      const r = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain, address }),
      });
      const j = await r.json();
      if (!j.ok) setErro(j.erro || 'Falha na leitura.');
      router.refresh();
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }, [chain, address, router]);

  useEffect(() => {
    const velha =
      !ultimaLeitura || Date.now() - new Date(ultimaLeitura).getTime() > 3 * 60 * 1000;
    if (velha || vazio) atualizar();
    // roda so uma vez por carregamento de pagina
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <button className="botao botao-claro" onClick={atualizar} disabled={ocupado}>
        {ocupado ? txt.atualizando : txt.atualizarAgora}
      </button>
      {ultimaLeitura && (
        <span className="ajuda" style={{ margin: 0 }}>
          {txt.ultimaLeitura}: {tempoRelativo(ultimaLeitura, locale)}
        </span>
      )}
      {erro && <span className="ajuda" style={{ margin: 0, color: 'var(--saida)' }}>{erro}</span>}
    </div>
  );
}
