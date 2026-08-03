import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

// HashRouter (e não BrowserRouter) porque o GitHub Pages é hospedagem estática:
// um refresh em /CDJ/despesas devolveria 404. Com hash, tudo resolve no cliente.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Placeholder titulo="CDJ" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

function Placeholder({ titulo }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
      <span className="text-5xl">🏔️</span>
      <h1 className="text-2xl font-bold text-pinheiro-700">{titulo}</h1>
      <p className="text-sm text-pinheiro-500">Campos do Jordão</p>
    </div>
  )
}
