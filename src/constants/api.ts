// anyway serves two builds of the same backend. www.anyway.co.il runs `master`,
// whose school data stops at May 2025. dfc2 runs `new-cbs-format`, which is the
// edition this report is written against: its /api/injured-around-schools
// returns accident years through 2026, matching the 2021-2026 window in
// Stats.tsx and the generated tables in src/data/.
//
// This has to stay the same build MAP_BASE_URL points at. Pointing the two at
// different hosts would put the map and the numbers beside it on different
// editions of the data.
//
// Known gap on this build: /api/injured-around-schools-months-graphs-data
// answers 200 with an empty array for every school. The route is fine, the S3
// export behind it is empty, so the fix is not ours and not a matter of picking
// a different host. See "Known gap: the monthly chart has no data on dfc2" in
// CLAUDE.md before touching this.
export const API_BASE_URL = 'https://www.dfc2.anyway.co.il'

export const SCHOOLS_NAMES_URL = `${API_BASE_URL}/api/schools-names`

export const injuredAroundSchoolsUrl = (schoolId: number) =>
  `${API_BASE_URL}/api/injured-around-schools?school_id=${schoolId}`

export const injuredAroundSchoolsMonthsUrl = (schoolId: number) =>
  `${API_BASE_URL}/api/injured-around-schools-months-graphs-data?school_id=${schoolId}`

export const injuredAroundSchoolsSexUrl = (schoolId: number) =>
  `${API_BASE_URL}/api/injured-around-schools-sex-graphs-data?school_id=${schoolId}`
