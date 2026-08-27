import type { School } from '../types'

/**
 * `yishuv_name` arrives from the API with literal double quotes around it on
 * some rows, e.g. `"תל אביב"`. Strip them so the town reads the same wherever
 * it is printed, and so a row with no town at all comes back as an empty
 * string rather than a pair of stray quote marks.
 */
export function getCityName(school: School): string {
  return (school.yishuv_name ?? '').replace(/^"|"$/g, '')
}
