import { useEffect, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { Download } from 'lucide-react'
import { reverseGeocode } from '../../utils/geocode.ts'
import type { GpsStamp } from '../../utils/gpsStamp.ts'
import { renderGpsStamp } from '../../utils/gpsStamp.ts'
import { dataUrlBytes, downloadWatermarked } from '../../utils/images.ts'
import { downloadBlob } from '../../utils/download.ts'

export function ProofImage({
  src,
  alt,
  lines,
  stamp,
  filename = 'vesne-proof.jpg',
  onDownloaded,
  onFailed,
}: {
  src: string
  alt: string
  lines: string[]
  stamp?: GpsStamp
  filename?: string
  onDownloaded?: () => void
  onFailed?: (message: string) => void
}) {
  const [stamped, setStamped] = useState('')
  const placeName = stamp?.placeName ?? ''
  const address = stamp?.address ?? ''
  const lat = stamp?.lat
  const lng = stamp?.lng
  const at = stamp?.at ?? ''

  useEffect(() => {
    if (lat == null || lng == null || !placeName) {
      setStamped('')
      return
    }
    let cancelled = false
    setStamped('')
    ;(async () => {
      let nextPlace = placeName
      let nextAddress = address
      try {
        const place = await reverseGeocode(lat, lng)
        nextPlace = place.placeName
        nextAddress = place.address
      } catch {
        /* keep the saved place and address */
      }
      if (cancelled || !nextPlace) return
      try {
        const url = await renderGpsStamp(src, { placeName: nextPlace, address: nextAddress, lat, lng, at })
        if (!cancelled) setStamped(url)
      } catch {
        if (!cancelled) setStamped('')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [src, placeName, address, lat, lng, at])

  const download = () => {
    if (stamped) {
      downloadBlob(new File([dataUrlBytes(stamped)], filename, { type: 'image/jpeg' }), filename)
      onDownloaded?.()
      return
    }
    downloadWatermarked(src, lines, filename).then(
      () => onDownloaded?.(),
      () => onFailed?.('Could not generate the watermarked image in this browser.'),
    )
  }

  return (
    <Stack spacing={1}>
      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: '#1A1A1A' }}>
        <Box component="img" src={stamped || src} alt={alt} sx={{ display: 'block', width: '100%', maxHeight: 520, objectFit: 'contain', bgcolor: '#111' }} />
        {stamp && !stamped && (
          <Typography variant="caption" sx={{ position: 'absolute', left: 12, bottom: 12, color: '#fff' }}>
            Adding the location card…
          </Typography>
        )}
      </Box>
      <Button variant="outlined" startIcon={<Download size={16} />} onClick={download}>
        Download watermarked image
      </Button>
    </Stack>
  )
}
