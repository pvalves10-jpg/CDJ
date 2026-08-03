/**
 * Pilha de camadas para a tecla Escape.
 *
 * Só a camada do TOPO (a última aberta) responde ao Esc. Assim, ao abrir um
 * visualizador de imagem por cima de um modal, apertar Esc fecha só o
 * visualizador e volta ao modal — em vez de fechar os dois de uma vez.
 */
const pilha = []
let ligado = false

function aoTeclar(evento) {
  if (evento.key !== 'Escape') return
  const topo = pilha[pilha.length - 1]
  if (topo) {
    evento.stopPropagation()
    topo()
  }
}

function garantirListener() {
  if (ligado || typeof document === 'undefined') return
  document.addEventListener('keydown', aoTeclar)
  ligado = true
}

/** Empilha um handler de fechar. Retorna a função para removê-lo. */
export function empilharCamada(handler) {
  garantirListener()
  pilha.push(handler)
  return () => {
    const i = pilha.lastIndexOf(handler)
    if (i !== -1) pilha.splice(i, 1)
  }
}
