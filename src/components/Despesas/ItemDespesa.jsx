import { useRef, useState } from 'react'
import { formatarDataCurta, formatarMoeda } from '../../utils/formatters'
import { acharCategoria, primeiroNome } from '../../utils/constantes'

const LARGURA_ACOES = 152
/** Só considera arrasto horizontal depois deste deslocamento, senão atrapalha o scroll. */
const LIMIAR = 8

export default function ItemDespesa({
  despesa,
  categorias,
  onEditar,
  onExcluir,
  onVerComprovante,
  onAbrir,
}) {
  const [dx, setDx] = useState(0)
  const [arrastando, setArrastando] = useState(false)
  const inicio = useRef(null)
  const eixo = useRef(null)

  const categoria = acharCategoria(despesa.categoria, categorias)
  const aberto = dx <= -LARGURA_ACOES / 2

  function aoPressionar(evento) {
    if (evento.pointerType === 'mouse' && evento.button !== 0) return
    inicio.current = { x: evento.clientX, y: evento.clientY, base: dx }
    eixo.current = null
  }

  function aoMover(evento) {
    if (!inicio.current) return
    const deltaX = evento.clientX - inicio.current.x
    const deltaY = evento.clientY - inicio.current.y

    if (!eixo.current) {
      if (Math.abs(deltaX) < LIMIAR && Math.abs(deltaY) < LIMIAR) return
      // Decide de uma vez: ou é swipe, ou é scroll da lista.
      eixo.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y'
      if (eixo.current === 'x') {
        setArrastando(true)
        evento.currentTarget.setPointerCapture?.(evento.pointerId)
      }
    }
    if (eixo.current !== 'x') return

    const proximo = Math.min(0, Math.max(-LARGURA_ACOES, inicio.current.base + deltaX))
    setDx(proximo)
  }

  function aoSoltar() {
    if (!inicio.current) return
    const movimento = eixo.current
    const base = inicio.current.base
    inicio.current = null
    eixo.current = null
    setArrastando(false)
    if (movimento === 'x') {
      setDx(dx < -LARGURA_ACOES / 2 ? -LARGURA_ACOES : 0)
    } else if (movimento === null) {
      // Toque limpo (sem arrasto nem scroll): abre os detalhes — ou fecha as
      // ações, se o swipe estiver aberto.
      if (base !== 0) setDx(0)
      else onAbrir?.(despesa)
    }
  }

  // pointercancel = o navegador assumiu o scroll: só acomoda o item, nunca
  // interpreta como toque (senão uma rolagem rápida abriria os detalhes).
  function aoCancelar() {
    if (!inicio.current) return
    inicio.current = null
    eixo.current = null
    setArrastando(false)
    setDx((d) => (d < -LARGURA_ACOES / 2 ? -LARGURA_ACOES : 0))
  }

  function fechar() {
    setDx(0)
  }

  return (
    <li className="relative overflow-hidden rounded-card bg-white shadow-card">
      {/* Ações reveladas pelo swipe */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: LARGURA_ACOES }}
        aria-hidden={!aberto}
      >
        <button
          type="button"
          tabIndex={aberto ? 0 : -1}
          onClick={() => {
            fechar()
            onEditar(despesa)
          }}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-pinheiro-600 text-xs font-bold text-white"
        >
          <span aria-hidden="true" className="text-base">
            ✏️
          </span>
          Editar
        </button>
        <button
          type="button"
          tabIndex={aberto ? 0 : -1}
          onClick={() => {
            fechar()
            onExcluir(despesa)
          }}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-red-600 text-xs font-bold text-white"
        >
          <span aria-hidden="true" className="text-base">
            🗑️
          </span>
          Excluir
        </button>
      </div>

      <div
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoCancelar}
        style={{
          transform: `translateX(${dx}px)`,
          transition: arrastando ? 'none' : 'transform 0.22s cubic-bezier(0.22,1,0.36,1)',
          touchAction: 'pan-y',
        }}
        className="relative flex cursor-pointer items-center gap-3 bg-white px-4 py-3.5 select-none"
      >
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-pinheiro-50 text-xl"
        >
          {categoria.emoji}
        </span>

        <div className="min-w-0 flex-1">
          {/* Abrir detalhes é o toque no item inteiro (aoSoltar) — sem botão
              aqui para não matar o swipe que começa sobre o título. */}
          <p className="truncate font-semibold text-pinheiro-900">
            {despesa.local || categoria.label}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-pinheiro-500">
            <span>{formatarDataCurta(despesa.data)}</span>
            <span aria-hidden="true">·</span>
            <span className="rounded-full bg-neve-200 px-1.5 py-0.5 font-semibold text-pinheiro-600">
              {primeiroNome(despesa.pagador)} pagou
            </span>
            {despesa.comprovante_drive_id && (
              <button
                type="button"
                onClick={() => onVerComprovante?.(despesa)}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Ver comprovante"
                title="Ver comprovante"
                className="-my-1 rounded-full px-1 py-1 leading-none text-pinheiro-400 hover:text-pinheiro-700"
              >
                📎
              </button>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="font-bold tabular-nums text-pinheiro-800">
            {formatarMoeda(despesa.valor)}
          </span>
          {/* Alternativa ao swipe: teclado, mouse e leitores de tela. */}
          <button
            type="button"
            onClick={() => setDx(aberto ? 0 : -LARGURA_ACOES)}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={`Ações para ${despesa.local || 'despesa'}`}
            aria-expanded={aberto}
            className="-mr-2 rounded-full px-2 py-1 text-pinheiro-400 hover:bg-neve-200 hover:text-pinheiro-700"
          >
            ⋯
          </button>
        </div>
      </div>
    </li>
  )
}
