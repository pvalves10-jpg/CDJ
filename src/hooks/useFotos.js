import { useCallback, useEffect, useState } from 'react'
import { listarFotos, uploadFoto } from '../services/drive'
import { assinarAuth, estaAutenticado } from '../services/auth'
import { toast } from '../services/toast'

/** Sobe algumas fotos ao mesmo tempo: sequencial é lento, tudo junto sufoca a rede. */
const SIMULTANEOS = 3

export function useFotos() {
  const [fotos, setFotos] = useState([])
  const [carregando, setCarregando] = useState(false)
  /** Uma entrada por arquivo em voo: { nome, progresso, erro }. */
  const [envios, setEnvios] = useState([])

  const recarregar = useCallback(async () => {
    if (!estaAutenticado()) return
    setCarregando(true)
    try {
      setFotos(await listarFotos())
    } catch (e) {
      toast.erro(`Não consegui listar as fotos: ${e.message}`)
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
      if (!lista.length) {
        toast.aviso('Nenhum dos arquivos selecionados é uma imagem.')
        return
      }

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
        toast.erro(
          `${falhas} de ${lista.length} ${falhas === 1 ? 'foto não subiu' : 'fotos não subiram'}.`,
        )
      }
      if (enviados.length) {
        toast.ok(
          enviados.length === 1
            ? 'Foto enviada!'
            : `${enviados.length} fotos enviadas!`,
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

  return { fotos, carregando, envios, recarregar, enviar }
}
