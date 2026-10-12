import type { ReactNode } from 'react'
import { Paper, Typography } from '@mui/material'
import { panelSx } from '../../theme/theme.ts'

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Paper elevation={0} sx={{ ...panelSx, p: { xs: 3, md: 5 }, textAlign: 'center' }}>
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: action ? 2 : 0 }}>
        {body}
      </Typography>
      {action}
    </Paper>
  )
}
