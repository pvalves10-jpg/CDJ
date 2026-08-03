import { useCallback, useEffect, useState } from 'react'
import { assinarAuth, estaAutenticado, login, logout } from '../services/auth'
import { limparCachePastas } from '../services/drive'

/** Estado de conexão com o Google, compartilhado por todas as telas. */
export function useDrive() {
  const [autenticado, setAutenticado] = useState(estaAutenticado)
  const [conectando, setConectando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => assinarAuth(setAutenticado), [])

  /** Deve ser chamado a partir de um clique — abre o pop-up do Google. */
  const conectar = useCallback(async () => {
    setConectando(true)
    setErro(null)
    try {
      await login()
      limparCachePastas()
      return true
    } catch (e) {
      setErro(e.message)
      return false
    } finally {
      setConectando(false)
    }
  }, [])

  const desconectar = useCallback(() => {
    logout()
    limparCachePastas()
    setErro(null)
  }, [])

  return { autenticado, conectando, erro, conectar, desconectar, setErro }
}
