import { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapPoint } from './mapTypes.ts'

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = points.map((point) => [point.lat, point.lng] as [number, number])
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 })
  }, [map, points])
  return null
}

export function WorkMap({ points, height = 460 }: { points: MapPoint[]; height?: number }) {
  const [tileProblem, setTileProblem] = useState(false)
  const first = points[0]
  const center: [number, number] = first ? [first.lat, first.lng] : [17.44, 78.45]

  return (
    <Box sx={{ position: 'relative', zIndex: 0, height, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ tileerror: () => setTileProblem(true) }}
        />
        <FitBounds points={points} />
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={10}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: point.color, fillOpacity: 0.95 }}
          >
            <Popup>
              <div style={{ minWidth: 210, fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }}>
                <strong>{point.title}</strong>
                <div style={{ marginTop: 4, fontSize: 12 }}>{point.statusLabel}</div>
                {point.details.map((detail) => (
                  <div key={detail.label} style={{ marginTop: 4, fontSize: 12 }}>
                    <strong>{detail.label}: </strong>
                    {detail.value}
                  </div>
                ))}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {tileProblem && (
        <Box
          sx={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 12,
            zIndex: 1000,
            bgcolor: 'rgba(15,23,42,0.9)',
            color: '#fff',
            p: 1.25,
            borderRadius: 2,
          }}
        >
          <Typography variant="body2">
            Map tiles could not be loaded. The location list below still shows the saved coordinates.
          </Typography>
        </Box>
      )}
    </Box>
  )
}
