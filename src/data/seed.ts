import type { AppData } from '../types/models.ts'

export function createEmptyData(): AppData {
  return {
    version: 1,
    clients: [],
    executors: [],
    projects: [],
    tasks: [],
    submissions: [],
    activities: [],
  }
}
