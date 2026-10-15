import type { Role, Session } from '../types/models.ts'

export interface DemoUser {
  email: string
  role: Role
  name: string
  title: string
  executorId?: string
  clientId?: string
}

export const DEMO_PASSWORD = 'demo'

export const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin@vesne.demo',
    role: 'admin',
    name: 'Ananya Deshmukh',
    title: 'Operations admin',
  },
  {
    email: 'executor@vesne.demo',
    role: 'executor',
    name: 'Ravi Kumar',
    title: 'Field user',
    executorId: 'ex_ravi',
  },
  {
    email: 'client@vesne.demo',
    role: 'client',
    name: 'Priya Menon',
    title: 'Client reviewer',
    clientId: 'cl_horizon',
  },
]

export function homePath(role: Role) {
  if (role === 'admin') return '/admin'
  if (role === 'executor') return '/executor'
  return '/client'
}

export function sessionFromUser(user: DemoUser): Session {
  return {
    email: user.email,
    role: user.role,
    name: user.name,
    executorId: user.executorId,
    clientId: user.clientId,
  }
}

export function sessionFromEmail(email: string) {
  const user = DEMO_USERS.find((item) => item.email === email.trim().toLowerCase())
  return user ? sessionFromUser(user) : null
}

export function sessionFromRole(role: Role) {
  const user = DEMO_USERS.find((item) => item.role === role)
  if (!user) return null
  return sessionFromUser(user)
}
