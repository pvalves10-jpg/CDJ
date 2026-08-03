import { useLocalizacao } from '../../hooks/useLocalizacao'

/**
 * Banner para ligar a localização em tempo real. Uma vez autorizada, o app
 * mostra a distância e uma estimativa de corrida até cada destino e já abre o
 * Uber com a sua partida. Fica discreto quando já está ativa.
 */
export default function AtivarLocalizacao({ className = '' }) {
  const { status, posicao, pedir } = useLocalizacao()
  const ativa = Boolean(posicao) && (status === 'ok' || status === 'cache')

  if (ativa) {
    return (
      <button
        type="button"
        onClick={pedir}
        className={`flex w-full items-center gap-2.5 rounded-card bg-pinheiro-50 px-3.5 py-2.5 text-left ${className}`}
      >
        <span aria-hidden="true" className="text-base">
          📍
        </span>
        <span className="min-w-0 flex-1 text-xs leading-snug text-pinheiro-700">
          <span className="font-semibold">Localização ativa</span>
          {status === 'ok'
            ? ' — distância e preço estimado nos destinos.'
            : ' (última conhecida) — toque para atualizar.'}
        </span>
        {status === 'ok' && (
          <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pinheiro-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-pinheiro-500" />
          </span>
        )}
      </button>
    )
  }

  const pedindo = status === 'pedindo'
  const negado = status === 'negado'
  const indisponivel = status === 'indisponivel'

  return (
    <div
      className={`rounded-card border border-neve-300 bg-white px-3.5 py-3 shadow-card ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span aria-hidden="true" className="text-lg leading-none">
          📍
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-pinheiro-800">
            Usar minha localização
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-pinheiro-500">
            {negado
              ? 'Permissão negada. Ative a localização para este site nas configurações do navegador e recarregue.'
              : indisponivel
                ? 'Não consegui acessar o GPS deste aparelho.'
                : 'Para ver a distância e uma estimativa de preço da corrida até cada destino, e já abrir o Uber com a sua partida.'}
          </p>
        </div>
      </div>
      {!negado && !indisponivel && (
        <button
          type="button"
          onClick={pedir}
          disabled={pedindo}
          className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-pinheiro-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-pinheiro-700 disabled:opacity-70"
        >
          {pedindo ? 'Obtendo localização…' : 'Ativar localização'}
        </button>
      )}
    </div>
  )
}
