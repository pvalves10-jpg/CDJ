import { acharCategoria, nomeUsuario, primeiroNome } from './constantes'
import { formatarMoeda } from './formatters'
import { statusViagem, ROTEIRO } from './guia'

function ddmm(iso) {
  const [, m, d] = String(iso || '').split('-')
  return m && d ? `${d}/${m}` : (iso || '—')
}

/**
 * Monta um bloco de contexto com os DADOS ATUAIS do app (gastos, saldo,
 * roteiro) para injetar na conversa com o Gemini. Assim o roteirista IA
 * consegue responder "qual foi o maior gasto?", "quanto já gastamos?",
 * "quanto a Louise me deve?", etc. — em vez de dizer que não tem acesso.
 *
 * É enviado junto da pergunta do usuário (não aparece na tela do chat).
 */
export function montarContextoViagem(
  { despesas = [], saldo, categorias = [], guia } = {},
  hoje,
) {
  const L = []
  const status = statusViagem(hoje)
  L.push(`Data de hoje: ${hoje || '(atual)'}. ${status.texto}`)
  L.push(
    'Casal: Paulo Victor e Louise. Toda despesa é dividida 50/50 (quem paga adianta o total; o outro deve metade).',
  )

  if (!despesas.length) {
    L.push('Ainda não há nenhuma despesa lançada no app.')
  } else if (saldo) {
    L.push(`Total gasto até agora: ${formatarMoeda(saldo.total)} em ${despesas.length} despesa(s).`)
    for (const [id, v] of Object.entries(saldo.pago || {})) {
      L.push(`- ${nomeUsuario(id)} pagou ${formatarMoeda(v)}.`)
    }
    L.push(
      saldo.quites
        ? '- Acerto: estão quites.'
        : `- Acerto: ${nomeUsuario(saldo.devedor)} deve ${formatarMoeda(saldo.valor)} a ${nomeUsuario(saldo.credor)}.`,
    )

    const maior = despesas.reduce(
      (a, b) => ((Number(b.valor) || 0) > (Number(a.valor) || 0) ? b : a),
      despesas[0],
    )
    L.push(
      `- Maior gasto: "${maior.local || 'sem nome'}" ${formatarMoeda(maior.valor)} (${acharCategoria(maior.categoria, categorias).label}, ${ddmm(maior.data)}, pago por ${primeiroNome(maior.pagador)}).`,
    )

    const cats = Object.entries(saldo.porCategoria || {}).sort((a, b) => b[1] - a[1])
    if (cats.length) {
      L.push(
        '- Por categoria: ' +
          cats
            .map(([c, v]) => `${acharCategoria(c, categorias).label} ${formatarMoeda(v)}`)
            .join('; ') +
          '.',
      )
    }

    L.push('Despesas (mais recentes primeiro):')
    despesas.slice(0, 40).forEach((d, i) => {
      L.push(
        `${i + 1}. ${ddmm(d.data)} · ${d.local || 'sem nome'} · ${formatarMoeda(d.valor)} · ${acharCategoria(d.categoria, categorias).label} · pago por ${primeiroNome(d.pagador)}`,
      )
    })
  }

  // Progresso do roteiro (quantas paradas já foram marcadas como visitadas).
  const feitas = guia?.roteiro ? Object.keys(guia.roteiro).length : 0
  const totalParadas = ROTEIRO.reduce((n, dia) => n + dia.paradas.length, 0)
  L.push(`Roteiro: ${feitas} de ${totalParadas} paradas marcadas como visitadas.`)

  return [
    '[DADOS ATUAIS DO APP "Nossa Jornada" — fornecidos automaticamente para você usar nas respostas. Você TEM acesso a estes gastos, ao saldo e ao roteiro; NUNCA diga que não tem acesso a eles. Não copie este bloco na resposta — use-o só como base e responda direto, no seu tom habitual.]',
    ...L,
    '[fim dos dados do app]',
  ].join('\n')
}
