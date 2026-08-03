import { useEffect, useState } from 'react'
import ItemDespesa from './ItemDespesa'
import FormularioDespesa from './FormularioDespesa'
import BotaoAdicionar from './BotaoAdicionar'
import Modal from '../ui/Modal'
import Botao, { Spinner } from '../ui/Botao'
import { useDespesas } from '../../hooks/useDespesas'
import { useDrive } from '../../hooks/useDrive'
import { useUsuario } from '../../hooks/useUsuario'
import { lerComprovante } from '../../services/gemini'
import { uploadComprovante } from '../../services/drive'
import { formatarMoeda, nomeComprovante } from '../../utils/formatters'

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

  // Fluxo do comprovante
  const [lendo, setLendo] = useState(false)
  const [comprovante, setComprovante] = useState(null)
  const [previaUrl, setPreviaUrl] = useState(null)
  const [avisoGemini, setAvisoGemini] = useState(null)

  useEffect(() => {
    if (!previaUrl) return
    return () => URL.revokeObjectURL(previaUrl)
  }, [previaUrl])

  function fecharForm() {
    setFormAberto(false)
    setEmEdicao(null)
    setComprovante(null)
    setPreviaUrl(null)
    setAvisoGemini(null)
  }

  function abrirManual() {
    setEmEdicao(null)
    setComprovante(null)
    setPreviaUrl(null)
    setAvisoGemini(null)
    setFormAberto(true)
  }

  function abrirEdicao(despesa) {
    setEmEdicao(despesa)
    setComprovante(null)
    setPreviaUrl(null)
    setAvisoGemini(null)
    setFormAberto(true)
  }

  /**
   * Foto escolhida: o Gemini extrai os campos e o formulário abre
   * pré-preenchido. Se a leitura falhar, o formulário abre mesmo assim (em
   * branco) — a foto continua anexada e o usuário digita.
   */
  async function processarFoto(arquivo) {
    setComprovante(arquivo)
    setPreviaUrl(URL.createObjectURL(arquivo))
    setAvisoGemini(null)
    setLendo(true)

    try {
      const extraido = await lerComprovante(arquivo)
      const faltando = ['local', 'data', 'valor'].filter((c) => !extraido[c])

      setEmEdicao({
        data: extraido.data ?? undefined,
        local: extraido.local ?? '',
        valor: extraido.valor ?? undefined,
        categoria: extraido.categoria ?? 'outro',
        pagador: usuario ?? undefined,
      })

      if (faltando.length) {
        setAvisoGemini(
          `Não consegui identificar: ${faltando.join(', ')}. Complete abaixo.`,
        )
      }
    } catch (e) {
      setEmEdicao(null)
      setAvisoGemini(e.message)
    } finally {
      setLendo(false)
      setFormAberto(true)
    }
  }

  async function salvar(dados) {
    try {
      if (emEdicao?.id) {
        await atualizar(emEdicao.id, dados)
      } else {
        const criada = await adicionar(dados)

        // A despesa (o que mexe no saldo) já está salva. O upload vem depois:
        // se falhar, a despesa continua lá, só sem o anexo.
        if (comprovante) {
          try {
            const enviado = await uploadComprovante(comprovante, {
              nome: nomeComprovante(dados.data, dados.local, comprovante),
            })
            if (enviado?.id) {
              await atualizar(criada.id, { comprovante_drive_id: enviado.id })
            }
          } catch (e) {
            setErro(`Despesa salva, mas o comprovante não subiu: ${e.message}`)
          }
        }
      }
      fecharForm()
    } catch {
      // Erro já exposto pelo hook; o modal continua aberto com os dados.
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

      <BotaoAdicionar
        aoEscolherFoto={processarFoto}
        aoEscolherManual={abrirManual}
      />

      {lendo && <OverlayLendo />}

      <FormularioDespesa
        aberto={formAberto}
        aoFechar={fecharForm}
        aoSalvar={salvar}
        despesa={emEdicao}
        categorias={categorias}
        usuarioAtual={usuario}
        aoCriarCategoria={adicionarCategoria}
        salvando={salvando}
        cabecalho={
          comprovante || avisoGemini ? (
            <div className="mb-4 space-y-3">
              {previaUrl && (
                <div className="flex items-center gap-3 rounded-card bg-white p-2.5 shadow-card">
                  <img
                    src={previaUrl}
                    alt="Prévia do comprovante"
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 text-xs leading-relaxed text-pinheiro-500">
                    <p className="font-semibold text-pinheiro-700">
                      Comprovante anexado
                    </p>
                    <p>Será enviado para CDJ/DESPESAS ao salvar.</p>
                  </div>
                </div>
              )}
              {avisoGemini && (
                <p className="rounded-card bg-outono-50 px-3.5 py-2.5 text-sm leading-relaxed text-outono-800">
                  {avisoGemini}
                </p>
              )}
            </div>
          ) : null
        }
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
          Excluir{' '}
          <strong className="text-pinheiro-900">{paraExcluir?.local}</strong> de{' '}
          {formatarMoeda(paraExcluir?.valor)}? Isso recalcula o saldo e não pode
          ser desfeito.
        </p>
      </Modal>
    </div>
  )
}

function OverlayLendo() {
  return (
    <div className="anim-fade-in fixed inset-0 z-50 grid place-items-center bg-pinheiro-900/55 px-8">
      <div className="flex flex-col items-center gap-3 rounded-card bg-white px-8 py-7 text-center shadow-flutuante">
        <Spinner className="size-7 text-pinheiro-600" />
        <p className="font-semibold text-pinheiro-800">Lendo comprovante...</p>
        <p className="max-w-[13rem] text-xs leading-relaxed text-pinheiro-500">
          O Gemini está extraindo local, data e valor da foto.
        </p>
      </div>
    </div>
  )
}

function EstadoVazio({ autenticado }) {
  return (
    <div className="anim-fade-up flex flex-col items-center gap-2 px-6 py-16 text-center">
      <span aria-hidden="true" className="text-5xl">
        🧾
      </span>
      <p className="font-semibold text-pinheiro-700">Nenhuma despesa ainda</p>
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
