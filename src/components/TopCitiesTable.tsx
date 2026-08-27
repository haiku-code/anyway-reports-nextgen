import { TableCaption, TableHeader, TableBody } from './Typography'
import HorizontalScrollIndicator from './HorizontalScrollIndicator'
import { TOP_CITIES } from '../data/topCities'
import { REPORT_PERIODS } from '../data/periods'

export default function TopCitiesTable() {
  return (
    <div className="w-full mb-16">
      {/* Title */}
      <div
        className="rounded-t-lg border border-gray-200 p-4"
        style={{ backgroundColor: '#E8F7FC' }}
      >
        <TableCaption className="text-center">
          20 היישובים בעלי הציון המשוקלל* הגבוה ביותר בין{' '}
          <span dir="ltr">{REPORT_PERIODS.current}</span>:
        </TableCaption>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-300" style={{ backgroundColor: '#E8F7FC' }}>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                #
              </TableHeader>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                ישוב
              </TableHeader>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                הרוגים
              </TableHeader>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                פצועים קשה
              </TableHeader>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                פצועים קל
              </TableHeader>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                סה״כ נפגעים
              </TableHeader>
              <TableHeader className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                סה״כ תאונות
              </TableHeader>
              <TableHeader className="p-3 text-right whitespace-nowrap">ציון משוקלל</TableHeader>
            </tr>
          </thead>
          <tbody>
            {TOP_CITIES.map((city) => (
              <tr key={city.rank} className="border-b border-gray-200 hover:bg-gray-50">
                <TableBody className="p-3 text-right border-r border-gray-300 whitespace-nowrap font-semibold">
                  {city.rank}
                </TableBody>
                <TableBody className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                  {city.cityName}
                </TableBody>
                <TableBody className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                  {city.deaths}
                </TableBody>
                <TableBody className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                  {city.severeInjuries}
                </TableBody>
                <TableBody className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                  {city.lightInjuries}
                </TableBody>
                <TableBody className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                  {city.totalInjured}
                </TableBody>
                <TableBody className="p-3 text-right border-r border-gray-300 whitespace-nowrap">
                  {city.totalAccidents}
                </TableBody>
                <TableBody className="p-3 text-right whitespace-nowrap">
                  {city.compositeScore.toLocaleString()}
                </TableBody>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={8} className="bg-gray-50 p-4 text-sm text-gray-600 text-right">
                * הציון המשוקלל חושב כך: מספרים נפגעים כולל X (משקל פצוע קל X מספר פצועים קל + משקל
                פצוע קשה X מספר פצועים קשה + משקל הרוג X מספר הרוגים). המשקל שניתן להרוג הוא 0.799,
                המשקל לפצוע קשה 0.199 והמשקל לפצוע קל 0.002. ציון גבוה משמעותו שלילית: יותר נפגעים
                או יותר נפגעים בחומרה קשה יותר
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <HorizontalScrollIndicator />
    </div>
  )
}
