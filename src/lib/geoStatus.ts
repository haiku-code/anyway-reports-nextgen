import { GeolocationStatus } from '../types'

/**
 * The line the school search prints while locating the reader, or after it
 * failed to. Returns null for the two states that speak for themselves: Idle,
 * where the status line still belongs to the dataset count, and Ready, where
 * the panel of nearby institutions is the answer.
 */
export function getGeolocationMessage(status: GeolocationStatus): string | null {
  switch (status) {
    case GeolocationStatus.Locating:
      return 'מאתר את המיקום שלכם'
    case GeolocationStatus.Denied:
      return 'אין הרשאת מיקום. חפשו לפי שם מוסד או יישוב'
    case GeolocationStatus.Unavailable:
      return 'איתור מיקום לא נתמך בדפדפן הזה'
    case GeolocationStatus.Error:
      return 'לא הצלחנו לאתר מיקום. נסו שוב'
    default:
      return null
  }
}
