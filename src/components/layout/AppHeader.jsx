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
      <header className="sticky top-0 z-30 w-full border-b border-slate-800/90 bg-slate-950/90 shadow-xl shadow-black/20 backdrop-blur">
        <div className="grid h-[72px] w-full grid-cols-[minmax(44px,1fr)_auto_minmax(88px,1fr)] items-center gap-2 px-3 py-2 sm:h-20 sm:px-5 lg:h-20 lg:px-8">
          <div className="flex items-center justify-start">
            <HamburgerMenu open={open} onClick={() => setOpen((value) => !value)} />
          </div>

          <Logo asLink size="header" className="justify-center" />

          <div className="flex items-center justify-end gap-2">
            <Link
              to="/notifications"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-100 transition hover:border-amber-400/60 hover:bg-slate-800"
              aria-label="Notifications"
            >
              <Bell size={20} aria-hidden="true" />
            </Link>
            {loading || !user ? (
              <Link
                to="/signin"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-100 transition hover:border-amber-400/60 hover:bg-slate-800"
                aria-label="Sign in"
              >
                <UserCircle size={22} aria-hidden="true" />
              </Link>
            ) : null}
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
