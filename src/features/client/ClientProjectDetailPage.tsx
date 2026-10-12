import { useState } from 'react'
import { Button, LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { SectionCard } from '../../components/layout/AppShell.tsx'
import { ShareWhatsAppDialog } from '../../components/proof/ShareWhatsAppDialog.tsx'
import { panelSx } from '../../theme/theme.ts'
import { formatCoords, formatDate } from '../../utils/format.ts'
import { projectStats } from '../../utils/metrics.ts'
import { findExecutor, submissionsForTask } from '../../utils/relations.ts'
import { taskStatusLabel } from '../../utils/status.ts'
import { proofShareMessage, type ProofShare } from '../../utils/whatsapp.ts'

export function ClientProjectDetailPage() {
  const { projectId } = useParams()
  const { data, session, notify } = useApp()
  const project = data.projects.find((item) => item.id === projectId && item.clientId === session?.clientId)
  const [share, setShare] = useState<ProofShare | null>(null)
  if (!project) {
    return <EmptyState title="Project not available" body="This project belongs to another client or does not exist." action={<Button component={RouterLink} to="/client/projects">Back to my projects</Button>} />
  }
  const stats = projectStats(data, project.id)
  const tasks = data.tasks.filter((task) => task.projectId === project.id)
  const shareFor = (taskId: string): ProofShare | null => {
    const task = tasks.find((item) => item.id === taskId)
    const approved = submissionsForTask(data, taskId).find((item) => item.status === 'approved')
    if (!task || !approved) return null
    const executor = findExecutor(data, approved.executorId)
    const filename = `VESNE-${task.taskCode}.jpg`
    return {
      imageDataUrl: approved.imageDataUrl,
      filename,
      stamp: {
        placeName: approved.placeName || task.locationName,
        address: approved.locationLabel || task.address,
        lat: approved.lat,
        lng: approved.lng,
        at: approved.submittedAt,
      },
      message: proofShareMessage({
        project: `${project.name} / ${project.campaign}`,
        location: task.locationName,
        date: formatDate(approved.reviewedAt ?? approved.submittedAt),
        executor: executor?.name ?? 'Field executor',
        coordinates: `${formatCoords(approved.lat, approved.lng)}`,
        reference: `VESNE-${task.taskCode}`,
        filename,
      }),
    }
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title={project.name}
        subtitle={project.campaign}
        crumbs={[{ label: 'Client', to: '/client' }, { label: 'My projects', to: '/client/projects' }, { label: project.name }]}
      />
      <SectionCard title="Progress">
        <Typography variant="h3">{stats.percent}%</Typography>
        <LinearProgress variant="determinate" value={stats.percent} sx={{ my: 1.5, height: 10, borderRadius: 99 }} />
        <Typography>{formatDate(project.startDate)} – {formatDate(project.endDate)}</Typography>
        <Typography color="text.secondary">{stats.total} locations · {stats.completed} completed · {stats.total - stats.completed} pending · {project.workType}</Typography>
      </SectionCard>
      <SectionCard title="Locations">
        <Box sx={panelSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Approved proof</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => {
                const approved = submissionsForTask(data, task.id).find((item) => item.status === 'approved')
                return (
                  <TableRow key={task.id}>
                    <TableCell>{task.taskCode}</TableCell>
                    <TableCell>{task.locationName}</TableCell>
                    <TableCell>{formatDate(task.targetDate)}</TableCell>
                    <TableCell><StatusBadge status={task.status} label={taskStatusLabel(task.status, 'client')} /></TableCell>
                    <TableCell>
                      {approved ? (
                        <Button size="small" onClick={() => setShare(shareFor(task.id))}>Share image</Button>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      </SectionCard>
      <ShareWhatsAppDialog open={Boolean(share)} share={share} onClose={() => setShare(null)} onNotify={notify} />
    </Stack>
  )
}
