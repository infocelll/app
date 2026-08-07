var CACHE_NAME='infocelll-v17';
var STATIC_CACHE='infocelll-static-v17';
var DYNAMIC_CACHE='infocelll-dynamic-v17';
var OFFLINE_URL='offline.html';
var MAIN_DB_NAME='InfoCelllDB';
var OFFLINE_DB_NAME='InfoCelllOffline';

var PRECACHE_URLS=[
  'dashboard.html',
  'offline.html',
  'retirada-sem-os.html',
  'retirada-sem-os.js',
  'retirada-sem-os.css',
  'modules/central-ia/index.html',
  'modules/central-ia/css/central-ia.css',
  'modules/central-ia/js/data.js',
  'modules/central-ia/js/store.js',
  'modules/central-ia/js/ai.js',
  'modules/central-ia/js/app.js',
  'modules/central-ia/assets/icon.svg',
  'icon.svg',
  'logo-infocelll.png',
  'logo-infocelll.jpg',
  'html2pdf.bundle.min.js',
  'jszip.min.js',
  'chart.umd.min.js',
  'pwa/manifest.json',
  'pwa/screenshots/screenshot-1280x720.png',
  'pwa/screenshots/screenshot-720x1280.png',
  'pwa/icons/icon-72.png','pwa/icons/icon-96.png','pwa/icons/icon-128.png',
  'pwa/icons/icon-144.png','pwa/icons/icon-152.png','pwa/icons/icon-192.png',
  'pwa/icons/icon-384.png','pwa/icons/icon-512.png',
  'pwa/js/sync-manager.js','pwa/js/offline-manager.js','pwa/js/queue-ui.js','pwa/js/lock-screen.js'
];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache){
      return PRECACHE_URLS.reduce(function(p,url){
        return p.then(function(){
          return cache.add(url).catch(function(){});
        });
      },Promise.resolve());
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
  var request=e.request;
  if(request.method!=='GET')return;

  var url=new URL(request.url);

  if(url.origin!==self.location.origin&&url.href.indexOf('lucide')<0&&url.href.indexOf('cdnjs')<0){
    return;
  }

  if(url.pathname.indexOf('/api/')>=0)return;

  if(url.href.indexOf('chrome-extension')>=0)return;

  if(request.mode==='navigate'){
    e.respondWith(
      fetch(request).then(function(response){
        if(response&&response.ok){
          var clone=response.clone();
          caches.open(DYNAMIC_CACHE).then(function(cache){
            cache.put(request,clone);
          });
        }
        return response;
      }).catch(function(){
        return caches.match(request).then(function(cached){
          if(cached)return cached;
          return caches.match(OFFLINE_URL).then(function(offline){
            if(offline)return offline;
            return caches.match('dashboard.html');
          });
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(request).then(function(cached){
      var fetchPromise=fetch(request).then(function(response){
        if(response&&response.ok){
          var clone=response.clone();
          caches.open(DYNAMIC_CACHE).then(function(cache){
            cache.put(request,clone);
          });
        }
        return response;
      }).catch(function(){
        return cached||caches.match(OFFLINE_URL);
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
            if(r)total+=Number(r.headers.get('content-length'))||0;
          });
        })).then(function(){
          e.source.postMessage({type:'CACHE_SIZE',size:total});
        });
      });
    });
  }
  if(e.data.type==='SYNC_NOW'){
    runBackgroundSync();
  }
});

self.addEventListener('sync',function(e){
  if(e.tag==='sync-data'){e.waitUntil(runBackgroundSync())}
  if(e.tag==='sync-photos'){e.waitUntil(runBackgroundSync())}
});

self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
      for(var i=0;i<list.length;i++){
        if('focus' in list[i])return list[i].focus();
      }
      return clients.openWindow('./dashboard.html');
    })
  );
});

function runBackgroundSync(){
  return getLocalDB().then(function(db){
    if(!db)return;
    var url=db.config&&db.config.syncApiUrl;
    if(!url)return;

    var x=new XMLHttpRequest();
    x.open('PUT',url+'/api/data',true);
    x.setRequestHeader('Content-Type','application/json');
    x.onload=function(){
      if(x.status>=200&&x.status<300){
        clearOfflineQueue();
        notifyClients({type:'SYNC_COMPLETED'});
        notifyUser('Sincronização concluída','Seus dados foram enviados ao servidor.');
      }else{
        notifyClients({type:'SYNC_ERROR',status:x.status});
      }
    };
    x.onerror=function(){
      notifyClients({type:'SYNC_ERROR',status:0});
    };
    x.send(JSON.stringify({data:db,ts:Date.now()}));
  }).catch(function(err){
    console.error('[SW Sync] Error:',err);
  });
}

function getLocalDB(){
  return new Promise(function(resolve){
    try{
      if(!self.indexedDB){resolve(null);return}
      var req=indexedDB.open(MAIN_DB_NAME,3);
      req.onupgradeneeded=function(e){
        var db=e.target.result;
        if(!db.objectStoreNames.contains('idb_meta'))db.createObjectStore('idb_meta',{keyPath:'key'});
      };
      req.onsuccess=function(e){
        var db=e.target.result;
        try{
          var tx=db.transaction('idb_meta','readonly');
          var store=tx.objectStore('idb_meta');
          var get=store.get('main');
          get.onsuccess=function(){
            var result=get.result;
            if(result&&result.data){resolve(result.data)}
            else{resolve(null)}
          };
          get.onerror=function(){resolve(null)};
        }catch(err){resolve(null)}
      };
      req.onerror=function(){resolve(null)};
    }catch(err){resolve(null)}
  });
}

function clearOfflineQueue(){
  try{
    if(!self.indexedDB)return;
    var req=indexedDB.open(OFFLINE_DB_NAME,2);
    req.onsuccess=function(e){
      var db=e.target.result;
      try{
        var tx=db.transaction('queue','readwrite');
        var store=tx.objectStore('queue');
        store.clear();
      }catch(err){}
    };
    req.onerror=function(){};
  }catch(err){}
}

function notifyClients(message){
  clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    list.forEach(function(client){client.postMessage(message)});
  });
}

function notifyUser(title,body){
  if(!('Notification' in self))return;
  if(Notification.permission!=='granted')return;
  clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    var hasVisible=false;
    for(var i=0;i<list.length;i++){
      if(list[i].visibilityState==='visible'){hasVisible=true;break}
    }
    if(hasVisible)return;
    self.registration.showNotification(title,{
      body:body,
      icon:'pwa/icons/icon-192.png',
      badge:'pwa/icons/icon-96.png'
    });
  });
}
