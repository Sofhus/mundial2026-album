import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  ALL_STICKERS, ALL_STICKERS_CC, CC_STICKERS,
  TOTAL, TOTAL_CC,
  RARE_STICKERS, SECTIONS, TEAM_LIST,
  STICKER_MAP, parseRangeInput, idsToRanges
} from './data/stickerData.js'
import {
  supabase, signInWithEmail, signInWithGoogle, signOut,
  loadProgress, saveProgress,
  getOrCreateShareToken, joinAlbumByToken, getMyAlbumOwnerId
} from './lib/supabase.js'

// ─── Persistence ─────────────────────────────────────────────────────────────
function loadOwned() {
  try { return new Set(JSON.parse(localStorage.getItem('owned_2026v2') || '[]')) }
  catch { return new Set() }
}
function saveOwned(set) { localStorage.setItem('owned_2026v2', JSON.stringify([...set])) }
function loadHasCoca() { return localStorage.getItem('coca_2026') }
function saveHasCoca(v) { localStorage.setItem('coca_2026', v ? 'true' : 'false') }

// Album color palette
const C = {
  lime:    '#8bc34a',
  teal:    '#4db6ac',
  purple:  '#7c3aed',
  red:     '#e53935',
  gold:    '#d97706',
  emerald: '#16a34a',
  strip:   'linear-gradient(90deg, #8bc34a 0%, #4db6ac 30%, #7c3aed 65%, #e53935 100%)',
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#f2f2f5' }}>
      <div className="flex flex-col items-center gap-3">
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: `2.5px solid ${C.purple}`,
          borderTopColor: 'transparent',
          animation: 'spin 0.7s linear infinite',
        }} />
        <p className="text-xs font-medium" style={{ color: '#bbb' }}>Cargando…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Google icon ─────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

// ─── Login screen ─────────────────────────────────────────────────────────────
function LoginScreen({ hasPendingJoin }) {
  const [email,       setEmail]       = useState('')
  const [emailStatus, setEmailStatus] = useState('idle') // idle | sending | sent | error
  const [emailError,  setEmailError]  = useState('')
  const [googleError, setGoogleError] = useState('')

  const pendingToken = localStorage.getItem('pending_join_token')

  async function handleGoogle() {
    setGoogleError('')
    const { error } = await signInWithGoogle(pendingToken)
    if (error) {
      setGoogleError(
        error.message?.includes('provider') || error.message?.includes('not enabled')
          ? 'Google Sign-In no está activado aún. Usa tu correo por ahora.'
          : error.message
      )
    }
    // On success: redirects to Google and back. onAuthStateChange handles the session.
  }

  async function handleEmail() {
    if (!email.trim()) return
    setEmailStatus('sending')
    setEmailError('')
    const { error } = await signInWithEmail(email.trim(), pendingToken)
    if (error) { setEmailStatus('error'); setEmailError(error.message); return }
    setEmailStatus('sent')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f2f2f5' }}>
      <div style={{ height: 3, background: C.strip }} />

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          {/* Wordmark */}
          <div className="text-center mb-8">
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: '#ccc' }}>Panini</p>
            <h1 className="font-black text-[26px] tracking-tight leading-none mt-1" style={{ color: '#111' }}>
              Mundial 2026
            </h1>
            <p className="text-xs mt-1.5 font-medium" style={{ color: '#bbb' }}>by Shift</p>
          </div>

          {/* Invite banner */}
          {hasPendingJoin && (
            <div className="mb-5 px-4 py-3 rounded-2xl text-center"
              style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)' }}>
              <p className="font-semibold text-sm" style={{ color: C.purple }}>Te invitaron a llenar un álbum</p>
              <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                Inicia sesión para unirte y marcar estampas juntos
              </p>
            </div>
          )}

          {/* Card */}
          <div className="surface p-6">
            {/* Google */}
            <button onClick={handleGoogle}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all"
              style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,0.11)', color: '#333' }}
              onMouseOver={e => e.currentTarget.style.background = '#f6f6f8'}
              onMouseOut={e  => e.currentTarget.style.background = '#fff'}>
              <GoogleIcon />
              Continuar con Google
            </button>

            {googleError && (
              <p className="text-xs mt-2.5 text-center leading-snug" style={{ color: '#e53935' }}>
                {googleError}
              </p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
              <span className="text-[11px]" style={{ color: '#c0c0c0' }}>o con tu correo</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
            </div>

            {/* Email flow */}
            {emailStatus === 'sent' ? (
              <div className="px-4 py-4 rounded-xl text-center"
                style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.18)' }}>
                <p className="font-bold text-sm" style={{ color: '#15803d' }}>Revisa tu correo</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: '#666' }}>
                  Mandamos un link a <strong>{email}</strong>.
                  Ábrelo desde este dispositivo.
                </p>
                <button onClick={() => setEmailStatus('idle')}
                  className="text-xs mt-3 font-semibold"
                  style={{ color: C.purple }}>
                  Usar otro correo
                </button>
              </div>
            ) : (
              <>
                <input type="email" autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmail()}
                  placeholder="tu@correo.com"
                  className="w-full text-sm rounded-xl px-4 py-2.5 mb-2 outline-none transition-colors"
                  style={{ background: '#f6f6f8', border: '1px solid rgba(0,0,0,0.1)', color: '#111' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.4)'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
                {emailError && (
                  <p className="text-xs mb-2" style={{ color: '#e53935' }}>{emailError}</p>
                )}
                <button onClick={handleEmail}
                  disabled={emailStatus === 'sending' || !email.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                  style={{
                    background: emailStatus === 'sending' || !email.trim() ? '#c4b5fd' : C.purple,
                    cursor:     emailStatus === 'sending' || !email.trim() ? 'not-allowed' : 'pointer',
                  }}>
                  {emailStatus === 'sending' ? 'Enviando…' : 'Enviar link de acceso'}
                </button>
              </>
            )}
          </div>

          <p className="text-center text-[11px] mt-5" style={{ color: '#ccc' }}>
            Tu progreso se guarda en la nube automáticamente
          </p>
        </div>
      </div>

      <footer className="text-center pb-8">
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: '#ddd' }}>Creado por</p>
        <p className="text-sm font-bold mt-0.5" style={{ color: '#bbb' }}>Shift</p>
      </footer>
    </div>
  )
}

// ─── Share drawer ─────────────────────────────────────────────────────────────
function ShareDrawer({ user, albumOwnerId, onClose }) {
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [copiedApp,     setCopiedApp]     = useState(false)
  const [loadingToken,  setLoadingToken]  = useState(false)

  const effectiveOwnerId = albumOwnerId || user.id

  async function handleShareAccount() {
    setLoadingToken(true)
    try {
      const token = await getOrCreateShareToken(effectiveOwnerId)
      const url   = `${window.location.origin}?join=${token}`
      await navigator.clipboard.writeText(url)
      setCopiedAccount(true)
      setTimeout(() => setCopiedAccount(false), 2500)
    } catch (e) {
      console.error(e)
    }
    setLoadingToken(false)
  }

  async function handleShareApp() {
    await navigator.clipboard.writeText(window.location.origin)
    setCopiedApp(true)
    setTimeout(() => setCopiedApp(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-5 sm:pb-0"
      style={{ background: 'rgba(0,0,0,0.42)' }} onClick={onClose}>
      <div className="w-full max-w-sm surface p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base" style={{ color: '#111' }}>Compartir</h3>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-lg leading-none"
            style={{ background: 'rgba(0,0,0,0.07)', color: '#666' }}>
            ×
          </button>
        </div>

        {/* Share account (same album) */}
        <div className="rounded-xl p-4 mb-3" style={{ background: '#fafafa', border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(124,58,237,0.09)', fontSize: 16 }}>
              👥
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#111' }}>Compartir álbum</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#888' }}>
                Para llenar el mismo álbum juntos (hermano, pareja…)
              </p>
            </div>
          </div>
          <button onClick={handleShareAccount} disabled={loadingToken}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: copiedAccount ? C.emerald : loadingToken ? '#c4b5fd' : C.purple }}>
            {copiedAccount ? 'Link copiado' : loadingToken ? 'Generando…' : 'Copiar link de invitación'}
          </button>
        </div>

        {/* Share app (separate album) */}
        <div className="rounded-xl p-4" style={{ background: '#fafafa', border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(22,163,74,0.09)', fontSize: 16 }}>
              📲
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#111' }}>Recomendar app</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#888' }}>
                Para que alguien lleve su propio álbum por separado
              </p>
            </div>
          </div>
          <button onClick={handleShareApp}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: copiedApp ? C.emerald : 'rgba(0,0,0,0.07)',
                     color:      copiedApp ? '#fff'     : '#444' }}>
            {copiedApp ? 'Link copiado' : 'Copiar link de la app'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Coca-Cola first-open modal ───────────────────────────────────────────────
function CocaModal({ onChoice }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm p-6 surface">
        <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#999' }}>
          Sección especial
        </p>
        <h2 className="font-bold text-xl mb-2 leading-snug" style={{ color: '#111' }}>
          ¿Tu álbum incluye la sección Coca-Cola?
        </h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: '#666' }}>
          Esta sección especial (CC-1 a CC-14) viene en versiones regionales del álbum y contiene estampas exclusivas de jugadores estrella, distribuidas dentro de productos Coca-Cola.
        </p>
        <div className="flex flex-col gap-2">
          <button onClick={() => onChoice(true)}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-colors text-white"
            style={{ background: C.purple }}
            onMouseOver={e => e.currentTarget.style.background = '#6d28d9'}
            onMouseOut={e  => e.currentTarget.style.background = C.purple}>
            Sí, mi álbum la incluye
          </button>
          <button onClick={() => onChoice(false)}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'rgba(0,0,0,0.05)', color: '#666' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.09)'}
            onMouseOut={e  => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}>
            No, mi álbum no la tiene
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sticker tile ─────────────────────────────────────────────────────────────
function StickerTile({ sticker, owned, onMouseDown, onMouseEnter }) {
  const isOwned = owned.has(sticker.id)
  let bg, text, outline
  if (isOwned && sticker.isRare) {
    bg = C.gold; text = '#fff'; outline = 'none'
  } else if (isOwned) {
    bg = C.emerald; text = '#fff'; outline = 'none'
  } else if (sticker.isRare) {
    bg = '#fef3c7'; text = '#b45309'; outline = '1px solid #fde68a'
  } else {
    bg = 'rgba(0,0,0,0.06)'; text = '#aaa'; outline = 'none'
  }

  return (
    <div
      onMouseDown={() => onMouseDown(sticker.id)}
      onMouseEnter={() => onMouseEnter(sticker.id)}
      title={`${sticker.id} — ${sticker.label}${sticker.isRare ? ' · RARA' : ''}`}
      style={{ background: bg, color: text, cursor: 'pointer', borderRadius: 6, outline,
               display: 'flex', flexDirection: 'column', alignItems: 'center',
               justifyContent: 'center', aspectRatio: '1', transition: 'transform 0.05s' }}
      onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.zIndex = 10 }}
      onMouseOut={e  => { e.currentTarget.style.transform = ''; e.currentTarget.style.zIndex = '' }}
    >
      <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.65, lineHeight: 1 }}>
        {sticker.id.split('-')[0]}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1, marginTop: 1 }}>
        {sticker.num}
      </span>
    </div>
  )
}

// ─── Sticker grid ─────────────────────────────────────────────────────────────
function StickerGrid({ stickers, owned, onMouseDown, onMouseEnter }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))', gap: 4 }}>
      {stickers.map(s => (
        <StickerTile key={s.id} sticker={s} owned={owned}
          onMouseDown={onMouseDown} onMouseEnter={onMouseEnter} />
      ))}
    </div>
  )
}

// ─── Desktop sidebar nav ──────────────────────────────────────────────────────
function SectionNav({ allStickers, owned, active, onSelect, hasCoca }) {
  const allCount = allStickers.filter(s => owned.has(s.id)).length
  const fwcCount = allStickers.filter(s => s.section === 'FWC' && owned.has(s.id)).length
  const fwcTotal = allStickers.filter(s => s.section === 'FWC').length
  const ccCount  = allStickers.filter(s => s.section === 'CC'  && owned.has(s.id)).length
  const groups   = ['A','B','C','D','E','F','G','H','I','J','K','L']

  function NavItem({ id, label, count, total }) {
    const isActive = active === id
    const full     = total > 0 && count === total
    return (
      <button onClick={() => onSelect(id)}
        className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors"
        style={{ background: isActive ? 'rgba(124,58,237,0.09)' : 'transparent' }}>
        <span className="text-[11px] font-bold font-mono w-9 flex-shrink-0"
          style={{ color: isActive ? C.purple : '#888' }}>
          {id === 'all' ? 'ALL' : id}
        </span>
        <span className="flex-1 text-[11px] truncate"
          style={{ color: isActive ? '#111' : '#555', fontWeight: isActive ? 600 : 400 }}>
          {label}
        </span>
        {total > 0 && (
          <span className="text-[10px] tabular-nums flex-shrink-0"
            style={{ color: full ? C.emerald : '#bbb', fontWeight: full ? 700 : 400 }}>
            {count}/{total}
          </span>
        )}
      </button>
    )
  }

  return (
    <nav className="space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
      <NavItem id="all" label="Todo el álbum" count={allCount} total={allStickers.length} />
      <NavItem id="FWC" label="Especiales FWC" count={fwcCount} total={fwcTotal} />
      {hasCoca && <NavItem id="CC" label="Coca-Cola" count={ccCount} total={14} />}
      <div className="my-2" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }} />
      {groups.map(g => {
        const teamsInGroup = TEAM_LIST.filter(t => t.group === g)
        return (
          <div key={g}>
            <p className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: '#bbb' }}>
              Grupo {g}
            </p>
            {teamsInGroup.map(team => {
              const teamStickers = allStickers.filter(s => s.section === team.code)
              const have = teamStickers.filter(s => owned.has(s.id)).length
              return <NavItem key={team.code} id={team.code} label={team.name}
                count={have} total={teamStickers.length} />
            })}
          </div>
        )
      })}
    </nav>
  )
}

// ─── Tab: Álbum ───────────────────────────────────────────────────────────────
function AlbumTab({ allStickers, owned, toggle, addMany, removeMany, hasCoca, onToggleCoca }) {
  const [activeSection, setActiveSection] = useState('all')
  const [bulkInput, setBulkInput]         = useState('')
  const [bulkMode,  setBulkMode]          = useState('add')
  const [feedback,  setFeedback]          = useState('')
  const dragging   = useRef(false)
  const dragAction = useRef(null)

  const visibleStickers = useMemo(() =>
    activeSection === 'all' ? allStickers : allStickers.filter(s => s.section === activeSection),
    [activeSection, allStickers]
  )
  const have  = visibleStickers.filter(s => owned.has(s.id)).length
  const total = visibleStickers.length
  const pct   = total ? Math.round((have / total) * 100) : 0
  const activeSec    = SECTIONS.find(s => s.id === activeSection)
  const isCC         = activeSection === 'CC'
  const accentColor  = isCC ? C.red : C.purple

  function flash(msg) { setFeedback(msg); setTimeout(() => setFeedback(''), 2500) }

  function applyBulk() {
    if (!bulkInput.trim()) return
    const ids   = parseRangeInput(bulkInput)
    const valid = [...ids]
    if (!valid.length) { flash('Formato: MEX 1-15, ARG 3 5 o CC 1-14'); return }
    bulkMode === 'add' ? addMany(valid) : removeMany(valid)
    flash(`${valid.length} estampas ${bulkMode === 'add' ? 'marcadas' : 'desmarcadas'}`)
    setBulkInput('')
  }

  function markSection(val) {
    const ids = visibleStickers.map(s => s.id)
    val ? addMany(ids) : removeMany(ids)
    flash(`${ids.length} estampas ${val ? 'marcadas' : 'desmarcadas'}`)
  }

  function onMouseDown(id) {
    dragging.current   = true
    dragAction.current = owned.has(id) ? 'remove' : 'add'
    toggle(id)
  }
  function onMouseEnter(id) {
    if (!dragging.current) return
    if (dragAction.current === 'add'    && !owned.has(id)) toggle(id)
    if (dragAction.current === 'remove' &&  owned.has(id)) toggle(id)
  }
  function stopDrag() { dragging.current = false; dragAction.current = null }

  const grouped = useMemo(() => {
    if (activeSection !== 'all') return null
    const map = {}
    allStickers.forEach(s => { if (!map[s.section]) map[s.section] = []; map[s.section].push(s) })
    return map
  }, [activeSection, allStickers])

  return (
    <div className="lg:flex lg:gap-5">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-52 xl:w-60 flex-shrink-0">
        <div className="surface p-2 sticky top-24" style={{ background: '#fafafa' }}>
          <SectionNav allStickers={allStickers} owned={owned}
            active={activeSection} onSelect={setActiveSection} hasCoca={hasCoca} />
        </div>
      </aside>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Mobile pills */}
        <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2">
          {[{ id: 'all', label: 'Todo' }, { id: 'FWC', label: 'FWC' }].map(({ id, label }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: activeSection === id ? C.purple : 'rgba(0,0,0,0.07)',
                       color:      activeSection === id ? '#fff'    : '#555' }}>
              {label}
            </button>
          ))}
          {hasCoca && (
            <button onClick={() => setActiveSection('CC')}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: activeSection === 'CC' ? C.red : 'rgba(229,57,53,0.1)',
                       color:      activeSection === 'CC' ? '#fff' : C.red }}>
              CC
            </button>
          )}
          <div className="flex-shrink-0 w-px mx-0.5" style={{ background: 'rgba(0,0,0,0.1)' }} />
          {TEAM_LIST.map(team => {
            const h        = allStickers.filter(s => s.section === team.code && owned.has(s.id)).length
            const complete = h === 20
            return (
              <button key={team.code} onClick={() => setActiveSection(team.code)}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors"
                style={{
                  background: activeSection === team.code ? C.purple
                    : complete ? 'rgba(22,163,74,0.12)' : 'rgba(0,0,0,0.07)',
                  color: activeSection === team.code ? '#fff'
                    : complete ? C.emerald : '#555',
                }}>
                {team.code}
              </button>
            )
          })}
        </div>

        {/* Section header */}
        <div className="surface p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-base" style={{ color: '#111' }}>
                {activeSec?.name || activeSection}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: '#777' }}>
                {have} de {total}&ensp;·&ensp;
                <span style={{ color: accentColor, fontWeight: 700 }}>{pct}%</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => markSection(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(22,163,74,0.1)', color: '#15803d' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(22,163,74,0.18)'}
                onMouseOut={e  => e.currentTarget.style.background = 'rgba(22,163,74,0.1)'}>
                Marcar todas
              </button>
              <button onClick={() => markSection(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(0,0,0,0.06)', color: '#666' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                onMouseOut={e  => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}>
                Limpiar
              </button>
            </div>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <div className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: accentColor }} />
          </div>
        </div>

        {/* Bulk input */}
        <div className="surface p-4">
          <p className="text-[10px] uppercase tracking-widest font-bold mb-2.5" style={{ color: '#aaa' }}>
            Entrada rápida
          </p>
          <div className="space-y-2">
            <input
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyBulk()}
              placeholder={hasCoca ? 'MEX 1-15,  ARG 3 5,  CC 1-14' : 'MEX 1-15,  ARG 3 5 10-18,  FWC 1-8'}
              className="w-full text-sm outline-none transition-colors rounded-xl px-4 py-2.5"
              style={{ background: '#f6f6f8', border: '1px solid rgba(0,0,0,0.1)', color: '#111' }}
              onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.45)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
            />
            <div className="flex gap-2">
              <select value={bulkMode} onChange={e => setBulkMode(e.target.value)}
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: '#f6f6f8', border: '1px solid rgba(0,0,0,0.1)', color: '#444' }}>
                <option value="add">Marcar</option>
                <option value="remove">Desmarcar</option>
              </select>
              <button onClick={applyBulk}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: C.purple }}
                onMouseOver={e => e.currentTarget.style.background = '#6d28d9'}
                onMouseOut={e  => e.currentTarget.style.background = C.purple}>
                Aplicar
              </button>
            </div>
          </div>
          {feedback
            ? <p className="text-xs mt-2 font-semibold" style={{ color: C.purple }}>{feedback}</p>
            : <p className="text-xs mt-2" style={{ color: '#bbb' }}>
                Arrastra el mouse sobre el tablero para marcar varias de un jalón
              </p>
          }
        </div>

        {/* Coca-Cola toggle */}
        <button onClick={onToggleCoca}
          className="w-full text-left surface-sm px-4 py-3 flex items-center justify-between"
          onMouseOver={e => e.currentTarget.style.background = '#f8f8f8'}
          onMouseOut={e  => e.currentTarget.style.background = '#fff'}>
          <div>
            <p className="text-xs font-semibold" style={{ color: '#333' }}>Sección Coca-Cola (CC-1 a CC-14)</p>
            <p className="text-xs mt-0.5" style={{ color: '#aaa' }}>
              {hasCoca ? 'Incluida en tu álbum — toca para desactivar' : 'No incluida — toca para activar'}
            </p>
          </div>
          <div className="w-10 h-5 rounded-full relative flex-shrink-0 ml-4 transition-colors"
            style={{ background: hasCoca ? C.red : 'rgba(0,0,0,0.15)' }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
              style={{ left: hasCoca ? '22px' : '2px' }} />
          </div>
        </button>

        {/* Sticker grid */}
        <div className="surface p-4 select-none" onMouseUp={stopDrag} onMouseLeave={stopDrag}>
          {isCC && (
            <div className="mb-3 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(229,57,53,0.07)', border: '1px solid rgba(229,57,53,0.2)' }}>
              <p className="text-xs font-medium" style={{ color: C.red }}>
                Estampas exclusivas Coca-Cola — disponibles solo dentro de productos participantes
              </p>
            </div>
          )}
          {grouped ? (
            <div className="space-y-6">
              {Object.entries(grouped).map(([code, stickers]) => {
                const sec   = SECTIONS.find(s => s.id === code)
                const team  = TEAM_LIST.find(t => t.code === code)
                const h     = stickers.filter(s => owned.has(s.id)).length
                const pctS  = Math.round((h / stickers.length) * 100)
                const sIsCC = code === 'CC'
                return (
                  <div key={code}>
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-xs font-bold font-mono tracking-wider" style={{ color: '#444' }}>{code}</span>
                      <span className="text-xs" style={{ color: '#aaa' }}>{sec?.name || team?.name}</span>
                      <div className="flex-1 rounded-full h-1 overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                        <div className="h-1 rounded-full transition-all duration-300"
                          style={{ width: `${pctS}%`, background: pctS === 100 ? C.emerald : sIsCC ? C.red : C.purple }} />
                      </div>
                      <span className="text-xs tabular-nums"
                        style={{ color: pctS === 100 ? C.emerald : '#bbb', fontWeight: pctS === 100 ? 700 : 400 }}>
                        {h}/{stickers.length}
                      </span>
                    </div>
                    <StickerGrid stickers={stickers} owned={owned}
                      onMouseDown={onMouseDown} onMouseEnter={onMouseEnter} />
                  </div>
                )
              })}
            </div>
          ) : (
            <StickerGrid stickers={visibleStickers} owned={owned}
              onMouseDown={onMouseDown} onMouseEnter={onMouseEnter} />
          )}

          <div className="flex items-center gap-5 mt-4 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            {[
              { bg: C.emerald,           label: 'Tengo' },
              { bg: 'rgba(0,0,0,0.08)',  label: 'Falta' },
              { bg: C.gold,              label: 'Rara'  },
            ].map(({ bg, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: '#888' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: bg }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Faltan ──────────────────────────────────────────────────────────────
function FaltanTab({ allStickers, owned }) {
  const [filterGroup, setFilterGroup] = useState('all')
  const missing = allStickers.filter(s => !owned.has(s.id))
  const groups  = ['all', 'FWC', 'CC', 'A','B','C','D','E','F','G','H','I','J','K','L']

  const sections = filterGroup === 'all'
    ? ['FWC', ...(allStickers.find(s => s.section === 'CC') ? ['CC'] : []), ...TEAM_LIST.map(t => t.code)]
    : filterGroup === 'FWC' ? ['FWC']
    : filterGroup === 'CC'  ? ['CC']
    : TEAM_LIST.filter(t => t.group === filterGroup).map(t => t.code)

  return (
    <div className="space-y-3">
      <div className="surface p-5 flex items-center justify-between">
        <div>
          <p className="font-black text-4xl tabular-nums" style={{ color: '#111' }}>{missing.length}</p>
          <p className="text-sm mt-1" style={{ color: '#888' }}>
            estampas faltantes&ensp;·&ensp;{allStickers.filter(s => owned.has(s.id)).length} de {allStickers.length} conseguidas
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {groups.map(g => {
          const cnt = g === 'all' ? missing.length
            : g === 'FWC' ? missing.filter(s => s.section === 'FWC').length
            : g === 'CC'  ? missing.filter(s => s.section === 'CC').length
            : missing.filter(s => TEAM_LIST.find(t => t.code === s.section)?.group === g).length
          if (g === 'CC' && !allStickers.find(s => s.section === 'CC')) return null
          return (
            <button key={g} onClick={() => setFilterGroup(g)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: filterGroup === g ? C.purple : 'rgba(0,0,0,0.07)',
                       color:      filterGroup === g ? '#fff'    : '#555' }}>
              {g === 'all' ? 'Todo' : g === 'FWC' ? 'FWC' : g === 'CC' ? 'CC' : `Grupo ${g}`}
              <span className="ml-1 opacity-60">({cnt})</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        {sections.map(code => {
          const team        = TEAM_LIST.find(t => t.code === code)
          const sec         = SECTIONS.find(s => s.id === code)
          const sectionMiss = missing.filter(s => s.section === code)
          if (!sectionMiss.length) return null
          return (
            <div key={code} className="surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold font-mono text-sm" style={{ color: '#222' }}>{code}</span>
                  <span className="text-sm" style={{ color: '#aaa' }}>{sec?.name || team?.name}</span>
                </div>
                <span className="text-xs tabular-nums" style={{ color: '#aaa' }}>
                  {sectionMiss.length} {sectionMiss.length === 1 ? 'falta' : 'faltan'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sectionMiss.map(s => (
                  <span key={s.id} className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                    style={s.isRare
                      ? { background: '#fef3c7', color: '#b45309', outline: '1px solid #fde68a' }
                      : { background: 'rgba(0,0,0,0.06)', color: '#888' }}>
                    {s.id}{s.isRare ? ' R' : ''}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
        {!sections.some(code => missing.find(s => s.section === code)) && (
          <div className="surface p-12 text-center">
            <p className="font-bold text-lg" style={{ color: '#111' }}>Sección completa</p>
            <p className="text-sm mt-1" style={{ color: '#aaa' }}>No te falta ninguna estampa aquí</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Raras ───────────────────────────────────────────────────────────────
function RarasTab({ allStickers, owned }) {
  const rareStickers = allStickers.filter(s => s.isRare)
  const have = rareStickers.filter(s => owned.has(s.id)).length
  const pct  = rareStickers.length ? Math.round((have / rareStickers.length) * 100) : 0

  return (
    <div className="space-y-3">
      <div className="surface p-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#aaa' }}>
              Estampas raras
            </p>
            <p className="font-bold text-base" style={{ color: '#111' }}>
              {have} de {rareStickers.length} conseguidas
            </p>
          </div>
          <span className="text-3xl font-black tabular-nums" style={{ color: C.gold }}>{pct}%</span>
        </div>
        <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
          <div className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: C.gold }} />
        </div>
        <p className="text-xs mt-3 leading-relaxed" style={{ color: '#aaa' }}>
          Aprox. 1 estampa rara por cada 8 sobres. Las FWC especiales aparecen 1 vez cada 100 sobres.
        </p>
      </div>

      <div className="space-y-2">
        {rareStickers.map(s => {
          const isOwned = owned.has(s.id)
          const team    = TEAM_LIST.find(t => t.code === s.teamCode)
          const isCC    = s.section === 'CC'
          return (
            <div key={s.id} className="surface p-4"
              style={isOwned ? { outline: '2px solid rgba(217,119,6,0.3)' } : {}}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: isOwned ? C.gold : isCC ? 'rgba(229,57,53,0.1)' : '#fef3c7',
                           color:      isOwned ? '#fff'  : isCC ? C.red               : '#b45309' }}>
                  <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.7 }}>
                    {s.id.split('-')[0]}
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 900, lineHeight: 1 }}>{s.num}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: '#111' }}>{s.label}</span>
                    {team && <span className="text-xs font-mono" style={{ color: '#bbb' }}>{team.code}</span>}
                    {isCC && <span className="text-xs font-semibold" style={{ color: C.red }}>Coca-Cola</span>}
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#b45309' }}>{s.rareReason}</p>
                </div>
                <span className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={isOwned
                    ? { background: 'rgba(22,163,74,0.12)', color: C.emerald, outline: '1px solid rgba(22,163,74,0.25)' }
                    : { background: 'rgba(0,0,0,0.05)', color: '#aaa' }}>
                  {isOwned ? 'Tengo' : 'Falta'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: Exportar ────────────────────────────────────────────────────────────
function ExportarTab({ allStickers, owned }) {
  const [copied, setCopied] = useState('')
  const missing = allStickers.filter(s => !owned.has(s.id))
  const pct     = Math.round((allStickers.filter(s => owned.has(s.id)).length / allStickers.length) * 100)

  function buildText(format) {
    const header = `Me faltan ${missing.length} estampas del álbum Panini FIFA Mundial 2026 (${pct}% completado)\n\n`
    if (format === 'ranges') {
      const byTeam = {}
      missing.forEach(s => { if (!byTeam[s.section]) byTeam[s.section] = []; byTeam[s.section].push(s.num) })
      const order = ['FWC', 'CC', ...TEAM_LIST.map(t => t.code)]
      const lines = order.filter(c => byTeam[c]).map(c => {
        const nums   = [...new Set(byTeam[c])].sort((a, b) => a - b)
        const ranges = []; let st = nums[0], en = nums[0]
        for (let i = 1; i < nums.length; i++) {
          if (nums[i] === en + 1) { en = nums[i] } else { ranges.push(st === en ? `${st}` : `${st}-${en}`); st = en = nums[i] }
        }
        ranges.push(st === en ? `${st}` : `${st}-${en}`)
        return `${c}: ${ranges.join(', ')}`
      })
      return header + lines.join('\n')
    }
    if (format === 'bygroup') {
      const ccLines = missing.filter(s => s.section === 'CC').length
        ? `CC (Coca-Cola): ${missing.filter(s => s.section === 'CC').map(s => s.id).join(', ')}\n\n`
        : ''
      const lines = ['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => {
        const teams  = TEAM_LIST.filter(t => t.group === g)
        const tLines = teams.map(t => {
          const tm = missing.filter(s => s.section === t.code)
          if (!tm.length) return `  ${t.code}: completo`
          const nums   = tm.map(s => s.num).sort((a, b) => a - b)
          const ranges = []; let st = nums[0], en = nums[0]
          for (let i = 1; i < nums.length; i++) {
            if (nums[i] === en + 1) { en = nums[i] } else { ranges.push(st === en ? `${st}` : `${st}-${en}`); st = en = nums[i] }
          }
          ranges.push(st === en ? `${st}` : `${st}-${en}`)
          return `  ${t.code}: ${ranges.join(', ')}`
        }).join('\n')
        return `Grupo ${g}:\n${tLines}`
      }).join('\n\n')
      return header + ccLines + lines
    }
    if (format === 'rare') {
      const miss = allStickers.filter(s => s.isRare && !owned.has(s.id))
      if (!miss.length) return 'Ya tengo todas las estampas raras del álbum 2026.'
      return `Me faltan ${miss.length} estampas raras:\n\n` +
        miss.map(s => `${s.id} — ${s.label}`).join('\n') +
        '\n\nTienes alguna para cambio?'
    }
  }

  async function copy(format) {
    await navigator.clipboard.writeText(buildText(format))
    setCopied(format); setTimeout(() => setCopied(''), 2000)
  }
  function whatsapp(format) {
    window.open(`https://wa.me/?text=${encodeURIComponent(buildText(format))}`, '_blank')
  }

  const formats = [
    { id: 'ranges',  title: 'Por código y rango', desc: 'Compacto — MEX: 3-7, 12 · ARG: 5, 18' },
    { id: 'bygroup', title: 'Por grupo A–L',       desc: 'Organizado por grupo del torneo' },
    { id: 'rare',    title: 'Solo las raras',      desc: 'Lista de raras para buscar cambio' },
  ]

  return (
    <div className="space-y-3">
      <div className="surface p-5">
        <p className="text-[10px] uppercase tracking-widest font-bold mb-4" style={{ color: '#aaa' }}>Resumen</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: missing.length,                                       label: 'Faltantes',   clr: '#111'    },
            { val: allStickers.filter(s => owned.has(s.id)).length,      label: 'Conseguidas', clr: C.emerald },
            { val: `${pct}%`,                                            label: 'Completado',  clr: C.purple  },
          ].map(({ val, label, clr }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: '#f6f6f8' }}>
              <p className="text-2xl font-black tabular-nums" style={{ color: clr }}>{val}</p>
              <p className="text-xs mt-0.5" style={{ color: '#aaa' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
      {formats.map(f => (
        <div key={f.id} className="surface p-4">
          <p className="font-semibold text-sm" style={{ color: '#111' }}>{f.title}</p>
          <p className="text-xs mb-3" style={{ color: '#aaa' }}>{f.desc}</p>
          <div className="rounded-xl p-3 mb-3 max-h-32 overflow-y-auto" style={{ background: '#f6f6f8' }}>
            <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed" style={{ color: '#666' }}>
              {buildText(f.id)}
            </pre>
          </div>
          <div className="flex gap-2">
            <button onClick={() => copy(f.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: copied === f.id ? C.emerald : 'rgba(0,0,0,0.07)',
                       color:      copied === f.id ? '#fff'    : '#555' }}>
              {copied === f.id ? 'Copiado' : 'Copiar'}
            </button>
            <button onClick={() => whatsapp(f.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: '#25D366' }}
              onMouseOver={e => e.currentTarget.style.background = '#20bd5a'}
              onMouseOut={e  => e.currentTarget.style.background = '#25D366'}>
              WhatsApp
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [authLoading,   setAuthLoading]   = useState(true)
  const [user,          setUser]          = useState(null)
  const [albumOwnerId,  setAlbumOwnerId]  = useState(null)
  const [owned,         setOwned]         = useState(loadOwned)
  const [tab,           setTab]           = useState('album')
  const [hasCoca,       setHasCoca]       = useState(() => loadHasCoca() === 'true')
  const [showCocaModal, setShowCocaModal] = useState(() => loadHasCoca() === null)
  const [showShareDrawer, setShowShareDrawer] = useState(false)
  const [hasPendingJoin,  setHasPendingJoin]  = useState(() => !!localStorage.getItem('pending_join_token'))
  const initialSyncDone = useRef(false)

  const allStickers = useMemo(() => hasCoca ? ALL_STICKERS_CC : ALL_STICKERS, [hasCoca])

  // Parse ?join= from URL and store in localStorage before any OAuth redirects clear it
  useEffect(() => {
    const params    = new URLSearchParams(window.location.search)
    const joinToken = params.get('join')
    if (joinToken) {
      localStorage.setItem('pending_join_token', joinToken)
      setHasPendingJoin(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => { saveOwned(owned) }, [owned])

  // Auth subscription
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) {
        initialSyncDone.current = false
        setAlbumOwnerId(null)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // On user login: handle pending join + initial sync
  useEffect(() => {
    if (!user || initialSyncDone.current) return
    initialSyncDone.current = true

    async function initialize() {
      let targetId = user.id

      const pendingToken = localStorage.getItem('pending_join_token')
      if (pendingToken) {
        localStorage.removeItem('pending_join_token')
        setHasPendingJoin(false)
        const ownerId = await joinAlbumByToken(pendingToken, user.id)
        if (ownerId && ownerId !== user.id) targetId = ownerId
      } else {
        const ownerId = await getMyAlbumOwnerId(user.id)
        if (ownerId) targetId = ownerId
      }

      setAlbumOwnerId(targetId)

      const data = await loadProgress(targetId).catch(() => null)
      if (!data) {
        await saveProgress(targetId, [...owned], hasCoca).catch(console.error)
      } else {
        const merged     = new Set([...owned, ...(data.owned_ids || [])])
        const cocaMerged = data.has_coca || hasCoca
        if (merged.size !== owned.size) setOwned(merged)
        if (cocaMerged !== hasCoca) { setHasCoca(cocaMerged); saveHasCoca(cocaMerged) }
        if (merged.size !== (data.owned_ids || []).length || cocaMerged !== data.has_coca) {
          await saveProgress(targetId, [...merged], cocaMerged).catch(console.error)
        }
      }
    }

    initialize().catch(console.error)
  }, [user])

  // Debounced cloud save
  useEffect(() => {
    if (!user || !initialSyncDone.current || !albumOwnerId) return
    const t = setTimeout(() => {
      saveProgress(albumOwnerId, [...owned], hasCoca).catch(console.error)
    }, 600)
    return () => clearTimeout(t)
  }, [owned, hasCoca, user, albumOwnerId])

  function handleCocaChoice(val) {
    setHasCoca(val); saveHasCoca(val); setShowCocaModal(false)
  }
  function toggleCoca() {
    const next = !hasCoca; setHasCoca(next); saveHasCoca(next)
  }
  async function handleLogout() {
    await signOut()
    initialSyncDone.current = false
  }

  const toggle   = useCallback(id => {
    setOwned(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }, [])
  const addMany  = useCallback(ids => {
    setOwned(prev => { const n = new Set(prev); ids.forEach(id => n.add(id)); return n })
  }, [])
  const removeMany = useCallback(ids => {
    setOwned(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n })
  }, [])

  const totalAct = allStickers.length
  const ownedAct = allStickers.filter(s => owned.has(s.id)).length
  const pct      = Math.round((ownedAct / totalAct) * 100)

  const tabs = [
    { id: 'album',    label: 'Álbum'    },
    { id: 'faltan',   label: 'Faltan'   },
    { id: 'raras',    label: 'Raras'    },
    { id: 'exportar', label: 'Exportar' },
  ]

  if (authLoading) return <LoadingScreen />
  if (!user)       return <LoginScreen hasPendingJoin={hasPendingJoin} />

  const isSharedMember = albumOwnerId && albumOwnerId !== user.id

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f2f2f5' }}>
      {showCocaModal && <CocaModal onChoice={handleCocaChoice} />}
      {showShareDrawer && (
        <ShareDrawer user={user} albumOwnerId={albumOwnerId}
          onClose={() => setShowShareDrawer(false)} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30"
        style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
                 borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{ height: 3, background: C.strip }} />

        <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-4 pb-3">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#bbb' }}>Panini</p>
              <h1 className="font-black text-xl tracking-tight leading-none mt-0.5" style={{ color: '#111' }}>
                Mundial 2026
              </h1>
              {isSharedMember && (
                <p className="text-[10px] mt-1 font-semibold" style={{ color: C.purple }}>
                  Álbum compartido
                </p>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {/* Share button */}
              <button onClick={() => setShowShareDrawer(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                style={{ background: 'rgba(0,0,0,0.06)', color: '#555' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                onMouseOut={e  => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5"  r="3"/>
                  <circle cx="6"  cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
                </svg>
                Compartir
              </button>

              <div className="text-right">
                <span className="text-3xl font-black tabular-nums" style={{ color: C.purple }}>{pct}%</span>
                <p className="text-xs" style={{ color: '#aaa' }}>{ownedAct} / {totalAct}</p>
              </div>
            </div>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <div className="h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: C.strip }} />
          </div>
        </div>

        <div className="max-w-6xl mx-auto flex" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-3 text-xs font-semibold tracking-wide transition-colors"
              style={tab === t.id
                ? { color: C.purple, borderBottom: `2px solid ${C.purple}` }
                : { color: '#aaa' }}
              onMouseOver={e => { if (tab !== t.id) e.currentTarget.style.color = '#555' }}
              onMouseOut={e  => { if (tab !== t.id) e.currentTarget.style.color = '#aaa' }}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-8 py-5">
        {tab === 'album'    && <AlbumTab    allStickers={allStickers} owned={owned} toggle={toggle} addMany={addMany} removeMany={removeMany} hasCoca={hasCoca} onToggleCoca={toggleCoca} />}
        {tab === 'faltan'   && <FaltanTab   allStickers={allStickers} owned={owned} />}
        {tab === 'raras'    && <RarasTab    allStickers={allStickers} owned={owned} />}
        {tab === 'exportar' && <ExportarTab allStickers={allStickers} owned={owned} />}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-4 lg:px-8 pb-8 pt-6 mt-2"
        style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between mb-4 pb-4"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-xs" style={{ color: '#888' }}>{user.email}</p>
          <button onClick={handleLogout}
            className="text-xs font-semibold transition-colors"
            style={{ color: '#bbb' }}
            onMouseOver={e => e.currentTarget.style.color = '#e53935'}
            onMouseOut={e  => e.currentTarget.style.color = '#bbb'}>
            Cerrar sesión
          </button>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#ccc' }}>Creado por</p>
          <p className="text-sm font-bold tracking-tight" style={{ color: '#888' }}>Shift</p>
          <a href="tel:5510807509" className="block text-xs tabular-nums"
            style={{ color: '#bbb' }}
            onMouseOver={e => e.currentTarget.style.color = '#666'}
            onMouseOut={e  => e.currentTarget.style.color = '#bbb'}>
            55 1080 7509
          </a>
        </div>
      </footer>
    </div>
  )
}
