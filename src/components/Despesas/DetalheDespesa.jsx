import { useRef } from 'react'
import Modal from '../ui/Modal'
import Botao from '../ui/Botao'
import ImagemDrive from '../Fotos/ImagemDrive'
import { formatarData, formatarMoeda } from '../../utils/formatters'
import { acharCategoria, nomeUsuario, outroUsuario } from '../../utils/constantes'

/**
 * Detalhes de uma despesa: dados do lançamento, divisão 50/50 e o comprovante
 * (ver em tela cheia, anexar ou trocar). Abre ao tocar na despesa na lista.
 */
export default function DetalheDespesa({
  despesa,
  categorias,
  aoFechar,
  onEditar,
  onExcluir,
  onAnexar,
  onVerComprovante,
  anexando = false,
}) {
  const inputRef = useRef(null)
  if (!despesa) return null

  const categoria = acharCategoria(despesa.categoria, categorias)
  const cota = (Number(despesa.valor) || 0) / 2
  const devedor = outroUsuario(despesa.pagador)
  const temComprovante = Boolean(despesa.comprovante_drive_id)

  function escolher(evento) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (arquivo) onAnexar?.(despesa, arquivo)
  }

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo="Detalhes da despesa"
      rodape={
        <div className="flex gap-2.5">
          <Botao
            variante="secundario"
            onClick={() => onEditar?.(despesa)}
            className="flex-1"
          >
            <span aria-hidden="true">✏️</span> Editar
          </Botao>
          <Botao
            variante="perigo"
            onClick={() => onExcluir?.(despesa)}
            className="flex-1"
          >
            <span aria-hidden="true">🗑️</span> Excluir
          </Botao>
        </div>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={escolher}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Categoria + local + valor */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-pinheiro-50 text-2xl"
        >
          {categoria.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-tight font-bold break-words text-pinheiro-900">
            {despesa.local || categoria.label}
          </p>
          <p className="text-sm text-pinheiro-500">{categoria.label}</p>
        </div>
        <p className="shrink-0 text-lg font-bold tabular-nums text-pinheiro-800">
          {formatarMoeda(despesa.valor)}
        </p>
      </div>

      {/* Dados */}
      <dl className="mt-4 space-y-2.5 rounded-card bg-white p-3.5 text-sm shadow-card">
        <Linha rotulo="Data" valor={formatarData(despesa.data)} />
        <Linha rotulo="Quem pagou" valor={nomeUsuario(despesa.pagador)} />
        <Linha rotulo="Cota de cada um (50%)" valor={formatarMoeda(cota)} />
      </dl>

      <p className="mt-3 rounded-card bg-pinheiro-50 px-3.5 py-2.5 text-sm leading-relaxed text-pinheiro-700">
        Divisão 50/50 — <strong>{nomeUsuario(devedor)}</strong> deve{' '}
        <strong>{formatarMoeda(cota)}</strong> a{' '}
        <strong>{nomeUsuario(despesa.pagador)}</strong> nesta despesa.
      </p>

      {/* Comprovante */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold tracking-wide text-pinheiro-500 uppercase">
          Comprovante
        </p>

        {temComprovante ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onVerComprovante?.(despesa)}
              aria-label="Ver comprovante em tela cheia"
              className="grid min-h-40 w-full place-items-center overflow-hidden rounded-card bg-neve-200 shadow-card"
            >
              <ImagemDrive
                foto={{ id: despesa.comprovante_drive_id, name: 'Comprovante' }}
                tamanho={600}
                alt="Comprovante da despesa"
                className="max-h-72 min-h-40 w-full object-contain"
              />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={anexando}
              className="text-sm font-semibold text-outono-600 disabled:opacity-60"
            >
              {anexando ? 'Enviando…' : '🔁 Trocar comprovante'}
            </button>
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-neve-300 bg-white p-4 text-center">
            <p className="text-sm text-pinheiro-500">
              Nenhum comprovante anexado.
            </p>
            <Botao
              variante="secundario"
              onClick={() => inputRef.current?.click()}
              carregando={anexando}
              className="mt-3"
            >
              <span aria-hidden="true">📎</span> Anexar comprovante
            </Botao>
          </div>
        )}
      </div>
    </Modal>
  )
}

function Linha({ rotulo, valor }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-pinheiro-500">{rotulo}</dt>
      <dd className="font-semibold tabular-nums text-pinheiro-800">{valor}</dd>
    </div>
  )
}
