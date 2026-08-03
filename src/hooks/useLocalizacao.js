import { useSyncExternalStore } from 'react'
import {
  assinarLocalizacao,
  getLocalizacao,
  iniciarLocalizacao,
} from '../services/localizacao'

/**
 * Localização atual do usuário (GPS), compartilhada por todo o app.
 * Retorna { status, posicao, pedir } — `pedir()` inicia o rastreamento.
 */
export function useLocalizacao() {
  const estado = useSyncExternalStore(
    assinarLocalizacao,
    getLocalizacao,
    getLocalizacao,
  )
  return { ...estado, pedir: iniciarLocalizacao }
}
