import { Button, Stack, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { Check, ClipboardList, RotateCcw, Send, Timer } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { KpiCard, kpiGridSx } from '../../components/common/KpiCard.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { panelSx } from '../../theme/theme.ts'
import { formatDate, isPastDate } from '../../utils/format.ts'
import { countTasks, tasksForExecutor } from '../../utils/metrics.ts'
import { findProject } from '../../utils/relations.ts'
import { taskStatusLabel } from '../../utils/status.ts'

export function ExecutorDashboard() {
  const { data, session } = useApp()
  const tasks = tasksForExecutor(data, session?.executorId ?? '')
  const counts = countTasks(tasks)
  return (
    <Stack spacing={2}>
      <PageHeader
        title={`Hello, ${session?.name.split(' ')[0]}`}
        subtitle={`${counts.total} tasks on your list. Open one to upload proof and capture location.`}
        crumbs={[{ label: 'Executor' }, { label: 'Dashboard' }]}
      />
      <Box sx={kpiGridSx}>
        <KpiCard tone="blue" label="Assigned" value={counts.assigned} hint="Not started" icon={<ClipboardList size={16} />} />
        <KpiCard tone="green" label="In progress" value={counts.inProgress} hint="Started" icon={<Timer size={16} />} />
        <KpiCard tone="orange" label="Submitted" value={counts.awaiting} hint="Awaiting verification" icon={<Send size={16} />} />
        <KpiCard tone="slate" label="Approved" value={counts.completed} hint="Completed work" icon={<Check size={16} />} />
        <KpiCard tone="violet" label="Needs resubmission" value={counts.rejected} hint="Read the remarks" icon={<RotateCcw size={16} />} />
      </Box>
      {tasks.length === 0 ? (
        <EmptyState title="No tasks assigned" body="When an admin assigns work to this executor, it will show up here." />
      ) : (
        <Stack spacing={1.25}>
          {tasks.map((task) => {
            const project = findProject(data, task.projectId)
            const overdue = task.status !== 'completed' && isPastDate(task.targetDate)
            return (
              <Box key={task.id} sx={{ ...panelSx, p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{task.locationName}</Typography>
                    <Typography variant="body2" color="text.secondary">{task.taskCode} · {project?.campaign}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>Target {formatDate(task.targetDate)}{overdue ? ' · Overdue' : ''}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <StatusBadge status={task.status} label={taskStatusLabel(task.status, 'executor')} />
                    <Button component={RouterLink} to={`/executor/tasks/${task.id}`} variant="contained">Open</Button>
                  </Stack>
                </Stack>
              </Box>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
