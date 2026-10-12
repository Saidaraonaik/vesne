import { useState } from 'react'
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { Building, ShieldCheck, UserRound } from 'lucide-react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { VesneLogo } from '../../components/common/VesneLogo.tsx'
import { DEMO_USERS, homePath } from '../../data/demoUsers.ts'
import type { Role } from '../../types/models.ts'

const ROLE_COPY: Record<Role, { label: string; detail: string; icon: typeof ShieldCheck }> = {
  admin: { label: 'Continue as Admin', detail: 'Projects, verification, and reports', icon: ShieldCheck },
  executor: { label: 'Continue as Executor', detail: 'Assigned tasks and proof submission', icon: UserRound },
  client: { label: 'Continue as Client', detail: 'Approved work, map, and reports', icon: Building },
}

export function LoginPage() {
  const { session, login, loginAs } = useApp()
  const [email, setEmail] = useState('admin@vesne.demo')
  const [password, setPassword] = useState('demo')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState<Role | 'form' | null>(null)

  if (session) return <Navigate to={homePath(session.role)} replace />

  const run = (action: () => string | null, key: Role | 'form') => {
    setError('')
    setLoading(key)
    window.setTimeout(() => {
      const message = action()
      if (message) setError(message)
      setLoading(null)
    }, 350)
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' }, bgcolor: '#FFFFFF' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          background: 'linear-gradient(165deg, #FFFFFF 0%, #FFF6F0 100%)',
          color: '#1C1410',
        }}
      >
        <VesneLogo height={72} />
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -1, maxWidth: 520 }}>
            Field work, proof, and client sign-off in one place.
          </Typography>
          <Stack spacing={1.25} sx={{ mt: 3, maxWidth: 460 }}>
            {[
              'Assign outdoor sites and track each location to completion.',
              'Review photographs, coordinates, and rejection remarks.',
              'Show clients only the work that has been approved.',
            ].map((line) => (
              <Typography key={line} sx={{ color: '#6B5748' }}>
                {line}
              </Typography>
            ))}
          </Stack>
        </Box>
        <Typography variant="body2" sx={{ color: '#8A6A52' }}>
          The workspace starts empty. Add clients, projects, and sites after you sign in.
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2, md: 4 } }}>
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 480, p: { xs: 2.5, sm: 4 }, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
            <VesneLogo height={56} />
          </Box>
          <Typography variant="h5">Sign in to the field portal</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
            Choose a role to present, or use the form. Password for every demo account is <strong>demo</strong>.
          </Typography>
          <Stack spacing={1.25}>
            {DEMO_USERS.map((user) => {
              const copy = ROLE_COPY[user.role]
              const Icon = copy.icon
              return (
                <Button
                  key={user.email}
                  variant="outlined"
                  onClick={() => run(() => {
                    loginAs(user.role)
                    return null
                  }, user.role)}
                  disabled={loading !== null}
                  sx={{ justifyContent: 'flex-start', py: 1.25, textAlign: 'left' }}
                >
                  <Icon size={18} style={{ marginRight: 10 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{copy.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email} · {copy.detail}</Typography>
                  </Box>
                  {loading === user.role && <CircularProgress size={16} sx={{ ml: 'auto' }} />}
                </Button>
              )
            })}
          </Stack>
          <Box component="form" sx={{ mt: 2.5 }} onSubmit={(event) => {
            event.preventDefault()
            run(() => login(email, password), 'form')
          }}>
            <Stack spacing={1.5}>
              <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained" size="large" disabled={loading !== null}>
                {loading === 'form' ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            This is a frontend demonstration. Production authentication, file storage, and GPS verification need a backend. Switching roles here is not access control.
          </Alert>
          <Button component={RouterLink} to="/" sx={{ mt: 1.5 }}>
            Back to the Vesne website
          </Button>
        </Paper>
      </Box>
    </Box>
  )
}
