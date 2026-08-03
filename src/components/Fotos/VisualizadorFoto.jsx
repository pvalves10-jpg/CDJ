import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import ImagemDrive from './ImagemDrive'
import { prefetchImagem } from '../../services/drive'
import { useEscape } from '../../hooks/useEscape'

export default function VisualizadorFoto({ fotos, indice, aoFechar, aoNavegar }) {
  const foto = fotos[indice]

  // Fecha no Esc pela pilha: se estiver por cima de um modal, só ele fecha.
  useEscape(aoFechar)

  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.key === 'ArrowLeft') aoNavegar(-1)
      if (evento.key === 'ArrowRight') aoNavegar(1)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aoNavegar])

  // Adianta as vizinhas para o swipe ficar instantâneo (cai no cache).
  useEffect(() => {
    ;[fotos[indice - 1], fotos[indice + 1]].forEach(
      (f) => f && prefetchImagem(f.id),
    )
  }, [indice, fotos])

  if (!foto) return null

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-[60] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={foto.name}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-white">
        <p className="min-w-0 flex-1 truncate text-sm text-white/70">
          {foto.name}
        </p>
        <span className="shrink-0 text-xs text-white/50 tabular-nums">
          {indice + 1}/{fotos.length}
        </span>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="-mr-2 shrink-0 rounded-full px-2.5 py-1 text-2xl leading-none text-white/70 hover:bg-white/10 hover:text-white"
        >
          ×
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <ImagemDrive
          key={foto.id}
          foto={foto}
          alta
          alt={foto.name}
          className="max-h-full max-w-full object-contain"
        />

        {fotos.length > 1 && (
          <>
            <SetaNav direcao={-1} aoClicar={() => aoNavegar(-1)} />
            <SetaNav direcao={1} aoClicar={() => aoNavegar(1)} />
          </>
        )}
      </div>

      <div className="h-[max(1rem,env(safe-area-inset-bottom))] shrink-0" />
    </div>,
    document.body,
  )
}

function SetaNav({ direcao, aoClicar }) {
  const anterior = direcao < 0
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={anterior ? 'Foto anterior' : 'Próxima foto'}
      className={[
        'absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full',
        'bg-black/40 text-xl text-white/80 backdrop-blur-sm hover:bg-black/60 hover:text-white',
        anterior ? 'left-3' : 'right-3',
      ].join(' ')}
    >
      <span aria-hidden="true">{anterior ? '‹' : '›'}</span>
    </button>
  )
}
