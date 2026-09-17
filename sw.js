// Service worker for offline use of the evidence log tool.
// Everything the app needs (HTML, CSS, JS, the PDF library, icons) is inlined
// into index.html itself, so caching that one file is enough for the whole
// app to work with zero network access after the first successful load.

var CACHE_NAME = "evidence-log-v1";
var PRECACHE_URLS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request).then(function(response){
        if(response && response.status === 200 && response.type === "basic"){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){
        // Offline and not cached: fall back to the main page so the app still loads.
        return caches.match("./index.html");
      });
    })
  );
});
