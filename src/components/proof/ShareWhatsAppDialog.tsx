import { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'
import { Download, Share2 } from 'lucide-react'
import { downloadBlob } from '../../utils/download.ts'
import { renderGpsStamp } from '../../utils/gpsStamp.ts'
import { reverseGeocode } from '../../utils/geocode.ts'
import { dataUrlBytes, toJpegDataUrl } from '../../utils/images.ts'
import { whatsAppUrl, type ProofShare } from '../../utils/whatsapp.ts'

export function ShareWhatsAppDialog({
  open,
  share,
  onClose,
  onNotify,
}: {
  open: boolean
  share: ProofShare | null
  onClose: () => void
  onNotify: (message: string, severity?: 'success' | 'error' | 'info') => void
}) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [stamped, setStamped] = useState('')
  const message = share?.message ?? ''
  const preview = stamped || share?.imageDataUrl || ''

  useEffect(() => {
    if (!open || !share?.imageDataUrl || !share.stamp) {
      setStamped('')
      return
    }
    let cancelled = false
    const source = share.imageDataUrl
    const stamp = share.stamp
    setStamped('')
    ;(async () => {
      let next = stamp
      try {
        const place = await reverseGeocode(stamp.lat, stamp.lng)
        next = { ...stamp, placeName: place.placeName, address: place.address }
      } catch {
        /* keep the saved place and address */
      }
      try {
        const url = await renderGpsStamp(source, next)
        if (!cancelled) setStamped(url)
      } catch {
        if (!cancelled) setStamped('')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, share])

  const prepareFile = async () => {
    if (!share?.imageDataUrl) throw new Error('This record has no proof image to share.')
    const jpeg = stamped || (await toJpegDataUrl(share.imageDataUrl))
    return new File([dataUrlBytes(jpeg)], share.filename, { type: 'image/jpeg' })
  }

  const downloadImage = async () => {
    setBusy(true)
    try {
      const file = await prepareFile()
      downloadBlob(file, file.name)
      onNotify('Proof image downloaded. Attach that file when you share.', 'success')
    } catch (caught) {
      onNotify(caught instanceof Error ? caught.message : 'Could not download the image.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const shareImage = async () => {
    setBusy(true)
    try {
      const file = await prepareFile()
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: message, title: file.name })
        onNotify('Proof image handed to the share sheet.', 'success')
        onClose()
        return
      }
      downloadBlob(file, file.name)
      onNotify('This browser cannot attach the photo to WhatsApp directly. The image was downloaded — attach that file in the chat.', 'info')
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'AbortError') return
      onNotify(caught instanceof Error ? caught.message : 'Could not share the image.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const openChat = () => {
    const digits = phone.replace(/\D/g, '')
    if (digits && (digits.length < 10 || digits.length > 15)) {
      setError('Enter a country code and number, or leave the phone blank to choose a chat.')
      return
    }
    const popup = window.open(whatsAppUrl(message, digits), '_blank', 'noopener,noreferrer')
    if (!popup) {
      onNotify('The browser blocked the new tab. Copy the message and open WhatsApp manually.', 'info')
      return
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Share proof image</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            The shared photo includes a location card with the place name, address, coordinates, and time.
          </Typography>
          {share?.stamp && !stamped && (
            <Typography variant="body2" color="text.secondary">Adding the location card…</Typography>
          )}
          {preview && (
            <Box component="img" src={preview} alt="Proof to share" sx={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 2, bgcolor: '#111' }} />
          )}
          <TextField
            label="Phone number (optional)"
            placeholder="91XXXXXXXXXX"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value)
              setError('')
            }}
            helperText={error || 'Leave blank to open WhatsApp and choose a chat. Include the country code if you enter a number.'}
            error={Boolean(error)}
          />
          <TextField label="Message preview" value={message} multiline minRows={8} slotProps={{ input: { readOnly: true } }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          disabled={busy || !share?.imageDataUrl || Boolean(share?.stamp && !stamped)}
          startIcon={<Download size={16} />}
          onClick={() => void downloadImage()}
        >
          Download image
        </Button>
        <Button
          disabled={busy || !share?.imageDataUrl || Boolean(share?.stamp && !stamped)}
          startIcon={<Share2 size={16} />}
          onClick={() => void shareImage()}
        >
          Share image
        </Button>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(message).then(
              () => onNotify('Message copied.', 'success'),
              () => onNotify('Could not copy the message.', 'error'),
            )
          }}
        >
          Copy message
        </Button>
        <Button variant="contained" disabled={busy} onClick={openChat}>
          Open WhatsApp
        </Button>
      </DialogActions>
    </Dialog>
  )
}
