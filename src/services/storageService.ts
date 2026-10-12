import type { AppData, Session, Task } from '../types/models.ts'

const DATA_KEY = 'vesne.data.v2'
const LEGACY_DATA_KEY = 'vesne.demo.data.v1'
const SESSION_KEY = 'vesne.session.v2'

export function loadData(): AppData | null {
  try {
    localStorage.removeItem(LEGACY_DATA_KEY)
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppData
    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.clients) ||
      !Array.isArray(parsed.executors) ||
      !Array.isArray(parsed.projects) ||
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.submissions) ||
      !Array.isArray(parsed.activities)
    ) {
      return null
    }
    return {
      ...parsed,
      projects: parsed.projects.map((project) => ({
        ...project,
        referenceImages: Array.isArray(project.referenceImages) ? project.referenceImages : [],
      })),
      tasks: parsed.tasks.map((task) => {
        const record = task as Task & { referenceImage?: string }
        const { referenceImage, ...rest } = record
        const referenceImages = Array.isArray(record.referenceImages)
          ? record.referenceImages
          : referenceImage
            ? [referenceImage]
            : []
        return { ...rest, referenceImages }
      }),
    }
  } catch {
    return null
  }
}

export function saveData(data: AppData) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
    return { ok: true as const }
  } catch {
    return {
      ok: false as const,
      error: 'This browser could not store the workspace. Try a smaller photo or clear the workspace.',
    }
  }
}

export function loadSession(): Session | null {
  try {
    localStorage.removeItem('vesne.demo.session.v1')
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed?.email || !parsed.role || !parsed.name) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}
