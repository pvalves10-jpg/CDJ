import { HashRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import Configuracoes from './components/Configuracoes/Configuracoes'

// HashRouter (e não BrowserRouter) porque o GitHub Pages é hospedagem estática:
// um refresh em /CDJ/despesas devolveria 404. Com hash, tudo resolve no cliente.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route
          path="/configuracoes"
          element={
            <Tela titulo="Configurações">
              <Configuracoes />
            </Tela>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

// Casca provisória — substituída pelo Layout (Header + Drawer) na FASE 7.
function Tela({ titulo, children }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-pinheiro-700 px-4 py-3.5 text-white">
        <Link to="/" className="text-lg leading-none" aria-label="Voltar">
          ←
        </Link>
        <h1 className="text-lg font-bold">{titulo}</h1>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

function Inicio() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-5xl">🏔️</span>
      <h1 className="text-2xl font-bold text-pinheiro-700">CDJ</h1>
      <p className="text-sm text-pinheiro-500">Campos do Jordão</p>
      <Link
        to="/configuracoes"
        className="mt-4 rounded-card bg-pinheiro-700 px-5 py-3 text-sm font-semibold text-white shadow-card"
      >
        ⚙️ Configurações
      </Link>
    </div>
  )
}
