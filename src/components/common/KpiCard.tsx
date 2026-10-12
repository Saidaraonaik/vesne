import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { cardRadius, panelSx } from '../../theme/theme.ts'

export type KpiTone = 'blue' | 'green' | 'orange' | 'slate' | 'ink' | 'violet'

const TONES: Record<KpiTone, { background: string; color: string; accent: string }> = {
  blue: { background: '#E1F8FB', color: '#1A2633', accent: '#1493AD' },
  green: { background: '#E4F8E9', color: '#1A2633', accent: '#2E9A5B' },
  orange: { background: '#FFF5E0', color: '#1A2633', accent: '#C4842A' },
  slate: { background: '#EEF3F8', color: '#1A2633', accent: '#5C7388' },
  ink: { background: '#E8F3FF', color: '#1A2633', accent: '#3D7AB5' },
  violet: { background: '#FFECE5', color: '#1A2633', accent: '#D26464' },
}

export const kpiGridSx: SxProps<Theme> = {
  display: 'grid',
  gap: 2,
  alignItems: 'stretch',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, minmax(0, 1fr))' },
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tint = '#FFF1E6',
  color = '#E4570E',
  tone,
}: {
  label: string
  value: string | number
  hint?: string
  icon: ReactNode
  tint?: string
  color?: string
  tone?: KpiTone
}) {
  if (tone) {
    return (
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          minHeight: 148,
          p: 2.75,
          borderRadius: cardRadius,
          color: TONES[tone].color,
          background: TONES[tone].background,
          border: 'none',
          boxShadow: 'none',
        }}
      >
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(255,255,255,0.72)',
              color: TONES[tone].accent,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography sx={{ fontSize: 12, fontWeight: 750, letterSpacing: 0.6, textTransform: 'uppercase', color: '#5E7082' }}>
            {label}
          </Typography>
        </Box>
        <Typography sx={{ position: 'relative', mt: 1.75, fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
          {value}
        </Typography>
        {hint && (
          <Typography sx={{ position: 'relative', mt: 0.75, fontSize: 12, color: '#5E7082' }}>
            {hint}
          </Typography>
        )}
      </Paper>
    )
  }

  return (
    <Paper elevation={0} sx={{ ...panelSx, p: 2.25, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Box sx={{ bgcolor: tint, color, p: 0.8, borderRadius: 1.5, display: 'grid', placeItems: 'center' }}>{icon}</Box>
      </Box>
      <Typography variant="h4" sx={{ mt: 1.5, mb: 0.5 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  )
}
