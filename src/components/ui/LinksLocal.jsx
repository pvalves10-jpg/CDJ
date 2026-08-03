import { useState } from 'react'
import { linkMaps, linkWaze, linkUber, temCoordenada } from '../../utils/guia'
import { abrir99 } from '../../utils/corrida'
import { toast } from '../../services/toast'

/**
 * Ações de um local: navegar (Google Maps + Waze) e chamar corrida (Uber + 99).
 * As pílulas de corrida só aparecem quando há coordenada para o local.
 */
export default function LinksLocal({ local, className = '' }) {
  if (!local) return null
  const uber = linkUber(local)
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Pilula href={linkMaps(local)} emoji="📍" rotulo="Maps" />
      <Pilula href={linkWaze(local)} emoji="🧭" rotulo="Waze" />
      {uber && <PilulaUber href={uber} />}
      {temCoordenada(local) && <Pilula99 local={local} />}
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

/** Uber — abre o app com destino já traçado (partida = localização atual). */
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
