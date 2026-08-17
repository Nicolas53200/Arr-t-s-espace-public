// Service Worker — Actes360
// Stratégie : Cache-first pour assets statiques, Network-first pour API
// eslint-disable-next-line no-restricted-globals
const CACHE_NAME = "actes360-v1";
const CACHE_ASSETS = "actes360-assets-v1";

// Ressources à pré-cacher au premier install
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// ─── Install ───

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Passer immédiatement au nouvel SW sans attendre
  self.skipWaiting();
});

// ─── Activate ───

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== CACHE_ASSETS)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Prendre le contrôle de tous les clients immédiatement
  self.clients.claim();
});

// ─── Fetch ───

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== "GET") return;

  // Ignorer les requêtes chrome-extension, etc.
  if (!url.protocol.startsWith("http")) return;

  // API : Network-first avec fallback cache
  if (url.pathname.startsWith("/api")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets statiques (JS, CSS, images, fonts) : Cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation (HTML) : Network-first pour les SPA routes
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request).catch(() => {
        return caches.match("/").then((resp) => resp || new Response("Hors ligne", { status: 503 }));
      })
    );
    return;
  }

  // Tout le reste : Network-first
  event.respondWith(networkFirst(request));
});

// ─── Stratégies ───

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_ASSETS);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503, statusText: "Hors ligne" });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "Hors ligne", offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|ico)(\?.*)?$/.test(pathname)
    || pathname.startsWith("/assets/");
}

// ─── Background Sync ───

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-arretes") {
    event.respondWith(syncPendingChanges());
  }
});

async function syncPendingChanges() {
  // Signaler aux clients que la synchro démarre
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: "SYNC_START" });
  });

  try {
    // La logique de sync est gérée côté client via IndexedDB
    // Le SW ne fait que signaler l'événement
    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_TRIGGER" });
    });
  } catch {
    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_ERROR" });
    });
  }
}

// ─── Messages du client ───

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
