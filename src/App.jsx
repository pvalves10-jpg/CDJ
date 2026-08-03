import { HashRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import Configuracoes from './components/Configuracoes/Configuracoes'
import Despesas from './components/Despesas/Despesas'
import { DespesasProvider } from './hooks/useDespesas'

// HashRouter (e não BrowserRouter) porque o GitHub Pages é hospedagem estática:
// um refresh em /CDJ/despesas devolveria 404. Com hash, tudo resolve no cliente.
export default function App() {
  return (
    <DespesasProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route
            path="/despesas"
            element={
              <Tela titulo="Despesas">
                <Despesas />
              </Tela>
            }
          />
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
    </DespesasProvider>
  )
}

// Casca provisória — substituída pelo Layout (Header + Drawer) na FASE 7.
function Tela({ titulo, children }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-pinheiro-700 px-4 py-3.5 text-white">
        <Link to="/" className="text-lg leading-none" aria-label="Voltar">
          ←
        </Link>
        <h1 className="text-lg font-bold">{titulo}</h1>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}

function Inicio() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-5xl">🏔️</span>
      <h1 className="text-2xl font-bold text-pinheiro-700">CDJ</h1>
      <p className="text-sm text-pinheiro-500">Campos do Jordão</p>
      <div className="mt-4 flex flex-col gap-2">
        <Link
          to="/despesas"
          className="rounded-card bg-pinheiro-700 px-5 py-3 text-sm font-semibold text-white shadow-card"
        >
          🧾 Despesas
        </Link>
        <Link
          to="/configuracoes"
          className="rounded-card bg-white px-5 py-3 text-sm font-semibold text-pinheiro-700 shadow-card"
        >
          ⚙️ Configurações
        </Link>
      </div>
    </div>
  )
}
