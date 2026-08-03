/**
 * Reduz uma imagem (foto de celular ~12MP) para um lado máximo, devolvendo um
 * Blob JPEG mais leve. Usado antes de subir fotos/comprovantes ao Drive — evita
 * enviar vários MB em base64 no 4G da serra.
 *
 * Nunca quebra o fluxo: se o navegador não decodificar o formato (HEIC) ou algo
 * falhar, devolve o arquivo original.
 */
export async function reduzirImagem(file, maxLado = 2000, qualidade = 0.85) {
  if (!file || !file.type?.startsWith('image/')) return file
  if (typeof createImageBitmap !== 'function') return file

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  try {
    const maior = Math.max(bitmap.width, bitmap.height)
    // Já é pequena o suficiente — não recomprime à toa.
    if (maior <= maxLado && file.size < 1_000_000) return file

    const escala = Math.min(1, maxLado / maior)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((r) =>
      canvas.toBlob(r, 'image/jpeg', qualidade),
    )
    return blob || file
  } finally {
    bitmap.close?.()
  }
}

/** Blob/File → base64 (sem o prefixo `data:`). */
export function blobParaBase64(blob) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result).split(',')[1] ?? '')
    leitor.onerror = () => reject(new Error('Não consegui ler o arquivo.'))
    leitor.readAsDataURL(blob)
  })
}
