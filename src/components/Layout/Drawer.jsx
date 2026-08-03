import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { nomeUsuario, SECOES } from '../../utils/constantes'

export default function Drawer({ aberto, aoFechar, usuario }) {
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, aoFechar])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={aoFechar}
        className="anim-fade-in absolute inset-0 bg-pinheiro-900/45"
      />

      <nav
        aria-label="Menu principal"
        className="anim-slide-in relative flex w-[17rem] max-w-[80vw] flex-col bg-white shadow-flutuante"
      >
        <div className="bg-pinheiro-700 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5 text-white">
          <p className="text-xl font-extrabold">CDJ</p>
          <p className="text-sm text-pinheiro-200">Campos do Jordão</p>
        </div>

        <ul className="flex-1 space-y-1 p-3">
          {SECOES.map((secao) => (
            <li key={secao.para}>
              <NavLink
                to={secao.para}
                end={secao.para === '/'}
                onClick={aoFechar}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-card px-3.5 py-3 text-[15px] font-semibold transition-colors',
                    isActive
                      ? 'bg-pinheiro-50 text-pinheiro-800'
                      : 'text-pinheiro-600 hover:bg-neve',
                  ].join(' ')
                }
              >
                <span aria-hidden="true" className="text-lg">
                  {secao.emoji}
                </span>
                {secao.rotulo}
              </NavLink>
            </li>
          ))}
        </ul>

        {usuario && (
          <footer className="border-t border-neve-200 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="text-xs text-pinheiro-400">Conectado como</p>
            <p className="text-sm font-semibold text-pinheiro-700">
              {nomeUsuario(usuario)}
            </p>
          </footer>
        )}
      </nav>
    </div>
  )
}
