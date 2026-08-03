import { USUARIOS } from '../../utils/constantes'

/**
 * Retratos são opcionais: basta soltar `paulo_victor.jpg` e `louise.jpg` em
 * `src/assets/`. `import.meta.glob` resolve em tempo de build e devolve um
 * objeto vazio se os arquivos não existirem — sem eles, cai nas iniciais.
 */
const RETRATOS = import.meta.glob('../../assets/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function retratoDe(id) {
  const usuario = USUARIOS.find((u) => u.id === id)
  const alvos = [id, usuario?.primeiroNome?.toLowerCase()].filter(Boolean)
  const chave = Object.keys(RETRATOS).find((caminho) => {
    const arquivo = caminho.split('/').pop().toLowerCase()
    return alvos.some((alvo) => arquivo.startsWith(alvo))
  })
  return chave ? RETRATOS[chave] : null
}

function iniciais(nome) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

const CORES = {
  paulo_victor: 'bg-pinheiro-600 text-white',
  louise: 'bg-outono-500 text-white',
}

export default function Avatar({ id, tamanho = 'size-20', className = '' }) {
  const usuario = USUARIOS.find((u) => u.id === id)
  const retrato = retratoDe(id)
  const nome = usuario?.nome ?? '?'

  const base = `${tamanho} shrink-0 overflow-hidden rounded-full ring-3 ring-white/70 ${className}`

  if (retrato) {
    return (
      <img
        src={retrato}
        alt={nome}
        className={`${base} object-cover`}
        loading="lazy"
        decoding="async"
      />
    )
  }

  return (
    <div
      className={`${base} grid place-items-center font-bold ${CORES[id] ?? 'bg-pinheiro-400 text-white'}`}
      role="img"
      aria-label={nome}
    >
      <span aria-hidden="true" className="text-xl">
        {iniciais(nome)}
      </span>
    </div>
  )
}
