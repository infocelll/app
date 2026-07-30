const CACHE_NAME='infocelll-v4';
const STATIC_CACHE='infocelll-static-v4';
const DYNAMIC_CACHE='infocelll-dynamic-v4';
const OFFLINE_URL='/offline.html';

const PRECACHE_URLS=[
  '/',
  '/dashboard.html',
  '/offline.html',
  '/icon.svg',
  '/sw.js',
  '/logo-infocelll.jpg',
  '/manifest.json',
  '/pwa/manifest.json',
  '/pwa/icons/icon-72.png','/pwa/icons/icon-96.png','/pwa/icons/icon-128.png',
  '/pwa/icons/icon-144.png','/pwa/icons/icon-152.png','/pwa/icons/icon-192.png',
  '/pwa/icons/icon-384.png','/pwa/icons/icon-512.png',
  '/pwa/js/sync-manager.js','/pwa/js/offline-manager.js','/pwa/js/queue-ui.js'
];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache){
      return cache.addAll(PRECACHE_URLS);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.map(function(key){
          if(key!==CACHE_NAME&&key!==STATIC_CACHE&&key!==DYNAMIC_CACHE){
            return caches.delete(key);
          }
        })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch',function(e){
  var url=new URL(e.request.url);

  if(url.origin!==self.location.origin&&!url.href.includes('lucide')&&!url.href.includes('cdnjs')){
    return;
  }

  if(url.pathname==='/api/'||url.pathname.startsWith('/api/'))return;

  if(url.href.includes('chrome-extension'))return;

  if(e.request.method==='POST'||e.request.method==='PUT'||e.request.method==='DELETE'||e.request.method==='PATCH'){
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached){
      var fetchPromise=fetch(e.request).then(function(response){
        if(response&&response.ok){
          var clone=response.clone();
          caches.open(DYNAMIC_CACHE).then(function(cache){
            cache.put(e.request,clone);
          });
        }
        return response;
      }).catch(function(){
        return cached||caches.match(OFFLINE_URL).then(function(offline){
          return offline||new Response('Offline',{status:503});
        });
      });
      return cached||fetchPromise;
    })
  );
});

self.addEventListener('message',function(e){
  if(!e.data)return;
  if(e.data.type==='SKIP_WAITING'){self.skipWaiting()}
  if(e.data.type==='CLEAR_CACHE'){
    caches.keys().then(function(keys){keys.forEach(function(k){caches.delete(k)})});
    e.source.postMessage({type:'CACHE_CLEARED'});
  }
  if(e.data.type==='GET_CACHE_SIZE'){
    caches.open(DYNAMIC_CACHE).then(function(cache){
      cache.keys().then(function(keys){
        var total=0;
        Promise.all(keys.map(function(k){
          return cache.match(k).then(function(r){
            if(r)total+=r.headers.get('content-length')||0;
          });
        })).then(function(){
          e.source.postMessage({type:'CACHE_SIZE',size:total});
        });
      });
    });
  }
  if(e.data&&e.data.type==='SYNC_NOW'){
    self.registration.sync.register('sync-data');
    self.registration.sync.register('sync-photos');
  }
});

self.addEventListener('sync',function(e){
  if(e.tag==='sync-data'){e.waitUntil(syncData())}
  if(e.tag==='sync-photos'){e.waitUntil(syncPhotos())}
});

async function syncData(){
  try{
    var clients=await self.clients.matchAll();
    clients.forEach(function(client){client.postMessage({type:'SYNC_STARTED'})});
    await processSyncQueue();
    clients.forEach(function(client){client.postMessage({type:'SYNC_COMPLETED'})});
  }catch(err){
    console.error('[SW Sync] Error:',err);
  }
}

async function processSyncQueue(){
  var queue=[];
  try{
    var dbStr=await getLocalDB();
    if(dbStr)queue=JSON.parse(dbStr).syncQueue||[];
  }catch(e){}

  for(var item of queue){
    try{
      await processSyncItem(item);
      await removeSyncItem(item.id);
    }catch(err){
      console.error('[SW Sync] Item error:',item.id,err);
    }
  }
}

async function processSyncItem(item){
  return Promise.resolve();
}

async function removeSyncItem(id){
  return Promise.resolve();
}

async function syncPhotos(){
  try{
    var dbStr=await getLocalDB();
    if(!dbStr)return;
    var db=JSON.parse(dbStr);
    photosToSync(db);
  }catch(e){console.error('[SW] Photo sync error:',e)}
}

function photosToSync(db){}

async function getLocalDB(){
  try{
    var cache=await caches.open(DYNAMIC_CACHE);
    var req=await cache.match('/api/local-db');
    if(req)return await req.text();
  }catch(e){}
  return null;
}
