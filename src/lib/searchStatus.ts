type SearchStatusInput = {
  query: string
  matchCount: number
  totalCount: number
  cap: number
}

/**
 * The line under the school search. At rest it states the size of the dataset,
 * while typing it reports how many institutions match and whether the list is
 * showing all of them.
 */
export function getSearchStatus({ query, matchCount, totalCount, cap }: SearchStatusInput): string {
  if (!query.trim()) {
    if (!totalCount) return 'טוען את רשימת מוסדות הלימוד'
    return `${totalCount.toLocaleString('he-IL')} מוסדות לימוד במאגר`
  }

  if (matchCount === 0) return 'לא נמצאו מוסדות. נסו שם חלקי, או חפשו לפי יישוב'
  if (matchCount === 1) return 'מוסד אחד תואם'
  if (matchCount > cap) {
    return `${matchCount.toLocaleString('he-IL')} מוסדות תואמים, מוצגים ${cap} הראשונים`
  }

  return `${matchCount} מוסדות תואמים`
}
