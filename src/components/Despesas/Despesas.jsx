import { useState } from 'react'
import ItemDespesa from './ItemDespesa'
import FormularioDespesa from './FormularioDespesa'
import Modal from '../ui/Modal'
import Botao from '../ui/Botao'
import { useDespesas } from '../../hooks/useDespesas'
import { useDrive } from '../../hooks/useDrive'
import { useUsuario } from '../../hooks/useUsuario'
import { formatarMoeda } from '../../utils/formatters'

export default function Despesas() {
  const {
    despesas,
    categorias,
    saldo,
    carregando,
    salvando,
    erro,
    setErro,
    adicionar,
    atualizar,
    remover,
    adicionarCategoria,
  } = useDespesas()

  const { autenticado, conectando, conectar } = useDrive()
  const [usuario] = useUsuario()

  const [formAberto, setFormAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState(null)
  const [paraExcluir, setParaExcluir] = useState(null)

  function abrirNova() {
    setEmEdicao(null)
    setFormAberto(true)
  }

  function abrirEdicao(despesa) {
    setEmEdicao(despesa)
    setFormAberto(true)
  }

  async function salvar(dados) {
    try {
      if (emEdicao) await atualizar(emEdicao.id, dados)
      else await adicionar(dados)
      setFormAberto(false)
      setEmEdicao(null)
    } catch {
      // O erro já está em `erro`, vindo do hook; o modal segue aberto.
    }
  }

  async function confirmarExclusao() {
    try {
      await remover(paraExcluir.id)
    } catch {
      /* erro exibido pelo banner */
    } finally {
      setParaExcluir(null)
    }
  }

  return (
    <div className="relative flex min-h-full flex-col">
      {erro && (
        <div className="anim-fade-in mx-4 mt-4 flex items-start gap-2 rounded-card bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <span aria-hidden="true">⚠️</span>
          <p className="min-w-0 flex-1 break-words">{erro}</p>
          <button
            type="button"
            onClick={() => setErro(null)}
            aria-label="Dispensar erro"
            className="shrink-0 px-1 leading-none text-red-400 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {!autenticado && (
        <div className="mx-4 mt-4 rounded-card bg-white p-5 text-center shadow-card">
          <p className="text-sm leading-relaxed text-pinheiro-600">
            Conecte sua conta Google para carregar as despesas do Drive.
          </p>
          <Botao
            className="mt-3.5"
            largura
            carregando={conectando}
            onClick={conectar}
          >
            Conectar ao Google
          </Botao>
        </div>
      )}

      {despesas.length > 0 && (
        <div className="flex items-baseline justify-between px-5 pt-4 pb-1">
          <span className="text-sm text-pinheiro-500">
            {despesas.length} {despesas.length === 1 ? 'despesa' : 'despesas'}
          </span>
          <span className="text-sm font-bold tabular-nums text-pinheiro-700">
            {formatarMoeda(saldo.total)}
          </span>
        </div>
      )}

      <div className="flex-1 px-4 py-3 pb-28">
        {carregando && despesas.length === 0 ? (
          <ListaEsqueleto />
        ) : despesas.length === 0 ? (
          <EstadoVazio autenticado={autenticado} />
        ) : (
          <ul className="space-y-2.5">
            {despesas.map((despesa) => (
              <ItemDespesa
                key={despesa.id}
                despesa={despesa}
                categorias={categorias}
                onEditar={abrirEdicao}
                onExcluir={setParaExcluir}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Acompanha a coluna de conteúdo (max-w-md centralizada), não a viewport. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-30">
        <div className="mx-auto flex max-w-md justify-end px-5">
          <button
            type="button"
            onClick={abrirNova}
            aria-label="Nova despesa"
            className="pointer-events-auto grid size-14 place-items-center rounded-full bg-outono-500 text-3xl leading-none text-white shadow-flutuante transition-transform active:scale-95"
          >
            <span aria-hidden="true" className="-mt-0.5">
              +
            </span>
          </button>
        </div>
      </div>

      <FormularioDespesa
        aberto={formAberto}
        aoFechar={() => {
          setFormAberto(false)
          setEmEdicao(null)
        }}
        aoSalvar={salvar}
        despesa={emEdicao}
        categorias={categorias}
        usuarioAtual={usuario}
        aoCriarCategoria={adicionarCategoria}
        salvando={salvando}
      />

      <Modal
        aberto={Boolean(paraExcluir)}
        aoFechar={() => setParaExcluir(null)}
        titulo="Excluir despesa"
        rodape={
          <div className="flex gap-2.5">
            <Botao
              variante="secundario"
              onClick={() => setParaExcluir(null)}
              className="flex-1"
            >
              Cancelar
            </Botao>
            <Botao
              variante="perigo"
              carregando={salvando}
              onClick={confirmarExclusao}
              className="flex-1"
            >
              Excluir
            </Botao>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-pinheiro-600">
          Excluir <strong className="text-pinheiro-900">{paraExcluir?.local}</strong>{' '}
          de {formatarMoeda(paraExcluir?.valor)}? Isso recalcula o saldo e não
          pode ser desfeito.
        </p>
      </Modal>
    </div>
  )
}

function EstadoVazio({ autenticado }) {
  return (
    <div className="anim-fade-up flex flex-col items-center gap-2 px-6 py-16 text-center">
      <span aria-hidden="true" className="text-5xl">
        🧾
      </span>
      <p className="font-semibold text-pinheiro-700">
        Nenhuma despesa ainda
      </p>
      <p className="max-w-[15rem] text-sm leading-relaxed text-pinheiro-500">
        {autenticado
          ? 'Toque no + para adicionar a primeira!'
          : 'Conecte ao Google para ver as despesas já salvas no Drive.'}
      </p>
    </div>
  )
}

function ListaEsqueleto() {
  return (
    <ul className="space-y-2.5" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <li
          key={i}
          className="anim-pulse-suave flex items-center gap-3 rounded-card bg-white px-4 py-3.5 shadow-card"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <span className="size-11 shrink-0 rounded-full bg-neve-200" />
          <div className="flex-1 space-y-2">
            <span className="block h-3.5 w-2/5 rounded bg-neve-200" />
            <span className="block h-2.5 w-3/5 rounded bg-neve-200" />
          </div>
          <span className="h-4 w-16 rounded bg-neve-200" />
        </li>
      ))}
    </ul>
  )
}
