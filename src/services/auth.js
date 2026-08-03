import { getConfig } from '../utils/config'

const GIS_SRC = 'https://accounts.google.com/gsi/client'

/**
 * Escopo completo do Drive.
 *
 * `drive.file` (o escopo restrito) só enxerga arquivos criados pelo próprio
 * app — não veria a pasta CDJ, que já existe e foi criada à mão. Como o
 * CLAUDE.md determina que o app lê/escreve numa estrutura pré-existente, o
 * escopo amplo é obrigatório. Consequência: o app precisa ficar em modo
 * "Testing" no Google Cloud, com Paulo Victor e Louise como usuários de teste.
 */
export const ESCOPO_DRIVE = 'https://www.googleapis.com/auth/drive'

const SS_KEY = 'cdj:token'
/** Renova o token 1 min antes de expirar, para não estourar no meio de um upload. */
const MARGEM_MS = 60_000

export class ErroAuth extends Error {
  constructor(codigo, mensagem) {
    super(mensagem)
    this.name = 'ErroAuth'
    this.codigo = codigo
  }
}

/* ------------------------------------------------------------------ script */

let promessaScript = null

function carregarScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (promessaScript) return promessaScript

  promessaScript = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      promessaScript = null
      reject(
        new ErroAuth(
          'GIS_INDISPONIVEL',
          'Não foi possível carregar o Google Identity Services. Verifique sua conexão com a internet.',
        ),
      )
    }
    document.head.appendChild(script)
  })

  return promessaScript
}

/* ------------------------------------------------------------- token client */

let tokenClient = null
let clientIdDoCliente = null

async function getTokenClient(clientId) {
  await carregarScript()
  if (!tokenClient || clientIdDoCliente !== clientId) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: ESCOPO_DRIVE,
      callback: () => {},
      error_callback: () => {},
    })
    clientIdDoCliente = clientId
  }
  return tokenClient
}

/* --------------------------------------------------------------- persistência */

function lerTokenSalvo() {
  try {
    const t = JSON.parse(sessionStorage.getItem(SS_KEY))
    if (t?.access_token && t.expira_em - MARGEM_MS > Date.now()) return t
  } catch {
    /* json inválido — ignora */
  }
  return null
}

function salvarToken(accessToken, expiresIn) {
  const t = {
    access_token: accessToken,
    expira_em: Date.now() + (Number(expiresIn) || 3600) * 1000,
  }
  sessionStorage.setItem(SS_KEY, JSON.stringify(t))
  return t
}

/* ---------------------------------------------------------------- ouvintes */

const ouvintes = new Set()

export function assinarAuth(fn) {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

function notificar() {
  for (const fn of ouvintes) fn(estaAutenticado())
}

export function estaAutenticado() {
  return Boolean(lerTokenSalvo())
}

/** Descarta o token local sem revogar no Google (usado em 401). */
export function limparToken() {
  sessionStorage.removeItem(SS_KEY)
  notificar()
}

/* -------------------------------------------------------------------- login */

function mapearErro(resposta) {
  const tipo = resposta?.type ?? resposta?.error
  if (tipo === 'popup_closed' || tipo === 'popup_closed_by_user') {
    return new ErroAuth('CANCELADO', 'Janela do Google fechada antes de concluir.')
  }
  if (tipo === 'popup_failed_to_open') {
    return new ErroAuth(
      'POPUP_BLOQUEADO',
      'O navegador bloqueou a janela do Google. Libere pop-ups para este site e tente de novo.',
    )
  }
  if (tipo === 'access_denied') {
    return new ErroAuth(
      'RECUSADO',
      'Acesso ao Drive recusado. Confirme que sua conta está na lista de usuários de teste do projeto no Google Cloud.',
    )
  }
  return new ErroAuth(
    'FALHA',
    resposta?.error_description ||
      resposta?.message ||
      'Falha ao autenticar com o Google.',
  )
}

/**
 * Abre o popup do Google e devolve um access token.
 * DEVE ser chamado a partir de um clique — fora de um gesto do usuário
 * o navegador bloqueia o pop-up.
 */
export function login({ forcarConsentimento = false } = {}) {
  const { GOOGLE_CLIENT_ID } = getConfig()
  if (!GOOGLE_CLIENT_ID) {
    return Promise.reject(
      new ErroAuth(
        'SEM_CLIENT_ID',
        'Informe o GOOGLE_CLIENT_ID na tela de Configurações.',
      ),
    )
  }

  return new Promise((resolve, reject) => {
    getTokenClient(GOOGLE_CLIENT_ID)
      .then((cliente) => {
        cliente.callback = (resposta) => {
          if (resposta.error) return reject(mapearErro(resposta))
          const t = salvarToken(resposta.access_token, resposta.expires_in)
          notificar()
          resolve(t.access_token)
        }
        cliente.error_callback = (erro) => reject(mapearErro(erro))
        cliente.requestAccessToken({
          prompt: forcarConsentimento ? 'consent' : '',
        })
      })
      .catch(reject)
  })
}

/**
 * Token válido para uma chamada à API.
 * Com `interativo: false` (padrão) lança LOGIN_NECESSARIO em vez de abrir
 * pop-up — a UI então mostra o botão "Conectar ao Google".
 */
export async function garantirToken({ interativo = false } = {}) {
  const salvo = lerTokenSalvo()
  if (salvo) return salvo.access_token
  if (!interativo) {
    throw new ErroAuth(
      'LOGIN_NECESSARIO',
      'Conecte sua conta Google para acessar o Drive.',
    )
  }
  return login()
}

export function logout() {
  const t = lerTokenSalvo()
  if (t?.access_token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(t.access_token, () => {})
  }
  limparToken()
}
