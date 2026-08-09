import React from 'react'
import { cn } from '../lib/utils'

export interface TypographyProps {
  variant: 'hero-title' | 'hero-subtitle' | 'section-cta' | 'main-content' | 'table-header' | 'table-body' | 'table-caption'
  children: React.ReactNode
  className?: string
  as?: React.ElementType
  [key: string]: any
}

export const Typography: React.FC<TypographyProps> = ({
  variant,
  children,
  className,
  as: Component = 'div',
  ...props
}) => {
  const variants = {
    'hero-title': {
      mobile: "text-[35px] leading-[0.92] tracking-[-0.02em] font-[660] font-['Moses_Display']",
      desktop: "md:text-[82px]"
    },
    'hero-subtitle': {
      mobile: "text-[18px] leading-[1.4] tracking-[-0.005em] font-[470] font-['Moses_Display']",
      desktop: "md:text-[23px]"
    },
    // The one call to action on the page. Sits between the hero title and the
    // table captions on purpose: it has to outrank every heading below it
    // without competing with the headline above it.
    'section-cta': {
      mobile: "text-[28px] leading-[1.1] tracking-[-0.01em] font-[640]",
      desktop: "md:text-[44px]"
    },
    'main-content': {
      mobile: "text-[20px] leading-[1.5] tracking-[-0.005em] font-[400]",
      desktop: "md:text-[20px]"
    },
    'table-header': {
      mobile: "text-[16px] leading-[1.3] tracking-[-0.005em] font-[600]",
      desktop: "md:text-[16px]"
    },
    'table-body': {
      mobile: "text-[14px] leading-[1.4] tracking-[-0.005em] font-[400]",
      desktop: "md:text-[14px]"
    },
    'table-caption': {
      mobile: "text-[18px] leading-[1.3] tracking-[-0.005em] font-[400]",
      desktop: "md:text-[27px]"
    }
  }

  const variantConfig = variants[variant]
  
  return (
    <Component
      className={cn(
        "text-[#302727]",
        variantConfig.mobile,
        variantConfig.desktop,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

// Specific typography components for easier use
export const HeroTitle: React.FC<{ children: React.ReactNode; className?: string }> = (props) => (
  <Typography variant="hero-title" as="h1" {...props} />
)

export const HeroSubtitle: React.FC<{ children: React.ReactNode; className?: string }> = (props) => (
  <Typography variant="hero-subtitle" as="p" {...props} />
)

export const SectionCta: React.FC<{ children: React.ReactNode; className?: string }> = (props) => (
  <Typography variant="section-cta" as="h2" {...props} />
)

export const MainContent: React.FC<{ children: React.ReactNode; className?: string }> = (props) => (
  <Typography variant="main-content" as="p" {...props} />
)

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string } & React.ThHTMLAttributes<HTMLTableHeaderCellElement>> = ({ className, ...props }) => (
  <Typography variant="table-header" as="th" className={cn("text-gray-700", className)} {...props} />
)

export const TableBody: React.FC<{ children: React.ReactNode; className?: string } & React.TdHTMLAttributes<HTMLTableDataCellElement>> = ({ className, ...props }) => (
  <Typography variant="table-body" as="td" className={cn("text-gray-800", className)} {...props} />
)

export const TableCaption: React.FC<{ children: React.ReactNode; className?: string }> = ({ className, ...props }) => (
  <Typography variant="table-caption" as="h3" className={cn("text-gray-800", className)} {...props} />
)

export default Typography 