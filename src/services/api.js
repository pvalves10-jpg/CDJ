import { getConfig } from '../utils/config'

/**
 * Cliente do backend em Google Apps Script.
 *
 * Todas as operações de Drive e Gemini passam por aqui. O Apps Script roda na
 * conta do dono da pasta e é protegido por um token compartilhado — então o
 * navegador nunca vê chave nenhuma, só a URL do Web App e o token.
 *
 * Detalhe importante de CORS: enviamos o corpo como `text/plain`. Isso mantém a
 * requisição "simples" (sem preflight OPTIONS, que o Apps Script não responde) e
 * mesmo assim entregamos JSON — o `doPost` lê `e.postData.contents` e faz parse.
 */

export class ErroApi extends Error {
  constructor(mensagem, { status } = {}) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
  }
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

/** Chamada JSON simples (fetch). Devolve o objeto já validado. */
export async function chamar(action, payload = {}, { signal } = {}) {
  const { url, token } = base()

  let resposta
  try {
    resposta = await fetch(url, {
      method: 'POST',
      // text/plain evita o preflight de CORS; o corpo continua sendo JSON.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token, action, ...payload }),
      signal,
      redirect: 'follow',
    })
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro
    throw new ErroApi(
      'Não consegui falar com o Apps Script. Verifique a internet e a URL configurada.',
    )
  }

  const texto = await resposta.text()
  if (!resposta.ok) {
    throw new ErroApi(`O Apps Script respondeu com erro ${resposta.status}.`, {
      status: resposta.status,
    })
  }
  return interpretar(texto)
}

/**
 * Upload com progresso. Usa XMLHttpRequest porque `fetch` não expõe progresso
 * de envio — importante para as barras da tela de Fotos.
 */
export function enviarArquivo(action, payload, { onProgress, signal } = {}) {
  const { url, token } = base()
  const corpo = JSON.stringify({ token, action, ...payload })

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('Content-Type', 'text/plain;charset=utf-8')

    xhr.upload.onprogress = (evento) => {
      if (onProgress && evento.lengthComputable) {
        onProgress(Math.round((evento.loaded / evento.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        return reject(
          new ErroApi(`O Apps Script respondeu com erro ${xhr.status}.`, {
            status: xhr.status,
          }),
        )
      }
      try {
        resolve(interpretar(xhr.responseText))
      } catch (erro) {
        reject(erro)
      }
    }

    xhr.onerror = () =>
      reject(new ErroApi('Falha de rede ao enviar o arquivo ao Apps Script.'))
    xhr.onabort = () => reject(new ErroApi('Envio cancelado.'))

    signal?.addEventListener('abort', () => xhr.abort(), { once: true })

    xhr.send(corpo)
  })
}
