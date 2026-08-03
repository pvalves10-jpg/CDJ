/** Distância e estimativa de corrida entre dois pontos. Tudo aproximado. */

function rad(graus) {
  return (graus * Math.PI) / 180
}

/** Distância em linha reta (Haversine), em km. */
export function distanciaKm(a, b) {
  if (!a || !b) return null
  const R = 6371
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

// O trajeto de carro é maior que a linha reta — mais ainda numa cidade de serra.
const FATOR_RUA = 1.4
const VEL_MEDIA_KMH = 25

/**
 * Estimativa APROXIMADA de uma corrida a partir da distância em linha reta.
 * Não é o preço real (que depende de categoria, demanda e horário) — serve só
 * para ter uma ideia. O valor exato aparece dentro do app ao pedir.
 */
export function estimarCorrida(kmReto) {
  if (kmReto == null) return null
  const km = kmReto * FATOR_RUA
  const minutos = Math.max(3, Math.round((km / VEL_MEDIA_KMH) * 60))
  const base = 6
  const porKm = 2.6
  const minimo = 8
  const centro = Math.max(minimo, base + km * porKm)
  return {
    km,
    minutos,
    precoMin: Math.max(minimo, Math.round(centro * 0.85)),
    precoMax: Math.round(centro * 1.25),
  }
}

/** "850 m" ou "3,2 km". */
export function formatarKm(km) {
  if (km == null) return ''
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1).replace('.', ',')} km`
}
