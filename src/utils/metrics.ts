import type { AppData, Task } from '../types/models.ts'

export interface TaskCounts {
  total: number
  completed: number
  pending: number
  awaiting: number
  rejected: number
  inProgress: number
  assigned: number
  percent: number
}

export function countTasks(tasks: Task[]): TaskCounts {
  const completed = tasks.filter((task) => task.status === 'completed').length
  const awaiting = tasks.filter((task) => task.status === 'awaiting_verification').length
  const rejected = tasks.filter((task) => task.status === 'rejected').length
  const inProgress = tasks.filter((task) => task.status === 'in_progress').length
  const assigned = tasks.filter((task) => task.status === 'assigned').length
  const total = tasks.length
  const pending = assigned + inProgress
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, completed, pending, awaiting, rejected, inProgress, assigned, percent }
}

export function tasksForProject(data: AppData, projectId: string) {
  return data.tasks.filter((task) => task.projectId === projectId)
}

export function projectStats(data: AppData, projectId: string) {
  return countTasks(tasksForProject(data, projectId))
}

export function tasksForClient(data: AppData, clientId: string) {
  const projectIds = new Set(
    data.projects.filter((project) => project.clientId === clientId).map((project) => project.id),
  )
  return data.tasks.filter((task) => projectIds.has(task.projectId))
}

export function tasksForExecutor(data: AppData, executorId: string) {
  return data.tasks.filter((task) => task.executorId === executorId)
}

export function adminKpis(data: AppData) {
  const counts = countTasks(data.tasks)
  return {
    projects: data.projects.length,
    ...counts,
  }
}

export function performanceLabel(percent: number, total: number) {
  if (total === 0) return 'No assignments'
  if (percent >= 75) return 'Excellent'
  if (percent >= 40) return 'On track'
  return 'Needs attention'
}
