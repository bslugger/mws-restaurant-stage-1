let staticCacheName = 'mws-restaurant-stage-1';
let cacheWhitelist = [ staticCacheName ];

/**
* Install new cache
* from: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#Install_and_activate_populating_your_cache
**/
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then( cache => {
      return cache.addAll([
        '/',
        '/data',
        '/dist',
        '/css/styles.css',
        '/img',
        '/index.html',
        '/restaurant.html'
      ]);
    })
  );
});

/**
* Delete old caches
* from: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#Deleting_old_caches
**/
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then( keyList => {
      return Promise.all(
        keyList.map( key => {
          if ( !cacheWhitelist.includes(key) ) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

/**
* If the resources isn't in the cache, it is requested from the network.
* from: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#Recovering_failed_requests
**/
self.addEventListener('fetch', event => {
  // console.log(event.request.url);
  event.respondWith(
    caches.match(event.request).then( response => {
      return response || fetch(event.request);
    })
  );
});