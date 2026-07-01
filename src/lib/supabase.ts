import { createClient } from '@supabase/supabase-js'

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabaseReady = Boolean(supabaseUrl && supabaseAnonKey)

// Fallback URL prevents createClient from throwing if env vars are missing at build time
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
