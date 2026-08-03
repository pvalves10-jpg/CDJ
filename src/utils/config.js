/**
 * Resolução de configuração.
 *
 * Precedência: localStorage (tela de Configurações) > src/config.js (arquivo local).
 *
 * O arquivo `src/config.js` está no .gitignore, então NÃO existe no build do
 * GitHub Actions. Por isso é carregado via `import.meta.glob`, que resolve para
 * um objeto vazio quando o arquivo não existe — um `import` estático quebraria
 * o build em CI.
 */
const modulos = import.meta.glob('../config.js', { eager: true })
const doArquivo = Object.values(modulos)[0]?.CONFIG ?? {}

const LS_KEY = 'cdj:config'

export const CHAVES = ['GEMINI_API_KEY', 'GOOGLE_CLIENT_ID', 'DRIVE_FOLDER_ID']

function doLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) ?? {}
  } catch {
    return {}
  }
}

/** Config efetiva do app. Sempre retorna as três chaves (string, possivelmente vazia). */
export function getConfig() {
  const salvo = doLocalStorage()
  const resultado = {}
  for (const chave of CHAVES) {
    resultado[chave] = (salvo[chave] || doArquivo[chave] || '').trim()
  }
  return resultado
}

/** Grava (parcialmente) a config no localStorage. */
export function setConfig(parcial) {
  const atual = doLocalStorage()
  const novo = { ...atual }
  for (const chave of CHAVES) {
    if (chave in parcial) novo[chave] = (parcial[chave] ?? '').trim()
  }
  localStorage.setItem(LS_KEY, JSON.stringify(novo))
  return getConfig()
}

/** true quando as três chaves estão preenchidas. */
export function configCompleta(cfg = getConfig()) {
  return CHAVES.every((chave) => Boolean(cfg[chave]))
}

/** Quais chaves ainda faltam. */
export function chavesFaltando(cfg = getConfig()) {
  return CHAVES.filter((chave) => !cfg[chave])
}

/**
 * Aceita tanto o ID puro quanto a URL completa da pasta do Drive
 * (https://drive.google.com/drive/folders/<ID>?usp=sharing) e devolve só o ID.
 */
export function extrairIdDrive(entrada) {
  const texto = (entrada ?? '').trim()
  if (!texto) return ''
  const porCaminho = texto.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (porCaminho) return porCaminho[1]
  const porQuery = texto.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (porQuery) return porQuery[1]
  return texto
}
