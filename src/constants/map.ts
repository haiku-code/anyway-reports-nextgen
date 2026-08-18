// The exact green anyway.co.il paints its school pin with, sampled from the
// marker inside the embedded map. The caption above the map tells the reader to
// look for the green pin, so the swatch it shows has to be that same green
// rather than a Tailwind approximation of it.
export const SCHOOL_MARKER_GREEN = '#9bc53d'

// anyway serves two builds of the same map. www.anyway.co.il runs `master`;
// dfc2 runs the `new-cbs-format` branch, which is the one this report embeds.
export const MAP_BASE_URL = 'https://www.dfc2.anyway.co.il/'

// Every filter below carries a "no filter" sentinel, and the two builds agree on
// all of them except acctype. new-cbs-format compares against
// SHOW_ALL_ACCIDENT_TYPES = 1, so the acctype=0 that master reads as "all types"
// asks it for accident_type == 0 instead, which nothing matches and the map
// comes back empty. That branch also renumbered the accident types themselves
// (1206, 1369 and up), so master's 1..20 codes mean nothing to it.
//
// This value is pinned to MAP_BASE_URL and has to move with it: against
// www.anyway.co.il, acctype=1 would narrow the map to pedestrian injuries alone.
const ALL_ACCIDENT_TYPES = 1

// age_groups=234 is a magic value the backend expands to ages 2,3,4 and, on the
// way, switches on its light_transportation filter. That filter is what limits
// the map to the pedestrians, cyclists and scooter riders the caption promises,
// so the literal 234 has to stay exactly as is rather than become 2,3,4.
const SCHOOL_AGE_GROUPS = 234

export const MAP_EMBED_FILTERS = [
  'start_date=2020-06-01',
  'end_date=2025-05-31',
  'show_fatal=1',
  'show_severe=1',
  'show_light=1',
  'approx=1',
  'accurate=1',
  'show_markers=1',
  'show_discussions=',
  'show_urban=3',
  'show_intersection=3',
  'show_lane=3',
  'show_day=7',
  'show_holiday=0',
  'show_time=24',
  'start_time=7',
  'end_time=19',
  'weather=0',
  'road=0',
  'separation=0',
  'surface=0',
  `acctype=${ALL_ACCIDENT_TYPES}`,
  'controlmeasure=0',
  'district=0',
  'case_type=0',
  'show_rsa=0',
  `age_groups=${SCHOOL_AGE_GROUPS}`,
  'hide_search=true',
  'map_only=true',
].join('&')
