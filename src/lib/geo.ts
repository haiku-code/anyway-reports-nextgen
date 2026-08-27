import type { School } from '../types'

const EARTH_RADIUS_KM = 6371

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

/**
 * Great-circle distance between two points, in kilometres.
 *
 * Straight line, so it knows nothing about roads, rivers or fences. That is
 * enough here: the figure is never printed, it only ranks institutions by
 * nearness, and for that the ordering is what matters.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

/**
 * The `count` institutions closest to a point, nearest first. Rows without
 * usable coordinates are skipped rather than sorted to one end, where they
 * would either crowd out real results or look like a silent failure.
 */
export function findNearestSchools(
  schools: School[],
  latitude: number,
  longitude: number,
  count: number
): School[] {
  return schools
    .filter((school) => Number.isFinite(school.latitude) && Number.isFinite(school.longitude))
    .map((school) => ({
      school,
      distance: haversineKm(latitude, longitude, school.latitude, school.longitude),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map((entry) => entry.school)
}
