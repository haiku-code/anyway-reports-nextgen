import React from 'react'
import CasualtyOverviewCard from './CasualtyOverviewCard'
import KeyFindingsPanel from './KeyFindingsPanel'
import { MainContent } from './Typography'

export const ReportArticle: React.FC = () => {
  return (
    <div>
      <div className="space-y-6">
        <MainContent className="text-neutral-800">
          ynet מפרסם את הדו״ח בבלעדיות זו השנה התשיעית ברציפות, למעט שנת הקורונה. במפה ניתן לראות
          כמה בני 19-5 נפגעו בכבישים הסמוכים למוסדות החינוך בין השעות 07:00 ועד לשעה 19:00 במשך חמש
          השנים האחרונות. הדו״ח גם משווה את התקופה האחרונה (2026-2021) למקבילה לה (2021-2016).
          הנתונים נאספו בפוליגונים של ריבועים בעלי צלע של קילומטר אחד, שבמרכזם בית ספר או ריכוז
          מוסדות לימוד. מיקומי בית הספר הגיעו ממאגר משרד החינוך - ומידע על התאונות הגיע מהלשכה
          המרכזית לסטטיסטיקה.
        </MainContent>

        {/* Narrow screens only. On wide ones both of these stay down in the
            transport breakdown, where they head the section they summarise, and
            sit side by side because there is width for it.

            Here there is not, so they are stacked into a single card instead of
            two: the overview gives the scale of the rise, the findings say what
            is driving it, and a reader scrolling a phone should not have to
            decide whether the second block is still about the first. The seam
            is one hairline, drawn by the panel's own top border once the card
            above drops its bottom one, and the corners are rounded only on the
            outside of the pair. */}
        <div className="md:hidden">
          <CasualtyOverviewCard className="rounded-b-none border-b-0" />
          <KeyFindingsPanel className="rounded-t-none" />
        </div>

        <MainContent className="text-neutral-800">
          מתוך 6,690 הילדים ובני הנוער שנפגעו בסביבת הגנים ומוסדות החינוך ברחבי הארץ בחמש השנים
          האחרונות, 568 נפצעו באורח קשה ו-33 נהרגו (סך של 601 נפגעים באורח חמור וקטלני - עלייה של
          30% לעומת התקופה הקודמת). אחד הנתונים המדאיגים ביותר הוא הזינוק בנפגעים שהשתמשו בקורקינט
          חשמלי: מ-182 בין השנים 2021-2016 ל-759 בין 2026-2021, עלייה של יותר מפי 4 (317%), כאשר
          מספר הפצועים קשה בקורקינט חשמלי זינק ב-463%.
        </MainContent>

        <MainContent className="text-neutral-800">
          רוב הנפגעים בתאונות (64%) הם הולכי רגל - 4,305 נפגעים (לעומת 4,280 בתקופה המקבילה). אחריהם
          רוכבי האופניים הרגילים המהווים כ-12% עם 791 נפגעים (ירידה מ-990 נפגעים ו-15% בתקופה
          הקודמת), רוכבי הקורקינט החשמלי המהווים כ-11% עם 759 נפגעים (זינוק מ-182 נפגעים ו-3% בלבד
          בתקופה הקודמת), ורוכבי אופניים חשמליים המהווים כ-10% עם 690 נפגעים (ירידה מ-966 נפגעים
          ו-15% בתקופה הקודמת). בנוסף, נרשמו 145 נפגעים בקורקינט לא חשמלי המהווים כ-2% מכלל הנפגעים
          - זינוק של 314% לעומת 35 נפגעים (0.5%) בתקופה הקודמת.
        </MainContent>

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

        <MainContent className="text-neutral-800">
          המפה הבאה מציגה את ריכוזי מוסדות הלימודים שבראשית הטבלה ואת החלוקה לנפגעים (ניתן לחפש כל
          מוסד לימודים אחר{' '}
          <a href="#schoolSearch" className="text-blue-600 hover:text-blue-800 underline">
            בראשית הדף
          </a>
          ). בטבלאות מטה תוכלו לראות גם את השינוי בערים עצמן, ולהשוות בין{' '}
          <span className="whitespace-nowrap">2021-2026</span> ל-
          <span className="whitespace-nowrap">2016-2021</span>:
        </MainContent>
      </div>
    </div>
  )
}
