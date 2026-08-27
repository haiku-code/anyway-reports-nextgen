import { useCallback, useState } from 'react'
import { GeolocationStatus, type School } from '../types'
import { findNearestSchools } from '../lib/geo'

// Five, not one. The nearest institution in a straight line is often a
// kindergarten across the street rather than the school the reader came for,
// and a wrong jump costs more than a short list.
const NEAREST_COUNT = 5

const POSITION_OPTIONS: PositionOptions = {
  // Long enough for a cold GPS fix on a phone, short enough that the button
  // does not sit on "מאתר" indefinitely.
  timeout: 10_000,
  // Institutions are hundreds of metres apart, so a coarse fix ranks them just
  // as well as a precise one and arrives far sooner.
  enableHighAccuracy: false,
  // A fix from the last five minutes answers a second click instantly.
  maximumAge: 5 * 60 * 1000,
}

/**
 * Locates the reader and hands back the institutions nearest to them.
 *
 * Every school row from the API carries coordinates, so this runs entirely in
 * the browser: no endpoint, no key, nothing sent anywhere. Requires a secure
 * context, which both hosts are.
 */
export function useNearbySchools(schools: School[], count: number = NEAREST_COUNT) {
  const [status, setStatus] = useState<GeolocationStatus>(GeolocationStatus.Idle)
  const [nearby, setNearby] = useState<School[]>([])

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus(GeolocationStatus.Unavailable)
      return
    }

    setStatus(GeolocationStatus.Locating)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearest = findNearestSchools(schools, coords.latitude, coords.longitude, count)

        // A fix with nothing to show means the school list never arrived. That
        // is a failure to answer the reader, whatever its cause, so it says so
        // rather than opening an empty panel.
        setNearby(nearest)
        setStatus(nearest.length ? GeolocationStatus.Ready : GeolocationStatus.Error)
      },
      (error) => {
        setStatus(
          error.code === error.PERMISSION_DENIED
            ? GeolocationStatus.Denied
            : GeolocationStatus.Error
        )
      },
      POSITION_OPTIONS
    )
  }, [schools, count])

  const reset = useCallback(() => {
    setStatus(GeolocationStatus.Idle)
    setNearby([])
  }, [])

  return { status, nearby, locate, reset }
}
