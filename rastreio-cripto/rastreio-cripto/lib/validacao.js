// ============================================================
// VALIDACAO CRUZADA DE PRECO
// Regra de ouro: nenhum preco e aceito com base em UMA fonte so.
//
// Fontes:
//   dex   -> DexScreener (on-chain)
//   gecko -> GeckoTerminal (on-chain, base de dados independente)
//   cex   -> CoinGecko, preco agregado das corretoras (quando listado)
//
// Protecoes:
//   1. Fontes precisam concordar entre si.
//   2. Quando o token esta nas corretoras, elas sao o juiz final
//      (volume muito maior, praticamente impossivel de distorcer).
//   3. Salto de preco absurdo desde a ultima leitura, sem confirmacao
//      independente, e rejeitado.
//   4. Se nao da pra confirmar, o site NAO mostra valor em dolar --
//      melhor nenhum numero do que um numero errado.
// ============================================================

// Duas fontes "concordam" se a diferenca entre elas e de no maximo 50%.
const TOLERANCIA = 1.5;
// Salto maximo aceito desde a ultima leitura sem confirmacao das corretoras.
const SALTO_MAXIMO = 10;
// Janela em que a ultima leitura ainda serve de comparacao.
const JANELA_SALTO_MS = 7 * 86400000;
// Valor de mercado (preco x total emitido) nao pode passar disso multiplicado
// pela liquidez. Pega o caso em que DUAS fontes on-chain concordam entre si
// mas ainda assim estao erradas (ex: sPENDLE, onde DexScreener e GeckoTerminal
// herdam o mesmo calculo quebrado de uma pool cruzada com o PENDLE comum).
const LIMITE_MARKETCAP_LIQUIDEZ = 50000;

function concordam(a, b) {
  if (!a || !b) return false;
  return Math.max(a, b) / Math.min(a, b) <= TOLERANCIA;
}

/**
 * @param dex     preco da DexScreener (ou null)
 * @param gecko   preco do GeckoTerminal (ou null)
 * @param cex     { preco, confiavel } das corretoras (ou null)
 * @param anterior { preco, em } ultimo preco validado (ou null)
 * @returns { preco, status, fontes, salto }
 *   status: confirmado | corrigido | fonte_unica | divergente | salto_suspeito | sem_preco
 */
export function validarPreco({ dex, gecko, cex, anterior, supply, liquidez }) {
  const fontes = { dex: dex || null, gecko: gecko || null, cex: cex?.confiavel ? cex.preco || null : null };
  const precoCex = fontes.cex;

  let preco = null;
  let status = 'sem_preco';

  if (precoCex) {
    // Token listado em corretora: ela e o juiz.
    if (concordam(dex, precoCex)) { preco = dex; status = 'confirmado'; }
    else if (concordam(gecko, precoCex)) { preco = gecko; status = dex ? 'corrigido' : 'confirmado'; }
    else { preco = precoCex; status = dex || gecko ? 'corrigido' : 'confirmado'; }
  } else if (dex && gecko) {
    // Sem corretora: as duas fontes on-chain precisam concordar.
    if (concordam(dex, gecko)) { preco = dex; status = 'confirmado'; }
    else { preco = null; status = 'divergente'; }
  } else if (dex || gecko) {
    preco = dex || gecko;
    status = 'fonte_unica';
  }

  // Protecao contra salto absurdo, quando nao ha corretora confirmando.
  let salto = null;
  const anteriorValido =
    anterior?.preco > 0 && anterior?.em && Date.now() - new Date(anterior.em).getTime() < JANELA_SALTO_MS;
  if (preco && anteriorValido) {
    const razao = Math.max(preco, anterior.preco) / Math.min(preco, anterior.preco);
    if (razao > SALTO_MAXIMO) {
      salto = razao;
      // So bloqueia quando o preco novo vem de UMA fonte so. Se duas fontes
      // independentes concordam no valor novo (ou as corretoras confirmam),
      // o salto e real -- ou e a correcao de um preco errado guardado antes.
      // Bloquear nesse caso deixaria o token travado por 7 dias.
      if (status === 'fonte_unica') { preco = null; status = 'salto_suspeito'; }
    }
  }

  // Ultima linha de defesa: o preco implica um valor de mercado impossivel
  // para a liquidez que o token tem de verdade. Roda mesmo quando as fontes
  // on-chain concordam entre si -- pega o caso do sPENDLE, onde DexScreener
  // e GeckoTerminal concordam num preco errado e as corretoras nao puderam
  // corrigir porque o simbolo delas e de outro token (protecao correta,
  // mas que sozinha nao bastava aqui).
  const statusJaRejeitado = status === 'divergente' || status === 'salto_suspeito' || status === 'sem_preco';
  if (preco && supply && liquidez && !statusJaRejeitado) {
    const confirmadoPorCex = precoCex && concordam(preco, precoCex);
    if (!confirmadoPorCex) {
      const marketCap = preco * supply;
      if (marketCap / liquidez > LIMITE_MARKETCAP_LIQUIDEZ) {
        preco = null;
        status = 'mercado_implausivel';
      }
    }
  }

  return { preco, status, fontes, salto };
}

/**
 * Liquidez: quando as duas fontes on-chain discordam muito, ficamos com
 * a MENOR. Superestimar liquidez faz um token arriscado parecer seguro;
 * subestimar, no maximo, gera um aviso a mais.
 */
export function validarLiquidez(dex, gecko) {
  if (dex && gecko) {
    return Math.max(dex, gecko) / Math.min(dex, gecko) > 3 ? Math.min(dex, gecko) : dex;
  }
  return dex || gecko || null;
}
