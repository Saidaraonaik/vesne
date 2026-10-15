import { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function MapClick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function MoveTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 16))
  }, [lat, lng, map])
  return null
}

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 200)
    return () => window.clearTimeout(timer)
  }, [map])
  return null
}

export function LocationPicker({
  lat,
  lng,
  onPick,
}: {
  lat: number | null
  lng: number | null
  onPick: (lat: number, lng: number) => void
}) {
  const [tileProblem, setTileProblem] = useState(false)
  const hasPoint = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
  const center: [number, number] = hasPoint ? [lat, lng] : [20.5937, 78.9629]

  return (
    <Box sx={{ position: 'relative', zIndex: 0, height: 280, borderRadius: '12px', overflow: 'hidden', border: '1px solid #E6EEF2' }}>
      <MapContainer center={center} zoom={hasPoint ? 16 : 5} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ tileerror: () => setTileProblem(true) }}
        />
        <InvalidateSize />
        <MapClick onPick={onPick} />
        {hasPoint && <MoveTo lat={lat} lng={lng} />}
        {hasPoint && (
          <CircleMarker
            center={[lat, lng]}
            radius={9}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#E4570E', fillOpacity: 1 }}
          />
        )}
      </MapContainer>
      {tileProblem && (
        <Box sx={{ position: 'absolute', left: 12, right: 12, bottom: 12, zIndex: 1000, bgcolor: 'rgba(26,38,51,0.92)', color: '#fff', p: 1.25, borderRadius: '8px' }}>
          <Typography variant="body2">Map tiles could not be loaded. Search or use current location still fills the address.</Typography>
        </Box>
      )}
    </Box>
  )
}
