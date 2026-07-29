var RET_KEY='ic_retirada_sem_os';
var DASH_KEY='ic_dashboard';
var retDB={retiradas:[],config:{proximoNumero:1}};
var currentOS=null,currentRet=null,photos=[],signatureData=null;
var currentStep='search',editingId=null;
var sigCanvas=null,sigCtx=null,sigDrawing=false;
var DEFAULT_TERM='<h4>TERMO DE DECLARAÇÃO E RESPONSABILIDADE</h4><p>Eu, <strong>{cliente}</strong>, declaro que recebi o equipamento <strong>{equipamento}</strong> na <strong>InfoCelll</strong>, em perfeitas condições de funcionamento e aparência, conforme descrito nesta retirada.</p><p>Declaro estar ciente de que:</p><ul><li>O equipamento foi testado e aprovado no ato da retirada;</li><li>A garantia cobre apenas defeitos de fabricação, não abrangendo mau uso, queda, contato com líquidos ou descargas elétricas;</li><li>O prazo de garantia é de <strong>{garantia}</strong> a partir desta data;</li><li>As avarias informadas no ato do recebimento estão devidamente registradas;</li><li>Em caso de retirada por terceiro, o declarante assume integral responsabilidade pelo equipamento.</li></ul>';

function loadRetDB(){try{var d=localStorage.getItem(RET_KEY);if(d){retDB=JSON.parse(d);if(!retDB.retiradas)retDB.retiradas=[];if(!retDB.config)retDB.config={proximoNumero:1}} }catch(e){console.warn('[Retirada] Erro ao carregar dados:',e)}}
function saveRetDB(){try{localStorage.setItem(RET_KEY,JSON.stringify(retDB))}catch(e){console.warn('[Retirada] Erro ao salvar:',e)}}
function loadDashOS(){try{var d=localStorage.getItem(DASH_KEY);if(d){var db=JSON.parse(d);return db.os||[]}return[]}catch(e){return[]}}
function loadDashDB(){try{var d=localStorage.getItem(DASH_KEY);if(d){return JSON.parse(d)}return{}}catch(e){return{}}}

var _debounceTimer=null
function debounceSearch(){clearTimeout(_debounceTimer);_debounceTimer=setTimeout(function(){searchOS()},300)}

function fmt$(v){if(v===null||v===undefined||v==='')return'R$ 0,00';var n=parseFloat(v);if(isNaN(n))return'R$ 0,00';return'R$ '+n.toFixed(2).replace('.',',')}
function escH(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function hoje(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function hora(){var d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function dataBr(d){if(!d)return'';var p=d.split('-');if(p.length!==3)return d;return p[2]+'/'+p[1]+'/'+p[0]}
function fmtDateTime(d,t){return dataBr(d)+' s '+t}
function nextNum(){retDB.config.proximoNumero=retDB.config.proximoNumero||1;return retDB.config.proximoNumero++}

function toast(msg,type){type=type||'success';var ctn=document.getElementById('toastCtn');if(!ctn){ctn=document.createElement('div');ctn.id='toastCtn';ctn.className='toast-container';document.body.appendChild(ctn)}
  var icons={success:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',error:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',warning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'};var el=document.createElement('div');el.className='toast toast-'+type;el.innerHTML=icons[type]||icons.success+'<span>'+msg+'</span>';ctn.appendChild(el);setTimeout(function(){el.style.opacity='0';el.style.transform='translateX(40px)';setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el)},300)},3500)}

function showModal(title,bodyHtml,footerHtml,width){var overlay=document.getElementById('modalOverlay');if(!overlay){overlay=document.createElement('div');overlay.id='modalOverlay';overlay.className='modal-overlay';overlay.onclick=function(e){if(e.target===this)closeModal()};document.body.appendChild(overlay);overlay.innerHTML='<div class="modal" id="modalContent"><div class="modal-header"><span class="modal-title"></span><button class="modal-close" onclick="closeModal()">&times;</button></div><div class="modal-body"></div><div class="modal-footer"></div></div>'}
  document.querySelector('#modalContent .modal-title').textContent=title||'';
  document.querySelector('#modalContent .modal-body').innerHTML=bodyHtml||'';
  document.querySelector('#modalContent .modal-footer').innerHTML=footerHtml||'';
  if(width)document.getElementById('modalContent').style.maxWidth=width;
  overlay.classList.add('visible')}
function closeModal(){var o=document.getElementById('modalOverlay');if(o)o.classList.remove('visible')}

function goToStep(step){document.querySelectorAll('.section-panel').forEach(function(e){e.classList.remove('active')});document.querySelectorAll('.step').forEach(function(e){e.classList.remove('active')});document.getElementById('panel-'+step).classList.add('active');var el=document.querySelector('.step[data-step="'+step+'"]');if(el)el.classList.add('active');currentStep=step;if(step==='history')renderHistory();if(step==='form'&&currentOS)fillOSData()}

function initRetirada(){loadRetDB();renderHistory();setupSignaturePad();setupPhotoCapture();goToStep('search')}

function searchScore(text,query){
  if(!text||!query)return 0;text=String(text).toLowerCase();query=String(query).toLowerCase()
  if(text===query)return 100;if(text.startsWith(query))return 80
  var idx=text.indexOf(query);if(idx!==-1)return 60-idx
  var words=query.split(/\s+/);var matchCount=0;words.forEach(function(w){if(w.length>1&&text.indexOf(w)!==-1)matchCount++})
  return matchCount*20}

function searchOS(){
  var query=document.getElementById('searchInput').value.trim();if(!query){toast('Digite um termo para buscar','warning');return}
  var db=loadDashDB();var results=[];var q=query.toLowerCase();var qNum=q.replace(/\D/g,'')
  // Busca em OS
  ;(db.os||[]).forEach(function(o){
    var score=0
    score=Math.max(score,searchScore(o.cliente,q)*2)
    score=Math.max(score,searchScore(o.aparelho||o.equipamento,q)*2)
    score=Math.max(score,searchScore(o.telefone,q))
    score=Math.max(score,searchScore(o.defeito,q))
    score=Math.max(score,searchScore(o.marca,q))
    score=Math.max(score,searchScore(o.modelo,q))
    score=Math.max(score,searchScore(o.imei,q))
    score=Math.max(score,searchScore(o.obs,q))
    score=Math.max(score,searchScore(o.osCode||'OS-'+String(o.id).padStart(4,'0'),q))
    if(String(o.id)===q||String(o.osCode||'').toLowerCase()===q)score=Math.max(score,200)
    if((o.telefone||'').replace(/\D/g,'').indexOf(qNum)!==-1)score=Math.max(score,70)
    if(score>0)results.push({type:'os',data:o,score:score,label:o.osCode||'OS-'+String(o.id).padStart(4,'0'),sub:o.cliente+' – '+(o.aparelho||o.equipamento||'')})
  })
  // Busca em Clientes
  ;(db.clients||db.clientes||[]).forEach(function(c){
    var score=0
    score=Math.max(score,searchScore(c.nome,q)*2)
    score=Math.max(score,searchScore(c.telefone,q))
    score=Math.max(score,searchScore(c.email,q))
    score=Math.max(score,searchScore(c.cpf,q))
    if((c.telefone||'').replace(/\D/g,'').indexOf(qNum)!==-1)score=Math.max(score,70)
    if(score>0)results.push({type:'cli',data:c,score:score,label:c.nome,sub:(c.telefone||'')+(c.email?' | '+c.email:'')})
  })
  // Busca em Produtos
  ;(db.products||db.produtos||[]).forEach(function(p){
    var score=0
    score=Math.max(score,searchScore(p.nome,q)*2)
    score=Math.max(score,searchScore(p.marca,q))
    score=Math.max(score,searchScore(p.modelo,q))
    score=Math.max(score,searchScore(p.codigo,q))
    score=Math.max(score,searchScore(p.desc,q))
    if(score>0)results.push({type:'prd',data:p,score:score,label:p.nome,sub:(p.marca||'')+(p.modelo?' '+p.modelo:'')+' | '+fmt$(p.venda||0)})
  })
  // Busca em Serviços
  ;(db.servicos||db.services||db.Serviços||[]).forEach(function(s){
    var score=0
    score=Math.max(score,searchScore(s.nome,q)*2)
    score=Math.max(score,searchScore(s.desc,q))
    if(score>0)results.push({type:'svc',data:s,score:score,label:s.nome,sub:s.desc||''+' | '+fmt$(s.Preo||0)})
  })
  results.sort(function(a,b){return b.score-a.score})
  results=results.slice(0,30)
  renderSearchResults(results)}

function renderSearchResults(results){
  var ctn=document.getElementById('searchResults')
  var notFound='<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><h3>Nenhum resultado encontrado</h3><p>Tente alterar o termo de busca</p></div>'
  if(!results.length){ctn.innerHTML=notFound;return}
  var typeColors={os:'var(--cyan)',cli:'var(--grn)',prd:'var(--ylw)',svc:'var(--pur)'}
  var typeLabels={os:'OS',cli:'Cliente',prd:'Produto',svc:'Serviço'}
  var typeIcons={os:'🔧',cli:'👤',prd:'📦',svc:'🛠️'}
  ctn.innerHTML='<div style="display:flex;flex-direction:column;gap:6px">'+results.map(function(r,i){
    var tc=typeColors[r.type]||'var(--txt3)'
    var tl=typeLabels[r.type]||r.type
    var ic=typeIcons[r.type]||'•'
    return'<div class="card result-card" style="cursor:pointer;padding:12px;animation-delay:'+(i*30)+'ms" onclick="selectResult(\''+r.type+'\','+r.data.id+')">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">'+
      '<div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">'+
      '<span style="font-size:16px;flex-shrink:0">'+ic+'</span>'+
      '<div style="min-width:0"><strong style="color:'+tc+';font-size:14px">'+escH(r.label)+'</strong>'+
      '<div style="font-size:11px;color:var(--txt3);margin-top:1px;word-wrap:break-word">'+escH(r.sub||'')+'</div></div></div>'+
      '<div style="text-align:right;flex-shrink:0"><span class="badge" style="background:'+tc+'20;color:'+tc+';font-size:9px">'+tl+'</span>'+
      '</div></div></div>'
  }).join('')+'</div>'}

var STATUS_LABELS_DICT={recebida:'Recebida','em-diagnostico':'Em Diagnóstico','aguardando-Aprovao':'Aguard. Aprovação','em-reparo':'Em Reparo',teste:'Teste',pronta:'Pronta',entregue:'Entregue',cancelado:'Cancelado'};
var STATUS_COLORS_DICT={recebida:'var(--org)','em-diagnostico':'var(--blu)','aguardando-Aprovao':'var(--ylw)','em-reparo':'var(--cyan)',teste:'var(--pur)',pronta:'var(--grn)',entregue:'var(--grn)',cancelado:'var(--red)'};

function selectResult(type,id){
  var db=loadDashDB()
  if(type==='os'){
    var o=(db.os||[]).find(function(x){return x.id===id})
    if(!o){toast('OS não encontrada','error');return}
    currentOS=o;currentRet=null;editingId=null;photos=[];signatureData=null;resetForm()
    toast('OS '+escH(o.osCode||'OS-'+String(o.id).padStart(4,'0'))+' selecionada','success')
    document.getElementById('searchQuery').textContent=(o.osCode||'OS-'+String(o.id).padStart(4,'0'))+' – '+escH(o.cliente||'')
    document.getElementById('osId').value=o.id||''
    document.getElementById('clienteNome').value=o.cliente||''
    document.getElementById('clienteTel').value=o.telefone||''
    document.getElementById('equipamento').value=o.aparelho||o.equipamento||''
    document.getElementById('marca').value=o.marca||''
    document.getElementById('modelo').value=o.modelo||''
    document.getElementById('imei').value=o.imei||''
    document.getElementById('defeito').value=o.defeito||''
    document.getElementById('obs').value=o.obs||''
    document.getElementById('valor').value=o.valor||o.total||''
    document.getElementById('garantia').value='90 dias'
    document.getElementById('tecnico').value=o.tecnico||'Silvio'
    setTerceiro(false)
    goToStep('form')
  }else if(type==='cli'){
    var c=(db.clients||db.clientes||[]).find(function(x){return x.id===id})
    if(!c){toast('Cliente não encontrado','error');return}
    currentOS=null;currentRet=null;editingId=null;photos=[];signatureData=null;resetForm()
    toast('Cliente '+escH(c.nome)+' selecionado','success')
    document.getElementById('searchQuery').textContent='Cliente: '+escH(c.nome)
    document.getElementById('clienteNome').value=c.nome||''
    document.getElementById('clienteTel').value=c.telefone||''
    goToStep('form')
  }else if(type==='prd'){
    var p=(db.products||db.produtos||[]).find(function(x){return x.id===id})
    if(!p){toast('Produto não encontrado','error');return}
    if(!currentOS){currentOS=null}
    toast('Produto '+escH(p.nome)+' selecionado','success')
    document.getElementById('searchQuery').textContent='Produto: '+escH(p.nome)
    document.getElementById('equipamento').value=p.nome||''
    document.getElementById('marca').value=p.marca||''
    document.getElementById('modelo').value=p.modelo||''
    goToStep('form')
  }else if(type==='svc'){
    var sv=(db.servicos||db.services||db.Serviços||[]).find(function(x){return x.id===id})
    if(!sv){toast('Serviço não encontrado','error');return}
    toast('Serviço '+escH(sv.nome)+' selecionado','success')
    document.getElementById('defeito').value=(document.getElementById('defeito').value?document.getElementById('defeito').value+'; ':'')+sv.nome
    goToStep('form')
  }
}

function resetForm(){
  document.getElementById('osId').value=''
  document.getElementById('clienteNome').value=''
  document.getElementById('clienteTel').value=''
  document.getElementById('equipamento').value=''
  document.getElementById('marca').value=''
  document.getElementById('modelo').value=''
  document.getElementById('imei').value=''
  document.getElementById('defeito').value=''
  document.getElementById('obs').value=''
  document.getElementById('garantia').value='90 dias'
  document.getElementById('acessorios').value=''
  document.getElementById('valor').value=''
  document.getElementById('tecnico').value='Silvio'
  document.getElementById('terceiroNome').value=''
  document.getElementById('terceiroDoc').value=''
  document.getElementById('terceiroFields').style.display='none'
  document.querySelectorAll('.terceiro-btn').forEach(function(b){b.classList.remove('active')})
  document.querySelector('.terceiro-btn[data-terceiro="false"]').classList.add('active')
  photos=[];renderPhotos()
  clearSig()
}

function skipSearch(){currentOS=null;currentRet=null;editingId=null;photos=[];signatureData=null;resetForm();
  document.getElementById('searchQuery').textContent='Sem vínculo (retirada avulsa)';
  goToStep('form')}

function fillOSData(){if(!currentOS)return;var o=currentOS;
  document.getElementById('osId').value=o.id||'';
  document.getElementById('clienteNome').value=o.cliente||'';
  document.getElementById('clienteTel').value=o.telefone||'';
  var ap=o.aparelho||o.equipamento||'';
  document.getElementById('equipamento').value=ap;
  document.getElementById('marca').value=o.marca||'';
  document.getElementById('modelo').value=o.modelo||'';
  document.getElementById('imei').value=o.imei||'';
  document.getElementById('defeito').value=o.defeito||'';
  document.getElementById('obs').value=o.obs||'';
  document.getElementById('garantia').value='90 dias';
  var val=o.valor||o.total||'';
  document.getElementById('valor').value=val;
  document.getElementById('acessorios').value=''
  setTerceiro(false)}

function setTerceiro(val){document.querySelectorAll('.terceiro-btn').forEach(function(b){b.classList.remove('active')});document.querySelector('.terceiro-btn[data-terceiro="'+val+'"]').classList.add('active');document.getElementById('terceiroFields').style.display=val?'block':'none';if(!val){document.getElementById('terceiroNome').value='';document.getElementById('terceiroDoc').value=''}}


function setupPhotoCapture(){document.getElementById('photoInput').addEventListener('change',function(e){var files=e.target.files;for(var i=0;i<files.length;i++){(function(file){var reader=new FileReader();reader.onload=function(ev){photos.push(ev.target.result);renderPhotos()};reader.readAsDataURL(file)})(files[i])};e.target.value=''})}
function renderPhotos(){var ctn=document.getElementById('photoGrid');ctn.innerHTML=photos.map(function(p,i){return'<div class="photo-item"><img src="'+p+'" alt="Foto '+(i+1)+'"><button class="photo-del" onclick="removePhoto('+i+')" title="Remover foto">&times;</button></div>'}).join('')+'<div class="photo-add" onclick="document.getElementById(\'photoInput\').click()"><div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 4px;display:block"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Adicionar foto</div></div>'}
function removePhoto(i){photos.splice(i,1);renderPhotos()}

function confirmRetirada(){var data={osId:document.getElementById('osId').value||null,
    cliente:document.getElementById('clienteNome').value.trim(),
    telefone:document.getElementById('clienteTel').value.trim(),
    equipamento:document.getElementById('equipamento').value.trim(),
    marca:document.getElementById('marca').value.trim(),
    modelo:document.getElementById('modelo').value.trim(),
    imei:document.getElementById('imei').value.trim(),
    defeito:document.getElementById('defeito').value.trim(),
    acessorios:document.getElementById('acessorios').value.trim(),
    obs:document.getElementById('obs').value.trim(),
    checklistObs:document.getElementById('checklistObs').value.trim(),
    garantia:document.getElementById('garantia').value.trim()||'90 dias',
    valor:document.getElementById('valor').value.trim(),
    terceiro:document.querySelector('.terceiro-btn.active').getAttribute('data-terceiro')==='true',
    terceiroNome:document.getElementById('terceiroNome').value.trim(),
    terceiroDoc:document.getElementById('terceiroDoc').value.trim(),
    tecnico:document.getElementById('tecnico').value.trim()||'Silvio',
    fotos:photos,
    dataRetirada:hoje(),horaRetirada:hora()}
  if(!data.cliente){toast('Informe o nome do cliente','error');return}
  if(!data.equipamento){toast('Informe o equipamento','error');return}
  var num=editingId?editingId:nextNum();var now=new Date().toISOString();
  var ret={id:num,numero:'RET-'+(editingId?String(editingId).padStart(4,'0'):String(num).padStart(4,'0')),osId:data.osId?parseInt(data.osId):null,cliente:data.cliente,telefone:data.telefone,equipamento:data.equipamento,marca:data.marca,modelo:data.modelo,imei:data.imei,defeito:data.defeito,acessorios:data.acessorios,obs:data.obs,garantia:data.garantia,valor:data.valor,terceiro:data.terceiro,terceiroNome:data.terceiroNome,terceiroDoc:data.terceiroDoc,tecnico:data.tecnico,fotos:data.fotos,dataRetirada:data.dataRetirada,horaRetirada:data.horaRetirada,createdAt:now,updatedAt:now,status:'concluida',auditoria:[{data:data.dataRetirada,hora:data.horaRetirada,usuario:data.tecnico,acao:'Retirada realizada'}]}
  if(editingId){var idx=retDB.retiradas.findIndex(function(r){return r.id===editingId});if(idx!==-1){ret.auditoria=retDB.retiradas[idx].auditoria||[];ret.auditoria.push({data:hoje(),hora:hora(),usuario:data.tecnico,acao:'Retirada atualizada'});retDB.retiradas[idx]=ret;ret.createdAt=retDB.retiradas[idx].createdAt;toast('Retirada atualizada','success')}}else{retDB.retiradas.push(ret);toast('Retirada registrada com sucesso!','success')}
  saveRetDB();currentRet=ret;editingId=null;renderPreview();renderHistory();goToStep('preview')}

function renderPreview(){var r=currentRet;if(!r)return
  document.getElementById('previewNumero').textContent=r.numero||'RET-'+String(r.id).padStart(4,'0');
  document.getElementById('previewData').textContent=dataBr(r.dataRetirada)+' s '+r.horaRetirada;
  document.getElementById('previewCliente').textContent=escH(r.cliente);
  document.getElementById('previewTel').textContent=escH(r.telefone||'—');
  document.getElementById('previewEquip').textContent=[r.equipamento,r.marca,r.modelo].filter(Boolean).join(' / ')||'—';
  document.getElementById('previewImei').textContent=r.imei||'—';
  document.getElementById('previewDefeito').textContent=r.defeito||'—';
  document.getElementById('previewAcessorios').textContent=r.acessorios||'—';
  document.getElementById('previewGarantia').textContent=r.garantia||'—';
  document.getElementById('previewValor').textContent=r.valor?fmt$(r.valor):'—';
  document.getElementById('previewTecnico').textContent=escH(r.tecnico||'Silvio');
  document.getElementById('previewTerceiro').textContent=r.terceiro?(escH(r.terceiroNome||'')+' ('+escH(r.terceiroDoc||'')+')'):'Próprio cliente';
  document.getElementById('previewObs').textContent=r.obs||'—';
  var pc=document.getElementById('previewPhotos');if(r.fotos&&r.fotos.length){pc.innerHTML='<div style="display:flex;gap:6px;flex-wrap:wrap">'+r.fotos.map(function(f){return'<img src="'+f+'" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid var(--bdr)">'}).join('')+'</div>';pc.style.display='block'}else pc.style.display='none'
  var qrUrl='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent('RETIRADA: '+r.cliente+' | Equip: '+r.equipamento+' | Data: '+r.dataRetirada+' | Tecnico: '+(r.tecnico||''));
  document.getElementById('previewQR').src=qrUrl}

function renderHistory(){var ctn=document.getElementById('historyList');var list=retDB.retiradas||[];if(!list.length){ctn.innerHTML='<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><h3>Nenhuma retirada registrada</h3><p>As retiradas sem OS aparecero aqui</p></div>';return}
  ctn.innerHTML=list.slice().reverse().map(function(r){var iconClass='cyan';if(r.status==='cancelada')iconClass='red';else if(r.terceiro)iconClass='grn';var dt=fmtDateTime(r.dataRetirada,r.horaRetirada);return'<div class="history-item" onclick="viewRetirada('+r.id+')" style="cursor:pointer">'+
    '<div class="h-icon '+iconClass+'">'+'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></div>'+
    '<div class="h-info"><div class="h-title">'+(r.numero||'RET-'+String(r.id).padStart(4,'0'))+' – '+escH(r.cliente)+'</div>'+
    '<div class="h-desc">'+escH(r.equipamento)+(r.terceiro?' (Terceiro: '+escH(r.terceiroNome)+')':'')+'</div>'+
    '<div class="h-meta"><span>'+dt+'</span><span>'+escH(r.tecnico||'')+'</span>'+
    (r.valor?'<span>'+fmt$(r.valor)+'</span>':'')+
    '</div></div></div>'}).join('')}

function viewRetirada(id){var r=retDB.retiradas.find(function(x){return x.id===id});if(!r){  toast('Retirada não encontrada','error');return}
  var html='<div class="preview-box">'+
    '<div class="preview-row"><div class="preview-label">Número:</div><div class="preview-value"><strong>'+(r.numero||'RET-'+String(r.id).padStart(4,'0'))+'</strong></div></div>'+
    '<div class="preview-row"><div class="preview-label">Data:</div><div class="preview-value">'+fmtDateTime(r.dataRetirada,r.horaRetirada)+'</div></div>'+
    '<div class="preview-row"><div class="preview-label">Cliente:</div><div class="preview-value">'+escH(r.cliente)+(r.telefone?' ('+escH(r.telefone)+')':'')+'</div></div>'+
    '<div class="preview-row"><div class="preview-label">Equipamento:</div><div class="preview-value">'+escH(r.equipamento)+(r.marca?' - '+escH(r.marca):'')+(r.modelo?' - '+escH(r.modelo):'')+'</div></div>'+
    (r.imei?'<div class="preview-row"><div class="preview-label">IMEI:</div><div class="preview-value">'+escH(r.imei)+'</div></div>':'')+
    (r.defeito?'<div class="preview-row"><div class="preview-label">Defeito:</div><div class="preview-value">'+escH(r.defeito)+'</div></div>':'')+
    (r.acessorios?'<div class="preview-row"><div class="preview-label">Acessórios:</div><div class="preview-value">'+escH(r.acessorios)+'</div></div>':'')+
    '<div class="preview-row"><div class="preview-label">Garantia:</div><div class="preview-value">'+escH(r.garantia||'90 dias')+'</div></div>'+
    (r.valor?'<div class="preview-row"><div class="preview-label">Valor:</div><div class="preview-value">'+fmt$(r.valor)+'</div></div>':'')+
    '<div class="preview-row"><div class="preview-label">Terceiro:</div><div class="preview-value">'+(r.terceiro?(escH(r.terceiroNome||'')+' ('+escH(r.terceiroDoc||'')+')'):'Próprio cliente')+'</div></div>'+
    '<div class="preview-row"><div class="preview-label">Técnico:</div><div class="preview-value">'+escH(r.tecnico||'Silvio')+'</div></div>'+
    (r.obs?'<div class="preview-row"><div class="preview-label">Obs:</div><div class="preview-value">'+escH(r.obs)+'</div></div>':'')+
    '</div>';
  var footer='<button class="btn btn-sm btn-secondary" onclick="closeModal()">Fechar</button>'+
    '<button class="btn btn-sm btn-primary" onclick="closeModal();editRetirada('+id+')">Editar</button>'+
    '<button class="btn btn-sm btn-success" onclick="closeModal();generatePDF('+id+')">PDF</button>'+
    '<button class="btn btn-sm btn-danger" onclick="closeModal();cancelRetirada('+id+')">Cancelar</button>';
  showModal('Retirada '+(r.numero||'RET-'+String(r.id).padStart(4,'0')),html,footer,'640px')}

function editRetirada(id){var r=retDB.retiradas.find(function(x){return x.id===id});if(!r){  toast('Retirada não encontrada','error');return}
  editingId=id;currentRet=r;photos=r.fotos||[];
  document.getElementById('osId').value=r.osId||'';
  document.getElementById('clienteNome').value=r.cliente||'';
  document.getElementById('clienteTel').value=r.telefone||'';
  document.getElementById('equipamento').value=r.equipamento||'';
  document.getElementById('marca').value=r.marca||'';
  document.getElementById('modelo').value=r.modelo||'';
  document.getElementById('imei').value=r.imei||'';
  document.getElementById('defeito').value=r.defeito||'';
  document.getElementById('acessorios').value=r.acessorios||'';
  document.getElementById('obs').value=r.obs||'';
  document.getElementById('garantia').value=r.garantia||'90 dias';
  document.getElementById('valor').value=r.valor||'';
  document.getElementById('tecnico').value=r.tecnico||'';
  setTerceiro(r.terceiro);if(r.terceiro){document.getElementById('terceiroNome').value=r.terceiroNome||'';document.getElementById('terceiroDoc').value=r.terceiroDoc||''}
  renderPhotos();
  document.getElementById('searchQuery').textContent='Editando: '+(r.numero||'RET-'+String(r.id).padStart(4,'0'));
  goToStep('form')}

function cancelRetirada(id){if(!confirm('Tem certeza que deseja cancelar esta retirada?'))return
  var r=retDB.retiradas.find(function(x){return x.id===id});if(!r)return;r.status='cancelada';r.auditoria=r.auditoria||[];r.auditoria.push({data:hoje(),hora:hora(),usuario:'Admin',acao:'Retirada cancelada'});saveRetDB();toast('Retirada cancelada','warning');renderHistory()}

function generatePDF(id){var r=id?retDB.retiradas.find(function(x){return x.id===id}):currentRet;if(!r){toast('Nenhuma retirada para gerar PDF','error');return}
  if(typeof window.jspdf==='undefined'&&typeof jspdf==='undefined'){toast('Carregando jsPDF, tente novamente...','info');var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=function(){toast('jsPDF carregado!','success');generatePDF(id)};document.head.appendChild(s);return}
  try{
    var _j=(window.jspdf||{}).jsPDF||jspdf;if(!_j){toast('jsPDF no disponvel','error');return}
    var doc=new _j({unit:'mm',format:'a4',orientation:'portrait'});var pageW=210;var margin=15;var y=margin;var lineH=7;var pageH=297;
    function h(t){return escH(String(t||''))}
    function chkPage(need){if(y+need>pageH-margin){doc.addPage();y=margin}}
    function heading(text){chkPage(16);doc.setFontSize(14);doc.setFont('helvetica','bold');doc.setTextColor(0,100,148);doc.text(text,margin,y);y+=9;doc.setDrawColor(0,150,200);doc.setLineWidth(0.5);doc.line(margin,y-3,pageW-margin,y-3);y+=2}
    function field(label,value){chkPage(lineH+2);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(100);doc.text(label+':',margin,y);doc.setFont('helvetica','normal');doc.setTextColor(40);var v=String(value||'—');doc.text(v,margin+doc.getTextWidth(label+': ')+2,y);y+=lineH}
    function wrapField(label,value){chkPage(lineH*2);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(100);doc.text(label+':',margin,y);doc.setFont('helvetica','normal');doc.setTextColor(40);var v=String(value||'—');var maxW=pageW-margin*2-5;var lines=doc.splitTextToSize(v,maxW);doc.text(lines,margin+30,y);y+=lines.length*lineH+2}
    var num=r.numero||'RET-'+String(r.id).padStart(4,'0');var dt=dataBr(r.dataRetirada)+' s '+r.horaRetirada;
    doc.setFillColor(0,100,148);doc.rect(0,0,pageW,25,'F');doc.setTextColor(255);doc.setFontSize(18);doc.setFont('helvetica','bold');doc.text('COMPROVANTE DE RETIRADA',margin,16);doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text(num+' | '+dt,margin,22);
    y=32;heading('INFORMAES DA RETIRADA');
    field('Retirada',num);field('Data',dt);field('Tcnico',r.tecnico||'—');
    y+=3;heading('CLIENTE');
    field('Nome',r.cliente);field('Telefone',r.telefone||'—');if(r.terceiro){field('Retirado por',r.terceiroNome||'—');field('Documento',r.terceiroDoc||'—')}
    y+=3;heading('EQUIPAMENTO');
    field('Equipamento',r.equipamento);field('Marca/Modelo',[r.marca,r.modelo].filter(Boolean).join(' / '));field('IMEI',r.imei||'—');wrapField('Defeito',r.defeito);field('Acessrios',r.acessorios||'Nenhum');field('Garantia',r.garantia||'90 dias');if(r.valor)field('Valor',fmt$(r.valor));if(r.obs)wrapField('Observaes',r.obs)
    y+=3;heading('TERMO DE DECLARAO');
    doc.setFontSize(8);doc.setFont('helvetica','italic');doc.setTextColor(80);var termText='Eu, '+r.cliente+', declaro que recebi o equipamento '+r.equipamento+' em perfeitas condies de funcionamento e aparncia, conforme descrito neste comprovante. Estou ciente de que a garantia cobre apenas defeitos de fabricao e no abrange mau uso, queda, contato com lquidos ou descargas eltricas. O prazo de garantia '+r.garantia+' dias a partir desta data.';
    var lines=doc.splitTextToSize(termText,pageW-margin*2);doc.text(lines,margin,y);y+=lines.length*lineH+4;
    if(r.assinatura){chkPage(30);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(100);doc.text('ASSINATURA',margin,y);y+=8;
      try{doc.addImage(r.assinatura,'PNG',margin,y,50,15)}catch(e){doc.setFontSize(8);doc.text('[Assinatura digital]',margin,y)};y+=18}
    doc.setFontSize(7);doc.setTextColor(150);doc.text('Documento gerado em '+hoje()+' s '+hora()+' pelo sistema InfoCelll.',margin,pageH-10);doc.text('InfoCelll – Av. Fagundes Varela, 380 - Loja 11 - Jardim Atlantico - Olinda-PE',margin,pageH-5);
    doc.save(num+'.pdf');toast('PDF gerado: '+num+'.pdf','success')
  }catch(e){toast('Erro ao gerar PDF: '+e.message,'error');console.error('[Retirada] PDF error:',e)}}

function dashboardBtn(){window.location.href='dashboard.html'}

// ===== NOVAS FUNÇÕES: Imprimir, Exportar, Compartilhar, Copiar =====

function imprimirComprovante(){
  if(!currentRet){toast('Nenhum comprovante para imprimir','error');return}
  window.print()
}

function exportarComprovante(){
  if(!currentRet){toast('Nenhum comprovante para exportar','error');return}
  var r=currentRet
  var html=
    '<div style="padding:8px 0">'+
    '<p style="color:var(--txt3);font-size:12px;margin-bottom:16px">Exportar dados do comprovante</p>'+
    '<button class="btn btn-block btn-primary" onclick="closeModal();exportarJSON()" style="margin-bottom:8px;justify-content:center">'+
    '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'+
    '  Exportar como JSON'+
    '</button>'+
    '<button class="btn btn-block btn-secondary" onclick="closeModal();exportarCSV()" style="margin-bottom:8px;justify-content:center">'+
    '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'+
    '  Exportar como CSV'+
    '</button>'+
    '<button class="btn btn-block btn-secondary" onclick="closeModal();exportarTXT()" style="justify-content:center">'+
    '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'+
    '  Exportar como TXT'+
    '</button>'+
    '</div>'
  showModal('Exportar Comprovante',html,'','400px')
}

function exportarJSON(){
  if(!currentRet){toast('Nenhum comprovante','error');return}
  var r=currentRet
  var dados={
    tipo:'comprovante_retirada',
    sistema:'InfoCelll',
    numero:r.numero||'RET-'+String(r.id).padStart(4,'0'),
    cliente:r.cliente,
    telefone:r.telefone,
    equipamento:r.equipamento,
    marca:r.marca,
    modelo:r.modelo,
    imei:r.imei,
    defeito:r.defeito,
    acessorios:r.acessorios,
    garantia:r.garantia,
    valor:r.valor,
    tecnico:r.tecnico,
    terceiro:r.terceiro?{nome:r.terceiroNome,documento:r.terceiroDoc}:null,
    dataRetirada:r.dataRetirada,
    horaRetirada:r.horaRetirada,
    status:r.status,
    observacoes:r.obs,
    auditoria:r.auditoria
  }
  var json=JSON.stringify(dados,null,2)
  downloadFile(json,'application/json',(r.numero||'RET-'+String(r.id).padStart(4,'0'))+'.json')
  toast('JSON exportado!','success')
}

function exportarCSV(){
  if(!currentRet){toast('Nenhum comprovante','error');return}
  var r=currentRet
  var headers='Campo;Valor\n'
  var linhas=[
    ['Número',r.numero||'RET-'+String(r.id).padStart(4,'0')],
    ['Cliente',r.cliente],
    ['Telefone',r.telefone||''],
    ['Equipamento',r.equipamento],
    ['Marca',r.marca||''],
    ['Modelo',r.modelo||''],
    ['IMEI',r.imei||''],
    ['Defeito',r.defeito||''],
    ['Acessórios',r.acessorios||''],
    ['Garantia',r.garantia||''],
    ['Valor',r.valor||''],
    ['Técnico',r.tecnico||''],
    ['Terceiro',r.terceiro?r.terceiroNome+' ('+r.terceiroDoc+')':'Próprio cliente'],
    ['Data',r.dataRetirada],
    ['Hora',r.horaRetirada],
    ['Status',r.status||''],
    ['Observações',r.obs||'']
  ]
  var csv=headers+linhas.map(function(l){return l.map(function(v){return'"'+String(v||'').replace(/"/g,'""')+'"'}).join(';')}).join('\n')
  downloadFile(csv,'text/csv;charset=utf-8',(r.numero||'RET-'+String(r.id).padStart(4,'0'))+'.csv')
  toast('CSV exportado!','success')
}

function exportarTXT(){
  if(!currentRet){toast('Nenhum comprovante','error');return}
  var r=currentRet
  var linha=function(k,v){return k+': '+(v||'—')+'\n'}
  var txt='=== COMPROVANTE DE RETIRADA ===\n\n'
  txt+=linha('Número',r.numero||'RET-'+String(r.id).padStart(4,'0'))
  txt+=linha('Data',dataBr(r.dataRetirada)+' às '+r.horaRetirada)
  txt+=linha('Cliente',r.cliente)
  txt+=linha('Telefone',r.telefone)
  txt+=linha('Equipamento',r.equipamento+(r.marca?' - '+r.marca:'')+(r.modelo?' - '+r.modelo:''))
  txt+=linha('IMEI',r.imei)
  txt+=linha('Defeito',r.defeito)
  txt+=linha('Acessórios',r.acessorios)
  txt+=linha('Garantia',r.garantia)
  if(r.valor)txt+=linha('Valor',fmt$(r.valor))
  txt+=linha('Técnico',r.tecnico)
  txt+=linha('Retirado por',r.terceiro?r.terceiroNome+' ('+r.terceiroDoc+')':'Próprio cliente')
  txt+=linha('Observações',r.obs)
  txt+='\n--- Documento gerado por InfoCelll em '+hoje()+' às '+hora()+' ---'
  downloadFile(txt,'text/plain;charset=utf-8',(r.numero||'RET-'+String(r.id).padStart(4,'0'))+'.txt')
  toast('TXT exportado!','success')
}

function downloadFile(content,mimeType,filename){
  var blob=new Blob([content],{type:mimeType})
  var url=URL.createObjectURL(blob)
  var a=document.createElement('a')
  a.href=url
  a.download=filename
  document.body.appendChild(a)
  a.click()
  setTimeout(function(){
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },100)
}

function compartilharWhatsApp(){
  if(!currentRet){toast('Nenhum comprovante para compartilhar','error');return}
  var r=currentRet
  var num=r.numero||'RET-'+String(r.id).padStart(4,'0')
  var dt=dataBr(r.dataRetirada)+' às '+r.horaRetirada
  var txt='🧾 *COMPROVANTE DE RETIRADA*\n'
  txt+='📋 Número: '+num+'\n'
  txt+='📅 Data: '+dt+'\n'
  txt+='👤 Cliente: '+r.cliente+'\n'
  txt+='📱 Equipamento: '+r.equipamento+(r.marca?' ('+r.marca+')':'')+'\n'
  if(r.imei)txt+='🔢 IMEI: '+r.imei+'\n'
  if(r.defeito)txt+='🔧 Defeito: '+r.defeito+'\n'
  if(r.acessorios)txt+='📦 Acessórios: '+r.acessorios+'\n'
  txt+='🛡️ Garantia: '+(r.garantia||'90 dias')+'\n'
  if(r.valor)txt+='💰 Valor: '+fmt$(r.valor)+'\n'
  txt+='👨‍🔧 Técnico: '+(r.tecnico||'Silvio')+'\n'
  txt+='📌 Retirado por: '+(r.terceiro?r.terceiroNome+' ('+r.terceiroDoc+')':'Próprio cliente')+'\n\n'
  txt+='✅ _Documento gerado pelo sistema InfoCelll_'
  var encoded=encodeURIComponent(txt)
  window.open('https://wa.me/?text='+encoded,'_blank')
  toast('WhatsApp aberto!','success')
}

function copiarResumo(){
  if(!currentRet){toast('Nenhum comprovante para copiar','error');return}
  var r=currentRet
  var num=r.numero||'RET-'+String(r.id).padStart(4,'0')
  var dt=dataBr(r.dataRetirada)+' às '+r.horaRetirada
  var txt='COMPROVANTE DE RETIRADA\n'
  txt+='Número: '+num+' | Data: '+dt+'\n'
  txt+='Cliente: '+r.cliente+(r.telefone?' ('+r.telefone+')':'')+'\n'
  txt+='Equipamento: '+r.equipamento+(r.marca?' - '+r.marca:'')+(r.modelo?' - '+r.modelo:'')+'\n'
  if(r.imei)txt+='IMEI: '+r.imei+'\n'
  if(r.defeito)txt+='Defeito: '+r.defeito+'\n'
  txt+='Garantia: '+(r.garantia||'90 dias')+'\n'
  if(r.valor)txt+='Valor: '+fmt$(r.valor)+'\n'
  txt+='Técnico: '+(r.tecnico||'Silvio')+'\n'
  txt+='InfoCelll - '+hoje()
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){
      toast('Resumo copiado!','success')
    }).catch(function(){
      fallbackCopy(txt)
    })
  }else{fallbackCopy(txt)}
}

function fallbackCopy(text){
  var ta=document.createElement('textarea')
  ta.value=text
  ta.style.position='fixed'
  ta.style.opacity='0'
  document.body.appendChild(ta)
  ta.select()
  try{document.execCommand('copy');toast('Resumo copiado!','success')}catch(e){toast('Erro ao copiar','error')}
  document.body.removeChild(ta)
}

// Atalho de teclado Ctrl+P para imprimir
document.addEventListener('keydown',function(e){
  if(e.ctrlKey&&e.key==='p'&&currentStep==='preview'&&currentRet){
    e.preventDefault()
    imprimirComprovante()
  }
})
