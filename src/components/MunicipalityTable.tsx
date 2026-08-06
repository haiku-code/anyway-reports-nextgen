import { type MunicipalityComparison } from '../types'
import { TableCaption, TableHeader, TableBody } from './Typography'

// Data from Figma design - Municipality comparison between periods
const improvementData: MunicipalityComparison[] = [
  { cityName: 'חולון', percentChange: -2, totalAccidents: 152, trend: 'improvement' },
  { cityName: 'ירושלים', percentChange: -12, totalAccidents: 136, trend: 'improvement' },
  { cityName: 'בת ים', percentChange: -21, totalAccidents: 109, trend: 'improvement' },
  { cityName: 'תל אביב יפו', percentChange: -24, totalAccidents: 98, trend: 'improvement' },

  { cityName: 'לוד', percentChange: -34, totalAccidents: 53, trend: 'improvement' },
  { cityName: 'חיפה', percentChange: -48, totalAccidents: 46, trend: 'improvement' },
  { cityName: 'מודיעין עילית', percentChange: -52, totalAccidents: 35, trend: 'improvement' },
  { cityName: 'ראשון לציון', percentChange: -54, totalAccidents: 26, trend: 'improvement' },
  { cityName: 'באר שבע', percentChange: -64, totalAccidents: 16, trend: 'improvement' },
]

const worseningData: MunicipalityComparison[] = [
  { cityName: 'רמלה', percentChange: 152, totalAccidents: 152, trend: 'worsening' },
  { cityName: 'בית שמש', percentChange: 136, totalAccidents: 136, trend: 'worsening' },
  { cityName: 'ביתר עילית', percentChange: 109, totalAccidents: 109, trend: 'worsening' },
  { cityName: 'חדרה', percentChange: 98, totalAccidents: 98, trend: 'worsening' },
  { cityName: 'רחובות', percentChange: 92, totalAccidents: 92, trend: 'worsening' },
  { cityName: 'אשקלון', percentChange: 53, totalAccidents: 53, trend: 'worsening' },
  { cityName: 'אשדוד', percentChange: 46, totalAccidents: 46, trend: 'worsening' },
  { cityName: 'פתח תקווה', percentChange: 26, totalAccidents: 26, trend: 'worsening' },
  { cityName: 'נתניה', percentChange: 16, totalAccidents: 16, trend: 'worsening' },
  { cityName: 'בני ברק', percentChange: 6, totalAccidents: 6, trend: 'worsening' },
  { cityName: 'רמת גן', percentChange: 2, totalAccidents: 2, trend: 'worsening' },
]

export default function MunicipalityTable() {
  return (
    <div className="w-full mb-16">
      {/* Title */}
      <div className="rounded-t-lg border border-gray-200 p-4" style={{backgroundColor: '#ECECEC'}}>
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
              <TableHeader colSpan={2} className="p-3 text-center whitespace-nowrap" style={{backgroundColor: '#ECECEC'}}>
                החמרה
              </TableHeader>
              <TableHeader colSpan={2} className="p-3 text-center whitespace-nowrap" style={{backgroundColor: '#ECECEC'}}>
                שיפור
              </TableHeader>
            </tr>
            <tr className="border-b border-gray-300" style={{backgroundColor: '#ECECEC'}}>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                ישוב
              </TableHeader>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                % שינוי
              </TableHeader>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                ישוב
              </TableHeader>
              <TableHeader className="p-3 text-right whitespace-nowrap">
                % שינוי
              </TableHeader>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(improvementData.length, worseningData.length) }).map((_, rowIndex) => {
              const improvementItem = improvementData[rowIndex]
              const worseningItem = worseningData[rowIndex]
              
              return (
                <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                  {/* First columns - Worsening (will appear on right in RTL) */}
                  <TableBody className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                    {worseningItem?.cityName || ''}
                  </TableBody>
                  <TableBody className="p-3 text-right border-r border-gray-300 bg-red-50 whitespace-nowrap">
                    {worseningItem?.percentChange || ''}
                  </TableBody>
                  
                  {/* Last columns - Improvement (will appear on left in RTL) */}
                  <TableBody className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                    {improvementItem?.cityName || ''}
                  </TableBody>
                  <TableBody className="p-3 text-right bg-green-50 whitespace-nowrap">
                    {improvementItem?.percentChange ? 
                      improvementItem.percentChange.toString().startsWith('-') ? 
                        improvementItem.percentChange.toString().substring(1) + '-' : 
                        improvementItem.percentChange 
                      : ''}
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