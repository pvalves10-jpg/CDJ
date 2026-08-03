import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useEscape } from '../../hooks/useEscape'

/** Bottom sheet: sobe de baixo, ocupa no máximo 92% da altura e rola por dentro. */
export default function Modal({ aberto, aoFechar, titulo, children, rodape }) {
  useEscape(aoFechar, aberto)

  useEffect(() => {
    if (!aberto) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [aberto])

  if (!aberto) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="anim-fade-in absolute inset-0 bg-pinheiro-900/45"
      />

      <div className="anim-slide-up relative flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-2xl bg-neve shadow-flutuante">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neve-200 px-5 pt-4 pb-3">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-2 mx-auto h-1 w-10 rounded-full bg-neve-300"
          />
          <h2 className="mt-1 text-base font-bold text-pinheiro-800">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="mt-1 -mr-1 rounded-full px-2 py-1 text-xl leading-none text-pinheiro-400 hover:bg-neve-200 hover:text-pinheiro-700"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {rodape && (
          <footer className="shrink-0 border-t border-neve-200 bg-white px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {rodape}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
