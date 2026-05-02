const CACHE_NAME = 'wijnkelder-v2';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  // Activeer de nieuwe service worker meteen, zonder te wachten
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  // Verwijder oude caches en neem meteen controle over alle tabs
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Netwerk eerst: probeer altijd de nieuwste versie op te halen.
  // Val terug op cache alleen als het netwerk niet bereikbaar is.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Sla succesvolle responses op in de cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Geen netwerk: laad uit cache
        return caches.match(event.request);
      })
  );
});
