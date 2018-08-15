var staticCacheName = 'mws-restaurant-stage-1';
// var contentImgsCache = 'wittr-content-imgs';
var allCaches = [
  staticCacheName,
  // contentImgsCache
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/data',
        '/js/main.js',
        '/css/styles.css',
        '/img',
        '/index.html',
        '/restaurant.html'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});



/**
* This gives you the "Cache only" behavior for things in the cache
* and the "Network only" behaviour for anything not cached (which 
* includes all non-GET requests, as they cannot be cached).
**/
self.addEventListener('fetch', function(event) {
  if (event.request.url.indexOf('https://maps.googleapis.com/maps') == 0) {
    console.log('inside google maps fetch')
    event.respondWith(
        // Handle Maps API requests in a generic fashion,
        // by returning a Promise that resolves to a Response.
        function(){
          console.log('inside google map respondWith')
          const returnedPromise = new Promise((resolve, reject) => {
            setTimeout(function(){
              resolve(function(){
                  const myResponse = new Response( "offline", { "status" : 200, "statusText": "inside response" });
                  return myResponse;
              });
            }, 100);
          });
          return returnedPromise
        }
    );
  }

  console.log('not inside google maps fetch');
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});