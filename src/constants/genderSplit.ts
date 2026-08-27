import type { GenderTone } from '../types'

// Two distinct hues, not two shades of one. Sex is a nominal category, and a
// light-to-dark ramp of a single hue is the encoding for magnitude: readers take
// the darker step as "more", which invents a ranking between two categories that
// have none. Datawrapper puts it plainly, that a one-hue ramp "will imply a
// ranking of your categories".
//
// Teal is the saturated sibling of the cyan the report already uses for its
// #E8F7FC panels; violet appears nowhere else in the report. Neither goes near
// the severity yellow/orange/red, which mean injury level everywhere else, and
// the pair sidesteps the pink/blue gender cliche. Both clear 3:1 against the
// white card on their own, so the bar needs no outline to hold its edges, and
// both take white labels at 4.59:1 and 8.56:1.
//
// Checked with the data-viz palette validator against a #ffffff surface:
// lightness band PASS, CVD separation dE 15.0 PASS, normal vision dE 19.0 PASS,
// contrast PASS. Chroma reads 0.098 against a 0.100 floor, a deliberate miss:
// a slightly muted teal suits this report's restrained palette.
//
// Slots three and four only come into play if the API ever returns more than
// the two categories it returns today.
export const GENDER_TONES: GenderTone[] = [
  { fill: '#1B7F9E', text: '#FFFFFF' },
  { fill: '#4A3AA7', text: '#FFFFFF' },
  { fill: '#1BAF7A', text: '#FFFFFF' },
  { fill: '#A35A00', text: '#FFFFFF' },
]

// Bar order. Sorting by it rather than by count keeps every category on the
// same tone from school to school, so the colors stay learnable while browsing.
// Labels outside this list keep the order the API sent them in, after these.
export const GENDER_ORDER = ['זכר', 'נקבה']

// Under this share the percentage stops fitting inside its own segment: the
// sidebar is the narrowest place the bar renders, around 300px, so 15% of it is
// roughly 45px against a label that needs about 44px with its breathing room.
// A segment below the threshold hands its percentage to the legend instead, so
// the number is never lost, only moved.
export const GENDER_INLINE_LABEL_MIN_PERCENT = 15
