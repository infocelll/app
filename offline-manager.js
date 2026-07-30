var OFFLINE_MANAGER={
  queue:[],
  dbName:'InfoCelllOffline',
  dbVersion:2,
  db:null,

  init:function(){
    this.openDB().then(function(){
      this.loadQueue();
      this.listenConnection();
      window.addEventListener('online',this.onOnline.bind(this));
      window.addEventListener('offline',this.onOffline.bind(this));
      this.updateUI();
    }.bind(this));
  },

  openDB:function(){
    return new Promise(function(resolve){
      var req=indexedDB.open(this.dbName,this.dbVersion);
      req.onupgradeneeded=function(e){
        var db=e.target.result;
        if(!db.objectStoreNames.contains('queue'))db.createObjectStore('queue',{keyPath:'id'});
        if(!db.objectStoreNames.contains('queue_meta'))db.createObjectStore('queue_meta',{keyPath:'key'});
      };
      req.onsuccess=function(e){this.db=e.target.result;resolve()}.bind(this);
      req.onerror=function(){resolve()};
    }.bind(this));
  },

  loadQueue:function(){
    try{
      var q=localStorage.getItem('ic_offline_queue');
      if(q)this.queue=JSON.parse(q);
    }catch(e){}
  },

  saveQueue:function(){
    try{localStorage.setItem('ic_offline_queue',JSON.stringify(this.queue))}catch(e){}
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
      if(item.action==='os'||item.action==='create_os'){
        if(!db.os)db.os=[];
        var idx=db.os.findIndex(function(o){return o.id===item.data.id});
        if(idx>=0)db.os[idx]=item.data;
        else db.os.push(item.data);
      }else if(item.action==='client'||item.action==='save_client'){
        if(!db.clients)db.clients=[];
        var idx=db.clients.findIndex(function(c){return c.id===item.data.id});
        if(idx>=0)db.clients[idx]=item.data;
        else db.clients.push(item.data);
      }else if(item.action==='product'||item.action==='save_product'){
        if(!db.products)db.products=[];
        var idx=db.products.findIndex(function(p){return p.id===item.data.id});
        if(idx>=0)db.products[idx]=item.data;
        else db.products.push(item.data);
      }else if(item.action==='service'||item.action==='save_service'){
        if(!db.services)db.services=[];
        var idx=db.services.findIndex(function(s){return s.id===item.data.id});
        if(idx>=0)db.services[idx]=item.data;
        else db.services.push(item.data);
      }else if(item.action==='checklist'){
        if(!db.checklists)db.checklists=[];
        db.checklists.push(item.data);
      }else if(item.action==='config'){
        db.config=item.data;
      }
      localStorage.setItem('ic_dashboard',JSON.stringify(db));
      this.removeFromQueue(item.id);
      this.updateUI();
    }catch(e){
      this.failItem(item);
    }
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
