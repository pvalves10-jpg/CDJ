import { useEffect, useState } from 'react'
import { baixarImagem } from '../../services/drive'

/**
 * Imagem do Drive via Apps Script, com cache em IndexedDB.
 * Na grade usa a miniatura leve (`tamanho`); em tela cheia (`alta`), a inteira.
 */
export default function ImagemDrive({
  foto,
  tamanho = 400,
  alta = false,
  alt,
  className = '',
}) {
  const [src, setSrc] = useState(null)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    setFalhou(false)
    setSrc(null)

    let cancelado = false
    let url = null

    baixarImagem(foto.id, alta ? {} : { tamanho })
      .then((u) => {
        if (cancelado) {
          URL.revokeObjectURL(u)
          return
        }
        url = u
        setSrc(u)
      })
      .catch(() => {
        if (!cancelado) setFalhou(true)
      })

    return () => {
      cancelado = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [foto.id, tamanho, alta])

  if (falhou) {
    return (
      <div
        className={`grid place-items-center bg-neve-200 text-pinheiro-300 ${className}`}
        role="img"
        aria-label={`Falha ao carregar ${alt}`}
      >
        <span aria-hidden="true" className="text-2xl">
          🖼️
        </span>
      </div>
    )
  }

  if (!src) {
    return (
      <div
        className={`anim-pulse-suave bg-neve-200 ${className}`}
        aria-hidden="true"
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFalhou(true)}
      className={className}
    />
  )
}
