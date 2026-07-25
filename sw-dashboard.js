var CACHE='infocell-os-v1';
var ASSETS=['dashboard-os.html','manifest-dashboard.json'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS)}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}))});
self.addEventListener('fetch',function(e){e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request).then(function(resp){return caches.open(CACHE).then(function(c){c.put(e.request,resp.clone());return resp})})}).catch(function(){return caches.match('dashboard-os.html')})})});