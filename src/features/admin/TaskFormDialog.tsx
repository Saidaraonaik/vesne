import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, FormHelperText, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { LocateFixed } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useApp } from '../../app/app-context.ts'
import { ImageUploadField } from '../../components/common/ImageUploadField.tsx'
import { LocationPicker } from '../../components/maps/LocationPicker.tsx'
import type { ProofType, Task } from '../../types/models.ts'
import { PROOF_TYPES } from '../../types/models.ts'
import { fieldBind } from '../../utils/format.ts'
import { reversePlace, searchPlaces, type PlaceSelection } from '../../utils/geocode.ts'

interface FormValues {
  projectId: string
  address: string
  city: string
  state: string
  lat: number | ''
  lng: number | ''
  instructions: string
  executorId: string
  targetDate: string
  quantity: number
  requiredProofTypes: ProofType[]
  status: 'assigned' | 'in_progress'
}

function valuesFrom(task: Task | null, presetProjectId?: string): FormValues {
  return {
    projectId: task?.projectId ?? presetProjectId ?? '',
    address: task?.address ?? '',
    city: task?.city ?? '',
    state: task?.state ?? '',
    lat: task?.lat ?? '',
    lng: task?.lng ?? '',
    instructions: task?.instructions ?? '',
    executorId: task?.executorId ?? '',
    targetDate: task?.targetDate ?? '2026-10-31',
    quantity: task?.quantity ?? 1,
    requiredProofTypes: (task?.requiredProofTypes ?? ['photo']).filter((type) => type !== 'video'),
    status: task?.status === 'in_progress' ? 'in_progress' : 'assigned',
  }
}

function coordinate(value: number | '') {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function TaskFormDialog({
  open,
  task,
  presetProjectId,
  onClose,
}: {
  open: boolean
  task: Task | null
  presetProjectId?: string
  onClose: () => void
}) {
  const { data, saveTask } = useApp()
  const [images, setImages] = useState<string[]>(() => task?.referenceImages ?? [])
  const [suggestions, setSuggestions] = useState<PlaceSelection[]>([])
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState(false)
  const [locating, setLocating] = useState(false)
  const locationName = useRef(task?.locationName ?? '')
  const skipSearch = useRef(false)
  const searchId = useRef(0)
  const { register, handleSubmit, control, watch, setValue, setError, clearErrors, formState: { errors } } = useForm<FormValues>({
    defaultValues: valuesFrom(task, presetProjectId),
  })
  const address = watch('address')
  const lat = watch('lat')
  const lng = watch('lng')
  const locked = task?.status === 'completed' || task?.status === 'awaiting_verification' || task?.status === 'rejected'
  const users = data.executors.filter((executor) => executor.status === 'active' || executor.id === task?.executorId)

  const applyPlace = (place: PlaceSelection) => {
    skipSearch.current = address.trim() !== place.address
    locationName.current = place.locationName
    setSuggestions([])
    setValue('address', place.address, { shouldValidate: true })
    setValue('city', place.city, { shouldValidate: true })
    setValue('state', place.state, { shouldValidate: true })
    setValue('lat', Number(place.lat.toFixed(6)), { shouldValidate: true })
    setValue('lng', Number(place.lng.toFixed(6)), { shouldValidate: true })
    clearErrors(['address', 'city', 'state', 'lat'])
    setNoteError(false)
    setNote('Address, city, state, and coordinates filled from the selected location.')
  }

  useEffect(() => {
    if (!task?.lat || !task.lng || (task.city && task.state)) return
    let cancelled = false
    reversePlace(task.lat, task.lng).then(
      (place) => {
        if (cancelled) return
        if (!task.city) setValue('city', place.city)
        if (!task.state) setValue('state', place.state)
      },
      () => undefined,
    )
    return () => {
      cancelled = true
    }
  }, [setValue, task])

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false
      return
    }
    const query = address.trim()
    if (query.length < 3) {
      setSuggestions([])
      return
    }
    const id = ++searchId.current
    const timer = window.setTimeout(() => {
      searchPlaces(query).then(
        (places) => {
          if (id === searchId.current) setSuggestions(places)
        },
        () => {
          if (id === searchId.current) setSuggestions([])
        },
      )
    }, 400)
    return () => window.clearTimeout(timer)
  }, [address])

  const fillFromPoint = async (nextLat: number, nextLng: number) => {
    setLocating(true)
    setNoteError(false)
    setNote('Looking up the address for that point…')
    setSuggestions([])
    try {
      applyPlace(await reversePlace(nextLat, nextLng))
    } catch {
      setValue('lat', Number(nextLat.toFixed(6)))
      setValue('lng', Number(nextLng.toFixed(6)))
      setNoteError(true)
      setNote('Coordinates were saved. Type the address, city, and state for this point.')
    } finally {
      setLocating(false)
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNoteError(true)
      setNote('This browser cannot read the current location.')
      return
    }
    setLocating(true)
    setNoteError(false)
    setNote('Reading the current location…')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void fillFromPoint(position.coords.latitude, position.coords.longitude)
      },
      () => {
        setLocating(false)
        setNoteError(true)
        setNote('Location permission was denied or the current location is unavailable.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <Form onSubmit={handleSubmit(async (values) => {
        let nextLat = Number(values.lat)
        let nextLng = Number(values.lng)
        let city = values.city.trim()
        let state = values.state.trim()
        let nextAddress = values.address.trim()
        if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
          try {
            const [place] = await searchPlaces(nextAddress)
            if (!place) throw new Error('missing')
            nextLat = place.lat
            nextLng = place.lng
            nextAddress = place.address || nextAddress
            city = city || place.city
            state = state || place.state
            locationName.current = place.locationName
            applyPlace({ ...place, city, state, address: nextAddress })
          } catch {
            setError('address', { message: 'Choose a matching address, a map point, or the current location.' })
            return
          }
        }
        if (!city || !state) {
          setError(city ? 'state' : 'city', { message: city ? 'State is required.' : 'City is required.' })
          return
        }
        const saved = saveTask({
          id: task?.id,
          projectId: values.projectId,
          locationName: locationName.current || nextAddress,
          address: nextAddress,
          city,
          state,
          lat: nextLat,
          lng: nextLng,
          instructions: values.instructions,
          executorId: values.executorId,
          targetDate: values.targetDate,
          quantity: values.quantity,
          requiredProofTypes: values.requiredProofTypes.filter((type) => type !== 'video'),
          status: locked ? undefined : values.status,
          referenceImages: images,
        })
        if (saved) onClose()
      })}>
        <DialogTitle>{task ? `Edit ${task.taskCode}` : 'Assign task'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Controller
              name="projectId"
              control={control}
              rules={{ required: 'Select a project' }}
              render={({ field }) => (
                <TextField select label="Project" value={field.value} onChange={field.onChange} error={Boolean(errors.projectId)} helperText={errors.projectId?.message}>
                  {data.projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Box>
              <Controller
                name="address"
                control={control}
                rules={{ required: 'Address is required' }}
                render={({ field }) => (
                  <TextField
                    label="Address"
                    fullWidth
                    value={field.value}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={Boolean(errors.address)}
                    helperText={errors.address?.message || 'Type an address and choose a match.'}
                    onChange={(event) => {
                      locationName.current = event.target.value
                      field.onChange(event.target.value)
                    }}
                  />
                )}
              />
              {suggestions.length > 0 && (
                <Box sx={{ mt: 0.75, border: '1px solid #E6EEF2', borderRadius: '8px', overflow: 'hidden', bgcolor: '#fff' }}>
                  {suggestions.map((place) => (
                    <Box
                      key={`${place.label}-${place.lat}-${place.lng}`}
                      component="button"
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applyPlace(place)}
                      sx={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        border: 0,
                        borderBottom: '1px solid #E6EEF2',
                        bgcolor: '#fff',
                        px: 1.5,
                        py: 1,
                        cursor: 'pointer',
                        font: 'inherit',
                        color: '#1A2633',
                        '&:last-of-type': { borderBottom: 0 },
                        '&:hover': { bgcolor: '#F7FBFF' },
                      }}
                    >
                      <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>{place.address}</Typography>
                      <Typography sx={{ fontSize: 12, color: '#5E7082', lineHeight: 1.4 }}>{[place.city, place.state].filter(Boolean).join(', ')}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="City"
                    fullWidth
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={Boolean(errors.city)}
                    helperText={errors.city?.message}
                    slotProps={{ inputLabel: { shrink: Boolean(field.value) } }}
                  />
                )}
              />
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="State"
                    fullWidth
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={Boolean(errors.state)}
                    helperText={errors.state?.message}
                    slotProps={{ inputLabel: { shrink: Boolean(field.value) } }}
                  />
                )}
              />
            </Stack>
            <Button variant="outlined" startIcon={<LocateFixed size={16} />} onClick={useCurrentLocation} disabled={locating} sx={{ alignSelf: 'flex-start' }}>
              {locating ? 'Finding location…' : 'Use current location'}
            </Button>
            <Box>
              <Typography sx={{ mb: 0.75, fontSize: 13, color: '#5E7082' }}>
                Choose a point on the map. Address, city, state, latitude, and longitude fill from that point.
              </Typography>
              <LocationPicker lat={coordinate(lat)} lng={coordinate(lng)} onPick={(nextLat, nextLng) => { void fillFromPoint(nextLat, nextLng) }} />
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField type="number" label="Latitude" fullWidth value={lat} slotProps={{ inputLabel: { shrink: lat !== '' }, htmlInput: { step: '0.0001', readOnly: true } }} />
              <TextField type="number" label="Longitude" fullWidth value={lng} slotProps={{ inputLabel: { shrink: lng !== '' }, htmlInput: { step: '0.0001', readOnly: true } }} />
            </Stack>
            {note && <FormHelperText error={noteError}>{note}</FormHelperText>}
            <TextField label="Task instructions" multiline minRows={3} {...fieldBind(register('instructions', { required: 'Add task instructions' }))} error={Boolean(errors.instructions)} helperText={errors.instructions?.message} />
            <Controller
              name="executorId"
              control={control}
              rules={{ required: 'Assign a user' }}
              render={({ field }) => (
                <TextField select label="Assigned user" value={field.value} onChange={field.onChange} disabled={locked} error={Boolean(errors.executorId)} helperText={locked ? 'Reassignment is locked while proof is in review, rejected, or completed.' : errors.executorId?.message}>
                  {users.map((executor) => (
                    <MenuItem key={executor.id} value={executor.id}>{executor.name} · {executor.executorCode}</MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField type="date" label="Target date" slotProps={{ inputLabel: { shrink: true } }} fullWidth {...fieldBind(register('targetDate', { required: 'Target date is required' }))} />
              <TextField type="number" label="Quantity" fullWidth {...fieldBind(register('quantity', { valueAsNumber: true, min: { value: 1, message: 'Quantity must be at least 1' } }))} error={Boolean(errors.quantity)} helperText={errors.quantity?.message} />
              {!locked && task && (task.status === 'assigned' || task.status === 'in_progress') && (
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField select label="Execution status" fullWidth value={field.value} onChange={field.onChange}>
                      <MenuItem value="assigned">Assigned</MenuItem>
                      <MenuItem value="in_progress">In progress</MenuItem>
                    </TextField>
                  )}
                />
              )}
            </Stack>
            <Controller
              name="requiredProofTypes"
              control={control}
              rules={{ validate: (value) => value.filter((type) => type !== 'video').length > 0 || 'Select at least one proof type' }}
              render={({ field }) => (
                <FormGroup row>
                  {PROOF_TYPES.map((type) => (
                    <FormControlLabel
                      key={type}
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      control={
                        <Checkbox
                          checked={field.value.includes(type)}
                          onChange={(event) => {
                            field.onChange(event.target.checked ? [...field.value, type] : field.value.filter((item) => item !== type))
                          }}
                        />
                      }
                    />
                  ))}
                  {errors.requiredProofTypes && <FormHelperText error>{errors.requiredProofTypes.message}</FormHelperText>}
                </FormGroup>
              )}
            />
            <ImageUploadField images={images} onChange={setImages} />
            <FormHelperText>
              New tasks start as Assigned. Submitted, approved, rejected, and completed states change through proof submission and verification.
            </FormHelperText>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">{task ? 'Save task' : 'Assign task'}</Button>
        </DialogActions>
      </Form>
    </Dialog>
  )
}

function Form({ children, onSubmit }: { children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form onSubmit={onSubmit}>{children}</form>
}
