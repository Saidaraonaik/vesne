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
  properties?: PhotonProps
}

export function placeQuery(locationName: string, address: string) {
  return [locationName, address].map((part) => part.trim()).filter(Boolean).join(', ')
}

export interface PlaceSelection {
  label: string
  address: string
  city: string
  state: string
  lat: number
  lng: number
  locationName: string
}

interface PhotonProps {
  name?: string
  housenumber?: string
  street?: string
  city?: string
  state?: string
  locality?: string
  district?: string
  county?: string
}

function cityFrom(props: PhotonProps) {
  if (props.city?.trim()) return props.city.trim()
  if (props.locality?.trim()) return props.locality.trim()
  const district = props.district?.replace(/^Ward\s+\d+\s+/i, '').trim()
  if (district) return district
  return props.county?.trim() ?? ''
}

function addressFrom(props: PhotonProps) {
  const street = [props.housenumber, props.street].filter(Boolean).join(' ').trim()
  const name = props.name?.trim() ?? ''
  if (name && street && name.toLowerCase() !== street.toLowerCase()) return `${name}, ${street}`
  return street || name
}

function placeFromFeature(feature: PhotonFeature, lat?: number, lng?: number): PlaceSelection | null {
  const coordinates = feature.geometry?.coordinates
  const featureLng = coordinates?.[0]
  const featureLat = coordinates?.[1]
  const nextLat = lat ?? featureLat
  const nextLng = lng ?? featureLng
  if (nextLat == null || nextLng == null || !Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return null
  const props = feature.properties ?? {}
  const address = addressFrom(props)
  const city = cityFrom(props)
  const state = props.state?.trim() ?? ''
  const locationName = props.name?.trim() || props.street?.trim() || address || city
  const label = [address || locationName, city, state].filter(Boolean).join(', ')
  if (!label) return null
  return {
    label,
    address: address || locationName,
    city,
    state,
    lat: nextLat,
    lng: nextLng,
    locationName,
  }
}

async function photonFeatures(url: URL) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Could not look up that address.')
  const data = (await response.json()) as { features?: PhotonFeature[] }
  return data.features ?? []
}

export async function searchPlaces(query: string): Promise<PlaceSelection[]> {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '6')
  url.searchParams.set('lang', 'en')
  url.searchParams.set('lat', '22.5')
  url.searchParams.set('lon', '79')
  const features = await photonFeatures(url)
  const places = features.map((feature) => placeFromFeature(feature)).filter((place): place is PlaceSelection => place != null)
  const seen = new Set<string>()
  return places.filter((place) => {
    const key = `${place.label}|${place.lat.toFixed(4)}|${place.lng.toFixed(4)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function reversePlace(lat: number, lng: number): Promise<PlaceSelection> {
  const url = new URL('https://photon.komoot.io/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('lang', 'en')
  const feature = (await photonFeatures(url))[0]
  const place = feature ? placeFromFeature(feature, lat, lng) : null
  if (!place) throw new Error('No address for that point.')
  return place
}

export async function forwardGeocode(query: string): Promise<ForwardGeocodeHit> {
  const [place] = await searchPlaces(query)
  if (!place) throw new Error('No coordinates for that address.')
  return { lat: place.lat, lng: place.lng }
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
