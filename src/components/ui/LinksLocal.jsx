import { useState } from 'react'
import {
  linkMaps,
  linkWaze,
  linkUber,
  temCoordenada,
  COORD_DESTINO,
} from '../../utils/guia'
import { abrir99 } from '../../utils/corrida'
import { useLocalizacao } from '../../hooks/useLocalizacao'
import { distanciaKm, estimarCorrida, formatarKm } from '../../utils/distancia'
import { toast } from '../../services/toast'

/**
 * Ações de um local: navegar (Google Maps + Waze) e chamar corrida (Uber + 99).
 * As pílulas de corrida só aparecem quando há coordenada para o local. Com a
 * localização ativa, mostra distância + estimativa e abre o Uber com a partida.
 */
export default function LinksLocal({ local, className = '' }) {
  const { posicao, status } = useLocalizacao()
  if (!local) return null

  const destino = COORD_DESTINO[local]
  const origem = posicao && (status === 'ok' || status === 'cache') ? posicao : null
  const uber = linkUber(local, origem)

  const km = destino && origem ? distanciaKm(origem, destino) : null
  const estimativa = km != null ? estimarCorrida(km) : null

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex flex-wrap gap-2">
        <Pilula href={linkMaps(local)} emoji="📍" rotulo="Maps" />
        <Pilula href={linkWaze(local)} emoji="🧭" rotulo="Waze" />
        {uber && <PilulaUber href={uber} />}
        {temCoordenada(local) && <Pilula99 local={local} />}
      </div>

      {estimativa && (
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-pinheiro-500">
          <span aria-hidden="true">📍</span>
          <span className="font-semibold text-pinheiro-600">
            {formatarKm(estimativa.km)}
          </span>
          <span aria-hidden="true">·</span>
          <span>~{estimativa.minutos} min de carro</span>
          <span aria-hidden="true">·</span>
          <span>
            corrida ≈ R$ {estimativa.precoMin}–{estimativa.precoMax}
          </span>
          <span className="text-pinheiro-400">(aprox.)</span>
        </p>
      )}
    </div>
  )
}

const BASE_PILULA =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors'

function Pilula({ href, emoji, rotulo }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${BASE_PILULA} bg-neve-200 text-pinheiro-700 hover:bg-neve-300`}
    >
      <span aria-hidden="true">{emoji}</span>
      {rotulo}
    </a>
  )
}

/** Uber — abre o app com destino já traçado (partida = sua localização). */
function PilulaUber({ href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Pedir Uber até aqui"
      className={`${BASE_PILULA} bg-black text-white hover:bg-neutral-800`}
    >
      <span aria-hidden="true">🚗</span>
      Uber
    </a>
  )
}

/** 99 — abre o app e copia o endereço do destino (o 99 não tem link de destino). */
function Pilula99({ local }) {
  const [ocupado, setOcupado] = useState(false)

  async function pedir() {
    if (ocupado) return
    setOcupado(true)
    try {
      const { copiado } = await abrir99(local)
      toast.ok(
        copiado
          ? '📋 Endereço copiado — cole no 99 e confirme a corrida.'
          : '🚕 Abrindo o 99…',
      )
    } catch {
      toast.erro('Não consegui abrir o 99.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <button
      type="button"
      onClick={pedir}
      disabled={ocupado}
      aria-label="Pedir 99 até aqui"
      className={`${BASE_PILULA} bg-[#FFCC00] text-neutral-900 hover:bg-[#f0c000] disabled:opacity-60`}
    >
      <span aria-hidden="true" className="text-base leading-none font-extrabold">
        99
      </span>
    </button>
  )
}
