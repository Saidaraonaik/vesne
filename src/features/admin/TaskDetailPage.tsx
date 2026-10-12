import { useState, type ReactNode } from 'react'
import { Button, Chip, Stack, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { SectionCard } from '../../components/layout/AppShell.tsx'
import { ProofImage } from '../../components/proof/ProofImage.tsx'
import { ShareWhatsAppDialog } from '../../components/proof/ShareWhatsAppDialog.tsx'
import { proofShareMessage, type ProofShare } from '../../utils/whatsapp.ts'
import { formatCoords, formatDate, formatDateTime } from '../../utils/format.ts'
import { findClient, findExecutor, findProject, submissionsForTask } from '../../utils/relations.ts'
import { gpsSourceLabel, proofStatusLabel, taskStatusLabel } from '../../utils/status.ts'
import { TaskFormDialog } from './TaskFormDialog.tsx'

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#5E7082', lineHeight: 1.45, whiteSpace: 'nowrap' }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#5E7082', lineHeight: 1.45, textAlign: 'center' }}>:</Typography>
      <Box sx={{ minWidth: 0, fontSize: 14, fontWeight: 650, color: '#1A2633', lineHeight: 1.45 }}>{value === '' || value == null ? '—' : value}</Box>
    </>
  )
}

export function TaskDetailPage() {
  const { taskId } = useParams()
  const { data, notify } = useApp()
  const task = data.tasks.find((item) => item.id === taskId)
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [share, setShare] = useState<ProofShare | null>(null)
  if (!task) {
    return <EmptyState title="Task not found" body="This work location is not in the current workspace." action={<Button component={RouterLink} to="/admin/tasks">Back to tasks</Button>} />
  }
  const project = findProject(data, task.projectId)
  const client = project ? findClient(data, project.clientId) : null
  const executor = findExecutor(data, task.executorId)
  const history = submissionsForTask(data, task.id)
  const latest = history[0]

  return (
    <Stack spacing={2}>
      <PageHeader
        title={`${task.taskCode} · ${task.locationName}`}
        subtitle="Work location, assignment, and proof history."
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Tasks', to: '/admin/tasks' }, { label: task.taskCode }]}
        actions={<Button variant="contained" onClick={() => { setFormKey((key) => key + 1); setOpen(true) }}>Edit task</Button>}
      />
      <SectionCard title="Assignment">
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' } }}>
          <Box
            sx={{
              flex: '0 1 auto',
              width: 'fit-content',
              maxWidth: '100%',
              display: 'grid',
              gridTemplateColumns: 'max-content 10px minmax(12rem, 26rem)',
              columnGap: 1.5,
              rowGap: 1.15,
              alignItems: 'start',
            }}
          >
            <Fact label="Project" value={project?.name} />
            <Fact label="Campaign" value={project?.campaign} />
            <Fact label="Client" value={client?.name} />
            <Fact label="Address" value={task.address} />
            <Fact label="Coordinates" value={formatCoords(task.lat, task.lng)} />
            <Fact label="Executor" value={executor ? `${executor.name} · ${executor.executorCode}` : ''} />
            <Fact label="Target" value={formatDate(task.targetDate)} />
            <Fact label="Quantity" value={task.quantity} />
            <Fact label="Instructions" value={task.instructions} />
            <Fact
              label="Proof"
              value={
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {task.requiredProofTypes.map((type) => <Chip key={type} size="small" label={type} />)}
                </Stack>
              }
            />
            <Fact label="Status" value={<StatusBadge status={task.status} label={taskStatusLabel(task.status)} />} />
          </Box>
          <Box sx={{ flex: '0 0 auto' }}>
            <Typography sx={{ mb: 0.75, fontSize: 12, fontWeight: 700, color: '#5E7082' }}>Reference image</Typography>
            {task.referenceImage ? (
              <Box
                component="img"
                src={task.referenceImage}
                alt="Reference artwork"
                sx={{
                  width: 140,
                  height: 180,
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                  borderRadius: '4px',
                  border: '1px solid #E6EEF2',
                  bgcolor: '#F4F7FA',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 140,
                  height: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  px: 1,
                  borderRadius: '4px',
                  border: '1px solid #E6EEF2',
                  bgcolor: '#F4F7FA',
                  color: '#5E7082',
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                No reference image
              </Box>
            )}
          </Box>
        </Box>
      </SectionCard>
      <SectionCard title="Proof history">
        {history.length === 0 ? (
          <Typography color="text.secondary">No proof has been submitted for this location.</Typography>
        ) : (
          <Stack spacing={2}>
            {latest && (
              <Button
                sx={{ mb: 1.5 }}
                variant="outlined"
                onClick={() => {
                  const filename = `VESNE-${task.taskCode}.jpg`
                  setShare({
                    imageDataUrl: latest.imageDataUrl,
                    filename,
                    message: proofShareMessage({
                      project: project ? `${project.name} / ${project.campaign}` : 'Project',
                      location: task.locationName,
                      date: formatDateTime(latest.submittedAt),
                      executor: executor?.name ?? 'Field executor',
                      coordinates: `${formatCoords(latest.lat, latest.lng)}`,
                      reference: `VESNE-${task.taskCode}`,
                      filename,
                      status: proofStatusLabel(latest.status),
                    }),
                  })
                }}
              >
                Share current proof image
              </Button>
            )}
            {latest && (
              <ProofImage
                src={latest.imageDataUrl}
                alt={`${task.taskCode} proof`}
                filename={`${task.taskCode}-proof.jpg`}
                lines={['Vesne', task.taskCode, formatDateTime(latest.submittedAt), formatCoords(latest.lat, latest.lng), executor?.name ?? 'Executor']}
                onDownloaded={() => notify('Watermarked image downloaded.', 'success')}
                onFailed={(message) => notify(message, 'error')}
              />
            )}
            {history.map((submission) => (
              <Box key={submission.id} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                  <StatusBadge status={submission.status} label={proofStatusLabel(submission.status)} />
                  <Typography variant="body2">{formatDateTime(submission.submittedAt)}</Typography>
                </Stack>
                <Typography variant="body2">GPS: {formatCoords(submission.lat, submission.lng)} · {gpsSourceLabel(submission.gpsSource)}</Typography>
                {submission.rejectionReason && <Typography variant="body2">Rejection reason: {submission.rejectionReason}</Typography>}
                {submission.verificationRemarks && <Typography variant="body2">Remarks: {submission.verificationRemarks}</Typography>}
              </Box>
            ))}
          </Stack>
        )}
      </SectionCard>
      <TaskFormDialog key={formKey} open={open} task={task} onClose={() => setOpen(false)} />
      <ShareWhatsAppDialog open={Boolean(share)} share={share} onClose={() => setShare(null)} onNotify={notify} />
    </Stack>
  )
}
