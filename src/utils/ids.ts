export function newId(prefix: string) {
  const rand = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}_${rand.slice(0, 8)}`
}

export function nextNumericCode(existing: string[], prefix: string, floor: number) {
  const nums = existing
    .map((value) => Number(value.replace(/\D/g, '')))
    .filter((value) => Number.isFinite(value))
  const next = Math.max(floor, ...(nums.length ? nums : [floor])) + 1
  return `${prefix}-${next}`
}
