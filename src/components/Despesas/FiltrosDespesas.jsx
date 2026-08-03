import { useState } from 'react'
import Modal from '../ui/Modal'

/** Opções de ordenação (id + rótulo mostrado no botão e no menu). */
const ORDENS = [
  { id: 'data_desc', emoji: '🕒', label: 'Mais recentes' },
  { id: 'data_asc', emoji: '🕒', label: 'Mais antigas' },
  { id: 'valor_desc', emoji: '💰', label: 'Maior valor' },
  { id: 'valor_asc', emoji: '💰', label: 'Menor valor' },
  { id: 'categoria', emoji: '🏷️', label: 'Categoria' },
]

function rotuloOrdem(id) {
  return ORDENS.find((o) => o.id === id)?.label ?? 'Ordenar'
}

/**
 * Controles da lista de despesas: ordenação (bottom-sheet) + filtro por
 * categoria (chips roláveis). Só mostra chips de categorias que têm despesas.
 */
export default function FiltrosDespesas({
  ordem,
  aoMudarOrdem,
  categoria,
  aoMudarCategoria,
  categorias,
  contagem,
  total,
}) {
  const [menu, setMenu] = useState(false)
  const presentes = categorias.filter((c) => contagem[c.id])

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => setMenu(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-neve-300 bg-white px-3.5 text-sm font-semibold text-pinheiro-700 shadow-card active:bg-neve"
      >
        <span aria-hidden="true">↕️</span>
        {rotuloOrdem(ordem)}
        <span aria-hidden="true" className="text-pinheiro-400">
          ▾
        </span>
      </button>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
        <Chip
          ativo={!categoria}
          onClick={() => aoMudarCategoria(null)}
          label="Tudo"
          n={total}
        />
        {presentes.map((c) => (
          <Chip
            key={c.id}
            ativo={categoria === c.id}
            onClick={() => aoMudarCategoria(c.id)}
            emoji={c.emoji}
            label={c.label}
            n={contagem[c.id]}
          />
        ))}
      </div>

      <Modal aberto={menu} aoFechar={() => setMenu(false)} titulo="Ordenar por">
        <ul className="space-y-1">
          {ORDENS.map((o) => {
            const ativo = o.id === ordem
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    aoMudarOrdem(o.id)
                    setMenu(false)
                  }}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-card px-3.5 py-2.5 text-left transition-colors ${
                    ativo ? 'bg-pinheiro-50' : 'hover:bg-neve'
                  }`}
                >
                  <span aria-hidden="true" className="text-lg">
                    {o.emoji}
                  </span>
                  <span
                    className={`flex-1 font-semibold ${ativo ? 'text-pinheiro-800' : 'text-pinheiro-700'}`}
                  >
                    {o.label}
                  </span>
                  {ativo && (
                    <span aria-hidden="true" className="font-bold text-pinheiro-600">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </Modal>
    </div>
  )
}

function Chip({ ativo, onClick, emoji, label, n }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={[
        'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors',
        ativo
          ? 'bg-pinheiro-700 text-white'
          : 'bg-neve-200 text-pinheiro-700 hover:bg-neve-300',
      ].join(' ')}
    >
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {label}
      <span
        className={`tabular-nums ${ativo ? 'text-white/70' : 'text-pinheiro-400'}`}
      >
        {n}
      </span>
    </button>
  )
}
