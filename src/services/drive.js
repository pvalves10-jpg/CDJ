import { chamar, enviarArquivo } from './api'

/**
 * Camada de Drive — agora sobre o backend em Apps Script.
 *
 * As assinaturas das funções são as mesmas da versão OAuth (lerDespesas,
 * salvarDespesas, uploadComprovante, uploadFoto, listarFotos, ...), então os
 * hooks e componentes continuam iguais. O que mudou é o transporte: em vez de
 * falar direto com a API do Google Drive usando um token OAuth, tudo passa pelo
 * Web App do Apps Script, que roda na conta do dono da pasta.
 */

export class ErroDrive extends Error {
  constructor(mensagem, { status } = {}) {
    super(mensagem)
    this.name = 'ErroDrive'
    this.status = status
  }
}

/**
 * Compatibilidade: no modelo OAuth havia um cache de IDs de subpastas. O Apps
 * Script resolve as pastas por conta própria, então aqui é só um no-op — mantido
 * porque `useDrive` e `Configuracoes` ainda importam este nome.
 */
export function limparCachePastas() {}

/* ---------------------------------------------------------------- despesas */

/** Envelope vazio — o formato canônico gravado no Drive. */
export function envelopeVazio() {
  return { versao: 1, despesas: [], categorias_custom: [], acertos: [] }
}

/**
 * Normaliza o conteúdo lido do Drive. Aceita tanto o array puro (arquivo criado
 * à mão) quanto o envelope-objeto, e sempre devolve o envelope.
 */
function normalizar(bruto) {
  if (Array.isArray(bruto)) return { ...envelopeVazio(), despesas: bruto }
  if (bruto && typeof bruto === 'object') {
    return {
      versao: bruto.versao ?? 1,
      despesas: Array.isArray(bruto.despesas) ? bruto.despesas : [],
      categorias_custom: Array.isArray(bruto.categorias_custom)
        ? bruto.categorias_custom
        : [],
      acertos: Array.isArray(bruto.acertos) ? bruto.acertos : [],
    }
  }
  return envelopeVazio()
}

/** Lê `DESPESAS/despesas.json`. Se ainda não existe, devolve o envelope vazio. */
export async function lerDespesas() {
  const { dados } = await chamar('ler')
  return normalizar(dados)
}

/** Sobrescreve `DESPESAS/despesas.json`. Aceita array ou envelope. */
export async function salvarDespesas(dados) {
  const envelope = normalizar(dados)
  await chamar('salvar', { dados: envelope })
  return envelope
}

/* ----------------------------------------------------------------- uploads */

function fileParaBase64(file) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () =>
      resolve({
        mimeType: file.type || 'application/octet-stream',
        base64: String(leitor.result).split(',')[1] ?? '',
      })
    leitor.onerror = () =>
      reject(new ErroDrive(`Não consegui ler o arquivo "${file.name}".`))
    leitor.readAsDataURL(file)
  })
}

/** Upload genérico com progresso. `alvo` = 'fotos' | 'despesas'. */
async function upload(file, alvo, { nome, onProgress, signal } = {}) {
  const { base64, mimeType } = await fileParaBase64(file)
  const { arquivo } = await enviarArquivo(
    'upload',
    { alvo, nome: nome || file.name, mimeType, base64 },
    { onProgress, signal },
  )
  onProgress?.(100)
  return arquivo
}

/** Upload de comprovante para a pasta DESPESAS. */
export async function uploadComprovante(file, opcoes) {
  return upload(file, 'despesas', opcoes)
}

/** Upload de foto para a pasta FOTOS. */
export async function uploadFoto(file, opcoes) {
  return upload(file, 'fotos', opcoes)
}

/* ------------------------------------------------------------------- fotos */

/** Lista as imagens de FOTOS, mais recentes primeiro. */
export async function listarFotos() {
  const { fotos } = await chamar('listarFotos')
  return Array.isArray(fotos) ? fotos : []
}

function base64ParaBlob(base64, mime) {
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return new Blob([bytes], { type: mime || 'application/octet-stream' })
}

/**
 * Baixa o conteúdo de um arquivo (via Apps Script) e devolve um object URL.
 * Quem chama é responsável por dar `URL.revokeObjectURL`.
 */
export async function baixarComoObjectURL(fileId) {
  const { base64, mimeType } = await chamar('imagem', { id: fileId })
  return URL.createObjectURL(base64ParaBlob(base64, mimeType))
}

export async function excluirArquivo(fileId) {
  if (!fileId) return
  await chamar('excluir', { id: fileId })
}

/* --------------------------------------------------------- teste de conexão */

/**
 * Valida a cadeia inteira via um único `ping` no Apps Script.
 * Devolve uma lista de etapas para a tela de Configurações exibir.
 * Não lança: em erro de conexão, reporta a etapa que falhou.
 */
export async function testarConexao() {
  const etapas = []
  const add = (rotulo, ok, detalhe) => etapas.push({ rotulo, ok, detalhe })

  let ping
  try {
    ping = await chamar('ping')
  } catch (erro) {
    add('Conexão com o Apps Script', false, erro.message)
    return etapas
  }

  add('Conexão com o Apps Script', true, 'Web App respondeu e token aceito.')

  add(
    'Pasta DESPESAS (despesas.json)',
    !ping.despesasErro,
    ping.despesasErro ||
      (ping.despesas
        ? `${ping.despesas} despesa(s)`
        : 'arquivo ainda não existe — será criado na primeira despesa'),
  )

  add(
    'Pasta FOTOS',
    !ping.fotosErro,
    ping.fotosErro ||
      (ping.fotos ? `${ping.fotos} foto(s)` : 'nenhuma foto ainda'),
  )

  add(
    'Chave do Gemini',
    Boolean(ping.gemini),
    ping.gemini
      ? 'configurada no Apps Script'
      : 'não configurada — leitura de comprovante por foto ficará indisponível',
  )

  return etapas
}
