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
    .select('owned_ids, has_coca, dupes, share_token, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveProgress(userId, ownedIds, hasCoca, dupes) {
  const { error } = await supabase.from('user_progress').upsert({
    user_id:    userId,
    owned_ids:  ownedIds,
    has_coca:   hasCoca,
    dupes:      dupes ?? {},
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

// ─── Sharing ─────────────────────────────────────────────────────────────────
export async function getOrCreateShareToken(userId) {
  const { data, error: selectErr } = await supabase
    .from('user_progress')
    .select('share_token')
    .eq('user_id', userId)
    .maybeSingle()

  if (selectErr) throw selectErr
  if (data?.share_token) return data.share_token

  const token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
  const { error: updateErr } = await supabase
    .from('user_progress')
    .update({ share_token: token, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (updateErr) throw updateErr
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

// ─── Friends / Social ────────────────────────────────────────────────────────
export async function followByToken(token, followerId) {
  const { data: ownerId, error } = await supabase.rpc('find_owner_by_token', { p_token: token })
  if (error) throw error
  if (!ownerId || ownerId === followerId) return null

  const { error: insertErr } = await supabase
    .from('follows')
    .upsert({ follower_id: followerId, following_id: ownerId }, { ignoreDuplicates: true })
  if (insertErr) throw insertErr
  return ownerId
}

export async function getFollowing(userId) {
  const { data, error } = await supabase.rpc('get_following_with_progress', { p_follower_id: userId })
  if (error) throw error
  return data || []
}

export async function unfollowUser(followingId, followerId) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  if (error) throw error
}
