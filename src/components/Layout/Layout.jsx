import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Drawer from './Drawer'
import ChatGemini from '../Chat/ChatGemini'
import { useUsuario } from '../../hooks/useUsuario'
import { useDespesas } from '../../hooks/useDespesas'
import { SECOES } from '../../utils/constantes'

function tituloDaRota(caminho) {
  return SECOES.find((s) => s.para === caminho)?.rotulo ?? 'CDJ'
}

export default function Layout() {
  const [menuAberto, setMenuAberto] = useState(false)
  const { pathname } = useLocation()
  const [usuario] = useUsuario()
  const { salvando, pendente } = useDespesas()

  const naHome = pathname === '/'

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-neve">
      <header className="sticky top-0 z-20 flex items-center gap-1 bg-pinheiro-700 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2.5 text-white">
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          className="grid size-11 place-items-center rounded-full transition-colors hover:bg-white/10"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ☰
          </span>
        </button>

        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">
          {naHome ? 'CDJ' : tituloDaRota(pathname)}
        </h1>

        {/* Indicador discreto de gravação no Drive. */}
        {salvando && (
          <span
            className="mr-2 flex items-center gap-1.5 text-xs text-pinheiro-200"
            role="status"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-outono-300" />
            salvando
          </span>
        )}
      </header>

      {pendente && (
        <div
          role="status"
          className="bg-outono-100 px-4 py-1.5 text-center text-xs font-semibold text-outono-800"
        >
          🔌 Offline — suas alterações serão enviadas quando a conexão voltar.
        </div>
      )}

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <Drawer
        aberto={menuAberto}
        aoFechar={() => setMenuAberto(false)}
        usuario={usuario}
      />

      <ChatGemini />
    </div>
  )
}
