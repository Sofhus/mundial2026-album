// Simple offline-first service worker for Mundial 2026 album
const CACHE = 'mundial2026-v2'
const CORE  = ['/', '/index.html', '/icon.png', '/manifest.webmanifest']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return
  // Network-first for HTML so users get fresh updates; cache-first for assets
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).then(res => {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(request, copy))
        return res
      }).catch(() => caches.match(request).then(r => r || caches.match('/index.html')))
    )
  } else {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(request, copy))
        }
        return res
      }))
    )
  }
})
