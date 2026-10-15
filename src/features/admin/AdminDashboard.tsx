import { Button, LinearProgress, Stack, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { ClipboardCheck, FolderKanban, MapPinned, Percent, Plus, ShieldAlert, ShieldCheck, Timer } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { KpiCard, kpiGridSx } from '../../components/common/KpiCard.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { SectionCard } from '../../components/layout/AppShell.tsx'
import { formatDateTime } from '../../utils/format.ts'
import { adminKpis, countTasks, performanceLabel, tasksForExecutor } from '../../utils/metrics.ts'
import { findExecutor, findProject, findTask } from '../../utils/relations.ts'
import { proofStatusLabel, taskStatusLabel } from '../../utils/status.ts'

export function AdminDashboard() {
  const { data } = useApp()
  const kpis = adminKpis(data)
  const recent = [...data.submissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 5)
  const queue = data.submissions.filter((item) => item.status === 'awaiting_verification').slice(0, 5)

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Dashboard"
        subtitle="Counts from the records in this browser. Approving or rejecting proof updates these figures."
        crumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Button component={RouterLink} to="/admin/projects?new=1" variant="contained" startIcon={<Plus size={16} />}>Create project</Button>
            <Button component={RouterLink} to="/admin/tasks?new=1" variant="outlined">Assign task</Button>
            <Button component={RouterLink} to="/admin/verification" variant="outlined">Review proof</Button>
          </>
        }
      />
      <Box sx={kpiGridSx}>
        <KpiCard tone="blue" label="Total projects" value={kpis.projects} hint="Campaigns in this workspace" icon={<FolderKanban size={18} />} />
        <KpiCard tone="green" label="Work locations" value={kpis.total} hint="Saved work sites" icon={<MapPinned size={18} />} />
        <KpiCard tone="orange" label="Completed work" value={kpis.completed} hint="Proof approved" icon={<ClipboardCheck size={18} />} />
        <KpiCard tone="slate" label="Pending work" value={kpis.pending} hint="Assigned or in progress" icon={<Timer size={18} />} />
        <KpiCard tone="ink" label="Awaiting verification" value={kpis.awaiting} hint="Submitted, not reviewed" icon={<ShieldCheck size={18} />} />
        <KpiCard tone="violet" label="Rejected" value={kpis.rejected} hint="Waiting for resubmission" icon={<ShieldAlert size={18} />} />
        <KpiCard tone="orange" label="Overall completion" value={`${kpis.percent}%`} hint={`${kpis.completed} of ${kpis.total} locations`} icon={<Percent size={18} />} />
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, alignItems: 'start' }}>
        <SectionCard title="Campaign progress">
          {data.projects.length === 0 ? (
            <Typography color="text.secondary">Projects you create will appear here.</Typography>
          ) : (
            <Stack spacing={1.25}>
              {data.projects.map((project) => {
                const counts = countTasks(data.tasks.filter((task) => task.projectId === project.id))
                return (
                  <Box key={project.id} sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#F7FBFF', border: '1px solid #E6EEF2' }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, color: '#1A2633' }}>{project.name}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#5E7082' }}>{project.campaign}</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 800, color: '#1A2633', flexShrink: 0 }}>{counts.percent}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={counts.percent} sx={{ my: 1.25, height: 8, borderRadius: 99 }} />
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: 13, color: '#5E7082' }}>
                        {counts.completed} of {counts.total} locations finished
                      </Typography>
                      <Button component={RouterLink} to={`/admin/projects/${project.id}`} size="small" variant="contained">Open</Button>
                    </Stack>
                  </Box>
                )
              })}
            </Stack>
          )}
        </SectionCard>
        <SectionCard title="Users">
          {data.executors.length === 0 ? (
            <Typography color="text.secondary">Users you add will appear here.</Typography>
          ) : (
            <Stack spacing={1.25}>
              {data.executors.map((executor) => {
                const counts = countTasks(tasksForExecutor(data, executor.id))
                const open = counts.pending + counts.awaiting + counts.rejected
                return (
                  <Box key={executor.id} sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#F7FBFF', border: '1px solid #E6EEF2' }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, color: '#1A2633' }}>{executor.name}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#5E7082' }}>{executor.executorCode} · {performanceLabel(counts.percent, counts.total)}</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 800, color: '#1A2633', flexShrink: 0 }}>{counts.percent}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={counts.percent} sx={{ my: 1.25, height: 8, borderRadius: 99, '& .MuiLinearProgress-bar': { backgroundColor: '#7DCF9A' } }} />
                    <Typography sx={{ fontSize: 13, color: '#5E7082' }}>
                      {counts.completed} of {counts.total} finished · {open} still open
                    </Typography>
                  </Box>
                )
              })}
            </Stack>
          )}
        </SectionCard>
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1fr' } }}>
        <SectionCard title="Recent proof" action={<Button component={RouterLink} to="/admin/verification" size="small">Open queue</Button>}>
          <Stack spacing={1.25}>
            {recent.map((submission) => {
              const task = findTask(data, submission.taskId)
              const executor = findExecutor(data, submission.executorId)
              return (
                <Stack key={submission.id} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Box component="img" src={submission.imageDataUrl} alt="" sx={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 1 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{task?.taskCode} · {task?.locationName}</Typography>
                    <Typography variant="caption" color="text.secondary">{executor?.name} · {formatDateTime(submission.submittedAt)}</Typography>
                  </Box>
                  <StatusBadge status={submission.status} label={proofStatusLabel(submission.status)} />
                </Stack>
              )
            })}
          </Stack>
        </SectionCard>
        <SectionCard title="Pending verification">
          <Stack spacing={1.25}>
            {queue.length === 0 && <Typography color="text.secondary">Nothing is waiting for review.</Typography>}
            {queue.map((submission) => {
              const task = findTask(data, submission.taskId)
              const project = task ? findProject(data, task.projectId) : null
              return (
                <Button key={submission.id} component={RouterLink} to={`/admin/verification/${submission.id}`} sx={{ justifyContent: 'space-between' }}>
                  <span>{task?.taskCode} · {project?.campaign}</span>
                  <StatusBadge status="awaiting_verification" label="Review" />
                </Button>
              )
            })}
          </Stack>
        </SectionCard>
        <SectionCard title="Recent activity">
          <Stack spacing={1.25}>
            {data.activities.slice(0, 6).map((activity) => (
              <Box key={activity.id}>
                <Typography variant="body2">{activity.message}</Typography>
                <Typography variant="caption" color="text.secondary">{activity.actor} · {formatDateTime(activity.at)}</Typography>
              </Box>
            ))}
          </Stack>
        </SectionCard>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Pending work is assigned or in progress. Awaiting verification and rejected work are counted separately, so the four status groups add up to the task total. Current labels follow {taskStatusLabel('completed')}.
      </Typography>
    </Stack>
  )
}
