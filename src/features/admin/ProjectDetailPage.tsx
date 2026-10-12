import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Chip, Divider, LinearProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { SectionCard } from '../../components/layout/AppShell.tsx'
import { panelSx } from '../../theme/theme.ts'
import { formatDate, formatInr } from '../../utils/format.ts'
import { projectStats } from '../../utils/metrics.ts'
import type { TaskCounts } from '../../utils/metrics.ts'
import { findClient, findExecutor } from '../../utils/relations.ts'
import { projectStatusLabel, taskStatusLabel } from '../../utils/status.ts'
import { ProjectFormDialog } from './ProjectFormDialog.tsx'

function progressCopy(stats: TaskCounts) {
  if (stats.total === 0) {
    return 'No work locations have been added yet, so this stays at 0%. Add a task for each site. The percentage counts only locations whose proof has been approved.'
  }
  const finished = stats.completed === 1 ? '1 location is finished' : `${stats.completed} locations are finished`
  return `${finished} out of ${stats.total}. Finished means the proof was approved. Pending is still assigned or in progress. Awaiting review has been submitted and is waiting for a decision. Rejected needs to be sent again.`
}

function DetailField({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <Box sx={{ gridColumn: wide ? '1 / -1' : undefined, minWidth: 0 }}>
      <Typography sx={{ mb: 0.5, fontSize: 12, fontWeight: 700, color: '#5E7082' }}>{label}</Typography>
      <Box
        sx={{
          minHeight: 40,
          px: 1.5,
          py: 1,
          borderRadius: '8px',
          border: '1px solid #E6EEF2',
          bgcolor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {typeof value === 'string' || typeof value === 'number' ? (
          <Typography sx={{ fontSize: 14, fontWeight: 650, color: '#1A2633', lineHeight: 1.45 }}>{value || '—'}</Typography>
        ) : (
          value
        )}
      </Box>
    </Box>
  )
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const { data } = useApp()
  const project = data.projects.find((item) => item.id === projectId)
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  if (!project) {
    return <EmptyState title="Project not found" body="This project is not in the current workspace." action={<Button component={RouterLink} to="/admin/projects">Back to projects</Button>} />
  }
  const client = findClient(data, project.clientId)
  const stats = projectStats(data, project.id)
  const tasks = data.tasks.filter((task) => task.projectId === project.id)

  return (
    <Stack spacing={2}>
      <PageHeader
        title={project.name}
        subtitle={project.campaign}
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Projects', to: '/admin/projects' }, { label: project.name }]}
        actions={
          <>
            <Button variant="outlined" onClick={() => { setFormKey((key) => key + 1); setOpen(true) }}>Edit project</Button>
            <Button variant="contained" component={RouterLink} to={`/admin/tasks?new=1&project=${project.id}`}>Add task</Button>
          </>
        }
      />
      <Box sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
        <Typography sx={{ fontSize: 12, fontWeight: 750, letterSpacing: 0.6, textTransform: 'uppercase', color: '#5E7082' }}>
          Progress
        </Typography>
        <Typography sx={{ mt: 0.75, fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{stats.percent}%</Typography>
        <LinearProgress variant="determinate" value={stats.percent} sx={{ mt: 1.5, mb: 1.25, height: 10, borderRadius: 99 }} />
        <Typography sx={{ maxWidth: 720, color: '#3E5566', fontSize: 14, lineHeight: 1.55 }}>{progressCopy(stats)}</Typography>
        <Box sx={{ display: 'grid', gap: 1, mt: 1.75, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, minmax(0, 1fr))' } }}>
          {[
            ['Finished', stats.completed, 'Proof approved'],
            ['Pending', stats.pending, 'Assigned or in progress'],
            ['Awaiting review', stats.awaiting, 'Submitted, not decided'],
            ['Rejected', stats.rejected, 'Needs to be sent again'],
          ].map(([label, value, hint]) => (
            <Box key={label} sx={{ px: 1.5, py: 1.25, borderRadius: '8px', bgcolor: '#F7FBFC', border: '1px solid #E6EEF2' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#5E7082' }}>{label}</Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography>
              <Typography sx={{ fontSize: 12, color: '#5E7082' }}>{hint}</Typography>
            </Box>
          ))}
        </Box>
        <Divider sx={{ my: 2.25 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
          <DetailField wide label="Client" value={client ? `${client.name} · ${client.email}` : '—'} />
          <DetailField label="Project name" value={project.name} />
          <DetailField label="Campaign" value={project.campaign} />
          <DetailField label="Start date" value={formatDate(project.startDate)} />
          <DetailField label="End date" value={formatDate(project.endDate)} />
          <DetailField label="Target date" value={formatDate(project.targetDate)} />
          <DetailField label="Status" value={<StatusBadge status={project.status} label={projectStatusLabel(project.status)} />} />
          <DetailField label="Quantity" value={project.quantity} />
          <DetailField label="Budget (INR)" value={formatInr(project.budget)} />
          <DetailField wide label="Type of work" value={project.workType} />
          <DetailField wide label="Work locations" value={project.workLocations} />
          <DetailField wide label="Executor instructions" value={project.executorInstructions || '—'} />
          <DetailField
            wide
            label="Required proof"
            value={
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {project.requiredProofTypes.map((type) => (
                  <Chip key={type} size="small" label={type.charAt(0).toUpperCase() + type.slice(1)} />
                ))}
              </Stack>
            }
          />
          <DetailField wide label="Internal notes" value={project.internalNotes || '—'} />
          {project.referenceImages.length > 0 && (
            <DetailField
              wide
              label="Reference images"
              value={
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {project.referenceImages.map((src, index) => (
                    <Box key={`${index}-${src.slice(-16)}`} component="img" src={src} alt={`Project reference ${index + 1}`} sx={{ width: 160, height: 96, objectFit: 'cover', borderRadius: '8px' }} />
                  ))}
                </Box>
              }
            />
          )}
        </Box>
      </Box>
      <SectionCard title="Tasks and work locations">
        {tasks.length === 0 ? (
          <Typography color="text.secondary">No locations yet. Add a task to start field execution.</Typography>
        ) : (
          <TableContainer sx={panelSx}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Executor</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} hover component={RouterLink} to={`/admin/tasks/${task.id}`} sx={{ textDecoration: 'none' }}>
                    <TableCell>{task.taskCode}</TableCell>
                    <TableCell>{task.locationName}</TableCell>
                    <TableCell>{findExecutor(data, task.executorId)?.name}</TableCell>
                    <TableCell>{formatDate(task.targetDate)}</TableCell>
                    <TableCell><StatusBadge status={task.status} label={taskStatusLabel(task.status)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>
      <ProjectFormDialog key={formKey} open={open} project={project} onClose={() => setOpen(false)} />
    </Stack>
  )
}
