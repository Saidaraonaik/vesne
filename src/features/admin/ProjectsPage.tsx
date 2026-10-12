import { useMemo, useState } from 'react'
import { Button, IconButton, LinearProgress, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip } from '@mui/material'
import { Eye, Pencil, Plus } from 'lucide-react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { panelSx } from '../../theme/theme.ts'
import type { Project } from '../../types/models.ts'
import { PROJECT_STATUSES } from '../../types/models.ts'
import { formatDate } from '../../utils/format.ts'
import { projectStats } from '../../utils/metrics.ts'
import { findClient } from '../../utils/relations.ts'
import { projectStatusLabel } from '../../utils/status.ts'
import { ProjectFormDialog } from './ProjectFormDialog.tsx'

export function ProjectsPage() {
  const { data } = useApp()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [clientId, setClientId] = useState('all')
  const [status, setStatus] = useState('all')
  const filterKey = `${query}|${clientId}|${status}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 0 })
  const page = pageState.key === filterKey ? pageState.page : 0
  const setPage = (next: number) => setPageState({ key: filterKey, page: next })
  const [manual, setManual] = useState<{ open: boolean; project: Project | null; key: number }>({ open: false, project: null, key: 0 })
  const editId = params.get('edit')
  const fromParams = params.get('new') === '1' || Boolean(editId)
  const editing = fromParams ? (editId ? data.projects.find((project) => project.id === editId) ?? null : null) : manual.project
  const open = fromParams || manual.open
  const formKey = `${editId ?? 'new'}-${manual.key}`

  const rows = useMemo(() => {
    return data.projects.filter((project) => {
      const client = findClient(data, project.clientId)
      const haystack = `${project.name} ${project.campaign} ${client?.company ?? ''}`.toLowerCase()
      return haystack.includes(query.trim().toLowerCase())
        && (clientId === 'all' || project.clientId === clientId)
        && (status === 'all' || project.status === status)
    })
  }, [clientId, data, query, status])

  const visible = rows.slice(page * 8, page * 8 + 8)
  const closeForm = () => {
    setManual((current) => ({ open: false, project: null, key: current.key }))
    if (fromParams) setParams({}, { replace: true })
  }
  const openCreate = () => setManual((current) => ({ open: true, project: null, key: current.key + 1 }))
  const openEdit = (project: Project) => setManual((current) => ({ open: true, project, key: current.key + 1 }))

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Projects"
        subtitle="Campaigns, budgets, instructions, and the proof each site must collect."
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Projects' }]}
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}>Create project</Button>}
      />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField size="small" label="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth />
        <TextField select size="small" label="Client" value={clientId} onChange={(event) => setClientId(event.target.value)} sx={{ minWidth: 220 }}>
          <MenuItem value="all">All clients</MenuItem>
          {data.clients.map((client) => <MenuItem key={client.id} value={client.id}>{client.company}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All statuses</MenuItem>
          {PROJECT_STATUSES.map((item) => <MenuItem key={item} value={item}>{projectStatusLabel(item)}</MenuItem>)}
        </TextField>
      </Stack>
      {rows.length === 0 ? (
        <EmptyState title="No projects match" body="Adjust the filters or create a project." action={<Button variant="contained" onClick={openCreate}>Create project</Button>} />
      ) : (
        <TableContainer sx={panelSx}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Locations</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((project) => {
                const stats = projectStats(data, project.id)
                const client = findClient(data, project.clientId)
                return (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <strong>{project.name}</strong>
                      <div>{project.campaign}</div>
                    </TableCell>
                    <TableCell>{client?.company}</TableCell>
                    <TableCell>{formatDate(project.startDate)} – {formatDate(project.endDate)}</TableCell>
                    <TableCell>{stats.total}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      {stats.percent}%
                      <LinearProgress variant="determinate" value={stats.percent} sx={{ mt: 0.5, height: 6, borderRadius: 99 }} />
                    </TableCell>
                    <TableCell><StatusBadge status={project.status} label={projectStatusLabel(project.status)} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="View project"><IconButton component={RouterLink} to={`/admin/projects/${project.id}`} aria-label="View project"><Eye size={16} /></IconButton></Tooltip>
                      <Tooltip title="Edit project"><IconButton aria-label="Edit project" onClick={() => openEdit(project)}><Pencil size={16} /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination component="div" count={rows.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={8} rowsPerPageOptions={[8]} />
        </TableContainer>
      )}
      <ProjectFormDialog key={formKey} open={open} project={editing} onClose={closeForm} />
    </Stack>
  )
}
