import { Stack } from '@mui/material'
import { useApp } from '../../app/app-context.ts'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { MapExplorer } from '../../components/maps/MapExplorer.tsx'
import type { MapPoint } from '../../components/maps/mapTypes.ts'
import { formatCoords, formatDateTime } from '../../utils/format.ts'
import { findExecutor, findProject, latestSubmission } from '../../utils/relations.ts'
import { TASK_COLORS, taskStatusLabel } from '../../utils/status.ts'

export function AdminMapPage() {
  const { data } = useApp()
  const points: MapPoint[] = data.tasks.map((task) => {
    const project = findProject(data, task.projectId)
    const executor = findExecutor(data, task.executorId)
    const latest = latestSubmission(data, task.id)
    return {
      id: task.id,
      lat: task.lat,
      lng: task.lng,
      title: `${task.taskCode} · ${task.locationName}`,
      status: task.status,
      statusLabel: taskStatusLabel(task.status),
      color: TASK_COLORS[task.status],
      details: [
        { label: 'Project', value: project?.name ?? '—' },
        { label: 'User', value: executor?.name ?? '—' },
        { label: 'Status', value: taskStatusLabel(task.status) },
        { label: 'Submission', value: latest ? formatDateTime(latest.submittedAt) : 'Not submitted' },
        { label: 'Coordinates', value: formatCoords(task.lat, task.lng) },
      ],
    }
  })

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Work map"
        subtitle="Work locations from your tasks. Select a marker for the task, user, and status."
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Work map' }]}
      />
      <MapExplorer points={points} />
    </Stack>
  )
}
