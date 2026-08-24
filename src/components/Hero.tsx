import React from 'react'
import { HeroTitle, HeroSubtitle } from './Typography'

export const Hero: React.FC = () => {
  return (
    <section className="relative w-full h-[643px] md:h-[873px] overflow-hidden flex items-center justify-center text-center">
      <div
        className="absolute inset-0 bg-no-repeat bg-[size:auto_873px] bg-[position:-540px_bottom] md:bg-cover md:bg-center"
        style={{
          backgroundImage: `url('/images/hero-background2.jpg')`,
        }}
      >
        {/*
          Desktop scrim. The hero is a fixed 873px there and the title never
          wraps past three lines, so percentage stops over the whole section
          are stable.
        */}
        <div className="absolute inset-0 hidden md:block md:bg-[image:linear-gradient(180deg,rgba(250,254,255,0)_14%,rgba(232,247,252,1)_82%)]"></div>
      </div>

      {/*
        Mobile scrim rides on the text box itself so it is sized by its own
        content. The middle stop sits at `100% - --scrim-feather`, which is
        exactly the top edge of the text no matter how many lines the title
        wraps to, and the feather occupies the padding above it. A scrim
        anchored to the section instead gets outrun on narrow phones, where the
        title wraps onto more lines and grows upward out of the gradient.
      */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pt-[var(--scrim-feather)] pb-11 bg-[image:linear-gradient(to_top,rgba(232,247,252,1)_0px,rgba(232,247,252,0.72)_calc(100%_-_var(--scrim-feather)),rgba(232,247,252,0)_100%)] md:bottom-15 md:pt-0 md:pb-0 md:bg-none"
        style={{ '--scrim-feather': '8rem' } as React.CSSProperties}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-16 xl:px-20">
          <div
            className="opacity-0 translate-y-8 animate-fade-in-up mb-8"
            style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
          >
            <HeroTitle>בדקו וגלו: אלו הדרכים המסוכנות בדרך לבית הספר שלכם</HeroTitle>
          </div>

          <div
            className="opacity-0 translate-y-8 animate-fade-in-up mx-auto"
            style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
          >
            <HeroSubtitle>
              2,587,000 תלמידים וילדי גן יפתחו את שנת הלימודים ב-1/9. הם יחצו כבישים וצמתים בדרכם אל מוסדות הלימוד, בין אם ברגל, באופניים, בקורקינט או בכלי רכב חשמלי. ב-5 השנים האחרונות נפגעו 6,690 ילדים בדרכים הללו - שחלקן מסוכנות. ynet מציג את מפת ANYWAY מבית ׳נתון לשינוי׳ ובשיתוף עמותת ׳אור ירוק׳, שחושפת את אותם הכבישים: כתבו את שם המוסד החינוכי, גלו אותם במפה, הדריכו את ילדיכם או התריאו בפני הרשויות - והצילו חיים
            </HeroSubtitle>
          </div>

          <div
            className="opacity-0 translate-y-8 animate-fade-in-up mx-auto mt-4"
            style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}
          >
            <p className="text-lg font-semibold text-gray-600 tracking-wide">תמר טרבלסי חדד</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
