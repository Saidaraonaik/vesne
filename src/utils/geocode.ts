export interface PlaceLookup {
  placeName: string
  address: string
}

export interface ForwardGeocodeHit {
  lat: number
  lng: number
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] }
  properties?: { name?: string; city?: string; country?: string }
}

export function placeQuery(locationName: string, address: string) {
  return [locationName, address].map((part) => part.trim()).filter(Boolean).join(', ')
}

export async function forwardGeocode(query: string): Promise<ForwardGeocodeHit> {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '1')
  url.searchParams.set('lang', 'en')
  url.searchParams.set('lat', '22.5')
  url.searchParams.set('lon', '79')
  const response = await fetch(url)
  if (!response.ok) throw new Error('Could not look up that address.')
  const data = (await response.json()) as { features?: PhotonFeature[] }
  const coordinates = data.features?.[0]?.geometry?.coordinates
  if (!coordinates || coordinates.length < 2) throw new Error('No coordinates for that address.')
  const [lng, lat] = coordinates
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('No coordinates for that address.')
  return { lat, lng }
}

interface ReverseGeocodeResponse {
  locality?: string
  city?: string
  principalSubdivision?: string
  countryName?: string
  postcode?: string
  plusCode?: string
}

export async function reverseGeocode(lat: number, lng: number): Promise<PlaceLookup> {
  const url = new URL('https://api-bdc.io/data/reverse-geocode-client')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('localityLanguage', 'en')
  const response = await fetch(url)
  if (!response.ok) throw new Error('Could not look up that location.')
  const data = (await response.json()) as ReverseGeocodeResponse
  const locality = (data.locality || data.city || '').trim()
  const state = (data.principalSubdivision || '').trim()
  const country = (data.countryName || '').trim()
  const postcode = (data.postcode || '').trim()
  const plusCode = (data.plusCode || '').trim()
  const placeName = [locality, state, country].filter(Boolean).join(', ')
  const region = [state, postcode].filter(Boolean).join(' ')
  const address = [plusCode, locality, region, country].filter(Boolean).join(', ')
  if (!placeName) throw new Error('No place name for those coordinates.')
  return { placeName, address: address || placeName }
}
