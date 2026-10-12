import { Box, Typography } from '@mui/material'

export function VesneLogo({
  height = 52,
  subtitle = false,
}: {
  height?: number
  subtitle?: boolean
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <Box
        component="img"
        src="/vesne-logo.png"
        alt="Vesne Private Limited"
        sx={{ height, width: 'auto', maxWidth: '100%', display: 'block', objectFit: 'contain' }}
      />
      {subtitle && (
        <Typography sx={{ color: '#8A6A52', fontSize: 12, lineHeight: 1.3, maxWidth: 150 }}>
          Field Execution & Proof Management
        </Typography>
      )}
    </Box>
  )
}
