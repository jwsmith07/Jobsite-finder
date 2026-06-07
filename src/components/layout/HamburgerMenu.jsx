import { Menu } from 'lucide-react'

export default function HamburgerMenu({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-white transition hover:border-amber-400/60 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
      aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={open}
      aria-controls="app-navigation-drawer"
    >
      <Menu size={22} aria-hidden="true" />
    </button>
  )
}
