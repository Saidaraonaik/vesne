import { useState } from 'react'
import { Alert, Button, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useApp } from '../../app/app-context.ts'
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { SectionCard } from '../../components/layout/AppShell.tsx'
import { DEMO_USERS } from '../../data/demoUsers.ts'

export function SettingsPage() {
  const { resetData } = useApp()
  const [confirm, setConfirm] = useState(false)
  return (
    <Stack spacing={2}>
      <PageHeader
        title="Settings"
        subtitle="Demo account, branding, and access notes. Password changes are not available without a backend."
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Settings' }]}
      />
      <SectionCard title="Demo accounts">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Role</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Password</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {DEMO_USERS.map((user) => (
              <TableRow key={user.email}>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>demo</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Alert severity="info" sx={{ mt: 2 }}>
          Use Switch demo role in the header during a presentation. These screens hide irrelevant navigation only. They are not production security.
        </Alert>
      </SectionCard>
      <SectionCard title="Branding">
        <Typography><strong>Application:</strong> Vesne</Typography>
        <Typography><strong>Subtitle:</strong> Field Execution & Proof Management</Typography>
        <Typography><strong>Palette:</strong> Vesne orange, warm stone, and deep teal.</Typography>
        <Typography sx={{ mt: 1 }} color="text.secondary">The wordmark is the Vesne Private Limited logo, shown on a light background.</Typography>
      </SectionCard>
      <SectionCard title="Password management">
        <TextField label="New password" type="password" disabled fullWidth helperText="Password reset needs an authentication service. This field is a placeholder and does not change any account." />
        <Button sx={{ mt: 1.5 }} variant="contained" disabled>Update password</Button>
      </SectionCard>
      <SectionCard title="Role and access overview">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Area</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Client</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Projects and tasks</TableCell>
              <TableCell>All records</TableCell>
              <TableCell>Own assigned tasks</TableCell>
              <TableCell>Own projects only</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Proof</TableCell>
              <TableCell>Verify queue</TableCell>
              <TableCell>Submit and resubmit</TableCell>
              <TableCell>Approved proof only</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Internal notes</TableCell>
              <TableCell>Visible</TableCell>
              <TableCell>Hidden</TableCell>
              <TableCell>Hidden</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionCard>
      <SectionCard title="Workspace">
        <Typography color="text.secondary" sx={{ mb: 1.5 }}>
          Clearing the workspace removes clients, projects, tasks, and proof stored in this browser. Reloading the page restores the live Horizon demo.
        </Typography>
        <Button color="error" variant="outlined" onClick={() => setConfirm(true)}>Clear workspace</Button>
      </SectionCard>
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
