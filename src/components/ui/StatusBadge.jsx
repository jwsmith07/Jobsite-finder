import React from 'react'
import { STATUS_COLORS } from '../../lib/designSystem'

/**
 * StatusBadge - Display application/job status with consistent styling
 */
export default function StatusBadge({
  status = 'submitted',
  className = '',
  size = 'md',
  ...props
}) {
  const normalizedStatus = status?.toLowerCase() || 'submitted'
  const colors = STATUS_COLORS[normalizedStatus] || STATUS_COLORS.submitted

  const sizeClass = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }[size]

  return (
    <span
      className={`
        inline-flex items-center
        rounded-full border font-semibold
        whitespace-nowrap
        transition-colors
        ${colors.bg} ${colors.border} ${colors.text}
        ${sizeClass}
        ${className}
      `}
      {...props}
    >
      {status}
    </span>
  )
}

/**
 * Badge - Generic badge component for labels/tags
 */
export function Badge({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) {
  const variants = {
    neutral: 'bg-slate-800 text-slate-200 border border-slate-700',
    accent: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
    error: 'bg-red-500/20 text-red-300 border border-red-500/40',
  }

  return (
    <span
      className={`
        inline-flex items-center
        rounded-full border px-3 py-1 text-xs font-semibold
        whitespace-nowrap
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}
