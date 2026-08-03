import { useState } from 'react'
import Botao from '../ui/Botao'
import Cartao from '../ui/Cartao'
import Campo from '../ui/Campo'
import { useDrive } from '../../hooks/useDrive'
import { useUsuario } from '../../hooks/useUsuario'
import { getConfig, setConfig } from '../../utils/config'
import { testarConexao } from '../../services/drive'
import { toast } from '../../services/toast'
import { nomeUsuario, USUARIOS } from '../../utils/constantes'

export default function Configuracoes() {
  const inicial = getConfig()
  const [form, setForm] = useState({
    APPSCRIPT_URL: inicial.APPSCRIPT_URL,
    APP_TOKEN: inicial.APP_TOKEN,
  })
  const [salvo, setSalvo] = useState(false)
  const [etapas, setEtapas] = useState(null)
  const [testando, setTestando] = useState(false)

  const { autenticado, desconectar } = useDrive()
  const [usuario, setUsuario] = useUsuario()

  const alterar = (chave) => (evento) => {
    setForm((f) => ({ ...f, [chave]: evento.target.value }))
    setSalvo(false)
    setEtapas(null)
  }

  function salvar({ avisar = true } = {}) {
    // A URL do Web App às vezes vem com espaços ao copiar; o setConfig já faz trim.
    setConfig(form)
    setSalvo(true)
    setEtapas(null)
    if (avisar) toast.ok('Configurações salvas neste aparelho.')
  }

  async function testar() {
    salvar({ avisar: false })
    setTestando(true)
    try {
      const resultado = await testarConexao()
      setEtapas(resultado)
      const falhas = resultado.filter((e) => !e.ok).length
      if (falhas === 0) toast.ok('Tudo certo — conexão validada.')
      else toast.erro(`${falhas} verificação(ões) falhou/falharam.`)
    } finally {
      setTestando(false)
    }
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <Cartao
        titulo="Quem está usando"
        descricao="Fica salvo neste aparelho e vira o pagador sugerido em novas despesas."
      >
        <div className="grid grid-cols-2 gap-2.5">
          {USUARIOS.map((u) => {
            const ativo = usuario === u.id
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setUsuario(u.id)
                  toast.ok(`Agora você é ${nomeUsuario(u.id)} neste aparelho.`)
                }}
                aria-pressed={ativo}
                className={[
                  'rounded-card border-2 px-3 py-3.5 text-sm font-semibold transition-colors',
                  ativo
                    ? 'border-pinheiro-700 bg-pinheiro-50 text-pinheiro-800'
                    : 'border-neve-300 bg-white text-pinheiro-500 hover:border-pinheiro-200',
                ].join(' ')}
              >
                {u.nome}
              </button>
            )
          })}
        </div>
      </Cartao>

      <Cartao
        titulo="Conexão com o Drive"
        descricao="O app conversa com o seu Google Drive através de um Web App do Google Apps Script, que roda na sua conta. Nada sensível fica no site — só a URL e um token."
      >
        <div className="mb-4 flex items-center gap-3">
          <span
            className={[
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold',
              autenticado
                ? 'bg-pinheiro-100 text-pinheiro-800'
                : 'bg-neve-200 text-pinheiro-500',
            ].join(' ')}
          >
            <span
              className={`size-2 rounded-full ${autenticado ? 'bg-pinheiro-600' : 'bg-pinheiro-300'}`}
            />
            {autenticado ? 'Configurado' : 'Não configurado'}
          </span>

          {autenticado && (
            <Botao variante="secundario" tamanho="sm" onClick={desconectar}>
              Esquecer neste aparelho
            </Botao>
          )}
        </div>

        <div className="space-y-4">
          <Campo
            rotulo="URL do Apps Script"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={form.APPSCRIPT_URL}
            onChange={alterar('APPSCRIPT_URL')}
            ajuda="A URL do Web App implantado. Deve terminar em /exec. Veja o passo a passo em appscript/Codigo.gs."
          />
          <Campo
            rotulo="Token"
            secreto
            placeholder="a mesma senha do TOKEN nas Propriedades do Script"
            value={form.APP_TOKEN}
            onChange={alterar('APP_TOKEN')}
            ajuda="Um segredo que você inventa e coloca igual nos dois lados (aqui e no Apps Script)."
          />
        </div>

        <div className="mt-5 flex gap-2.5">
          <Botao variante="secundario" onClick={() => salvar()} className="flex-1">
            {salvo ? 'Salvo ✓' : 'Salvar'}
          </Botao>
          <Botao onClick={testar} carregando={testando} className="flex-1">
            Testar conexão
          </Botao>
        </div>
      </Cartao>

      {etapas && (
        <Cartao titulo="Resultado do teste" className="anim-fade-up">
          <ul className="space-y-3">
            {etapas.map((etapa) => (
              <li key={etapa.rotulo} className="flex gap-2.5 text-sm">
                <span aria-hidden="true" className="shrink-0 leading-5">
                  {etapa.ok ? '✅' : '❌'}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-pinheiro-800">{etapa.rotulo}</p>
                  {etapa.detalhe && (
                    <p
                      className={`mt-0.5 leading-relaxed break-words ${etapa.ok ? 'text-pinheiro-500' : 'text-red-600'}`}
                    >
                      {etapa.detalhe}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  )
}
