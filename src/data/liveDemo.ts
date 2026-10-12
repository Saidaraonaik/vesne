import { reviewProof, startTask, submitProof } from '../services/mockApi.ts'
import type { AppData, Task } from '../types/models.ts'
import { demoProofImage } from './seed.ts'

const CLIENT_ID = 'cl_horizon'

function demoTasks(data: AppData) {
  const projectIds = new Set(
    data.projects.filter((project) => project.clientId === CLIENT_ID).map((project) => project.id),
  )
  return data.tasks.filter((task) => task.id.startsWith('tk_demo_') && projectIds.has(task.projectId))
}

function executorName(data: AppData, task: Task) {
  return data.executors.find((executor) => executor.id === task.executorId)?.name ?? 'Field executor'
}

/** Move one Horizon demo location forward so the client view updates on its own. */
export function advanceLiveDemo(data: AppData): AppData | null {
  const tasks = demoTasks(data)
  if (tasks.length === 0) return null

  const awaiting = data.submissions
    .filter(
      (submission) =>
        submission.status === 'awaiting_verification' && tasks.some((task) => task.id === submission.taskId),
    )
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))[0]
  if (awaiting) {
    const result = reviewProof(
      data,
      {
        submissionId: awaiting.id,
        decision: 'approved',
        rejectionReason: '',
        remarks: 'Face is fully visible and the GPS point matches the work location.',
      },
      'Ananya Deshmukh',
    )
    return result.ok ? result.data : null
  }

  const inProgress = tasks.find((task) => task.status === 'in_progress')
  if (inProgress) {
    const result = submitProof(
      data,
      {
        taskId: inProgress.id,
        executorId: inProgress.executorId,
        imageDataUrl: demoProofImage(inProgress.locationName),
        lat: inProgress.lat,
        lng: inProgress.lng,
        locationLabel: inProgress.address,
        gpsSource: 'device',
      },
      executorName(data, inProgress),
    )
    return result.ok ? result.data : null
  }

  const assigned = tasks.find((task) => task.status === 'assigned')
  if (assigned) {
    const result = startTask(data, assigned.id, executorName(data, assigned))
    return result.ok ? result.data : null
  }

  return null
}
