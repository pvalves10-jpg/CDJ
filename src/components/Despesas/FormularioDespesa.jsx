import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Botao from '../ui/Botao'
import Campo from '../ui/Campo'
import { hojeISO, parseValor } from '../../utils/formatters'
import { USUARIOS } from '../../utils/constantes'

function estadoInicial(despesa, usuarioAtual) {
  return {
    data: despesa?.data ?? hojeISO(),
    local: despesa?.local ?? '',
    valor:
      despesa?.valor != null
        ? String(despesa.valor).replace('.', ',')
        : '',
    categoria: despesa?.categoria ?? 'restaurante',
    pagador: despesa?.pagador ?? usuarioAtual ?? USUARIOS[0].id,
  }
}

export default function FormularioDespesa({
  aberto,
  aoFechar,
  aoSalvar,
  despesa,
  categorias,
  usuarioAtual,
  aoCriarCategoria,
  salvando = false,
  cabecalho = null,
}) {
  const [form, setForm] = useState(() => estadoInicial(despesa, usuarioAtual))
  const [erros, setErros] = useState({})
  const [novaCategoria, setNovaCategoria] = useState(null)

  // Reidrata quando o modal reabre com outra despesa (ou com dados do Gemini).
  useEffect(() => {
    if (aberto) {
      setForm(estadoInicial(despesa, usuarioAtual))
      setErros({})
      setNovaCategoria(null)
    }
  }, [aberto, despesa, usuarioAtual])

  const alterar = (chave) => (evento) => {
    const valor = evento?.target ? evento.target.value : evento
    setForm((f) => ({ ...f, [chave]: valor }))
    setErros((e) => ({ ...e, [chave]: undefined }))
  }

  function validar() {
    const novos = {}
    if (!form.data) novos.data = 'Informe a data.'
    if (!form.local.trim()) novos.local = 'Informe o local.'
    const valor = parseValor(form.valor)
    if (!Number.isFinite(valor) || valor <= 0) {
      novos.valor = 'Informe um valor maior que zero.'
    }
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  function enviar() {
    if (!validar()) return
    aoSalvar({
      data: form.data,
      local: form.local.trim(),
      valor: parseValor(form.valor),
      categoria: form.categoria,
      pagador: form.pagador,
    })
  }

  async function criarCategoria() {
    const label = novaCategoria?.label?.trim()
    if (!label) return
    const id = await aoCriarCategoria({
      emoji: novaCategoria.emoji?.trim() || '📌',
      label,
    })
    setForm((f) => ({ ...f, categoria: id }))
    setNovaCategoria(null)
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={despesa ? 'Editar despesa' : 'Nova despesa'}
      rodape={
        <div className="flex gap-2.5">
          <Botao variante="secundario" onClick={aoFechar} className="flex-1">
            Cancelar
          </Botao>
          <Botao onClick={enviar} carregando={salvando} className="flex-[1.4]">
            Salvar
          </Botao>
        </div>
      }
    >
      {cabecalho}

      <div className="space-y-4">
        <Campo
          rotulo="Local"
          placeholder="Restaurante Boa Mesa"
          value={form.local}
          onChange={alterar('local')}
          erro={erros.local}
          autoCapitalize="sentences"
        />

        <div className="grid grid-cols-2 gap-3">
          <Campo
            rotulo="Valor"
            inputMode="decimal"
            placeholder="120,00"
            value={form.valor}
            onChange={alterar('valor')}
            erro={erros.valor}
          />
          <Campo
            rotulo="Data"
            type="date"
            value={form.data}
            onChange={alterar('data')}
            erro={erros.data}
          />
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-pinheiro-700">
            Categoria
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {categorias.map((c) => {
              const ativo = form.categoria === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => alterar('categoria')(c.id)}
                  aria-pressed={ativo}
                  className={[
                    'flex flex-col items-center gap-1 rounded-card border-2 px-1.5 py-2.5 text-[11px] font-semibold leading-tight transition-colors',
                    ativo
                      ? 'border-pinheiro-700 bg-pinheiro-50 text-pinheiro-800'
                      : 'border-neve-300 bg-white text-pinheiro-500 hover:border-pinheiro-200',
                  ].join(' ')}
                >
                  <span aria-hidden="true" className="text-lg">
                    {c.emoji}
                  </span>
                  <span className="text-center">{c.label}</span>
                </button>
              )
            })}

            {novaCategoria ? null : (
              <button
                type="button"
                onClick={() => setNovaCategoria({ emoji: '', label: '' })}
                className="flex flex-col items-center gap-1 rounded-card border-2 border-dashed border-neve-300 px-1.5 py-2.5 text-[11px] font-semibold leading-tight text-pinheiro-400 hover:border-pinheiro-200 hover:text-pinheiro-600"
              >
                <span aria-hidden="true" className="text-lg">
                  ＋
                </span>
                <span>Nova</span>
              </button>
            )}
          </div>

          {novaCategoria && (
            <div className="anim-fade-up mt-3 rounded-card bg-white p-3">
              <div className="flex gap-2">
                <input
                  aria-label="Emoji da categoria"
                  value={novaCategoria.emoji}
                  onChange={(e) =>
                    setNovaCategoria((n) => ({ ...n, emoji: e.target.value }))
                  }
                  placeholder="🎿"
                  maxLength={4}
                  className="w-16 rounded-card border border-neve-300 px-2 py-2.5 text-center text-lg outline-none focus:border-pinheiro-500"
                />
                <input
                  aria-label="Nome da categoria"
                  value={novaCategoria.label}
                  onChange={(e) =>
                    setNovaCategoria((n) => ({ ...n, label: e.target.value }))
                  }
                  placeholder="Nome da categoria"
                  className="min-w-0 flex-1 rounded-card border border-neve-300 px-3 py-2.5 text-[15px] outline-none focus:border-pinheiro-500"
                />
              </div>
              <div className="mt-2.5 flex gap-2">
                <Botao
                  variante="fantasma"
                  tamanho="sm"
                  onClick={() => setNovaCategoria(null)}
                  className="flex-1"
                >
                  Cancelar
                </Botao>
                <Botao
                  tamanho="sm"
                  onClick={criarCategoria}
                  disabled={!novaCategoria.label.trim()}
                  className="flex-1"
                >
                  Criar
                </Botao>
              </div>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-pinheiro-700">
            Quem pagou
          </legend>
          <div className="grid grid-cols-2 gap-2.5">
            {USUARIOS.map((u) => {
              const ativo = form.pagador === u.id
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => alterar('pagador')(u.id)}
                  aria-pressed={ativo}
                  className={[
                    'rounded-card border-2 px-3 py-3 text-sm font-semibold transition-colors',
                    ativo
                      ? 'border-outono-500 bg-outono-50 text-outono-700'
                      : 'border-neve-300 bg-white text-pinheiro-500 hover:border-outono-200',
                  ].join(' ')}
                >
                  {u.nome}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-pinheiro-500">
            A despesa é dividida 50/50 — quem pagou adiantou o valor inteiro.
          </p>
        </fieldset>
      </div>
    </Modal>
  )
}
