export interface MapPoint {
  id: string
  lat: number
  lng: number
  title: string
  status: string
  statusLabel: string
  color: string
  details: { label: string; value: string }[]
}
