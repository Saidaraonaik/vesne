export function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.onload = () => {
      const original = String(reader.result ?? '')
      const image = new Image()
      image.onload = () => {
        const max = 1280
        const scale = Math.min(1, max / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        if (!context) {
          resolve(original)
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      image.onerror = () => reject(new Error('Could not preview that image.'))
      image.src = original
    }
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not prepare the watermarked image.'))
    image.src = src
  })
}

export function toJpegDataUrl(src: string, max = 960) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, max / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Could not prepare the proof image.'))
        return
      }
      context.fillStyle = '#F3EEE6'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.74))
    }
    image.onerror = () => reject(new Error('Could not read the proof image.'))
    image.src = src
  })
}

export function dataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? ''
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

export async function downloadWatermarked(src: string, lines: string[], filename: string) {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not prepare the watermarked image.')
  context.drawImage(image, 0, 0)
  const barHeight = Math.max(150, Math.round(image.height * 0.28))
  context.fillStyle = 'rgba(228, 87, 14, 0.92)'
  context.fillRect(0, image.height - barHeight, image.width, barHeight)
  context.fillStyle = '#ffffff'
  const fontSize = Math.max(16, Math.round(image.width * 0.028))
  context.font = `700 ${fontSize}px "Trebuchet MS", Arial, sans-serif`
  lines.forEach((line, index) => {
    context.fillText(line, 28, image.height - barHeight + fontSize + 16 + index * (fontSize + 8))
  })
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/jpeg', 0.86)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}
