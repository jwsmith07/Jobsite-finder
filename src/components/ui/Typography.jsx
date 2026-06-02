import React from 'react'

/**
 * PageTitle - Main page heading
 */
export function PageTitle({ children, className = '', ...props }) {
  return (
    <h1 className={`text-2xl sm:text-3xl font-bold text-white ${className}`} {...props}>
      {children}
    </h1>
  )
}

/**
 * PageSubtitle - Subtitle under page title
 */
export function PageSubtitle({ children, className = '', ...props }) {
  return (
    <p className={`mt-1 text-sm sm:text-base text-slate-400 ${className}`} {...props}>
      {children}
    </p>
  )
}

/**
 * SectionTitle - Section heading
 */
export function SectionTitle({ children, className = '', ...props }) {
  return (
    <h2 className={`text-xl sm:text-2xl font-semibold text-white ${className}`} {...props}>
      {children}
    </h2>
  )
}

/**
 * SectionSubtitle - Subtitle under section title
 */
export function SectionSubtitle({ children, className = '', ...props }) {
  return (
    <p className={`mt-1 text-sm text-slate-400 ${className}`} {...props}>
      {children}
    </p>
  )
}

/**
 * CardTitle - Title within a card
 */
export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-lg font-semibold text-white ${className}`} {...props}>
      {children}
    </h3>
  )
}

/**
 * BodyText - Standard body text
 */
export function BodyText({ children, className = '', ...props }) {
  return (
    <p className={`text-base text-slate-300 ${className}`} {...props}>
      {children}
    </p>
  )
}

/**
 * SmallText - Small secondary text
 */
export function SmallText({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-slate-400 ${className}`} {...props}>
      {children}
    </p>
  )
}

/**
 * Label - Form/list label
 */
export function Label({ children, className = '', ...props }) {
  return (
    <label className={`block text-sm font-semibold text-slate-300 ${className}`} {...props}>
      {children}
    </label>
  )
}

/**
 * Caption - Very small text
 */
export function Caption({ children, className = '', ...props }) {
  return (
    <span className={`text-xs text-slate-500 ${className}`} {...props}>
      {children}
    </span>
  )
}

/**
 * PageHeader - Complete header section with title, subtitle, and actions
 */
export function PageHeader({ title, subtitle, actions, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between ${className}`} {...props}>
      <div className="min-w-0 flex-1">
        <PageTitle>{title}</PageTitle>
        {subtitle && <PageSubtitle>{subtitle}</PageSubtitle>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
