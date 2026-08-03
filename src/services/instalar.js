/**
 * Instalação do PWA.
 *
 * O Android/Chrome dispara `beforeinstallprompt` — guardamos o evento para
 * mostrar o instalador nativo no clique do botão. iOS/Safari não tem isso
 * (instala só pelo menu Compartilhar), então lá mostramos instruções.
 *
 * Importado cedo em main.jsx para capturar o evento antes do React montar.
 */

let deferido = null
const ouvintes = new Set()

function avisar() {
  for (const fn of ouvintes) fn()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferido = e
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    deferido = null
    avisar()
  })
}

export function podeInstalar() {
  return Boolean(deferido)
}

export function assinarInstalar(fn) {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

/** Abre o instalador nativo (Android). Devolve true se o usuário aceitou. */
export async function instalar() {
  if (!deferido) return false
  deferido.prompt()
  let aceito = false
  try {
    const escolha = await deferido.userChoice
    aceito = escolha?.outcome === 'accepted'
  } catch {
    /* usuário fechou o prompt */
  }
  if (aceito) deferido = null
  avisar()
  return aceito
}

/** true quando o app já está rodando instalado (standalone). */
export function estaInstalado() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator.standalone === true
  )
}
