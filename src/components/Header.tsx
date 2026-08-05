import React from 'react'
import { SchoolSelect } from './SchoolSelect'
import { cn } from '../lib/utils'
import { SchoolSelectVariant, type School } from '../types'
import xIcon from '../assets/icons/x.svg'
import whatsappIcon from '../assets/icons/whatsapp.svg'
import mailIcon from '../assets/icons/mail.svg'
import ynetLogo from '../assets/ynet_logo.svg'

type Props = {
  schools: School[]
  onSelectSchool: (id: number) => void
  showSearch: boolean
}

export const Header: React.FC<Props> = ({ schools, onSelectSchool, showSearch }) => {
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getShareData = () => {
    const title = 'הכבישים המסוכנים בדרך לבית הספר שלכם - ynet'
    const description =
      'חפשו במפה וגלו: פרויקט מיוחד חושף את רמת הסיכון בכל הדרכים הסמוכות למוסדות חינוכיים בישראל'
    const currentUrl = window.location.origin + window.location.pathname

    return { title, description, currentUrl }
  }

  const { title, description, currentUrl } = getShareData()

  // Under md the search replaces the header content entirely, there is no room
  // for anything else at 360px. display:none cannot be transitioned, so coming
  // back is an entrance animation, replayed every time the class is re-added.
  const hiddenOnMobileSearch = showSearch ? 'hidden md:flex' : 'flex animate-header-restore'

  return (
    <header
      className={cn(
        'w-full bg-white sticky top-0 z-50 transition-all duration-300',
        isScrolled && 'shadow-md'
      )}
    >
      {/* Fixed row heights rather than padding, so swapping the logo for the
          search cannot change the header height and shift the page. */}
      <div
        className={cn(
          'flex justify-between items-center gap-4 px-6 transition-all duration-300',
          isScrolled ? 'h-12 md:h-14' : 'h-20 md:h-[92px]'
        )}
      >
        <div className={cn('items-center', hiddenOnMobileSearch)}>
          <a
            href="https://www.ynet.co.il/home/0,7340,L-8,00.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity duration-200"
          >
            <img
              src={ynetLogo}
              alt="Ynet"
              className={cn(
                'w-auto transition-all duration-300',
                isScrolled ? 'h-6 md:h-8' : 'h-8 md:h-11'
              )}
            />
          </a>
        </div>

        {showSearch && (
          <div className="flex-1 md:max-w-md animate-header-search">
            <SchoolSelect
              schools={schools}
              onSelectId={onSelectSchool}
              variant={SchoolSelectVariant.Sticky}
            />
          </div>
        )}

        <div className={cn('items-center gap-6', hiddenOnMobileSearch)}>
          <a
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + '\n\n' + currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center hover:opacity-80 transition-opacity duration-200"
          >
            <img
              src={mailIcon}
              alt="Share via Email"
              className="w-6 h-6"
              style={{ color: '#3E3232' }}
            />
          </a>

          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + '\n\n' + description + '\n\n' + currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center hover:opacity-80 transition-opacity duration-200"
          >
            <img
              src={whatsappIcon}
              alt="Share on WhatsApp"
              className="w-6 h-6"
              style={{ color: '#3E3232' }}
            />
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title + '\n\n' + description + '\n\n' + currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center hover:opacity-80 transition-opacity duration-200"
          >
            <img
              src={xIcon}
              alt="Share on X (Twitter)"
              className="w-6 h-6"
              style={{ color: '#3E3232' }}
            />
          </a>
        </div>
      </div>
    </header>
  )
}

export default Header
