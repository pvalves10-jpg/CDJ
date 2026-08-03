import { useState } from 'react'
import Botao from '../ui/Botao'
import Cartao from '../ui/Cartao'
import Campo from '../ui/Campo'
import { useDrive } from '../../hooks/useDrive'
import { useUsuario } from '../../hooks/useUsuario'
import { extrairIdDrive, getConfig, setConfig } from '../../utils/config'
import { limparCachePastas, testarConexao } from '../../services/drive'
import { USUARIOS } from '../../utils/constantes'

export default function Configuracoes() {
  const inicial = getConfig()
  const [form, setForm] = useState({
    GEMINI_API_KEY: inicial.GEMINI_API_KEY,
    GOOGLE_CLIENT_ID: inicial.GOOGLE_CLIENT_ID,
    DRIVE_FOLDER_ID: inicial.DRIVE_FOLDER_ID,
  })
  const [salvo, setSalvo] = useState(false)
  const [etapas, setEtapas] = useState(null)
  const [testando, setTestando] = useState(false)

  const { autenticado, conectando, erro, conectar, desconectar } = useDrive()
  const [usuario, setUsuario] = useUsuario()

  const alterar = (chave) => (evento) => {
    setForm((f) => ({ ...f, [chave]: evento.target.value }))
    setSalvo(false)
    setEtapas(null)
  }

  function salvar() {
    // O campo da pasta aceita a URL inteira do Drive; guardamos só o ID.
    const normalizado = {
      ...form,
      DRIVE_FOLDER_ID: extrairIdDrive(form.DRIVE_FOLDER_ID),
    }
    setConfig(normalizado)
    setForm(normalizado)
    limparCachePastas()
    setSalvo(true)
    setEtapas(null)
  }

  async function testar() {
    salvar()
    setTestando(true)
    try {
      setEtapas(await testarConexao())
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
                onClick={() => setUsuario(u.id)}
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
        titulo="Conta Google"
        descricao="Autoriza o app a ler e gravar dentro da pasta CDJ no seu Drive."
      >
        <div className="flex items-center gap-3">
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
            {autenticado ? 'Conectado' : 'Desconectado'}
          </span>

          {autenticado ? (
            <Botao variante="secundario" tamanho="sm" onClick={desconectar}>
              Desconectar
            </Botao>
          ) : (
            <Botao tamanho="sm" carregando={conectando} onClick={conectar}>
              Conectar ao Google
            </Botao>
          )}
        </div>

        {erro && (
          <p className="mt-3 rounded-card bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {erro}
          </p>
        )}
      </Cartao>

      <Cartao
        titulo="Chaves"
        descricao="Ficam salvas só neste aparelho (localStorage). Nada é enviado para servidor nosso."
      >
        <div className="space-y-4">
          <Campo
            rotulo="GOOGLE_CLIENT_ID"
            secreto={false}
            placeholder="000000-xxxx.apps.googleusercontent.com"
            value={form.GOOGLE_CLIENT_ID}
            onChange={alterar('GOOGLE_CLIENT_ID')}
            ajuda="Google Cloud Console → Credenciais → ID do cliente OAuth (Aplicativo da Web)."
          />
          <Campo
            rotulo="Pasta CDJ no Drive"
            placeholder="Cole o link da pasta ou só o ID"
            value={form.DRIVE_FOLDER_ID}
            onChange={alterar('DRIVE_FOLDER_ID')}
            ajuda="Pode colar a URL inteira — o ID é extraído automaticamente ao salvar."
          />
          <Campo
            rotulo="GEMINI_API_KEY"
            secreto
            placeholder="AIza..."
            value={form.GEMINI_API_KEY}
            onChange={alterar('GEMINI_API_KEY')}
            ajuda="aistudio.google.com/apikey — usada só para ler comprovantes por foto."
          />
        </div>

        <div className="mt-5 flex gap-2.5">
          <Botao variante="secundario" onClick={salvar} className="flex-1">
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
                  <p className="font-semibold text-pinheiro-800">
                    {etapa.rotulo}
                  </p>
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
