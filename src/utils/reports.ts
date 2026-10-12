import type { AppData } from '../types/models.ts'
import { formatCoords, formatDate, formatDateTime } from './format.ts'
import { findClient, findExecutor, findProject, latestSubmission } from './relations.ts'
import { taskStatusLabel } from './status.ts'

export interface ReportRow {
  taskCode: string
  project: string
  campaign: string
  client: string
  location: string
  address: string
  executor: string
  status: string
  targetDate: string
  targetDateIso: string
  submittedAt: string
  approvalDate: string
  approvalDateIso: string
  coordinates: string
  proofRef: string
  quantity: string
  imageDataUrl: string
  imageName: string
  lat?: number
  lng?: number
  capturedAt?: string
  placeName?: string
  proofAddress?: string
}

export function buildReportRows(
  data: AppData,
  options: { clientId?: string; audience: 'admin' | 'client' },
): ReportRow[] {
  const projectIds = options.clientId
    ? new Set(data.projects.filter((project) => project.clientId === options.clientId).map((project) => project.id))
    : null

  return data.tasks
    .filter((task) => (projectIds ? projectIds.has(task.projectId) : true))
    .map((task) => {
      const project = findProject(data, task.projectId)
      const client = project ? findClient(data, project.clientId) : null
      const executor = findExecutor(data, task.executorId)
      const latest = latestSubmission(data, task.id)
      const approved = data.submissions
        .filter((submission) => submission.taskId === task.id && submission.status === 'approved')
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]
      const showProof = options.audience === 'admin' ? Boolean(latest) : Boolean(approved)
      const proof = options.audience === 'client' ? approved : latest
      const showCoords = options.audience === 'admin' || task.status === 'completed'
      return {
        taskCode: task.taskCode,
        project: project?.name ?? 'Unknown project',
        campaign: project?.campaign ?? '—',
        client: client?.company ?? 'Unknown client',
        location: task.locationName,
        address: task.address,
        executor: executor?.name ?? 'Unassigned',
        status: taskStatusLabel(task.status, options.audience),
        targetDate: formatDate(task.targetDate),
        targetDateIso: task.targetDate,
        submittedAt: proof ? formatDateTime(proof.submittedAt) : '—',
        approvalDate: approved?.reviewedAt ? formatDate(approved.reviewedAt) : '—',
        approvalDateIso: approved?.reviewedAt ? approved.reviewedAt.slice(0, 10) : '',
        coordinates: showCoords ? formatCoords(task.lat, task.lng) : '—',
        proofRef: showProof && approved
          ? `VESNE-${task.taskCode}`
          : options.audience === 'admin' && latest
            ? latest.status === 'awaiting_verification'
              ? 'Pending review'
              : 'Not approved'
            : '—',
        quantity: String(task.quantity),
        imageDataUrl: showProof && proof?.imageDataUrl ? proof.imageDataUrl : '',
        imageName: showProof && proof?.imageDataUrl ? `VESNE-${task.taskCode}.jpg` : '',
        lat: proof?.lat,
        lng: proof?.lng,
        capturedAt: proof?.submittedAt,
        placeName: proof?.placeName || task.locationName,
        proofAddress: proof?.locationLabel || task.address,
      }
    })
    .sort((a, b) => a.taskCode.localeCompare(b.taskCode))
}
