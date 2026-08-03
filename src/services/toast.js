/**
 * Store de toasts fora do React.
 *
 * Sem Context de propósito: assim `services/` e handlers soltos também
 * conseguem avisar o usuário, sem precisar de um hook no meio do caminho.
 */
const DURACAO = { ok: 2600, erro: 5200, aviso: 4200 }

let toasts = []
let sequencia = 0
const ouvintes = new Set()

function notificar() {
  for (const fn of ouvintes) fn(toasts)
}

export function assinarToasts(fn) {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

export function getToasts() {
  return toasts
}

export function fecharToast(id) {
  toasts = toasts.filter((t) => t.id !== id)
  notificar()
}

function mostrar(tipo, texto) {
  if (!texto) return null
  const id = ++sequencia
  // No máximo 3 na tela: além disso vira parede de texto.
  toasts = [...toasts, { id, tipo, texto }].slice(-3)
  notificar()
  setTimeout(() => fecharToast(id), DURACAO[tipo])
  return id
}

export const toast = {
  ok: (texto) => mostrar('ok', texto),
  erro: (texto) => mostrar('erro', texto),
  aviso: (texto) => mostrar('aviso', texto),
}
