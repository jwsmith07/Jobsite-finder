import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey, validateEnv } from './env'

validateEnv()

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
