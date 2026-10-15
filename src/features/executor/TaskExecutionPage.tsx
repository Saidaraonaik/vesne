import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { Camera, LocateFixed } from 'lucide-react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { ImageUploadField } from '../../components/common/ImageUploadField.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { SectionCard } from '../../components/layout/AppShell.tsx'
import { ProofImage } from '../../components/proof/ProofImage.tsx'
import { formatDate, formatDateTime } from '../../utils/format.ts'
import { reverseGeocode } from '../../utils/geocode.ts'
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
  const priorProof = task?.status === 'rejected' ? latestSubmission(data, task.id) : undefined
  const [images, setImages] = useState<string[]>([])
  const [lat, setLat] = useState<number | null>(priorProof?.lat ?? null)
  const [lng, setLng] = useState<number | null>(priorProof?.lng ?? null)
  const [gpsSource, setGpsSource] = useState<GpsSource | null>(priorProof?.gpsSource ?? null)
  const [gpsError, setGpsError] = useState('')
  const [address, setAddress] = useState(task?.address ?? '')
  const [placeName, setPlaceName] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const lookedUp = useRef('')
  const [documentName, setDocumentName] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [capturedAt, setCapturedAt] = useState<string | null>(null)
  const storedProof = task ? latestSubmission(data, task.id) : undefined
  const proofLocked = task?.status === 'awaiting_verification' || task?.status === 'completed'
  const lookupLat = proofLocked && storedProof ? storedProof.lat : lat
  const lookupLng = proofLocked && storedProof ? storedProof.lng : lng

  useEffect(() => {
    if (lookupLat == null || lookupLng == null) return
    const key = `${lookupLat.toFixed(5)},${lookupLng.toFixed(5)}`
    if (lookedUp.current === key) return
    let cancelled = false
    setLookingUp(true)
    reverseGeocode(lookupLat, lookupLng).then(
      (place) => {
        if (cancelled) return
        lookedUp.current = key
        setPlaceName(place.placeName)
        setAddress(place.address)
        setLookingUp(false)
      },
      () => {
        if (cancelled) return
        setLookingUp(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [lookupLat, lookupLng])

  if (!task || !session?.executorId) {
    return <EmptyState title="Task unavailable" body="This task is not assigned to the signed-in user." action={<Button component={RouterLink} to="/executor/tasks">Back to my tasks</Button>} />
  }

  const project = findProject(data, task.projectId)
  const executor = findExecutor(data, task.executorId)
  const latest = latestSubmission(data, task.id)
  const locked = task.status === 'awaiting_verification' || task.status === 'completed'
  const resubmit = task.status === 'rejected'
  const step = task.status === 'completed' ? 4 : task.status === 'rejected' ? 3 : task.status === 'awaiting_verification' ? 3 : task.status === 'in_progress' ? 1 : 0
  const shownPlace = placeName || (lookingUp ? 'Fetching location name…' : task.locationName)
  const shownAddress = address || latest?.locationLabel || task.address
  const stampLat = lat ?? latest?.lat
  const stampLng = lng ?? latest?.lng
  const stampWhen = capturedAt ?? latest?.submittedAt
  const lines = [
    'Vesne',
    shownPlace,
    shownAddress,
    stampLat != null && stampLng != null ? `Lat ${stampLat.toFixed(5)}°  Long ${stampLng.toFixed(5)}°` : 'Location not captured',
    stampWhen ? formatDateTime(stampWhen) : 'Date not captured yet',
    `${executor?.name ?? session.name} · ${executor?.executorCode ?? ''}`,
    task.taskCode,
  ]
  const proofStamp = stampLat != null && stampLng != null
    ? { placeName: shownPlace, address: shownAddress, lat: stampLat, lng: stampLng, at: stampWhen ?? new Date().toISOString() }
    : undefined

  const onImage = async (file: File | undefined) => {
    if (!file) return
    try {
      const next = await readImageFile(file)
      setImages((current) => (resubmit ? [...current, next] : [next]))
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
    if (task.requiredProofTypes.includes('photo') && images.length === 0) {
      setFormError(resubmit ? 'Upload at least one new image before resubmitting.' : 'Add a proof photograph before submitting.')
      return
    }
    if (task.requiredProofTypes.includes('document') && !documentName) {
      setFormError('Attach the required document before submitting.')
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
        imageDataUrl: images[0] ?? '',
        imageDataUrls: images,
        lat,
        lng,
        locationLabel: address,
        placeName: placeName || undefined,
        gpsSource,
        documentName: documentName || undefined,
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
        crumbs={[{ label: 'User', to: '/executor' }, { label: 'My tasks', to: '/executor/tasks' }, { label: task.taskCode }]}
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
            <Fact label="Location name" value={shownPlace} />
            <Fact label="Address" value={shownAddress} />
            <Fact label="Target" value={formatDate(task.targetDate)} />
            <Fact label="City" value={task.city} />
            <Fact label="State" value={task.state} />
            <Fact label="Required proof" value={task.requiredProofTypes.filter((type) => type !== 'video').join(', ')} />
            <Fact label="User" value={executor ? `${executor.name} · ${executor.executorCode}` : ''} />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ mb: 0.75, fontSize: 12, fontWeight: 700, color: '#5E7082' }}>Reference images</Typography>
            {task.referenceImages.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {task.referenceImages.map((src, index) => (
                  <Box
                    key={`${index}-${src.slice(-16)}`}
                    component="img"
                    src={src}
                    alt={`Reference photograph ${index + 1}`}
                    sx={{ ...passportFrameSx, objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                  />
                ))}
              </Box>
            ) : (
              <Box sx={{ ...passportFrameSx, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 1, color: '#5E7082', fontSize: 12, lineHeight: 1.4 }}>
                No reference images
              </Box>
            )}
          </Box>
        </SectionCard>
        <SectionCard title={resubmit ? 'Resubmit proof' : locked ? 'Submitted proof' : 'Capture proof'}>
          {locked && latest ? (
            <Stack spacing={1.5}>
              {(latest.imageDataUrls?.length ? latest.imageDataUrls : [latest.imageDataUrl]).map((src, index) => (
                <ProofImage
                  key={`${latest.id}-${index}`}
                  src={src}
                  alt="Submitted proof"
                  lines={lines}
                  stamp={proofStamp}
                  filename={`${task.taskCode}-proof-${index + 1}.jpg`}
                  onDownloaded={() => notify('Watermarked image downloaded.', 'success')}
                  onFailed={(message) => notify(message, 'error')}
                />
              ))}
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              {task.status === 'assigned' && (
                <Button variant="outlined" onClick={() => startTask(task.id)} sx={{ alignSelf: 'flex-start' }}>Start task</Button>
              )}
              {resubmit && latest && (
                <Box>
                  <Typography sx={{ mb: 0.75, fontSize: 12, fontWeight: 700, color: '#5E7082' }}>Rejected photo</Typography>
                  <Box component="img" src={latest.imageDataUrl} alt="Rejected proof" sx={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 1.5, display: 'block' }} />
                </Box>
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
                <Button component="label" variant="contained" startIcon={<Camera size={16} />}>
                  {resubmit ? 'Take a new photo' : 'Take photo'}
                  <input hidden type="file" accept="image/*" capture="environment" onChange={(event) => void onImage(event.target.files?.[0])} />
                </Button>
                {images.length > 0 && (
                  <Button color="inherit" onClick={() => setImages([])}>Remove photo</Button>
                )}
              </Stack>
              {resubmit && (
                <ImageUploadField
                  images={images}
                  onChange={(next) => {
                    if (next.length > images.length) setCapturedAt(new Date().toISOString())
                    setImages(next)
                    setFormError('')
                  }}
                  label="Upload images to resubmit"
                  hint="Add one or more new photos. The rejected photo stays above for comparison."
                />
              )}
              {task.requiredProofTypes.includes('document') && (
                <Button component="label" variant="outlined">
                  {documentName ? `Document: ${documentName}` : 'Attach document'}
                  <input hidden type="file" accept=".pdf,.doc,.docx,image/*" onChange={(event) => setDocumentName(event.target.files?.[0]?.name ?? '')} />
                </Button>
              )}
              <Typography variant="caption" color="text.secondary">
                Document files are recorded by name only. They are not uploaded to a server.
              </Typography>
              <Button variant="outlined" startIcon={<LocateFixed size={16} />} onClick={captureGps} sx={{ alignSelf: 'flex-start' }}>Capture GPS</Button>
              {gpsError && <Alert severity="warning">{gpsError}</Alert>}
              <TextField label="Latitude" value={lat ?? ''} disabled helperText={gpsSource ? gpsSourceLabel(gpsSource) : 'Not captured yet'} />
              <TextField label="Longitude" value={lng ?? ''} disabled />
              <TextField label="Location name" value={placeName} onChange={(event) => setPlaceName(event.target.value)} helperText={lookingUp ? 'Fetching location name from GPS…' : 'Filled from the captured coordinates'} />
              <TextField label="Address" value={address} onChange={(event) => setAddress(event.target.value)} helperText={lookingUp ? 'Fetching address from GPS…' : 'Place, region, and postcode from the captured coordinates'} />
              <TextField label="Capture date and time" value={capturedAt ? formatDateTime(capturedAt) : 'Set when you add a photo or location'} disabled />
              {images.map((src, index) => (
                <ProofImage
                  key={`${index}-${src.slice(-16)}`}
                  src={src}
                  alt={`Proof preview ${index + 1}`}
                  lines={lines}
                  stamp={proofStamp}
                  filename={`${task.taskCode}-proof-${index + 1}.jpg`}
                  onDownloaded={() => notify('Watermarked image downloaded.', 'success')}
                  onFailed={(message) => notify(message, 'error')}
                />
              ))}
              {formError && <Alert severity="error">{formError}</Alert>}
              <Button variant="contained" size="large" disabled={busy} onClick={submit}>
                {busy ? (resubmit ? 'Resubmitting…' : 'Submitting…') : resubmit ? 'Resubmit proof' : 'Submit for verification'}
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
