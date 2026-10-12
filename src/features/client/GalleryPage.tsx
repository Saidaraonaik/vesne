import { useMemo, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material'
import { Share2 } from 'lucide-react'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { ProofImage } from '../../components/proof/ProofImage.tsx'
import { ShareWhatsAppDialog } from '../../components/proof/ShareWhatsAppDialog.tsx'
import { panelSx } from '../../theme/theme.ts'
import { formatCoords, formatDate, formatDateTime } from '../../utils/format.ts'
import { findExecutor, findProject, findTask, projectsForClient } from '../../utils/relations.ts'
import { gpsSourceLabel } from '../../utils/status.ts'
import { proofShareMessage, type ProofShare } from '../../utils/whatsapp.ts'
import type { ProofSubmission } from '../../types/models.ts'

export function GalleryPage() {
  const { data, session, notify } = useApp()
  const projects = projectsForClient(data, session?.clientId ?? '')
  const projectIds = new Set(projects.map((project) => project.id))
  const approved = data.submissions
    .filter((submission) => {
      if (submission.status !== 'approved') return false
      const task = findTask(data, submission.taskId)
      return Boolean(task && projectIds.has(task.projectId))
    })
    .sort((a, b) => (b.reviewedAt ?? b.submittedAt).localeCompare(a.reviewedAt ?? a.submittedAt))
  const [projectId, setProjectId] = useState('all')
  const [location, setLocation] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<ProofSubmission | null>(null)
  const [share, setShare] = useState<ProofShare | null>(null)
  const filterKey = `${projectId}|${location}|${from}|${to}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 0 })
  const page = pageState.key === filterKey ? pageState.page : 0
  const setPage = (next: number) => setPageState({ key: filterKey, page: next })

  const locations = useMemo(() => {
    return Array.from(new Set(approved.flatMap((submission) => {
      const task = findTask(data, submission.taskId)
      return task ? [task.locationName] : []
    }))).sort()
  }, [approved, data])

  const rows = approved.filter((submission) => {
    const task = findTask(data, submission.taskId)
    if (!task) return false
    if (projectId !== 'all' && task.projectId !== projectId) return false
    if (location !== 'all' && task.locationName !== location) return false
    const day = (submission.reviewedAt ?? submission.submittedAt).slice(0, 10)
    if (from && day < from) return false
    if (to && day > to) return false
    return true
  })
  const visible = rows.slice(page * 8, page * 8 + 8)

  const shareFor = (submission: ProofSubmission): ProofShare => {
    const task = findTask(data, submission.taskId)
    const project = task ? findProject(data, task.projectId) : null
    const executor = findExecutor(data, submission.executorId)
    const filename = `VESNE-${task?.taskCode ?? 'proof'}.jpg`
    return {
      imageDataUrl: submission.imageDataUrl,
      filename,
      stamp: {
        placeName: submission.placeName || task?.locationName || 'Work location',
        address: submission.locationLabel || task?.address || '',
        lat: submission.lat,
        lng: submission.lng,
        at: submission.submittedAt,
      },
      message: proofShareMessage({
        project: project ? `${project.name} / ${project.campaign}` : 'Project',
        location: task?.locationName ?? 'Work location',
        date: formatDate(submission.reviewedAt ?? submission.submittedAt),
        executor: executor?.name ?? 'Field executor',
        coordinates: `${formatCoords(submission.lat, submission.lng)}`,
        reference: `VESNE-${task?.taskCode ?? submission.id}`,
        filename,
      }),
    }
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Approved proof gallery"
        subtitle="Only approved photographs for your projects. Rejected and pending proof stay with the operations team."
        crumbs={[{ label: 'Client', to: '/client' }, { label: 'Approved proof gallery' }]}
      />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField select size="small" label="Project" value={projectId} onChange={(event) => setProjectId(event.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="all">All projects</MenuItem>
          {projects.map((project) => <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Location" value={location} onChange={(event) => setLocation(event.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="all">All locations</MenuItem>
          {locations.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Status" value="approved" sx={{ minWidth: 160 }}>
          <MenuItem value="approved">Approved</MenuItem>
        </TextField>
        <TextField type="date" size="small" label="From" slotProps={{ inputLabel: { shrink: true } }} value={from} onChange={(event) => setFrom(event.target.value)} />
        <TextField type="date" size="small" label="To" slotProps={{ inputLabel: { shrink: true } }} value={to} onChange={(event) => setTo(event.target.value)} />
      </Stack>
      {rows.length === 0 ? <EmptyState title="No approved proof in this filter" body="When an admin approves a submission for your project, it appears here." /> : (
        <TableContainer sx={panelSx}>
          <Table sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
            <TableHead>
              <TableRow>
                <TableCell>Proof</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((submission) => {
                const task = findTask(data, submission.taskId)
                const project = task ? findProject(data, task.projectId) : null
                return (
                  <TableRow key={submission.id} hover>
                    <TableCell>
                      <Box component="img" src={submission.imageDataUrl} alt={task?.locationName ?? 'Approved proof'} sx={{ width: 72, height: 48, objectFit: 'cover', borderRadius: '4px', display: 'block', bgcolor: '#F4F7FA' }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{project?.campaign || project?.name || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{task?.taskCode || '—'}</TableCell>
                    <TableCell>{task?.locationName || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(submission.reviewedAt ?? submission.submittedAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status="approved" label="Approved" />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <Button size="small" variant="contained" onClick={() => setSelected(submission)}>Details</Button>
                        <Button size="small" variant="outlined" startIcon={<Share2 size={14} />} onClick={() => setShare(shareFor(submission))}>Share image</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination component="div" count={rows.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={8} rowsPerPageOptions={[8]} />
        </TableContainer>
      )}
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        <DialogTitle>{selected ? findTask(data, selected.taskId)?.locationName : 'Proof'}</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={1}>
              <ProofImage
                src={selected.imageDataUrl}
                alt="Approved proof"
                lines={[]}
                stamp={{
                  placeName: selected.placeName || findTask(data, selected.taskId)?.locationName || 'Work location',
                  address: selected.locationLabel,
                  lat: selected.lat,
                  lng: selected.lng,
                  at: selected.submittedAt,
                }}
                filename={`VESNE-${findTask(data, selected.taskId)?.taskCode ?? 'proof'}.jpg`}
              />
              <Typography>Reference: VESNE-{findTask(data, selected.taskId)?.taskCode}</Typography>
              <Typography>Completed {formatDateTime(selected.reviewedAt ?? selected.submittedAt)}</Typography>
              <Typography>Coordinates: {formatCoords(selected.lat, selected.lng)}</Typography>
              <Typography variant="body2" color="text.secondary">{gpsSourceLabel(selected.gpsSource)} Address: {selected.locationLabel}</Typography>
              <Typography>Executor: {findExecutor(data, selected.executorId)?.name}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
          {selected && <Button variant="contained" startIcon={<Share2 size={16} />} onClick={() => setShare(shareFor(selected))}>Share image</Button>}
        </DialogActions>
      </Dialog>
      <ShareWhatsAppDialog open={Boolean(share)} share={share} onClose={() => setShare(null)} onNotify={notify} />
    </Stack>
  )
}
