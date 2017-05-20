var cacheName = 'huedollar-v1';
var dataCacheName = 'data-huedollar-v1';

var filesToCache = [
  'index.html',
  '/src/app.js',
  '/libs/localforage.min.js',
  '/styles/styles.css'
];


var rateAPIUrlBase = 'https://api.fixer.io/latest';

self.addEventListener('install', function (e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(keyList.map(function (key) {
        if (cacheName !== key && dataCacheName !== key) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }))
    })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.url.startsWith(rateAPIUrlBase)) {
    e.respondWith(
      fetch(e.request)
        .then(function (response) {
          return caches.open(dataCacheName).then(function (cache) {
            cache.put(e.request.url, response.clone());
            console.log('[ServiceWorker] Fetched & Cached', e.request.url);
            return response;
          });
        })
    )
  } else {
    e.respondWith(
      caches.match(e.request).then(function (response) {
        console.log('[ServiceWorker] Cache or fetch', e.request.url);
        return response || fetch(e.request);
      })
    )
  }
})
