# Prompt: mobile header logo and scroll-triggered sticky search

Date: 2026-08-05
Status: Ready to implement
Type: Implementation prompt (hand this file to Claude Code as the task)

---

## Task

Two related changes to the site header:

1. **Show the ynet logo on mobile.** Today the logo is desktop-only. It should
   appear on mobile too, on the right side of the header, exactly as it does on
   desktop.
2. **Swap the header for a sticky search once the user scrolls past the
   in-page search.** When the school search box scrolls out of the viewport,
   the sticky header stops showing its normal content and shows the school
   search instead, so the user can look up another school from anywhere in the
   article. When the in-page search scrolls back into view, the header returns
   to its normal state.

## Current state

Read these files before changing anything.

| File                              | What is there now                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/App.tsx`                     | Owns all state: `schools` and `selectedId`. Renders `<Header />`, `<Hero />`, `<Report />` as siblings. No router, no context, no state library.               |
| `src/components/Header.tsx`       | `sticky top-0 z-50`. Tracks its own `isScrolled` (`window.scrollY > 10`) and shrinks padding and logo height. Logo anchor is `hidden md:block` (line 41).      |
| `src/components/Report.tsx`       | Renders `<SchoolSelect>` in two different layout branches: centered and full width when no school is selected (line 140), in a 30% left column when one is (line 148). |
| `src/components/SchoolSelect.tsx` | Headless UI `Combobox`. Owns `query`, `selected`, `isFocused`, `isTyping`, `isMobile`. Wrapper div carries `id="schoolSearch"` (line 117).                     |

Relevant existing behavior worth knowing:

- The page is `dir="rtl"` (set in `index.html`). The header row is
  `flex justify-between`, so the first child already lands on the right. The
  logo is missing on mobile purely because of `hidden md:block`, not because of
  ordering. Do not add `order-*` or directional utilities to "fix" a problem
  that does not exist.
- `SchoolSelect.handleFocus` (lines 86 to 102) scrolls `#schoolSearch` to the
  top of the viewport on mobile focus.
- `SchoolSelect` injects a `<style>` block at the end of its own render (lines
  199 to 243).

## Requirements

### 1. Mobile logo

- Remove `hidden md:block` from the logo anchor so it renders at every
  breakpoint.
- Keep the existing scroll-shrink sizing behavior. The current classes already
  encode a mobile size that was never visible (`h-8` unscrolled, `h-6`
  scrolled); verify those read well at 360px wide and adjust only if they do
  not.
- The logo stays a link to ynet, opening in a new tab, with
  `rel="noopener noreferrer"`.

### 2. Sticky search swap

**Trigger.** Use an `IntersectionObserver` on the in-page search block, not a
hardcoded `scrollY` threshold. The hero is `h-[873px]` and the search sits in
one of two different layouts depending on whether a school is selected, so any
pixel constant would be wrong in at least one state. The sticky search shows
exactly when the real search box is out of the viewport and hides when it comes
back, which also guarantees two search inputs are never visible at once.

Add a small hysteresis or a `rootMargin` so the swap does not flicker when the
search sits right at the viewport edge.

**Mobile presentation (under `md`).** Full replacement: the header row shows
only the search input. Logo and share icons are hidden while the sticky search
is active, and come back when it deactivates. There is not enough horizontal
room at 360px for anything else.

```
at rest, top of page          scrolled past the search
┌──────────────────────────┐  ┌──────────────────────────┐
│ ✉ 𝕏 ⓦ           ynet    │  │ [🔍 הקלד שם מוסד לימודים]│
└──────────────────────────┘  └──────────────────────────┘
```

**Desktop presentation (`md` and up).** Merge the search into the existing
header row rather than adding a second sticky bar below it. Logo stays on the
right, share icons stay on the left, the search occupies the empty middle
(cap it around `max-w-md`).

```
at rest, top of page                    scrolled past the search
┌────────────────────────────────────┐  ┌────────────────────────────────────┐
│ ✉ 𝕏 ⓦ                     ynet    │  │ ✉ 𝕏 ⓦ  [🔍 חיפוש...]      ynet    │
└────────────────────────────────────┘  └────────────────────────────────────┘
```

Rationale for merging on desktop instead of stacking a second bar:

- The desktop header row is mostly empty space between the logo and the share
  icons. The search fits there without displacing anything.
- One sticky element occupies roughly 60px of vertical space instead of two
  stacked elements occupying roughly 120px, on a page that is a long read.
- The share icons stay reachable for the whole article. This is a co-published
  ynet piece, so sharing is a real goal, and hiding the icons for 90% of the
  scroll depth would cost more than it gains.
- The ynet logo stays visible throughout, which is the point of requirement 1.

This deviates from "search only" on desktop, deliberately. If the desktop
header should also drop to search-only, that is a one-line change to the
conditional and everything else in this spec still holds.

**Transition.** Reuse the existing `transition-all duration-300` idiom already
in `Header.tsx`. Do not animate layout-shifting properties in a way that makes
the page jump; the header height should stay stable across the swap. Respect
`prefers-reduced-motion`.

### 3. Selecting a school from the sticky search

Selecting a school from the sticky search scrolls the page back up to the
results section (the map and stats block in `Report.tsx`), so the user sees
what they just searched for. Use `scrollIntoView({ behavior: 'smooth' })`, and
skip the smooth behavior under `prefers-reduced-motion`.

Note the state ordering: when no school is selected yet, `Report.tsx` renders
the centered layout with no map. Selecting a school switches it to the two
column layout. Make sure the scroll target exists at the moment you scroll to
it, which likely means scrolling in an effect keyed on `selectedId` rather than
inside the select handler.

## Implementation notes

### State plumbing

`Header` needs `schools` and a way to set `selectedId`, both of which live in
`App.tsx`. Follow the existing convention: prop drilling from `App`, no context
and no state library. `Report.tsx` already receives exactly this pair, so pass
the same things to `Header`.

The observer needs a reference to the in-page search block, which is inside
`Report`. Suggested shape, but use your judgment:

- `App` creates the ref and holds the resulting boolean.
- `App` passes the ref down through `Report` to whatever wraps `SchoolSelect`.
- `App` passes the boolean to `Header`.

Put the observer logic in its own hook file, for example
`src/hooks/useIsOutOfView.ts`. Per the project rules, hooks do not live inline
in component files.

`Header` currently derives `isScrolled` from a scroll listener. Consider whether
that listener is still needed once the observer exists, or whether the two
signals should stay independent (they answer different questions: "has the user
scrolled at all" versus "is the search off screen").

### Two SchoolSelect instances, three real gotchas

The sticky search should reuse `SchoolSelect` rather than duplicating a
combobox. That means two instances mount at once, even though only one is
visible. Handle these:

1. **Duplicate DOM id.** `id="schoolSearch"` is hardcoded on the wrapper (line
   117). Two instances produce two elements with the same id, which breaks the
   `getElementById` call in `handleFocus`. Make the id a prop, or drop the id
   and use a ref.
2. **Mobile focus scroll is wrong in the sticky bar.** `handleFocus` scrolls the
   search box to the top of the viewport. In the sticky bar the input is already
   pinned at the top, so this fires a pointless scroll. Gate it behind a prop.
3. **Duplicate `<style>` block.** Each instance injects the same keyframes and
   `.mobile-focused` rule. Move that CSS into `src/index.css` and delete the
   inline `<style>` block.

Independent `query` state per instance is fine and needs no fix. `handleSelect`
already clears `query` on select, so both instances end up showing an empty
input and the user sees no divergence.

### Project rules that apply

- Prefer CSS responsive classes over JS breakpoint hooks. `SchoolSelect` and
  `Hero` both carry a `useState` plus resize listener `isMobile`, which is the
  pattern the rules say to avoid. Do not add a third one. Drive the mobile
  versus desktop header difference with Tailwind `md:` classes off a single
  boolean.
- No `any` without an inline comment explaining why.
- One component per file. Hooks, utils, types and constants in their own files.
- Reuse `Typography.tsx` wrappers rather than hand-writing `text-[Npx]`.
- `cn()` in `src/lib/utils.ts` is a plain join, not `tailwind-merge`.
  Conflicting Tailwind classes are not deduplicated, so build class strings
  conditionally instead of relying on override order.
- Hebrew copy is published content. Never use em dashes or en dashes anywhere in
  this repo.
- Run `npm run format` rather than hand-aligning.

## Out of scope

- Redesigning `SchoolSelect` itself (results dropdown, highlighting, spinner).
- Changing the two-branch layout logic in `Report.tsx`.
- Touching `index.html`, the tracking block, or anything deployment related.
- The two pre-existing `react/no-unescaped-entities` lint errors in `Hero.tsx`.
  `npm run lint` already fails on them. Leave them alone and do not count them
  as a regression you caused.

## Acceptance criteria

- [ ] At 360px, top of page: ynet logo is visible on the right of the header,
      share icons on the left.
- [ ] At 360px, scrolled past the search: header shows the search input only.
      Logo and share icons are gone.
- [ ] At 1440px, scrolled past the search: header shows logo on the right,
      search in the middle, share icons on the left, all on one row.
- [ ] Scrolling back up restores the normal header at both breakpoints.
- [ ] Two search inputs are never visible at the same time, in either the
      "no school selected" or "school selected" layout.
- [ ] Typing in the sticky search returns the same suggestions as the in-page
      search.
- [ ] Selecting a school from the sticky search updates the map and stats and
      scrolls the page to them.
- [ ] The header does not change height across the swap, and the page does not
      jump.
- [ ] Keyboard: the sticky search is reachable by Tab, the combobox opens and
      closes with the keyboard, and focus is never trapped.
- [ ] No duplicate DOM ids in the rendered page.
- [ ] `npm run build` succeeds.
- [ ] `npm run lint` produces no errors other than the two known `Hero.tsx`
      ones.

## Verification

There is no test framework in this repo. Verify by:

1. `npm run build` and confirm it passes.
2. `npm run dev`, then check the acceptance criteria in a browser at 360px and
   1440px, in both the "no school selected" and "school selected" states.
3. Check the RTL layout specifically. The logo must sit on the right, not the
   left, at every breakpoint and in both header states.
