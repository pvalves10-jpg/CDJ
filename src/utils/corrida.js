import { enderecoDestino } from './guia'

/**
 * Chamar corrida pelo 99.
 *
 * Realidade técnica: o 99 (DiDi Brasil) NÃO tem deep link público que abra o
 * app já com destino e preço — diferente do Uber. Confirmado: nenhum scheme
 * oficial (99app://, taxis99://) aceita destino; só existe uma API corporativa
 * server-to-server que não serve para isso. Então o máximo honesto e útil é:
 * abrir o app do 99 e copiar o endereço do destino para o usuário colar.
 *
 * Ver linkUber() em guia.js para o Uber, que faz o fluxo completo.
 */

const PLAY_99 = 'https://play.google.com/store/apps/details?id=com.taxis99'
const SITE_99 = 'https://99app.com/'

function ehAndroid() {
  return /android/i.test(navigator.userAgent)
}

function ehIOS() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS moderno se identifica como Mac com toque.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}

/**
 * Abre o 99 (best-effort por plataforma) e copia o endereço do destino.
 * Resolve com { copiado, endereco }. Chame a partir de um clique do usuário.
 */
export async function abrir99(local) {
  const endereco = enderecoDestino(local)
  const copiado = await copiar(endereco)

  if (ehAndroid()) {
    // intent:// abre o app instalado; se não houver, cai na Play Store.
    const fallback = encodeURIComponent(PLAY_99)
    window.location.href = `intent://#Intent;package=com.taxis99;S.browser_fallback_url=${fallback};end`
  } else if (ehIOS()) {
    // iOS não tem scheme público confiável — universal link do site (abre o
    // app se instalado; senão, o site, de onde dá para instalar).
    window.location.href = SITE_99
  } else {
    window.open(SITE_99, '_blank', 'noopener')
  }

  return { copiado, endereco }
}
