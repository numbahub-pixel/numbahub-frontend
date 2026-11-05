const CACHE_NAME = "numbahub-v1";
const ASSETS_TO_CACHE = [
  "/numbahub-user-dashboard/",
  "/numbahub-user-dashboard/index.html",
  "/numbahub-user-dashboard/assets/css/style.css",
  "/numbahub-user-dashboard/assets/js/main.js",
  "/numbahub-user-dashboard/assets/js/api.js",
  "/numbahub-user-dashboard/offline.html"
];

// Install: Cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network-First strategy with offline fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === "navigate") {
            return caches.match("/numbahub-user-dashboard/offline.html");
          }
        });
      })
  );
});