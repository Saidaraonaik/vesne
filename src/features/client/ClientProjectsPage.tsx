import { useState } from 'react'
import { Button, LinearProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { panelSx } from '../../theme/theme.ts'
import { formatDate } from '../../utils/format.ts'
import { projectStats } from '../../utils/metrics.ts'
import { projectsForClient } from '../../utils/relations.ts'
import { projectStatusLabel } from '../../utils/status.ts'

export function ClientProjectsPage() {
  const { data, session } = useApp()
  const projects = projectsForClient(data, session?.clientId ?? '')
  const [page, setPage] = useState(0)
  const visible = projects.slice(page * 8, page * 8 + 8)

  return (
    <Stack spacing={2}>
      <PageHeader
        title="My projects"
        subtitle="Campaigns linked to your client account. Internal notes and other clients are hidden."
        crumbs={[{ label: 'Client', to: '/client' }, { label: 'My projects' }]}
      />
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" body="Projects linked to this client account will appear here." />
      ) : (
        <TableContainer sx={panelSx}>
          <Table sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Campaign</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Locations</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((project) => {
                const stats = projectStats(data, project.id)
                const pending = stats.total - stats.completed
                return (
                  <TableRow key={project.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{project.name}</TableCell>
                    <TableCell>{project.campaign}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(project.startDate)} – {formatDate(project.endDate)}</TableCell>
                    <TableCell>{stats.total}</TableCell>
                    <TableCell>{stats.completed}</TableCell>
                    <TableCell>{pending}</TableCell>
                    <TableCell sx={{ minWidth: 140, whiteSpace: 'nowrap' }}>
                      {stats.percent}%
                      <LinearProgress variant="determinate" value={stats.percent} sx={{ mt: 0.5, height: 6, borderRadius: 99 }} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={project.status} label={projectStatusLabel(project.status)} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Button component={RouterLink} to={`/client/projects/${project.id}`} variant="contained" size="small">View project</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination component="div" count={projects.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={8} rowsPerPageOptions={[8]} />
        </TableContainer>
      )}
    </Stack>
  )
}
