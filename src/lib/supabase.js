import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export async function signInWithEmail(email) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

// ─── Progress sync ───────────────────────────────────────────────────────────
export async function loadProgress(userId) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('owned_ids, has_coca, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveProgress(userId, ownedIds, hasCoca) {
  const { error } = await supabase.from('user_progress').upsert({
    user_id:    userId,
    owned_ids:  ownedIds,
    has_coca:   hasCoca,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}
