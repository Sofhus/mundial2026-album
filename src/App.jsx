import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  ALL_STICKERS, ALL_STICKERS_CC,
  SECTIONS, TEAM_LIST,
  parseRangeInput,
} from './data/stickerData.js'
import {
  supabase, signInWithEmail, signInWithGoogle, signOut,
  loadProgress, saveProgress,
  getOrCreateShareToken, joinAlbumByToken, getMyAlbumOwnerId,
} from './lib/supabase.js'

function loadOwned() {
  try { return new Set(JSON.parse(localStorage.getItem('owned_2026v2') || '[]')) }
  catch { return new Set() }
}
function saveOwned(set) { localStorage.setItem('owned_2026v2', JSON.stringify([...set])) }
function loadHasCoca() { return localStorage.getItem('coca_2026') }
function saveHasCoca(v) { localStorage.setItem('coca_2026', v ? 'true' : 'false') }

const C = {
  lime:    '#8bc34a',
  teal:    '#4db6ac',
  purple:  '#7c3aed',
  red:     '#e53935',
  gold:    '#d97706',
  emerald: '#16a34a',
  strip:   'linear-gradient(90deg, #8bc34a 0%, #4db6ac 30%, #7c3aed 65%, #e53935 100%)',
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f5' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2.5px solid ${C.purple}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>Cargando…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

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
  const [email, setEmail]           = useState('')
  const [emailStatus, setEmailStatus] = useState('idle')
  const [emailError,  setEmailError]  = useState('')
  const [googleError, setGoogleError] = useState('')
  const pendingToken = localStorage.getItem('pending_join_token')

  async function handleGoogle() {
    setGoogleError('')
    const { error } = await signInWithGoogle(pendingToken)
    if (error) setGoogleError(error.message?.includes('provider') || error.message?.includes('not enabled') ? 'Google no está activado aún. Usa tu correo.' : error.message)
  }
  async function handleEmail() {
    if (!email.trim()) return
    setEmailStatus('sending'); setEmailError('')
    const { error } = await signInWithEmail(email.trim(), pendingToken)
    if (error) { setEmailStatus('error'); setEmailError(error.message); return }
    setEmailStatus('sent')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f2f2f5' }}>
      <div style={{ height: 3, background: C.strip }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.2em', fontWeight: 700, color: '#ccc', textTransform: 'uppercase' }}>Panini</p>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: '#111', marginTop: 4, lineHeight: 1 }}>Mundial 2026</h1>
            <p style={{ fontSize: 12, color: '#bbb', fontWeight: 500, marginTop: 6 }}>by Shift</p>
          </div>
          {hasPendingJoin && (
            <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 16, textAlign: 'center', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)' }}>
              <p style={{ fontWeight: 600, fontSize: 13, color: C.purple }}>Te invitaron a llenar un álbum</p>
              <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Inicia sesión para unirte</p>
            </div>
          )}
          <div className="surface" style={{ padding: 24 }}>
            <button onClick={handleGoogle} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff', border: '1.5px solid rgba(0,0,0,0.11)', color: '#333', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseOver={e => e.currentTarget.style.background = '#f6f6f8'}
              onMouseOut={e  => e.currentTarget.style.background = '#fff'}>
              <GoogleIcon /> Continuar con Google
            </button>
            {googleError && <p style={{ fontSize: 11, color: '#e53935', textAlign: 'center', marginTop: 8 }}>{googleError}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
              <span style={{ fontSize: 11, color: '#c0c0c0' }}>o con tu correo</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
            </div>
            {emailStatus === 'sent' ? (
              <div style={{ padding: '16px', borderRadius: 12, textAlign: 'center', background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.18)' }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#15803d' }}>Revisa tu correo</p>
                <p style={{ fontSize: 11, color: '#666', marginTop: 4, lineHeight: 1.5 }}>Mandamos un link a <strong>{email}</strong>. Ábrelo desde este dispositivo.</p>
                <button onClick={() => setEmailStatus('idle')} style={{ fontSize: 11, color: C.purple, fontWeight: 600, marginTop: 10, background: 'none', border: 'none', cursor: 'pointer' }}>Usar otro correo</button>
              </div>
            ) : (
              <>
                <input type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmail()} placeholder="tu@correo.com"
                  style={{ width: '100%', fontSize: 13, borderRadius: 12, padding: '10px 14px', marginBottom: 8, outline: 'none', background: '#f6f6f8', border: '1px solid rgba(0,0,0,0.1)', color: '#111', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.4)'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
                {emailError && <p style={{ fontSize: 11, color: '#e53935', marginBottom: 6 }}>{emailError}</p>}
                <button onClick={handleEmail} disabled={emailStatus === 'sending' || !email.trim()}
                  style={{ width: '100%', padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', background: emailStatus === 'sending' || !email.trim() ? '#c4b5fd' : C.purple, border: 'none', cursor: emailStatus === 'sending' || !email.trim() ? 'not-allowed' : 'pointer' }}>
                  {emailStatus === 'sending' ? 'Enviando…' : 'Enviar link de acceso'}
                </button>
              </>
            )}
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#ccc', marginTop: 20 }}>Tu progreso se guarda automáticamente</p>
        </div>
      </div>
      <footer style={{ textAlign: 'center', paddingBottom: 32 }}>
        <p style={{ fontSize: 9, letterSpacing: '0.2em', fontWeight: 700, color: '#ddd', textTransform: 'uppercase' }}>Creado por</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#bbb', marginTop: 2 }}>Shift</p>
      </footer>
    </div>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  const COLORS = [C.purple, C.lime, C.teal, C.red, C.gold, '#f472b6', '#60a5fa', '#fb923c']
  const particles = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i, x: Math.random() * 100, delay: Math.random() * 1.6,
      dur: 2.2 + Math.random() * 2, color: COLORS[i % COLORS.length],
      size: 5 + Math.random() * 9, round: Math.random() > 0.5,
    })), []
  )
  return (
    <>
      <style>{`@keyframes cfDrop{0%{opacity:1;transform:translateY(-10px) rotate(0deg)}100%{opacity:0;transform:translateY(110vh) rotate(540deg)}}`}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 89, overflow: 'hidden' }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.x}%`, top: 0,
            width: p.size, height: p.round ? p.size : p.size * 0.55,
            background: p.color, borderRadius: p.round ? '50%' : '2px',
            animation: `cfDrop ${p.dur}s ${p.delay}s ease-in forwards`,
          }} />
        ))}
      </div>
    </>
  )
}

// ─── Milestone celebration ────────────────────────────────────────────────────
function MilestoneCelebration({ milestone, onClose }) {
  const is100 = milestone === 100
  return (
    <>
      <Confetti />
      <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
        <div className="surface" style={{ padding: 32, textAlign: 'center', maxWidth: 300, width: '100%' }} onClick={e => e.stopPropagation()}>
          <div style={{ width: 60, height: 60, margin: '0 auto 16px', borderRadius: '50%', background: is100 ? `linear-gradient(135deg,${C.gold},#f59e0b)` : `linear-gradient(135deg,${C.purple},#6d28d9)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {is100 ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            )}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111', marginBottom: 8, lineHeight: 1.1 }}>
            {is100 ? '¡Álbum completo!' : '¡Ya vas a la mitad!'}
          </h2>
          <p style={{ fontSize: 13, color: '#777', lineHeight: 1.6, marginBottom: 24 }}>
            {is100 ? 'Conseguiste todas las estampas del álbum Panini FIFA Mundial 2026. Eso no lo logra cualquiera.' : 'Llevas el 50% del álbum. Ya falta menos, sigue así.'}
          </p>
          <button onClick={onClose} style={{ width: '100%', padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 13, color: '#fff', background: is100 ? C.gold : C.purple, border: 'none', cursor: 'pointer' }}>
            {is100 ? '¡Gracias!' : 'Seguir llenando'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Rare sticker toast ───────────────────────────────────────────────────────
function RareToast({ sticker, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t) }, [onClose])
  return (
    <>
      <style>{`@keyframes toastUp{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 80, width: 'calc(100% - 32px)', maxWidth: 360, animation: 'toastUp 0.3s ease-out' }}>
        <div className="surface" style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, outline: `2px solid ${C.gold}`, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0, background: C.gold, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <span style={{ fontSize: 7, fontWeight: 700, opacity: 0.75, letterSpacing: '0.06em' }}>{sticker.id.split('-')[0]}</span>
            <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{sticker.num}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Estampa difícil de conseguir</p>
            <p style={{ fontSize: 11, color: '#b45309', fontWeight: 600, marginTop: 2 }}>{sticker.label}</p>
            {sticker.rareReason && <p style={{ fontSize: 11, color: '#aaa', marginTop: 2, lineHeight: 1.4 }}>{sticker.rareReason}</p>}
          </div>
          <button onClick={onClose} style={{ fontSize: 20, lineHeight: 1, color: '#ccc', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', marginTop: -2 }}>×</button>
        </div>
      </div>
    </>
  )
}

// ─── Panel: Exportar ──────────────────────────────────────────────────────────
function ExportarContent({ allStickers, owned }) {
  const [copied, setCopied] = useState('')
  const missing = allStickers.filter(s => !owned.has(s.id))
  const pct = Math.round((allStickers.filter(s => owned.has(s.id)).length / allStickers.length) * 100)

  function buildText(format) {
    const header = `Me faltan ${missing.length} estampas del álbum Panini FIFA Mundial 2026 (${pct}% completado)\n\n`
    if (format === 'ranges') {
      const byTeam = {}
      missing.forEach(s => { if (!byTeam[s.section]) byTeam[s.section] = []; byTeam[s.section].push(s.num) })
      const order = ['FWC', 'CC', ...TEAM_LIST.map(t => t.code)]
      const lines = order.filter(c => byTeam[c]).map(c => {
        const nums = [...new Set(byTeam[c])].sort((a, b) => a - b)
        const ranges = []; let st = nums[0], en = nums[0]
        for (let i = 1; i < nums.length; i++) { if (nums[i] === en + 1) { en = nums[i] } else { ranges.push(st === en ? `${st}` : `${st}-${en}`); st = en = nums[i] } }
        ranges.push(st === en ? `${st}` : `${st}-${en}`)
        return `${c}: ${ranges.join(', ')}`
      })
      return header + lines.join('\n')
    }
    if (format === 'bygroup') {
      const lines = ['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => {
        const teams = TEAM_LIST.filter(t => t.group === g)
        const tLines = teams.map(t => {
          const tm = missing.filter(s => s.section === t.code)
          if (!tm.length) return `  ${t.code}: completo`
          const nums = tm.map(s => s.num).sort((a, b) => a - b)
          const ranges = []; let st = nums[0], en = nums[0]
          for (let i = 1; i < nums.length; i++) { if (nums[i] === en + 1) { en = nums[i] } else { ranges.push(st === en ? `${st}` : `${st}-${en}`); st = en = nums[i] } }
          ranges.push(st === en ? `${st}` : `${st}-${en}`)
          return `  ${t.code}: ${ranges.join(', ')}`
        }).join('\n')
        return `Grupo ${g}:\n${tLines}`
      }).join('\n\n')
      return header + lines
    }
    if (format === 'rare') {
      const miss = allStickers.filter(s => s.isRare && !owned.has(s.id))
      if (!miss.length) return 'Ya tengo todas las estampas especiales del álbum 2026.'
      return `Me faltan ${miss.length} estampas especiales:\n\n` + miss.map(s => `${s.id} — ${s.label}`).join('\n') + '\n\n¿Tienes alguna para cambio?'
    }
  }

  async function copy(format) { await navigator.clipboard.writeText(buildText(format)); setCopied(format); setTimeout(() => setCopied(''), 2000) }
  function whatsapp(format) { window.open(`https://wa.me/?text=${encodeURIComponent(buildText(format))}`, '_blank') }

  const formats = [
    { id: 'ranges',  title: 'Por código y rango', desc: 'MEX: 3-7, 12 · ARG: 5, 18' },
    { id: 'bygroup', title: 'Por grupo A–L',       desc: 'Organizado por grupo del torneo' },
    { id: 'rare',    title: 'Solo las especiales',  desc: 'Lista para buscar cambio' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { val: missing.length,                                      label: 'Faltantes',   clr: '#111'    },
          { val: allStickers.filter(s => owned.has(s.id)).length,     label: 'Conseguidas', clr: C.emerald },
          { val: `${pct}%`,                                           label: 'Completado',  clr: C.purple  },
        ].map(({ val, label, clr }) => (
          <div key={label} style={{ background: '#f6f6f8', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: clr, lineHeight: 1 }}>{val}</p>
            <p style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>{label}</p>
          </div>
        ))}
      </div>
      {formats.map(f => (
        <div key={f.id} style={{ background: '#fafafa', borderRadius: 12, padding: 16, border: '1px solid rgba(0,0,0,0.07)' }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{f.title}</p>
          <p style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>{f.desc}</p>
          <div style={{ background: '#f0f0f3', borderRadius: 8, padding: '10px 12px', marginBottom: 10, maxHeight: 100, overflowY: 'auto' }}>
            <pre style={{ fontSize: 10, whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#666', lineHeight: 1.6, margin: 0 }}>{buildText(f.id)}</pre>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => copy(f.id)} style={{ flex: 1, padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: copied === f.id ? C.emerald : 'rgba(0,0,0,0.07)', color: copied === f.id ? '#fff' : '#555', border: 'none', cursor: 'pointer' }}>
              {copied === f.id ? 'Copiado' : 'Copiar'}
            </button>
            <button onClick={() => whatsapp(f.id)} style={{ flex: 1, padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer' }}>
              WhatsApp
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Panel: Compartir ─────────────────────────────────────────────────────────
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch {}
  // Fallback para iOS / navegadores sin permiso de clipboard
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
  document.body.appendChild(el)
  el.focus(); el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

function CompartirContent({ user, albumOwnerId }) {
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [copiedApp,     setCopiedApp]     = useState(false)
  const [loadingToken,  setLoadingToken]  = useState(false)
  const [tokenError,    setTokenError]    = useState('')
  const cachedToken = useRef(null)
  const effectiveOwnerId = albumOwnerId || user.id

  async function getLink() {
    if (cachedToken.current) return `${window.location.origin}?join=${cachedToken.current}`
    setLoadingToken(true)
    setTokenError('')
    try {
      const token = await getOrCreateShareToken(effectiveOwnerId)
      cachedToken.current = token
      return `${window.location.origin}?join=${token}`
    } catch(e) {
      console.error(e)
      setTokenError('No se pudo generar el link. Intenta de nuevo.')
      return null
    } finally {
      setLoadingToken(false)
    }
  }

  async function handleCopyAccount() {
    const link = await getLink()
    if (!link) return
    await copyToClipboard(link)
    setCopiedAccount(true); setTimeout(() => setCopiedAccount(false), 2500)
  }

  async function handleWhatsAppAccount() {
    const link = await getLink()
    if (!link) return
    window.open(`https://wa.me/?text=${encodeURIComponent(`¡Únete a mi álbum del Mundial 2026! Entra aquí: ${link}`)}`, '_blank')
  }

  async function handleCopyApp() {
    await copyToClipboard(window.location.origin)
    setCopiedApp(true); setTimeout(() => setCopiedApp(false), 2500)
  }

  function handleWhatsAppApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Lleva el control de tus estampas del Mundial 2026: ${window.location.origin}`)}`, '_blank')
  }

  const WaIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Compartir álbum */}
      <div style={{ background: '#fafafa', borderRadius: 12, padding: 16, border: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>👥</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13, color: '#111', margin: 0 }}>Compartir álbum</p>
            <p style={{ fontSize: 11, color: '#888', marginTop: 2, lineHeight: 1.5 }}>Para llenar el mismo álbum</p>
          </div>
        </div>
        {tokenError && (
          <p style={{ fontSize: 11, color: '#e53935', marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(229,57,53,0.06)' }}>{tokenError}</p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleWhatsAppAccount} disabled={loadingToken}
            style={{ flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#fff', background: loadingToken ? '#aaa' : '#25D366', border: 'none', cursor: loadingToken ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <WaIcon />{loadingToken ? 'Generando…' : 'WhatsApp'}
          </button>
          <button onClick={handleCopyAccount} disabled={loadingToken}
            style={{ flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: copiedAccount ? '#fff' : '#444', background: copiedAccount ? C.emerald : 'rgba(0,0,0,0.07)', border: 'none', cursor: loadingToken ? 'not-allowed' : 'pointer' }}>
            {copiedAccount ? '¡Copiado!' : loadingToken ? '…' : 'Copiar link'}
          </button>
        </div>
      </div>

      {/* Recomendar app */}
      <div style={{ background: '#fafafa', borderRadius: 12, padding: 16, border: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(22,163,74,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>📲</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13, color: '#111', margin: 0 }}>Recomendar app</p>
            <p style={{ fontSize: 11, color: '#888', marginTop: 2, lineHeight: 1.5 }}>Para que alguien lleve su propio álbum por separado</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleWhatsAppApp}
            style={{ flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#fff', background: '#25D366', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <WaIcon />WhatsApp
          </button>
          <button onClick={handleCopyApp}
            style={{ flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: copiedApp ? '#fff' : '#444', background: copiedApp ? C.emerald : 'rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer' }}>
            {copiedApp ? '¡Copiado!' : 'Copiar link'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Panel: Shift ─────────────────────────────────────────────────────────────
function ShiftContent() {
  const services = ['IA & Automatización', 'Datos & Analytics', 'Desarrollo de Software', 'Ciberseguridad', 'Machine Learning']
  const whoNeeds = [
    'Negocios que quieren automatizar procesos repetitivos con IA',
    'Empresas con datos valiosos que todavía no saben cómo aprovechar',
    'Equipos que necesitan software a medida sin deuda técnica',
    'Founders que quieren lanzar un producto rápido y bien construido',
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <p style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', color: '#111', lineHeight: 1 }}>Shift.</p>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#bbb', marginTop: 4, textTransform: 'uppercase' }}>Tecnología · CDMX</p>
      </div>

      <p style={{ fontSize: 14, color: '#444', lineHeight: 1.75, margin: 0 }}>
        Somos un studio de tecnología especializado en IA, datos y software a medida. Ayudamos a negocios a automatizar lo que los frena, entender sus datos y construir las herramientas que realmente necesitan.
      </p>

      <div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#bbb', textTransform: 'uppercase', marginBottom: 10 }}>¿Quién nos busca?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {whoNeeds.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.purple, marginTop: 5, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, margin: 0 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#bbb', textTransform: 'uppercase', marginBottom: 8 }}>Servicios</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {services.map(s => (
            <span key={s} style={{ fontSize: 11, padding: '5px 11px', borderRadius: 6, background: 'rgba(124,58,237,0.07)', color: C.purple, fontWeight: 600 }}>{s}</span>
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#bbb', textTransform: 'uppercase', marginBottom: 10 }}>Equipo</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ name: 'Sofia Husny', role: 'Co-fundadora' }, { name: 'Gabriela Shaooli', role: 'Co-fundadora' }].map(({ name, role }) => (
            <div key={name} style={{ flex: 1, background: '#f6f6f8', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0 }}>{name}</p>
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>{role}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <a href="https://wa.me/525510807509?text=Hola%20Shift%2C%20me%20interesa%20agendar%20una%20consulta" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button style={{ width: '100%', padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 14, color: '#fff', background: C.purple, border: 'none', cursor: 'pointer' }}>
            Agendar consulta gratuita
          </button>
        </a>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 8 }}>Sin costo · Sin compromiso</p>
      </div>
    </div>
  )
}

// ─── Panel: Faltan ────────────────────────────────────────────────────────────
function FaltanContent({ allStickers, owned, toggle }) {
  const [search, setSearch] = useState('')

  const missing = useMemo(() => allStickers.filter(s => !owned.has(s.id)), [allStickers, owned])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return missing
    return missing.filter(s =>
      s.id.toLowerCase().includes(q) ||
      s.section.toLowerCase().includes(q) ||
      (s.label || '').toLowerCase().includes(q)
    )
  }, [missing, search])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { val: missing.length, label: 'Faltan',    clr: '#111'    },
          { val: allStickers.filter(s => owned.has(s.id)).length, label: 'Tengo', clr: C.emerald },
        ].map(({ val, label, clr }) => (
          <div key={label} style={{ flex: 1, background: '#f6f6f8', borderRadius: 12, padding: '10px 14px' }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: clr, lineHeight: 1 }}>{val}</p>
            <p style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por equipo o número…"
          style={{ width: '100%', fontSize: 13, borderRadius: 12, padding: '10px 14px 10px 34px', outline: 'none', background: '#f6f6f8', border: '1px solid rgba(0,0,0,0.1)', color: '#111', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.4)'}
          onBlur={e  => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
        />
      </div>

      {search && (
        <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: 13, color: '#ccc' }}>{search ? 'Sin resultados' : '¡Álbum completo!'}</p>
          </div>
        ) : (
          filtered.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: '#fafafa', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: s.isRare ? '#fef3c7' : 'rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.05em', color: s.isRare ? '#b45309' : '#bbb' }}>{s.section}</span>
                <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, color: s.isRare ? '#b45309' : '#555' }}>{s.num}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label || s.id}</p>
                {s.isRare && <p style={{ fontSize: 10, color: '#b45309', fontWeight: 600, marginTop: 1 }}>Especial</p>}
              </div>
              <button onClick={() => toggle(s.id)}
                style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '6px 11px', borderRadius: 8, background: 'rgba(22,163,74,0.1)', color: '#15803d', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(22,163,74,0.18)'}
                onMouseOut={e  => e.currentTarget.style.background = 'rgba(22,163,74,0.1)'}>
                Ya la tengo
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── PWA install guide ────────────────────────────────────────────────────────
function PwaGuide({ onClose }) {
  const [os, setOs] = useState(() => /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 'android')

  function dismiss(remember) {
    if (remember) localStorage.setItem('pwa_guide_seen', '1')
    onClose()
  }

  const IosShareIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="11" rx="2"/>
      <polyline points="9 6 12 3 15 6"/>
      <line x1="12" y1="3" x2="12" y2="14"/>
    </svg>
  )
  const AddHomeIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
  const SafariIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76z"/>
    </svg>
  )
  const DotsIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19" r="1.9"/>
    </svg>
  )
  const CheckIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )

  const iosSteps = [
    { color: '#0a84ff', bg: 'rgba(10,132,255,0.1)',   icon: <SafariIcon />,   title: 'Abre esta página en Safari',          desc: 'No funciona en Chrome ni otros navegadores de iPhone' },
    { color: C.purple,  bg: 'rgba(124,58,237,0.1)',   icon: <IosShareIcon />, title: 'Toca el botón de compartir',           desc: 'El ícono ↑ en la barra inferior de Safari' },
    { color: C.teal,    bg: 'rgba(77,182,172,0.12)',  icon: <AddHomeIcon />,  title: 'Agregar a pantalla de inicio',         desc: 'Desliza hacia abajo en el menú y toca esa opción' },
    { color: C.emerald, bg: 'rgba(22,163,74,0.1)',    icon: <CheckIcon />,    title: '¡Lista!',                              desc: 'La app aparece en tu inicio como cualquier otra app' },
  ]
  const androidSteps = [
    { color: '#4285F4', bg: 'rgba(66,133,244,0.1)',   icon: <DotsIcon />,     title: 'Toca los tres puntos ⋮',               desc: 'Arriba a la derecha en Chrome' },
    { color: C.teal,    bg: 'rgba(77,182,172,0.12)',  icon: <AddHomeIcon />,  title: 'Agregar a pantalla principal',         desc: 'Busca "Instalar aplicación" o "Agregar a pantalla principal"' },
    { color: C.emerald, bg: 'rgba(22,163,74,0.1)',    icon: <CheckIcon />,    title: '¡Lista!',                              desc: 'La app aparece en tu inicio como cualquier otra app' },
  ]
  const steps = os === 'ios' ? iosSteps : androidSteps

  return (
    <>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}
        onClick={() => dismiss(false)}>
        <div style={{ width: '100%', maxWidth: 480, maxHeight: '94vh', overflowY: 'auto', background: '#fff', borderRadius: '22px 22px 0 0', animation: 'slideUp 0.32s cubic-bezier(0.32,0.72,0,1)' }}
          onClick={e => e.stopPropagation()}>

          {/* Color stripe */}
          <div style={{ height: 4, background: C.strip, borderRadius: '22px 22px 0 0' }} />

          {/* Header */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src="/icon.png" alt="" style={{ width: 46, height: 46, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.14)' }} />
                <div>
                  <p style={{ fontWeight: 800, fontSize: 17, color: '#111', lineHeight: 1, margin: 0 }}>Agrega la app</p>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Sin internet, directo desde tu inicio</p>
                </div>
              </div>
              <button onClick={() => dismiss(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer', fontSize: 18, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
            </div>

            {/* OS switcher */}
            <div style={{ display: 'flex', background: '#f0f0f3', borderRadius: 10, padding: 3, gap: 2 }}>
              {[{ id: 'ios', label: '📱 iPhone' }, { id: 'android', label: '🤖 Android' }].map(({ id, label }) => (
                <button key={id} onClick={() => setOs(id)}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: os === id ? '#fff' : 'transparent', color: os === id ? '#111' : '#999',
                    boxShadow: os === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div style={{ padding: '20px 20px 8px' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: step.bg, color: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${step.color}30`, flexShrink: 0 }}>
                    {step.icon}
                  </div>
                  {i < steps.length - 1 && <div style={{ width: 2, height: 26, background: 'rgba(0,0,0,0.07)', borderRadius: 1, margin: '4px 0' }} />}
                </div>
                <div style={{ paddingTop: 6, paddingBottom: i < steps.length - 1 ? 20 : 0 }}>
                  <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, color: step.color, background: step.bg, padding: '2px 7px', borderRadius: 4, marginBottom: 5, letterSpacing: '0.04em' }}>PASO {i + 1}</span>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0, lineHeight: 1.3 }}>{step.title}</p>
                  <p style={{ fontSize: 12, color: '#777', marginTop: 4, lineHeight: 1.55 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ padding: '12px 20px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => dismiss(true)} style={{ width: '100%', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 14, color: '#fff', background: C.purple, border: 'none', cursor: 'pointer' }}>
              Entendido
            </button>
            <button onClick={() => dismiss(false)} style={{ width: '100%', padding: 10, fontSize: 12, fontWeight: 500, color: '#bbb', background: 'none', border: 'none', cursor: 'pointer' }}>
              Recordármelo después
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Side panel ───────────────────────────────────────────────────────────────
function SidePanel({ page, onClose, user, albumOwnerId, allStickers, owned, toggle }) {
  const titles = { faltan: 'Me faltan', exportar: 'Exportar', compartir: 'Compartir', shift: 'Shift' }
  return (
    <>
      <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={onClose}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: 440, background: '#fff', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.26s ease-out', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: '#111', margin: 0 }}>{titles[page]}</h2>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer', fontSize: 18, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
          <div style={{ flex: 1, padding: 20 }}>
            {page === 'faltan'    && <FaltanContent allStickers={allStickers} owned={owned} toggle={toggle} />}
            {page === 'exportar'  && <ExportarContent allStickers={allStickers} owned={owned} />}
            {page === 'compartir' && <CompartirContent user={user} albumOwnerId={albumOwnerId} />}
            {page === 'shift'     && <ShiftContent />}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Hamburger menu ───────────────────────────────────────────────────────────
function HamburgerMenu({ onOpen, onInstall }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const items = [
    { id: 'faltan',    label: 'Me faltan',      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    { id: 'exportar',  label: 'Exportar',        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
    { id: 'compartir', label: 'Compartir',       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
    { id: 'instalar',  label: 'Agregar como app', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><polyline points="9 6 12 3 15 6"/><line x1="12" y1="3" x2="12" y2="14"/></svg> },
    { id: 'shift',     label: 'Shift',            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>, gold: true },
  ]
  function handleItem(id) {
    setOpen(false)
    if (id === 'instalar') onInstall()
    else onOpen(id)
  }
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: 36, height: 36, borderRadius: 10, background: open ? 'rgba(0,0,0,0.11)' : 'rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 14, height: 1.5, background: '#555', borderRadius: 1 }} />)}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.13)', border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', minWidth: 180, zIndex: 40 }}>
          {items.map((item, i) => (
            <button key={item.id} onClick={() => handleItem(item.id)}
              style={{ width: '100%', textAlign: 'left', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, background: item.gold ? 'rgba(217,119,6,0.06)' : 'transparent', border: 'none', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none', fontSize: 13, fontWeight: 600, color: item.gold ? C.gold : '#333', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.background = item.gold ? 'rgba(217,119,6,0.12)' : '#f8f8f8'}
              onMouseOut={e  => e.currentTarget.style.background = item.gold ? 'rgba(217,119,6,0.06)' : 'transparent'}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Coca-Cola modal ──────────────────────────────────────────────────────────
function CocaModal({ onChoice }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.5)' }}>
      <div className="surface" style={{ width: '100%', maxWidth: 340, padding: 24 }}>
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, color: '#999', marginBottom: 4 }}>Sección especial</p>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: '#111', marginBottom: 8, lineHeight: 1.3 }}>¿Tu álbum incluye la sección Coca-Cola?</h2>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>Esta sección especial (CC-1 a CC-14) viene en versiones regionales del álbum con estampas exclusivas.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => onChoice(true)} style={{ padding: '12px', borderRadius: 12, fontWeight: 600, fontSize: 13, color: '#fff', background: C.purple, border: 'none', cursor: 'pointer' }}>Sí, mi álbum la incluye</button>
          <button onClick={() => onChoice(false)} style={{ padding: '12px', borderRadius: 12, fontWeight: 600, fontSize: 13, color: '#666', background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer' }}>No, mi álbum no la tiene</button>
        </div>
      </div>
    </div>
  )
}

// ─── Sticker tile ─────────────────────────────────────────────────────────────
function StickerTile({ sticker, owned, onMouseDown, onMouseEnter }) {
  const isOwned = owned.has(sticker.id)
  let bg, text, outline
  if (isOwned && sticker.isRare)   { bg = C.gold;                text = '#fff';    outline = 'none' }
  else if (isOwned)                { bg = C.emerald;             text = '#fff';    outline = 'none' }
  else if (sticker.isRare)         { bg = '#fef3c7';             text = '#b45309'; outline = '1px solid #fde68a' }
  else                             { bg = 'rgba(0,0,0,0.06)';   text = '#aaa';    outline = 'none' }
  return (
    <div onMouseDown={() => onMouseDown(sticker.id)} onMouseEnter={() => onMouseEnter(sticker.id)}
      title={`${sticker.id} — ${sticker.label}${sticker.isRare ? ' · ESPECIAL' : ''}`}
      style={{ background: bg, color: text, cursor: 'pointer', borderRadius: 6, outline, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', aspectRatio: '1', transition: 'transform 0.05s' }}
      onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.zIndex = 10 }}
      onMouseOut={e  => { e.currentTarget.style.transform = ''; e.currentTarget.style.zIndex = '' }}>
      <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.65, lineHeight: 1 }}>{sticker.id.split('-')[0]}</span>
      <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1, marginTop: 1 }}>{sticker.num}</span>
    </div>
  )
}

function StickerGrid({ stickers, owned, onMouseDown, onMouseEnter }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))', gap: 4 }}>
      {stickers.map(s => <StickerTile key={s.id} sticker={s} owned={owned} onMouseDown={onMouseDown} onMouseEnter={onMouseEnter} />)}
    </div>
  )
}

// ─── Desktop sidebar nav ──────────────────────────────────────────────────────
function SectionNav({ allStickers, owned, active, onSelect, hasCoca }) {
  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L']
  function NavItem({ id, label, count, total }) {
    const isActive = active === id
    const full = total > 0 && count === total
    return (
      <button onClick={() => onSelect(id)}
        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, background: isActive ? 'rgba(124,58,237,0.09)' : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.1s' }}>
        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', width: 36, flexShrink: 0, color: isActive ? C.purple : '#888' }}>{id === 'all' ? 'ALL' : id}</span>
        <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? '#111' : '#555', fontWeight: isActive ? 600 : 400 }}>{label}</span>
        {total > 0 && <span style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums', flexShrink: 0, color: full ? C.emerald : '#bbb', fontWeight: full ? 700 : 400 }}>{count}/{total}</span>}
      </button>
    )
  }
  const allCount = allStickers.filter(s => owned.has(s.id)).length
  const fwcCount = allStickers.filter(s => s.section === 'FWC' && owned.has(s.id)).length
  const fwcTotal = allStickers.filter(s => s.section === 'FWC').length
  const ccCount  = allStickers.filter(s => s.section === 'CC'  && owned.has(s.id)).length
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: 'calc(100vh - 8rem)' }}>
      <NavItem id="all" label="Todo el álbum" count={allCount} total={allStickers.length} />
      <NavItem id="FWC" label="Especiales FWC" count={fwcCount} total={fwcTotal} />
      {hasCoca && <NavItem id="CC" label="Coca-Cola" count={ccCount} total={14} />}
      <div style={{ margin: '6px 0', borderTop: '1px solid rgba(0,0,0,0.07)' }} />
      {groups.map(g => {
        const teams = TEAM_LIST.filter(t => t.group === g)
        return (
          <div key={g}>
            <p style={{ padding: '4px 12px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#bbb' }}>Grupo {g}</p>
            {teams.map(team => {
              const ts = allStickers.filter(s => s.section === team.code)
              const h  = ts.filter(s => owned.has(s.id)).length
              return <NavItem key={team.code} id={team.code} label={team.name} count={h} total={ts.length} />
            })}
          </div>
        )
      })}
    </nav>
  )
}

// ─── Album tab ────────────────────────────────────────────────────────────────
function AlbumTab({ allStickers, owned, toggle, addMany, removeMany, hasCoca, onToggleCoca, onRareFound }) {
  const [activeSection, setActiveSection] = useState('all')
  const [bulkInput, setBulkInput] = useState('')
  const [bulkMode,  setBulkMode]  = useState('add')
  const [feedback,  setFeedback]  = useState('')
  const dragging   = useRef(false)
  const dragAction = useRef(null)

  const visibleStickers = useMemo(() =>
    activeSection === 'all' ? allStickers : allStickers.filter(s => s.section === activeSection),
    [activeSection, allStickers]
  )
  const have = visibleStickers.filter(s => owned.has(s.id)).length
  const total = visibleStickers.length
  const pct   = total ? Math.round((have / total) * 100) : 0
  const activeSec   = SECTIONS.find(s => s.id === activeSection)
  const isCC        = activeSection === 'CC'
  const accentColor = isCC ? C.red : C.purple

  function flash(msg) { setFeedback(msg); setTimeout(() => setFeedback(''), 2500) }

  function applyBulk() {
    if (!bulkInput.trim()) return
    const ids = parseRangeInput(bulkInput)
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

  function handleMouseDown(id) {
    const wasOwned = owned.has(id)
    dragging.current = true
    dragAction.current = wasOwned ? 'remove' : 'add'
    toggle(id)
    if (!wasOwned) {
      const s = allStickers.find(s => s.id === id)
      if (s?.isRare) onRareFound(s)
    }
  }
  function handleMouseEnter(id) {
    if (!dragging.current) return
    if (dragAction.current === 'add' && !owned.has(id)) {
      toggle(id)
      const s = allStickers.find(s => s.id === id)
      if (s?.isRare) onRareFound(s)
    }
    if (dragAction.current === 'remove' && owned.has(id)) toggle(id)
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
      <aside className="hidden lg:block lg:w-52 xl:w-60 flex-shrink-0">
        <div className="surface p-2 sticky top-24" style={{ background: '#fafafa' }}>
          <SectionNav allStickers={allStickers} owned={owned} active={activeSection} onSelect={setActiveSection} hasCoca={hasCoca} />
        </div>
      </aside>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Mobile pills */}
        <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2">
          {[{ id: 'all', label: 'Todo' }, { id: 'FWC', label: 'FWC' }].map(({ id, label }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: activeSection === id ? C.purple : 'rgba(0,0,0,0.07)', color: activeSection === id ? '#fff' : '#555', border: 'none', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
          {hasCoca && (
            <button onClick={() => setActiveSection('CC')}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: activeSection === 'CC' ? C.red : 'rgba(229,57,53,0.1)', color: activeSection === 'CC' ? '#fff' : C.red, border: 'none', cursor: 'pointer' }}>CC</button>
          )}
          <div className="flex-shrink-0 w-px mx-0.5" style={{ background: 'rgba(0,0,0,0.1)' }} />
          {TEAM_LIST.map(team => {
            const h = allStickers.filter(s => s.section === team.code && owned.has(s.id)).length
            const complete = h === 20
            return (
              <button key={team.code} onClick={() => setActiveSection(team.code)}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono"
                style={{ background: activeSection === team.code ? C.purple : complete ? 'rgba(22,163,74,0.12)' : 'rgba(0,0,0,0.07)', color: activeSection === team.code ? '#fff' : complete ? C.emerald : '#555', border: 'none', cursor: 'pointer' }}>
                {team.code}
              </button>
            )
          })}
        </div>

        {/* Section header */}
        <div className="surface p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-base" style={{ color: '#111' }}>{activeSec?.name || activeSection}</h2>
              <p className="text-sm mt-0.5" style={{ color: '#777' }}>{have} de {total}&ensp;·&ensp;<span style={{ color: accentColor, fontWeight: 700 }}>{pct}%</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => markSection(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(22,163,74,0.1)', color: '#15803d', border: 'none', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(22,163,74,0.18)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(22,163,74,0.1)'}>Marcar todas</button>
              <button onClick={() => markSection(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(0,0,0,0.06)', color: '#666', border: 'none', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}>Limpiar</button>
            </div>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accentColor }} />
          </div>
        </div>

        {/* Bulk input */}
        <div className="surface p-4">
          <p className="text-[10px] uppercase tracking-widest font-bold mb-2.5" style={{ color: '#aaa' }}>Entrada rápida</p>
          <div className="space-y-2">
            <input value={bulkInput} onChange={e => setBulkInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyBulk()}
              placeholder={hasCoca ? 'MEX 1-15,  ARG 3 5,  CC 1-14' : 'MEX 1-15,  ARG 3 5 10-18,  FWC 1-8'}
              className="w-full text-sm outline-none transition-colors rounded-xl px-4 py-2.5"
              style={{ background: '#f6f6f8', border: '1px solid rgba(0,0,0,0.1)', color: '#111' }}
              onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.45)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
            <div className="flex gap-2">
              <select value={bulkMode} onChange={e => setBulkMode(e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={{ background: '#f6f6f8', border: '1px solid rgba(0,0,0,0.1)', color: '#444' }}>
                <option value="add">Marcar</option>
                <option value="remove">Desmarcar</option>
              </select>
              <button onClick={applyBulk} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: C.purple, border: 'none', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = '#6d28d9'} onMouseOut={e => e.currentTarget.style.background = C.purple}>Aplicar</button>
            </div>
          </div>
          {feedback
            ? <p className="text-xs mt-2 font-semibold" style={{ color: C.purple }}>{feedback}</p>
            : <p className="text-xs mt-2" style={{ color: '#bbb' }}>Arrastra sobre el tablero para marcar varias de un jalón</p>}
        </div>

        {/* Coca-Cola toggle */}
        <button onClick={onToggleCoca} className="w-full text-left surface-sm px-4 py-3 flex items-center justify-between"
          style={{ border: 'none', cursor: 'pointer' }}
          onMouseOver={e => e.currentTarget.style.background = '#f8f8f8'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <div>
            <p className="text-xs font-semibold" style={{ color: '#333' }}>Sección Coca-Cola (CC-1 a CC-14)</p>
            <p className="text-xs mt-0.5" style={{ color: '#aaa' }}>{hasCoca ? 'Incluida — toca para desactivar' : 'No incluida — toca para activar'}</p>
          </div>
          <div className="w-10 h-5 rounded-full relative flex-shrink-0 ml-4" style={{ background: hasCoca ? C.red : 'rgba(0,0,0,0.15)' }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow" style={{ left: hasCoca ? '22px' : '2px', transition: 'left 0.2s' }} />
          </div>
        </button>

        {/* Sticker grid */}
        <div className="surface p-4 select-none" onMouseUp={stopDrag} onMouseLeave={stopDrag}>
          {isCC && (
            <div className="mb-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(229,57,53,0.07)', border: '1px solid rgba(229,57,53,0.2)' }}>
              <p className="text-xs font-medium" style={{ color: C.red }}>Estampas exclusivas Coca-Cola — disponibles solo en productos participantes</p>
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
                        <div className="h-1 rounded-full" style={{ width: `${pctS}%`, background: pctS === 100 ? C.emerald : sIsCC ? C.red : C.purple, transition: 'width 0.3s' }} />
                      </div>
                      <span className="text-xs tabular-nums" style={{ color: pctS === 100 ? C.emerald : '#bbb', fontWeight: pctS === 100 ? 700 : 400 }}>{h}/{stickers.length}</span>
                    </div>
                    <StickerGrid stickers={stickers} owned={owned} onMouseDown={handleMouseDown} onMouseEnter={handleMouseEnter} />
                  </div>
                )
              })}
            </div>
          ) : (
            <StickerGrid stickers={visibleStickers} owned={owned} onMouseDown={handleMouseDown} onMouseEnter={handleMouseEnter} />
          )}
          <div className="flex items-center gap-5 mt-4 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            {[{ bg: C.emerald, label: 'Tengo' }, { bg: 'rgba(0,0,0,0.08)', label: 'Falta' }, { bg: C.gold, label: 'Especial' }].map(({ bg, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: '#888' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: bg }} />{label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [authLoading,    setAuthLoading]    = useState(true)
  const [user,           setUser]           = useState(null)
  const [albumOwnerId,   setAlbumOwnerId]   = useState(null)
  const [owned,          setOwned]          = useState(loadOwned)
  const [hasCoca,        setHasCoca]        = useState(() => loadHasCoca() === 'true')
  const [showCocaModal,  setShowCocaModal]  = useState(() => loadHasCoca() === null)
  const [sidePanel,      setSidePanel]      = useState(null)
  const [rareToast,      setRareToast]      = useState(null)
  const [milestone,      setMilestone]      = useState(null)
  const [hasPendingJoin, setHasPendingJoin] = useState(() => !!localStorage.getItem('pending_join_token'))
  const [showPwaGuide,   setShowPwaGuide]   = useState(false)
  const initialSyncDone = useRef(false)
  const prevPctRef      = useRef(null)

  const allStickers = useMemo(() => hasCoca ? ALL_STICKERS_CC : ALL_STICKERS, [hasCoca])
  const totalAct    = allStickers.length
  const ownedAct    = allStickers.filter(s => owned.has(s.id)).length
  const pct         = totalAct ? Math.round((ownedAct / totalAct) * 100) : 0

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinToken = params.get('join')
    if (joinToken) {
      localStorage.setItem('pending_join_token', joinToken)
      setHasPendingJoin(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => { saveOwned(owned) }, [owned])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setAuthLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session) { initialSyncDone.current = false; setAlbumOwnerId(null) }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

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
        const merged = new Set([...owned, ...(data.owned_ids || [])])
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

  useEffect(() => {
    if (!user || !initialSyncDone.current || !albumOwnerId) return
    const t = setTimeout(() => saveProgress(albumOwnerId, [...owned], hasCoca).catch(console.error), 600)
    return () => clearTimeout(t)
  }, [owned, hasCoca, user, albumOwnerId])

  // Show PWA guide on first login if not already installed / not seen before
  useEffect(() => {
    if (!user) return
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (!isStandalone && !localStorage.getItem('pwa_guide_seen')) {
      const t = setTimeout(() => setShowPwaGuide(true), 900)
      return () => clearTimeout(t)
    }
  }, [user])

  // Milestone check: only triggers when crossing the threshold, not on load
  useEffect(() => {
    if (!user || !initialSyncDone.current) return
    const prev = prevPctRef.current
    prevPctRef.current = pct
    if (prev === null) return
    if (pct >= 100 && prev < 100 && !localStorage.getItem('ms_100')) {
      localStorage.setItem('ms_100', '1'); setMilestone(100)
    } else if (pct >= 50 && prev < 50 && !localStorage.getItem('ms_50')) {
      localStorage.setItem('ms_50', '1'); setMilestone(50)
    }
  }, [pct, user])

  function handleCocaChoice(val) { setHasCoca(val); saveHasCoca(val); setShowCocaModal(false) }
  function toggleCoca() { const n = !hasCoca; setHasCoca(n); saveHasCoca(n) }
  async function handleLogout() { await signOut(); initialSyncDone.current = false }

  const toggle   = useCallback(id => { setOwned(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }, [])
  const addMany  = useCallback(ids => { setOwned(prev => { const n = new Set(prev); ids.forEach(id => n.add(id)); return n }) }, [])
  const removeMany = useCallback(ids => { setOwned(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n }) }, [])
  const handleRareFound = useCallback(sticker => { setRareToast(sticker) }, [])

  if (authLoading) return <LoadingScreen />
  if (!user)       return <LoginScreen hasPendingJoin={hasPendingJoin} />

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f2f2f5' }}>
      {showCocaModal && <CocaModal onChoice={handleCocaChoice} />}
      {showPwaGuide  && <PwaGuide onClose={() => setShowPwaGuide(false)} />}
      {sidePanel && <SidePanel page={sidePanel} onClose={() => setSidePanel(null)} user={user} albumOwnerId={albumOwnerId} allStickers={allStickers} owned={owned} toggle={toggle} />}
      {rareToast && <RareToast sticker={rareToast} onClose={() => setRareToast(null)} />}
      {milestone && <MilestoneCelebration milestone={milestone} onClose={() => setMilestone(null)} />}

      <header className="sticky top-0 z-30" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{ height: 3, background: C.strip }} />
        <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#bbb' }}>Panini</p>
              <h1 className="font-black text-xl tracking-tight leading-none mt-0.5" style={{ color: '#111' }}>Mundial 2026</h1>
              {albumOwnerId && albumOwnerId !== user.id && (
                <p style={{ fontSize: 10, fontWeight: 600, color: C.purple, marginTop: 2 }}>Álbum compartido</p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <HamburgerMenu onOpen={setSidePanel} onInstall={() => setShowPwaGuide(true)} />
              <div style={{ textAlign: 'right' }}>
                <span className="font-black tabular-nums" style={{ fontSize: 30, color: C.purple }}>{pct}%</span>
                <p className="text-xs" style={{ color: '#aaa' }}>{ownedAct} / {totalAct}</p>
              </div>
            </div>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: C.strip }} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-8 py-5">
        <AlbumTab allStickers={allStickers} owned={owned} toggle={toggle} addMany={addMany} removeMany={removeMany} hasCoca={hasCoca} onToggleCoca={toggleCoca} onRareFound={handleRareFound} />
      </main>

      <footer className="max-w-6xl w-full mx-auto px-4 lg:px-8 pb-8 pt-6 mt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-xs" style={{ color: '#888' }}>{user.email}</p>
          <button onClick={handleLogout} className="text-xs font-semibold transition-colors" style={{ color: '#bbb', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.style.color = '#e53935'} onMouseOut={e => e.currentTarget.style.color = '#bbb'}>Cerrar sesión</button>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#ccc' }}>Creado por</p>
          <p className="text-sm font-bold tracking-tight" style={{ color: '#888' }}>Shift</p>
          <a href="tel:5510807509" className="block text-xs tabular-nums" style={{ color: '#bbb' }}
            onMouseOver={e => e.currentTarget.style.color = '#666'} onMouseOut={e => e.currentTarget.style.color = '#bbb'}>55 1080 7509</a>
        </div>
      </footer>
    </div>
  )
}
