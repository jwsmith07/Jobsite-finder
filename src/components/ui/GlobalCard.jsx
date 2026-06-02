import React from 'react'

/**
 * GlobalCard - Consistent card component
 * Replaces scattered div+className patterns with variants
 */
export default function GlobalCard({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  interactive = false,
  ...props
}) {
  const paddingMap = {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    none: 'p-0',
  }

  const variantStyles = {
    default: 'rounded-lg border border-slate-800 bg-slate-900',
    elevated: 'rounded-lg border border-slate-700 bg-slate-800 shadow-lg',
    outlined: 'rounded-lg border border-slate-700 bg-slate-950',
    subtle: 'rounded-lg border border-slate-800 bg-slate-900/50',
    ghost: 'rounded-lg border border-slate-800/50 bg-transparent',
  }

  const interactiveClass = interactive
    ? 'transition-all duration-200 hover:border-slate-600 hover:shadow-md cursor-pointer'
    : ''

  return (
    <div
      className={`${variantStyles[variant]} ${paddingMap[padding]} ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * CardHeader - Standardized header within cards
 */
export function CardHeader({ title, subtitle, actions, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between ${className}`} {...props}>
      <div className="min-w-0 flex-1">
        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

/**
 * CardContent - Standardized content section
 */
export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  )
}

/**
 * CardFooter - Standardized footer with actions
 */
export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between ${className}`} {...props}>
      {children}
    </div>
  )
}
