import { useState } from 'react'
import { Hammer, Users, Building2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getOAuthRedirectUrl } from '../../lib/env'
import PasswordInput from '../../components/auth/PasswordInput'
import Logo from '../../components/common/Logo'
import { normalizeTrade, renderTradeOptions } from '../../lib/trades'

const ROLES = [
  {
    id: 'worker',
    label: 'Worker',
    description: 'Find jobsites and connect with hiring contractors across Canada.',
    icon: <Hammer className="w-7 h-7" />,
  },
  {
    id: 'sc',
    label: 'Subcontractor',
    description: 'Request participation on active projects, post roles, and grow your crew.',
    icon: <Users className="w-7 h-7" />,
  },
  {
    id: 'gc',
    label: 'General Contractor',
    description: 'Claim projects, control project pages, post jobs, and review applicants.',
    icon: <Building2 className="w-7 h-7" />,
  },
]

const inputCls =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 placeholder:text-slate-500'

function friendlySignUpError(message) {
  const text = String(message || '').toLowerCase()
  if (text.includes('already registered') || text.includes('already exists')) return 'An account already exists for that email. Try signing in instead.'
  if (text.includes('password')) return 'Please use a password with at least 6 characters.'
  if (text.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.'
  return message || 'Could not create your account. Please try again.'
}

export default function SignUpPage() {
  const [role, setRole] = useState(null)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [trade, setTrade] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const selected = ROLES.find((r) => r.id === role)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const metadata =
      role === 'worker'
        ? { full_name: fullName, trade: normalizeTrade(trade) }
        : { full_name: companyName, company_name: companyName }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: friendlySignUpError(error.message) })
    } else {
      setMessage({
        type: 'success',
        text: role === 'worker'
          ? 'Account created. Check your email, then complete your worker profile and start applying.'
          : 'Account created. Check your email, then complete your company profile so you can claim projects and post jobs.',
      })
    }
  }

  async function handleGoogleSignUp() {
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getOAuthRedirectUrl('/') },
    })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: friendlySignUpError(error.message) })
    }
  }

  if (!role) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo size="auth" />
        </div>
        <h1 className="text-2xl font-bold mb-1">Get started</h1>
        <p className="text-sm text-slate-400 mb-6">Choose the path that matches how you will use Jobsite Finder.</p>
        <div className="flex flex-col gap-3">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className="flex items-start gap-4 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 text-left hover:border-amber-400 hover:bg-slate-800 transition-colors group"
            >
              <span className="mt-0.5 text-amber-400 shrink-0">{r.icon}</span>
              <span>
                <span className="block font-semibold text-white group-hover:text-amber-400 transition-colors">
                  {r.label}
                </span>
                <span className="block text-sm text-slate-400 mt-0.5">{r.description}</span>
              </span>
              <svg className="ml-auto mt-1 w-4 h-4 text-slate-600 group-hover:text-amber-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex justify-center">
        <Logo size="auth" />
      </div>
      <div className="mb-5">
        <button
          onClick={() => { setRole(null); setMessage(null) }}
          className="mb-4 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Change account type
        </button>
        <span className="inline-block rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400">
          {selected?.label}
        </span>
        <h1 className="mt-3 text-2xl font-bold">
          {role === 'worker' ? 'Create your worker profile' : 'Create your company account'}
        </h1>
        <p className="mt-1 text-sm text-slate-400">{selected?.description}</p>
        {role !== 'worker' && (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            After sign up: create company profile, claim or request a project connection, wait for approval, then post jobs.
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'worker' ? (
            <>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className={inputCls}
                placeholder="Full name"
              />
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                required
                className={inputCls}
              >
                {renderTradeOptions({ placeholder: 'Primary trade' })}
              </select>
            </>
          ) : (
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoComplete="organization"
              className={inputCls}
              placeholder="Company name"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputCls}
            placeholder="Email"
          />
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Password (min. 6 characters)"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-black hover:bg-amber-300 disabled:opacity-60"
          >
            {loading
              ? 'Creating account...'
              : role === 'worker'
              ? 'Create worker account'
              : 'Create company account'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          OR
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 px-4 py-3 font-semibold text-white hover:border-slate-500 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {message && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              message.type === 'error'
                ? 'border-red-500/40 bg-red-500/10 text-red-300'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            {message.type === 'error' ? '⚠ ' : '✓ '}
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
