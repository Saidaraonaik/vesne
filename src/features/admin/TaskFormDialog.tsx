import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, FormHelperText, MenuItem, Stack, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useApp } from '../../app/app-context.ts'
import { ImageUploadField } from '../../components/common/ImageUploadField.tsx'
import type { ProofType, Task } from '../../types/models.ts'
import { PROOF_TYPES } from '../../types/models.ts'
import { forwardGeocode, placeQuery } from '../../utils/geocode.ts'
import { fieldBind } from '../../utils/format.ts'

interface FormValues {
  projectId: string
  locationName: string
  address: string
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
    locationName: task?.locationName ?? '',
    address: task?.address ?? '',
    lat: task?.lat ?? '',
    lng: task?.lng ?? '',
    instructions: task?.instructions ?? '',
    executorId: task?.executorId ?? '',
    targetDate: task?.targetDate ?? '2026-10-31',
    quantity: task?.quantity ?? 1,
    requiredProofTypes: task?.requiredProofTypes ?? ['photo'],
    status: task?.status === 'in_progress' ? 'in_progress' : 'assigned',
  }
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
  const [lookup, setLookup] = useState<'idle' | 'loading' | 'found' | 'missing'>('idle')
  const { register, handleSubmit, control, watch, setValue, setError, formState: { errors } } = useForm<FormValues>({
    defaultValues: valuesFrom(task, presetProjectId),
  })
  const locationName = watch('locationName')
  const address = watch('address')
  const query = placeQuery(locationName, address)
  const savedQuery = useRef(query)

  useEffect(() => {
    if (query === savedQuery.current || query.length < 3) return
    let cancelled = false
    setLookup('loading')
    setValue('lat', '')
    setValue('lng', '')
    const timer = window.setTimeout(() => {
      forwardGeocode(query).then(
        (hit) => {
          if (cancelled) return
          setValue('lat', Number(hit.lat.toFixed(6)), { shouldValidate: true })
          setValue('lng', Number(hit.lng.toFixed(6)), { shouldValidate: true })
          setLookup('found')
        },
        () => {
          if (!cancelled) setLookup('missing')
        },
      )
    }, 600)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, setValue])
  const locked = task?.status === 'completed' || task?.status === 'awaiting_verification' || task?.status === 'rejected'
  const executors = data.executors.filter((executor) => executor.status === 'active' || executor.id === task?.executorId)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <Form onSubmit={handleSubmit(async (values) => {
        let lat = Number(values.lat)
        let lng = Number(values.lng)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          const nextQuery = placeQuery(values.locationName, values.address)
          try {
            const hit = await forwardGeocode(nextQuery)
            lat = hit.lat
            lng = hit.lng
            setValue('lat', Number(lat.toFixed(6)))
            setValue('lng', Number(lng.toFixed(6)))
            setLookup('found')
          } catch {
            setLookup('missing')
            setError('lat', { message: 'Enter a fuller address so the coordinates can be found.' })
            return
          }
        }
        const saved = saveTask({
          id: task?.id,
          ...values,
          lat,
          lng,
          referenceImages: images,
          status: locked ? undefined : values.status,
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
            <TextField label="Work location" {...fieldBind(register('locationName', { required: 'Location name is required' }))} error={Boolean(errors.locationName)} helperText={errors.locationName?.message} />
            <TextField label="Address" {...fieldBind(register('address', { required: 'Address is required' }))} error={Boolean(errors.address)} helperText={errors.address?.message} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField type="number" label="Latitude" fullWidth {...fieldBind(register('lat', { valueAsNumber: true }))} slotProps={{ htmlInput: { step: '0.0001', readOnly: true } }} error={Boolean(errors.lat)} />
              <TextField type="number" label="Longitude" fullWidth {...fieldBind(register('lng', { valueAsNumber: true }))} slotProps={{ htmlInput: { step: '0.0001', readOnly: true } }} />
            </Stack>
            <FormHelperText error={lookup === 'missing' || Boolean(errors.lat)}>
              {lookup === 'loading' && 'Looking up coordinates from the work location and address…'}
              {lookup === 'found' && 'Coordinates filled automatically from the work location and address.'}
              {lookup === 'missing' && (errors.lat?.message || 'Could not find that place. Add the street and city.')}
              {lookup === 'idle' && (task
                ? 'Saved coordinates. Change the work location or address to look them up again.'
                : 'Coordinates fill in automatically when you enter the work location or address.')}
            </FormHelperText>
            <TextField label="Task instructions" multiline minRows={3} {...fieldBind(register('instructions', { required: 'Add task instructions' }))} error={Boolean(errors.instructions)} helperText={errors.instructions?.message} />
            <Controller
              name="executorId"
              control={control}
              rules={{ required: 'Assign an executor' }}
              render={({ field }) => (
                <TextField select label="Assigned executor" value={field.value} onChange={field.onChange} disabled={locked} error={Boolean(errors.executorId)} helperText={locked ? 'Reassignment is locked while proof is in review, rejected, or completed.' : errors.executorId?.message}>
                  {executors.map((executor) => (
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
              rules={{ validate: (value) => value.length > 0 || 'Select at least one proof type' }}
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
