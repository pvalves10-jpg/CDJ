import { Link } from 'react-router-dom'
import LinksLocal from '../ui/LinksLocal'
import Botao from '../ui/Botao'
import { useDespesas } from '../../hooks/useDespesas'
import { useClima } from '../../hooks/useClima'
import { ROTEIRO } from '../../utils/guia'
import { hojeISO } from '../../utils/formatters'

/**
 * Card "Agora na viagem" — só aparece quando hoje cai dentro do roteiro.
 * Mostra o dia, o clima, o progresso e a próxima parada com Maps/Waze + "cheguei".
 */
export default function Hoje() {
  const { guia, marcarParada } = useDespesas()
  const { previsao } = useClima()

  const dia = ROTEIRO.find((d) => d.data === hojeISO())
  if (!dia) return null

  const clima = previsao[dia.data]
  const feitas = dia.paradas.filter((p) => guia.roteiro?.[p.id]).length
  const proxima = dia.paradas.find((p) => !guia.roteiro?.[p.id])
  const proporcao = Math.round((feitas / dia.paradas.length) * 100)

  return (
    <section className="anim-fade-up rounded-card bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-outono-600 uppercase">
            Agora na viagem
          </p>
          <h2 className="text-base font-bold text-pinheiro-800">
            {dia.rotulo} · {dia.titulo}
          </h2>
        </div>
        {clima && (
          <div className="shrink-0 text-right">
            <p className="text-2xl leading-none">{clima.emoji}</p>
            {clima.tmax != null && clima.tmin != null && (
              <p className="mt-0.5 text-xs font-semibold text-pinheiro-500">
                {clima.tmax}°/{clima.tmin}°
                {clima.chuva != null && ` · 💧${clima.chuva}%`}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neve-200">
          <div
            className="h-full rounded-full bg-pinheiro-500 transition-[width] duration-500"
            style={{ width: `${proporcao}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-pinheiro-500">
          {feitas}/{dia.paradas.length}
        </span>
      </div>

      {proxima ? (
        <div className="mt-3 rounded-card bg-neve p-3">
          <p className="text-xs font-semibold text-pinheiro-500">
            Próxima parada
          </p>
          <p className="font-semibold text-pinheiro-800">{proxima.nome}</p>
          {proxima.obs && (
            <p className="text-sm text-pinheiro-500">{proxima.obs}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <LinksLocal local={proxima.local} />
            <Botao tamanho="sm" onClick={() => marcarParada(proxima.id, true)}>
              Cheguei ✓
            </Botao>
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-card bg-pinheiro-50 p-3 text-sm font-semibold text-pinheiro-700">
          Roteiro de hoje concluído! 🎉
        </p>
      )}

      <Link
        to="/roteiro"
        className="mt-3 flex min-h-11 items-center justify-center text-sm font-semibold text-outono-600"
      >
        Ver roteiro completo →
      </Link>
    </section>
  )
}
