import { useMemo, useState } from 'react'
import { Button, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { panelSx } from '../../theme/theme.ts'
import type { TaskStatus } from '../../types/models.ts'
import { formatDate } from '../../utils/format.ts'
import { tasksForExecutor } from '../../utils/metrics.ts'
import { findProject } from '../../utils/relations.ts'
import { taskStatusLabel } from '../../utils/status.ts'

const STATUSES: TaskStatus[] = ['assigned', 'in_progress', 'awaiting_verification', 'rejected', 'completed']

export function MyTasksPage() {
  const { data, session } = useApp()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const filterKey = `${query}|${status}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 0 })
  const page = pageState.key === filterKey ? pageState.page : 0
  const setPage = (next: number) => setPageState({ key: filterKey, page: next })
  const tasks = useMemo(() => tasksForExecutor(data, session?.executorId ?? '').filter((task) => {
    const project = findProject(data, task.projectId)
    const haystack = `${task.taskCode} ${task.locationName} ${task.address} ${project?.name ?? ''}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase()) && (status === 'all' || task.status === status)
  }), [data, query, session?.executorId, status])
  const visible = tasks.slice(page * 8, page * 8 + 8)

  return (
    <Stack spacing={2}>
      <PageHeader
        title="My tasks"
        subtitle="Only work assigned to this user is listed."
        crumbs={[{ label: 'User', to: '/executor' }, { label: 'My tasks' }]}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField size="small" label="Search tasks" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth />
        <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 220 }}>
          <MenuItem value="all">All statuses</MenuItem>
          {STATUSES.map((item) => <MenuItem key={item} value={item}>{taskStatusLabel(item, 'executor')}</MenuItem>)}
        </TextField>
      </Stack>
      {tasks.length === 0 ? <EmptyState title="No tasks match" body="Try a different status or search." /> : (
        <TableContainer sx={panelSx}>
          <Table sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
            <TableHead>
              <TableRow>
                <TableCell>Location</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Proof</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((task) => {
                const project = findProject(data, task.projectId)
                return (
                  <TableRow key={task.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{task.locationName}</TableCell>
                    <TableCell>{project?.name || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{task.taskCode}</TableCell>
                    <TableCell sx={{ minWidth: 220 }}>{task.address}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(task.targetDate)}</TableCell>
                    <TableCell>{task.requiredProofTypes.join(', ')}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={task.status} label={taskStatusLabel(task.status, 'executor')} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Button component={RouterLink} to={`/executor/tasks/${task.id}`} variant="contained" size="small">{task.status === 'rejected' ? 'Resubmit' : 'Open task'}</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination component="div" count={tasks.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={8} rowsPerPageOptions={[8]} />
        </TableContainer>
      )}
    </Stack>
  )
}
