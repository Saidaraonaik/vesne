import { Box, Button, FormHelperText, IconButton } from '@mui/material'
import { X } from 'lucide-react'
import { useState } from 'react'
import { readImageFile } from '../../utils/images.ts'

export function ImageUploadField({
  images,
  onChange,
  label = 'Upload images',
  hint = 'Attach one image or several. You can add more in another selection.',
}: {
  images: string[]
  onChange: (images: string[]) => void
  label?: string
  hint?: string
}) {
  const [error, setError] = useState('')

  return (
    <Box>
      <Button component="label" variant="outlined" size="small">
        {label}
        <input
          hidden
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            event.target.value = ''
            if (files.length === 0) return
            Promise.allSettled(files.map((file) => readImageFile(file))).then((results) => {
              const urls = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
              const failed = results.length - urls.length
              if (urls.length > 0) onChange([...images, ...urls])
              setError(
                failed === 0
                  ? ''
                  : failed === results.length
                    ? 'Could not read those images.'
                    : 'Some images could not be read. The others were added.',
              )
            })
          }}
        />
      </Button>
      <FormHelperText>{error || hint}</FormHelperText>
      {images.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {images.map((src, index) => (
            <Box key={`${index}-${src.slice(-24)}`} sx={{ position: 'relative', width: 88, height: 64 }}>
              <Box
                component="img"
                src={src}
                alt={`Reference ${index + 1}`}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E6EEF2', display: 'block' }}
              />
              <IconButton
                aria-label={`Remove image ${index + 1}`}
                size="small"
                onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 22,
                  height: 22,
                  bgcolor: 'rgba(26, 38, 51, 0.72)',
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(26, 38, 51, 0.9)' },
                }}
              >
                <X size={12} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
