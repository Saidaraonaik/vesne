import { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'
import { Download, Share2 } from 'lucide-react'
import { downloadBlob } from '../../utils/download.ts'
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
  const message = share?.message ?? ''

  const prepareFile = async () => {
    if (!share?.imageDataUrl) throw new Error('This record has no proof image to share.')
    const jpeg = await toJpegDataUrl(share.imageDataUrl)
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
            This uses the current photograph stored in this browser. WhatsApp’s link carries the text. Use Share image or Download image to send the photograph itself.
          </Typography>
          {share?.imageDataUrl && (
            <Box component="img" src={share.imageDataUrl} alt="Proof to share" sx={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 2 }} />
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
          disabled={busy || !share?.imageDataUrl}
          startIcon={<Download size={16} />}
          onClick={() => void downloadImage()}
        >
          Download image
        </Button>
        <Button
          disabled={busy || !share?.imageDataUrl}
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
