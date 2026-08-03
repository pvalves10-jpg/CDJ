import { chamar } from './api'
import { reduzirImagem } from '../utils/imagem'
import { CATEGORIAS_PADRAO } from '../utils/constantes'

/**
 * Leitura de comprovante.
 *
 * A imagem é reduzida NO NAVEGADOR (economiza dados no 4G) e enviada ao Apps
 * Script, que chama o Gemini com a chave guardada do lado do servidor. Assim a
 * GEMINI_API_KEY nunca aparece no site. A resposta (texto do modelo) é validada
 * aqui — campo ruim vira null e o formulário fica em branco nele.
 */

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
 * um corpo de vários MB, lento e sem ganho de precisão para ler um cupom.
 */
async function prepararImagem(file) {
  const blob = await reduzirImagem(file, 1600, 0.85)
  return { mimeType: blob.type || 'image/jpeg', base64: await paraBase64(blob) }
}

/* ---------------------------------------------------------------- resposta */

const IDS_CATEGORIA = new Set(CATEGORIAS_PADRAO.map((c) => c.id))

function limparJson(texto) {
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

/**
 * Lê um comprovante e devolve `{ local, data, valor, categoria }`.
 * Campos não identificados vêm como `null`.
 */
export async function lerComprovante(file, { signal } = {}) {
  if (!file) throw new ErroGemini('Nenhuma imagem selecionada.')

  const imagem = await prepararImagem(file)

  let texto
  try {
    const resposta = await chamar(
      'gemini',
      { mimeType: imagem.mimeType, base64: imagem.base64 },
      { signal },
    )
    texto = resposta.texto
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro
    throw new ErroGemini(
      erro.message ||
        'Falha ao ler o comprovante. Tente outra foto ou preencha manualmente.',
    )
  }

  if (!texto || !texto.trim()) {
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

/** Ping do Gemini para o "Testar conexão" — reflete o status vindo do Apps Script. */
export async function testarGemini() {
  try {
    const ping = await chamar('ping')
    return ping.gemini
      ? { ok: true, detalhe: 'chave configurada no Apps Script' }
      : { ok: false, detalhe: 'GEMINI_API_KEY não configurada no Apps Script.' }
  } catch (erro) {
    return { ok: false, detalhe: erro.message }
  }
}
