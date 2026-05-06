/**
 * AdminDashboard.jsx
 * Drop this in src/ and add a route: <Route path="/admin" element={<AdminDashboard />} />
 *
 * Required env vars (add to .env.local):
 *   VITE_SUPABASE_URL           — ya lo tienes
 *   VITE_SUPABASE_SERVICE_ROLE_KEY  — la service role key de Supabase
 *   VITE_ADMIN_PASSWORD         — password para el dashboard (default: "mundial2026")
 *
 * Required package:
 *   npm install recharts
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from 'recharts'

// ─── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL   = import.meta.env.VITE_SUPABASE_URL
const SERVICE_KEY    = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'mundial2026'
const TOTAL_STICKERS = 670   // estampas normales (ajusta si cambia)

let adminClient = null
if (SUPABASE_URL && SERVICE_KEY) {
  adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ─── Palette / Tokens ──────────────────────────────────────────────────────────
const P = {
  bg:       '#07080E',
  card:     '#0E1018',
  cardHi:   '#131620',
  border:   '#1E2235',
  orange:   '#E67316',
  orangeDim:'#7A3B0B',
  green:    '#10B981',
  blue:     '#3B82F6',
  red:      '#EF4444',
  gold:     '#F59E0B',
  text:     '#EDE9E3',
  muted:    '#525870',
  grid:     '#1A1D2A',
}

const CHART_COLORS = [P.orange, '#B7451A', P.green, P.blue, '#A855F7', P.gold]

// ─── Util ──────────────────────────────────────────────────────────────────────
const fmt = n  => (n ?? '—').toLocaleString()
const pct = (n, d) => d ? ((n / d) * 100).toFixed(1) + '%' : '—'
const dayKey = ts => new Date(ts).toISOString().slice(0, 10)

// ─── Font injection ────────────────────────────────────────────────────────────
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500&display=swap'

// ─── Data fetching ─────────────────────────────────────────────────────────────
async function fetchAllData() {
  if (!adminClient) throw new Error('SERVICE_KEY not configured')

  // 1) Auth users — paginado (max 1000 por llamada)
  let allUsers = []
  let page = 1
  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    allUsers = [...allUsers, ...(data?.users || [])]
    if ((data?.users?.length || 0) < 1000) break
    page++
  }

  // 2) user_progress
  const { data: progress, error: pErr } = await adminClient
    .from('user_progress')
    .select('user_id, owned_ids, has_coca, updated_at, share_token')
  if (pErr) throw pErr

  // 3) album_access — usuarios con álbum compartido
  const { data: access, error: aErr } = await adminClient
    .from('album_access')
    .select('owner_id')
  if (aErr) throw aErr

  // 4) follows
  const { data: follows, error: fErr } = await adminClient
    .from('follows')
    .select('following_id, follower_id')
  if (fErr) throw fErr

  return { users: allUsers, progress: progress || [], access: access || [], follows: follows || [] }
}

// ─── Analytics computation ─────────────────────────────────────────────────────
function computeMetrics({ users, progress, access, follows }) {
  const now  = Date.now()
  const MS_D = 86_400_000
  const MS_W = MS_D * 7

  const activeToday = progress.filter(r => now - new Date(r.updated_at) < MS_D).length
  const activeWeek  = progress.filter(r => now - new Date(r.updated_at) < MS_W).length

  const completions = progress.map(r => ({
    userId: r.user_id,
    owned:  r.owned_ids?.length || 0,
    pct:    (r.owned_ids?.length || 0) / TOTAL_STICKERS,
  }))
  const avgCompletion = completions.reduce((s, c) => s + c.pct, 0) / (completions.length || 1) * 100

  const BUCKETS = [
    { label: '0–10%',   min: 0,    max: 0.10 },
    { label: '10–25%',  min: 0.10, max: 0.25 },
    { label: '25–50%',  min: 0.25, max: 0.50 },
    { label: '50–75%',  min: 0.50, max: 0.75 },
    { label: '75–90%',  min: 0.75, max: 0.90 },
    { label: '90–100%', min: 0.90, max: 1.01 },
  ]
  const histogram = BUCKETS.map(b => ({
    ...b,
    count: completions.filter(c => c.pct >= b.min && c.pct < b.max).length,
  }))

  const activityMap = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - MS_D * i)
    activityMap[dayKey(d)] = 0
  }
  progress.forEach(r => {
    const k = dayKey(r.updated_at)
    if (k in activityMap) activityMap[k]++
  })
  const activityData = Object.entries(activityMap).map(([date, count]) => ({
    date: date.slice(5).replace('-', '/'),
    count,
  }))

  const freq = {}
  progress.forEach(r => {
    ;(r.owned_ids || []).forEach(id => { freq[id] = (freq[id] || 0) + 1 })
  })
  const entries    = Object.entries(freq)
  const topOwned   = [...entries].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([id, count]) => ({ id, count }))
  const topMissing = [...entries].sort((a, b) => a[1] - b[1]).slice(0, 15).map(([id, count]) => ({ id, count }))

  const sharedOwners  = new Set(access.map(r => r.owner_id)).size
  const withFollowers = new Set(follows.map(r => r.following_id)).size
  const hasCoca       = progress.filter(r => r.has_coca).length

  const userMap  = new Map(users.map(u => [u.id, u]))
  const retained = progress.filter(r => {
    const u = userMap.get(r.user_id)
    return u ? new Date(r.updated_at) - new Date(u.created_at) > MS_D : false
  }).length

  const withProgress = new Set(progress.map(r => r.user_id))
  const inactive = users.filter(u => !withProgress.has(u.id)).length

  return {
    totalUsers: users.length, totalProgress: progress.length,
    activeToday, activeWeek, avgCompletion,
    histogram, activityData, topOwned, topMissing,
    sharedOwners, withFollowers, hasCoca, retained, inactive,
  }
}

// ─── Components ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = P.orange, icon }) {
  return (
    <div style={{
      background: P.card, border: `1px solid ${P.border}`, borderRadius: 12,
      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }} />
      <div style={{ fontSize: 11, letterSpacing: 2, color: P.muted, textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600 }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 38, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: P.text, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: P.muted }}>{sub}</div>}
    </div>
  )
}

function ChartCard({ title, children, span = 1 }) {
  return (
    <div style={{
      background: P.card, border: `1px solid ${P.border}`, borderRadius: 12,
      padding: '20px 24px',
      gridColumn: span === 2 ? 'span 2' : undefined,
    }}>
      <div style={{ fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: P.muted, marginBottom: 20 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#161927', border: `1px solid ${P.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: P.text }}>
      <div style={{ color: P.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ color: P.orange, fontWeight: 700 }}>{payload[0].value}{unit}</div>
    </div>
  )
}

// ─── Password Gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock }) {
  const [val, setVal]     = useState('')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState(false)

  const tryUnlock = () => {
    if (val === ADMIN_PASSWORD) {
      onUnlock()
    } else {
      setShake(true); setError(true)
      setTimeout(() => setShake(false), 500)
      setTimeout(() => setError(false), 2000)
      setVal('')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: P.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <link rel="stylesheet" href={FONT_LINK} />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        animation: shake ? 'shake 0.4s ease' : 'none',
      }}>
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-10px)}
            40%{transform:translateX(10px)}
            60%{transform:translateX(-8px)}
            80%{transform:translateX(8px)}
          }
        `}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, letterSpacing: 4, color: P.muted, fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 8 }}>
            MUNDIAL 2026
          </div>
          <div style={{ fontSize: 52, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, color: P.text, lineHeight: 1 }}>
            ANALYTICS
          </div>
          <div style={{ fontSize: 52, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, color: P.orange, lineHeight: 1 }}>
            DASHBOARD
          </div>
        </div>
        <div style={{
          background: P.card, border: `1px solid ${error ? P.red : P.border}`,
          borderRadius: 16, padding: '32px 40px',
          display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320,
          transition: 'border-color 0.2s',
        }}>
          <input
            type="password" placeholder="Password" value={val} autoFocus
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryUnlock()}
            style={{
              background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8,
              padding: '12px 16px', color: P.text, fontSize: 16, outline: 'none',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
          <button
            onClick={tryUnlock}
            style={{
              background: P.orange, color: '#fff', border: 'none', borderRadius: 8,
              padding: '12px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Entrar
          </button>
          {error && <div style={{ color: P.red, fontSize: 13, textAlign: 'center' }}>Password incorrecto</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Loading Screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: P.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, fontFamily: 'Barlow Condensed, sans-serif',
    }}>
      <link rel="stylesheet" href={FONT_LINK} />
      <div style={{ width: 48, height: 48, border: `3px solid ${P.border}`, borderTop: `3px solid ${P.orange}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color: P.muted, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>
        Cargando datos…
      </div>
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

function Dashboard({ metrics }) {
  const m = metrics

  return (
    <div style={{
      minHeight: '100vh', background: P.bg, color: P.text,
      fontFamily: 'DM Sans, sans-serif',
      padding: '0 0 48px 0',
    }}>
      <link rel="stylesheet" href={FONT_LINK} />

      <div style={{
        borderBottom: `1px solid ${P.border}`,
        padding: '20px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 22, color: P.orange }}>
            MUNDIAL 2026
          </span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: P.text }}>
            ANALYTICS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 12, color: P.muted }}>
            {new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
          </div>
          <button
            onClick={() => window.location.href = '/'}
            style={{ fontSize: 12, color: P.muted, background: 'none', border: `1px solid ${P.border}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}
          >
            ← Álbum
          </button>
        </div>
      </div>

      <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard label="Usuarios totales"      value={fmt(m.totalUsers)}                sub={`${fmt(m.totalProgress)} con progreso`}                  icon="👥" />
          <StatCard label="Activos esta semana"    value={fmt(m.activeWeek)}               sub={`${fmt(m.activeToday)} hoy`}             accent={P.green} icon="📈" />
          <StatCard label="Completado promedio"    value={m.avgCompletion.toFixed(1) + '%'} sub={`de ${TOTAL_STICKERS} estampas`}        accent={P.blue}  icon="⭐" />
          <StatCard label="Retención"              value={pct(m.retained, m.totalProgress)} sub={`${fmt(m.retained)} activos más de 1 día`} accent={P.gold} icon="🔄" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard label="Álbumes compartidos"  value={fmt(m.sharedOwners)}  sub="owners en album_access"              accent="#A855F7" icon="🤝" />
          <StatCard label="Red social"           value={fmt(m.withFollowers)} sub="usuarios con al menos 1 seguidor"    accent={P.blue}  icon="🌐" />
          <StatCard label="Sección Coca-Cola"    value={fmt(m.hasCoca)}       sub={`${pct(m.hasCoca, m.totalProgress)} del total`} accent={P.red} icon="🥤" />
          <StatCard label="Sin progreso"         value={fmt(m.inactive)}      sub="registrados pero sin estampas"       accent={P.muted} icon="😴" />
        </div>

        {/* Activity — full width */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
          <ChartCard title="Actividad diaria — últimos 14 días" span={2}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={m.activityData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: P.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: P.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke={P.orange} strokeWidth={2.5}
                  dot={{ fill: P.orange, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: P.orange }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartCard title="Distribución de completado">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={m.histogram} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.grid} horizontal={true} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: P.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: P.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip unit=" usuarios" />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {m.histogram.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top estampas más tenidas">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={m.topOwned} layout="vertical" margin={{ top: 0, right: 24, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.grid} vertical={true} horizontal={false} />
                <XAxis type="number" tick={{ fill: P.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="id" tick={{ fill: P.text, fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<CustomTooltip unit=" usuarios" />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill={P.green} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
          <ChartCard title="Top estampas más faltantes (las que menos usuarios tienen)" span={2}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={m.topMissing} layout="vertical" margin={{ top: 0, right: 24, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.grid} vertical={true} horizontal={false} />
                <XAxis type="number" tick={{ fill: P.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="id" tick={{ fill: P.text, fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip unit=" usuarios" />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill={P.orange} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 8, fontSize: 11, color: P.muted }}>
              * Solo muestra estampas que al menos un usuario tiene. Las que nadie tiene no aparecen en owned_ids.
            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}

// ─── Root Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [rawData,  setRawData]  = useState(null)

  const metrics = useMemo(() => rawData ? computeMetrics(rawData) : null, [rawData])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetchAllData()
      setRawData(data)
    } catch (e) {
      setError(e.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (unlocked) load() }, [unlocked, load])

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />
  if (loading)   return <LoadingScreen />

  if (error) return (
    <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <link rel="stylesheet" href={FONT_LINK} />
      <div style={{ color: P.red, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, fontWeight: 700 }}>Error cargando datos</div>
      <div style={{ color: P.muted, fontSize: 14, maxWidth: 400, textAlign: 'center' }}>{error}</div>
      <div style={{ color: P.muted, fontSize: 12, background: P.card, padding: '12px 20px', borderRadius: 8, border: `1px solid ${P.border}` }}>
        Asegúrate de tener <code style={{ color: P.orange }}>VITE_SUPABASE_SERVICE_ROLE_KEY</code> en tu .env.local
      </div>
      <button onClick={load} style={{ background: P.orange, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>
        Reintentar
      </button>
    </div>
  )

  if (!metrics) return null
  return <Dashboard metrics={metrics} />
}
