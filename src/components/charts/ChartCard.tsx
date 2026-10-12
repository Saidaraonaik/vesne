import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { panelSx } from '../../theme/theme.ts'

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Paper elevation={0} sx={{ ...panelSx, p: 2, height: '100%' }}>
      <Typography variant="h6">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {subtitle}
        </Typography>
      )}
      <Box sx={{ width: '100%', height: 280 }}>{children}</Box>
    </Paper>
  )
}
