import { useState } from 'react'
import { useDespesas } from '../../hooks/useDespesas'
import { useClima } from '../../hooks/useClima'
import { useUsuario } from '../../hooks/useUsuario'
import LinksLocal from '../ui/LinksLocal'
import FormularioDespesa from '../Despesas/FormularioDespesa'
import { toast } from '../../services/toast'
import { ROTEIRO } from '../../utils/guia'
import { hojeISO } from '../../utils/formatters'

function ddmm(data) {
  const [, m, d] = data.split('-')
  return `${d}/${m}`
}

export default function Roteiro() {
  const { guia, marcarParada, adicionar, adicionarCategoria, categorias, salvando } =
    useDespesas()
  const { previsao } = useClima()
  const [usuario] = useUsuario()

  const hoje = hojeISO()

  // Abre no dia de hoje, se a viagem estiver rolando; senão, no primeiro dia.
  const [indice, setIndice] = useState(() => {
    const i = ROTEIRO.findIndex((d) => d.data === hoje)
    return i >= 0 ? i : 0
  })
  // Pré-preenchimento do formulário de despesa (local + data da parada).
  const [nova, setNova] = useState(null)

  const dia = ROTEIRO[indice]
  const feitas = dia.paradas.filter((p) => guia.roteiro?.[p.id]).length

  async function salvarDespesa(dados) {
    try {
      await adicionar(dados)
      toast.ok(`${dados.local} — despesa salva.`)
      setNova(null)
    } catch {
      /* o hook já avisou por toast */
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-24">
      {/* Abas dos dias */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {ROTEIRO.map((d, i) => {
          const ativo = i === indice
          const ehHoje = d.data === hoje
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
              <span className="flex items-center gap-1 text-sm font-bold">
                {d.rotulo}
                {ehHoje && (
                  <span className="rounded-full bg-outono-500 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
                    hoje
                  </span>
                )}
              </span>
              <span
                className={`text-xs ${ativo ? 'text-pinheiro-100' : 'text-pinheiro-600'}`}
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
            aoLancarDespesa={() =>
              setNova({ local: parada.nome, data: dia.data })
            }
          />
        ))}
      </ol>

      <FormularioDespesa
        aberto={Boolean(nova)}
        aoFechar={() => setNova(null)}
        aoSalvar={salvarDespesa}
        despesa={nova}
        categorias={categorias}
        usuarioAtual={usuario}
        aoCriarCategoria={adicionarCategoria}
        salvando={salvando}
      />
    </div>
  )
}

function ClimaDoDia({ clima }) {
  if (!clima) {
    return (
      <p className="mt-3 rounded-card bg-white/10 px-3.5 py-2 text-sm text-pinheiro-100">
        Previsão indisponível offline.
      </p>
    )
  }
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

function ParadaItem({ parada, numero, feito, aoAlternar, aoLancarDespesa }) {
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

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <LinksLocal local={parada.local} />
          <button
            type="button"
            onClick={aoLancarDespesa}
            className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-pinheiro-600 transition-colors hover:bg-neve-200"
          >
            ➕ despesa
          </button>
        </div>
      </div>
    </li>
  )
}
