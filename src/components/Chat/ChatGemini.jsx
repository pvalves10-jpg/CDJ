import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDrive } from '../../hooks/useDrive'
import { conversar } from '../../services/chat'
import { toast } from '../../services/toast'
import { Spinner } from '../ui/Botao'
import { blobParaBase64, reduzirImagem } from '../../utils/imagem'
import { iniciarGravacao } from '../../utils/audio'

const SAUDACAO = {
  autor: 'ia',
  texto:
    'Oi! ✨ Sou o roteirista de vocês em Campos do Jordão. Pergunte o que quiser — posso pesquisar na web, ver uma foto que você mandar ou ouvir um áudio. O que fazer se chover? Onde jantar romântico? Manda ver!',
}

const GRADIENTE = 'bg-gradient-to-br from-blue-500 via-indigo-500 to-fuchsia-500'

export default function ChatGemini() {
  const { autenticado } = useDrive()
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState([SAUDACAO])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [anexos, setAnexos] = useState([]) // pendentes: {tipo, mimeType, base64, url?}
  const [gravando, setGravando] = useState(false)

  const fimRef = useRef(null)
  const inputImagemRef = useRef(null)
  const gravadorRef = useRef(null)

  useEffect(() => {
    if (aberto) fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, pensando, aberto, anexos])

  // O FAB é sempre visível (inclusive no mobile). Quando o Drive/Apps Script
  // ainda não foi configurado, o painel abre com um aviso amigável em vez de
  // sumir do rodapé — assim ninguém "perde" a funcionalidade por não saber
  // que ela existe.

  async function escolherImagem(evento) {
    const file = evento.target.files?.[0]
    evento.target.value = ''
    if (!file) return
    try {
      const blob = await reduzirImagem(file, 1280)
      const base64 = await blobParaBase64(blob)
      setAnexos((a) => [
        ...a,
        {
          tipo: 'imagem',
          mimeType: blob.type || 'image/jpeg',
          base64,
          url: URL.createObjectURL(blob),
        },
      ])
    } catch {
      toast.erro('Não consegui preparar a imagem.')
    }
  }

  async function alternarGravacao() {
    if (gravando) {
      try {
        const wav = await gravadorRef.current?.parar()
        gravadorRef.current = null
        setGravando(false)
        if (wav) {
          const base64 = await blobParaBase64(wav)
          setAnexos((a) => [
            ...a,
            { tipo: 'audio', mimeType: 'audio/wav', base64 },
          ])
        }
      } catch {
        setGravando(false)
        toast.erro('Não consegui gravar o áudio.')
      }
      return
    }
    try {
      gravadorRef.current = await iniciarGravacao()
      setGravando(true)
    } catch (e) {
      toast.erro(e.message || 'Sem acesso ao microfone.')
    }
  }

  function removerAnexo(i) {
    setAnexos((a) => {
      const alvo = a[i]
      if (alvo?.url) URL.revokeObjectURL(alvo.url)
      return a.filter((_, idx) => idx !== i)
    })
  }

  async function enviar() {
    const pergunta = texto.trim()
    if ((!pergunta && !anexos.length) || pensando || gravando) return

    const msg = { autor: 'user', texto: pergunta, anexos }
    const nova = [...mensagens, msg]
    setMensagens(nova)
    setTexto('')
    setAnexos([])
    setPensando(true)
    try {
      const resposta = await conversar(nova)
      setMensagens((m) => [...m, { autor: 'ia', texto: resposta }])
    } catch (e) {
      setMensagens((m) => [...m, { autor: 'ia', texto: `Ops — ${e.message}` }])
    } finally {
      setPensando(false)
    }
  }

  return (
    <>
      {!aberto && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,calc(env(safe-area-inset-bottom)+1rem))] z-40">
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

          <div className="anim-slide-up relative mx-auto flex h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-neve shadow-flutuante">
            <header className={`flex items-center gap-3 px-4 py-3 text-white ${GRADIENTE}`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 text-lg">
                ✨
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-tight">Roteirista IA</p>
                <p className="truncate text-xs text-white/80">
                  Busca na web · foto · áudio
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
              {!autenticado ? (
                <div className="anim-fade-up mx-auto mt-8 max-w-xs rounded-card bg-white p-5 text-center shadow-card">
                  <p className="text-3xl">⚙️</p>
                  <p className="mt-2 font-bold text-pinheiro-800">
                    Chat ainda não configurado
                  </p>
                  <p className="mt-1.5 text-sm text-pinheiro-500">
                    Para o roteirista IA funcionar neste aparelho, é preciso
                    conectar o Drive/Apps Script em Configurações.
                  </p>
                  <Link
                    to="/configuracoes"
                    onClick={() => setAberto(false)}
                    className="mt-4 inline-block rounded-full bg-pinheiro-700 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Ir para Configurações
                  </Link>
                </div>
              ) : (
                <>
                  {mensagens.map((m, i) => (
                    <Balao key={i} mensagem={m} />
                  ))}
                  {pensando && (
                    <Balao mensagem={{ autor: 'ia', texto: 'digitando…' }} pensando />
                  )}
                  <div ref={fimRef} />
                </>
              )}
            </div>

            {/* Anexos pendentes */}
            {anexos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto border-t border-neve-300 bg-white px-3 pt-2">
                {anexos.map((a, i) => (
                  <div key={i} className="relative shrink-0">
                    {a.tipo === 'imagem' ? (
                      <img
                        src={a.url}
                        alt="anexo"
                        className="size-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid size-14 place-items-center rounded-lg bg-neve-200 text-xs font-semibold text-pinheiro-600">
                        🎤 áudio
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removerAnexo(i)}
                      aria-label="Remover anexo"
                      className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-red-600 text-[11px] text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-1.5 border-t border-neve-300 bg-white p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
              <input
                ref={inputImagemRef}
                type="file"
                accept="image/*"
                onChange={escolherImagem}
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => inputImagemRef.current?.click()}
                aria-label="Anexar foto"
                disabled={!autenticado}
                className="grid size-11 shrink-0 place-items-center rounded-full text-xl text-pinheiro-600 hover:bg-neve-200 disabled:opacity-40"
              >
                🖼️
              </button>
              <button
                type="button"
                onClick={alternarGravacao}
                aria-label={gravando ? 'Parar gravação' : 'Gravar áudio'}
                disabled={!autenticado}
                className={[
                  'grid size-11 shrink-0 place-items-center rounded-full text-xl transition-colors disabled:opacity-40',
                  gravando
                    ? 'anim-pulse-suave bg-red-600 text-white'
                    : 'text-pinheiro-600 hover:bg-neve-200',
                ].join(' ')}
              >
                {gravando ? '⏹️' : '🎤'}
              </button>

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
                disabled={!autenticado}
                placeholder={
                  !autenticado
                    ? 'Configure o Drive para conversar'
                    : gravando
                      ? 'Gravando áudio…'
                      : 'Pergunte algo...'
                }
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-neve-300 px-4 py-2.5 text-[15px] outline-none focus:border-pinheiro-500 disabled:bg-neve-200"
              />
              <button
                type="button"
                onClick={enviar}
                disabled={(!texto.trim() && !anexos.length) || pensando || gravando || !autenticado}
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

function Balao({ mensagem, pensando = false }) {
  const ehIa = mensagem.autor === 'ia'
  const anexos = mensagem.anexos ?? []
  return (
    <div className={`flex ${ehIa ? 'justify-start' : 'justify-end'}`}>
      <div
        className={[
          'max-w-[85%] space-y-2 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          ehIa
            ? 'bg-white text-pinheiro-800 shadow-card'
            : 'bg-pinheiro-700 text-white',
          pensando ? 'anim-pulse-suave italic' : '',
        ].join(' ')}
      >
        {anexos.map((a, i) =>
          a.tipo === 'imagem' ? (
            <img
              key={i}
              src={a.url}
              alt="anexo"
              className="max-h-48 w-full rounded-lg object-cover"
            />
          ) : (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs"
            >
              🎤 áudio enviado
            </span>
          ),
        )}
        {mensagem.texto && <p>{mensagem.texto}</p>}
      </div>
    </div>
  )
}
