import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, MoreVertical } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { getDefaultRouteForRole, normalizeRole } from '../../lib/utils'

const publicLinks = [
  { to: '/jobsites', label: 'Jobsites Map' },
  { to: '/about', label: 'About' },
  { to: '/pricing', label: 'Pricing' },
]

function PublicMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-200 transition hover:border-amber-400/50 hover:text-white focus:outline-none"
        aria-label="Open navigation menu"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-700 bg-slate-900 py-1 shadow-2xl">
          <div className="py-1">
            {publicLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm transition hover:bg-slate-800 hover:text-white ${
                    isActive ? 'text-amber-400' : 'text-slate-300'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="border-t border-slate-800 py-1">
            <Link
              to="/signin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function UserMenu({ user, role, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const initials = (user.user_metadata?.full_name || user.email || '?')
    .charAt(0)
    .toUpperCase()

  const dashboardHref = getDefaultRouteForRole(role) || '/dashboard'

  const menuItems = []
  if (normalizeRole(role) === 'worker') {
    menuItems.push(
      { to: dashboardHref, label: 'Dashboard' },
      { to: '/worker/profile', label: 'My Profile' },
      { to: '/worker/applications', label: 'My Applications' },
      { to: '/worker/saved', label: 'Saved Jobs' },
    )
  } else if (normalizeRole(role) === 'gc') {
    menuItems.push(
      { to: dashboardHref, label: 'Dashboard' },
      { to: '/gc/company', label: 'Company Profile' },
      { to: '/gc/jobs', label: 'Post Jobs' },
      { to: '/gc/applicants', label: 'Applicants' },
      // Claims not in General Contractor menu?
    )
  } else if (normalizeRole(role) === 'sc') {
    menuItems.push(
      { to: dashboardHref, label: 'Dashboard' },
      { to: '/subcontractor/company', label: 'Company Profile' },
      { to: '/subcontractor/jobs', label: 'Post Jobs' },
      { to: '/subcontractor/applicants', label: 'Applicants' },
    )
  } else if (normalizeRole(role) === 'admin') {
    menuItems.push(
      { to: dashboardHref, label: 'Admin Dashboard' },
      { to: '/admin/claims', label: 'Claims' },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/jobsites', label: 'Jobsites Map' },
    )
  } else {
    menuItems.push({ to: '/onboarding/select-role', label: 'Choose account type' })
  }

  const accountPublicLinks = [
    { to: '/jobsites', label: 'Jobsites Map' },
    { to: '/about', label: 'About Jobsite Finder' },
    { to: '/pricing', label: 'Pricing' },
  ]

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-1.5 transition hover:border-amber-400/50 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-black">
          {initials}
        </span>
        <MoreVertical size={15} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-700 bg-slate-900 py-1 shadow-2xl">
          {/* User info */}
          <div className="border-b border-slate-800 px-4 py-2.5">
            <p className="truncate text-xs font-semibold text-white">
              {user.user_metadata?.full_name || 'Account'}
            </p>
            <p className="truncate text-[11px] text-slate-500">{user.email}</p>
          </div>

          {/* Nav items */}
          <div className="py-1">
            {accountPublicLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-800 py-1">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Sign out */}
          <div className="border-t border-slate-800 py-1">
            <button
              type="button"
              onClick={() => { setOpen(false); onSignOut() }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 transition hover:bg-slate-800 hover:text-red-300"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/JobsiteFinderLogoSVG.svg"
            alt="Jobsite Finder"
            className="h-12 w-auto transition-transform duration-200 hover:scale-105"
          />
          <span className="text-lg font-black text-white">
            Jobsite <span className="text-amber-400">Finder</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <UserMenu user={user} role={role} onSignOut={handleSignOut} />
          ) : (
            <>
              <PublicMenu />
              <Link
                to="/signin"
                className="hidden rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:border-amber-400/50 sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
