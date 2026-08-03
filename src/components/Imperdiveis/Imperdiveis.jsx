import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Cartao from '../ui/Cartao'
import Botao from '../ui/Botao'
import LinksLocal from '../ui/LinksLocal'
import ImagemDrive from '../Fotos/ImagemDrive'
import { useDespesas } from '../../hooks/useDespesas'
import { useDrive } from '../../hooks/useDrive'
import { uploadFoto } from '../../services/drive'
import { toast } from '../../services/toast'
import { EXPERIENCIAS, FOTOS_SPOTS } from '../../utils/guia'

export default function Imperdiveis() {
  const { guia, marcarExperiencia, adicionarFotosSpot, removerFotoSpot } =
    useDespesas()
  const { autenticado } = useDrive()

  const [enviando, setEnviando] = useState(null) // id do spot em upload
  const alvoRef = useRef(null) // spot escolhido antes de abrir o seletor
  const inputRef = useRef(null)

  const fotosSpots = guia.fotos_spots ?? {}
  const experiencias = guia.experiencias ?? {}

  const fotosFeitas = FOTOS_SPOTS.filter(
    (s) => (fotosSpots[s.id]?.length ?? 0) > 0,
  ).length
  const expFeitas = EXPERIENCIAS.filter((e) => experiencias[e.id]).length

  function escolherFotos(spot) {
    alvoRef.current = spot
    inputRef.current?.click()
  }

  async function aoSelecionar(evento) {
    const arquivos = evento.target.files
    evento.target.value = ''
    const spot = alvoRef.current
    if (!spot || !arquivos?.length) return

    const imagens = [...arquivos].filter((f) => f.type.startsWith('image/'))
    if (!imagens.length) {
      toast.aviso('Selecione imagens.')
      return
    }

    setEnviando(spot.id)
    const ids = []
    let jaPersistido = false
    try {
      for (let i = 0; i < imagens.length; i++) {
        const arq = await uploadFoto(imagens[i], {
          nome: `${spot.id}-${Date.now()}-${i}-${imagens[i].name}`,
        })
        if (arq?.id) ids.push(arq.id)
      }
      if (ids.length) {
        // A partir daqui a falha vem do save, não do upload — o catch não repete.
        jaPersistido = true
        await adicionarFotosSpot(spot.id, ids)
        toast.ok(
          `${ids.length} foto(s) adicionada(s) a "${spot.nome}"! Também estão na galeria de Fotos.`,
        )
      }
    } catch (e) {
      // Falha no upload (não no save): grava o que já subiu, uma única vez.
      if (ids.length && !jaPersistido) {
        try {
          await adicionarFotosSpot(spot.id, ids)
        } catch {
          /* o próprio persistir já avisou */
        }
      }
      toast.erro(`Falha ao enviar: ${e.message}`)
    } finally {
      setEnviando(null)
    }
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={aoSelecionar}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {!autenticado && (
        <div className="rounded-card bg-outono-50 px-4 py-3.5 text-sm leading-relaxed text-outono-800">
          Para marcar as fotos e as experiências (e sincronizar entre vocês),{' '}
          <Link to="/configuracoes" className="font-bold underline">
            configure o acesso ao Drive
          </Link>
          .
        </div>
      )}

      <Cartao
        titulo="📸 Fotos icônicas"
        descricao={`${fotosFeitas} de ${FOTOS_SPOTS.length} registradas — marca sozinho quando vocês adicionam a foto do ponto.`}
      >
        <ul className="space-y-2.5">
          {FOTOS_SPOTS.map((spot) => (
            <SpotFoto
              key={spot.id}
              spot={spot}
              fotos={fotosSpots[spot.id] ?? []}
              enviando={enviando === spot.id}
              aoAdicionar={() => escolherFotos(spot)}
              aoRemover={(fileId) => removerFotoSpot(spot.id, fileId)}
            />
          ))}
        </ul>
      </Cartao>

      <Cartao
        titulo="✨ Experiências imperdíveis"
        descricao={`${expFeitas} de ${EXPERIENCIAS.length} feitas`}
      >
        <ul className="space-y-2">
          {EXPERIENCIAS.map((exp) => {
            const feito = Boolean(experiencias[exp.id])
            return (
              <li key={exp.id}>
                <button
                  type="button"
                  onClick={() => marcarExperiencia(exp.id, !feito)}
                  aria-pressed={feito}
                  className="flex w-full items-center gap-3 rounded-card px-2 py-2.5 text-left transition-colors hover:bg-neve"
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'grid size-7 shrink-0 place-items-center rounded-full border-2 text-sm transition-colors',
                      feito
                        ? 'border-pinheiro-600 bg-pinheiro-600 text-white'
                        : 'border-neve-300 text-transparent',
                    ].join(' ')}
                  >
                    ✓
                  </span>
                  <span aria-hidden="true" className="text-xl">
                    {exp.emoji}
                  </span>
                  <span
                    className={[
                      'font-semibold',
                      feito
                        ? 'text-pinheiro-500 line-through'
                        : 'text-pinheiro-800',
                    ].join(' ')}
                  >
                    {exp.nome}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Cartao>
    </div>
  )
}

function SpotFoto({ spot, fotos, enviando, aoAdicionar, aoRemover }) {
  const [aberto, setAberto] = useState(false)
  const [removendo, setRemovendo] = useState(null)
  const quantidade = fotos.length
  const feito = quantidade > 0

  async function remover(fileId) {
    setRemovendo(fileId)
    try {
      await aoRemover(fileId)
    } catch (e) {
      toast.erro(`Não removeu: ${e.message}`)
    } finally {
      setRemovendo(null)
    }
  }

  return (
    <li className="rounded-card bg-neve px-3 py-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={[
            'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 text-sm',
            feito
              ? 'border-pinheiro-600 bg-pinheiro-600 text-white'
              : 'border-neve-300 text-transparent',
          ].join(' ')}
        >
          ✓
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-pinheiro-800">{spot.nome}</p>
          {feito && (
            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              className="mt-0.5 text-xs font-semibold text-pinheiro-500 underline"
            >
              📷 {quantidade} {quantidade === 1 ? 'foto' : 'fotos'}{' '}
              {aberto ? '▲' : '▼'}
            </button>
          )}
          <LinksLocal local={spot.local} className="mt-2" />
        </div>

        <Botao
          variante="secundario"
          tamanho="sm"
          carregando={enviando}
          onClick={aoAdicionar}
          aria-label={
            feito
              ? `Adicionar mais fotos de ${spot.nome}, ${quantidade} registrada(s)`
              : `Adicionar foto de ${spot.nome}, ainda sem foto`
          }
        >
          {feito ? '+ fotos' : 'Adicionar'}
        </Botao>
      </div>

      {aberto && feito && (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {fotos.map((fileId) => (
            <li key={fileId} className="relative shrink-0">
              <ImagemDrive
                foto={{ id: fileId }}
                tamanho={160}
                alt={`Foto de ${spot.nome}`}
                className="size-20 rounded-card bg-neve-200 object-cover"
              />
              <button
                type="button"
                onClick={() => remover(fileId)}
                disabled={removendo === fileId}
                aria-label={`Remover foto de ${spot.nome}`}
                className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-red-600 text-xs text-white shadow-card disabled:opacity-50"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
