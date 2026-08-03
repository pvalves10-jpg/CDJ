export const CATEGORIAS_PADRAO = [
  { id: 'restaurante', emoji: '🍽️', label: 'Restaurante' },
  { id: 'hospedagem', emoji: '🏨', label: 'Hospedagem' },
  { id: 'transporte', emoji: '🚗', label: 'Transporte' },
  { id: 'mercado', emoji: '🛒', label: 'Mercado' },
  { id: 'passeio', emoji: '🎭', label: 'Passeio' },
  { id: 'outro', emoji: '📌', label: 'Outro' },
]

export const USUARIOS = [
  { id: 'paulo_victor', nome: 'Paulo Victor', primeiroNome: 'Paulo' },
  { id: 'louise', nome: 'Louise', primeiroNome: 'Louise' },
]

export const NOMES_PASTAS = {
  DESPESAS: 'DESPESAS',
  FOTOS: 'FOTOS',
}

export const ARQUIVO_DESPESAS = 'despesas.json'

export function nomeUsuario(id) {
  return USUARIOS.find((u) => u.id === id)?.nome ?? id ?? '—'
}

export function primeiroNome(id) {
  return USUARIOS.find((u) => u.id === id)?.primeiroNome ?? id ?? '—'
}

/** O "outro" usuário da dupla. */
export function outroUsuario(id) {
  return USUARIOS.find((u) => u.id !== id)?.id ?? USUARIOS[0].id
}

export function acharCategoria(id, categorias = CATEGORIAS_PADRAO) {
  return (
    categorias.find((c) => c.id === id) ?? {
      id: id ?? 'outro',
      emoji: '📌',
      label: id ?? 'Outro',
    }
  )
}
