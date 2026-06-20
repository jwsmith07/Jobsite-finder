import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { normalizeRole } from '../lib/utils'

// Hard cap on profile-fetch wait to avoid permanent loading state if
// Supabase ever hangs. After this, the app falls back to auth metadata.
const PROFILE_FETCH_TIMEOUT_MS = 4000
const SESSION_FETCH_TIMEOUT_MS = 4000

function withTimeout(promise, fallback, label) {
  let timeoutId
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`[useAuth] ${label} timed out, using fallback`)
      resolve(fallback)
    }, SESSION_FETCH_TIMEOUT_MS)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

export function useAuth() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    function loadProfile(currentUser) {
      if (!currentUser?.id) {
        if (mounted) {
          setProfile(null)
          setProfileLoading(false)
        }
        return
      }
      if (mounted) setProfileLoading(true)

      // Safety timeout — if the network call hangs, give up and let the
      // app fall back to user_metadata.role rather than freezing routes.
      const timeoutId = setTimeout(() => {
        if (!mounted) return
        console.warn('[useAuth] profile fetch timed out, using metadata fallback')
        setProfileLoading(false)
      }, PROFILE_FETCH_TIMEOUT_MS)

      supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', currentUser.id)
        .maybeSingle()
        .then(({ data, error }) => {
          clearTimeout(timeoutId)
          if (!mounted) return
          if (error) {
            console.warn('[useAuth] profile fetch failed:', error.message)
            setProfile(null)
          } else {
            setProfile(data ?? null)
          }
          setProfileLoading(false)
        })
        .catch((err) => {
          clearTimeout(timeoutId)
          if (!mounted) return
          console.warn('[useAuth] profile fetch threw:', err?.message || err)
          setProfile(null)
          setProfileLoading(false)
        })
    }

    withTimeout(
      supabase.auth.getSession(),
      { data: { session: null } },
      'getSession',
    )
      .then(({ data }) => {
        if (!mounted) return
        const s = data.session ?? null
        setSession(s)
        setUser(s?.user ?? null)
        setLoading(false)
        loadProfile(s?.user)
      })
      .catch((err) => {
        if (!mounted) return
        console.warn('[useAuth] getSession failed:', err?.message || err)
        setLoading(false)
      })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return
        setSession(newSession ?? null)
        setUser(newSession?.user ?? null)
        setLoading(false)
        loadProfile(newSession?.user)
      },
    )

    return () => {
      mounted = false
      subscription?.subscription?.unsubscribe?.()
    }
  }, [])

  // DB profiles.role is source of truth. Metadata may bootstrap ordinary
  // onboarding routes, but never grant admin access if the profile read fails.
  const profileRole = normalizeRole(profile?.role)
  const metadataRole = normalizeRole(user?.user_metadata?.role)
  const role = profileRole || (metadataRole === 'admin' ? '' : metadataRole)

  return { user, session, profile, role, loading, profileLoading }
}
