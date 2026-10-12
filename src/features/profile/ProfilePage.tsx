import { useState } from 'react'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { useApp } from '../../app/app-context.ts'
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'
import { SectionCard } from '../../components/layout/AppShell.tsx'
import { countTasks, performanceLabel, tasksForClient, tasksForExecutor } from '../../utils/metrics.ts'
import { findClient, findExecutor, projectsForClient } from '../../utils/relations.ts'

export function ProfilePage() {
  const { data, session, logout, resetData } = useApp()
  const [confirm, setConfirm] = useState(false)
  const executor = findExecutor(data, session?.executorId)
  const client = findClient(data, session?.clientId ?? '')
  const executorCounts = executor ? countTasks(tasksForExecutor(data, executor.id)) : null
  const clientCounts = client ? countTasks(tasksForClient(data, client.id)) : null

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Profile"
        subtitle="This demo account is stored in the browser. It is not a production login."
        crumbs={[{ label: session?.role === 'client' ? 'Client' : 'Executor', to: session?.role === 'client' ? '/client' : '/executor' }, { label: 'Profile' }]}
      />
      <SectionCard title="Signed-in demo user">
        <Typography><strong>Name:</strong> {session?.name}</Typography>
        <Typography><strong>Email:</strong> {session?.email}</Typography>
        <Typography><strong>Role:</strong> {session?.role}</Typography>
        <Alert severity="info" sx={{ mt: 2 }}>Password changes and account recovery need a backend authentication service. Nothing on this page changes a real password.</Alert>
      </SectionCard>
      {executor && executorCounts && (
        <SectionCard title="Executor record">
          <Typography><strong>Executor ID:</strong> {executor.executorCode}</Typography>
          <Typography><strong>Email:</strong> {executor.email}</Typography>
          <Typography sx={{ my: 1 }}>{executorCounts.completed} completed · {executorCounts.total} assigned · {performanceLabel(executorCounts.percent, executorCounts.total)}</Typography>
          <StatusBadge status={executor.status} label={executor.status === 'active' ? 'Active' : 'Inactive'} />
        </SectionCard>
      )}
      {client && clientCounts && (
        <SectionCard title="Client record">
          <Typography><strong>Name:</strong> {client.name}</Typography>
          <Typography><strong>Email:</strong> {client.email}</Typography>
          <Typography sx={{ my: 1 }}>{projectsForClient(data, client.id).length} projects · {clientCounts.percent}% complete</Typography>
          <StatusBadge status={client.status} label={client.status === 'active' ? 'Active' : 'Inactive'} />
        </SectionCard>
      )}
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" color="error" onClick={() => setConfirm(true)}>Clear workspace</Button>
        <Button variant="contained" onClick={logout}>Log out</Button>
      </Stack>
      <ConfirmDialog
        open={confirm}
        title="Clear workspace?"
        body="Clients, projects, tasks, and proof stored in this browser will be removed."
        confirmLabel="Clear workspace"
        danger
        onClose={() => setConfirm(false)}
        onConfirm={() => { resetData(); setConfirm(false) }}
      />
    </Stack>
  )
}
