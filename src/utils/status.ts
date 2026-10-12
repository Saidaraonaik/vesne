import type { ChipProps } from '@mui/material/Chip'
import type { ProofStatus, ProjectStatus, TaskStatus } from '../types/models.ts'

const TASK_LABELS: Record<TaskStatus, string> = {
  assigned: 'Assigned',
  in_progress: 'In progress',
  awaiting_verification: 'Awaiting verification',
  rejected: 'Rejected',
  completed: 'Completed',
}

export const TASK_COLORS: Record<TaskStatus, string> = {
  assigned: '#64748b',
  in_progress: '#0284C7',
  awaiting_verification: '#D97706',
  rejected: '#E11D48',
  completed: '#0F9F6E',
}

export function taskStatusLabel(
  status: TaskStatus,
  audience: 'admin' | 'executor' | 'client' = 'admin',
) {
  if (status === 'awaiting_verification' && audience === 'executor') return 'Submitted for verification'
  if (status === 'awaiting_verification' && audience === 'client') return 'In review'
  if (status === 'rejected' && audience === 'executor') return 'Needs resubmission'
  if (status === 'rejected' && audience === 'client') return 'Pending resubmission'
  return TASK_LABELS[status]
}

export function proofStatusLabel(status: ProofStatus) {
  if (status === 'awaiting_verification') return 'Awaiting verification'
  if (status === 'approved') return 'Approved'
  return 'Rejected'
}

export function projectStatusLabel(status: ProjectStatus) {
  if (status === 'on_hold') return 'On hold'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function statusChipColor(status: string): ChipProps['color'] {
  switch (status) {
    case 'completed':
    case 'approved':
    case 'active':
      return 'success'
    case 'awaiting_verification':
    case 'on_hold':
      return 'warning'
    case 'rejected':
    case 'cancelled':
      return 'error'
    case 'in_progress':
      return 'info'
    default:
      return 'default'
  }
}

export function gpsSourceLabel(_source: 'device') {
  return 'Captured from this device.'
}
