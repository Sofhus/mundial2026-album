import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export async function signInWithEmail(email, joinToken) {
  const redirectTo = joinToken
    ? `${window.location.origin}?join=${joinToken}`
    : window.location.origin
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })
}

export async function signInWithGoogle(joinToken) {
  const redirectTo = joinToken
    ? `${window.location.origin}?join=${joinToken}`
    : window.location.origin
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

// ─── Progress sync ───────────────────────────────────────────────────────────
export async function loadProgress(userId) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('owned_ids, has_coca, share_token, updated_at')
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

// ─── Sharing ─────────────────────────────────────────────────────────────────
export async function getOrCreateShareToken(userId) {
  const { data } = await supabase
    .from('user_progress')
    .select('share_token')
    .eq('user_id', userId)
    .maybeSingle()

  if (data?.share_token) return data.share_token

  const token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
  await supabase
    .from('user_progress')
    .upsert({ user_id: userId, share_token: token, updated_at: new Date().toISOString() })
  return token
}

export async function joinAlbumByToken(token, viewerId) {
  const { data: ownerId, error } = await supabase.rpc('find_owner_by_token', { p_token: token })
  if (error || !ownerId || ownerId === viewerId) return null

  const { error: joinErr } = await supabase
    .from('album_access')
    .upsert({ owner_id: ownerId, viewer_id: viewerId })
  if (joinErr) { console.error(joinErr); return null }
  return ownerId
}

export async function getMyAlbumOwnerId(userId) {
  const { data } = await supabase
    .from('album_access')
    .select('owner_id')
    .eq('viewer_id', userId)
    .maybeSingle()
  return data?.owner_id ?? null
}
