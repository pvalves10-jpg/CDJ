import { useRef, useState } from 'react'
import ImagemDrive from './ImagemDrive'
import VisualizadorFoto from './VisualizadorFoto'
import Botao from '../ui/Botao'
import { useFotos } from '../../hooks/useFotos'
import { useDrive } from '../../hooks/useDrive'

export default function Fotos() {
  const { fotos, carregando, envios, enviar } = useFotos()
  const { autenticado, conectando, conectar } = useDrive()
  const [aberta, setAberta] = useState(null)
  const inputRef = useRef(null)

  function selecionar(evento) {
    const arquivos = evento.target.files
    evento.target.value = ''
    if (arquivos?.length) enviar(arquivos)
  }

  function navegar(passo) {
    setAberta((i) => (i + passo + fotos.length) % fotos.length)
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
            Conecte sua conta Google para ver e enviar fotos.
          </p>
          <Botao
            className="mt-3.5"
            largura
            carregando={conectando}
            onClick={conectar}
          >
            Conectar ao Google
          </Botao>
        </div>
      ) : (
        <div className="px-4 pt-4">
          <Botao
            largura
            variante="accent"
            onClick={() => inputRef.current?.click()}
          >
            <span aria-hidden="true">📤</span> Enviar fotos
          </Botao>
        </div>
      )}

      {envios.length > 0 && (
        <ul className="anim-fade-up mx-4 mt-3 space-y-2 rounded-card bg-white p-3.5 shadow-card">
          {/* Índice na chave: dá para selecionar dois arquivos de mesmo nome. */}
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
        {carregando && fotos.length === 0 ? (
          <GradeEsqueleto />
        ) : fotos.length === 0 ? (
          <EstadoVazio autenticado={autenticado} />
        ) : (
          <ul className="grid grid-cols-2 gap-2.5">
            {fotos.map((foto, i) => (
              <li key={foto.id}>
                <button
                  type="button"
                  onClick={() => setAberta(i)}
                  className="block w-full overflow-hidden rounded-card bg-neve-200 shadow-card transition-transform active:scale-[0.98]"
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
        )}
      </div>

      {aberta !== null && (
        <VisualizadorFoto
          fotos={fotos}
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
          : 'Conecte ao Google para ver as fotos já salvas no Drive.'}
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
