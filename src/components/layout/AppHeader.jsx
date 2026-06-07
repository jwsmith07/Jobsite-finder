import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, UserCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import HamburgerMenu from './HamburgerMenu'
import NavigationDrawer from './NavigationDrawer'
import Logo from '../common/Logo'

export default function AppHeader() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/90 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mx-auto grid h-20 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6">
          <HamburgerMenu open={open} onClick={() => setOpen((value) => !value)} />

          <Logo asLink size="header" className="justify-center" />

          <div className="flex items-center justify-end gap-2">
            <Link
              to="/notifications"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-100 transition hover:border-amber-400/60 hover:bg-slate-800"
              aria-label="Notifications"
            >
              <Bell size={20} aria-hidden="true" />
            </Link>
            {loading || !user ? (
              <Link
                to="/signin"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-100 transition hover:border-amber-400/60 hover:bg-slate-800"
                aria-label="Sign in"
              >
                <UserCircle size={22} aria-hidden="true" />
              </Link>
            ) : (
              <Link
                to={role === 'worker' ? '/worker/profile' : role === 'admin' ? '/admin/dashboard' : role === 'gc' ? '/gc/company' : '/subcontractor/company'}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-black transition hover:bg-amber-300"
                aria-label="User profile"
              >
                {(user.user_metadata?.full_name || user.email || '?').charAt(0).toUpperCase()}
              </Link>
            )}
          </div>
        </div>
      </header>

      <NavigationDrawer
        open={open}
        user={user}
        role={role}
        onClose={() => setOpen(false)}
        onSignOut={handleSignOut}
      />
    </>
  )
}
