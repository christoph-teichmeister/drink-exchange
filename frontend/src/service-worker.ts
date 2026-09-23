/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker'

const sw = self as unknown as ServiceWorkerGlobalScope

const CACHE_NAME = `drink-exchange-${version}`

// Immutable build output (JS/CSS chunks) plus everything in `static/`
// (icons, favicon, manifest). SSR HTML is deliberately NOT cached: it embeds
// per-user data (session, assigned bars, prices).
const PRECACHE_URLS = [...build, ...files]
const precached = new Set(PRECACHE_URLS)

// Never intercept backend traffic, even if it is proxied under this origin.
const BYPASS_PREFIXES = ['/api/', '/ws/']

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => sw.skipWaiting())
  )
})

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => sw.clients.claim())
  )
})

sw.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== sw.location.origin) {
    // Cross-origin requests (the Django API and WebSocket) go to the network.
    return
  }
  if (BYPASS_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    return
  }
  if (!precached.has(url.pathname)) {
    // Navigations, `__data.json` and anything else: plain network.
    return
  }

  event.respondWith(
    caches
      .open(CACHE_NAME)
      .then(
        async (cache) =>
          (await cache.match(url.pathname)) ?? (await fetch(request))
      )
  )
})
