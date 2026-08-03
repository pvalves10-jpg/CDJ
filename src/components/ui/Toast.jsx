import { useSyncExternalStore } from 'react'
import { assinarToasts, fecharToast, getToasts } from '../../services/toast'

const ESTILOS = {
  ok: 'bg-pinheiro-700 text-white',
  erro: 'bg-red-600 text-white',
  aviso: 'bg-outono-500 text-white',
}

const EMOJIS = { ok: '✅', erro: '⚠️', aviso: '💡' }

/** Fica montado uma vez no topo da árvore; o store cuida do resto. */
export default function Toasts() {
  const toasts = useSyncExternalStore(assinarToasts, getToasts, getToasts)

  if (!toasts.length) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => fecharToast(t.id)}
          className={[
            'anim-fade-up pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-card px-4 py-3',
            'text-left text-sm font-medium shadow-flutuante',
            ESTILOS[t.tipo],
          ].join(' ')}
        >
          <span aria-hidden="true" className="shrink-0 leading-5">
            {EMOJIS[t.tipo]}
          </span>
          <span className="min-w-0 flex-1 break-words leading-snug">
            {t.texto}
          </span>
        </button>
      ))}
    </div>
  )
}
