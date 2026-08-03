import { useCallback, useEffect, useState } from 'react'
import { assinarAuth, estaAutenticado, login, logout } from '../services/auth'
import { limparCachePastas } from '../services/drive'
import { toast } from '../services/toast'

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
      toast.ok('Conexão validada.')
      return true
    } catch (e) {
      setErro(e.message)
      // CANCELADO é o usuário fechando o pop-up de propósito — não é erro.
      if (e.codigo !== 'CANCELADO') toast.erro(e.message)
      return false
    } finally {
      setConectando(false)
    }
  }, [])

  const desconectar = useCallback(() => {
    logout()
    limparCachePastas()
    setErro(null)
    toast.ok('Conexão esquecida neste aparelho.')
  }, [])

  return { autenticado, conectando, erro, conectar, desconectar, setErro }
}
