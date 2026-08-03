import { useEffect, useState } from 'react'

/**
 * Carrossel da tela inicial.
 *
 * As imagens vêm de `src/assets/home/` — basta soltar arquivos lá que entram
 * automaticamente (resolvidos em tempo de build por `import.meta.glob`).
 * Ordena pelo nome para uma sequência estável.
 */
const IMAGENS = Object.entries(
  import.meta.glob('../../assets/home/*.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)

const INTERVALO = 4000

export default function HeroFotos() {
  const [atual, setAtual] = useState(0)

  useEffect(() => {
    if (IMAGENS.length <= 1) return
    const id = setInterval(
      () => setAtual((i) => (i + 1) % IMAGENS.length),
      INTERVALO,
    )
    return () => clearInterval(id)
  }, [])

  if (!IMAGENS.length) return null

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card shadow-card">
      {IMAGENS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden={i !== atual}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
            i === atual ? 'opacity-100' : 'opacity-0'
          }`}
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
        />
      ))}

      {IMAGENS.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-pinheiro-900/55 to-transparent p-3">
          <div className="flex justify-center gap-1.5">
            {IMAGENS.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Ver foto ${i + 1}`}
                onClick={() => setAtual(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === atual ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
