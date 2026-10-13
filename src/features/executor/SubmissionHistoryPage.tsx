import { useState } from 'react'
import { Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { panelSx } from '../../theme/theme.ts'
import { formatDateTime } from '../../utils/format.ts'
import { findProject, findTask } from '../../utils/relations.ts'
import { proofStatusLabel } from '../../utils/status.ts'
import type { ProofStatus } from '../../types/models.ts'

export function SubmissionHistoryPage() {
  const { data, session } = useApp()
  const [status, setStatus] = useState<'all' | ProofStatus>('all')
  const rows = data.submissions
    .filter((submission) => submission.executorId === session?.executorId)
    .filter((submission) => status === 'all' || submission.status === status)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Submission history"
        subtitle="Proof you submitted, including admin remarks and rejection reasons."
        crumbs={[{ label: 'Executor', to: '/executor' }, { label: 'Submission history' }]}
      />
      <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value as 'all' | ProofStatus)} sx={{ maxWidth: 280 }}>
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="awaiting_verification">Awaiting verification</MenuItem>
        <MenuItem value="approved">Approved</MenuItem>
        <MenuItem value="rejected">Rejected</MenuItem>
      </TextField>
      {rows.length === 0 ? <EmptyState title="No submissions yet" body="Open an assigned task and submit a photograph." /> : (
        <Stack spacing={1.25}>
          {rows.map((submission) => {
            const task = findTask(data, submission.taskId)
            const project = task ? findProject(data, task.projectId) : null
            return (
              <Box key={submission.id} sx={{ ...panelSx, p: 1.75, display: 'flex', gap: 1.75, alignItems: 'flex-start' }}>
                <Box
                  component="img"
                  src={submission.imageDataUrl}
                  alt=""
                  sx={{ width: 88, height: 64, objectFit: 'cover', borderRadius: '8px', flexShrink: 0, bgcolor: '#F4F7FA', display: 'block' }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800, color: '#1A2633', lineHeight: 1.3 }}>{task?.taskCode} · {project?.name}</Typography>
                      <Typography sx={{ mt: 0.25, fontSize: 13, color: '#5E7082' }}>{formatDateTime(submission.submittedAt)}</Typography>
                    </Box>
                    <Box sx={{ flexShrink: 0 }}>
                      <StatusBadge status={submission.status} label={proofStatusLabel(submission.status)} />
                    </Box>
                  </Stack>
                  {submission.verificationRemarks && (
                    <Typography sx={{ mt: 1, fontSize: 14, lineHeight: 1.45, color: '#1A2633' }}>
                      Remarks: {submission.verificationRemarks}
                    </Typography>
                  )}
                  {submission.rejectionReason && (
                    <Typography sx={{ mt: 1, fontSize: 14, lineHeight: 1.45, color: '#1A2633' }}>
                      Rejection reason: {submission.rejectionReason}
                    </Typography>
                  )}
                  {submission.status === 'rejected' && task?.status === 'rejected' && (
                    <Button component={RouterLink} to={`/executor/tasks/${task.id}`} variant="contained" size="small" sx={{ mt: 1.25, alignSelf: 'flex-start', width: 'fit-content' }}>
                      Resubmit proof
                    </Button>
                  )}
                </Box>
              </Box>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
