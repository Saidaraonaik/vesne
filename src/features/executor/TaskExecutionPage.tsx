import { useState, type ReactNode } from 'react'
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { Camera, LocateFixed, Upload } from 'lucide-react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { SectionCard } from '../../components/layout/AppShell.tsx'
import { ProofImage } from '../../components/proof/ProofImage.tsx'
import { formatCoords, formatDate, formatDateTime } from '../../utils/format.ts'
import { readImageFile } from '../../utils/images.ts'
import { findExecutor, findProject, latestSubmission } from '../../utils/relations.ts'
import { gpsSourceLabel, taskStatusLabel } from '../../utils/status.ts'
import type { GpsSource } from '../../types/models.ts'

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#5E7082', lineHeight: 1.45, whiteSpace: 'nowrap' }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#5E7082', lineHeight: 1.45, textAlign: 'center' }}>:</Typography>
      <Box sx={{ minWidth: 0, fontSize: 14, fontWeight: 650, color: '#1A2633', lineHeight: 1.45 }}>{value === '' || value == null ? '—' : value}</Box>
    </>
  )
}

const passportFrameSx = {
  width: 140,
  height: 180,
  borderRadius: '4px',
  border: '1px solid #E6EEF2',
  bgcolor: '#F4F7FA',
} as const

export function TaskExecutionPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const { data, session, startTask, submitProof, notify } = useApp()
  const task = data.tasks.find((item) => item.id === taskId && item.executorId === session?.executorId)
  const [image, setImage] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [gpsSource, setGpsSource] = useState<GpsSource | null>(null)
  const [gpsError, setGpsError] = useState('')
  const [address, setAddress] = useState(task?.address ?? '')
  const [documentName, setDocumentName] = useState('')
  const [videoName, setVideoName] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [capturedAt, setCapturedAt] = useState<string | null>(null)

  if (!task || !session?.executorId) {
    return <EmptyState title="Task unavailable" body="This task is not assigned to the signed-in executor." action={<Button component={RouterLink} to="/executor/tasks">Back to my tasks</Button>} />
  }

  const project = findProject(data, task.projectId)
  const executor = findExecutor(data, task.executorId)
  const latest = latestSubmission(data, task.id)
  const locked = task.status === 'awaiting_verification' || task.status === 'completed'
  const step = task.status === 'completed' ? 4 : task.status === 'rejected' ? 3 : task.status === 'awaiting_verification' ? 3 : task.status === 'in_progress' ? 1 : 0
  const lines = [
    'Vesne',
    capturedAt ? formatDateTime(capturedAt) : 'Date not captured yet',
    lat != null && lng != null ? formatCoords(lat, lng) : 'Location not captured',
    `${executor?.name ?? session.name} · ${executor?.executorCode ?? ''}`,
    task.taskCode,
  ]

  const onImage = async (file: File | undefined) => {
    if (!file) return
    try {
      setImage(await readImageFile(file))
      setCapturedAt(new Date().toISOString())
      setFormError('')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not read that image.')
    }
  }

  const captureGps = () => {
    setGpsError('')
    if (!navigator.geolocation) {
      setGpsError('This browser has no geolocation. Allow location access and try again.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLng(position.coords.longitude)
        setGpsSource('device')
        setCapturedAt(new Date().toISOString())
      },
      () => setGpsError('Location permission was denied or GPS is unavailable.'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const submit = () => {
    if (task.requiredProofTypes.includes('photo') && !image) {
      setFormError('Add a proof photograph before submitting.')
      return
    }
    if (task.requiredProofTypes.includes('document') && !documentName) {
      setFormError('Attach the required document before submitting.')
      return
    }
    if (task.requiredProofTypes.includes('video') && !videoName) {
      setFormError('Select the required video before submitting.')
      return
    }
    if (lat == null || lng == null || !gpsSource) {
      setFormError('Capture GPS before submitting.')
      return
    }
    setBusy(true)
    window.setTimeout(() => {
      const ok = submitProof({
        taskId: task.id,
        executorId: session.executorId!,
        imageDataUrl: image,
        lat,
        lng,
        locationLabel: address,
        gpsSource,
        documentName: documentName || undefined,
        videoName: videoName || undefined,
      })
      setBusy(false)
      if (ok) setDone(true)
    }, 400)
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title={task.locationName}
        subtitle={`${task.taskCode} · ${project?.name ?? ''}`}
        crumbs={[{ label: 'Executor', to: '/executor' }, { label: 'My tasks', to: '/executor/tasks' }, { label: task.taskCode }]}
      />
      <Stepper activeStep={step} alternativeLabel sx={{ display: { xs: 'none', sm: 'flex' } }}>
        {['Assigned', 'Capture proof', 'Submit', 'Verification', 'Completed'].map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <StatusBadge status={task.status} label={taskStatusLabel(task.status, 'executor')} />
        {task.status === 'rejected' && <Chip color="warning" label="Resubmit proof" />}
      </Stack>
      {task.status === 'awaiting_verification' && <Alert severity="info">This proof is awaiting admin verification. You can follow it in submission history.</Alert>}
      {task.status === 'completed' && <Alert severity="success">This work is approved and completed. The client can see the approved proof.</Alert>}
      {task.status === 'rejected' && latest?.rejectionReason && (
        <Alert severity="error">
          <strong>Rejection reason.</strong> {latest.rejectionReason}
          {latest.verificationRemarks ? ` Remarks: ${latest.verificationRemarks}` : ''}
        </Alert>
      )}
      <Box sx={{ display: 'grid', gap: 2, alignItems: 'start', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(360px, 460px)' } }}>
        <SectionCard title="Task information">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'max-content 10px minmax(0, 1fr)',
              columnGap: 1.5,
              rowGap: 1.15,
              alignItems: 'start',
            }}
          >
            <Fact label="Project" value={project?.name} />
            <Fact label="Campaign" value={project?.campaign} />
            <Fact label="Instructions" value={task.instructions} />
            {project?.executorInstructions ? <Fact label="Project instructions" value={project.executorInstructions} /> : null}
            <Fact label="Address" value={task.address} />
            <Fact label="Target" value={formatDate(task.targetDate)} />
            <Fact label="Required proof" value={task.requiredProofTypes.join(', ')} />
            <Fact label="Executor" value={executor ? `${executor.name} · ${executor.executorCode}` : ''} />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ mb: 0.75, fontSize: 12, fontWeight: 700, color: '#5E7082' }}>Reference image</Typography>
            {task.referenceImage ? (
              <Box
                component="img"
                src={task.referenceImage}
                alt="Reference photograph"
                sx={{ ...passportFrameSx, objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
              />
            ) : (
              <Box sx={{ ...passportFrameSx, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 1, color: '#5E7082', fontSize: 12, lineHeight: 1.4 }}>
                No reference image
              </Box>
            )}
          </Box>
        </SectionCard>
        <SectionCard title={locked ? 'Submitted proof' : 'Capture proof'}>
          {locked && latest ? (
            <ProofImage
              src={latest.imageDataUrl}
              alt="Submitted proof"
              lines={['Vesne', formatDateTime(latest.submittedAt), formatCoords(latest.lat, latest.lng), `${executor?.name} · ${executor?.executorCode}`, task.taskCode]}
              filename={`${task.taskCode}-proof.jpg`}
              onDownloaded={() => notify('Watermarked image downloaded.', 'success')}
              onFailed={(message) => notify(message, 'error')}
            />
          ) : (
            <Stack spacing={1.5}>
              {task.status === 'assigned' && (
                <Button variant="outlined" onClick={() => startTask(task.id)} sx={{ alignSelf: 'flex-start' }}>Start task</Button>
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button component="label" variant="contained" startIcon={<Camera size={16} />}>
                  Take photo
                  <input hidden type="file" accept="image/*" capture="environment" onChange={(event) => void onImage(event.target.files?.[0])} />
                </Button>
                <Button component="label" variant="outlined" startIcon={<Upload size={16} />}>
                  Upload from device
                  <input hidden type="file" accept="image/*" onChange={(event) => void onImage(event.target.files?.[0])} />
                </Button>
                {image && <Button color="inherit" onClick={() => setImage('')}>Remove image</Button>}
              </Stack>
              {task.requiredProofTypes.includes('document') && (
                <Button component="label" variant="outlined">
                  {documentName ? `Document: ${documentName}` : 'Attach document'}
                  <input hidden type="file" accept=".pdf,.doc,.docx,image/*" onChange={(event) => setDocumentName(event.target.files?.[0]?.name ?? '')} />
                </Button>
              )}
              {task.requiredProofTypes.includes('video') && (
                <Button component="label" variant="outlined">
                  {videoName ? `Video: ${videoName}` : 'Select video'}
                  <input hidden type="file" accept="video/*" onChange={(event) => setVideoName(event.target.files?.[0]?.name ?? '')} />
                </Button>
              )}
              <Typography variant="caption" color="text.secondary">
                Video and document files are recorded by name only. They are not uploaded to a server.
              </Typography>
              <Button variant="outlined" startIcon={<LocateFixed size={16} />} onClick={captureGps} sx={{ alignSelf: 'flex-start' }}>Capture GPS</Button>
              {gpsError && <Alert severity="warning">{gpsError}</Alert>}
              <TextField label="Latitude" value={lat ?? ''} disabled helperText={gpsSource ? gpsSourceLabel(gpsSource) : 'Not captured yet'} />
              <TextField label="Longitude" value={lng ?? ''} disabled />
              <TextField label="Location / address" value={address} onChange={(event) => setAddress(event.target.value)} />
              <TextField label="Capture date and time" value={capturedAt ? formatDateTime(capturedAt) : 'Set when you add a photo or location'} disabled />
              {image && (
                <ProofImage
                  src={image}
                  alt="Proof preview"
                  lines={lines}
                  filename={`${task.taskCode}-proof.jpg`}
                  onDownloaded={() => notify('Watermarked image downloaded.', 'success')}
                  onFailed={(message) => notify(message, 'error')}
                />
              )}
              {formError && <Alert severity="error">{formError}</Alert>}
              <Button variant="contained" size="large" disabled={busy} onClick={submit}>
                {busy ? 'Submitting…' : 'Submit for verification'}
              </Button>
            </Stack>
          )}
        </SectionCard>
      </Box>
      <Dialog open={done} onClose={() => setDone(false)}>
        <DialogTitle>Submitted for verification</DialogTitle>
        <DialogContent>
          <Typography>The proof is now in the admin verification queue.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/executor/submissions')}>Submission history</Button>
          <Button variant="contained" onClick={() => navigate('/executor/tasks')}>Back to my tasks</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
