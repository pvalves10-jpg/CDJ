import { useEffect, useRef, useState } from 'react'
import { useDrive } from '../../hooks/useDrive'
import { conversar } from '../../services/chat'
import { Spinner } from '../ui/Botao'

const SAUDACAO = {
  autor: 'ia',
  texto:
    'Oi! ✨ Sou o roteirista de vocês em Campos do Jordão. Pergunte o que quiser: onde comer, o que fazer se chover, passeios românticos, dicas de cada lugar, rotas...',
}

const GRADIENTE = 'bg-gradient-to-br from-blue-500 via-indigo-500 to-fuchsia-500'

export default function ChatGemini() {
  const { autenticado } = useDrive()
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState([SAUDACAO])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const fimRef = useRef(null)

  useEffect(() => {
    if (aberto) fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, pensando, aberto])

  // O chat depende do Apps Script (a chave do Gemini vive lá): sem configurar, some.
  if (!autenticado) return null

  async function enviar() {
    const pergunta = texto.trim()
    if (!pergunta || pensando) return
    const nova = [...mensagens, { autor: 'user', texto: pergunta }]
    setMensagens(nova)
    setTexto('')
    setPensando(true)
    try {
      const resposta = await conversar(nova)
      setMensagens((m) => [...m, { autor: 'ia', texto: resposta }])
    } catch (e) {
      setMensagens((m) => [
        ...m,
        { autor: 'ia', texto: `Ops — ${e.message}` },
      ])
    } finally {
      setPensando(false)
    }
  }

  return (
    <>
      {!aberto && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[max(6.5rem,calc(env(safe-area-inset-bottom)+6rem))] z-40">
          <div className="mx-auto flex max-w-md justify-end px-4">
            <button
              type="button"
              onClick={() => setAberto(true)}
              aria-label="Abrir o roteirista IA"
              className={`pointer-events-auto grid size-14 place-items-center rounded-full text-2xl text-white shadow-flutuante transition-transform active:scale-95 ${GRADIENTE}`}
            >
              <span aria-hidden="true">✨</span>
            </button>
          </div>
        </div>
      )}

      {aberto && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Fechar chat"
            onClick={() => setAberto(false)}
            className="anim-fade-in absolute inset-0 bg-pinheiro-900/40"
          />

          <div className="anim-slide-up relative mx-auto flex h-[82vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-neve shadow-flutuante">
            <header className={`flex items-center gap-3 px-4 py-3 text-white ${GRADIENTE}`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 text-lg">
                ✨
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-tight">Roteirista IA</p>
                <p className="truncate text-xs text-white/80">
                  Especialista em Campos do Jordão
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="grid size-9 shrink-0 place-items-center rounded-full text-lg hover:bg-white/15"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {mensagens.map((m, i) => (
                <Balao key={i} autor={m.autor} texto={m.texto} />
              ))}
              {pensando && <Balao autor="ia" texto="digitando…" pensando />}
              <div ref={fimRef} />
            </div>

            <div className="flex items-end gap-2 border-t border-neve-300 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    enviar()
                  }
                }}
                rows={1}
                placeholder="Pergunte sobre Campos do Jordão..."
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-neve-300 px-4 py-2.5 text-[15px] outline-none focus:border-pinheiro-500"
              />
              <button
                type="button"
                onClick={enviar}
                disabled={!texto.trim() || pensando}
                aria-label="Enviar"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-pinheiro-700 text-white transition-colors disabled:bg-pinheiro-300"
              >
                {pensando ? <Spinner /> : <span aria-hidden="true">➤</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Balao({ autor, texto, pensando = false }) {
  const ehIa = autor === 'ia'
  return (
    <div className={`flex ${ehIa ? 'justify-start' : 'justify-end'}`}>
      <div
        className={[
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          ehIa
            ? 'bg-white text-pinheiro-800 shadow-card'
            : 'bg-pinheiro-700 text-white',
          pensando ? 'anim-pulse-suave italic' : '',
        ].join(' ')}
      >
        {texto}
      </div>
    </div>
  )
}
