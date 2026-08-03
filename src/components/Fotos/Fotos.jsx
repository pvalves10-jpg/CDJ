import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ImagemDrive from './ImagemDrive'
import VisualizadorFoto from './VisualizadorFoto'
import Botao from '../ui/Botao'
import { useFotos } from '../../hooks/useFotos'
import { useDrive } from '../../hooks/useDrive'
import { ROTEIRO, INICIO_VIAGEM, FIM_VIAGEM } from '../../utils/guia'
import { formatarDataCurta } from '../../utils/formatters'

const LOTE = 18

/** Agrupa as fotos por dia da viagem (e Antes/Depois), em ordem cronológica. */
function agrupar(fotos) {
  const grupoDe = (foto) => {
    const data = String(foto.createdTime || '').slice(0, 10)
    const dia = ROTEIRO.find((d) => d.data === data)
    if (dia) {
      const ordem = ROTEIRO.indexOf(dia)
      return {
        chave: dia.id,
        ordem,
        titulo: `${dia.rotulo} · ${formatarDataCurta(data)}`,
        subtitulo: dia.titulo,
      }
    }
    if (data && data < INICIO_VIAGEM)
      return { chave: 'antes', ordem: -1, titulo: 'Antes da viagem' }
    if (data && data > FIM_VIAGEM)
      return { chave: 'depois', ordem: 90, titulo: 'Depois da viagem' }
    return { chave: 'outros', ordem: 99, titulo: 'Outras fotos' }
  }

  const mapa = new Map()
  for (const foto of fotos) {
    const g = grupoDe(foto)
    if (!mapa.has(g.chave)) mapa.set(g.chave, { ...g, fotos: [] })
    mapa.get(g.chave).fotos.push(foto)
  }
  const grupos = [...mapa.values()].sort((a, b) => a.ordem - b.ordem)
  const planas = grupos.flatMap((g) => g.fotos)
  return { grupos, planas }
}

export default function Fotos() {
  const { fotos, carregando, envios, enviar } = useFotos()
  const { autenticado } = useDrive()
  const [aberta, setAberta] = useState(null)
  const [visiveis, setVisiveis] = useState(LOTE)
  const inputRef = useRef(null)
  const sentinelaRef = useRef(null)

  const { grupos, planas } = useMemo(() => agrupar(fotos), [fotos])
  const temMais = planas.length > visiveis

  // Carrega mais lotes quando o fim da lista se aproxima.
  useEffect(() => {
    const el = sentinelaRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting) setVisiveis((v) => v + LOTE)
      },
      { rootMargin: '600px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [temMais])

  function selecionar(evento) {
    const arquivos = evento.target.files
    evento.target.value = ''
    if (arquivos?.length) enviar(arquivos)
  }

  function navegar(passo) {
    setAberta((i) => (i + passo + planas.length) % planas.length)
  }

  // Monta as seções respeitando o limite `visiveis` (índice global em `planas`).
  const secoes = []
  let global = 0
  for (const g of grupos) {
    const daqui = []
    for (const foto of g.fotos) {
      if (global < visiveis) daqui.push({ foto, idx: global })
      global++
    }
    if (daqui.length) {
      secoes.push({
        chave: g.chave,
        titulo: g.titulo,
        subtitulo: g.subtitulo,
        total: g.fotos.length,
        fotos: daqui,
      })
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={selecionar}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {!autenticado ? (
        <div className="mx-4 mt-4 rounded-card bg-white p-5 text-center shadow-card">
          <p className="text-sm leading-relaxed text-pinheiro-600">
            Configure o acesso ao Drive para ver e enviar fotos.
          </p>
          <Link to="/configuracoes" className="mt-3.5 block">
            <Botao largura>Configurar</Botao>
          </Link>
        </div>
      ) : (
        <div className="px-4 pt-4">
          <Botao largura variante="accent" onClick={() => inputRef.current?.click()}>
            <span aria-hidden="true">📤</span> Enviar fotos
          </Botao>
        </div>
      )}

      {envios.length > 0 && (
        <ul className="anim-fade-up mx-4 mt-3 space-y-2 rounded-card bg-white p-3.5 shadow-card">
          {envios.map((envio, i) => (
            <li key={`${envio.nome}-${i}`}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-pinheiro-600">
                  {envio.nome}
                </span>
                <span
                  className={`shrink-0 font-semibold tabular-nums ${envio.erro ? 'text-red-600' : 'text-pinheiro-500'}`}
                >
                  {envio.erro ? 'falhou' : `${envio.progresso}%`}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neve-200">
                <div
                  className={`h-full rounded-full transition-[width] duration-200 ${envio.erro ? 'bg-red-400' : 'bg-outono-500'}`}
                  style={{ width: `${envio.erro ? 100 : envio.progresso}%` }}
                />
              </div>
              {envio.erro && (
                <p className="mt-1 text-[11px] leading-snug text-red-600">
                  {envio.erro}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex-1 p-4">
        {carregando && planas.length === 0 ? (
          <GradeEsqueleto />
        ) : planas.length === 0 ? (
          <EstadoVazio autenticado={autenticado} />
        ) : (
          <>
            {secoes.map((secao) => (
              <section key={secao.chave} className="mb-5">
                <div className="mb-2 flex items-baseline gap-2">
                  <h2 className="text-sm font-bold text-pinheiro-800">
                    {secao.titulo}
                  </h2>
                  {secao.subtitulo && (
                    <span className="min-w-0 truncate text-xs text-pinheiro-500">
                      {secao.subtitulo}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-xs text-pinheiro-500">
                    {secao.total} {secao.total === 1 ? 'foto' : 'fotos'}
                  </span>
                </div>
                <ul className="grid grid-cols-2 gap-2.5">
                  {secao.fotos.map(({ foto, idx }) => (
                    <li key={foto.id}>
                      <button
                        type="button"
                        onClick={() => setAberta(idx)}
                        className="block aspect-square w-full overflow-hidden rounded-card bg-neve-200 shadow-card transition-transform active:scale-[0.98]"
                      >
                        <ImagemDrive
                          foto={foto}
                          tamanho={400}
                          alt={foto.name}
                          className="aspect-square w-full object-cover"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {temMais && (
              <div
                ref={sentinelaRef}
                className="anim-pulse-suave py-6 text-center text-sm font-semibold text-pinheiro-400"
              >
                Carregando mais fotos…
              </div>
            )}
          </>
        )}
      </div>

      {aberta !== null && (
        <VisualizadorFoto
          fotos={planas}
          indice={aberta}
          aoFechar={() => setAberta(null)}
          aoNavegar={navegar}
        />
      )}
    </div>
  )
}

function EstadoVazio({ autenticado }) {
  return (
    <div className="anim-fade-up flex flex-col items-center gap-2 px-6 py-16 text-center">
      <span aria-hidden="true" className="text-5xl">
        📸
      </span>
      <p className="font-semibold text-pinheiro-700">Nenhuma foto ainda</p>
      <p className="max-w-[16rem] text-sm leading-relaxed text-pinheiro-500">
        {autenticado
          ? 'Envie as primeiras fotos da viagem!'
          : 'Configure o acesso ao Drive para ver as fotos já salvas.'}
      </p>
    </div>
  )
}

function GradeEsqueleto() {
  return (
    <ul className="grid grid-cols-2 gap-2.5" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <li
          key={i}
          className="anim-pulse-suave aspect-square rounded-card bg-neve-200"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </ul>
  )
}
