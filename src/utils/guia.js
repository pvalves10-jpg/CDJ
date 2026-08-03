import { hojeISO } from './formatters'
import portalFoto from '../assets/roteiro/portal.jpg'
import vilaHolandesaFoto from '../assets/roteiro/vila_holandesa.jpg'
import capivariFoto from '../assets/roteiro/capivari.jpg'
import royalFoto from '../assets/roteiro/royal_trdelnik.jpg'
import telefericoFoto from '../assets/roteiro/teleferico.jpg'
import amantikirFoto from '../assets/roteiro/amantikir.jpg'
import itapevaFoto from '../assets/roteiro/itapeva.jpg'
import hortoFoto from '../assets/roteiro/horto.jpg'

/**
 * Conteúdo do Guia Premium da viagem (Louise & Paulo Victor — Campos do Jordão,
 * 04 a 07/08). É dado FIXO da viagem, por isso mora aqui no código.
 *
 * O que é progresso (o que já foi feito / fotografado) NÃO fica aqui — fica no
 * `despesas.json` no Drive (campo `guia`), para sincronizar entre os dois
 * celulares. Ver useDespesas / drive.js.
 *
 * As descrições e fotos dos locais (LOCAIS) foram pesquisadas na web; as fotos
 * são de licença livre (Wikimedia Commons), embutidas para funcionar offline.
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
 * Coordenadas (lat, lon) dos destinos, para chamar corrida (Uber/99).
 * Geocodificadas e conferidas uma a uma (OpenStreetMap/Google/Wikipédia),
 * todas dentro dos limites de Campos do Jordão. A chave é o MESMO texto `local`
 * usado nas paradas do ROTEIRO — se um local não estiver aqui, os botões de
 * corrida simplesmente não aparecem para ele.
 */
export const COORD_DESTINO = {
  'Rodoviária de Campos do Jordão': { lat: -22.7247748, lon: -45.5803492 },
  'Portal de Campos do Jordão': { lat: -22.755757, lon: -45.610118 },
  'Pousada Café Poesia': { lat: -22.7265, lon: -45.562 },
  'Nonna Iza Campos do Jordão': { lat: -22.71745, lon: -45.56843 },
  'Vila Holandesa Campos do Jordão': { lat: -22.7228257, lon: -45.563468 },
  'Vila Capivari Campos do Jordão': { lat: -22.719, lon: -45.5685 },
  'Royal Trdelnik Campos do Jordão': { lat: -22.7172, lon: -45.5668 },
  'Metaverso Campos do Jordão': { lat: -22.7171, lon: -45.5675 },
  'Teleférico Campos do Jordão': { lat: -22.7171461, lon: -45.5651785 },
  'Trenó da Montanha Campos do Jordão': { lat: -22.7133037, lon: -45.566185 },
  'Pastel do Maluf Campos do Jordão': { lat: -22.7191844, lon: -45.5665702 },
  'Amantikir Parque Campos do Jordão': { lat: -22.7837241, lon: -45.6076094 },
  'Raiz de Campos do Jordão': { lat: -22.7182705, lon: -45.5651532 },
  'Bairro Sans Souci Campos do Jordão': { lat: -22.7259299, lon: -45.5798123 },
  'Krokodilo Campos do Jordão': { lat: -22.730657, lon: -45.569987 },
  'Pico do Itapeva Campos do Jordão': { lat: -22.7669812, lon: -45.522482 },
  'Mão Gigante Campos do Jordão': { lat: -22.7643757, lon: -45.5408285 },
  'Horto Florestal Campos do Jordão': { lat: -22.6840583, lon: -45.4549157 },
  'Turundu Campos do Jordão': { lat: -22.766556, lon: -45.603448 },
  'Lagoinha Campos do Jordão': { lat: -22.7088549, lon: -45.5476912 },
}

/** Há coordenada para chamar corrida até este local? */
export function temCoordenada(local) {
  return Boolean(COORD_DESTINO[local])
}

/** Endereço legível do destino (rótulo — a corrida é fixada pela coordenada). */
export function enderecoDestino(local) {
  return local.includes('Campos do Jordão')
    ? `${local} - SP`
    : `${local}${SUFIXO_LOCAL}`
}

/**
 * Universal link do Uber: abre o app com DESTINO fixado nas coordenadas do
 * local. Se `origem` (a localização atual do usuário) for informada, fixa a
 * PARTIDA nela; senão, usa `pickup=my_location` (o próprio app pega o GPS). O
 * app então mostra a estimativa de preço, faltando só confirmar. Retorna null
 * se não houver coordenada. (Dispare a partir de um clique para o iOS honrar.)
 */
export function linkUber(local, origem) {
  const c = COORD_DESTINO[local]
  if (!c) return null
  const nome = encodeURIComponent(local)
  const endereco = encodeURIComponent(enderecoDestino(local))
  const partida =
    origem && Number.isFinite(origem.lat) && Number.isFinite(origem.lon)
      ? `pickup[latitude]=${origem.lat}&pickup[longitude]=${origem.lon}` +
        '&pickup[nickname]=Minha%20localiza%C3%A7%C3%A3o'
      : 'pickup=my_location'
  return (
    `https://m.uber.com/ul/?action=setPickup&${partida}` +
    `&dropoff[latitude]=${c.lat}&dropoff[longitude]=${c.lon}` +
    `&dropoff[nickname]=${nome}&dropoff[formatted_address]=${endereco}`
  )
}

/**
 * Roteiro dia a dia. Cada parada com `local` ganha botões de Maps/Waze; com
 * `info` ganha o cartão "sobre o lugar" (ver LOCAIS).
 */
export const ROTEIRO = [
  {
    id: 'd1',
    data: '2026-08-04',
    rotulo: 'Dia 1',
    titulo: 'Chegada, Capivari e primeira noite',
    paradas: [
      { id: 'd1-rodoviaria', nome: 'Rodoviária', local: 'Rodoviária de Campos do Jordão' },
      { id: 'd1-portal', nome: 'Portal de Campos', local: 'Portal de Campos do Jordão', obs: 'Fotos icônicas 📸', info: 'portal' },
      { id: 'd1-pousada', nome: 'Pousada', local: 'Pousada Café Poesia', obs: 'Check-in', info: 'cafe_poesia' },
      { id: 'd1-nonna', nome: 'Nonna Iza', local: 'Nonna Iza Campos do Jordão', obs: 'Almoço', info: 'nonna_iza' },
      { id: 'd1-vila', nome: 'Vila Holandesa', local: 'Vila Holandesa Campos do Jordão', info: 'vila_holandesa' },
      { id: 'd1-capivari', nome: 'Capivari', local: 'Vila Capivari Campos do Jordão', info: 'capivari' },
      { id: 'd1-chocolate', nome: 'Chocolate quente', obs: 'Imperdível ☕' },
      { id: 'd1-royal', nome: 'Royal Trdelnik', local: 'Royal Trdelnik Campos do Jordão', info: 'royal_trdelnik' },
      { id: 'd1-metaverso', nome: 'Metaverso', local: 'Metaverso Campos do Jordão', info: 'metaverso' },
      { id: 'd1-teleferico', nome: 'Teleférico', local: 'Teleférico Campos do Jordão', info: 'teleferico' },
      { id: 'd1-treno', nome: 'Trenó', local: 'Trenó da Montanha Campos do Jordão', info: 'treno' },
      { id: 'd1-pastel', nome: 'Pastel do Maluf', local: 'Pastel do Maluf Campos do Jordão', obs: 'Imperdível 🥟', info: 'pastel_maluf' },
    ],
  },
  {
    id: 'd2',
    data: '2026-08-05',
    rotulo: 'Dia 2',
    titulo: 'Amantikir, vinho e fondue',
    paradas: [
      { id: 'd2-amantikir', nome: 'Amantikir', local: 'Amantikir Parque Campos do Jordão', obs: 'De manhã', info: 'amantikir' },
      { id: 'd2-raiz', nome: 'Raiz de Campos', local: 'Raiz de Campos do Jordão', obs: 'Aceita VR', info: 'raiz_campos' },
      { id: 'd2-sanssouci', nome: 'Sans Souci', local: 'Bairro Sans Souci Campos do Jordão', info: 'sans_souci' },
      { id: 'd2-descanso', nome: 'Descanso', obs: 'Descanso na pousada' },
      { id: 'd2-fondue', nome: 'Fondue (Krokodilo)', local: 'Krokodilo Campos do Jordão', obs: 'Imperdível 🫕', info: 'krokodilo' },
    ],
  },
  {
    id: 'd3',
    data: '2026-08-06',
    rotulo: 'Dia 3',
    titulo: 'Itapeva, Mão Gigante e pôr do sol',
    paradas: [
      { id: 'd3-itapeva', nome: 'Pico do Itapeva', local: 'Pico do Itapeva Campos do Jordão', obs: 'Imperdível ⛰️', info: 'itapeva' },
      { id: 'd3-mao', nome: 'Mão Gigante', local: 'Mão Gigante Campos do Jordão', info: 'mao_gigante' },
      { id: 'd3-horto', nome: 'Horto Florestal', local: 'Horto Florestal Campos do Jordão', info: 'horto' },
      { id: 'd3-pordosol', nome: 'Pôr do sol', obs: 'Pôr do sol na Mão Gigante 🌅' },
      { id: 'd3-jantar', nome: 'Jantar no Capivari', local: 'Vila Capivari Campos do Jordão', info: 'capivari' },
    ],
  },
  {
    id: 'd4',
    data: '2026-08-07',
    rotulo: 'Dia 4',
    titulo: 'Turundu, Lagoinha e retorno',
    paradas: [
      { id: 'd4-turundu', nome: 'Turundu', local: 'Turundu Campos do Jordão', obs: 'Café da manhã', info: 'turundu' },
      { id: 'd4-lagoinha', nome: 'Lagoinha', local: 'Lagoinha Campos do Jordão', info: 'lagoinha' },
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

/**
 * Informações dos locais (pesquisadas na web). `foto` é uma imagem de licença
 * livre embutida (ou null quando não há uma confiável).
 */
export const LOCAIS = {
  portal: {
    foto: portalFoto,
    resumo: `Pórtico de entrada da cidade, na rodovia SP-123, inaugurado em 1986 no estilo enxaimel que imita a arquitetura dos alpes suíços. É um dos cartões-postais mais fotografados da "cidade mais alta do Brasil", cercado por canteiros floridos e com um termômetro de rua ao lado.`,
    dica: `Visita gratuita e rápida — pare ao chegar para fotografar. A luz do fim da tarde rende as melhores fotos; no inverno, confira o termômetro de rua ao lado.`,
  },
  cafe_poesia: {
    foto: null,
    resumo: `Pousada aconchegante, a primeira da região construída em containers adaptados, na Vila Inglesa (~800 m do centro e de Capivari). Quartos superiores com lareira e hidromassagem, pet-friendly, ótimo café da manhã e um charmoso café da tarde (nota 8,9 no Booking).`,
    dica: `Reserve com antecedência no inverno e avise o horário de chegada por WhatsApp. Escolha um quarto superior com lareira e hidro para curtir o frio.`,
  },
  nonna_iza: {
    foto: null,
    resumo: `Restaurante self-service em frente ao Parque Capivari, conhecido pelo buffet de comida caseira à vontade por um preço acessível — boa pedida para comer bem gastando pouco num dos pontos mais movimentados.`,
    dica: `Buffet à vontade por ~R$ 60/pessoa. Chegue mais cedo no pico do almoço para evitar fila.`,
  },
  vila_holandesa: {
    foto: vilaHolandesaFoto,
    resumo: `Condomínio residencial no Capivari, dos anos 1970, feito para trazer um pedaço da Holanda à serra: telhados pontiagudos, tijolos aparentes e um moinho de vento na entrada. Um dos cenários mais fotografados da cidade.`,
    dica: `É área residencial — não se entra; aproveite a fachada e o moinho de fora. Combine com um passeio a pé pelo centro do Capivari, ao lado. Luz do fim da tarde é a melhor.`,
  },
  capivari: {
    foto: capivariFoto,
    resumo: `Coração turístico de Campos do Jordão, com arquitetura alpina e a maior parte dos restaurantes, cafés e lojas. Ali ficam a Praça e o Parque Capivari e a estação do teleférico do Morro do Elefante. Atmosfera charmosa e vida noturna animada.`,
    dica: `Vá no fim da tarde/noite, quando esfria e tudo se ilumina — melhor hora para fondue e chocolate quente. No inverno, reserve mesa com antecedência.`,
  },
  royal_trdelnik: {
    foto: royalFoto,
    resumo: `Loja no Parque Capivari especializada no trdelník — doce da Europa Central feito de massa em espiral assada sobre brasas, com açúcar e canela. Nasceu em Gramado e serve recheios como Nutella, doce de leite e sorvete.`,
    dica: `Peça o trudel com sorvete ou Nutella e coma na hora, quentinho. Ótimo como sobremesa depois de passear pelo parque.`,
  },
  metaverso: {
    foto: null,
    resumo: `Cine imersivo em 360° no Parque Capivari, com projeção envolvente, som 3D e um simulador de realidade virtual de parapente. Experiência sensorial rápida e diferentona no coração da Vila Capivari.`,
    dica: `Fica no Parque Capivari (abre das 9h às 21h). O combo das duas experiências sai por ~R$ 78/pessoa (ou ~R$ 140 o casal).`,
  },
  teleferico: {
    foto: telefericoFoto,
    resumo: `O teleférico mais antigo do Brasil leva ao topo do Morro do Elefante (~1.800 m), com vista deslumbrante da Vila Capivari e da Serra da Mantiqueira, entre araucárias. Reformado em 2022, tem cadeirinha aberta ou cabine fechada.`,
    dica: `Vá no fim da tarde para o pôr do sol. Quem não curte altura pode subir de carro (menos de 10 min de Capivari); a entrada no parque do topo é gratuita.`,
  },
  treno: {
    foto: null,
    resumo: `Trenó de montanha no alto do Morro do Elefante: um carrinho sobre ~485 m de trilhos que desce a até 40 km/h, com você controlando a velocidade pelos freios. É o mais alto do Brasil, de fabricação alemã, individual ou em dupla.`,
    dica: `Chega-se pelo teleférico ou de carro. ~R$ 50 (individual) / ~R$ 62 (dupla); altura mínima 1,10 m. Vá cedo na alta temporada para evitar fila.`,
  },
  pastel_maluf: {
    foto: null,
    resumo: `Pastelaria tradicional na Vila Capivari, famosa pelo pastel gigante de 32 cm e pelas paredes cobertas de fotos de celebridades ("Pastelão dos Artistas"). O pastel "Maluf" leva carne, salsa, tomate, azeitona e dois ovos.`,
    dica: `Peça o pastel "Maluf" (campeão de vendas). No inverno chega a abrir 24h e fica cheio — fuja dos horários de pico.`,
  },
  amantikir: {
    foto: amantikirFoto,
    resumo: `Complexo de jardins temáticos (26 jardins, 700+ espécies) inspirados em vários lugares do mundo. Destaques: os labirintos (um dos maiores de grama do mundo), lagos, casa na árvore e mirantes. Uma das atrações mais bem avaliadas da cidade.`,
    dica: `Vá pela manhã (abre 9h, entrada até 15h30). Use calçado confortável — tem bastante caminhada em terreno inclinado. Estacionamento gratuito.`,
  },
  raiz_campos: {
    foto: null,
    resumo: `Restaurante de culinária brasileira em Vila Capivari, em casa aconchegante com música ao vivo e área externa. Cardápio variado (fondue, feijoada, grelhados, risoto), boa reputação por comida saborosa e atendimento simpático.`,
    dica: `A sequência de fondue é o destaque para o clima de serra. Prepare-se para couvert artístico (~R$ 15) e faixa média de R$ 60 a R$ 120/pessoa.`,
  },
  sans_souci: {
    foto: null,
    resumo: `Café, bistrô e confeitaria de estilo francês — um dos endereços gastronômicos mais famosos da cidade, na Vila Jaguaribe, pertinho de Capivari. Já foi eleito o melhor café de Campos pela Veja Comer & Beber. Doces artesanais, croissants, quiches e café premiado.`,
    dica: `Não fazem reserva e costuma ter fila — chegue cedo (abre 10h). Ótimo para café da manhã ou da tarde; ~R$ 40 a R$ 60/pessoa.`,
  },
  krokodilo: {
    foto: null,
    resumo: `Restaurante temático famoso pela decoração rústica com enormes esculturas de crocodilos (entra-se pela boca de um deles). Conhecido pelo rodízio de fondue com ótimo preço e por carnes exóticas (javali, jacaré), trutas e pizzas.`,
    dica: `Confira a forma de pagamento antes (tradicionalmente só dinheiro/transferência). Peça o rodízio de fondue e vá mais cedo para evitar fila.`,
  },
  itapeva: {
    foto: itapevaFoto,
    resumo: `Um dos pontos mais altos do Brasil acessíveis de carro (~2.030 m), na divisa com Pindamonhangaba. Mirante de madeira com vista panorâmica da Serra da Mantiqueira — dá para avistar 10 a 15 cidades. Tem campos de lavanda, lago e um café num castelinho.`,
    dica: `Vá no fim da tarde para o pôr do sol. Entrada ~R$ 10 + estacionamento (9h às 17h); acesso só de carro. Leve casaco: faz frio e venta forte no alto.`,
  },
  mao_gigante: {
    foto: null,
    resumo: `A escultura "Mão de Deus" é o cenário-símbolo do Prana Pôr do Sol, um café-mirante no caminho do Pico do Itapeva. Tem também balanços "infinitos" e uma escada com "janela para o céu", tudo voltado para a vista da Mantiqueira.`,
    dica: `Vá no fim da tarde para o pôr do sol (o ponto alto). Entrada ~R$ 50 (estacionamento à parte), parte revertida em consumação. Chegue cedo: enche e forma fila nas fotos.`,
  },
  horto: {
    foto: hortoFoto,
    resumo: `O Parque Estadual de Campos do Jordão (~8.300 ha), primeiro parque estadual de SP (1941), coberto por araucárias. Cinco trilhas de vários níveis, lago com pedalinho, arborismo, tirolesa, bikes, áreas de piquenique e cafés.`,
    dica: `Reserve quase um dia. Abre 8h30 às 17h e fecha às quartas — vá de manhã para as trilhas com clima ameno e menos fila nas aventuras.`,
  },
  turundu: {
    foto: null,
    resumo: `O Tarundu é um parque de aventura e lazer (~500 mil m² de mata a 1.700 m), com 25+ atrações: tirolesa, arvorismo, boia-cross, patinação no gelo, arco e flecha, cavalgada, trilhas e restaurante. Muita diversão em contato com a natureza.`,
    dica: `Abre todo dia das 9h às 17h. Chegue cedo para as principais atrações sem fila. É pet-friendly; ingressos no site tarundu.com.br.`,
  },
  lagoinha: {
    foto: null,
    resumo: `Parque da Lagoinha: área verde pública (~48 mil m²) voltada à preservação, com trilhas fáceis (boas para todas as idades), lagos, patos soltos e um viveiro de ovelhas. Abriga o projeto Mãostiqueiras, de artesanato em lã da região.`,
    dica: `Entrada gratuita (paga-se só o estacionamento, ~R$ 20). Quarta a segunda, 9h às 18h. Leve tempo para a trilha e ração para os patos e ovelhas.`,
  },
}

/* --------------------------------------------------------- status da viagem */

function diasEntre(aISO, bISO) {
  const [ay, am, ad] = aISO.split('-').map(Number)
  const [by, bm, bd] = bISO.split('-').map(Number)
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000,
  )
}

/** Primeiro e último dia do roteiro (YYYY-MM-DD). */
export const INICIO_VIAGEM = ROTEIRO[0].data
export const FIM_VIAGEM = ROTEIRO[ROTEIRO.length - 1].data

/**
 * Contexto da viagem para hoje: antes (contagem regressiva), durante
 * (Dia X de N) ou depois. Puro cálculo local — funciona offline.
 */
export function statusViagem(hoje = hojeISO()) {
  if (hoje < INICIO_VIAGEM) {
    const dias = diasEntre(hoje, INICIO_VIAGEM)
    return {
      fase: 'antes',
      texto:
        dias === 1
          ? 'Falta 1 dia para Campos do Jordão! 🏔️'
          : `Faltam ${dias} dias para Campos do Jordão! 🏔️`,
    }
  }
  if (hoje > FIM_VIAGEM) {
    return { fase: 'depois', texto: 'Que viagem inesquecível! 💚' }
  }
  const i = ROTEIRO.findIndex((d) => d.data === hoje)
  const n = i >= 0 ? i + 1 : 1
  return {
    fase: 'durante',
    texto: `Dia ${n} de ${ROTEIRO.length} · Campos do Jordão`,
  }
}
