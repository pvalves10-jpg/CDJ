import { getConfig } from '../utils/config'
import { CATEGORIAS_PADRAO } from '../utils/constantes'

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * O CLAUDE.md especifica `gemini-1.5-flash`, mas o Google descontinuou esse
 * modelo (set/2025) e chaves novas recebem 404 nele. Tentamos do mais atual
 * para o mais antigo e memorizamos o primeiro que responder, para não pagar o
 * custo da descoberta em toda leitura.
 */
const MODELOS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
const LS_MODELO = 'cdj:modelo-gemini'

/** Prompt exato do CLAUDE.md — não alterar. */
const PROMPT = `Analise este comprovante de pagamento brasileiro e retorne APENAS um JSON válido, sem markdown, sem texto adicional:
{
  "local": "nome do estabelecimento ou loja",
  "data": "YYYY-MM-DD",
  "valor": 0.00,
  "categoria": "restaurante|hospedagem|transporte|mercado|passeio|outro"
}
Se não conseguir identificar algum campo, use null.`

export class ErroGemini extends Error {
  constructor(mensagem) {
    super(mensagem)
    this.name = 'ErroGemini'
  }
}

/* ------------------------------------------------------------------ imagem */

function paraBase64(blob) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result).split(',')[1] ?? '')
    leitor.onerror = () =>
      reject(new ErroGemini('Não foi possível ler o arquivo da imagem.'))
    leitor.readAsDataURL(blob)
  })
}

/**
 * Reduz a foto antes de enviar. Uma foto de celular tem ~12MP; em base64 vira
 * um corpo de vários MB, lento no 4G e sem ganho de precisão para ler um cupom.
 * Se o navegador não decodificar o formato (HEIC, por exemplo), manda o original.
 */
async function prepararImagem(file, maxLado = 1600) {
  const original = async () => ({
    mimeType: file.type || 'image/jpeg',
    base64: await paraBase64(file),
  })

  if (typeof createImageBitmap !== 'function') return original()

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return original()
  }

  try {
    const maior = Math.max(bitmap.width, bitmap.height)
    if (maior <= maxLado && file.size < 1_500_000) return original()

    const escala = Math.min(1, maxLado / maior)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85))
    if (!blob) return original()

    return { mimeType: 'image/jpeg', base64: await paraBase64(blob) }
  } finally {
    bitmap.close?.()
  }
}

/* ---------------------------------------------------------------- resposta */

const IDS_CATEGORIA = new Set(CATEGORIAS_PADRAO.map((c) => c.id))

function limparJson(texto) {
  // Mesmo pedindo "sem markdown", o modelo às vezes envolve em ```json.
  const semCerca = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
  const inicio = semCerca.indexOf('{')
  const fim = semCerca.lastIndexOf('}')
  return inicio >= 0 && fim > inicio ? semCerca.slice(inicio, fim + 1) : semCerca
}

/** Nunca confia no formato devolvido pelo modelo — campo ruim vira null. */
function validar(bruto) {
  const local =
    typeof bruto?.local === 'string' && bruto.local.trim()
      ? bruto.local.trim().slice(0, 120)
      : null

  const data =
    typeof bruto?.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(bruto.data)
      ? bruto.data
      : null

  const numero = Number(bruto?.valor)
  const valor = Number.isFinite(numero) && numero > 0 ? numero : null

  const categoria = IDS_CATEGORIA.has(bruto?.categoria) ? bruto.categoria : null

  return { local, data, valor, categoria }
}

/* -------------------------------------------------------------- requisição */

function mensagemDeErro(status, detalhe) {
  if (status === 400 && /API key/i.test(detalhe)) {
    return 'A GEMINI_API_KEY parece inválida. Confira em Configurações.'
  }
  if (status === 403) {
    return 'A chave do Gemini não tem permissão. Verifique se a API está habilitada no Google AI Studio.'
  }
  if (status === 429) {
    return 'Limite de uso do Gemini atingido. Tente de novo em alguns minutos ou preencha a despesa manualmente.'
  }
  if (status >= 500) {
    return 'O Gemini está indisponível no momento. Tente de novo ou preencha manualmente.'
  }
  return detalhe || `Falha ao chamar o Gemini (erro ${status}).`
}

async function chamar(modelo, chave, imagem, signal) {
  const resposta = await fetch(
    `${BASE}/${modelo}:generateContent?key=${encodeURIComponent(chave)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              {
                inline_data: {
                  mime_type: imagem.mimeType,
                  data: imagem.base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!resposta.ok) {
    let detalhe = ''
    try {
      detalhe = (await resposta.json())?.error?.message ?? ''
    } catch {
      /* sem json */
    }
    const erro = new ErroGemini(mensagemDeErro(resposta.status, detalhe))
    erro.status = resposta.status
    // 404 = modelo inexistente para esta chave; vale tentar o próximo da lista.
    erro.modeloInvalido = resposta.status === 404
    throw erro
  }

  return resposta.json()
}

/**
 * Lê um comprovante e devolve `{ local, data, valor, categoria }`.
 * Campos não identificados vêm como `null` — o formulário fica em branco neles.
 */
export async function lerComprovante(file, { signal } = {}) {
  const { GEMINI_API_KEY } = getConfig()
  if (!GEMINI_API_KEY) {
    throw new ErroGemini(
      'Informe a GEMINI_API_KEY em Configurações para ler comprovantes por foto.',
    )
  }
  if (!file) throw new ErroGemini('Nenhuma imagem selecionada.')

  const imagem = await prepararImagem(file)

  const memorizado = localStorage.getItem(LS_MODELO)
  const candidatos = memorizado
    ? [memorizado, ...MODELOS.filter((m) => m !== memorizado)]
    : MODELOS

  let dados = null
  let ultimoErro = null

  for (const modelo of candidatos) {
    try {
      dados = await chamar(modelo, GEMINI_API_KEY, imagem, signal)
      localStorage.setItem(LS_MODELO, modelo)
      break
    } catch (erro) {
      if (erro.name === 'AbortError') throw erro
      ultimoErro = erro
      if (!erro.modeloInvalido) throw erro
    }
  }

  if (!dados) {
    throw (
      ultimoErro ??
      new ErroGemini('Nenhum modelo do Gemini respondeu a esta chave.')
    )
  }

  const candidato = dados?.candidates?.[0]
  if (candidato?.finishReason === 'SAFETY') {
    throw new ErroGemini(
      'O Gemini bloqueou esta imagem. Preencha a despesa manualmente.',
    )
  }

  const texto = candidato?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim()

  if (!texto) {
    throw new ErroGemini(
      'O Gemini não conseguiu ler nada nesta imagem. Tente outra foto ou preencha manualmente.',
    )
  }

  try {
    return validar(JSON.parse(limparJson(texto)))
  } catch {
    throw new ErroGemini(
      'A resposta do Gemini veio num formato inesperado. Preencha a despesa manualmente.',
    )
  }
}

/** Ping barato usado pelo "Testar conexão" da tela de Configurações. */
export async function testarGemini() {
  const { GEMINI_API_KEY } = getConfig()
  if (!GEMINI_API_KEY) {
    return { ok: false, detalhe: 'Chave não informada.' }
  }

  const memorizado = localStorage.getItem(LS_MODELO)
  const candidatos = memorizado
    ? [memorizado, ...MODELOS.filter((m) => m !== memorizado)]
    : MODELOS

  let ultimo = ''
  for (const modelo of candidatos) {
    try {
      const resposta = await fetch(
        `${BASE}/${modelo}?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      )
      if (resposta.ok) {
        localStorage.setItem(LS_MODELO, modelo)
        return { ok: true, detalhe: `modelo ${modelo}` }
      }
      let detalhe = ''
      try {
        detalhe = (await resposta.json())?.error?.message ?? ''
      } catch {
        /* sem json */
      }
      ultimo = mensagemDeErro(resposta.status, detalhe)
      if (resposta.status !== 404) return { ok: false, detalhe: ultimo }
    } catch (erro) {
      return { ok: false, detalhe: erro.message }
    }
  }

  return { ok: false, detalhe: ultimo || 'Nenhum modelo disponível.' }
}
