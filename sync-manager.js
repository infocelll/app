var SYNC_MANAGER={
  queue:[],
  processing:false,
  retryMax:3,

  init:function(){
    this.load();
    window.addEventListener('online',this.sync.bind(this));
    setInterval(this.sync.bind(this),30000);
  },

  load:function(){
    try{
      var q=localStorage.getItem('ic_sync_queue');
      if(q)this.queue=JSON.parse(q);
    }catch(e){}
  },

  save:function(){
    try{localStorage.setItem('ic_sync_queue',JSON.stringify(this.queue))}catch(e){}
  },

  add:function(type,data){
    this.queue.push({id:Date.now()+'_'+Math.random().toString(36).slice(2,6),type:type,data:data,retries:0,created:new Date().toISOString(),syncing:false});
    this.save();
    this.sync();
    if(typeof updateSyncUI==='function')updateSyncUI();
  },

  sync:function(){
    if(!navigator.onLine||this.processing||!this.queue.length)return;
    this.processing=true;
    var connEl=document.getElementById('connStatus');
    if(connEl)connEl.className='conn-status syncing';
    var pending=this.queue.filter(function(i){return!i.syncing&&i.retries<this.retryMax}.bind(this));
    if(!pending.length){this.processing=false;return}
    pending.forEach(function(item){item.syncing=true});
    var promises=pending.map(function(item){
      return this.processItem(item).then(function(){
        this.remove(item.id);
      }.bind(this)).catch(function(){
        item.syncing=false;item.retries++;this.save();
      }.bind(this));
    }.bind(this));
    Promise.allSettled(promises).then(function(){
      this.processing=false;
      if(!this.queue.length){
        if(connEl)connEl.className='conn-status online';
        if(typeof toast==='function')toast('Sincronização concluída!','success');
      }
      if(typeof updateSyncUI==='function')updateSyncUI();
    }.bind(this));
  },

  processItem:function(item){
    return new Promise(function(resolve,reject){
      var db;
      try{db=JSON.parse(localStorage.getItem('ic_dashboard')||'{}')}catch(e){}
      if(!db)return reject();
      try{
        if(item.type==='os'){
          if(!db.os)db.os=[];
          var idx=db.os.findIndex(function(o){return o.id===item.data.id});
          if(idx>=0)db.os[idx]=item.data;else db.os.push(item.data);
        }else if(item.type==='client'){
          if(!db.clients)db.clients=[];
          var idx=db.clients.findIndex(function(c){return c.id===item.data.id});
          if(idx>=0)db.clients[idx]=item.data;else db.clients.push(item.data);
        }else if(item.type==='product'){
          if(!db.products)db.products=[];
          var idx=db.products.findIndex(function(p){return p.id===item.data.id});
          if(idx>=0)db.products[idx]=item.data;else db.products.push(item.data);
        }else if(item.type==='checklist'){
          if(!db.checklists)db.checklists=[];db.checklists.push(item.data);
        }else if(item.type==='photo'){
          resolve();
        }
        localStorage.setItem('ic_dashboard',JSON.stringify(db));
        resolve();
      }catch(e){reject(e)}
    });
  },

  remove:function(id){
    this.queue=this.queue.filter(function(i){return i.id!==id});
    this.save();
  },

  getQueueLength:function(){
    return this.queue.length;
  }
};

document.addEventListener('DOMContentLoaded',function(){SYNC_MANAGER.init()});
