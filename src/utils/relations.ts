import type { AppData } from '../types/models.ts'

export function findClient(data: AppData, clientId: string) {
  return data.clients.find((client) => client.id === clientId) ?? null
}

export function findExecutor(data: AppData, executorId: string | null | undefined) {
  if (!executorId) return null
  return data.executors.find((executor) => executor.id === executorId) ?? null
}

export function findProject(data: AppData, projectId: string) {
  return data.projects.find((project) => project.id === projectId) ?? null
}

export function findTask(data: AppData, taskId: string) {
  return data.tasks.find((task) => task.id === taskId) ?? null
}

export function submissionsForTask(data: AppData, taskId: string) {
  return data.submissions
    .filter((submission) => submission.taskId === taskId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export function latestSubmission(data: AppData, taskId: string) {
  return submissionsForTask(data, taskId)[0] ?? null
}

export function projectsForClient(data: AppData, clientId: string) {
  return data.projects.filter((project) => project.clientId === clientId)
}
