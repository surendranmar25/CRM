// ─── Suntronix CRM Service Worker ────────────────────────────────────────────────
// Cache name includes a version stamp that Vite injects at build time.
// On every install we open a NEW cache, cache all shell assets, then wait.
// We do NOT call self.skipWaiting() automatically — that only happens when
// the user explicitly clicks "Update now" in the app.

const CACHE_VERSION = "ekanta-v__BUILD_VERSION__";
const SHELL = ["/", "/index.html"];

// Install: cache shell assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL))
  );
  // Do NOT skipWaiting here — wait for the user's decision
});

// Activate: clean up OLD caches (only runs after skipWaiting is called)
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, fallback to network, cache new responses
self.addEventListener("fetch", (e) => {
  // Only handle same-origin GET requests
  if (e.request.method !== "GET") return;
  try {
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) return;
  } catch { return; }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchAndCache = fetch(e.request).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, clone));
        }
        return res;
      });
      return cached || fetchAndCache;
    })
  );
});

// Message handler: "SKIP_WAITING" — sent when user clicks "Update now"
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
