/**
 * TRADING JOURNAL - PWA SERVICE WORKER (v2.0 AUTO-UPDATE ENGINE)
 * Features: Network-First with Dynamic Cache Fallback, In-App Update Signaling,
 * Offline Resilience & Instant Stale-Cache Eviction
 */

const CACHE_NAME = "trading-journal-pwa-v2.0";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./logo.png"
];

// 1. Install Event: Cache Core Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up all old/outdated caches immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Message Listener: Support instant in-app update trigger
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 4. Fetch Event: Network-First Strategy
// Checks network for freshest code first, falls back to offline cache if no internet
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Let cloud APIs (Firebase, Groq, Google) bypass cache directly
  if (
    url.includes("firebase") ||
    url.includes("firestore") ||
    url.includes("googleapis.com") ||
    url.includes("groq.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Dynamically keep cache fresh with the latest response from server
        if (networkResponse && networkResponse.status === 200 && event.request.method === "GET") {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline fallback to cache if user has no internet
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
  );
});