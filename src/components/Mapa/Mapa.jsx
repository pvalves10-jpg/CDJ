import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useDespesas } from '../../hooks/useDespesas'
import { ROTEIRO, COORD_DESTINO, COORD_CJ } from '../../utils/guia'

/**
 * Mapa da jornada (estilo Polarsteps): a rota da viagem ligando os pontos do
 * roteiro na ordem, com um pino numerado por lugar — verde quando já visitado.
 *
 * Usa Leaflet + tiles do OpenStreetMap (sem chave). Offline, os pinos e a rota
 * aparecem sobre o fundo cinza (as tiles precisam de rede).
 */

/** Pontos do roteiro que têm coordenada, na ordem da viagem, sem repetir. */
function pontosDoRoteiro() {
  const vistos = new Set()
  const pontos = []
  ROTEIRO.forEach((dia, i) => {
    for (const parada of dia.paradas) {
      const coord = COORD_DESTINO[parada.local]
      if (!coord || vistos.has(parada.local)) continue
      vistos.add(parada.local)
      pontos.push({
        id: parada.id,
        nome: parada.nome,
        dia: i + 1,
        lat: coord.lat,
        lon: coord.lon,
      })
    }
  })
  return pontos
}

function iconePino(numero, visitado) {
  const fundo = visitado ? '#2D5016' : '#ffffff'
  const texto = visitado ? '#ffffff' : '#2D5016'
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:${fundo};color:${texto};border:2px solid #2D5016;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,.35)">${numero}</div>`,
  })
}

export default function Mapa() {
  const { guia } = useDespesas()
  const containerRef = useRef(null)
  const mapaRef = useRef(null)
  const camadaRef = useRef(null)
  const pontos = useMemo(pontosDoRoteiro, [])

  // Cria o mapa uma única vez.
  useEffect(() => {
    if (mapaRef.current || !containerRef.current) return
    const mapa = L.map(containerRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([COORD_CJ.lat, COORD_CJ.lon], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapa)

    mapaRef.current = mapa
    // Dentro de layout flex o Leaflet às vezes mede a altura errada.
    setTimeout(() => mapa.invalidateSize(), 60)

    return () => {
      mapa.remove()
      mapaRef.current = null
    }
  }, [])

  // (Re)desenha rota + pinos conforme o que já foi visitado.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return

    camadaRef.current?.remove()
    const grupo = L.layerGroup().addTo(mapa)
    camadaRef.current = grupo

    const linha = pontos.map((p) => [p.lat, p.lon])
    if (linha.length > 1) {
      L.polyline(linha, {
        color: '#2D5016',
        weight: 3,
        opacity: 0.55,
        dashArray: '6 7',
      }).addTo(grupo)
    }

    pontos.forEach((p, i) => {
      const visitado = Boolean(guia.roteiro?.[p.id])
      L.marker([p.lat, p.lon], { icon: iconePino(i + 1, visitado) })
        .addTo(grupo)
        .bindPopup(
          `<strong>${p.nome}</strong><br>Dia ${p.dia}${visitado ? ' · ✓ visitado' : ''}`,
        )
    })

    if (linha.length) mapa.fitBounds(linha, { padding: [40, 40] })
  }, [pontos, guia])

  const visitados = pontos.filter((p) => guia.roteiro?.[p.id]).length

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-4 pt-4">
        <h1 className="text-lg font-bold text-pinheiro-800">Mapa da jornada</h1>
        <p className="text-sm text-pinheiro-500">
          {visitados} de {pontos.length} lugares visitados · a linha liga o
          roteiro na ordem
        </p>
      </div>

      <div
        ref={containerRef}
        className="mt-3 flex-1 bg-neve-200"
        style={{ minHeight: '62vh' }}
        role="application"
        aria-label="Mapa da viagem"
      />
    </div>
  )
}
