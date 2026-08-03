/**
 * Resolução de configuração.
 *
 * Precedência: localStorage (tela de Configurações) > src/config.js (arquivo local).
 *
 * O arquivo `src/config.js` está no .gitignore, então NÃO existe no build do
 * GitHub Actions. Por isso é carregado via `import.meta.glob`, que resolve para
 * um objeto vazio quando o arquivo não existe — um `import` estático quebraria
 * o build em CI.
 *
 * Backend em Apps Script: o app só guarda a URL do Web App e um token. As
 * chaves sensíveis (IDs das pastas, chave do Gemini) ficam nas Propriedades do
 * Script, do lado do Apps Script — nunca no navegador.
 */
const modulos = import.meta.glob('../config.js', { eager: true })
const doArquivo = Object.values(modulos)[0]?.CONFIG ?? {}

const LS_KEY = 'cdj:config'

export const CHAVES = ['APPSCRIPT_URL', 'APP_TOKEN']

function doLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) ?? {}
  } catch {
    return {}
  }
}

/** Config efetiva do app. Sempre retorna as chaves (string, possivelmente vazia). */
export function getConfig() {
  const salvo = doLocalStorage()
  const resultado = {}
  for (const chave of CHAVES) {
    resultado[chave] = (salvo[chave] || doArquivo[chave] || '').trim()
  }
  return resultado
}

/* --------------------------------------------------------------- ouvintes */

const ouvintes = new Set()

/** Assina mudanças de configuração. `fn(estaConfigurado())` é chamado a cada save. */
export function assinarConfig(fn) {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

function notificar() {
  const configurado = estaConfigurado()
  for (const fn of ouvintes) fn(configurado)
}

/** Grava (parcialmente) a config no localStorage e avisa os ouvintes. */
export function setConfig(parcial) {
  const atual = doLocalStorage()
  const novo = { ...atual }
  for (const chave of CHAVES) {
    if (chave in parcial) novo[chave] = (parcial[chave] ?? '').trim()
  }
  localStorage.setItem(LS_KEY, JSON.stringify(novo))
  notificar()
  return getConfig()
}

/** true quando a URL do Apps Script e o token estão preenchidos. */
export function estaConfigurado(cfg = getConfig()) {
  return CHAVES.every((chave) => Boolean(cfg[chave]))
}

/** Alias histórico usado por algumas telas. */
export const configCompleta = estaConfigurado

/** Quais chaves ainda faltam. */
export function chavesFaltando(cfg = getConfig()) {
  return CHAVES.filter((chave) => !cfg[chave])
}
