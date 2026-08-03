import { useEffect, useState } from 'react'
import { buscarPrevisao } from '../services/clima'
import { ROTEIRO } from '../utils/guia'

/**
 * Carrega a previsão do tempo cobrindo todos os dias do roteiro.
 * Devolve `previsao` indexado por data (YYYY-MM-DD).
 */
export function useClima() {
  const [previsao, setPrevisao] = useState({})
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const datas = ROTEIRO.map((d) => d.data).sort()
    const inicio = datas[0]
    const fim = datas[datas.length - 1]

    const controle = new AbortController()
    let vivo = true

    buscarPrevisao(inicio, fim, { signal: controle.signal })
      .then((mapa) => {
        if (vivo) setPrevisao(mapa)
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })

    return () => {
      vivo = false
      controle.abort()
    }
  }, [])

  return { previsao, carregando }
}
