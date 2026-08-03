import { useCallback, useEffect, useState } from 'react'
import { listarFotos, uploadFoto } from '../services/drive'
import { assinarAuth, estaAutenticado } from '../services/auth'

/** Sobe algumas fotos ao mesmo tempo: sequencial é lento, tudo junto sufoca a rede. */
const SIMULTANEOS = 3

export function useFotos() {
  const [fotos, setFotos] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  /** Uma entrada por arquivo em voo: { nome, progresso, erro }. */
  const [envios, setEnvios] = useState([])

  const recarregar = useCallback(async () => {
    if (!estaAutenticado()) return
    setCarregando(true)
    setErro(null)
    try {
      setFotos(await listarFotos())
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
    return assinarAuth((autenticado) => {
      if (autenticado) recarregar()
    })
  }, [recarregar])

  const enviar = useCallback(
    async (arquivos) => {
      const lista = [...arquivos].filter((f) => f.type.startsWith('image/'))
      if (!lista.length) return

      setErro(null)
      setEnvios(lista.map((f) => ({ nome: f.name, progresso: 0, erro: null })))

      const atualizar = (indice, campos) =>
        setEnvios((atual) =>
          atual.map((e, i) => (i === indice ? { ...e, ...campos } : e)),
        )

      const enviados = []
      let proximo = 0

      async function trabalhador() {
        while (proximo < lista.length) {
          const indice = proximo++
          try {
            const resultado = await uploadFoto(lista[indice], {
              onProgress: (p) => atualizar(indice, { progresso: p }),
            })
            enviados.push(resultado)
            atualizar(indice, { progresso: 100 })
          } catch (e) {
            atualizar(indice, { erro: e.message })
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(SIMULTANEOS, lista.length) }, trabalhador),
      )

      const falhas = lista.length - enviados.length
      if (falhas > 0) {
        setErro(
          `${falhas} de ${lista.length} ${falhas === 1 ? 'foto não subiu' : 'fotos não subiram'}.`,
        )
      }

      // Mostra as novas na hora; a recarga completa confirma com o Drive.
      if (enviados.length) {
        setFotos((atual) => [...enviados, ...atual])
      }

      // Some com as barras só depois que o usuário conseguiu ver o resultado.
      setTimeout(() => setEnvios([]), falhas > 0 ? 4000 : 900)

      if (enviados.length) recarregar()
    },
    [recarregar],
  )

  return { fotos, carregando, erro, setErro, envios, recarregar, enviar }
}
