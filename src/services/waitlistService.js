import { supabase } from '../lib/supabase'

const allowedRoles = new Set([
  'Trades Worker',
  'Subcontractor',
  'General Contractor',
  'Industry Partner',
  'Investor',
])

function normalizeSignup(values = {}) {
  const name = String(values.name || '').trim()
  const email = String(values.email || '').trim().toLowerCase()
  const role = String(values.role || '').trim()
  const message = String(values.message || '').trim()

  if (!name) throw new Error('Please enter your name.')
  if (!email || !email.includes('@')) throw new Error('Please enter a valid email address.')
  if (!allowedRoles.has(role)) throw new Error('Please choose how you identify.')

  return { name, email, role, message: message || null }
}

export async function createWaitlistSignup(values) {
  const signup = normalizeSignup(values)
  const payload = {
    name: signup.name,
    email: signup.email,
    role: signup.role,
    message: signup.message,
    created_at: new Date().toISOString(),
  }
  const { error } = await supabase
    .from('waitlist_signups')
    .insert(payload)

  if (error) {
    if (error.code === '23505') {
      return { duplicate: true }
    }
    throw new Error(`Failed to join waitlist: ${error.message}`)
  }

  return { duplicate: false }
}
