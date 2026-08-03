import { USUARIOS } from './constantes'

/** Diferenças abaixo de 1 centavo são ruído de ponto flutuante, não dívida. */
const TOLERANCIA = 0.005

function arredondar(valor) {
  return Math.round((Number(valor) || 0) * 100) / 100
}

/**
 * Divisão 50/50 sobre todas as despesas.
 *
 * Cada despesa é adiantada integralmente por um dos dois; a cota justa de cada
 * pessoa é metade do total gasto. O saldo de alguém é `pago - cota`:
 * positivo = tem a receber, negativo = deve.
 *
 * Acertos já feitos (`{ de, para, valor }`) entram como pagamento: quem pagou
 * o Pix reduz sua dívida, quem recebeu reduz seu crédito.
 */
export function calcularSaldo(despesas = [], acertos = []) {
  const pago = Object.fromEntries(USUARIOS.map((u) => [u.id, 0]))
  const porCategoria = {}

  let total = 0
  for (const despesa of despesas) {
    const valor = Number(despesa?.valor) || 0
    if (valor <= 0) continue
    total += valor
    if (despesa.pagador in pago) pago[despesa.pagador] += valor
    const cat = despesa.categoria || 'outro'
    porCategoria[cat] = (porCategoria[cat] || 0) + valor
  }

  const cota = total / 2

  const saldo = Object.fromEntries(
    USUARIOS.map((u) => [u.id, pago[u.id] - cota]),
  )

  // Um Pix de A para B quita parte do que A devia.
  let totalAcertos = 0
  for (const acerto of acertos) {
    const valor = Number(acerto?.valor) || 0
    if (valor <= 0) continue
    if (!(acerto.de in saldo) || !(acerto.para in saldo)) continue
    saldo[acerto.de] += valor
    saldo[acerto.para] -= valor
    totalAcertos += valor
  }

  const [a, b] = USUARIOS.map((u) => u.id)
  const diferenca = arredondar(Math.abs(saldo[a]))
  const quites = diferenca < TOLERANCIA

  // Quem tem saldo negativo deve; o outro recebe.
  const devedor = quites ? null : saldo[a] < 0 ? a : b
  const credor = quites ? null : saldo[a] < 0 ? b : a

  return {
    total: arredondar(total),
    cota: arredondar(cota),
    totalAcertos: arredondar(totalAcertos),
    pago: Object.fromEntries(
      Object.entries(pago).map(([id, v]) => [id, arredondar(v)]),
    ),
    saldo: Object.fromEntries(
      Object.entries(saldo).map(([id, v]) => [id, arredondar(v)]),
    ),
    porCategoria: Object.fromEntries(
      Object.entries(porCategoria).map(([id, v]) => [id, arredondar(v)]),
    ),
    quites,
    devedor,
    credor,
    /** Quanto o devedor precisa mandar por Pix para zerar. */
    valor: quites ? 0 : diferenca,
    quantidade: despesas.length,
  }
}

/** Texto pronto para colar no WhatsApp. */
export function textoDoSaldo(resumo, formatarMoeda, nomeDe) {
  const linhas = [
    '🏔️ *CDJ — Campos do Jordão*',
    '',
    `Total gasto: ${formatarMoeda(resumo.total)}`,
  ]

  for (const [id, valor] of Object.entries(resumo.pago)) {
    linhas.push(`${nomeDe(id)} pagou: ${formatarMoeda(valor)}`)
  }

  if (resumo.totalAcertos > 0) {
    linhas.push(`Já acertado por Pix: ${formatarMoeda(resumo.totalAcertos)}`)
  }

  linhas.push('')
  linhas.push(
    resumo.quites
      ? '✅ Estamos quites!'
      : `👉 *${nomeDe(resumo.devedor)} deve ${formatarMoeda(resumo.valor)} a ${nomeDe(resumo.credor)}*`,
  )

  return linhas.join('\n')
}
