import { useEffect, useRef } from 'react'
import { empilharCamada } from '../utils/camadaEscape'

/**
 * Fecha ao apertar Escape, respeitando o empilhamento: só a camada do topo
 * responde. Use em modais/overlays. `ativo` liga/desliga sem desmontar.
 */
export function useEscape(aoFechar, ativo = true) {
  const ref = useRef(aoFechar)
  useEffect(() => {
    ref.current = aoFechar
  })
  useEffect(() => {
    if (!ativo) return
    return empilharCamada(() => ref.current?.())
  }, [ativo])
}
