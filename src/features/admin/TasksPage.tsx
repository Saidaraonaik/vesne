import { useMemo, useState } from 'react'
import { Button, IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip } from '@mui/material'
import { Eye, Pencil, Plus } from 'lucide-react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { panelSx } from '../../theme/theme.ts'
import type { Task, TaskStatus } from '../../types/models.ts'
import { formatDate } from '../../utils/format.ts'
import { findClient, findExecutor, findProject } from '../../utils/relations.ts'
import { taskStatusLabel } from '../../utils/status.ts'
import { TaskFormDialog } from './TaskFormDialog.tsx'

const STATUSES: TaskStatus[] = ['assigned', 'in_progress', 'awaiting_verification', 'rejected', 'completed']

export function TasksPage() {
  const { data } = useApp()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [projectId, setProjectId] = useState('all')
  const [executorId, setExecutorId] = useState('all')
  const [status, setStatus] = useState('all')
  const filterKey = `${query}|${projectId}|${executorId}|${status}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 0 })
  const page = pageState.key === filterKey ? pageState.page : 0
  const setPage = (next: number) => setPageState({ key: filterKey, page: next })
  const [manual, setManual] = useState<{ open: boolean; task: Task | null; preset?: string; key: number }>({ open: false, task: null, key: 0 })
  const fromParams = params.get('new') === '1'
  const open = fromParams || manual.open
  const editing = fromParams ? null : manual.task
  const presetProjectId = fromParams ? params.get('project') ?? undefined : manual.preset
  const formKey = `${params.get('project') ?? 'task'}-${manual.key}`

  const rows = useMemo(() => data.tasks.filter((task) => {
    const project = findProject(data, task.projectId)
    const client = project ? findClient(data, project.clientId) : null
    const executor = findExecutor(data, task.executorId)
    const haystack = `${task.taskCode} ${task.locationName} ${task.address} ${project?.name ?? ''} ${client?.company ?? ''} ${executor?.name ?? ''}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
      && (projectId === 'all' || task.projectId === projectId)
      && (executorId === 'all' || task.executorId === executorId)
      && (status === 'all' || task.status === status)
  }), [data, executorId, projectId, query, status])

  const visible = rows.slice(page * 8, page * 8 + 8)
  const closeForm = () => {
    setManual((current) => ({ open: false, task: null, key: current.key }))
    if (fromParams) setParams({}, { replace: true })
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Tasks & work locations"
        subtitle="Assign sites to executors. Proof review changes status after submission."
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Tasks' }]}
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setManual((current) => ({ open: true, task: null, key: current.key + 1 }))}>Assign task</Button>}
      />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField size="small" label="Search tasks" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth />
        <TextField select size="small" label="Project" value={projectId} onChange={(event) => setProjectId(event.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="all">All projects</MenuItem>
          {data.projects.map((project) => <MenuItem key={project.id} value={project.id}>{project.campaign}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Executor" value={executorId} onChange={(event) => setExecutorId(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All executors</MenuItem>
          {data.executors.map((executor) => <MenuItem key={executor.id} value={executor.id}>{executor.name}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="all">All statuses</MenuItem>
          {STATUSES.map((item) => <MenuItem key={item} value={item}>{taskStatusLabel(item)}</MenuItem>)}
        </TextField>
      </Stack>
      {rows.length === 0 ? (
        <EmptyState title="No tasks match" body="Change the filters or assign a new work location." />
      ) : (
        <TableContainer sx={panelSx}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Executor</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((task) => {
                const project = findProject(data, task.projectId)
                const client = project ? findClient(data, project.clientId) : null
                return (
                  <TableRow key={task.id} hover>
                    <TableCell>{task.taskCode}</TableCell>
                    <TableCell>{project?.name}</TableCell>
                    <TableCell>{client?.company}</TableCell>
                    <TableCell>{task.locationName}</TableCell>
                    <TableCell>{findExecutor(data, task.executorId)?.name}</TableCell>
                    <TableCell>{formatDate(task.targetDate)}</TableCell>
                    <TableCell><StatusBadge status={task.status} label={taskStatusLabel(task.status)} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="View task"><IconButton component={RouterLink} to={`/admin/tasks/${task.id}`} aria-label="View task"><Eye size={16} /></IconButton></Tooltip>
                      <Tooltip title="Edit task"><IconButton aria-label="Edit task" onClick={() => setManual((current) => ({ open: true, task, preset: task.projectId, key: current.key + 1 }))}><Pencil size={16} /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination component="div" count={rows.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={8} rowsPerPageOptions={[8]} />
        </TableContainer>
      )}
      <TaskFormDialog key={formKey} open={open} task={editing} presetProjectId={presetProjectId} onClose={closeForm} />
    </Stack>
  )
}
