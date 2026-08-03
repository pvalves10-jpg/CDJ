import { COORD_CJ } from '../utils/guia'

/**
 * Previsão do tempo para Campos do Jordão, via Open-Meteo.
 *
 * Open-Meteo é gratuito, não exige chave e permite chamada direta do navegador
 * (CORS liberado). Substitui o Climatempo, que não tem API pública gratuita e
 * só entrega o site renderizado por JS.
 *
 * Cache no localStorage por dia: se a última busca foi hoje, reusa; senão,
 * busca de novo — assim a previsão "atualiza a cada dia" sem pesar.
 */

const CACHE_KEY = 'cdj:clima'

/** Código WMO → emoji + rótulo curto. */
export function descreverTempo(code) {
  const t = {
    0: ['☀️', 'Céu limpo'],
    1: ['🌤️', 'Predomínio de sol'],
    2: ['⛅', 'Parcialmente nublado'],
    3: ['☁️', 'Nublado'],
    45: ['🌫️', 'Névoa'],
    48: ['🌫️', 'Névoa'],
    51: ['🌦️', 'Garoa fraca'],
    53: ['🌦️', 'Garoa'],
    55: ['🌦️', 'Garoa forte'],
    56: ['🌧️', 'Garoa congelante'],
    57: ['🌧️', 'Garoa congelante'],
    61: ['🌧️', 'Chuva fraca'],
    63: ['🌧️', 'Chuva'],
    65: ['🌧️', 'Chuva forte'],
    66: ['🌧️', 'Chuva congelante'],
    67: ['🌧️', 'Chuva congelante'],
    71: ['❄️', 'Neve fraca'],
    73: ['❄️', 'Neve'],
    75: ['❄️', 'Neve forte'],
    77: ['🌨️', 'Grãos de neve'],
    80: ['🌦️', 'Pancadas de chuva'],
    81: ['🌦️', 'Pancadas de chuva'],
    82: ['🌧️', 'Pancadas fortes'],
    85: ['🌨️', 'Pancadas de neve'],
    86: ['🌨️', 'Pancadas de neve'],
    95: ['⛈️', 'Trovoada'],
    96: ['⛈️', 'Trovoada com granizo'],
    99: ['⛈️', 'Trovoada com granizo'],
  }
  const [emoji, label] = t[code] ?? ['🌡️', '—']
  return { emoji, label }
}

function hoje() {
  // Data local no formato YYYY-MM-DD (sem fuso, para comparar "é o mesmo dia").
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

function lerCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (c && c.fetchedAt === hoje() && c.dados) return c.dados
  } catch {
    /* cache inválido */
  }
  return null
}

function montarMapa(daily) {
  const mapa = {}
  const tempos = daily?.time ?? []
  tempos.forEach((data, i) => {
    const code = daily.weather_code?.[i]
    const tmax = daily.temperature_2m_max?.[i]
    const tmin = daily.temperature_2m_min?.[i]
    mapa[data] = {
      data,
      tmax: Number.isFinite(tmax) ? Math.round(tmax) : null,
      tmin: Number.isFinite(tmin) ? Math.round(tmin) : null,
      chuva: daily.precipitation_probability_max?.[i] ?? null,
      code,
      ...descreverTempo(code),
    }
  })
  return mapa
}

/**
 * Busca a previsão para o intervalo [dataInicio, dataFim] (YYYY-MM-DD).
 * Devolve um objeto indexado por data. Nunca lança: em falha, devolve {}.
 */
export async function buscarPrevisao(dataInicio, dataFim, { signal } = {}) {
  const cache = lerCache()
  if (cache) return cache

  const { lat, lon } = COORD_CJ
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
    `&timezone=America%2FSao_Paulo&start_date=${dataInicio}&end_date=${dataFim}`

  try {
    const resposta = await fetch(url, { signal })
    if (!resposta.ok) return {}
    const dados = await resposta.json()
    const mapa = montarMapa(dados.daily)
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ fetchedAt: hoje(), dados: mapa }),
      )
    } catch {
      /* quota cheia — segue sem cache */
    }
    return mapa
  } catch {
    return {}
  }
}
