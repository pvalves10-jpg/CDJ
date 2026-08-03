import { ErroAuth, garantirToken, limparToken } from './auth'
import { getConfig } from '../utils/config'
import { ARQUIVO_DESPESAS, NOMES_PASTAS } from '../utils/constantes'

const API = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'

export class ErroDrive extends Error {
  constructor(mensagem, { status } = {}) {
    super(mensagem)
    this.name = 'ErroDrive'
    this.status = status
  }
}

/** Escapa aspas simples e barras para uso dentro do parâmetro `q` do Drive. */
function esc(texto) {
  return String(texto).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

async function requisitar(url, opcoes = {}) {
  const token = await garantirToken()

  const resposta = await fetch(url, {
    ...opcoes,
    headers: { Authorization: `Bearer ${token}`, ...opcoes.headers },
  })

  if (resposta.status === 401) {
    limparToken()
    throw new ErroAuth(
      'LOGIN_NECESSARIO',
      'A sessão do Google expirou. Conecte novamente.',
    )
  }

  if (!resposta.ok) {
    let detalhe = ''
    try {
      const corpo = await resposta.json()
      detalhe = corpo?.error?.message ?? ''
    } catch {
      /* resposta sem json */
    }
    if (resposta.status === 403) {
      throw new ErroDrive(
        detalhe ||
          'O Google recusou o acesso (403). Verifique se a Google Drive API está ativada e se sua conta tem permissão na pasta.',
        { status: 403 },
      )
    }
    if (resposta.status === 404) {
      throw new ErroDrive(detalhe || 'Item não encontrado no Drive.', {
        status: 404,
      })
    }
    throw new ErroDrive(
      detalhe || `Erro ${resposta.status} ao falar com o Google Drive.`,
      { status: resposta.status },
    )
  }

  return resposta
}

async function listar(params) {
  const query = new URLSearchParams({
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
    ...params,
  })
  const resposta = await requisitar(`${API}/files?${query}`)
  return resposta.json()
}

/* ------------------------------------------------------------------ pastas */

const cachePastas = new Map()

export function limparCachePastas() {
  cachePastas.clear()
}

function idRaiz() {
  const { DRIVE_FOLDER_ID } = getConfig()
  if (!DRIVE_FOLDER_ID) {
    throw new ErroDrive(
      'Informe o ID da pasta CDJ na tela de Configurações.',
    )
  }
  return DRIVE_FOLDER_ID
}

export async function getPastaRaiz() {
  const id = idRaiz()
  const resposta = await requisitar(
    `${API}/files/${id}?fields=id,name,mimeType&supportsAllDrives=true`,
  )
  const pasta = await resposta.json()
  if (pasta.mimeType !== 'application/vnd.google-apps.folder') {
    throw new ErroDrive(
      'O ID informado não é de uma pasta. Confira o link da pasta CDJ no Drive.',
    )
  }
  return pasta
}

async function acharPasta(nome, paiId) {
  const q = [
    `'${esc(paiId)}' in parents`,
    `name = '${esc(nome)}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    'trashed = false',
  ].join(' and ')

  const { files } = await listar({ q, fields: 'files(id,name)', pageSize: '10' })
  return files?.[0] ?? null
}

/**
 * ID de uma subpasta (DESPESAS / FOTOS) dentro da pasta CDJ.
 * O app nunca cria a estrutura — se não existir, é erro.
 */
export async function getPasta(nome) {
  const chave = `${idRaiz()}:${nome}`
  if (cachePastas.has(chave)) return cachePastas.get(chave)

  const pasta = await acharPasta(nome, idRaiz())
  if (!pasta) {
    throw new ErroDrive(
      `A subpasta "${nome}" não foi encontrada dentro da pasta CDJ no Drive.`,
      { status: 404 },
    )
  }
  cachePastas.set(chave, pasta.id)
  return pasta.id
}

async function acharArquivo(nome, paiId) {
  const q = [
    `'${esc(paiId)}' in parents`,
    `name = '${esc(nome)}'`,
    'trashed = false',
  ].join(' and ')

  const { files } = await listar({
    q,
    fields: 'files(id,name,modifiedTime)',
    pageSize: '10',
  })
  return files?.[0] ?? null
}

/* ---------------------------------------------------------------- despesas */

/** Envelope vazio — o formato canônico gravado no Drive. */
export function envelopeVazio() {
  return { versao: 1, despesas: [], categorias_custom: [], acertos: [] }
}

/**
 * Normaliza o conteúdo lido do Drive.
 *
 * O CLAUDE.md descreve `despesas.json` ora como "um array de despesas", ora
 * como um objeto com o campo `categorias_custom`. As duas formas não cabem
 * juntas, então gravamos sempre o envelope-objeto e aceitamos o array puro na
 * leitura (compatibilidade com um arquivo criado à mão).
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

/**
 * Lê `DESPESAS/despesas.json`.
 * Se o arquivo ainda não existe, devolve o envelope vazio (não é erro — o
 * arquivo é criado na primeira gravação).
 */
export async function lerDespesas() {
  const pastaId = await getPasta(NOMES_PASTAS.DESPESAS)
  const arquivo = await acharArquivo(ARQUIVO_DESPESAS, pastaId)
  if (!arquivo) return envelopeVazio()

  const resposta = await requisitar(
    `${API}/files/${arquivo.id}?alt=media&supportsAllDrives=true`,
  )
  const texto = await resposta.text()
  if (!texto.trim()) return envelopeVazio()

  try {
    return normalizar(JSON.parse(texto))
  } catch {
    throw new ErroDrive(
      'O arquivo despesas.json no Drive está corrompido (JSON inválido). Renomeie-o e o app criará um novo.',
    )
  }
}

/** Sobrescreve `DESPESAS/despesas.json`. Aceita array ou envelope. */
export async function salvarDespesas(dados) {
  const pastaId = await getPasta(NOMES_PASTAS.DESPESAS)
  const envelope = normalizar(dados)
  const corpo = JSON.stringify(envelope, null, 2)
  const arquivo = await acharArquivo(ARQUIVO_DESPESAS, pastaId)

  if (arquivo) {
    await requisitar(
      `${UPLOAD}/${arquivo.id}?uploadType=media&supportsAllDrives=true`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: corpo,
      },
    )
    return envelope
  }

  const form = new FormData()
  form.append(
    'metadata',
    new Blob(
      [JSON.stringify({ name: ARQUIVO_DESPESAS, parents: [pastaId] })],
      { type: 'application/json' },
    ),
  )
  form.append('file', new Blob([corpo], { type: 'application/json' }))

  await requisitar(
    `${UPLOAD}?uploadType=multipart&fields=id&supportsAllDrives=true`,
    { method: 'POST', body: form },
  )

  return envelope
}

/* ----------------------------------------------------------------- uploads */

const CAMPOS_ARQUIVO =
  'id,name,mimeType,thumbnailLink,createdTime,size,imageMediaMetadata(width,height)'

/**
 * Upload multipart com progresso.
 * Usa XMLHttpRequest porque `fetch` não expõe progresso de envio.
 */
export async function uploadArquivo(
  file,
  pastaId,
  { nome, onProgress, signal } = {},
) {
  const token = await garantirToken()

  const form = new FormData()
  form.append(
    'metadata',
    new Blob(
      [JSON.stringify({ name: nome || file.name, parents: [pastaId] })],
      { type: 'application/json' },
    ),
  )
  form.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(
      'POST',
      `${UPLOAD}?uploadType=multipart&supportsAllDrives=true&fields=${encodeURIComponent(CAMPOS_ARQUIVO)}`,
    )
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (evento) => {
      if (onProgress && evento.lengthComputable) {
        onProgress(Math.round((evento.loaded / evento.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 401) {
        limparToken()
        return reject(
          new ErroAuth(
            'LOGIN_NECESSARIO',
            'A sessão do Google expirou durante o envio. Conecte novamente.',
          ),
        )
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        let detalhe = ''
        try {
          detalhe = JSON.parse(xhr.responseText)?.error?.message ?? ''
        } catch {
          /* sem json */
        }
        return reject(
          new ErroDrive(
            detalhe || `Falha no envio de "${file.name}" (erro ${xhr.status}).`,
            { status: xhr.status },
          ),
        )
      }
      onProgress?.(100)
      try {
        resolve(JSON.parse(xhr.responseText))
      } catch {
        resolve({ id: null })
      }
    }

    xhr.onerror = () =>
      reject(new ErroDrive(`Falha de rede ao enviar "${file.name}".`))
    xhr.onabort = () =>
      reject(new ErroDrive(`Envio de "${file.name}" cancelado.`))

    signal?.addEventListener('abort', () => xhr.abort(), { once: true })

    xhr.send(form)
  })
}

/** Upload de comprovante para a pasta DESPESAS. */
export async function uploadComprovante(file, opcoes) {
  const pastaId = await getPasta(NOMES_PASTAS.DESPESAS)
  return uploadArquivo(file, pastaId, opcoes)
}

/** Upload de foto para a pasta FOTOS. */
export async function uploadFoto(file, opcoes) {
  const pastaId = await getPasta(NOMES_PASTAS.FOTOS)
  return uploadArquivo(file, pastaId, opcoes)
}

/* ------------------------------------------------------------------- fotos */

/** Lista as imagens de CDJ/FOTOS, mais recentes primeiro. Pagina até o fim. */
export async function listarFotos() {
  const pastaId = await getPasta(NOMES_PASTAS.FOTOS)
  const q = [
    `'${esc(pastaId)}' in parents`,
    'trashed = false',
    "mimeType contains 'image/'",
  ].join(' and ')

  const arquivos = []
  let pageToken

  do {
    const dados = await listar({
      q,
      fields: `nextPageToken, files(${CAMPOS_ARQUIVO})`,
      orderBy: 'createdTime desc',
      pageSize: '200',
      ...(pageToken ? { pageToken } : {}),
    })
    arquivos.push(...(dados.files ?? []))
    pageToken = dados.nextPageToken
  } while (pageToken)

  return arquivos
}

/**
 * Baixa o conteúdo de um arquivo com o token e devolve um object URL.
 * Necessário porque `thumbnailLink` aponta para googleusercontent.com e
 * depende da sessão do Google no navegador — nem sempre disponível.
 * Quem chama é responsável por dar `URL.revokeObjectURL`.
 */
export async function baixarComoObjectURL(fileId) {
  const resposta = await requisitar(
    `${API}/files/${fileId}?alt=media&supportsAllDrives=true`,
  )
  return URL.createObjectURL(await resposta.blob())
}

export async function excluirArquivo(fileId) {
  if (!fileId) return
  await requisitar(`${API}/files/${fileId}?supportsAllDrives=true`, {
    method: 'DELETE',
  })
}

/* --------------------------------------------------------- teste de conexão */

/**
 * Valida a cadeia inteira: token → pasta raiz → subpastas → despesas.json.
 * Devolve uma lista de etapas para a tela de Configurações exibir.
 * Não lança: cada etapa reporta seu próprio erro.
 */
export async function testarConexao() {
  const etapas = []
  const registrar = (rotulo, ok, detalhe) =>
    etapas.push({ rotulo, ok, detalhe })

  try {
    await garantirToken()
    registrar('Conta Google conectada', true)
  } catch (erro) {
    registrar('Conta Google conectada', false, erro.message)
    return etapas
  }

  let raiz
  try {
    raiz = await getPastaRaiz()
    registrar('Pasta CDJ acessível', true, `"${raiz.name}"`)
  } catch (erro) {
    registrar('Pasta CDJ acessível', false, erro.message)
    return etapas
  }

  limparCachePastas()

  for (const nome of [NOMES_PASTAS.DESPESAS, NOMES_PASTAS.FOTOS]) {
    try {
      await getPasta(nome)
      registrar(`Subpasta ${nome}`, true)
    } catch (erro) {
      registrar(`Subpasta ${nome}`, false, erro.message)
    }
  }

  try {
    const dados = await lerDespesas()
    registrar(
      'Leitura de despesas.json',
      true,
      dados.despesas.length
        ? `${dados.despesas.length} despesa(s)`
        : 'arquivo ainda não existe — será criado na primeira despesa',
    )
  } catch (erro) {
    registrar('Leitura de despesas.json', false, erro.message)
  }

  return etapas
}
