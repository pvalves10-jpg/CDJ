/**
 * Gravação de áudio para o chat.
 *
 * Grava com MediaRecorder e converte para WAV mono 16 kHz — formato leve e
 * universalmente aceito pelo Gemini (o que o MediaRecorder produz varia: webm no
 * Chrome, mp4 no Safari; a conversão via Web Audio normaliza tudo).
 */

/** Inicia a gravação. Devolve um controlador com `parar()` e `cancelar()`. */
export async function iniciarGravacao() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Seu navegador não permite gravar áudio.')
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const gravador = new MediaRecorder(stream)
  const pedacos = []
  gravador.ondataavailable = (e) => {
    if (e.data && e.data.size) pedacos.push(e.data)
  }
  gravador.start()

  const encerrarStream = () => stream.getTracks().forEach((t) => t.stop())

  return {
    parar() {
      return new Promise((resolve, reject) => {
        gravador.onstop = async () => {
          encerrarStream()
          try {
            const bruto = new Blob(pedacos, {
              type: gravador.mimeType || 'audio/webm',
            })
            resolve(await paraWav(bruto))
          } catch (e) {
            reject(e)
          }
        }
        try {
          gravador.stop()
        } catch (e) {
          reject(e)
        }
      })
    },
    cancelar() {
      try {
        gravador.stop()
      } catch {
        /* já parado */
      }
      encerrarStream()
    },
  }
}

async function paraWav(blob) {
  const buffer = await blob.arrayBuffer()
  const Ctx = window.AudioContext || window.webkitAudioContext
  const ctx = new Ctx()
  try {
    const audio = await ctx.decodeAudioData(buffer)
    return codificarWav(audio, 16000)
  } finally {
    ctx.close?.()
  }
}

/** AudioBuffer → WAV mono PCM 16-bit na taxa alvo (downsample simples). */
function codificarWav(audioBuffer, taxaAlvo) {
  const canal =
    audioBuffer.numberOfChannels > 0
      ? audioBuffer.getChannelData(0)
      : new Float32Array()
  const razao = audioBuffer.sampleRate / taxaAlvo
  const n = Math.max(1, Math.floor(canal.length / razao))

  const total = 44 + n * 2
  const dv = new DataView(new ArrayBuffer(total))
  const escreverStr = (off, str) => {
    for (let i = 0; i < str.length; i++) dv.setUint8(off + i, str.charCodeAt(i))
  }

  escreverStr(0, 'RIFF')
  dv.setUint32(4, 36 + n * 2, true)
  escreverStr(8, 'WAVE')
  escreverStr(12, 'fmt ')
  dv.setUint32(16, 16, true)
  dv.setUint16(20, 1, true) // PCM
  dv.setUint16(22, 1, true) // mono
  dv.setUint32(24, taxaAlvo, true)
  dv.setUint32(28, taxaAlvo * 2, true)
  dv.setUint16(32, 2, true)
  dv.setUint16(34, 16, true)
  escreverStr(36, 'data')
  dv.setUint32(40, n * 2, true)

  let off = 44
  for (let i = 0; i < n; i++) {
    const amostra = canal[Math.floor(i * razao)] || 0
    const c = Math.max(-1, Math.min(1, amostra))
    dv.setInt16(off, c < 0 ? c * 0x8000 : c * 0x7fff, true)
    off += 2
  }

  return new Blob([dv.buffer], { type: 'audio/wav' })
}
