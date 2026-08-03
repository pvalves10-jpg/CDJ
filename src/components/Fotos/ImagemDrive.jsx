import { useEffect, useState } from 'react'
import { baixarComoObjectURL } from '../../services/drive'

/** thumbnailLink termina em "=s220"; troca pelo tamanho que a gente quer. */
function comTamanho(link, tamanho) {
  return link.replace(/=s\d+(-c)?$/, '') + `=s${tamanho}`
}

/**
 * Imagem do Drive com duas estratégias.
 *
 * 1. `thumbnailLink` (googleusercontent) — leve e rápido, mas depende da sessão
 *    do Google no navegador; sem ela devolve 403.
 * 2. Download autenticado com o access token, virando object URL — sempre
 *    funciona, mas baixa o arquivo inteiro.
 *
 * Começa pela 1 e cai para a 2 no primeiro erro. Em tela cheia já usa a 2.
 */
export default function ImagemDrive({
  foto,
  tamanho = 400,
  alta = false,
  alt,
  className = '',
}) {
  const [autenticado, setAutenticado] = useState(alta || !foto.thumbnailLink)
  const [src, setSrc] = useState(null)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    setFalhou(false)

    if (!autenticado) {
      setSrc(comTamanho(foto.thumbnailLink, tamanho))
      return
    }

    let cancelado = false
    let url = null
    setSrc(null)

    baixarComoObjectURL(foto.id)
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
  }, [foto.id, foto.thumbnailLink, tamanho, autenticado])

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
      referrerPolicy="no-referrer"
      onError={() => {
        // 403 no thumbnail: tenta de novo pelo caminho autenticado.
        if (!autenticado) setAutenticado(true)
        else setFalhou(true)
      }}
      className={className}
    />
  )
}
