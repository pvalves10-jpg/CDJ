import { useEffect, useRef, useState } from 'react'

/**
 * FAB com duas entradas: foto de comprovante (lida pelo Gemini) e manual.
 * Ancorado na coluna de conteúdo, não na viewport, para não descolar do
 * layout em telas largas.
 */
export default function BotaoAdicionar({ aoEscolherFoto, aoEscolherManual }) {
  const [aberto, setAberto] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!aberto) return

    const aoClicarFora = (evento) => {
      if (!containerRef.current?.contains(evento.target)) setAberto(false)
    }
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') setAberto(false)
    }

    document.addEventListener('pointerdown', aoClicarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('pointerdown', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  function selecionarArquivo(evento) {
    const arquivo = evento.target.files?.[0]
    // Zera o input para que escolher a mesma foto de novo dispare o onChange.
    evento.target.value = ''
    if (arquivo) aoEscolherFoto(arquivo)
  }

  return (
    <>
      {/* Sem `capture`: o celular oferece câmera E galeria. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={selecionarArquivo}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {aberto && (
        <div
          className="anim-fade-in fixed inset-0 z-30 bg-pinheiro-900/25"
          aria-hidden="true"
        />
      )}

      {/* Sobe acima do FAB do chat (canto inferior direito) para não colidir. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-40">
        <div
          ref={containerRef}
          className="mx-auto flex max-w-md flex-col items-end gap-2.5 px-5"
        >
          {aberto && (
            <>
              <OpcaoFab
                emoji="📷"
                rotulo="Fotografar comprovante"
                atraso={0}
                onClick={() => {
                  setAberto(false)
                  inputRef.current?.click()
                }}
              />
              <OpcaoFab
                emoji="✏️"
                rotulo="Inserir manualmente"
                atraso={40}
                onClick={() => {
                  setAberto(false)
                  aoEscolherManual()
                }}
              />
            </>
          )}

          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-label={aberto ? 'Fechar menu' : 'Nova despesa'}
            aria-expanded={aberto}
            className="pointer-events-auto grid size-14 place-items-center rounded-full bg-outono-500 text-3xl leading-none text-white shadow-flutuante transition-transform duration-200 active:scale-95"
            style={{ transform: aberto ? 'rotate(45deg)' : 'none' }}
          >
            <span aria-hidden="true" className="-mt-0.5">
              +
            </span>
          </button>
        </div>
      </div>
    </>
  )
}

function OpcaoFab({ emoji, rotulo, onClick, atraso }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${atraso}ms` }}
      className="anim-fade-up pointer-events-auto flex items-center gap-2.5 rounded-full bg-white py-3 pr-5 pl-4 text-sm font-semibold text-pinheiro-800 shadow-flutuante"
    >
      <span aria-hidden="true" className="text-lg">
        {emoji}
      </span>
      {rotulo}
    </button>
  )
}
