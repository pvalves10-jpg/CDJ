/**
 * Renderizador de Markdown enxuto para as respostas do Gemini.
 *
 * O modelo responde em markdown (**negrito**, listas, títulos). Sem isto, os
 * `**` e `*` apareciam crus na tela. Cobre o que o chat usa — negrito, itálico,
 * listas com marcador/numeradas, títulos e links — sem dependência externa e
 * montando elementos React (nada de innerHTML, sem risco de XSS).
 */

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s)]+)/g

function renderInline(texto) {
  const partes = []
  let ultimo = 0
  let m
  let k = 0
  INLINE.lastIndex = 0
  while ((m = INLINE.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index))
    const tok = m[0]
    if (tok.startsWith('**') || tok.startsWith('__')) {
      partes.push(<strong key={k++}>{tok.slice(2, -2)}</strong>)
    } else if (tok.startsWith('[')) {
      const mm = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/.exec(tok)
      partes.push(
        <a
          key={k++}
          href={mm[2]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-blue-600 underline"
        >
          {mm[1]}
        </a>,
      )
    } else if (tok.startsWith('http')) {
      partes.push(
        <a
          key={k++}
          href={tok}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline"
        >
          {tok}
        </a>,
      )
    } else {
      // *itálico* ou _itálico_
      partes.push(<em key={k++}>{tok.slice(1, -1)}</em>)
    }
    ultimo = m.index + tok.length
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo))
  return partes
}

const MARCADOR = /^\s*[-*•]\s+/
const NUMERADA = /^\s*\d+[.)]\s+/
const TITULO = /^\s*#{1,6}\s+/

export default function Markdown({ texto }) {
  const linhas = String(texto ?? '').split('\n')
  const blocos = []
  let i = 0

  while (i < linhas.length) {
    const linha = linhas[i]

    if (MARCADOR.test(linha)) {
      const itens = []
      while (i < linhas.length && MARCADOR.test(linhas[i])) {
        itens.push(linhas[i].replace(MARCADOR, ''))
        i++
      }
      blocos.push(
        <ul key={blocos.length} className="list-disc space-y-1 pl-5">
          {itens.map((t, j) => (
            <li key={j}>{renderInline(t)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (NUMERADA.test(linha)) {
      const itens = []
      while (i < linhas.length && NUMERADA.test(linhas[i])) {
        itens.push(linhas[i].replace(NUMERADA, ''))
        i++
      }
      blocos.push(
        <ol key={blocos.length} className="list-decimal space-y-1 pl-5">
          {itens.map((t, j) => (
            <li key={j}>{renderInline(t)}</li>
          ))}
        </ol>,
      )
      continue
    }

    if (TITULO.test(linha)) {
      blocos.push(
        <p key={blocos.length} className="font-bold text-pinheiro-900">
          {renderInline(linha.replace(TITULO, ''))}
        </p>,
      )
      i++
      continue
    }

    if (linha.trim() === '') {
      i++
      continue
    }

    // Parágrafo: junta linhas seguidas (com quebra) até uma linha em branco.
    const par = [linha]
    i++
    while (
      i < linhas.length &&
      linhas[i].trim() !== '' &&
      !MARCADOR.test(linhas[i]) &&
      !NUMERADA.test(linhas[i]) &&
      !TITULO.test(linhas[i])
    ) {
      par.push(linhas[i])
      i++
    }
    blocos.push(
      <p key={blocos.length}>
        {par.map((t, j) => (
          <span key={j}>
            {renderInline(t)}
            {j < par.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>,
    )
  }

  return <div className="space-y-2">{blocos}</div>
}
