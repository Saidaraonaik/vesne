export interface ProofShare {
  message: string
  imageDataUrl: string
  filename: string
}

export function proofShareMessage(input: {
  project: string
  location: string
  date: string
  executor: string
  coordinates: string
  reference: string
  filename: string
  status?: string
}) {
  return [
    'Vesne field update (demo)',
    `Project: ${input.project}`,
    `Location: ${input.location}`,
    `Status: ${input.status ?? 'Approved'}`,
    `Date: ${input.date}`,
    `Executor: ${input.executor}`,
    `GPS: ${input.coordinates}`,
    `Reference: ${input.reference}`,
    `Photo: ${input.filename}`,
    'The photograph is the current proof image from this browser. Attach that downloaded file in the chat. This reference is not a public link.',
  ].join('\n')
}

export function whatsAppUrl(message: string, phone?: string) {
  const text = encodeURIComponent(message)
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits) return `https://wa.me/${digits}?text=${text}`
  return `https://wa.me/?text=${text}`
}
