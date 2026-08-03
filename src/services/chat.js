import { chamar } from './api'

export class ErroChat extends Error {
  constructor(mensagem) {
    super(mensagem)
    this.name = 'ErroChat'
  }
}

/**
 * Conversa com o roteirista IA (Gemini via Apps Script).
 * Envia o histórico (só autor + texto, limitado) e devolve a resposta.
 */
export async function conversar(mensagens, { signal } = {}) {
  const enxuto = mensagens
    .slice(-16)
    .map((m) => ({ autor: m.autor, texto: m.texto }))

  // A conversa enviada ao Gemini deve começar com o usuário — descarta
  // mensagens da IA no início (ex.: a saudação fixa).
  while (enxuto.length && enxuto[0].autor === 'ia') enxuto.shift()

  try {
    const { texto } = await chamar('chat', { mensagens: enxuto }, { signal })
    return (
      (texto || '').trim() ||
      'Não consegui pensar em nada agora — tenta perguntar de outro jeito?'
    )
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro
    // Dica quando o Apps Script ainda não foi reimplantado com a ação 'chat'.
    if (/desconhecida/i.test(erro.message || '')) {
      throw new ErroChat(
        'O chat precisa da versão nova do Apps Script. Reimplante o Apps Script (nova versão) e tente de novo.',
      )
    }
    throw new ErroChat(erro.message || 'Falha ao falar com o roteirista.')
  }
}
