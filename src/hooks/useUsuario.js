import { useCallback, useEffect, useState } from 'react'
import { USUARIOS } from '../utils/constantes'

const LS_KEY = 'cdj:usuario'
const EVENTO = 'cdj:usuario-mudou'

function ler() {
  const salvo = localStorage.getItem(LS_KEY)
  return USUARIOS.some((u) => u.id === salvo) ? salvo : null
}

/**
 * Quem está usando o app neste aparelho. `null` até a primeira escolha —
 * a Home então pergunta "Você é Paulo Victor ou Louise?".
 */
export function useUsuario() {
  const [usuario, setUsuarioState] = useState(ler)

  useEffect(() => {
    const atualizar = () => setUsuarioState(ler())
    window.addEventListener(EVENTO, atualizar)
    window.addEventListener('storage', atualizar)
    return () => {
      window.removeEventListener(EVENTO, atualizar)
      window.removeEventListener('storage', atualizar)
    }
  }, [])

  const setUsuario = useCallback((id) => {
    localStorage.setItem(LS_KEY, id)
    window.dispatchEvent(new Event(EVENTO))
  }, [])

  return [usuario, setUsuario]
}
