# Prominent School Search - Design

Date: 2026-08-09
Status: Built. Amended after review and after the screenshot pass, so this
describes what shipped rather than what was first proposed. Section 8 and the
second half of 4a record decisions that were reversed.

## Problem

Searching for an educational institution is the point of this report. The hero
subtitle says so outright: "כתבו את שם המוסד החינוכי, גלו אותם במפה והצילו
חיים". The search itself does not carry that weight.

Measured against the running dev build:

1. **Invisible on load.** At 1440x900 the hero is 873px and the header 92px, so
   the search block starts 965px down: entirely below the fold. At 390x844 only
   the caption and the top edge of the field peek in, and real mobile browser
   chrome eats even that.
2. **Does not read as a search tool.** The field is a bare `border-b-2`
   underline (`SchoolSelect.tsx:169`). Search UX consensus (NN/G, IxDF) is that
   a search field should be a bounded box that contrasts with its surroundings.
   An underline reads as a form field inside a document.
3. **The label is not a call to action.** "חפשו את מוסד הלימודים שלכם" is
   rendered with `TableCaption` (`Report.tsx:173`), the same visual class as the
   table headings further down the page, at weight 400.
4. **Dead empty state.** Before typing, the panel is closed and the status line
   says only how many institutions are in the dataset. Nothing demonstrates what
   the tool does.
5. **No colour anchor.** The whole block is ink on white. Red is unavailable: it
   is reserved for fatalities in the charts (`index.css:5`).

## Decisions taken

The search **stays where it is**, between the hero and the article. Moving it
into the hero was considered and rejected: it would compress the editorial
composition. This is an explicit trade-off, accepted with the knowledge that a
restyle alone cannot make the search visible at first paint. A scroll cue in the
hero was tried as partial compensation and cut; see section 8.

## 1. Surface band

The search block, in the "no school selected" state only, sits on a full-bleed
band of the hero's own pale blue.

New theme token in `src/index.css`:

```css
--color-hero-mist: #e8f7fc;
```

Rationale: with position fixed, the strongest remaining lever is contrast of
_region_ rather than of element. A tinted band lifts the block out of the white
document body. The colour is already in the palette (the hero scrims use
`rgba(232,247,252,…)`), so the reader scrolls from the hero's blue straight into
blue and reads it as one continuous zone. It touches neither the fatality red
nor the trend colours.

The hero's existing gradient stops keep their literal rgba values. They carry
alpha and are not a `bg-*` utility, so converting them buys nothing.

The "school selected" state keeps its current bordered card with no band. There
the search is a control, not a call to action. This is a deliberate divergence
between the two states.

## 2. Heading

`TableCaption` is replaced. `src/components/Typography.tsx` gains a variant:

| variant       | mobile                                                    | desktop          |
| ------------- | --------------------------------------------------------- | ---------------- |
| `section-cta` | `text-[28px] leading-[1.1] tracking-[-0.01em] font-[640]` | `md:text-[44px]` |

plus a `SectionCta` wrapper rendering `<h2>`, matching the file's existing
pattern of named wrappers.

Copy:

- Heading: `חפשו את מוסד הלימודים שלכם`
- Subline, one line, `font-text`, ink at reduced opacity:
  `הקלידו שם מוסד או יישוב, וראו אילו כבישים סביבו מסוכנים`

The subline does not repeat the institution count; the status line under the
field already prints it.

## 3. Field anatomy

RTL, from start (right) to end (left):

```
┌─────────────────────────────────────────────┐
│ 🔍  שם מוסד או יישוב            ✕  [ חיפוש ]│
└─────────────────────────────────────────────┘
   ↳ מוסדות קרובים אליי      5,607 מוסדות במאגר
```

- **Leading magnifier**, decorative (`aria-hidden`), at the start of the field.
  The universal recognition cue.
- **Input.** White fill, `rounded-xl`, 2px `ink/25` border. Focus takes the
  border to full `ink` plus a visible ring. Height 56px under `sm`, 64px above.
- **Clear (✕)** inside the field at the end, only when the field holds text.
  Existing behaviour, restyled.
- **Submit button**, solid ink fill, white label `חיפוש`. Rendered from `sm:`
  up only. Below `sm` it would squeeze the input past usability at 360px, and
  mobile users type and tap a suggestion anyway.

  The button is not decorative. Clicking it selects the first suggestion,
  exactly as Enter does. NN/G finds that many users still expect to click
  something to submit; a button that does nothing breaks that expectation.

The sticky header variant keeps the same boxed treatment at compact scale, so
the two instances read as one component. It keeps its existing `isSticky`
branches rather than growing a second component.

## 4. Empty state

Two independent additions.

### 4a. Shortcut panel on focus

Focusing an empty field opens the panel on a short list of **towns** rather than
nothing, under the heading `היישובים עם הכי הרבה נפגעים סביב מוסדות חינוך`. Each
row prints the town and its casualty count. Pressing one writes the town into
the field and hands back to the search, which then lists that town's
institutions: the same thing typing the name does, and the clearest
demonstration of it.

The six come from `TopCitiesTable`'s own published rows, so `topCitiesData` moves
to `src/constants/topCities.ts` and both the table and the search read one copy.
They are cut by `totalInjured` rather than by the composite score the table ranks
on, because a list that prints counts has to be ordered by the counts it prints
or it reads as a bug. Both cuts are the same sourced data, and the heading says
which one this is.

**Why towns and not institutions.** An earlier draft of this spec listed six
hand-picked institutions. That was dropped for two reasons. The editorial one:
this report is about dangerous roads, and naming institutions in a list can be
read as saying those institutions are dangerous, which would have needed sign-off
on every name. The factual one: per-institution casualty counts do not exist in
this app at all. The live API returns them one school at a time, and the
hardcoded tables are per-city and per-cluster, a cluster being an area of 29 to
65 institutions rather than a school. Towns say something true that the report
already publishes, and name no one.

**Pointer only.** The rows carry `tabIndex={-1}`. Headless UI closes the panel
the moment the input loses focus, so a tab stop inside it is one that unmounts as
it is reached; this was tested, not assumed. Nothing is lost, because the rows
type a town name and a keyboard reader is already typing.

### 4b. Find an institution near me

A low-weight text button directly under the field, always visible rather than
hidden until focus, sharing a row with the existing status text: button at the
start, status at the end. The row wraps rather than switching at a breakpoint:
`מוסדות קרובים אליי` and `5,607 מוסדות לימוד במאגר` do fit one line at 390px, and
below that they stack by themselves, button first.

On click it requests geolocation and shows the **five nearest institutions** in
the panel. It does not auto-select the single nearest: the closest institution
by straight-line distance is often a kindergarten across the street rather than
the school the reader wants, and a wrong auto-jump is worse than a list.

Feasibility confirmed against the live API: `/api/schools-names` returns 5,607
rows and every one carries `latitude` and `longitude` (0 missing). No additional
endpoint and no server work.

States, each with its own copy, announced through `aria-live`:

| state         | copy                                         |
| ------------- | -------------------------------------------- |
| `Idle`        | `מוסדות קרובים אליי`                         |
| `Locating`    | `מאתר את המיקום שלכם`                        |
| `Ready`       | panel shows the five nearest                 |
| `Denied`      | `אין הרשאת מיקום. חפשו לפי שם מוסד או יישוב` |
| `Unavailable` | `איתור מיקום לא נתמך בדפדפן הזה`             |
| `Error`       | `לא הצלחנו לאתר מיקום. נסו שוב`              |

Both hosts serve HTTPS, which the Geolocation API requires.

## 5. Files

| file                                | change                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `src/lib/geo.ts`                    | new. Haversine + `findNearestSchools(schools, lat, lng, count)`         |
| `src/lib/geoStatus.ts`              | new. The copy for each geolocation state                                |
| `src/hooks/useNearbySchools.ts`     | new. Wraps `navigator.geolocation`, exposes status and results          |
| `src/constants/topCities.ts`        | new. `topCitiesData` moved out of the table, plus the cut by casualties |
| `src/types.ts`                      | `GeolocationStatus`                                                     |
| `src/components/Typography.tsx`     | `section-cta` variant, `SectionCta` wrapper                             |
| `src/components/SchoolSelect.tsx`   | new anatomy, both variants, empty-state panel                           |
| `src/components/TopCitiesTable.tsx` | reads its data from the constants file                                  |
| `src/components/Report.tsx`         | band, new heading, subline                                              |
| `src/index.css`                     | `--color-hero-mist`, mobile focus scroll margin                         |

`GeolocationStatus` is a const object with a companion type, not a TS enum.
`tsconfig` sets `erasableSyntaxOnly`, which rejects enums outright; this is the
established pattern in `src/types.ts` (`SchoolSelectVariant`, `TransportMode`,
`TrendDirection`). This overrides the global "prefer TS enums" rule, which the
toolchain here makes impossible.

Hooks, geo maths, and constants live in their own files, per the project's
separation rules. `SchoolSelect.tsx` stays a single component.

## 6. Accessibility

- A real `<label>` bound to the input, visually hidden.
- `aria-label` on the submit and clear buttons.
- `aria-live="polite"` on the status line, covering both match counts and
  geolocation states.
- Touch targets at least 44px, meeting the 9mm W3C guideline.
- Visible focus ring on the field and both buttons; not colour alone.
- The suggestions panel keeps Headless UI's `Combobox` keyboard model. The
  geolocation button sits outside the combobox in the tab order, before it.

## 7. Verification

There is no test framework here. Verification is:

- `npm run build` clean.
- `npm run lint` shows only the two pre-existing
  `react/no-unescaped-entities` errors in `Hero.tsx` and no new ones.
- Screenshots at 390x844 and 1440x900, in each of: default, focused-empty,
  typing with matches, no matches, school selected, sticky header active.
- Geolocation checked in the granted, denied, and unsupported paths.
- Contrast checked for ink on `--color-hero-mist` and white on ink.

## 8. Hero scroll cue: built, then cut

A cue was built at the bottom of the hero, `חפשו את המוסד שלכם` with a bouncing
chevron anchored to `#schoolSearch`. It was cut on review, in two steps: first
the words, which only repeated the heading it scrolled to, and then the chevron
with them.

Two things are worth keeping from it. `ScrollIndicator.tsx` was not reusable: it
and `HorizontalScrollIndicator.tsx` are byte-identical horizontal table cues that
both export a function named `HorizontalScrollIndicator`, which is a duplicate
worth cleaning up separately. And the hero's `md:bottom-15` had to become
`md:bottom-28` for the cue to clear the fold at 900px, since hero 873 plus header
92 puts the hero's floor at 965. That offset is reverted along with the cue.

The first screen therefore signals nothing about the search. That is the accepted
cost of leaving the search where it is, stated in Decisions taken.

## 9. Risks

- **A tinted band immediately below the hero can read as the end of the page.**
  Checked on the screenshots from section 7 and softened if it does.
- **The two search states look different** (band pre-selection, plain card
  post-selection). Deliberate, and revisited if it reads as inconsistent.
- **Geolocation can be denied or slow.** Every state has copy; the button never
  stays stuck on "מאתר".
- **Naming institutions in a report about dangerous roads.** Retired: the panel
  lists towns, not institutions. See section 4a.
- **Mobile focus scroll.** Flagged here as out of scope, then found broken on the
  screenshot pass and fixed. `.mobile-focused` had `scroll-margin-top: 2rem`
  against a 3rem header, so the field landed underneath it and only its own
  `z-index: 1000` kept it readable, drawn over the logo and the share icons. Now
  `3.5rem`. The `setTimeout(100)` remains, still fragile against the on-screen
  keyboard, still out of scope.

## 10. What Headless UI cost

Three defects found by testing, all from the same root: the combobox owns state
this design needs to reach into. Recorded so the next person does not rediscover
them.

- **An open panel is modal by default,** which marks the rest of the page
  `inert`. The submit, clear and locate buttons were unreachable exactly while
  the panel they belong to was open. Fixed with `modal={false}`.
- **A press on anything the library does not own reads as a press outside** and
  closes the panel, even when the press never moves focus. This broke the town
  shortcuts and the geolocation results. The shortcuts are fixed structurally, by
  living inside the panel element; the geolocation results by blurring and
  refocusing the input when a fix lands, since `focus()` alone will not reopen a
  field that never lost focus.
- **The panel and its options render as `div`s,** so the `<li>` rows the previous
  code nested in them were invalid. They are `div`s now.

## Non-goals

- Moving the search into the hero.
- Routing, deep links, or shareable per-school URLs.
- Touching the hardcoded aggregate tables below the interactive section.
- Fixing the pre-existing `Hero.tsx` lint errors.
