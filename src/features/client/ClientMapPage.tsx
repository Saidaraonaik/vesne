import { Stack } from '@mui/material'
import { useApp } from '../../app/app-context.ts'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { MapExplorer } from '../../components/maps/MapExplorer.tsx'
import type { MapPoint } from '../../components/maps/mapTypes.ts'
import { formatCoords, formatDate } from '../../utils/format.ts'
import { findExecutor, findProject, findTask, projectsForClient } from '../../utils/relations.ts'
import { TASK_COLORS } from '../../utils/status.ts'

export function ClientMapPage() {
  const { data, session } = useApp()
  const projects = projectsForClient(data, session?.clientId ?? '')
  const projectIds = new Set(projects.map((project) => project.id))
  const points: MapPoint[] = data.submissions.flatMap((submission) => {
    if (submission.status !== 'approved') return []
    const task = findTask(data, submission.taskId)
    if (!task || !projectIds.has(task.projectId)) return []
    const project = findProject(data, task.projectId)
    const executor = findExecutor(data, submission.executorId)
    return [{
      id: submission.id,
      lat: submission.lat,
      lng: submission.lng,
      title: `${task.taskCode} · ${task.locationName}`,
      status: 'completed',
      statusLabel: 'Approved',
      color: TASK_COLORS.completed,
      details: [
        { label: 'Project', value: project?.name ?? '—' },
        { label: 'Approved', value: formatDate(submission.reviewedAt ?? submission.submittedAt) },
        { label: 'User', value: executor?.name ?? '—' },
        { label: 'Proof reference', value: `VESNE-${task.taskCode}` },
        { label: 'Coordinates', value: `${formatCoords(submission.lat, submission.lng)}` },
      ],
    }]
  })

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Work map"
        subtitle="Approved locations for your projects. Other clients and unapproved proof are not shown."
        crumbs={[{ label: 'Client', to: '/client' }, { label: 'Work map' }]}
      />
      <MapExplorer points={points} />
    </Stack>
  )
}
