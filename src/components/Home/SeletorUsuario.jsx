import Avatar from './Avatar'
import { USUARIOS } from '../../utils/constantes'

/** Primeira abertura do app: só some depois de escolher. */
export default function SeletorUsuario({ aoEscolher }) {
  return (
    <div className="anim-fade-in fixed inset-0 z-50 grid place-items-center bg-pinheiro-800 px-6">
      <div className="anim-fade-up w-full max-w-xs text-center">
        <span aria-hidden="true" className="text-5xl">
          🏔️
        </span>
        <h2 className="mt-3 text-xl font-extrabold text-white">
          Quem é você?
        </h2>
        <p className="mt-1.5 text-sm text-pinheiro-200">
          Fica salvo neste aparelho. Dá para trocar em Configurações.
        </p>

        <div className="mt-7 space-y-3">
          {USUARIOS.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => aoEscolher(u.id)}
              className="flex w-full items-center gap-4 rounded-card bg-white/10 px-4 py-3.5 text-left font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/25"
            >
              <Avatar id={u.id} tamanho="size-12" />
              {u.nome}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
