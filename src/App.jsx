import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './components/Home/Home'
import Despesas from './components/Despesas/Despesas'
import Fotos from './components/Fotos/Fotos'
import Saldo from './components/Saldo/Saldo'
import Configuracoes from './components/Configuracoes/Configuracoes'
import { DespesasProvider } from './hooks/useDespesas'

// HashRouter (e não BrowserRouter) porque o GitHub Pages é hospedagem estática:
// um refresh em /CDJ/despesas devolveria 404. Com hash, tudo resolve no cliente.
export default function App() {
  return (
    <DespesasProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/fotos" element={<Fotos />} />
            <Route path="/despesas" element={<Despesas />} />
            <Route path="/saldo" element={<Saldo />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </DespesasProvider>
  )
}
