/**
 * Localização do usuário em tempo real (GPS do telefone).
 *
 * Store fora do React (como o toast): a posição é única no app, então qualquer
 * tela — Roteiro, Home, os botões de corrida — lê a mesma fonte e reage.
 *
 * status: 'inicial'  — ainda não pedimos
 *         'pedindo'  — aguardando o usuário autorizar / primeiro fix
 *         'ok'       — rastreando ao vivo
 *         'cache'    — sem rastrear agora, mas temos a última posição salva
 *         'negado'   — usuário recusou a permissão
 *         'indisponivel' — sem GPS / erro
 */

const CHAVE = 'cdj_ultima_posicao'

let estado = { status: 'inicial', posicao: null }
let watchId = null
const ouvintes = new Set()

// Recupera a última posição conhecida (para já ter uma estimativa ao abrir).
try {
  const bruto = localStorage.getItem(CHAVE)
  if (bruto) {
    const p = JSON.parse(bruto)
    if (p && Number.isFinite(p.lat) && Number.isFinite(p.lon)) {
      estado = { status: 'cache', posicao: p }
    }
  }
} catch {
  /* localStorage indisponível — segue sem cache */
}

function emitir() {
  for (const fn of ouvintes) fn(estado)
}

function definir(parcial) {
  estado = { ...estado, ...parcial }
  emitir()
}

export function assinarLocalizacao(fn) {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

export function getLocalizacao() {
  return estado
}

/** Começa a rastrear (pede permissão na primeira vez). Idempotente. */
export function iniciarLocalizacao() {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    definir({ status: 'indisponivel' })
    return
  }
  if (watchId !== null) return // já rastreando

  if (estado.status !== 'cache') definir({ status: 'pedindo' })

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const posicao = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        precisao: pos.coords.accuracy,
        em: pos.timestamp,
      }
      try {
        localStorage.setItem(CHAVE, JSON.stringify(posicao))
      } catch {
        /* sem persistência — tudo bem */
      }
      definir({ status: 'ok', posicao })
    },
    (err) => {
      // Mantém a posição em cache, se houver — só marca por que parou.
      const negado =
        err && (err.code === 1 || err.code === err.PERMISSION_DENIED)
      definir({ status: negado ? 'negado' : 'indisponivel' })
      pararLocalizacao()
    },
    { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
  )
}

/** Para de rastrear (economiza bateria). Não apaga a última posição. */
export function pararLocalizacao() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
}

// Se o usuário já autorizou antes, retoma sozinho (sem precisar tocar de novo).
try {
  navigator.permissions
    ?.query({ name: 'geolocation' })
    .then((p) => {
      if (p.state === 'granted') iniciarLocalizacao()
    })
    .catch(() => {})
} catch {
  /* Permissions API ausente — o usuário ativa manualmente */
}
