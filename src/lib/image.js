function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não consegui abrir essa imagem. Tente uma foto JPG ou PNG.'))
    }
    img.src = url
  })
}

function toJpeg(img, maxSize, quality) {
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

/**
 * Prepara a foto para o banco: uma versão grande (até 1600px, para abrir em tela cheia)
 * e uma miniatura (520px, para o mural carregar rápido mesmo com muitas fotos).
 */
export async function preparePhoto(fileOrBlob) {
  const img = await loadImage(fileOrBlob)
  const [full, thumb] = await Promise.all([toJpeg(img, 1600, 0.82), toJpeg(img, 520, 0.76)])
  return { full, thumb }
}

export const randomTilt = () => Math.round((Math.random() * 7 - 3.5) * 10) / 10

const TAPES = ['bg-fuchsia-200/80', 'bg-violet-200/80', 'bg-purple-300/60', 'bg-pink-200/80', 'bg-indigo-200/70']
export function tapeColor(id = '') {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0
  return TAPES[Math.abs(h) % TAPES.length]
}
