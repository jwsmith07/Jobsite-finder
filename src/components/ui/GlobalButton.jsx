import React from 'react'

/**
 * GlobalButton - Consistent button variants
 */
export default function GlobalButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-amber-400 text-black hover:bg-amber-300 disabled:bg-amber-300/50',
    secondary: 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50',
    ghost: 'text-slate-200 hover:bg-slate-800 disabled:opacity-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50',
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm rounded-md',
    md: 'px-4 py-2 text-sm font-semibold rounded-lg',
    lg: 'px-6 py-3 text-base font-semibold rounded-lg',
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2
        transition-all duration-200
        font-semibold
        focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}

/**
 * ButtonGroup - Group related buttons
 */
export function ButtonGroup({ children, className = '', ...props }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} {...props}>
      {children}
    </div>
  )
}
