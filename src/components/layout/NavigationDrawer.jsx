import { Link } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
import { getRoleLabel } from '../../lib/utils'
import RoleBasedMenu from './RoleBasedMenu'
import Logo from '../common/Logo'

export default function NavigationDrawer({ open, user, role, onClose, onSignOut }) {
  const signedIn = Boolean(user)
  const accountName = user?.user_metadata?.full_name || user?.email || 'Guest'

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="app-navigation-drawer"
        className={`fixed left-0 top-0 z-50 flex h-dvh w-[min(86vw,320px)] flex-col border-r border-slate-800 bg-slate-950 shadow-2xl shadow-black/40 transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-5">
          <Logo asLink size="mobileHeader" onClick={onClose} />
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-300/50"
            aria-label="Close navigation menu"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="border-b border-slate-800 px-4 py-4">
          <p className="truncate text-sm font-semibold text-white">{accountName}</p>
          <p className="mt-1 text-xs text-slate-400">{signedIn ? getRoleLabel(role) : 'Public'}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <RoleBasedMenu role={role} signedIn={signedIn} onSelect={onClose} />
        </div>

        <div className="border-t border-slate-800 p-3">
          {signedIn ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                onSignOut()
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-slate-800 hover:text-red-200"
            >
              <LogOut size={18} aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              to="/signin"
              onClick={onClose}
              className="flex min-h-11 items-center justify-center rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-black text-black transition hover:bg-amber-300"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
