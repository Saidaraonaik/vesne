import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Alert, Snackbar } from '@mui/material'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { AppContext } from './app-context.ts'
import type { AppContextValue } from './app-context.ts'
import { homePath, sessionFromEmail, sessionFromRole } from '../data/demoUsers.ts'
import { DEMO_PASSWORD } from '../data/demoUsers.ts'
import { createEmptyData } from '../data/seed.ts'
import {
  reviewProof,
  saveClient,
  saveExecutor,
  saveProject,
  saveTask,
  startTask,
  submitProof,
} from '../services/mockApi.ts'
import type { MutationResult } from '../services/mockApi.ts'
import { loadData, loadSession, saveData, saveSession } from '../services/storageService.ts'
import { theme } from '../theme/theme.ts'
import type { AppData, NoticeSeverity, Role, Session } from '../types/models.ts'

function resolveSession(session: Session | null, data: AppData): Session | null {
  if (!session) return null
  if (session.role === 'executor') {
    const match =
      data.executors.find((item) => item.id === session.executorId) ??
      data.executors.find((item) => item.email.trim().toLowerCase() === session.email.trim().toLowerCase())
    return { ...session, executorId: match?.id }
  }
  if (session.role === 'client') {
    const match =
      data.clients.find((item) => item.id === session.clientId) ??
      data.clients.find((item) => item.email.trim().toLowerCase() === session.email.trim().toLowerCase())
    return { ...session, clientId: match?.id }
  }
  return session
}

export function AppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [data, setData] = useState<AppData>(() => loadData() ?? createEmptyData())
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [notice, setNotice] = useState<{ message: string; severity: NoticeSeverity } | null>(null)

  const notify = (message: string, severity: NoticeSeverity = 'success') => {
    setNotice({ message, severity })
  }

  const commit = (next: AppData, message?: string, severity: NoticeSeverity = 'success') => {
    setData(next)
    const saved = saveData(next)
    if (!saved.ok) {
      notify(saved.error, 'error')
      return
    }
    if (message) notify(message, severity)
  }

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'vesne.data.v2' || !event.newValue) return
      try {
        setData(JSON.parse(event.newValue) as AppData)
      } catch {
        /* ignore malformed storage from another tab */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const apply = (result: MutationResult, success: string) => {
    if (!result.ok) {
      notify(result.error, 'error')
      return false
    }
    commit(result.data, success)
    return true
  }

  const resolvedSession = resolveSession(session, data)
  const actor = resolvedSession?.name ?? 'Vesne user'

  const value = useMemo<AppContextValue>(() => {
    const enter = (next: Session) => {
      setSession(next)
      saveSession(next)
      navigate(homePath(next.role))
    }
    return {
      data,
      session: resolvedSession,
      notify,
      login: (email, password) => {
        const normalized = email.trim().toLowerCase()
        const client = data.clients.find((item) => item.email.trim().toLowerCase() === normalized && item.password)
        if (client) {
          if (password !== client.password) return 'Password does not match this client.'
          enter({ email: client.email, role: 'client', name: client.name, clientId: client.id })
          return null
        }
        const executor = data.executors.find((item) => item.email.trim().toLowerCase() === normalized && item.password)
        if (executor) {
          if (password !== executor.password) return 'Password does not match this executor.'
          enter({ email: executor.email, role: 'executor', name: executor.name, executorId: executor.id })
          return null
        }
        if (password.trim().toLowerCase() !== DEMO_PASSWORD) return 'Use the demo password: demo'
        const next = sessionFromEmail(email)
        if (!next) return 'Use one of the demo accounts on this screen.'
        enter(next)
        return null
      },
      loginAs: (role: Role) => {
        const next = sessionFromRole(role)
        if (!next) return
        enter(next)
      },
      logout: () => {
        setSession(null)
        saveSession(null)
        navigate('/')
      },
      switchRole: (role: Role) => {
        const next = sessionFromRole(role)
        if (!next) return
        enter(next)
        notify(`Switched to the ${role} workspace.`, 'info')
      },
      resetData: () => {
        commit(createEmptyData(), 'Workspace cleared.')
      },
      saveProject: (input) => apply(saveProject(data, input, actor), input.id ? 'Project updated.' : 'Project created.'),
      saveTask: (input) => apply(saveTask(data, input, actor), input.id ? 'Task updated.' : 'Task assigned.'),
      saveExecutor: (input) =>
        apply(saveExecutor(data, input, actor), input.id ? 'Executor updated.' : 'Executor added.'),
      saveClient: (input) => apply(saveClient(data, input, actor), input.id ? 'Client updated.' : 'Client added.'),
      startTask: (taskId) => apply(startTask(data, taskId, actor), 'Task marked in progress.'),
      submitProof: (input) => apply(submitProof(data, input, actor), 'Proof submitted for verification.'),
      reviewProof: (input) =>
        apply(
          reviewProof(data, input, actor),
          input.decision === 'approved'
            ? 'Proof approved. The task is completed and visible to the client.'
            : 'Proof rejected. The executor can resubmit.',
        ),
    }
    // notify and commit are stable enough for this demo store; data and session drive the value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, data, navigate, resolvedSession, session])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContext.Provider value={value}>
        {children}
        <Snackbar
          open={Boolean(notice)}
          autoHideDuration={4200}
          onClose={() => setNotice(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={notice?.severity ?? 'success'} variant="filled" onClose={() => setNotice(null)} sx={{ width: '100%' }}>
            {notice?.message}
          </Alert>
        </Snackbar>
      </AppContext.Provider>
    </ThemeProvider>
  )
}
