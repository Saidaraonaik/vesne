import { useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import { Pencil, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { panelSx } from '../../theme/theme.ts'
import type { Executor } from '../../types/models.ts'
import { fieldBind } from '../../utils/format.ts'
import { countTasks, performanceLabel, tasksForExecutor } from '../../utils/metrics.ts'

interface FormValues {
  name: string
  email: string
  password: string
}

export function ExecutorsPage() {
  const { data } = useApp()
  const [query, setQuery] = useState('')
  const filterKey = query
  const [pageState, setPageState] = useState({ key: filterKey, page: 0 })
  const page = pageState.key === filterKey ? pageState.page : 0
  const setPage = (next: number) => setPageState({ key: filterKey, page: next })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Executor | null>(null)
  const [formKey, setFormKey] = useState(0)
  const rows = data.executors.filter((executor) => {
    const haystack = `${executor.name} ${executor.executorCode} ${executor.email}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })
  const visible = rows.slice(page * 8, page * 8 + 8)

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Executors"
        subtitle="Each executor signs in with the email and password saved here."
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Executors' }]}
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditing(null); setFormKey((key) => key + 1); setOpen(true) }}>Add executor</Button>}
      />
      <Alert severity="info">The password is used on the sign-in screen. It stays in this browser until a backend is connected.</Alert>
      <TextField size="small" label="Search executors" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth />
      {rows.length === 0 ? <EmptyState title="No executors match" body="Try another search or add an executor." /> : (
        <TableContainer sx={panelSx}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Executor</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Assigned</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell align="right">Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((executor) => {
                const counts = countTasks(tasksForExecutor(data, executor.id))
                const openWork = counts.pending + counts.awaiting + counts.rejected
                return (
                  <TableRow key={executor.id} hover>
                    <TableCell>
                      <strong>{executor.name}</strong>
                      <div>{executor.executorCode}</div>
                    </TableCell>
                    <TableCell>{executor.email}</TableCell>
                    <TableCell>{counts.total}</TableCell>
                    <TableCell>{counts.completed}</TableCell>
                    <TableCell>{openWork}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Typography variant="body2">{performanceLabel(counts.percent, counts.total)} · {counts.percent}%</Typography>
                      <LinearProgress variant="determinate" value={counts.percent} sx={{ mt: 0.5, height: 6, borderRadius: 99 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit executor">
                        <IconButton aria-label="Edit executor" onClick={() => { setEditing(executor); setFormKey((key) => key + 1); setOpen(true) }}><Pencil size={16} /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination component="div" count={rows.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={8} rowsPerPageOptions={[8]} />
        </TableContainer>
      )}
      <ExecutorDialog key={formKey} open={open} executor={editing} onClose={() => setOpen(false)} />
    </Stack>
  )
}

function ExecutorDialog({ open, executor, onClose }: { open: boolean; executor: Executor | null; onClose: () => void }) {
  const { saveExecutor } = useApp()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: executor?.name ?? '',
      email: executor?.email ?? '',
      password: '',
    },
  })
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit((values) => { if (saveExecutor({ id: executor?.id, ...values })) onClose() })}>
        <DialogTitle>{executor ? 'Edit executor' : 'Add executor'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {executor
                ? `Executor ID ${executor.executorCode} stays with this record. Leave the password blank to keep the current one.`
                : 'The executor uses this email and password to sign in.'}
            </Typography>
            <TextField label="Executor name" {...fieldBind(register('name', { required: 'Executor name is required' }))} error={Boolean(errors.name)} helperText={errors.name?.message} />
            <TextField label="Executor email" type="email" {...fieldBind(register('email', { required: 'Executor email is required' }))} error={Boolean(errors.email)} helperText={errors.email?.message} />
            <TextField
              label="Password"
              type="password"
              {...fieldBind(register('password', {
                validate: (value) => {
                  const next = value.trim()
                  if (!next) return executor ? true : 'Password is required'
                  return next.length >= 4 || 'Use at least 4 characters'
                },
              }))}
              error={Boolean(errors.password)}
              helperText={errors.password?.message || (executor ? 'Leave blank to keep the current password.' : 'Used to sign in as this executor.')}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
