import { createContext, useContext } from 'react'
import type { AppData, NoticeSeverity, Role, Session } from '../types/models.ts'
import type {
  ClientInput,
  ExecutorInput,
  ProjectInput,
  ReviewInput,
  SubmitProofInput,
  TaskInput,
} from '../services/mockApi.ts'

export interface AppContextValue {
  data: AppData
  session: Session | null
  login: (email: string, password: string) => string | null
  loginAs: (role: Role) => void
  logout: () => void
  switchRole: (role: Role) => void
  resetData: () => void
  notify: (message: string, severity?: NoticeSeverity) => void
  saveProject: (input: ProjectInput) => boolean
  saveTask: (input: TaskInput) => boolean
  saveExecutor: (input: ExecutorInput) => boolean
  saveClient: (input: ClientInput) => boolean
  startTask: (taskId: string) => boolean
  submitProof: (input: SubmitProofInput) => boolean
  reviewProof: (input: ReviewInput) => boolean
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used within AppProvider')
  return value
}
