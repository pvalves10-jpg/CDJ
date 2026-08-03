const MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const DIA_MES = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
})

const DIA_MES_ANO = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

/** 120 → "R$ 120,00" */
export function formatarMoeda(valor) {
  return MOEDA.format(Number(valor) || 0)
}

/** 120 → "120,00" (sem símbolo, para inputs) */
export function formatarNumero(valor) {
  return (Number(valor) || 0).toFixed(2).replace('.', ',')
}

/**
 * Interpreta "YYYY-MM-DD" como data local, não UTC.
 * `new Date('2026-07-15')` seria meia-noite UTC e viraria 14/07 no Brasil.
 */
export function paraData(iso) {
  if (!iso) return null
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-').map(Number)
  if (!ano || !mes || !dia) return null
  const d = new Date(ano, mes - 1, dia)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "2026-07-15" → "15 de julho de 2026" */
export function formatarData(iso) {
  const d = paraData(iso)
  return d ? DIA_MES_ANO.format(d) : '—'
}

/** "2026-07-15" → "15 de jul." */
export function formatarDataCurta(iso) {
  const d = paraData(iso)
  return d ? DIA_MES.format(d) : '—'
}

/** Data de hoje em "YYYY-MM-DD", no fuso local. */
export function hojeISO() {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

/**
 * Converte texto digitado ("1.234,56", "1234.56", "R$ 89,90") em número.
 * Retorna NaN quando não dá para interpretar.
 */
export function parseValor(texto) {
  if (typeof texto === 'number') return texto
  const limpo = String(texto ?? '')
    .replace(/[^\d,.-]/g, '')
    .trim()
  if (!limpo) return NaN

  const temVirgula = limpo.includes(',')
  const temPonto = limpo.includes('.')

  let normalizado = limpo
  if (temVirgula && temPonto) {
    // O último separador que aparece é o decimal.
    normalizado =
      limpo.lastIndexOf(',') > limpo.lastIndexOf('.')
        ? limpo.replace(/\./g, '').replace(',', '.')
        : limpo.replace(/,/g, '')
  } else if (temVirgula) {
    normalizado = limpo.replace(',', '.')
  }

  return Number.parseFloat(normalizado)
}

/** Nome de arquivo seguro para o comprovante: "2026-07-15_restaurante-boa-mesa.jpg" */
export function nomeComprovante(data, local, arquivoOriginal) {
  const extensao = (arquivoOriginal?.name?.match(/\.[a-z0-9]+$/i)?.[0] ?? '.jpg')
    .toLowerCase()
  const slug = String(local || 'comprovante')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40)
  return `${data || hojeISO()}_${slug || 'comprovante'}${extensao}`
}
