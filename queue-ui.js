function openSyncQueueModal(){
  var queue=SYNC_MANAGER?SYNC_MANAGER.queue:[];
  var offlineQueue=OFFLINE_MANAGER?OFFLINE_MANAGER.queue:[];
  var total=queue.length+offlineQueue.length;
  var html='<div style="min-width:320px;max-width:480px">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">'+
    '<span style="font-size:20px">&#128230;</span>'+
    '<div><div style="font-weight:700;font-size:15px">Fila de Sincronização</div>'+
    '<div style="font-size:11px;color:var(--txt3)">'+(navigator.onLine?'<span style="color:var(--grn)">&#9679; Online</span>':'<span style="color:var(--red)">&#9679; Offline</span>')+' | '+total+' pendente(s)</div></div>'+
    '<div style="margin-left:auto;display:flex;gap:6px">'+
    (total?('<button class="btn btn-sm btn-primary" onclick="syncAllNow()" style="font-size:10px">&#8635; Sincronizar</button>'):'')+
    '<button class="btn btn-sm btn-secondary" onclick="var m=document.getElementById(\'syncQueueModal\');if(m){m.style.display=\'none\';m.remove()}" style="font-size:10px">Fechar</button></div></div>';
  if(!total){
    html+='<div class="empty-state" style="padding:32px">Nenhum item pendente de sincronização</div>';
  }else{
    html+='<div style="max-height:400px;overflow-y:auto">';
    [].concat(
      queue.map(function(i){var c={};for(var k in i)c[k]=i[k];c.src='SYNC';return c}),
      offlineQueue.map(function(i){var c={};for(var k in i)c[k]=i[k];c.src='OFFLINE';return c})
    ).sort(function(a,b){return a.created>b.created?-1:1}).forEach(function(item){
      var icon=item.type==='os'?'&#128196;':item.type==='client'?'&#128100;':item.type==='photo'?'&#128247;':'&#128203;';
      var label=item.type||item.action||'sync';
      var status=item.syncing?'<span style="color:var(--ylw)">Sincronizando...</span>':item.error?'<span style="color:var(--red)">Erro</span>':'<span style="color:var(--txt3)">Pendente</span>';
      html+='<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--bdr);border-radius:var(--rs);margin-bottom:6px;background:var(--input)">'+
        '<span style="font-size:16px">'+icon+'</span>'+
        '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600">'+escH(label)+'</div>'+
        '<div style="font-size:10px;color:var(--txt3)">'+new Date(item.created).toLocaleString('pt-BR')+'</div></div>'+
        '<div style="font-size:10px;text-align:right">'+status+'</div></div>';
    });
    html+='</div>';
    html+='<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">'+
      '<button class="btn btn-sm btn-danger" onclick="if(confirm(\'Limpar toda a fila? Os dados não enviados serão perdidos.\')){clearSyncQueue();openSyncQueueModal()}" style="font-size:10px">Limpar Fila</button>'+
      '</div>';
  }
  var modal=document.createElement('div');modal.className='modal-overlay';modal.id='syncQueueModal';
  modal.style.cssText='position:fixed;inset:0;z-index:30000;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML='<div class="modal" style="max-width:520px;width:100%"><div class="modal-body">'+html+'</div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click',function(e){if(e.target===modal){modal.style.display='none';modal.remove()}});
}

function syncAllNow(){
  var m=document.getElementById('syncQueueModal');if(m){m.style.display='none';m.remove()}
  if(SYNC_MANAGER)SYNC_MANAGER.sync();
  if(OFFLINE_MANAGER)OFFLINE_MANAGER.processQueue();
  toast('Sincronizando...','info');
}

function clearSyncQueue(){
  if(SYNC_MANAGER){SYNC_MANAGER.queue=[];SYNC_MANAGER.save()}
  if(OFFLINE_MANAGER){OFFLINE_MANAGER.queue=[];OFFLINE_MANAGER.saveQueue()}
  updateSyncUI();
  toast('Fila limpa','info');
}

function updateSyncUI(){
  var queue=SYNC_MANAGER?SYNC_MANAGER.queue:[];
  var offlineQueue=OFFLINE_MANAGER?OFFLINE_MANAGER.queue:[];
  var total=queue.length+offlineQueue.length;
  var el=document.getElementById('syncBadge');
  if(el){el.textContent=total;el.style.display=total?'flex':'none'}
  var dot=document.getElementById('connStatusDot');
  if(dot){
    var labels={online:'🟢 Online',offline:'🔴 Offline',syncing:'🟠 Sincronizando...'};
    var status=navigator.onLine?'online':'offline';
    dot.className='conn-dot '+status;
    dot.innerHTML=labels[status]||status;
    dot.title=labels[status]||status;
  }
}

document.addEventListener('DOMContentLoaded',function(){
  setInterval(updateSyncUI,5000);
});
