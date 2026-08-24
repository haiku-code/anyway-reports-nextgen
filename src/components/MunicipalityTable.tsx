import { MUNICIPALITY_IMPROVING, MUNICIPALITY_WORSENING } from '../data/municipalityTrend'
import { TableCaption, TableHeader, TableBody } from './Typography'

export default function MunicipalityTable() {
  return (
    <div className="w-full mb-16">
      {/* Title */}
      <div
        className="rounded-t-lg border border-gray-200 p-4"
        style={{ backgroundColor: '#ECECEC' }}
      >
        <TableCaption className="text-center">
          היישובים* בהם הייתה מגמה שלילית/חיובית בציון המשוקלל בין שתי התקופות:
        </TableCaption>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="border-b border-gray-200">
              <TableHeader
                colSpan={2}
                className="p-3 text-center whitespace-nowrap"
                style={{ backgroundColor: '#ECECEC' }}
              >
                החמרה
              </TableHeader>
              <TableHeader
                colSpan={2}
                className="p-3 text-center whitespace-nowrap"
                style={{ backgroundColor: '#ECECEC' }}
              >
                שיפור
              </TableHeader>
            </tr>
            <tr className="border-b border-gray-300" style={{ backgroundColor: '#ECECEC' }}>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                ישוב
              </TableHeader>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                % שינוי
              </TableHeader>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                ישוב
              </TableHeader>
              <TableHeader className="p-3 text-right whitespace-nowrap">% שינוי</TableHeader>
            </tr>
          </thead>
          <tbody>
            {Array.from({
              length: Math.max(MUNICIPALITY_IMPROVING.length, MUNICIPALITY_WORSENING.length),
            }).map((_, rowIndex) => {
              const improvementItem = MUNICIPALITY_IMPROVING[rowIndex]
              const worseningItem = MUNICIPALITY_WORSENING[rowIndex]

              return (
                <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                  {/* First columns - Worsening (will appear on right in RTL) */}
                  <TableBody className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                    {worseningItem?.cityName || ''}
                  </TableBody>
                  <TableBody className="p-3 text-right border-r border-gray-300 bg-red-50 whitespace-nowrap">
                    {worseningItem && <span dir="ltr">{worseningItem.percentChange}</span>}
                  </TableBody>

                  {/* Last columns - Improvement (will appear on left in RTL) */}
                  <TableBody className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                    {improvementItem?.cityName || ''}
                  </TableBody>
                  <TableBody className="p-3 text-right bg-green-50 whitespace-nowrap">
                    {improvementItem && <span dir="ltr">{improvementItem.percentChange}</span>}
                  </TableBody>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="bg-gray-50 p-4 text-sm text-gray-600 text-right">
                * מבין היישובים בעלי הדירוג המשוקלל הגבוה ביותר
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
