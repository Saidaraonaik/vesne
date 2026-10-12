import { Component, lazy, Suspense, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Alert, Box, Chip, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { MenuItem } from '@mui/material'
import { panelSx } from '../../theme/theme.ts'
import { formatCoords } from '../../utils/format.ts'
import type { MapPoint } from './mapTypes.ts'

const WorkMap = lazy(() => import('./WorkMap.tsx').then((module) => ({ default: module.WorkMap })))

class MapBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

export function MapExplorer({ points }: { points: MapPoint[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const statuses = useMemo(() => Array.from(new Set(points.map((point) => point.statusLabel))), [points])
  const filtered = points.filter((point) => {
    const haystack = `${point.title} ${point.statusLabel} ${point.details.map((detail) => detail.value).join(' ')}`.toLowerCase()
    const matchesQuery = haystack.includes(query.trim().toLowerCase())
    const matchesStatus = status === 'all' || point.statusLabel === status
    return matchesQuery && matchesStatus
  })

  const list = (
    <Stack spacing={1.25}>
      {filtered.length === 0 && (
        <Typography color="text.secondary">No locations match these filters.</Typography>
      )}
      {filtered.map((point) => (
        <Paper key={point.id} elevation={0} sx={{ ...panelSx, p: 1.5 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{point.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCoords(point.lat, point.lng)}
              </Typography>
            </Box>
            <Chip size="small" label={point.statusLabel} sx={{ bgcolor: point.color, color: '#fff' }} />
          </Stack>
          <Stack spacing={0.25} sx={{ mt: 1 }}>
            {point.details.map((detail) => (
              <Typography key={detail.label} variant="body2">
                <Box component="span" sx={{ color: 'text.secondary' }}>{detail.label}: </Box>
                {detail.value}
              </Typography>
            ))}
          </Stack>
        </Paper>
      ))}
    </Stack>
  )

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Markers use the coordinates saved on each task or approved proof.
      </Alert>
      <Paper elevation={0} sx={{ ...panelSx, p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField size="small" label="Search locations" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth />
          <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 220 }}>
            <MenuItem value="all">All statuses</MenuItem>
            {statuses.map((item) => (
              <MenuItem key={item} value={item}>{item}</MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
          {statuses.map((item) => {
            const match = points.find((point) => point.statusLabel === item)
            return (
              <Chip
                key={item}
                label={item}
                onClick={() => setStatus((current) => (current === item ? 'all' : item))}
                variant={status === item ? 'filled' : 'outlined'}
                sx={{ bgcolor: status === item ? match?.color : 'transparent', color: status === item ? '#fff' : 'text.primary' }}
              />
            )
          })}
        </Stack>
      </Paper>
      {filtered.length === 0 ? (
        list
      ) : (
        <MapBoundary fallback={<Alert severity="warning">The interactive map could not start. Sample locations are listed below.</Alert>}>
          <Suspense fallback={<Box sx={{ display: 'grid', placeItems: 'center', height: 240 }}><CircularProgress /></Box>}>
            <WorkMap points={filtered} />
          </Suspense>
        </MapBoundary>
      )}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.25 }}>Location list</Typography>
        {list}
      </Box>
    </Stack>
  )
}
