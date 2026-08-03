import { getConfig } from '../utils/config'

/**
 * Cliente do backend em Google Apps Script.
 *
 * Todas as operações de Drive e Gemini passam por aqui. O Apps Script roda na
 * conta do dono da pasta e é protegido por um token compartilhado — então o
 * navegador nunca vê chave nenhuma, só a URL do Web App e o token.
 *
 * Detalhe de CORS: enviamos o corpo como `text/plain`. Isso mantém a requisição
 * "simples" (sem preflight OPTIONS, que o Apps Script não responde) e mesmo
 * assim entregamos JSON — o `doPost` lê `e.postData.contents` e faz parse.
 *
 * Rede da serra é ruim: leituras têm timeout + retry com backoff, e erros de
 * rede são marcados com `.rede = true` para a fila offline do useDespesas.
 */

const TIMEOUT_MS = 15000
const LEITURAS = new Set(['ler', 'listarFotos', 'ping', 'imagem'])

export class ErroApi extends Error {
  constructor(mensagem, { status } = {}) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
  }
}

function erroDeRede(mensagem) {
  const e = new ErroApi(mensagem)
  e.rede = true
  return e
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

/** Combina o signal do chamador com um timeout, quando o browser suporta. */
function sinalComTimeout(signal, ms = TIMEOUT_MS) {
  if (typeof AbortSignal === 'undefined' || !AbortSignal.timeout) return signal
  const t = AbortSignal.timeout(ms)
  if (signal && AbortSignal.any) return AbortSignal.any([signal, t])
  return signal ?? t
}

function base() {
  const { APPSCRIPT_URL, APP_TOKEN } = getConfig()
  if (!APPSCRIPT_URL || !APP_TOKEN) {
    throw new ErroApi(
      'Configure a URL do Apps Script e o token na tela de Configurações.',
    )
  }
  return { url: APPSCRIPT_URL, token: APP_TOKEN }
}

function interpretar(bruto) {
  let dados
  try {
    dados = JSON.parse(bruto)
  } catch {
    // HTML costuma vir quando a URL está errada ou a implantação não é pública.
    throw new ErroApi(
      'Resposta inesperada do Apps Script. Confira se a URL termina em /exec e se a implantação está como "Qualquer pessoa".',
    )
  }
  if (!dados || dados.ok === false) {
    throw new ErroApi(dados?.erro || 'O Apps Script recusou a operação.')
  }
  return dados
}

/** Chamada JSON. Leituras repetem em falha de rede/timeout/5xx. */
export async function chamar(action, payload = {}, { signal } = {}) {
  const { url, token } = base()
  const corpo = JSON.stringify({ token, action, ...payload })
  const tentativas = LEITURAS.has(action) ? 3 : 1

  let ultimo
  for (let i = 0; i < tentativas; i++) {
    try {
      const resposta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: corpo,
        signal: sinalComTimeout(signal),
        redirect: 'follow',
      })
      const texto = await resposta.text()
      if (!resposta.ok) {
        throw new ErroApi(
          `O Apps Script respondeu com erro ${resposta.status}.`,
          { status: resposta.status },
        )
      }
      return interpretar(texto)
    } catch (erro) {
      // Cancelamento explícito do chamador: propaga sem retry.
      if (signal?.aborted) throw erro

      let repetivel = false
      if (erro.name === 'AbortError') {
        ultimo = erroDeRede(
          'O Apps Script demorou demais para responder (timeout).',
        )
        repetivel = true
      } else if (!(erro instanceof ErroApi)) {
        // TypeError de fetch = falha de rede.
        ultimo = erroDeRede(
          'Não consegui falar com o Apps Script. Verifique a internet e a URL configurada.',
        )
        repetivel = true
      } else {
        ultimo = erro
        repetivel = erro.status >= 500
      }

      if (repetivel && i < tentativas - 1) {
        await espera(400 * 2 ** i)
        continue
      }
      throw ultimo
    }
  }
  throw ultimo
}

/**
 * Upload de arquivo. Usa `fetch` (não XMLHttpRequest) de propósito:
 *
 * Anexar qualquer listener em `xhr.upload` (para progresso de envio) torna a
 * requisição "não-simples" no CORS e dispara um preflight OPTIONS — que o Web
 * App do Apps Script NÃO responde. O resultado é um falso "sem conexão" no
 * upload, mesmo com a internet ok. Com `fetch` (sem upload listeners e com o
 * mesmo `text/plain`) a requisição continua simples e segue o redirect do
 * Apps Script, como o resto das chamadas. Trade-off: sem % de progresso fino
 * do envio (o chamador mostra passos/spinner).
 */
export async function enviarArquivo(action, payload, { onProgress, signal } = {}) {
  const { url, token } = base()
  const corpo = JSON.stringify({ token, action, ...payload })

  let resposta
  try {
    resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: corpo,
      signal: sinalComTimeout(signal, 60000),
      redirect: 'follow',
    })
  } catch {
    if (signal?.aborted) throw new ErroApi('Envio cancelado.')
    throw erroDeRede(
      'Falha ao enviar o arquivo (rede lenta ou instável). Tente de novo.',
    )
  }

  const texto = await resposta.text()
  if (!resposta.ok) {
    throw new ErroApi(`O Apps Script respondeu com erro ${resposta.status}.`, {
      status: resposta.status,
    })
  }
  const dados = interpretar(texto)
  onProgress?.(100)
  return dados
}
