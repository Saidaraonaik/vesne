import { useMemo, useState, type ReactNode } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tabs, TextField, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { ShareWhatsAppDialog } from '../../components/proof/ShareWhatsAppDialog.tsx'
import { panelSx } from '../../theme/theme.ts'
import { proofShareMessage, type ProofShare } from '../../utils/whatsapp.ts'
import { formatCoords, formatDateTime } from '../../utils/format.ts'
import { findClient, findExecutor, findProject, findTask, submissionsForTask } from '../../utils/relations.ts'
import { gpsSourceLabel, proofStatusLabel } from '../../utils/status.ts'
import type { ProofStatus, ProofSubmission } from '../../types/models.ts'

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#5E7082', lineHeight: 1.45, whiteSpace: 'nowrap' }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#5E7082', lineHeight: 1.45, textAlign: 'center' }}>:</Typography>
      <Box sx={{ minWidth: 0, fontSize: 14, fontWeight: 650, color: '#1A2633', lineHeight: 1.45 }}>{value === '' || value == null ? '—' : value}</Box>
    </>
  )
}

const TABS: { value: ProofStatus; label: string }[] = [
  { value: 'awaiting_verification', label: 'Awaiting verification' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export function VerificationPage() {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const { data, reviewProof, notify } = useApp()
  const [tab, setTab] = useState<ProofStatus>('awaiting_verification')
  const [query, setQuery] = useState('')
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const routed = submissionId ? data.submissions.find((item) => item.id === submissionId) : undefined
  const activeId = routed?.id ?? pickedId
  const currentTab = routed?.status ?? tab
  const filterKey = `${currentTab}|${query}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 0 })
  const page = pageState.key === filterKey ? pageState.page : 0
  const setPage = (next: number) => setPageState({ key: filterKey, page: next })

  const rows = useMemo(() => data.submissions.filter((submission) => {
    if (submission.status !== currentTab) return false
    const task = findTask(data, submission.taskId)
    const project = task ? findProject(data, task.projectId) : null
    const client = project ? findClient(data, project.clientId) : null
    const executor = findExecutor(data, submission.executorId)
    const haystack = `${task?.taskCode ?? ''} ${task?.locationName ?? ''} ${project?.name ?? ''} ${client?.company ?? ''} ${executor?.name ?? ''}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  }), [currentTab, data, query])
  const visible = rows.slice(page * 8, page * 8 + 8)

  const active = data.submissions.find((item) => item.id === activeId) ?? null

  const close = () => {
    setPickedId(null)
    setReason('')
    setReasonError('')
    setRejecting(false)
    if (submissionId) navigate('/admin/verification')
  }

  const open = (submission: ProofSubmission) => {
    setPickedId(submission.id)
    setReason('')
    setReasonError('')
    setRejecting(false)
    if (submissionId && submissionId !== submission.id) navigate(`/admin/verification/${submission.id}`)
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Proof verification"
        subtitle="Approve work to publish it in the client portal, or reject it with a reason the executor can see."
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Proof verification' }]}
      />
      <Tabs value={currentTab} onChange={(_, value: ProofStatus) => { setTab(value); setPickedId(null); if (submissionId) navigate('/admin/verification') }} variant="scrollable">
        {TABS.map((item) => (
          <Tab key={item.value} value={item.value} label={`${item.label} (${data.submissions.filter((submission) => submission.status === item.value).length})`} />
        ))}
      </Tabs>
      <TextField size="small" label="Search submissions" value={query} onChange={(event) => setQuery(event.target.value)} />
      {rows.length === 0 ? (
        <EmptyState title="Nothing in this queue" body="Submissions appear here after an executor uploads proof." />
      ) : (
        <TableContainer sx={panelSx}>
          <Table sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
            <TableHead>
              <TableRow>
                <TableCell>Proof</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Submitted</TableCell>
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
                      <Box component="img" src={submission.imageDataUrl} alt="" sx={{ width: 72, height: 48, objectFit: 'cover', borderRadius: '4px', display: 'block', bgcolor: '#F4F7FA' }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{task?.taskCode || '—'}</TableCell>
                    <TableCell>{project?.name || '—'}</TableCell>
                    <TableCell>{task?.locationName || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(submission.submittedAt)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={submission.status} label={proofStatusLabel(submission.status)} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Button variant="contained" size="small" onClick={() => open(submission)}>Open review</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination component="div" count={rows.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={8} rowsPerPageOptions={[8]} />
        </TableContainer>
      )}
      <ReviewDialog
        submission={active}
        reason={reason}
        rejecting={rejecting}
        reasonError={reasonError}
        onReason={(value) => { setReason(value); setReasonError('') }}
        onClose={close}
        onApprove={() => {
          if (!active) return
          if (reviewProof({ submissionId: active.id, decision: 'approved', rejectionReason: '', remarks: '' })) close()
        }}
        onReject={() => {
          if (!active) return
          if (!rejecting) {
            setRejecting(true)
            return
          }
          if (!reason.trim()) {
            setReasonError('Enter a rejection reason before rejecting this proof.')
            return
          }
          if (reviewProof({ submissionId: active.id, decision: 'rejected', rejectionReason: reason, remarks: '' })) close()
        }}
        onNotify={notify}
      />
    </Stack>
  )
}

function ReviewDialog({
  submission,
  reason,
  rejecting,
  reasonError,
  onReason,
  onClose,
  onApprove,
  onReject,
  onNotify,
}: {
  submission: ProofSubmission | null
  reason: string
  rejecting: boolean
  reasonError: string
  onReason: (value: string) => void
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  onNotify: (message: string, severity?: 'success' | 'error' | 'info') => void
}) {
  const { data } = useApp()
  const [share, setShare] = useState<ProofShare | null>(null)
  if (!submission) {
    return <Dialog open={false} onClose={onClose}><div /></Dialog>
  }
  const task = findTask(data, submission.taskId)
  const project = task ? findProject(data, task.projectId) : null
  const client = project ? findClient(data, project.clientId) : null
  const executor = findExecutor(data, submission.executorId)
  const prior = submissionsForTask(data, submission.taskId).find((item) => item.id !== submission.id && item.status === 'rejected')
  const waiting = submission.status === 'awaiting_verification'
  const filename = `VESNE-${task?.taskCode ?? 'proof'}.jpg`

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Review {task?.taskCode}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' } }}>
          <Stack spacing={1}>
            <Box component="img" src={submission.imageDataUrl} alt="Submitted proof" sx={{ width: '100%', borderRadius: 2, maxHeight: 460, objectFit: 'contain', bgcolor: '#F4F7FA' }} />
            <Typography variant="caption" color="text.secondary">
              The proof preview includes a location overlay. Coordinates here are {gpsSourceLabel(submission.gpsSource)}
            </Typography>
          </Stack>
          <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <StatusBadge status={submission.status} label={proofStatusLabel(submission.status)} />
            <Box
              sx={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'max-content 10px minmax(0, 1fr)',
                columnGap: 1.5,
                rowGap: 1.15,
                alignItems: 'start',
              }}
            >
              <Fact label="Project" value={project?.name} />
              <Fact label="Client" value={client?.name} />
              <Fact label="Executor" value={executor ? `${executor.name} · ${executor.executorCode}` : ''} />
              <Fact label="Location" value={task?.locationName} />
              <Fact label="Address" value={submission.locationLabel} />
              <Fact label="Submitted" value={formatDateTime(submission.submittedAt)} />
              <Fact label="Coordinates" value={formatCoords(submission.lat, submission.lng)} />
              <Fact label="Task instructions" value={task?.instructions} />
            </Box>
            {task?.referenceImage && (
              <Box>
                <Typography sx={{ mb: 0.75, fontSize: 12, fontWeight: 700, color: '#5E7082' }}>Reference image</Typography>
                <Box
                  component="img"
                  src={task.referenceImage}
                  alt="Reference"
                  sx={{ width: 140, height: 180, objectFit: 'cover', objectPosition: 'center top', display: 'block', borderRadius: '4px', border: '1px solid #E6EEF2', bgcolor: '#F4F7FA' }}
                />
              </Box>
            )}
            {prior?.rejectionReason && <Alert severity="warning" sx={{ width: '100%' }}>Previous rejection: {prior.rejectionReason}</Alert>}
            {submission.rejectionReason && <Alert severity="error" sx={{ width: '100%' }}>Rejection reason: {submission.rejectionReason}</Alert>}
            {submission.verificationRemarks && !waiting && <Alert severity="info" sx={{ width: '100%' }}>Remarks: {submission.verificationRemarks}</Alert>}
            {waiting && rejecting && (
              <TextField
                autoFocus
                fullWidth
                label="Rejection reason"
                value={reason}
                onChange={(event) => onReason(event.target.value)}
                multiline
                minRows={3}
                error={Boolean(reasonError)}
                helperText={reasonError || 'The executor sees this text.'}
              />
            )}
            <Button
              variant="outlined"
              onClick={() => setShare({
                imageDataUrl: submission.imageDataUrl,
                filename,
                message: proofShareMessage({
                  project: project ? `${project.name} / ${project.campaign}` : 'Project',
                  location: task?.locationName ?? 'Work location',
                  date: formatDateTime(submission.submittedAt),
                  executor: executor?.name ?? 'Field executor',
                  coordinates: `${formatCoords(submission.lat, submission.lng)}`,
                  reference: `VESNE-${task?.taskCode ?? submission.id}`,
                  filename,
                  status: proofStatusLabel(submission.status),
                }),
              })}
            >
              Share proof image
            </Button>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {waiting && <Button color="error" variant="outlined" onClick={onReject}>{rejecting ? 'Confirm rejection' : 'Reject proof'}</Button>}
        {waiting && <Button variant="contained" onClick={onApprove}>Approve proof</Button>}
      </DialogActions>
      <ShareWhatsAppDialog open={Boolean(share)} share={share} onClose={() => setShare(null)} onNotify={onNotify} />
    </Dialog>
  )
}
