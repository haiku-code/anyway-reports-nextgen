# Editor Fixes Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the seven editorial corrections from `תיקונים לפרויקט דרכים.docx` to the published report: one number, one hero size, one deleted paragraph, two quote rewrites, one section reorder, one deleted credit.

**Architecture:** All changes are copy and layout edits inside existing components, plus one small new component extracted so the map's intro paragraph can travel with the map when the map moves. No data pipeline changes, no API changes, no new dependencies. `Report.tsx` owns section order and is where the reorder happens.

**Tech Stack:** React 19 + TypeScript, Vite 7, Tailwind v4 (CSS-first, configured in `src/index.css`), Hebrew RTL.

**Spec:** `תיקונים לפרויקט דרכים.docx` at the repo root. It is a Word file of editor notes with three screenshots; the notes are transcribed verbatim into the task descriptions below so an executor does not need to open it.

## Global Constraints

- Hebrew copy is user-facing published content. **Never** use em dashes (`—`) or en dashes (`–`), in Hebrew copy or anywhere else in this repo. Use a plain hyphen `-`.
- Use the `Typography` wrappers from `src/components/Typography.tsx` (`MainContent`, `TableCaption`, etc.) rather than hand-writing `text-[Npx]` classes.
- One component per file.
- Prefer logical Tailwind utilities (`border-s`, `ms-`, `pe-`) over `left`/`right` ones. The page is `dir="rtl"`.
- `npm run lint` is currently **clean** (verified 2026-08-26). Any lint error after a change is a regression you caused. In JSX, write Hebrew quotation marks as `&ldquo;` / `&rdquo;` entities, not bare `"` characters, or `react/no-unescaped-entities` will fire.
- Do not touch `src/data/` by hand. Nothing in this plan needs to.
- There is no test framework for the app. Verification is: `npm run lint`, `npm run build`, and looking at `npm run dev` in a browser at both a narrow and a wide viewport.
- **Never run any state-changing git command without asking the user first.** The commit steps below are written out so the executor knows exactly what to propose, but each one requires explicit approval before running.
- Do not deploy. `npm run deploy:prod` and pushing to `main` are both public actions and are out of scope for this plan.

---

## Decisions already made with the user

These were ambiguous in the docx and have been resolved. Do not re-litigate them.

| Question                                                                                           | Decision                                                                                                     |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Where does the "נפגעים בסביבת מוסדות לימוד" block go?                                              | Straight swap with the Google Maps embed. New order: article → transport block → tables → map → Vision Zero. |
| The article's closing paragraph points at "המפה הבאה" and "בטבלאות מטה", both wrong after the swap | Move the paragraph down to sit directly above the map, and reword it.                                        |
| The mobile-only copy of the "מבט על" / "ממצאים מרכזיים" cards inside the article                   | **Leave as is.** Do not remove it, do not change its breakpoints.                                            |
| How much to shrink the hero                                                                        | About 20%: `643px → 520px` mobile, `873px → 700px` desktop.                                                  |
| Does the "speaker said that" rewrite apply to the Or Yarok quote too?                              | Yes, both quotes get the same treatment.                                                                     |

---

## File Structure

| File                               | Change     | Responsibility after the change                                                                                                                                          |
| ---------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/Hero.tsx`          | Modify     | Hero section. Owns the student count in the subtitle and the hero's height and background crop.                                                                          |
| `src/components/ReportArticle.tsx` | Modify     | The article prose only. Loses the transport-breakdown paragraph and, at the end, loses the map-intro paragraph.                                                          |
| `src/components/MapIntro.tsx`      | **Create** | The one paragraph that hands the reader from the tables over to the map. Its own file because it now renders next to `MapEmbed` in `Report.tsx`, not inside the article. |
| `src/components/MapEmbed.tsx`      | Modify     | Gains its own `mb-16` so it spaces correctly in its new home among the tables.                                                                                           |
| `src/components/Report.tsx`        | Modify     | Section order, and the footer credits.                                                                                                                                   |

---

## Task 1: Hero student count and height

**The notes this implements:**

> כותרת משנה (השינוי היחיד זה מספר התלמידים)
> 2,611,000 תלמידים וילדי גן יפתחו את שנת הלימודים ב-1/9. [...]

> עדיין כדאי להקטין את התמונה שבראש הפרויקט

**Files:**

- Modify: `src/components/Hero.tsx:6` (section height), `src/components/Hero.tsx:8` (background size), `src/components/Hero.tsx:46` (student count)
- Test: none. Verified by eye in the browser.

**Interfaces:**

- Consumes: nothing from other tasks.
- Produces: nothing other tasks rely on. `Hero` stays a zero-prop `React.FC`.

**Why the background line is in scope.** The mobile branch of line 8 is `bg-[size:auto_873px] bg-[position:-540px_bottom]`: the image is scaled to 873px tall and pinned to the bottom of a 643px box, so 230px is already cropped off its top. Dropping the box to 520px without touching the background raises that crop to 353px. That may be fine or may cut the subject; you look before you decide. The desktop branch is `md:bg-cover md:bg-center` and rescales on its own, so it needs nothing.

- [ ] **Step 1: Change the student count**

In `src/components/Hero.tsx`, inside `<HeroSubtitle>`, replace the leading `2,587,000` with `2,611,000`. Nothing else in that paragraph changes; the editor wrote "השינוי היחיד זה מספר התלמידים" explicitly.

Before:

```
2,587,000 תלמידים וילדי גן יפתחו את שנת הלימודים ב-1/9.
```

After:

```
2,611,000 תלמידים וילדי גן יפתחו את שנת הלימודים ב-1/9.
```

- [ ] **Step 2: Change the section height**

Line 6, in the `<section>` className:

```diff
-<section className="relative w-full h-[643px] md:h-[873px] overflow-hidden flex items-center justify-center text-center">
+<section className="relative w-full h-[520px] md:h-[700px] overflow-hidden flex items-center justify-center text-center">
```

- [ ] **Step 3: Update the stale comment on line 14**

The comment says "The hero is a fixed 873px there". Change `873px` to `700px` so it still describes the code:

```diff
-          Desktop scrim. The hero is a fixed 873px there and the title never
+          Desktop scrim. The hero is a fixed 700px there and the title never
```

- [ ] **Step 4: Look at it**

Run: `npm run dev`

Open the site. Check two viewports:

- **375px wide (mobile).** Does the background image still show its subject, or has the extra 110px of crop pushed the subject out of frame? Does the mobile scrim (the gradient on the text box) still cover the title, or does the title now sit on bare photo?
- **1440px wide (desktop).** Is the title still comfortably inside the section, with the `md:bottom-15` offset on the text box still looking right?

- [ ] **Step 5: Adjust the mobile background only if step 4 showed a problem**

If the mobile crop is now wrong, scale the background down proportionally with the section on line 8:

```diff
-        className="absolute inset-0 bg-no-repeat bg-[size:auto_873px] bg-[position:-540px_bottom] md:bg-cover md:bg-center"
+        className="absolute inset-0 bg-no-repeat bg-[size:auto_700px] bg-[position:-540px_bottom] md:bg-cover md:bg-center"
```

Note that `-540px` is a horizontal offset tuned against an 873px-tall render of the image. Shrinking the render to 700px also shrinks its width, so the subject shifts. If it lands wrong, adjust the `-540px` until the subject is centred, and reload after each change.

If step 4 showed no problem, skip this step and leave line 8 alone.

- [ ] **Step 6: Verify lint and build**

Run: `npm run lint`
Expected: exits 0, no output beyond the npm banner.

Run: `npm run build`
Expected: `tsc -b` passes, then `vite build` writes `dist/`, exit 0.

- [ ] **Step 7: Commit (ask the user first)**

Ask the user for approval, naming the exact command, then:

```bash
git add src/components/Hero.tsx
git commit -m "fix: update student count and reduce hero height"
```

---

## Task 2: Article copy - delete one paragraph, rewrite both quotes

**The notes this implements:**

> על הפסקה הזו הייתי מוותר – כי קשה לקרוא אותה והיא מוצגת בנתונים הרבה יותר טוב
> _(screenshot of the paragraph beginning "רוב הנפגעים בתאונות (64%)")_

> את הפסקאות הבאות עדיף לכתוב בצורה הזו:
> מוביל הפרויקט גל רייך מארגון "נתון לשינוי" אומר כי "חזון 'אפס הרוגים'..."
> _(screenshot of both quotes in their current two-paragraph form)_
> (כלומר לא לרדת שורה)

> גל – שים לב שבסוף הציטוט שלך כתוב בשלום." במקום בשלום".

**Files:**

- Modify: `src/components/ReportArticle.tsx:43-50` (delete), `src/components/ReportArticle.tsx:52-76` (rewrite)
- Test: none. Verified by eye and by lint.

**Interfaces:**

- Consumes: nothing from Task 1.
- Produces: nothing. `ReportArticle` stays a zero-prop `React.FC`.

**Context an executor will not have.** The deleted paragraph is the prose version of the per-mode breakdown that `TransportationStats` renders as cards further down the page. The editor's point is that the cards say it better, not that the numbers are wrong. Nothing else in the file cites those figures, so the deletion is self-contained. Do **not** also delete the paragraph above it (the one about 568 severe injuries and the 317% e-scooter jump); the editor did not flag it.

**On the punctuation note.** Gal's quote currently ends `בשלום.&rdquo;` - period inside the closing quotation mark. Hebrew convention, and what the editor asked for, is `בשלום&rdquo;.` - period outside. The Or Yarok quote at line 75 already ends `המנועי&rdquo;.` correctly, so this fix makes the two consistent rather than introducing a new style.

**On keeping the speaker name bold.** The docx example is plain running text. This plan keeps the attribution clause inside `<strong>` and un-bolds only the quote body, because the two quotes are the only pull-outs in a long column of prose and losing their visual anchor entirely makes them hard to find on a scan. This satisfies the editor's actual instruction, which was "לא לרדת שורה" - no line break between the attribution and the quote. If the editor objects, deleting the two `<strong>` tags is the whole change.

- [ ] **Step 1: Delete the transport-breakdown paragraph**

Remove this entire `<MainContent>` block from `src/components/ReportArticle.tsx` (currently lines 43-50), including the blank line that follows it:

```tsx
<MainContent className="text-neutral-800">
  רוב הנפגעים בתאונות (64%) הם הולכי רגל - 4,305 נפגעים (לעומת 4,280 בתקופה המקבילה). אחריהם רוכבי
  האופניים הרגילים המהווים כ-12% עם 791 נפגעים (ירידה מ-990 נפגעים ו-15% בתקופה הקודמת), רוכבי
  הקורקינט החשמלי המהווים כ-11% עם 759 נפגעים (זינוק מ-182 נפגעים ו-3% בלבד בתקופה הקודמת), ורוכבי
  אופניים חשמליים המהווים כ-10% עם 690 נפגעים (ירידה מ-966 נפגעים ו-15% בתקופה הקודמת). בנוסף, נרשמו
  145 נפגעים בקורקינט לא חשמלי המהווים כ-2% מכלל הנפגעים - זינוק של 314% לעומת 35 נפגעים (0.5%)
  בתקופה הקודמת.
</MainContent>
```

- [ ] **Step 2: Merge Gal Reich's attribution and quote into one paragraph**

Replace these two `<MainContent>` blocks (currently lines 52-63, the `<strong>` heading and the quote below it):

```tsx
        <MainContent className="text-neutral-800">
          <strong>גל רייך מארגון ׳נתון לשינוי׳, מוביל הפרויקט:</strong>
        </MainContent>

        <MainContent className="text-neutral-800">
          &ldquo;חזון ׳אפס הרוגים׳ (Vision Zero) מוביל שינוי תפיסתי עולמי הקובע כי שום אובדן חיים או
          פציעה קשה בכביש אינם גזירת גורל, ושמערכת התחבורה חייבת להגן על המשתמשים ולמנוע כליל פגיעות
          קטלניות וחמורות. המקום הקריטי ביותר ליישום עקרון זה להפחתת הנפגעים הוא סביבת מוסדות החינוך
          - אך הנתונים מצביעים על כיוון מדאיג, עם זינוק של 30% בפצועים קשה ובהרוגים וזינוק חסר תקדים
          של 463% בפציעות קשות מקורקינטים חשמליים. סביבת בתי הספר חייבת להפוך למרחב מוגן מבוסס תשתית
          בטוחה וסלחנית, המבטיחה שכל תלמיד ישוב הביתה בשלום.&rdquo;
        </MainContent>
```

with this single block:

```tsx
<MainContent className="text-neutral-800">
  <strong>מוביל הפרויקט גל רייך מארגון ׳נתון לשינוי׳ אומר כי</strong> &ldquo;חזון ׳אפס הרוגים׳
  (Vision Zero) מוביל שינוי תפיסתי עולמי הקובע כי שום אובדן חיים או פציעה קשה בכביש אינם גזירת גורל,
  ושמערכת התחבורה חייבת להגן על המשתמשים ולמנוע כליל פגיעות קטלניות וחמורות. המקום הקריטי ביותר
  ליישום עקרון זה להפחתת הנפגעים הוא סביבת מוסדות החינוך - אך הנתונים מצביעים על כיוון מדאיג, עם
  זינוק של 30% בפצועים קשה ובהרוגים וזינוק חסר תקדים של 463% בפציעות קשות מקורקינטים חשמליים. סביבת
  בתי הספר חייבת להפוך למרחב מוגן מבוסס תשתית בטוחה וסלחנית, המבטיחה שכל תלמיד ישוב הביתה
  בשלום&rdquo;.
</MainContent>
```

Two things changed besides the merge, both deliberate: the attribution was reworded to the docx's exact phrasing (`מוביל הפרויקט גל רייך מארגון ׳נתון לשינוי׳ אומר כי`), and the final `בשלום.&rdquo;` became `בשלום&rdquo;.` - that is the punctuation note, and it is easy to miss inside a long block.

- [ ] **Step 3: Merge the Or Yarok attribution and quote the same way**

Replace these two `<MainContent>` blocks (the `עו&ldquo;ד יניב יעקב` heading and the quote below it):

```tsx
        <MainContent className="text-neutral-800">
          <strong>עו&ldquo;ד יניב יעקב מנכ&ldquo;ל עמותת ׳אור ירוק׳:</strong>
        </MainContent>

        <MainContent className="text-neutral-800">
          &ldquo;הנתונים מדאיגים ומחייבים פעולות מצד משרד התחבורה והבטיחות בדרכים ביחד עם ראשי
          וראשות הערים. הילדים שלנו הולכים בכל יום אל בית הספר במסלול קבוע ולכן סביבת מוסדות החינוך
          חייבת להיות סטרילית ובטוחה עבורם. ילדים יתנהגו תמיד כמו ילדים ועלולים לנהוג באופן לא צפוי.
          לכן מהירות הנסיעה של כלי הרכב חייבת להיות מרוסנת באמצעים תשתיתיים - יש לתת עדיפות לילדים
          כאשר הם הולכים ברגל או רוכבים על אופניים. הגיע הזמן לשנות את סדרי העדיפויות ולהעדיף את
          בטיחות ילדינו על פני הרכב המנועי&rdquo;.
        </MainContent>
```

with this single block:

```tsx
<MainContent className="text-neutral-800">
  <strong>עו&ldquo;ד יניב יעקב, מנכ&ldquo;ל עמותת ׳אור ירוק׳, אומר כי</strong> &ldquo;הנתונים
  מדאיגים ומחייבים פעולות מצד משרד התחבורה והבטיחות בדרכים ביחד עם ראשי וראשות הערים. הילדים שלנו
  הולכים בכל יום אל בית הספר במסלול קבוע ולכן סביבת מוסדות החינוך חייבת להיות סטרילית ובטוחה עבורם.
  ילדים יתנהגו תמיד כמו ילדים ועלולים לנהוג באופן לא צפוי. לכן מהירות הנסיעה של כלי הרכב חייבת להיות
  מרוסנת באמצעים תשתיתיים - יש לתת עדיפות לילדים כאשר הם הולכים ברגל או רוכבים על אופניים. הגיע הזמן
  לשנות את סדרי העדיפויות ולהעדיף את בטיחות ילדינו על פני הרכב המנועי&rdquo;.
</MainContent>
```

The `&ldquo;` inside `עו&ldquo;ד` and `מנכ&ldquo;ל` is the existing gershayim in this file. Leave it. It is not the quotation mark this task is fixing.

- [ ] **Step 4: Format, lint, build**

Run: `npm run format`
Expected: rewrites `src/components/ReportArticle.tsx` line wrapping. Do not hand-align the Hebrew yourself; Prettier owns it, and the exact line breaks in the code blocks above will differ from what it produces. That is fine.

Run: `npm run lint`
Expected: exits 0.

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 5: Read the rendered result**

Run: `npm run dev`

Confirm in the browser:

- The "רוב הנפגעים בתאונות (64%)" paragraph is gone.
- Each quote is one paragraph: bold attribution, then the quote running on from it on the same line, with no line break between them.
- Gal's quote ends `בשלום".` and not `בשלום."`. Zoom in if you have to; this is one character's position.

- [ ] **Step 6: Commit (ask the user first)**

Ask the user for approval, naming the exact command, then:

```bash
git add src/components/ReportArticle.tsx
git commit -m "fix: drop transport prose paragraph and inline both quote attributions"
```

---

## Task 3: Swap the transport block with the map, and move the map's intro paragraph

**The note this implements:**

> את הכותרת הזו והנתונים שמתחתיה הייתי שם לפני המפה והטבלאות, זה הדבר שהכי עושה סדר. אפשר לשים אותם או אחרי הציטוטים שלכם או לפניהם
> _(screenshot of the "נפגעים בסביבת מוסדות לימוד" heading and its subtitle)_

The user resolved this to a straight positional swap: `TransportationStats` takes the slot `MapEmbed` occupies, and `MapEmbed` takes the slot `TransportationStats` occupies.

**Section order before:**

```
ReportArticle → MapEmbed → TopCitiesTable → MunicipalityTable → TransportationStats → VisionZero
```

**Section order after:**

```
ReportArticle → TransportationStats → TopCitiesTable → MunicipalityTable → MapIntro → MapEmbed → VisionZero
```

**Files:**

- Create: `src/components/MapIntro.tsx`
- Modify: `src/components/ReportArticle.tsx` (delete the closing paragraph, now the last `<MainContent>` in the file)
- Modify: `src/components/MapEmbed.tsx:5` (add `mb-16`)
- Modify: `src/components/Report.tsx:252-267` (section order), `src/components/Report.tsx:10-11` (imports)
- Test: none. Verified by eye and by build.

**Interfaces:**

- Consumes: `ReportArticle` after Task 2, i.e. with the 64% paragraph and the split quote headings already gone. If you are doing this task on a file where Task 2 has not run, stop and do Task 2 first, because both tasks edit the same file and the line numbers will not match.
- Produces: `MapIntro`, a zero-prop `React.FC` exported both named and default, matching how `MapEmbed` and `ReportArticle` in this codebase are exported.

**Why `MapIntro` is a new file rather than staying in `ReportArticle`.** The paragraph is a hand-off: it says "the following map shows" and "in the tables below you can see". After the swap neither is true from where it currently sits. It has to travel with the map, and the map is rendered from `Report.tsx`, so the paragraph has to be renderable from `Report.tsx` too. This repo puts one component per file.

**Why the copy changes.** Reordered so the clause about the tables points backward at tables that are now above it, and the clause about the map points forward at the map immediately below it. Nothing is dropped; the period comparison sentence is kept, just moved to the front of the paragraph.

**Why `MapEmbed` needs `mb-16`.** Right now it sits alone inside a wrapper carrying `mainContentSpacing`, which is `lg:px-16 2xl:px-72 mb-16`, so the wrapper supplies its bottom gap. In its new home it shares a wrapper with `TopCitiesTable` and `MunicipalityTable`, which each carry their own `mb-16` and would otherwise leave the map flush against `VisionZero`.

- [ ] **Step 1: Create `src/components/MapIntro.tsx`**

```tsx
import React from 'react'
import { MainContent } from './Typography'

// The hand-off from the tables to the map. It lived at the end of ReportArticle
// while the map followed the article directly. The transport breakdown took that
// slot, so the map now sits below the tables and this paragraph came down with
// it: a sentence that says "the following map" has to be adjacent to the map.
//
// The clause order is reversed from the original for the same reason. The tables
// are above this paragraph now, so they are recapped first and in the past
// tense, and the map is introduced last, immediately before it appears.
export const MapIntro: React.FC = () => (
  <MainContent className="text-neutral-800">
    בטבלאות שמעלה ניתן לראות את השינוי בערים עצמן, ולהשוות בין{' '}
    <span className="whitespace-nowrap">2021-2026</span> ל-
    <span className="whitespace-nowrap">2016-2021</span>. המפה הבאה מציגה את ריכוזי מוסדות הלימודים
    שבראשית הטבלה ואת החלוקה לנפגעים (ניתן לחפש כל מוסד לימודים אחר{' '}
    <a href="#schoolSearch" className="text-blue-600 hover:text-blue-800 underline">
      בראשית הדף
    </a>
    ):
  </MainContent>
)

export default MapIntro
```

The two `whitespace-nowrap` spans are carried over verbatim from the original paragraph. They exist because a bidirectional year range like `2021-2026` will otherwise break across a line in RTL and render as nonsense.

- [ ] **Step 2: Delete that paragraph from `ReportArticle.tsx`**

Remove the final `<MainContent>` block in the file, the one starting `המפה הבאה מציגה`. After Task 2 it is the last child of the `space-y-6` div, so what remains ends with the Or Yarok quote.

```tsx
<MainContent className="text-neutral-800">
  המפה הבאה מציגה את ריכוזי מוסדות הלימודים שבראשית הטבלה ואת החלוקה לנפגעים (ניתן לחפש כל מוסד
  לימודים אחר{' '}
  <a href="#schoolSearch" className="text-blue-600 hover:text-blue-800 underline">
    בראשית הדף
  </a>
  ). בטבלאות מטה תוכלו לראות גם את השינוי בערים עצמן, ולהשוות בין{' '}
  <span className="whitespace-nowrap">2021-2026</span> ל-
  <span className="whitespace-nowrap">2016-2021</span>:
</MainContent>
```

- [ ] **Step 3: Give `MapEmbed` its own bottom margin**

In `src/components/MapEmbed.tsx`:

```diff
-    <div className="w-full">
+    <div className="w-full mb-16">
```

- [ ] **Step 4: Add the `MapIntro` import to `Report.tsx`**

Next to the existing `MapEmbed` import (around line 11):

```diff
 import { MapEmbed } from './MapEmbed'
+import { MapIntro } from './MapIntro'
```

- [ ] **Step 5: Reorder the sections in `Report.tsx`**

Replace this block (currently lines 252-267):

```tsx
        <div className={mainContentSpacing}>
          <ReportArticle />
        </div>

        <div className={mainContentSpacing}>
          <MapEmbed />
        </div>

        <div className={mainContentSpacing}>
          <TopCitiesTable />
          <MunicipalityTable />
          {/* Commented out because it's not relevant to the report, leaving it here for future reference */}
          {/* <EducationalClustersTable /> */}
          <TransportationStats />
          <VisionZero />
        </div>
```

with:

```tsx
        <div className={mainContentSpacing}>
          <ReportArticle />
        </div>

        {/* The breakdown reads before the map and the tables rather than after
            them, on the editor's note that it is the block that orders the
            page: it names the shift the rest of the section then details. Its
            own wrapper carries only the gutters, because TransportationStats
            already ends in mb-16 of its own. */}
        <div className={mainContentGutters}>
          <TransportationStats />
        </div>

        <div className={mainContentSpacing}>
          <TopCitiesTable />
          <MunicipalityTable />
          {/* Commented out because it's not relevant to the report, leaving it here for future reference */}
          {/* <EducationalClustersTable /> */}
          <MapIntro />
          <MapEmbed />
          <VisionZero />
        </div>
```

`mainContentGutters` is already declared at line 30 of this file; no new constant is needed.

- [ ] **Step 6: Format, lint, build**

Run: `npm run format`

Run: `npm run lint`
Expected: exits 0.

Run: `npm run build`
Expected: exits 0. A `TS6133`-style unused-import error here means step 4 or step 5 was applied incompletely; both `MapEmbed` and `MapIntro` must still be referenced.

- [ ] **Step 7: Check the new order and the seams in the browser**

Run: `npm run dev`

At a wide viewport, scroll the page top to bottom and confirm:

- The order is article, then the tinted "נפגעים בסביבת מוסדות לימוד" cap, then the two tables, then the intro paragraph, then the Google map, then Vision Zero.
- The gap under the transport block matches the gap under the tables. If it is visibly doubled, the wrapper in step 5 was given `mainContentSpacing` instead of `mainContentGutters`.
- The gap between the map and Vision Zero matches the others. If the map is flush against Vision Zero, step 3 was skipped.
- The transport block still lines up horizontally with the tables above and below it at `lg` and at `2xl`. This is what `mainContentGutters` is there for.

At a narrow viewport (375px), confirm the expected mobile sequence, which the user reviewed and approved:

```
פסקה 1
[מבט על] [ממצאים מרכזיים]
פסקה 2
ציטוט גל רייך
ציטוט יניב יעקב
נפגעים בסביבת מוסדות לימוד → פילוח לפי אמצעי תחבורה
```

The two cards appearing up in the article and **not** at the head of the transport block on mobile is correct and intended. Do not "fix" it.

- [ ] **Step 8: Commit (ask the user first)**

Ask the user for approval, naming the exact command, then:

```bash
git add src/components/MapIntro.tsx src/components/MapEmbed.tsx src/components/ReportArticle.tsx src/components/Report.tsx
git commit -m "change: move transport breakdown above the map and tables"
```

---

## Task 4: Remove the Ryan Cornell credit

**The note this implements:**

> לגבי הקרדיטים בסוף – למחוק את הקרדיט של ראיין קורנל

**Files:**

- Modify: `src/components/Report.tsx:74-81`
- Test: none.

**Interfaces:**

- Consumes: nothing. Independent of Tasks 1-3; it touches a different region of `Report.tsx` (`FooterContent`, not the section list).
- Produces: nothing.

**The separator matters.** The credits are a flex row of `<span>`s with `|` separators between them, each separator in its own `<div className="hidden md:inline">`. Deleting the credit but leaving its separator leaves a trailing `|` after "עורך: אופיר שמיר" on desktop. Both go.

- [ ] **Step 1: Delete the credit and the separator before it**

In `FooterContent`, remove these two sibling divs (currently lines 74-81):

```tsx
                <div className="hidden md:inline">
                  <span>|</span>
                </div>
                <div className="flex justify-center md:inline">
                  <span>
                    ניהול פרויקט: <strong>ראיין קורנל</strong>
                  </span>
                </div>
```

The "עורך: אופיר שמיר" div immediately above them stays and becomes the last item in the row.

- [ ] **Step 2: Lint and build**

Run: `npm run lint`
Expected: exits 0.

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Check the footer in the browser**

Run: `npm run dev`

Scroll to the footer. At a wide viewport the credit row must read:

```
פיתוח והטמעה: יובל בר לוי והדר חוברה | ניתוח נתונים ועריכת הדו״ח: גל רייך ועתליה אלון | עורך: אופיר שמיר
```

with no trailing `|` after אופיר שמיר. At a narrow viewport the three credits stack with no pipes at all, which is what `hidden md:inline` on the separators already does.

- [ ] **Step 4: Commit (ask the user first)**

Ask the user for approval, naming the exact command, then:

```bash
git add src/components/Report.tsx
git commit -m "change: remove project management credit"
```

---

## Final verification

- [ ] **Run the full check**

Run: `npm run lint`
Expected: exits 0.

Run: `npm run build`
Expected: exits 0.

- [ ] **Walk the whole page once**

Run: `npm run dev`

Against the docx notes, one at a time:

1. Hero subtitle opens with `2,611,000`.
2. Hero is visibly shorter and its image is not badly cropped at 375px or 1440px.
3. The "רוב הנפגעים בתאונות (64%)" paragraph is gone.
4. Both quotes are single paragraphs, attribution and quote on the same line.
5. Gal's quote ends `בשלום".`.
6. "נפגעים בסביבת מוסדות לימוד" appears before the tables and before the map.
7. There is no "ניהול פרויקט" credit in the footer.

- [ ] **Report what is not covered**

Two things in this plan are judgment calls the editor did not specify and should be shown the result of:

- Whether the attribution stays bold inside the merged quote paragraphs (Task 2 keeps it; the docx example is plain).
- The rewritten map intro paragraph (Task 3), which is new copy, not copy the editor supplied.

Show both to the user rather than assuming they pass.
