import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import HeroFotos from './HeroFotos'
import SeletorUsuario from './SeletorUsuario'
import ResumoSaldo from '../Saldo/ResumoSaldo'
import Botao from '../ui/Botao'
import { useDespesas } from '../../hooks/useDespesas'
import { useUsuario } from '../../hooks/useUsuario'
import { USUARIOS } from '../../utils/constantes'
import { configCompleta } from '../../utils/config'

export default function Home() {
  const { saldo } = useDespesas()
  const [usuario, setUsuario] = useUsuario()

  const faltaConfigurar = !configCompleta()

  if (!usuario) return <SeletorUsuario aoEscolher={setUsuario} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-10">
      <div className="anim-fade-up">
        <HeroFotos />
      </div>

      <section
        className="anim-fade-up flex items-center justify-center gap-5 rounded-card bg-gradient-to-br from-pinheiro-600 to-pinheiro-800 px-5 py-7"
        style={{ animationDelay: '40ms' }}
      >
        {USUARIOS.map((u) => (
          <div key={u.id} className="flex flex-col items-center gap-2">
            <Avatar id={u.id} tamanho="size-20" />
            <span className="text-xs font-semibold text-white">
              {u.primeiroNome}
            </span>
          </div>
        ))}
      </section>

      <div className="anim-fade-up" style={{ animationDelay: '110ms' }}>
        <Link to="/saldo" className="block">
          <ResumoSaldo saldo={saldo} compacto />
        </Link>
      </div>

      {faltaConfigurar && (
        <Aviso
          emoji="⚙️"
          texto="Configure o acesso ao Drive para sincronizar."
          acao={
            <Link to="/configuracoes">
              <Botao tamanho="sm">Configurar</Botao>
            </Link>
          }
        />
      )}

      <nav
        className="anim-fade-up grid grid-cols-2 gap-3"
        style={{ animationDelay: '180ms' }}
      >
        <Atalho para="/roteiro" emoji="🗺️" rotulo="Roteiro" />
        <Atalho para="/imperdiveis" emoji="⭐" rotulo="Imperdíveis" />
        <Atalho para="/despesas" emoji="🧾" rotulo="Despesas" />
        <Atalho para="/fotos" emoji="📸" rotulo="Fotos" />
      </nav>
    </div>
  )
}

function Atalho({ para, emoji, rotulo }) {
  return (
    <Link
      to={para}
      className="flex flex-col items-center gap-2 rounded-card bg-white px-4 py-6 font-semibold text-pinheiro-700 shadow-card transition-transform active:scale-[0.98]"
    >
      <span aria-hidden="true" className="text-3xl">
        {emoji}
      </span>
      {rotulo}
    </Link>
  )
}

function Aviso({ emoji, texto, acao }) {
  return (
    <div className="anim-fade-up flex items-center gap-3 rounded-card bg-outono-50 px-4 py-3.5">
      <span aria-hidden="true" className="text-xl">
        {emoji}
      </span>
      <p className="min-w-0 flex-1 text-sm leading-snug text-outono-800">
        {texto}
      </p>
      <div className="shrink-0">{acao}</div>
    </div>
  )
}
