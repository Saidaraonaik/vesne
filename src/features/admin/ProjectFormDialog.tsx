import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, FormHelperText, MenuItem, TextField, Typography } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { Link as RouterLink } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { cardRadius } from '../../theme/theme.ts'
import type { Project, ProjectStatus, ProofType } from '../../types/models.ts'
import { PROJECT_STATUSES, PROOF_TYPES } from '../../types/models.ts'
import { fieldBind } from '../../utils/format.ts'
import { readImageFile } from '../../utils/images.ts'

interface FormValues {
  clientId: string
  name: string
  campaign: string
  startDate: string
  endDate: string
  workLocations: string
  quantity: number
  workType: string
  executorInstructions: string
  requiredProofTypes: ProofType[]
  targetDate: string
  budget: number
  internalNotes: string
  status: ProjectStatus
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#fff',
    minHeight: 40,
  },
  '& .MuiInputBase-input': {
    py: 1,
  },
}

function valuesFrom(project: Project | null): FormValues {
  const today = new Date().toISOString().slice(0, 10)
  return {
    clientId: project?.clientId ?? '',
    name: project?.name ?? '',
    campaign: project?.campaign ?? '',
    startDate: project?.startDate ?? today,
    endDate: project?.endDate ?? today,
    workLocations: project?.workLocations ?? '',
    quantity: project?.quantity ?? 1,
    workType: project?.workType ?? '',
    executorInstructions: project?.executorInstructions ?? '',
    requiredProofTypes: project?.requiredProofTypes ?? ['photo'],
    targetDate: project?.targetDate ?? today,
    budget: project?.budget ?? 0,
    internalNotes: project?.internalNotes ?? '',
    status: project?.status ?? 'active',
  }
}

function statusLabel(status: ProjectStatus) {
  if (status === 'on_hold') return 'On hold'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function ProjectFormDialog({
  open,
  project,
  onClose,
}: {
  open: boolean
  project: Project | null
  onClose: () => void
}) {
  const { data, saveProject } = useApp()
  const [reference, setReference] = useState<string | undefined>()
  const [fileError, setFileError] = useState('')
  const clients = data.clients
  const { register, handleSubmit, control, reset, getValues, formState: { errors } } = useForm<FormValues>({
    defaultValues: valuesFrom(project),
  })

  useEffect(() => {
    if (open) reset(valuesFrom(project))
  }, [open, project, reset])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: cardRadius } } }}
    >
      <BoxForm
        onSubmit={handleSubmit((values) => {
          const saved = saveProject({
            id: project?.id,
            ...values,
            referenceImageDataUrl: reference,
          })
          if (saved) onClose()
        })}
      >
        <DialogTitle sx={{ pb: 0.5, fontSize: 20 }}>{project ? 'Edit project' : 'Create project'}</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.25,
              pt: 0.5,
            }}
          >
            <Controller
              name="clientId"
              control={control}
              rules={{ required: 'Select a client' }}
              render={({ field }) => (
                <TextField
                  select
                  size="small"
                  label="Client"
                  fullWidth
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean(errors.clientId)}
                  helperText={errors.clientId?.message || (clients.length === 0 ? 'No clients saved yet.' : `${clients.length} client${clients.length === 1 ? '' : 's'} available`)}
                  sx={{ ...fieldSx, gridColumn: '1 / -1' }}
                  slotProps={{
                    select: {
                      displayEmpty: true,
                      MenuProps: {
                        disableScrollLock: true,
                        sx: { zIndex: 1600 },
                        slotProps: { paper: { sx: { maxHeight: 320, mt: 0.5 } } },
                      },
                      renderValue: (selected) => {
                        const client = clients.find((item) => item.id === selected)
                        return client ? client.name : 'Select a client'
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ display: 'none' }}>
                    Select a client
                  </MenuItem>
                  {clients.length === 0 && (
                    <MenuItem disabled>No clients saved yet</MenuItem>
                  )}
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id} sx={{ alignItems: 'flex-start', whiteSpace: 'normal', py: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{client.name}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#5E7082', lineHeight: 1.45 }}>{client.email}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            {clients.length === 0 && (
              <Typography variant="body2" sx={{ gridColumn: '1 / -1', mt: -0.5 }}>
                <Button component={RouterLink} to="/admin/clients" size="small" onClick={onClose} sx={{ px: 0 }}>
                  Add a client
                </Button>
                {' '}before creating a project.
              </Typography>
            )}
            <TextField size="small" label="Project name" sx={fieldSx} {...fieldBind(register('name', { required: 'Project name is required' }))} error={Boolean(errors.name)} helperText={errors.name?.message} />
            <TextField size="small" label="Campaign" sx={fieldSx} {...fieldBind(register('campaign', { required: 'Campaign is required' }))} error={Boolean(errors.campaign)} helperText={errors.campaign?.message} />
            <TextField size="small" type="date" label="Start date" sx={fieldSx} slotProps={{ inputLabel: { shrink: true } }} {...fieldBind(register('startDate', { required: 'Start date is required' }))} />
            <TextField size="small" type="date" label="End date" sx={fieldSx} slotProps={{ inputLabel: { shrink: true } }} {...fieldBind(register('endDate', { required: 'End date is required', validate: (value) => value >= getValues('startDate') || 'End date must be on or after the start date' }))} error={Boolean(errors.endDate)} helperText={errors.endDate?.message} />
            <TextField size="small" type="date" label="Target date" sx={fieldSx} slotProps={{ inputLabel: { shrink: true } }} {...fieldBind(register('targetDate', { required: 'Target date is required' }))} />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField select size="small" label="Status" sx={fieldSx} value={field.value} onChange={field.onChange}>
                  {PROJECT_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>{statusLabel(status)}</MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField size="small" type="number" label="Quantity" sx={fieldSx} {...fieldBind(register('quantity', { valueAsNumber: true, required: true, min: { value: 1, message: 'At least 1' } }))} error={Boolean(errors.quantity)} helperText={errors.quantity?.message} />
            <TextField size="small" type="number" label="Budget (INR)" sx={fieldSx} {...fieldBind(register('budget', { valueAsNumber: true, required: true, min: { value: 0, message: 'Cannot be negative' } }))} error={Boolean(errors.budget)} helperText={errors.budget?.message} />
            <TextField size="small" label="Type of work" sx={{ ...fieldSx, gridColumn: '1 / -1' }} {...fieldBind(register('workType', { required: 'Type of work is required' }))} error={Boolean(errors.workType)} helperText={errors.workType?.message} />
            <TextField size="small" label="Work locations" sx={{ ...fieldSx, gridColumn: '1 / -1' }} {...fieldBind(register('workLocations', { required: 'Describe the work locations' }))} error={Boolean(errors.workLocations)} helperText={errors.workLocations?.message} />
            <TextField size="small" label="Executor instructions" multiline minRows={2} sx={{ ...fieldSx, gridColumn: '1 / -1' }} {...fieldBind(register('executorInstructions', { required: 'Add instructions for the field team' }))} error={Boolean(errors.executorInstructions)} helperText={errors.executorInstructions?.message} />
            <Controller
              name="requiredProofTypes"
              control={control}
              rules={{ validate: (value) => value.length > 0 || 'Select at least one proof type' }}
              render={({ field }) => (
                <FormGroup row sx={{ gridColumn: '1 / -1', gap: 1 }}>
                  {PROOF_TYPES.map((type) => (
                    <FormControlLabel
                      key={type}
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      control={
                        <Checkbox
                          size="small"
                          checked={field.value.includes(type)}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...field.value, type]
                              : field.value.filter((item) => item !== type)
                            field.onChange(next)
                          }}
                        />
                      }
                    />
                  ))}
                  {errors.requiredProofTypes && <FormHelperText error>{errors.requiredProofTypes.message}</FormHelperText>}
                </FormGroup>
              )}
            />
            <TextField size="small" label="Internal notes" multiline minRows={2} sx={{ ...fieldSx, gridColumn: '1 / -1' }} {...fieldBind(register('internalNotes'))} helperText="Admin only." />
            <Box sx={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button component="label" variant="outlined" size="small">
                {reference ? 'Image selected' : 'Reference image'}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    readImageFile(file).then(
                      (url) => {
                        setReference(url)
                        setFileError('')
                      },
                      () => setFileError('Could not read that image.'),
                    )
                  }}
                />
              </Button>
              {(reference || project?.referenceImages[0]) && (
                <Box component="img" src={reference || project?.referenceImages[0] || ''} alt="Reference preview" sx={{ width: 72, height: 48, objectFit: 'cover', borderRadius: '8px' }} />
              )}
              {fileError && <FormHelperText error>{fileError}</FormHelperText>}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button onClick={onClose} size="small">Cancel</Button>
          <Button type="submit" variant="contained" size="small">{project ? 'Save changes' : 'Create project'}</Button>
        </DialogActions>
      </BoxForm>
    </Dialog>
  )
}

function BoxForm({ children, onSubmit }: { children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form onSubmit={onSubmit}>{children}</form>
}
