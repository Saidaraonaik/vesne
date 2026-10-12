export type Role = 'admin' | 'executor' | 'client'

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled'

export type TaskStatus =
  | 'assigned'
  | 'in_progress'
  | 'awaiting_verification'
  | 'rejected'
  | 'completed'

export type ProofStatus = 'awaiting_verification' | 'approved' | 'rejected'

export type ProofType = 'photo' | 'video' | 'document'

export type AccountStatus = 'active' | 'inactive'

export type GpsSource = 'device'

export type NoticeSeverity = 'success' | 'error' | 'info' | 'warning'

export interface Session {
  email: string
  role: Role
  name: string
  executorId?: string
  clientId?: string
}

export interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  password: string
  status: AccountStatus
  createdAt: string
}

export interface Executor {
  id: string
  executorCode: string
  name: string
  email: string
  phone: string
  city: string
  password: string
  status: AccountStatus
  createdAt: string
}

export interface Project {
  id: string
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
  referenceImages: string[]
  budget: number
  internalNotes: string
  status: ProjectStatus
  createdAt: string
}

export interface Task {
  id: string
  taskCode: string
  projectId: string
  locationName: string
  address: string
  lat: number
  lng: number
  instructions: string
  executorId: string
  targetDate: string
  quantity: number
  requiredProofTypes: ProofType[]
  referenceImages: string[]
  status: TaskStatus
  createdAt: string
}

export interface ProofSubmission {
  id: string
  taskId: string
  executorId: string
  imageDataUrl: string
  imageDataUrls?: string[]
  lat: number
  lng: number
  locationLabel: string
  placeName?: string
  gpsSource: GpsSource
  submittedAt: string
  status: ProofStatus
  rejectionReason?: string
  verificationRemarks?: string
  reviewedAt?: string
  documentName?: string
  videoName?: string
}

export interface Activity {
  id: string
  at: string
  actor: string
  message: string
  type: 'project' | 'task' | 'proof' | 'account' | 'system'
}

export interface AppData {
  version: 1
  clients: Client[]
  executors: Executor[]
  projects: Project[]
  tasks: Task[]
  submissions: ProofSubmission[]
  activities: Activity[]
}

export const PROOF_TYPES: ProofType[] = ['photo', 'video', 'document']

export const PROJECT_STATUSES: ProjectStatus[] = [
  'draft',
  'active',
  'on_hold',
  'completed',
  'cancelled',
]
