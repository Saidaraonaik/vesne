import { useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import { Pencil, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useApp } from '../../app/app-context.ts'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { panelSx } from '../../theme/theme.ts'
import type { Client } from '../../types/models.ts'
import { fieldBind } from '../../utils/format.ts'
import { projectsForClient } from '../../utils/relations.ts'

interface FormValues {
  name: string
  email: string
  password: string
}

export function ClientsPage() {
  const { data } = useApp()
  const [query, setQuery] = useState('')
  const filterKey = query
  const [pageState, setPageState] = useState({ key: filterKey, page: 0 })
  const page = pageState.key === filterKey ? pageState.page : 0
  const setPage = (next: number) => setPageState({ key: filterKey, page: next })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [formKey, setFormKey] = useState(0)
  const rows = data.clients.filter((client) => {
    const haystack = `${client.name} ${client.email}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })
  const visible = rows.slice(page * 8, page * 8 + 8)

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Clients"
        subtitle="Each client signs in with the email and password saved here."
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Clients' }]}
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => { setEditing(null); setFormKey((key) => key + 1); setOpen(true) }}>Add client</Button>}
      />
      <Alert severity="info">The password is used on the sign-in screen. It stays in this browser until a backend is connected.</Alert>
      <TextField size="small" label="Search clients" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth />
      {rows.length === 0 ? <EmptyState title="No clients match" body="Adjust the search or add a client." /> : (
        <TableContainer sx={panelSx}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Projects</TableCell>
                <TableCell align="right">Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((client) => (
                <TableRow key={client.id} hover>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{projectsForClient(data, client.id).length}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View and edit client">
                      <IconButton aria-label="Edit client" onClick={() => { setEditing(client); setFormKey((key) => key + 1); setOpen(true) }}><Pencil size={16} /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination component="div" count={rows.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={8} rowsPerPageOptions={[8]} />
        </TableContainer>
      )}
      <ClientDialog key={formKey} open={open} client={editing} onClose={() => setOpen(false)} />
    </Stack>
  )
}

function ClientDialog({ open, client, onClose }: { open: boolean; client: Client | null; onClose: () => void }) {
  const { saveClient } = useApp()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: client?.name ?? '',
      email: client?.email ?? '',
      password: '',
    },
  })
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit((values) => { if (saveClient({ id: client?.id, ...values })) onClose() })}>
        <DialogTitle>{client ? 'Edit client' : 'Add client'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {client ? 'Leave the password blank to keep the current one.' : 'The client uses this email and password to sign in.'}
            </Typography>
            <TextField label="Client name" {...fieldBind(register('name', { required: 'Client name is required' }))} error={Boolean(errors.name)} helperText={errors.name?.message} />
            <TextField label="Client email" type="email" {...fieldBind(register('email', { required: 'Client email is required' }))} error={Boolean(errors.email)} helperText={errors.email?.message} />
            <TextField
              label="Password"
              type="password"
              {...fieldBind(register('password', {
                validate: (value) => {
                  const next = value.trim()
                  if (!next) return client ? true : 'Password is required'
                  return next.length >= 4 || 'Use at least 4 characters'
                },
              }))}
              error={Boolean(errors.password)}
              helperText={errors.password?.message || (client ? 'Leave blank to keep the current password.' : 'Used to sign in as this client.')}
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
