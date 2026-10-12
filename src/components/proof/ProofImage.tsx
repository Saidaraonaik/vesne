import { Box, Button, Stack, Typography } from '@mui/material'
import { Download } from 'lucide-react'
import { downloadWatermarked } from '../../utils/images.ts'

export function ProofImage({
  src,
  alt,
  lines,
  filename = 'vesne-proof.jpg',
  onDownloaded,
  onFailed,
}: {
  src: string
  alt: string
  lines: string[]
  filename?: string
  onDownloaded?: () => void
  onFailed?: (message: string) => void
}) {
  return (
    <Stack spacing={1}>
      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: '#FFF1E6' }}>
        <Box component="img" src={src} alt={alt} sx={{ display: 'block', width: '100%', maxHeight: 520, objectFit: 'cover' }} />
        <Box sx={{ position: 'absolute', left: 10, right: 10, bottom: 10, bgcolor: 'rgba(228,87,14,0.92)', color: '#fff', borderRadius: 1.5, p: 1.25 }}>
          {lines.map((line) => (
            <Typography key={line} variant="body2" sx={{ color: '#fff', fontWeight: 650 }}>
              {line}
            </Typography>
          ))}
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Location overlay. This does not independently verify GPS or prove the photograph is authentic.
          </Typography>
        </Box>
      </Box>
      <Button
        variant="outlined"
        startIcon={<Download size={16} />}
        onClick={() => {
          downloadWatermarked(src, [...lines, 'Demo overlay only. Not certified GPS or authenticity.'], filename).then(
            () => onDownloaded?.(),
            () => onFailed?.('Could not generate the watermarked image in this browser.'),
          )
        }}
      >
        Download watermarked image
      </Button>
    </Stack>
  )
}
