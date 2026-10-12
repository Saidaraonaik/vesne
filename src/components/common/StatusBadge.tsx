import { Chip } from '@mui/material'
import { statusChipColor } from '../../utils/status.ts'

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <Chip size="small" color={statusChipColor(status)} label={label} />
}
