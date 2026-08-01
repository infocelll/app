var OFFLINE_MANAGER={
  queue:[],
  dbName:'InfoCelllOffline',
  dbVersion:2,
  db:null,
  _idbReady:false,

  init:function(){
    this.openDB().then(function(){
      this.loadQueue().then(function(){
        this.listenConnection();
        window.addEventListener('online',this.onOnline.bind(this));
        window.addEventListener('offline',this.onOffline.bind(this));
        this.listenSW();
        this.updateUI();
      }.bind(this));
    }.bind(this));
  },

  openDB:function(){
    return new Promise(function(resolve){
      try{
        var req=indexedDB.open(this.dbName,this.dbVersion);
        req.onupgradeneeded=function(e){
          var db=e.target.result;
          if(!db.objectStoreNames.contains('queue'))db.createObjectStore('queue',{keyPath:'id'});
          if(!db.objectStoreNames.contains('queue_meta'))db.createObjectStore('queue_meta',{keyPath:'key'});
        };
        req.onsuccess=function(e){
          this.db=e.target.result;
          this._idbReady=true;
          resolve();
        }.bind(this);
        req.onerror=function(){resolve()};
      }catch(e){resolve()}
    }.bind(this));
  },

  idbAll:function(store){
    return new Promise(function(resolve){
      if(!this.db){resolve([]);return}
      try{
        var tx=this.db.transaction(store,'readonly');
        var req=tx.objectStore(store).getAll();
        req.onsuccess=function(){resolve(req.result||[])};
        req.onerror=function(){resolve([])};
      }catch(e){resolve([])}
    }.bind(this));
  },

  idbClear:function(store){
    if(!this.db)return;
    try{
      var tx=this.db.transaction(store,'readwrite');
      tx.objectStore(store).clear();
    }catch(e){}
  },

  idbPutAll:function(store,items){
    return new Promise(function(resolve){
      if(!this.db){resolve();return}
      try{
        var tx=this.db.transaction(store,'readwrite');
        var st=tx.objectStore(store);
        items.forEach(function(item){st.put(item)});
        tx.oncomplete=function(){resolve()};
        tx.onerror=function(){resolve()};
      }catch(e){resolve()}
    }.bind(this));
  },

  loadQueue:function(){
    return new Promise(function(resolve){
      this.queue=[];
      this.idbAll('queue').then(function(items){
        if(items&&items.length){
          this.queue=items;
          this.mirrorQueue();
          this.updateUI();
          resolve();
          return;
        }
        try{
          var q=localStorage.getItem('ic_offline_queue');
          if(q){
            this.queue=JSON.parse(q);
            this.saveQueue();
          }
        }catch(e){}
        resolve();
      }.bind(this));
    }.bind(this));
  },

  saveQueue:function(){
    try{localStorage.setItem('ic_offline_queue',JSON.stringify(this.queue))}catch(e){}
    this.mirrorQueue();
  },

  mirrorQueue:function(){
    if(!this._idbReady)return;
    this.idbClear('queue');
    if(this.queue.length)this.idbPutAll('queue',this.queue);
  },

  addToQueue:function(action,data){
    var item={id:Date.now()+'_'+Math.random().toString(36).slice(2,8),action:action,data:data,created:new Date().toISOString(),syncing:false,retries:0};
    this.queue.push(item);
    this.saveQueue();
    if(navigator.serviceWorker&&navigator.serviceWorker.ready){
      navigator.serviceWorker.ready.then(function(reg){
        if('sync' in reg)reg.sync.register('sync-data');
      });
    }
    this.updateUI();
    if(!navigator.onLine)this.showNotification('Dados salvos offline. Sincronização automática quando a internet retornar.');
  },

  processQueue:function(){
    if(!navigator.onLine)return;
    var pending=this.queue.filter(function(i){return!i.syncing&&i.retries<3});
    if(!pending.length){this.updateUI();return}
    this.showNotification('Sincronizando '+pending.length+' item(ns)...');
    this.setConnStatus('syncing');
    pending.forEach(function(item){
      item.syncing=true;
      this.syncItem(item);
    }.bind(this));
  },

  syncItem:function(item){
    var db;
    try{db=JSON.parse(localStorage.getItem('ic_dashboard')||'{}')}catch(e){}
    if(!db)return this.failItem(item);
    try{
      var collMap={os:'os',client:'clients',product:'products',service:'services',checklist:'checklists'};
      var key=collMap[item.action]||(item.action==='create_os'?'os':item.action==='save_client'?'clients':item.action==='save_product'?'products':item.action==='save_service'?'services':null);
      if(key){
        if(!db[key])db[key]=[];
        var idx=-1;
        for(var i=0;i<db[key].length;i++){
          if(db[key][i]&&item.data&&db[key][i].id===item.data.id){idx=i;break}
        }
        if(idx>=0)db[key][idx]=item.data;
        else db[key].push(item.data);
      }else if(item.action==='config'){
        db.config=item.data;
      }else{
        return this.failItem(item);
      }
      localStorage.setItem('ic_dashboard',JSON.stringify(db));
      this.mergeMemory(item);
      this.removeFromQueue(item.id);
      this.pushToServer();
      this.updateUI();
    }catch(e){
      this.failItem(item);
    }
  },

  mergeMemory:function(item){
    try{
      if(typeof window.DB==='undefined'||!window.DB)return;
      var key=item.action==='create_os'?'os':item.action==='save_client'?'clients':item.action==='save_product'?'products':item.action==='save_service'?'services':item.action==='client'?'clients':item.action==='product'?'products':item.action==='service'?'services':item.action==='os'?'os':null;
      if(!key||!item.data)return;
      if(!window.DB[key])window.DB[key]=[];
      var idx=-1;
      for(var i=0;i<window.DB[key].length;i++){
        if(window.DB[key][i]&&window.DB[key][i].id===item.data.id){idx=i;break}
      }
      if(idx>=0)window.DB[key][idx]=item.data;
      else window.DB[key].push(item.data);
    }catch(e){}
  },

  pushToServer:function(){
    try{
      if(typeof window.saveNow==='function')window.saveNow();
      else if(typeof window.syncSave==='function')window.syncSave();
    }catch(e){}
  },

  failItem:function(item){
    item.syncing=false;
    item.retries=(item.retries||0)+1;
    this.saveQueue();
    this.updateUI();
  },

  removeFromQueue:function(id){
    this.queue=this.queue.filter(function(i){return i.id!==id});
    this.saveQueue();
    if(!this.queue.length){
      this.setConnStatus('online');
      this.showNotification('Sincronização concluída!');
    }
    this.updateUI();
  },

  onOnline:function(){
    this.setConnStatus('syncing');
    this.processQueue();
    if(typeof updateSyncUI==='function')updateSyncUI();
  },

  onOffline:function(){
    this.setConnStatus('offline');
    this.showNotification('Sem conexão. Dados serão salvos offline.');
    if(typeof updateSyncUI==='function')updateSyncUI();
  },

  listenConnection:function(){
    document.addEventListener('visibilitychange',function(){
      if(!document.hidden&&navigator.onLine){
        if(this.queue.length)this.processQueue();
      }
    }.bind(this));
  },

  listenSW:function(){
    if(!navigator.serviceWorker)return;
    navigator.serviceWorker.addEventListener('message',function(e){
      if(!e.data)return;
      if(e.data.type==='SYNC_COMPLETED'){
        if(this.queue.length){
          this.queue=[];
          this.saveQueue();
        }
        try{localStorage.removeItem('ic_offline_queue')}catch(err){}
        this.setConnStatus('online');
        if(typeof updateSyncUI==='function')updateSyncUI();
      }
      if(e.data.type==='SYNC_ERROR'){
        if(typeof toast==='function')toast('Falha ao sincronizar no servidor. Tente novamente.','error');
      }
      if(e.data.type==='OFFLINE_QUEUE_CLEARED'){
        this.queue=[];
        this.saveQueue();
        this.updateUI();
      }
    }.bind(this));
  },

  updateUI:function(){
    var el=document.getElementById('syncBadge');
    if(el){el.textContent=this.queue.length;el.style.display=this.queue.length?'flex':'none'}
    if(!navigator.onLine)this.setConnStatus('offline');
    if(typeof updateSyncUI==='function')updateSyncUI();
  },

  setConnStatus:function(status){
    var el=document.getElementById('connStatus');
    if(el)el.className='conn-status '+status;
    var dot=document.getElementById('connStatusDot');
    if(dot){
      dot.className='conn-dot '+status;
      var labels={online:'🟢 Online',offline:'🔴 Offline',syncing:'🟠 Sincronizando...'};
      dot.innerHTML=labels[status]||status;
      dot.title=labels[status]||status;
    }
  },

  showNotification:function(msg){
    try{if(typeof toast==='function')toast(msg,navigator.onLine?'info':'warning')}catch(e){}
  }
};

document.addEventListener('DOMContentLoaded',function(){OFFLINE_MANAGER.init()});
