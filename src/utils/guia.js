/**
 * Conteúdo do Guia Premium da viagem (Louise & Paulo Victor — Campos do Jordão,
 * 04 a 07/08). É dado FIXO da viagem, por isso mora aqui no código.
 *
 * O que é progresso (o que já foi feito / fotografado) NÃO fica aqui — fica no
 * `despesas.json` no Drive (campo `guia`), para sincronizar entre os dois
 * celulares. Ver useDespesas / drive.js.
 */

/** Campos do Jordão — usado para a previsão do tempo. */
export const COORD_CJ = { lat: -22.7392, lon: -45.5915 }

const SUFIXO_LOCAL = ', Campos do Jordão, SP'

/** Link de busca no Google Maps (não precisa de coordenadas exatas). */
export function linkMaps(local) {
  const q = encodeURIComponent(`${local}${SUFIXO_LOCAL}`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

/** Link de navegação no Waze. */
export function linkWaze(local) {
  const q = encodeURIComponent(`${local}${SUFIXO_LOCAL}`)
  return `https://waze.com/ul?q=${q}&navigate=yes`
}

/**
 * Roteiro dia a dia. Cada parada com `local` ganha botões de Maps/Waze; sem
 * `local` (descanso, pôr do sol, almoço) é só um item da agenda.
 */
export const ROTEIRO = [
  {
    id: 'd1',
    data: '2026-08-04',
    rotulo: 'Dia 1',
    titulo: 'Chegada, Capivari e primeira noite',
    paradas: [
      { id: 'd1-rodoviaria', nome: 'Rodoviária', local: 'Rodoviária de Campos do Jordão' },
      { id: 'd1-portal', nome: 'Portal de Campos', local: 'Portal de Campos do Jordão', obs: 'Fotos icônicas 📸' },
      { id: 'd1-pousada', nome: 'Pousada', local: 'Pousada Café Poesia', obs: 'Check-in' },
      { id: 'd1-nonna', nome: 'Nonna Iza', local: 'Nonna Iza Campos do Jordão', obs: 'Almoço' },
      { id: 'd1-vila', nome: 'Vila Holandesa', local: 'Vila Holandesa Campos do Jordão' },
      { id: 'd1-capivari', nome: 'Capivari', local: 'Vila Capivari Campos do Jordão' },
      { id: 'd1-chocolate', nome: 'Chocolate quente', obs: 'Imperdível ☕' },
      { id: 'd1-royal', nome: 'Royal Trdelnik', local: 'Royal Trdelnik Campos do Jordão' },
      { id: 'd1-metaverso', nome: 'Metaverso', local: 'Metaverso Campos do Jordão' },
      { id: 'd1-teleferico', nome: 'Teleférico', local: 'Teleférico Campos do Jordão' },
      { id: 'd1-treno', nome: 'Trenó', local: 'Trenó da Montanha Campos do Jordão' },
      { id: 'd1-pastel', nome: 'Pastel do Maluf', local: 'Pastel do Maluf Campos do Jordão', obs: 'Imperdível 🥟' },
    ],
  },
  {
    id: 'd2',
    data: '2026-08-05',
    rotulo: 'Dia 2',
    titulo: 'Amantikir, vinho e fondue',
    paradas: [
      { id: 'd2-amantikir', nome: 'Amantikir', local: 'Amantikir Parque Campos do Jordão', obs: 'De manhã' },
      { id: 'd2-raiz', nome: 'Raiz de Campos', local: 'Raiz de Campos do Jordão', obs: 'Aceita VR' },
      { id: 'd2-sanssouci', nome: 'Sans Souci', local: 'Bairro Sans Souci Campos do Jordão' },
      { id: 'd2-descanso', nome: 'Descanso', obs: 'Descanso na pousada' },
      { id: 'd2-fondue', nome: 'Fondue (Krokodilo)', local: 'Krokodilo Campos do Jordão', obs: 'Imperdível 🫕' },
    ],
  },
  {
    id: 'd3',
    data: '2026-08-06',
    rotulo: 'Dia 3',
    titulo: 'Itapeva, Mão Gigante e pôr do sol',
    paradas: [
      { id: 'd3-itapeva', nome: 'Pico do Itapeva', local: 'Pico do Itapeva Campos do Jordão', obs: 'Imperdível ⛰️' },
      { id: 'd3-mao', nome: 'Mão Gigante', local: 'Mão Gigante Campos do Jordão' },
      { id: 'd3-horto', nome: 'Horto Florestal', local: 'Horto Florestal Campos do Jordão' },
      { id: 'd3-pordosol', nome: 'Pôr do sol', obs: 'Pôr do sol na Mão Gigante 🌅' },
      { id: 'd3-jantar', nome: 'Jantar no Capivari', local: 'Vila Capivari Campos do Jordão' },
    ],
  },
  {
    id: 'd4',
    data: '2026-08-07',
    rotulo: 'Dia 4',
    titulo: 'Turundu, Lagoinha e retorno',
    paradas: [
      { id: 'd4-turundu', nome: 'Turundu', local: 'Turundu Campos do Jordão', obs: 'Café da manhã' },
      { id: 'd4-lagoinha', nome: 'Lagoinha', local: 'Lagoinha Campos do Jordão' },
      { id: 'd4-almoco', nome: 'Almoço', obs: 'Último almoço' },
      { id: 'd4-retorno', nome: 'Retorno', local: 'Rodoviária de Campos do Jordão', obs: 'Volta pra casa' },
    ],
  },
]

/**
 * "Fotos que vocês não podem deixar de tirar" — 12 pontos.
 * O check é automático: marca quando vocês adicionam foto(s) do ponto (que sobem
 * para a pasta FOTOS no Drive).
 */
export const FOTOS_SPOTS = [
  { id: 'portal', nome: 'Portal de Campos', local: 'Portal de Campos do Jordão' },
  { id: 'vila_holandesa', nome: 'Vila Holandesa', local: 'Vila Holandesa Campos do Jordão' },
  { id: 'amantikir', nome: 'Amantikir', local: 'Amantikir Parque Campos do Jordão' },
  { id: 'capivari_noite', nome: 'Capivari à noite', local: 'Vila Capivari Campos do Jordão' },
  { id: 'teleferico', nome: 'Teleférico', local: 'Teleférico Campos do Jordão' },
  { id: 'treno', nome: 'Trenó', local: 'Trenó da Montanha Campos do Jordão' },
  { id: 'itapeva', nome: 'Pico do Itapeva', local: 'Pico do Itapeva Campos do Jordão' },
  { id: 'mao_gigante', nome: 'Mão Gigante no pôr do sol', local: 'Mão Gigante Campos do Jordão' },
  { id: 'pousada', nome: 'Pousada Café Poesia', local: 'Pousada Café Poesia Campos do Jordão' },
  { id: 'royal', nome: 'Royal Trdelnik', local: 'Royal Trdelnik Campos do Jordão' },
  { id: 'fondue', nome: 'Fondue', local: 'Krokodilo Campos do Jordão' },
  { id: 'pastel', nome: 'Pastel do Maluf', local: 'Pastel do Maluf Campos do Jordão' },
]

/** "Imperdíveis" — 6 experiências para riscar. */
export const EXPERIENCIAS = [
  { id: 'choc', nome: 'Chocolate quente', emoji: '☕' },
  { id: 'pastel', nome: 'Pastel do Maluf', emoji: '🥟' },
  { id: 'fondue', nome: 'Fondue', emoji: '🫕' },
  { id: 'amantikir', nome: 'Amantikir', emoji: '🌳' },
  { id: 'capivari', nome: 'Capivari à noite', emoji: '🌃' },
  { id: 'itapeva', nome: 'Pico do Itapeva', emoji: '⛰️' },
]
