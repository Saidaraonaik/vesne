const CRC_TABLE = new Uint32Array(256)
for (let index = 0; index < 256; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  CRC_TABLE[index] = value
}

function crc32(data: Uint8Array) {
  let value = 0xffffffff
  for (const byte of data) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}

export function zipStore(files: { name: string; data: Uint8Array }[]) {
  const locals: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  const encoder = new TextEncoder()
  for (const file of files) {
    const name = encoder.encode(file.name)
    const checksum = crc32(file.data)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(8, 0, true)
    local.setUint32(14, checksum, true)
    local.setUint32(18, file.data.length, true)
    local.setUint32(22, file.data.length, true)
    local.setUint16(26, name.length, true)
    locals.push(new Uint8Array(local.buffer), name, file.data)
    const header = new DataView(new ArrayBuffer(46))
    header.setUint32(0, 0x02014b50, true)
    header.setUint16(4, 20, true)
    header.setUint16(6, 20, true)
    header.setUint32(16, checksum, true)
    header.setUint32(20, file.data.length, true)
    header.setUint32(24, file.data.length, true)
    header.setUint16(28, name.length, true)
    header.setUint32(42, offset, true)
    central.push(new Uint8Array(header.buffer), name)
    offset += 30 + name.length + file.data.length
  }
  const centralSize = central.reduce((total, part) => total + part.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, centralSize, true)
  end.setUint32(16, offset, true)
  const parts = [...locals, ...central, new Uint8Array(end.buffer)]
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let cursor = 0
  for (const part of parts) {
    output.set(part, cursor)
    cursor += part.length
  }
  return new Blob([output], { type: 'application/zip' })
}
