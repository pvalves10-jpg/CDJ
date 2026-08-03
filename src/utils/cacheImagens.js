/**
 * Cache de imagens do Drive em IndexedDB.
 *
 * As imagens do Drive são imutáveis por id, então guardamos o Blob por
 * `id:tamanho` e reusamos entre sessões — na 2ª visita a galeria abre sem rede.
 * Tudo é best-effort: se o IndexedDB não estiver disponível (aba privada), as
 * funções simplesmente não cacheiam e o app segue baixando normalmente.
 */

const DB = 'cdj-imagens'
const STORE = 'imagens'
let promessaDb = null

function abrir() {
  if (promessaDb) return promessaDb
  promessaDb = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('sem idb'))
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }).catch(() => null)
  return promessaDb
}

export async function getImagem(chave) {
  const db = await abrir()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(chave)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function putImagem(chave, blob) {
  const db = await abrir()
  if (!db) return
  try {
    db.transaction(STORE, 'readwrite').objectStore(STORE).put(blob, chave)
  } catch {
    /* quota/erro — segue sem cache */
  }
}
