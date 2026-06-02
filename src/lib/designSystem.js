/**
 * Design System - Spacing, Colors, Typography
 * Based on 8px scale for consistency
 */

export const SPACING = {
  xs: '4px',   // 0.5
  sm: '8px',   // 1
  md: '12px',  // 1.5
  lg: '16px',  // 2
  xl: '24px',  // 3
  '2xl': '32px', // 4
  '3xl': '48px', // 6
}

export const SPACING_CLASS = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
  '2xl': 'gap-8',
  '3xl': 'gap-12',
}

export const PADDING = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
  xl: 'p-6',
  '2xl': 'p-8',
}

export const MARGIN = {
  xs: 'm-1',
  sm: 'm-2',
  md: 'm-3',
  lg: 'm-4',
  xl: 'm-6',
  '2xl': 'm-8',
}

// Colors - Consistent with Tailwind theme
export const COLORS = {
  // Backgrounds
  bg: {
    primary: 'bg-slate-900',
    secondary: 'bg-slate-800',
    tertiary: 'bg-slate-950',
    accent: 'bg-amber-400',
    success: 'bg-green-500/10',
    warning: 'bg-yellow-500/10',
    error: 'bg-red-500/10',
  },

  // Borders
  border: {
    primary: 'border-slate-800',
    secondary: 'border-slate-700',
    tertiary: 'border-slate-600',
    accent: 'border-amber-400',
    success: 'border-green-600/50',
    warning: 'border-yellow-500/40',
    error: 'border-red-500/40',
  },

  // Text
  text: {
    primary: 'text-slate-100',
    secondary: 'text-slate-400',
    tertiary: 'text-slate-500',
    accent: 'text-amber-400',
    white: 'text-white',
    success: 'text-green-200',
    warning: 'text-yellow-200',
    error: 'text-red-300',
  },
}

// Border Radius - Use 'rounded-lg' (8px) for consistency, not rounded-3xl
export const BORDER_RADIUS = {
  sm: 'rounded',     // 4px
  md: 'rounded-lg',  // 8px (default)
  lg: 'rounded-xl',  // 12px (only for special cases)
  full: 'rounded-full',
}

// Typography Scale
export const TYPOGRAPHY = {
  h1: 'text-3xl font-bold', // Page titles
  h2: 'text-2xl font-bold', // Section titles
  h3: 'text-xl font-semibold', // Subsection titles
  h4: 'text-lg font-semibold', // Card titles
  body: 'text-base font-normal', // Body text
  bodySmall: 'text-sm font-normal', // Small body text
  label: 'text-sm font-semibold', // Labels
  caption: 'text-xs font-normal', // Captions
}

// Component Styles
export const COMPONENTS = {
  card: `${BORDER_RADIUS.md} border-slate-800 bg-slate-900 border`,
  cardPadding: 'p-4 sm:p-6',
  container: 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8',
  button: {
    primary: `rounded-lg px-4 py-2 font-semibold text-black bg-amber-400 hover:bg-amber-300 transition-colors`,
    secondary: `rounded-lg px-4 py-2 font-semibold border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 transition-colors`,
    ghost: `rounded-lg px-4 py-2 font-semibold text-slate-200 hover:bg-slate-800 transition-colors`,
    sm: `rounded-lg px-3 py-1 text-sm font-semibold`,
  },
}

// Status Colors
export const STATUS_COLORS = {
  active: { bg: 'bg-green-500/10', border: 'border-green-600/50', text: 'text-green-200' },
  submitted: { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-300' },
  applied: { bg: 'bg-sky-500/10', border: 'border-sky-500/40', text: 'text-sky-300' },
  shortlisted: { bg: 'bg-purple-500/10', border: 'border-purple-500/40', text: 'text-purple-300' },
  interview: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/40', text: 'text-indigo-300' },
  hired: { bg: 'bg-green-500/10', border: 'border-green-600/50', text: 'text-green-200' },
  rejected: { bg: 'bg-red-500/10', border: 'border-red-500/40', text: 'text-red-300' },
  open: { bg: 'bg-green-500/10', border: 'border-green-600/50', text: 'text-green-200' },
  filled: { bg: 'bg-blue-500/10', border: 'border-blue-500/40', text: 'text-blue-300' },
  paused: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-200' },
  closed: { bg: 'bg-slate-500/10', border: 'border-slate-500/40', text: 'text-slate-300' },
  archived: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/40', text: 'text-zinc-300' },
}

// Responsive utilities
export const RESPONSIVE = {
  pageTitle: 'text-2xl sm:text-3xl font-bold',
  sectionTitle: 'text-xl sm:text-2xl font-semibold',
  cardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
}
