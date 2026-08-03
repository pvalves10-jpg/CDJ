import { Link } from 'react-router-dom'
import Hoje from './Hoje'
import BaixarApp from './BaixarApp'
import SeletorUsuario from './SeletorUsuario'
import ResumoSaldo from '../Saldo/ResumoSaldo'
import Botao from '../ui/Botao'
import { useDespesas } from '../../hooks/useDespesas'
import { useDrive } from '../../hooks/useDrive'
import { useUsuario } from '../../hooks/useUsuario'
import { statusViagem } from '../../utils/guia'
import inicio from '../../assets/inicio.jpg'

export default function Home() {
  const { saldo } = useDespesas()
  const { autenticado } = useDrive()
  const [usuario, setUsuario] = useUsuario()

  // Reativo: quando URL+token são salvos e a conexão fica OK, o aviso some sozinho.
  const faltaConfigurar = !autenticado
  const status = statusViagem()

  if (!usuario) return <SeletorUsuario aoEscolher={setUsuario} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-10">
      <div className="anim-fade-up overflow-hidden rounded-card shadow-card">
        <img
          src={inicio}
          alt="Nossa Jornada — Louise e Paulo Victor: Amor, Parceria e Aventura"
          className="w-full"
        />
      </div>

      <div className="anim-fade-up rounded-card bg-pinheiro-700 px-4 py-2 text-center text-sm font-bold text-white">
        {status.texto}
      </div>

      <Hoje />

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

      <BaixarApp />
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
