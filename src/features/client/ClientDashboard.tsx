import { Component, lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Alert, Button, CircularProgress, LinearProgress, Stack, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { Check, FolderKanban, MapPinned, Percent, Timer } from 'lucide-react'
import { useApp } from '../../app/app-context.ts'
import { KpiCard, kpiGridSx } from '../../components/common/KpiCard.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { SectionCard } from '../../components/layout/AppShell.tsx'
import type { MapPoint } from '../../components/maps/mapTypes.ts'
import { formatDate } from '../../utils/format.ts'
import { countTasks, projectStats, tasksForClient } from '../../utils/metrics.ts'
import { findExecutor, findProject, findTask, projectsForClient } from '../../utils/relations.ts'
import { projectStatusLabel, TASK_COLORS } from '../../utils/status.ts'

function CompletionRing({ percent }: { percent: number }) {
  const turn = Math.max(0, Math.min(100, percent)) * 3.6
  return (
    <Box
      sx={{
        width: 156,
        height: 156,
        borderRadius: '50%',
        background: `conic-gradient(#5BC4EB ${turn}deg, #E8F3FF ${turn}deg)`,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <Box sx={{ width: 114, height: 114, borderRadius: '50%', bgcolor: '#FFFFFF', display: 'grid', placeItems: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: '#1A2633' }}>{percent}%</Typography>
          <Typography sx={{ mt: 0.4, fontSize: 12, fontWeight: 700, color: '#5E7082' }}>finished</Typography>
        </Box>
      </Box>
    </Box>
  )
}

function StatLine({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 14, color: '#5E7082' }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#1A2633' }}>{value}</Typography>
    </Stack>
  )
}

const WorkMap = lazy(() => import('../../components/maps/WorkMap.tsx').then((module) => ({ default: module.WorkMap })))

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <Alert severity="warning">The map could not start. Open the work map page for the location list.</Alert> : this.props.children }
}

export function ClientDashboard() {
  const { data, session } = useApp()
  const clientId = session?.clientId ?? ''
  const projects = projectsForClient(data, clientId)
  const tasks = tasksForClient(data, clientId)
  const counts = countTasks(tasks)
  const remaining = counts.total - counts.completed
  const approved = data.submissions.filter((submission) => {
    if (submission.status !== 'approved') return false
    const task = findTask(data, submission.taskId)
    return task ? projects.some((project) => project.id === task.projectId) : false
  })
  const points: MapPoint[] = approved.flatMap((submission) => {
    const task = findTask(data, submission.taskId)
    if (!task) return []
    const project = findProject(data, task.projectId)
    return [{
      id: submission.id,
      lat: submission.lat,
      lng: submission.lng,
      title: `${task.taskCode} · ${task.locationName}`,
      status: 'completed',
      statusLabel: 'Approved',
      color: TASK_COLORS.completed,
      details: [
        { label: 'Project', value: project?.campaign ?? '—' },
        { label: 'Approved', value: formatDate(submission.reviewedAt ?? submission.submittedAt) },
      ],
    }]
  })
  return (
    <Stack spacing={2}>
      <PageHeader
        title="Client dashboard"
        subtitle="Approved work for your campaigns. Pending locations stay visible as progress, without internal notes."
        crumbs={[{ label: 'Client' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Button component={RouterLink} to="/client/gallery" variant="contained">Proof gallery</Button>
            <Button component={RouterLink} to="/client/reports" variant="outlined">Reports</Button>
          </>
        }
      />
      <Box sx={kpiGridSx}>
        <KpiCard tone="blue" label="Total projects" value={projects.length} icon={<FolderKanban size={16} />} />
        <KpiCard tone="green" label="Work locations" value={counts.total} icon={<MapPinned size={16} />} />
        <KpiCard tone="orange" label="Completed work" value={counts.completed} icon={<Check size={16} />} />
        <KpiCard tone="slate" label="Pending work" value={remaining} hint="Not yet completed" icon={<Timer size={16} />} />
        <KpiCard tone="violet" label="Completion" value={`${counts.percent}%`} icon={<Percent size={16} />} />
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, alignItems: 'stretch' }}>
        <SectionCard title="Project completion">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, minHeight: 220 }}>
            <CompletionRing percent={counts.percent} />
            <Stack spacing={1.5} sx={{ flex: 1, width: '100%' }}>
              <Typography sx={{ fontSize: 14, lineHeight: 1.5, color: '#5E7082' }}>
                {counts.total === 0
                  ? 'No work locations are linked to this account yet.'
                  : `${counts.completed} of ${counts.total} locations have approved proof.`}
              </Typography>
              <StatLine color="#2E9A5B" label="Finished" value={counts.completed} />
              <StatLine color="#5C7388" label="Pending" value={counts.pending} />
              <StatLine color="#C4842A" label="Awaiting review" value={counts.awaiting} />
              {counts.rejected > 0 && <StatLine color="#D26464" label="Rejected" value={counts.rejected} />}
            </Stack>
          </Stack>
        </SectionCard>
        <SectionCard title="Your projects">
          {projects.length === 0 ? (
            <Typography color="text.secondary">Projects linked to this account will appear here.</Typography>
          ) : (
            <Stack spacing={1.25}>
              {projects.map((project) => {
                const stats = projectStats(data, project.id)
                return (
                  <Box key={project.id} sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#F7FBFF', border: '1px solid #E6EEF2' }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, color: '#1A2633' }}>{project.name}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#5E7082' }}>{project.campaign}</Typography>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                        <StatusBadge status={project.status} label={projectStatusLabel(project.status)} />
                        <Typography sx={{ fontWeight: 800, color: '#1A2633' }}>{stats.percent}%</Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress variant="determinate" value={stats.percent} sx={{ my: 1.25, height: 8, borderRadius: 99 }} />
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: 13, color: '#5E7082' }}>
                        {stats.completed} of {stats.total} locations finished
                      </Typography>
                      <Button component={RouterLink} to={`/client/projects/${project.id}`} variant="contained" size="small">Open project</Button>
                    </Stack>
                  </Box>
                )
              })}
            </Stack>
          )}
        </SectionCard>
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <SectionCard title="Recent approved work" action={<Button component={RouterLink} to="/client/gallery" size="small">Gallery</Button>}>
          <Stack spacing={1.25}>
            {approved.length === 0 && <Typography color="text.secondary">Approved photographs will appear here.</Typography>}
            {approved.slice(0, 4).map((submission) => {
              const task = findTask(data, submission.taskId)
              const project = task ? findProject(data, task.projectId) : null
              const executor = findExecutor(data, submission.executorId)
              return (
                <Stack key={submission.id} direction="row" spacing={1.25}>
                  <Box component="img" src={submission.imageDataUrl} alt="" sx={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 1 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{project?.campaign} · {task?.locationName}</Typography>
                    <Typography variant="caption" color="text.secondary">{executor?.name} · {formatDate(submission.reviewedAt ?? submission.submittedAt)}</Typography>
                  </Box>
                </Stack>
              )
            })}
          </Stack>
        </SectionCard>
        <SectionCard title="Remaining work">
          <Stack spacing={1}>
            {tasks.filter((task) => task.status !== 'completed').map((task) => (
              <Typography key={task.id} variant="body2">{task.taskCode} · {task.locationName} · target {formatDate(task.targetDate)}</Typography>
            ))}
            {tasks.every((task) => task.status === 'completed') && <Typography color="text.secondary">Every location in your projects is complete.</Typography>}
          </Stack>
        </SectionCard>
      </Box>
      <SectionCard title="Approved work map" action={<Button component={RouterLink} to="/client/map" size="small">Open map</Button>}>
        {points.length === 0 ? <Typography color="text.secondary">No approved locations to map yet.</Typography> : (
          <Boundary>
            <Suspense fallback={<CircularProgress />}>
              <WorkMap points={points} height={320} />
            </Suspense>
          </Boundary>
        )}
      </SectionCard>
    </Stack>
  )
}
