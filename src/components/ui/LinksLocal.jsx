import { linkMaps, linkWaze } from '../../utils/guia'

/** Pílulas de navegação (Google Maps + Waze) para um local. */
export default function LinksLocal({ local, className = '' }) {
  if (!local) return null
  return (
    <div className={`flex gap-3 ${className}`}>
      <Pilula href={linkMaps(local)} emoji="📍" rotulo="Maps" />
      <Pilula href={linkWaze(local)} emoji="🧭" rotulo="Waze" />
    </div>
  )
}

function Pilula({ href, emoji, rotulo }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-neve-200 px-4 py-2 text-sm font-semibold text-pinheiro-700 transition-colors hover:bg-neve-300"
    >
      <span aria-hidden="true">{emoji}</span>
      {rotulo}
    </a>
  )
}
