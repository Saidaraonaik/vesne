import type {
  Activity,
  AppData,
  GpsSource,
  Project,
  ProjectStatus,
  ProofType,
  Task,
  TaskStatus,
} from '../types/models.ts'
import { newId, nextNumericCode } from '../utils/ids.ts'

export type MutationResult = { ok: true; data: AppData } | { ok: false; error: string }

function ok(data: AppData): MutationResult {
  return { ok: true, data }
}

function fail(error: string): MutationResult {
  return { ok: false, error }
}

function addActivity(activities: Activity[], actor: string, message: string, type: Activity['type']) {
  return [
    { id: newId('act'), at: new Date().toISOString(), actor, message, type },
    ...activities,
  ].slice(0, 40)
}

function syncProject(project: Project, tasks: Task[]): Project {
  if (project.status === 'on_hold' || project.status === 'cancelled' || project.status === 'draft') {
    return project
  }
  const mine = tasks.filter((task) => task.projectId === project.id)
  if (mine.length > 0 && mine.every((task) => task.status === 'completed')) {
    return project.status === 'completed' ? project : { ...project, status: 'completed' }
  }
  if (project.status === 'completed') return { ...project, status: 'active' }
  return project
}

export interface ProjectInput {
  id?: string
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
  referenceImages?: string[]
}

export function saveProject(data: AppData, input: ProjectInput, actor: string): MutationResult {
  if (!input.name.trim() || !input.clientId) return fail('Project name and client are required.')
  if (!input.campaign.trim()) return fail('Campaign name is required.')
  if (input.requiredProofTypes.length === 0) return fail('Select at least one proof type.')
  if (input.endDate < input.startDate) return fail('End date must be on or after the start date.')
  const now = new Date().toISOString()
  if (input.id) {
    const existing = data.projects.find((project) => project.id === input.id)
    if (!existing) return fail('Project not found.')
    const next: Project = {
      ...existing,
      clientId: input.clientId,
      name: input.name.trim(),
      campaign: input.campaign.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      workLocations: input.workLocations.trim(),
      quantity: input.quantity,
      workType: input.workType.trim(),
      executorInstructions: input.executorInstructions.trim(),
      requiredProofTypes: input.requiredProofTypes,
      targetDate: input.targetDate,
      budget: input.budget,
      internalNotes: input.internalNotes.trim(),
      status: input.status,
      referenceImages: input.referenceImages ?? existing.referenceImages,
    }
    return ok({
      ...data,
      projects: data.projects.map((project) => (project.id === next.id ? next : project)),
      activities: addActivity(data.activities, actor, `Updated project ${next.name}.`, 'project'),
    })
  }
  const project: Project = {
    id: newId('pr'),
    clientId: input.clientId,
    name: input.name.trim(),
    campaign: input.campaign.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    workLocations: input.workLocations.trim(),
    quantity: input.quantity,
    workType: input.workType.trim(),
    executorInstructions: input.executorInstructions.trim(),
    requiredProofTypes: input.requiredProofTypes,
    targetDate: input.targetDate,
    referenceImages: input.referenceImages ?? [],
    budget: input.budget,
    internalNotes: input.internalNotes.trim(),
    status: input.status,
    createdAt: now,
  }
  return ok({
    ...data,
    projects: [project, ...data.projects],
    activities: addActivity(data.activities, actor, `Created project ${project.name}.`, 'project'),
  })
}

export interface TaskInput {
  id?: string
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
  status?: Extract<TaskStatus, 'assigned' | 'in_progress'>
  referenceImages?: string[]
}

export function saveTask(data: AppData, input: TaskInput, actor: string): MutationResult {
  if (!input.projectId || !input.locationName.trim() || !input.address.trim()) {
    return fail('Project, location, and address are required.')
  }
  if (!input.executorId) return fail('Assign an executor before saving the task.')
  if (!data.executors.some((executor) => executor.id === input.executorId)) {
    return fail('Choose a valid executor.')
  }
  if (input.requiredProofTypes.length === 0) return fail('Select at least one proof type.')
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    return fail('Enter latitude and longitude.')
  }
  const project = data.projects.find((item) => item.id === input.projectId)
  if (!project) return fail('Project not found.')
  const now = new Date().toISOString()
  if (input.id) {
    const existing = data.tasks.find((task) => task.id === input.id)
    if (!existing) return fail('Task not found.')
    const locked = existing.status === 'completed' || existing.status === 'awaiting_verification'
    const next: Task = {
      ...existing,
      projectId: input.projectId,
      locationName: input.locationName.trim(),
      address: input.address.trim(),
      lat: input.lat,
      lng: input.lng,
      instructions: input.instructions.trim(),
      executorId: locked ? existing.executorId : input.executorId,
      targetDate: input.targetDate,
      quantity: input.quantity,
      requiredProofTypes: input.requiredProofTypes,
      referenceImages: input.referenceImages ?? existing.referenceImages,
      status:
        existing.status === 'assigned' || existing.status === 'in_progress'
          ? input.status ?? existing.status
          : existing.status,
    }
    return ok({
      ...data,
      tasks: data.tasks.map((task) => (task.id === next.id ? next : task)),
      activities: addActivity(
        data.activities,
        actor,
        `Updated task ${next.taskCode} · ${next.locationName}.`,
        'task',
      ),
    })
  }
  const task: Task = {
    id: newId('tk'),
    taskCode: nextNumericCode(
      data.tasks.map((item) => item.taskCode),
      'TSK',
      2600,
    ),
    projectId: input.projectId,
    locationName: input.locationName.trim(),
    address: input.address.trim(),
    lat: input.lat,
    lng: input.lng,
    instructions: input.instructions.trim(),
    executorId: input.executorId,
    targetDate: input.targetDate,
    quantity: input.quantity,
    requiredProofTypes: input.requiredProofTypes,
    referenceImages: input.referenceImages ?? [],
    status: 'assigned',
    createdAt: now,
  }
  const tasks = [task, ...data.tasks]
  return ok({
    ...data,
    tasks,
    projects: data.projects.map((item) => syncProject(item, tasks)),
    activities: addActivity(
      data.activities,
      actor,
      `Assigned ${task.taskCode} · ${task.locationName} on ${project.name}.`,
      'task',
    ),
  })
}

export interface ExecutorInput {
  id?: string
  name: string
  email: string
  password: string
}

export function saveExecutor(data: AppData, input: ExecutorInput, actor: string): MutationResult {
  const name = input.name.trim()
  const email = input.email.trim()
  const password = input.password.trim()
  if (!name || !email) return fail('Executor name and email are required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email.')
  const duplicate = data.executors.find(
    (executor) => executor.id !== input.id && executor.email.trim().toLowerCase() === email.toLowerCase(),
  )
  if (duplicate) return fail('An executor with this email already exists.')
  if (input.id) {
    const existing = data.executors.find((executor) => executor.id === input.id)
    if (!existing) return fail('Executor not found.')
    if (password && password.length < 4) return fail('Password must be at least 4 characters.')
    if (!password && !existing.password) return fail('Set a password so this executor can sign in.')
    const next = {
      ...existing,
      name,
      email,
      phone: '',
      password: password || existing.password,
      status: 'active' as const,
    }
    return ok({
      ...data,
      executors: data.executors.map((executor) => (executor.id === next.id ? next : executor)),
      activities: addActivity(data.activities, actor, `Updated executor ${next.name}.`, 'account'),
    })
  }
  if (password.length < 4) return fail('Password must be at least 4 characters.')
  const executor = {
    id: newId('ex'),
    executorCode: nextNumericCode(
      data.executors.map((item) => item.executorCode),
      'EX',
      1000,
    ),
    name,
    email,
    phone: '',
    city: '',
    password,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  }
  return ok({
    ...data,
    executors: [executor, ...data.executors],
    activities: addActivity(
      data.activities,
      actor,
      `Added executor ${executor.name} (${executor.executorCode}).`,
      'account',
    ),
  })
}

export interface ClientInput {
  id?: string
  name: string
  email: string
  password: string
}

export function saveClient(data: AppData, input: ClientInput, actor: string): MutationResult {
  const name = input.name.trim()
  const email = input.email.trim()
  const password = input.password.trim()
  if (!name || !email) return fail('Client name and email are required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email.')
  const duplicate = data.clients.find(
    (client) => client.id !== input.id && client.email.trim().toLowerCase() === email.toLowerCase(),
  )
  if (duplicate) return fail('A client with this email already exists.')
  if (input.id) {
    const existing = data.clients.find((client) => client.id === input.id)
    if (!existing) return fail('Client not found.')
    if (password && password.length < 4) return fail('Password must be at least 4 characters.')
    if (!password && !existing.password) return fail('Set a password so this client can sign in.')
    const next = {
      ...existing,
      name,
      company: name,
      email,
      phone: '',
      password: password || existing.password,
      status: 'active' as const,
    }
    return ok({
      ...data,
      clients: data.clients.map((client) => (client.id === next.id ? next : client)),
      activities: addActivity(data.activities, actor, `Updated client ${next.name}.`, 'account'),
    })
  }
  if (password.length < 4) return fail('Password must be at least 4 characters.')
  const client = {
    id: newId('cl'),
    name,
    company: name,
    email,
    phone: '',
    password,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  }
  return ok({
    ...data,
    clients: [client, ...data.clients],
    activities: addActivity(data.activities, actor, `Added client ${client.name}.`, 'account'),
  })
}

export function startTask(data: AppData, taskId: string, actor: string): MutationResult {
  const task = data.tasks.find((item) => item.id === taskId)
  if (!task) return fail('Task not found.')
  if (task.status !== 'assigned') return fail('Only assigned tasks can be marked in progress.')
  const next = { ...task, status: 'in_progress' as const }
  return ok({
    ...data,
    tasks: data.tasks.map((item) => (item.id === task.id ? next : item)),
    activities: addActivity(data.activities, actor, `Started ${task.taskCode} · ${task.locationName}.`, 'task'),
  })
}

export interface SubmitProofInput {
  taskId: string
  executorId: string
  imageDataUrl: string
  imageDataUrls?: string[]
  lat: number
  lng: number
  locationLabel: string
  placeName?: string
  gpsSource: GpsSource
  documentName?: string
  videoName?: string
}

export function submitProof(data: AppData, input: SubmitProofInput, actor: string): MutationResult {
  const task = data.tasks.find((item) => item.id === input.taskId)
  if (!task) return fail('Task not found.')
  if (task.executorId !== input.executorId) return fail('This task is not assigned to the signed-in executor.')
  if (task.status === 'completed') return fail('This task is already completed.')
  if (task.status === 'awaiting_verification') {
    return fail('Proof for this task is already awaiting verification.')
  }
  if (task.requiredProofTypes.includes('photo') && !input.imageDataUrl) {
    return fail('A proof photograph is required.')
  }
  if (task.requiredProofTypes.includes('document') && !input.documentName) {
    return fail('Attach the required document before submitting.')
  }
  if (task.requiredProofTypes.includes('video') && !input.videoName) {
    return fail('Select the required video before submitting.')
  }
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    return fail('Capture GPS before submitting.')
  }
  const submission = {
    id: newId('sub'),
    taskId: task.id,
    executorId: input.executorId,
    imageDataUrl: input.imageDataUrl,
    imageDataUrls: input.imageDataUrls?.length ? input.imageDataUrls : [input.imageDataUrl],
    lat: input.lat,
    lng: input.lng,
    locationLabel: input.locationLabel.trim() || task.address,
    placeName: input.placeName?.trim() || undefined,
    gpsSource: input.gpsSource,
    submittedAt: new Date().toISOString(),
    status: 'awaiting_verification' as const,
    documentName: input.documentName,
    videoName: input.videoName,
  }
  const tasks = data.tasks.map((item) =>
    item.id === task.id ? { ...item, status: 'awaiting_verification' as const } : item,
  )
  return ok({
    ...data,
    tasks,
    submissions: [submission, ...data.submissions],
    activities: addActivity(
      data.activities,
      actor,
      `Submitted proof for ${task.taskCode} · ${task.locationName}.`,
      'proof',
    ),
  })
}

export interface ReviewInput {
  submissionId: string
  decision: 'approved' | 'rejected'
  rejectionReason: string
  remarks: string
}

export function reviewProof(data: AppData, input: ReviewInput, actor: string): MutationResult {
  const submission = data.submissions.find((item) => item.id === input.submissionId)
  if (!submission) return fail('Submission not found.')
  if (submission.status !== 'awaiting_verification') {
    return fail('Only submissions awaiting verification can be reviewed.')
  }
  const task = data.tasks.find((item) => item.id === submission.taskId)
  if (!task) return fail('Task not found.')
  if (input.decision === 'rejected' && !input.rejectionReason.trim()) {
    return fail('A rejection reason is required.')
  }
  const now = new Date().toISOString()
  const nextSubmission = {
    ...submission,
    status: input.decision,
    rejectionReason: input.decision === 'rejected' ? input.rejectionReason.trim() : undefined,
    verificationRemarks: input.remarks.trim() || undefined,
    reviewedAt: now,
  }
  const tasks = data.tasks.map((item) =>
    item.id === task.id
      ? { ...item, status: input.decision === 'approved' ? ('completed' as const) : ('rejected' as const) }
      : item,
  )
  const verb = input.decision === 'approved' ? 'Approved' : 'Rejected'
  return ok({
    ...data,
    tasks,
    projects: data.projects.map((project) => syncProject(project, tasks)),
    submissions: data.submissions.map((item) => (item.id === submission.id ? nextSubmission : item)),
    activities: addActivity(
      data.activities,
      actor,
      `${verb} proof for ${task.taskCode} · ${task.locationName}.`,
      'proof',
    ),
  })
}
