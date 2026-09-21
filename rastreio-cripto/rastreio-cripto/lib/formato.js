// Funcoes de formatacao. Tudo que o visitante le passa por aqui.

export function formatarNumero(n, locale = 'pt') {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const l = locale === 'en' ? 'en-US' : 'pt-BR';
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toLocaleString(l, { maximumFractionDigits: 2 }) + (locale === 'en' ? 'B' : ' bi');
  if (abs >= 1e6) return (n / 1e6).toLocaleString(l, { maximumFractionDigits: 2 }) + (locale === 'en' ? 'M' : ' mi');
  if (abs >= 1e3) return n.toLocaleString(l, { maximumFractionDigits: 0 });
  if (abs >= 1)   return n.toLocaleString(l, { maximumFractionDigits: 2 });
  return n.toLocaleString(l, { maximumFractionDigits: 6 });
}

export function formatarDinheiro(n, locale = 'pt') {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return '$' + formatarNumero(n, locale);
}

// Hora exata do movimento, no fuso do visitante.
export function formatarDataHora(iso, locale = 'pt') {
  if (!iso) return '—';
  const d = new Date(iso);
  const l = locale === 'en' ? 'en-US' : 'pt-BR';
  return d.toLocaleString(l, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function tempoRelativo(iso, locale = 'pt') {
  if (!iso) return '—';
  const seg = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const en = locale === 'en';
  if (seg < 60)    return en ? `${seg}s ago`            : `ha ${seg}s`;
  if (seg < 3600)  return en ? `${Math.floor(seg/60)}min ago`   : `ha ${Math.floor(seg/60)}min`;
  if (seg < 86400) return en ? `${Math.floor(seg/3600)}h ago`   : `ha ${Math.floor(seg/3600)}h`;
  return en ? `${Math.floor(seg/86400)}d ago` : `ha ${Math.floor(seg/86400)}d`;
}

export function encurtarEndereco(a) {
  if (!a) return '—';
  if (a.length <= 14) return a;
  return a.slice(0, 6) + '…' + a.slice(-4);
}

export function linkExplorador(chain, tipo, valor) {
  if (chain === 'ethereum') {
    return `https://etherscan.io/${tipo === 'tx' ? 'tx' : 'address'}/${valor}`;
  }
  return `https://solscan.io/${tipo === 'tx' ? 'tx' : 'account'}/${valor}`;
}
