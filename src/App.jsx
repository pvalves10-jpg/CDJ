import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './components/Home/Home'
import Toasts from './components/ui/Toast'
import { DespesasProvider } from './hooks/useDespesas'

// Code-splitting das rotas: só a Home entra no bundle inicial. As demais
// (Roteiro/Imperdíveis/Despesas/Fotos/Saldo/Configurações) sobem sob demanda,
// deixando o primeiro carregamento no celular sensivelmente mais leve.
const Roteiro = lazy(() => import('./components/Roteiro/Roteiro'))
const Mapa = lazy(() => import('./components/Mapa/Mapa'))
const Imperdiveis = lazy(() => import('./components/Imperdiveis/Imperdiveis'))
const Despesas = lazy(() => import('./components/Despesas/Despesas'))
const Fotos = lazy(() => import('./components/Fotos/Fotos'))
const Saldo = lazy(() => import('./components/Saldo/Saldo'))
const Configuracoes = lazy(() => import('./components/Configuracoes/Configuracoes'))

// Placeholder discreto enquanto o chunk da rota está sendo baixado.
function CarregandoRota() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-pinheiro-500">
      <span className="anim-pulse-suave text-sm font-semibold">Carregando…</span>
    </div>
  )
}

// HashRouter (e não BrowserRouter) porque o GitHub Pages é hospedagem estática:
// um refresh em /CDJ/despesas devolveria 404. Com hash, tudo resolve no cliente.
export default function App() {
  return (
    <DespesasProvider>
      <Toasts />
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route
              path="/roteiro"
              element={
                <Suspense fallback={<CarregandoRota />}>
                  <Roteiro />
                </Suspense>
              }
            />
            <Route
              path="/mapa"
              element={
                <Suspense fallback={<CarregandoRota />}>
                  <Mapa />
                </Suspense>
              }
            />
            <Route
              path="/imperdiveis"
              element={
                <Suspense fallback={<CarregandoRota />}>
                  <Imperdiveis />
                </Suspense>
              }
            />
            <Route
              path="/fotos"
              element={
                <Suspense fallback={<CarregandoRota />}>
                  <Fotos />
                </Suspense>
              }
            />
            <Route
              path="/despesas"
              element={
                <Suspense fallback={<CarregandoRota />}>
                  <Despesas />
                </Suspense>
              }
            />
            <Route
              path="/saldo"
              element={
                <Suspense fallback={<CarregandoRota />}>
                  <Saldo />
                </Suspense>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <Suspense fallback={<CarregandoRota />}>
                  <Configuracoes />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </DespesasProvider>
  )
}
