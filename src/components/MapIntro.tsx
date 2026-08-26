import React from 'react'
import { MainContent } from './Typography'

// The one line that introduces the map. It lived at the end of ReportArticle
// while the map followed the article directly; the transport breakdown took
// that slot, so the map moved below the tables and this sentence came with it.
//
// It deliberately says nothing about the tables and nothing about where the
// search box is. The original did both, and both went stale the moment the
// sections moved: "the table" was ambiguous once two tables sat above it, and
// the search is sticky in the header, so pointing at the top of the page was
// wrong as well. What is left describes only the map, so a future reorder
// cannot make it false.
//
// mb-6 because this sits among siblings that space themselves with mb-16; on
// its own it would render flush against the iframe.
export const MapIntro: React.FC = () => (
  <MainContent className="mb-6 text-neutral-800">
    המפה מציגה את ריכוזי מוסדות הלימוד שבהם נרשמו הכי הרבה נפגעים, ואת סוגי הנפגעים בכל ריכוז.
  </MainContent>
)
