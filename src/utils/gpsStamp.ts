export interface GpsStamp {
  placeName: string
  address: string
  lat: number
  lng: number
  at: string
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not prepare the shared proof image.'))
    image.src = src
  })
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.arcTo(x + width, y, x + width, y + height, r)
  context.arcTo(x + width, y + height, x, y + height, r)
  context.arcTo(x, y + height, x, y, r)
  context.arcTo(x, y, x + width, y, r)
  context.closePath()
}

function wrap(context: CanvasRenderingContext2D, text: string, maxWidth: number, limit: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === limit) return lines
    } else {
      line = next
    }
  }
  if (line && lines.length < limit) lines.push(line)
  return lines
}

export function formatStampTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' })
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM'
  const hours = String(date.getHours() % 12 || 12).padStart(2, '0')
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const absolute = Math.abs(offset)
  const offsetHours = String(Math.floor(absolute / 60)).padStart(2, '0')
  const offsetMinutes = String(absolute % 60).padStart(2, '0')
  return `${weekday}, ${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${ampm} GMT ${sign}${offsetHours}:${offsetMinutes}`
}

function drawMap(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  context.save()
  roundRect(context, x, y, size, size, size * 0.08)
  context.clip()
  context.fillStyle = '#C5D5C0'
  context.fillRect(x, y, size, size)
  context.strokeStyle = '#F4F7F2'
  context.lineWidth = Math.max(3, size * 0.07)
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(x, y + size * 0.38)
  context.lineTo(x + size, y + size * 0.58)
  context.moveTo(x + size * 0.22, y)
  context.lineTo(x + size * 0.62, y + size)
  context.moveTo(x + size * 0.05, y + size * 0.78)
  context.lineTo(x + size * 0.95, y + size * 0.22)
  context.stroke()
  const pinX = x + size * 0.5
  const pinY = y + size * 0.46
  context.fillStyle = '#E23B2F'
  context.beginPath()
  context.arc(pinX, pinY - size * 0.06, size * 0.07, 0, Math.PI * 2)
  context.moveTo(pinX - size * 0.07, pinY)
  context.lineTo(pinX + size * 0.07, pinY)
  context.lineTo(pinX, pinY + size * 0.16)
  context.fill()
  context.fillStyle = '#FFFFFF'
  context.beginPath()
  context.arc(pinX, pinY - size * 0.06, size * 0.025, 0, Math.PI * 2)
  context.fill()
  const badgeW = size * 0.62
  const badgeH = size * 0.16
  context.fillStyle = '#2E9A5B'
  roundRect(context, x + size * 0.06, y + size * 0.06, badgeW, badgeH, badgeH / 2)
  context.fill()
  context.fillStyle = '#FFFFFF'
  context.font = `700 ${Math.max(9, Math.round(size * 0.09))}px "Trebuchet MS", Arial, sans-serif`
  context.fillText('Check in', x + size * 0.12, y + size * 0.17)
  context.restore()
}

function drawFlag(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const band = height / 3
  context.fillStyle = '#FF9933'
  context.fillRect(x, y, width, band)
  context.fillStyle = '#FFFFFF'
  context.fillRect(x, y + band, width, band)
  context.fillStyle = '#138808'
  context.fillRect(x, y + band * 2, width, band)
  context.strokeStyle = '#5E7082'
  context.lineWidth = 1
  context.strokeRect(x, y, width, height)
}

export async function renderGpsStamp(src: string, stamp: GpsStamp) {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not prepare the shared proof image.')
  context.drawImage(image, 0, 0)

  const margin = Math.round(Math.min(image.width, image.height) * 0.03)
  const cardH = Math.round(Math.min(image.height * 0.36, Math.max(148, image.width * 0.24)))
  const cardW = Math.min(image.width - margin * 2, Math.round(image.width * 0.92))
  const cardX = margin
  const cardY = image.height - cardH - margin
  const pad = Math.round(cardH * 0.08)
  const mapSize = cardH - pad * 2

  context.save()
  roundRect(context, cardX, cardY, cardW, cardH, 12)
  context.fillStyle = '#1A1A1A'
  context.fill()
  context.restore()

  drawMap(context, cardX + pad, cardY + pad, mapSize)

  const textX = cardX + pad + mapSize + pad
  const textW = cardW - (textX - cardX) - pad
  const titleSize = Math.max(13, Math.round(cardH * 0.13))
  const bodySize = Math.max(11, Math.round(cardH * 0.1))
  context.fillStyle = '#FFFFFF'
  context.font = `700 ${titleSize}px "Trebuchet MS", Arial, sans-serif`
  context.textBaseline = 'top'
  const title = wrap(context, stamp.placeName, textW - 28, 2)
  let cursor = cardY + pad
  title.forEach((line) => {
    context.fillText(line, textX, cursor)
    cursor += titleSize + 3
  })
  if (stamp.placeName.toLowerCase().includes('india') || stamp.address.toLowerCase().includes('india')) {
    const flagX = textX + context.measureText(title[0] ?? '').width + 8
    if (flagX + 18 < cardX + cardW - pad) drawFlag(context, flagX, cardY + pad + 2, 16, 11)
  }
  context.font = `600 ${bodySize}px "Trebuchet MS", Arial, sans-serif`
  const details = [
    stamp.address,
    `Lat ${stamp.lat.toFixed(5)}° Long ${stamp.lng.toFixed(6)}°`,
    formatStampTime(stamp.at),
  ]
  details.forEach((detail) => {
    wrap(context, detail, textW, 2).forEach((line) => {
      if (cursor + bodySize > cardY + cardH - pad) return
      context.fillText(line, textX, cursor)
      cursor += bodySize + 3
    })
  })

  return canvas.toDataURL('image/jpeg', 0.86)
}
