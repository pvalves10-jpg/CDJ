import { useState } from 'react'
import { useDespesas } from '../../hooks/useDespesas'
import { useClima } from '../../hooks/useClima'
import LinksLocal from '../ui/LinksLocal'
import { ROTEIRO } from '../../utils/guia'

function ddmm(data) {
  const [, m, d] = data.split('-')
  return `${d}/${m}`
}

function hojeISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}

export default function Roteiro() {
  const { guia, marcarParada } = useDespesas()
  const { previsao } = useClima()

  // Abre no dia de hoje, se a viagem estiver rolando; senão, no primeiro dia.
  const [indice, setIndice] = useState(() => {
    const i = ROTEIRO.findIndex((d) => d.data === hojeISO())
    return i >= 0 ? i : 0
  })

  const dia = ROTEIRO[indice]
  const feitas = dia.paradas.filter((p) => guia.roteiro?.[p.id]).length

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-24">
      {/* Abas dos dias */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {ROTEIRO.map((d, i) => {
          const ativo = i === indice
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setIndice(i)}
              aria-pressed={ativo}
              className={[
                'flex shrink-0 flex-col items-center rounded-card border-2 px-4 py-2 transition-colors',
                ativo
                  ? 'border-pinheiro-700 bg-pinheiro-700 text-white'
                  : 'border-neve-300 bg-white text-pinheiro-600',
              ].join(' ')}
            >
              <span className="text-sm font-bold">{d.rotulo}</span>
              <span
                className={`text-xs ${ativo ? 'text-pinheiro-100' : 'text-pinheiro-400'}`}
              >
                {ddmm(d.data)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Cabeçalho do dia + clima */}
      <section
        className="anim-fade-up rounded-card bg-gradient-to-br from-pinheiro-600 to-pinheiro-800 p-5 text-white"
        key={dia.id}
      >
        <p className="text-xs font-semibold tracking-wide text-pinheiro-100 uppercase">
          {dia.rotulo} · {ddmm(dia.data)}
        </p>
        <h2 className="mt-0.5 text-lg font-bold">{dia.titulo}</h2>
        <ClimaDoDia clima={previsao[dia.data]} />
      </section>

      {/* Paradas */}
      <div className="flex items-baseline justify-between px-1">
        <span className="text-sm text-pinheiro-500">
          {dia.paradas.length} paradas
        </span>
        <span className="text-sm font-bold text-pinheiro-700">
          {feitas}/{dia.paradas.length} ✓
        </span>
      </div>

      <ol className="space-y-2.5">
        {dia.paradas.map((parada, i) => (
          <ParadaItem
            key={parada.id}
            parada={parada}
            numero={i + 1}
            feito={Boolean(guia.roteiro?.[parada.id])}
            aoAlternar={() => marcarParada(parada.id, !guia.roteiro?.[parada.id])}
          />
        ))}
      </ol>
    </div>
  )
}

function ClimaDoDia({ clima }) {
  if (!clima) return null
  return (
    <div className="mt-3 flex items-center gap-3 rounded-card bg-white/15 px-3.5 py-2.5">
      <span aria-hidden="true" className="text-2xl">
        {clima.emoji}
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{clima.label}</p>
        <p className="text-pinheiro-100">
          {[
            clima.tmax != null && clima.tmin != null
              ? `${clima.tmax}° / ${clima.tmin}°`
              : null,
            clima.chuva != null ? `💧 ${clima.chuva}% de chuva` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </div>
  )
}

function ParadaItem({ parada, numero, feito, aoAlternar }) {
  return (
    <li className="flex items-start gap-1.5 rounded-card bg-white p-3.5 shadow-card">
      <button
        type="button"
        onClick={aoAlternar}
        aria-pressed={feito}
        aria-label={feito ? 'Desmarcar parada' : 'Marcar como visitada'}
        className="grid size-11 shrink-0 place-items-center rounded-full transition-colors"
      >
        <span
          className={[
            'grid size-7 place-items-center rounded-full border-2 text-sm',
            feito
              ? 'border-pinheiro-600 bg-pinheiro-600 text-white'
              : 'border-neve-300 text-transparent',
          ].join(' ')}
        >
          ✓
        </span>
      </button>

      <div className="min-w-0 flex-1 pt-1.5">
        <p
          className={[
            'font-semibold',
            feito ? 'text-pinheiro-500 line-through' : 'text-pinheiro-800',
          ].join(' ')}
        >
          <span className="text-pinheiro-500">{numero}.</span> {parada.nome}
        </p>
        {parada.obs && (
          <p className="mt-0.5 text-sm text-pinheiro-500">{parada.obs}</p>
        )}

        <LinksLocal local={parada.local} className="mt-2" />
      </div>
    </li>
  )
}
