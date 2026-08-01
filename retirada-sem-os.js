var RET_KEY='ic_retirada_sem_os';
var DASH_KEY='ic_dashboard';
var retDB={retiradas:[],config:{proximoNumero:1}};
var currentOS=null,currentRet=null,photos=[],fotosCliente=[],fotosDoc=[],fotosEntrega=[];
var currentStep='search',editingId=null;
var _secUUID='',_secProtocolo='',_secIP='—',_secGeo='';
var CHECKLIST_PREMIUM=['Documento original apresentado','Documento conferido','CPF validado','Cliente localizado no sistema','Proprietário confirmado','Terceiro autorizado','OS localizada','Pagamento confirmado','Garantia conferida','IMEI conferido','Número de série conferido','Equipamento conferido','Acessórios conferidos','Fotos registradas','Entrega autorizada'];

function buildTerm(cliente,equip,motivo,osCode){
  var d=new Date();var dataTxt=d.toLocaleDateString('pt-BR');
  return '<h4>TERMO DE RETIRADA SEM APRESENTAÇÃO DA ORDEM DE SERVIÇO</h4>'+
  '<p>Eu, <strong>'+(cliente||'______________')+'</strong>'+(motivo?', motivando esta solicitação por <strong>'+motivo+'</strong>':'')+', venho por meio deste solicitar a <strong>RETIRADA</strong> do equipamento <strong>'+(equip||'______________')+'</strong>'+(osCode&&osCode!=='______________'?' vinculado à Ordem de Serviço <strong>'+osCode+'</strong>':'')+' da <strong>InfoCelll</strong>, em <strong>'+dataTxt+'</strong>.</p>'+
  '<p>Declaro para os devidos fins de direito que:</p><ul>'+
  '<li>Solicito a retirada do equipamento sem apresentação da Ordem de Serviço original;</li>'+
  '<li>Sou o proprietário do equipamento ou estou devidamente autorizado pelo proprietário;</li>'+
  '<li>Confirmo que os dados informados neste termo são verdadeiros;</li>'+
  '<li>Assumo integral responsabilidade pelas informações fornecidas;</li>'+
  '<li>Confirmei o equipamento e os acessórios antes do recebimento;</li>'+
  '<li>Recebi o equipamento após conferência realizada no ato;</li>'+
  '<li>Reconheço que a retirada foi realizada mediante solicitação própria;</li>'+
  '<li>Mantenho todos os meus direitos previstos em lei.</li></ul>'+
  '<p>O equipamento foi entregue em perfeitas condições de funcionamento e aparência, conforme descrito neste termo.</p>';
}

function loadRetDB(){try{var d=localStorage.getItem(RET_KEY);if(d){retDB=JSON.parse(d);if(!retDB.retiradas)retDB.retiradas=[];if(!retDB.config)retDB.config={proximoNumero:1}} }catch(e){console.warn('[Retirada] Erro ao carregar dados:',e)}}
function saveRetDB(){try{localStorage.setItem(RET_KEY,JSON.stringify(retDB))}catch(e){console.warn('[Retirada] Erro ao salvar:',e)}}
function loadDashOS(){try{var d=localStorage.getItem(DASH_KEY);if(d){var db=JSON.parse(d);return db.os||[]}return[]}catch(e){return[]}}
function loadDashDB(){try{var d=localStorage.getItem(DASH_KEY);if(d){return JSON.parse(d)}return{}}catch(e){return{}}}

var _debounceTimer=null
function debounceSearch(){clearTimeout(_debounceTimer);_debounceTimer=setTimeout(function(){searchOS()},300)}

function fmt$(v){if(v===null||v===undefined||v==='')return'R$ 0,00';var n=parseFloat(String(v).replace(/[^\d.,-]/g,'').replace(',','.'));if(isNaN(n))return'R$ 0,00';return'R$ '+n.toFixed(2).replace('.',',')}
function escH(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function hoje(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function hora(){var d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function dataBr(d){if(!d)return'';var p=String(d).split('-');if(p.length!==3)return d;return p[2]+'/'+p[1]+'/'+p[0]}
function fmtDateTime(d,t){return dataBr(d)+' às '+t}
function nextNum(){retDB.config.proximoNumero=retDB.config.proximoNumero||1;return retDB.config.proximoNumero++}
function uuid(){try{if(window.crypto&&crypto.randomUUID)return crypto.randomUUID()}catch(e){}return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);return v.toString(16)})}
function getCurrentUser(){var db=loadDashDB();return db.config&&(db.config.currentUser||db.config.username)||'Admin'}

function toast(msg,type){type=type||'success';var ctn=document.getElementById('toastCtn');if(!ctn){ctn=document.createElement('div');ctn.id='toastCtn';ctn.className='toast-container';document.body.appendChild(ctn)}
  var icons={success:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',error:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',warning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'};var el=document.createElement('div');el.className='toast toast-'+type;el.innerHTML=icons[type]||icons.success+'<span>'+msg+'</span>';ctn.appendChild(el);setTimeout(function(){el.style.opacity='0';el.style.transform='translateX(40px)';setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el)},300)},3500)}

function showModal(title,bodyHtml,footerHtml,width){var overlay=document.getElementById('modalOverlay');if(!overlay){overlay=document.createElement('div');overlay.id='modalOverlay';overlay.className='modal-overlay';overlay.onclick=function(e){if(e.target===this)closeModal()};document.body.appendChild(overlay);overlay.innerHTML='<div class="modal" id="modalContent"><div class="modal-header"><span class="modal-title"></span><button class="modal-close" onclick="closeModal()">&times;</button></div><div class="modal-body"></div><div class="modal-footer"></div></div>'}
  document.querySelector('#modalContent .modal-title').textContent=title||'';
  document.querySelector('#modalContent .modal-body').innerHTML=bodyHtml||'';
  document.querySelector('#modalContent .modal-footer').innerHTML=footerHtml||'';
  if(width)document.getElementById('modalContent').style.maxWidth=width;
  overlay.classList.add('visible')}
function closeModal(){var o=document.getElementById('modalOverlay');if(o)o.classList.remove('visible')}

function updateProgress(step){
  var pct={search:25,form:60,preview:100,history:50}[step]||25;
  var fill=document.getElementById('progressFill');if(fill)fill.style.width=pct+'%';
  document.querySelectorAll('.step').forEach(function(e){
    var s=e.getAttribute('data-step');
    var idx={search:0,form:1,preview:2,history:3}[step]||0;
    var i={search:0,form:1,preview:2,history:3}[s]||0;
    e.classList.toggle('active',s===step);
    e.classList.toggle('completed',i<idx);
  });
}

function goToStep(step){document.querySelectorAll('.section-panel').forEach(function(e){e.classList.remove('active')});document.getElementById('panel-'+step).classList.add('active');currentStep=step;updateProgress(step);if(step==='history')renderHistory();if(step==='form'&&currentOS)fillOSData()}

function initRetirada(){
  loadRetDB();
  _secUUID=uuid();
  _secProtocolo='PRT-'+Date.now().toString(36).toUpperCase().slice(-6);
  var num=nextNum();retDB.config.proximoNumero--;saveRetDB();
  document.getElementById('termoNumero').textContent='RET-'+String(num).padStart(4,'0');
  document.getElementById('termoUUID').textContent=_secUUID;
  document.getElementById('termoProtocolo').textContent=_secProtocolo;
  document.getElementById('termoUsuario').textContent=escH(getCurrentUser());
  document.getElementById('termoDataHora').textContent=hoje()+' '+hora();
  setupPhotoCapture();buildChecklistPremium();renderHistory();getClientIP();goToStep('search');
}

function buildChecklistPremium(){
  var grid=document.getElementById('checklistPremiumGrid');
  if(!grid)return;
  grid.innerHTML=CHECKLIST_PREMIUM.map(function(item){return'<label class="checklist-item"><input type="checkbox" data-premium="1"><span class="check-icon"></span><span>'+item+'</span></label>'}).join('');
  grid.querySelectorAll('.checklist-item').forEach(function(el){el.addEventListener('click',function(e){if(e.target.tagName!=='INPUT'){var cb=this.querySelector('input[type="checkbox"]');if(cb){cb.checked=!cb.checked;this.classList.toggle('checked',cb.checked)}}})});
}

function searchScore(text,query){
  if(!text||!query)return 0;text=String(text).toLowerCase();query=String(query).toLowerCase()
  if(text===query)return 100;if(text.startsWith(query))return 80
  var idx=text.indexOf(query);if(idx!==-1)return 60-idx
  var words=query.split(/\s+/);var matchCount=0;words.forEach(function(w){if(w.length>1&&text.indexOf(w)!==-1)matchCount++})
  return matchCount*20}

function osCodeOf(o){return o&&(o.osCode||'OS-'+String(o.id).padStart(4,'0'))}
function osStatusLabel(s){var m={'recebida':'Recebida','em-diagnostico':'Diagnóstico','aguardando-Aprovação':'Aguarda Aprovação','aguardando-aprovacao':'Aguarda Aprovação','aguardando-Aprovao':'Aguarda Aprovação','em-reparo':'Em Reparo','em-andamento':'Em andamento','em-analise':'Em análise','teste':'Teste','pronta':'Pronta','entregue':'Entregue','cancelado':'Cancelado'};return m[s]||s||'—'}
function stColorOf(s){var m={'recebida':'#f97316','em-diagnostico':'#3b82f6','aguardando-Aprovação':'#eab308','aguardando-aprovacao':'#eab308','aguardando-Aprovao':'#eab308','em-reparo':'#06b6d4','em-andamento':'#06b6d4','em-analise':'#06b6d4','teste':'#a855f7','pronta':'#22c55e','entregue':'#22c55e','cancelado':'#ef4444'};return m[s]||'#06b6d4'}
function skipBtnHTML(){return '<div style="margin-top:10px;text-align:center"><button class="btn btn-secondary" onclick="skipSearch()">Prossiga sem vínculo</button></div>'}
function proceedNoLink(){document.getElementById('searchQuery').textContent='Sem vínculo de OS';goToStep('form')}
function matchOSByClient(c){
  var qName=String(c.nome||'').toLowerCase().trim()
  var qTel=String(c.telefone||c.whatsapp||'').replace(/\D/g,'')
  var qCpf=String(c.cpf||'').replace(/\D/g,'')
  return (loadDashDB().os||[]).filter(function(o){
    var cn=String(o.cliente||'').toLowerCase()
    if(qName&&(cn.indexOf(qName)>-1||qName.indexOf(cn)>-1))return true
    if(qTel&&qTel.length>=8&&(String(o.telefone||'').replace(/\D/g,'').indexOf(qTel)>-1||String(o.whatsapp||'').replace(/\D/g,'').indexOf(qTel)>-1))return true
    if(qCpf&&qCpf.length>=8&&String(o.cpf||'').replace(/\D/g,'')===qCpf)return true
    return false
  })
}
function matchOSByProduct(p){
  var names=[p.nome,p.modelo,p.marca].filter(Boolean).map(function(s){return String(s).toLowerCase().trim()})
  return (loadDashDB().os||[]).filter(function(o){
    var ap=String(o.aparelho||o.equipamento||'').toLowerCase().trim()
    var mo=String(o.modelo||'').toLowerCase().trim()
    var ma=String(o.marca||'').toLowerCase().trim()
    if(!ap&&!mo&&!ma)return false
    return names.some(function(n){
      if(!n)return false
      return (ap&&(ap.indexOf(n)>-1||n.indexOf(ap)>-1))||(mo&&n.indexOf(mo)>-1)||(ma&&n.indexOf(ma)>-1)
    })
  })
}
function renderLinkedOS(list,title,emptyMsg){
  var ctn=document.getElementById('searchResults')
  if(!list.length){
    ctn.innerHTML='<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><h3>'+emptyMsg+'</h3><p>Você pode prosseguir preenchendo os dados manualmente</p></div>'+skipBtnHTML()
    return
  }
  ctn.innerHTML='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-size:11px;color:var(--txt3)">'+title+' ('+list.length+')</span><button class="btn btn-secondary btn-sm" onclick="proceedNoLink()" style="margin-left:auto;padding:4px 10px;font-size:10px">Prossiga sem vínculo</button></div>'+
    '<div style="display:flex;flex-direction:column;gap:6px">'+list.map(function(o){
    var stc=stColorOf(o.status)
    return '<div class="card result-card" style="cursor:pointer;padding:12px" onclick="selectResult(\'os\','+o.id+')">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">'+
      '<div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">'+
      '<span style="font-size:16px;flex-shrink:0">🔧</span>'+
      '<div style="min-width:0"><strong style="color:var(--cyan);font-size:14px">'+escH(osCodeOf(o))+'</strong>'+
      '<div style="font-size:11px;color:var(--txt3);margin-top:1px;word-wrap:break-word">'+escH(o.cliente||'')+' – '+escH(o.aparelho||o.equipamento||'—')+'</div></div></div>'+
      '<div style="text-align:right;flex-shrink:0"><span class="badge" style="background:'+stc+'20;color:'+stc+';font-size:9px">'+osStatusLabel(o.status)+'</span></div></div></div>'
  }).join('')+'</div>'+skipBtnHTML()
}

function searchOS(autoSelect){
  var query=document.getElementById('searchInput').value.trim();if(!query){toast('Digite um termo para buscar','warning');return}
  var db=loadDashDB();var results=[];var q=query.toLowerCase();var qNum=q.replace(/\D/g,'')
  var osList=db.os||[]
  osList.forEach(function(o){
    var score=0;var linkTag=''
    var osCode=osCodeOf(o)
    var osText=[o.cliente,o.aparelho,o.equipamento,o.marca,o.modelo,o.imei,o.imei2,o.serie||o.serial,o.patrimonio,o.cpf,o.telefone,o.whatsapp,o.osCode,o.defeito,o.Endereco||o.Endereço].filter(Boolean).join(' ')
    var fields=['cliente','aparelho','equipamento','telefone','whatsapp','defeito','marca','modelo','cor','senha','cpf','obs','rg','codigoInterno','codigo','patrimonio','serie']
    fields.forEach(function(f){var v=o[f]||'';score=Math.max(score,searchScore(v,q)*2)})
    score=Math.max(score,searchScore(osText,q)*1.5)
    if(String(o.id)===q||String(osCode).toLowerCase()===q)score=Math.max(score,250)
    if(qNum.length>=5){
      [o.imei,o.imei2,o.serie||o.serial,o.patrimonio].forEach(function(im){
        if(String(im||'').replace(/\D/g,'').indexOf(qNum)>-1){score=Math.max(score,200);linkTag='Equipamento (IMEI/Série)'}
      })
      if((o.cpf||'').replace(/\D/g,'')===qNum){score=Math.max(score,120);linkTag=linkTag||'CPF'}
    }
    if(qNum.length&&(o.telefone||'').replace(/\D/g,'').indexOf(qNum)!==-1)score=Math.max(score,70)
    if(qNum.length&&(o.whatsapp||'').replace(/\D/g,'').indexOf(qNum)!==-1)score=Math.max(score,70)
    if(score>0)results.push({type:'os',data:o,score:score,label:osCode,sub:o.cliente+' – '+(o.aparelho||o.equipamento||'—'),linkTag:linkTag})
  })
  var clientes=db.clients||db.clientes||[]
  clientes.forEach(function(c){
    var score=0
    score=Math.max(score,searchScore(c.nome,q)*2)
    score=Math.max(score,searchScore(c.telefone,q))
    score=Math.max(score,searchScore(c.whatsapp||c.telefone,q))
    score=Math.max(score,searchScore(c.email,q))
    score=Math.max(score,searchScore(c.cpf,q))
    score=Math.max(score,searchScore(c.rg,q))
    if(qNum.length&&(c.telefone||'').replace(/\D/g,'').indexOf(qNum)!==-1)score=Math.max(score,70)
    if(qNum.length&&(c.cpf||'').replace(/\D/g,'')===qNum)score=Math.max(score,120)
    if(score>0)results.push({type:'cli',data:c,score:score,label:c.nome,sub:(c.telefone||'')+(c.email?' | '+c.email:'')})
  })
  var products=db.products||db.produtos||[]
  products.forEach(function(p){
    var score=0
    score=Math.max(score,searchScore(p.nome,q)*2)
    score=Math.max(score,searchScore(p.marca,q))
    score=Math.max(score,searchScore(p.modelo,q))
    score=Math.max(score,searchScore(p.codigo,q))
    score=Math.max(score,searchScore(p.desc,q))
    if(score>0)results.push({type:'prd',data:p,score:score,label:p.nome,sub:(p.marca||'')+(p.modelo?' '+p.modelo:'')+' | '+fmt$(p.venda||0)})
  })
  var servicos=db.servicos||db.services||db.Serviços||[]
  servicos.forEach(function(s){
    var score=0
    score=Math.max(score,searchScore(s.nome,q)*2)
    score=Math.max(score,searchScore(s.desc,q))
    if(score>0)results.push({type:'svc',data:s,score:score,label:s.nome,sub:s.desc||''})
  })
  results.sort(function(a,b){return b.score-a.score})
  results=results.slice(0,30)
  if(autoSelect&&results.length){
    var top=results[0]
    if(top.type==='os'&&top.score>=200){selectResult('os',top.data.id);return}
    if(results.length===1&&top.type==='os'&&top.score>=90){selectResult('os',top.data.id);return}
    if(results.length===1&&top.type==='cli'&&top.score>=120){selectResult('cli',top.data.id);return}
  }
  renderSearchResults(results)}

function renderSearchResults(results){
  var ctn=document.getElementById('searchResults')
  var notFound='<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><h3>Nenhum resultado encontrado</h3><p>Tente alterar o termo de busca ou prossiga sem vínculo</p></div>'
  if(!results.length){ctn.innerHTML=notFound+skipBtnHTML();return}
  var typeColors={os:'var(--cyan)',cli:'var(--grn)',prd:'var(--ylw)',svc:'var(--pur)'}
  var typeLabels={os:'OS',cli:'Cliente',prd:'Produto',svc:'Serviço'}
  var typeIcons={os:'🔧',cli:'👤',prd:'📦',svc:'🛠️'}
  ctn.innerHTML='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">'+
    '<span style="font-size:11px;color:var(--txt3)">'+results.length+' resultado(s)</span>'+
    '<button class="btn btn-secondary btn-sm" onclick="skipSearch()" style="margin-left:auto;padding:4px 10px;font-size:10px">Prossiga sem vínculo</button></div>'+
    '<div style="display:flex;flex-direction:column;gap:6px">'+results.map(function(r,i){
    var tc=typeColors[r.type]||'var(--txt3)'
    var tl=typeLabels[r.type]||r.type
    var ic=typeIcons[r.type]||'•'
    var extra=''
    if(r.type==='os'){
      var stc=stColorOf(r.data.status)
      extra='<div style="text-align:right;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:2px">'+
        '<span class="badge" style="background:'+stc+'20;color:'+stc+';font-size:9px">'+osStatusLabel(r.data.status)+'</span>'+
        (r.linkTag?'<span class="badge" style="background:rgba(250,204,21,.15);color:#facc15;font-size:8px">🔗 '+escH(r.linkTag)+'</span>':'')+
        '</div>'
    }else{
      extra='<div style="text-align:right;flex-shrink:0"><span class="badge" style="background:'+tc+'20;color:'+tc+';font-size:9px">'+tl+'</span></div>'
    }
    return'<div class="card result-card" style="cursor:pointer;padding:12px;animation-delay:'+(i*30)+'ms" onclick="selectResult(\''+r.type+'\','+r.data.id+')">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">'+
      '<div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">'+
      '<span style="font-size:16px;flex-shrink:0">'+ic+'</span>'+
      '<div style="min-width:0"><strong style="color:'+tc+';font-size:14px">'+escH(r.label)+'</strong>'+
      '<div style="font-size:11px;color:var(--txt3);margin-top:1px;word-wrap:break-word">'+escH(r.sub||'')+'</div></div></div>'+
      extra+
      '</div></div>'
  }).join('')+'</div>'}

function selectResult(type,id){
  var db=loadDashDB()
  if(type==='os'){
    var o=(db.os||[]).find(function(x){return String(x.id)===String(id)})
    if(!o){toast('OS não encontrada','error');return}
    currentOS=o;currentRet=null;editingId=null;photos=[];fotosCliente=[];fotosDoc=[];fotosEntrega=[];resetForm()
    toast('OS '+escH(o.osCode||'OS-'+String(o.id).padStart(4,'0'))+' selecionada','success')
    document.getElementById('searchQuery').textContent=(o.osCode||'OS-'+String(o.id).padStart(4,'0'))+' – '+escH(o.cliente||'')
    document.getElementById('osId').value=o.id||''
    fillOSData()
    goToStep('form')
  }else if(type==='cli'){
    var c=(db.clients||db.clientes||[]).find(function(x){return String(x.id)===String(id)})
    if(!c){toast('Cliente não encontrado','error');return}
    currentOS=null;currentRet=null;editingId=null;photos=[];fotosCliente=[];fotosDoc=[];fotosEntrega=[];resetForm()
    toast('Cliente '+escH(c.nome)+' selecionado','success')
    document.getElementById('searchQuery').textContent='Cliente: '+escH(c.nome)
    document.getElementById('clienteNome').value=c.nome||''
    document.getElementById('clienteTel').value=c.telefone||''
    document.getElementById('clienteWhatsapp').value=c.whatsapp||c.telefone||''
    document.getElementById('clienteCpf').value=c.cpf||''
    document.getElementById('clienteEmail').value=c.email||''
    document.getElementById('clienteEndereco').value=c.Endereco||c.Endereço||c.endereco||''
    var linked=matchOSByClient(c)
    if(linked.length===1){toast('OS '+osCodeOf(linked[0])+' vinculada automaticamente','success');selectResult('os',linked[0].id);return}
    renderLinkedOS(linked,'OS deste cliente','Nenhuma OS vinculada a este cliente')
  }else if(type==='prd'){
    var p=(db.products||db.produtos||[]).find(function(x){return String(x.id)===String(id)})
    if(!p){toast('Produto não encontrado','error');return}
    currentOS=null;currentRet=null;editingId=null;photos=[];fotosCliente=[];fotosDoc=[];fotosEntrega=[];resetForm()
    toast('Equipamento '+escH(p.nome)+' selecionado','success')
    document.getElementById('searchQuery').textContent='Equipamento: '+escH(p.nome)
    document.getElementById('equipamento').value=p.nome||''
    document.getElementById('marca').value=p.marca||''
    document.getElementById('modelo').value=p.modelo||''
    var linked=matchOSByProduct(p)
    if(linked.length===1){toast('OS '+osCodeOf(linked[0])+' vinculada ao equipamento','success');selectResult('os',linked[0].id);return}
    renderLinkedOS(linked,'OS vinculadas ao equipamento','Nenhuma OS vinculada a este equipamento')
  }else if(type==='svc'){
    var sv=(db.servicos||db.services||db.Serviços||[]).find(function(x){return String(x.id)===String(id)})
    if(!sv){toast('Serviço não encontrado','error');return}
    toast('Serviço '+escH(sv.nome)+' selecionado','success')
    document.getElementById('servicoRealizado').value=sv.nome||''
    document.getElementById('valorServico').value=sv.Preo||sv.preco||sv.valor||''
    goToStep('form')
  }
}

function resetForm(){
  document.getElementById('osId').value=''
  document.getElementById('numeroOS').value=''
  document.getElementById('osCodeDisplay').value=''
  document.getElementById('osStatusDisplay').value=''
  document.getElementById('clienteNome').value=''
  document.getElementById('clienteCpf').value=''
  document.getElementById('clienteRg').value=''
  document.getElementById('clienteTel').value=''
  document.getElementById('clienteWhatsapp').value=''
  document.getElementById('clienteEmail').value=''
  document.getElementById('clienteEndereco').value=''
  document.getElementById('equipamento').value=''
  document.getElementById('tipoAparelho').value=''
  document.getElementById('marca').value=''
  document.getElementById('modelo').value=''
  document.getElementById('cor').value=''
  document.getElementById('imei').value=''
  document.getElementById('imei2').value=''
  document.getElementById('serie').value=''
  document.getElementById('patrimonio').value=''
  document.getElementById('senha').value=''
  document.getElementById('estadoFisico').value=''
  document.getElementById('acessorios').value=''
  document.getElementById('dataEntrada').value=''
  document.getElementById('dataConclusao').value=''
  document.getElementById('servicoRealizado').value=''
  document.getElementById('valorServico').value=''
  document.getElementById('pagamento').value=''
  document.getElementById('defeito').value=''
  document.getElementById('obs').value=''
  document.getElementById('garantia').value='90 dias'
  document.getElementById('valor').value=''
  document.getElementById('tecnico').value=''
  document.querySelectorAll('input[name="motivo"]').forEach(function(r){r.checked=false})
  document.getElementById('motivoOutroWrap').style.display='none'
  document.getElementById('motivoOutro').value=''
  document.getElementById('checklistObs').value=''
  document.querySelectorAll('#checklistPremiumGrid .checklist-item').forEach(function(el){el.classList.remove('checked');var cb=el.querySelector('input[type="checkbox"]');if(cb)cb.checked=false})
  document.querySelectorAll('#checklistGrid .checklist-item').forEach(function(el){el.classList.remove('checked');var cb=el.querySelector('input[type="checkbox"]');if(cb)cb.checked=false})
  document.getElementById('terceiroNome').value=''
  document.getElementById('terceiroDoc').value=''
  document.getElementById('terceiroTel').value=''
  document.getElementById('terceiroRelacao').value=''
  document.getElementById('autorizacaoVia').value=''
  document.getElementById('autorizacaoProtocolo').value=''
  document.getElementById('termCheck').checked=false;document.getElementById('termCheckWrapper').classList.remove('checked')
  document.getElementById('entregaConfirmada').checked=false;document.getElementById('entregaConfirmWrapper').classList.remove('checked')
  setTerceiro(false)
  photos=[];fotosCliente=[];fotosDoc=[];fotosEntrega=[];renderPhotos()
  clearSig()
}

function skipSearch(){currentOS=null;currentRet=null;editingId=null;photos=[];fotosCliente=[];fotosDoc=[];fotosEntrega=[];resetForm();
  document.getElementById('searchQuery').textContent='Sem vínculo (retirada avulsa)';
  goToStep('form')}

function fillOSData(){if(!currentOS)return;var o=currentOS;
  document.getElementById('osId').value=o.id||'';
  document.getElementById('numeroOS').value=o.osCode||o.id||'';
  document.getElementById('osCodeDisplay').value=o.osCode||'OS-'+String(o.id).padStart(4,'0')||'';
  document.getElementById('osStatusDisplay').value=o.status||''
  document.getElementById('clienteNome').value=o.cliente||'';
  document.getElementById('clienteCpf').value=o.cpf||'';
  document.getElementById('clienteTel').value=o.telefone||'';
  document.getElementById('clienteWhatsapp').value=o.whatsapp||o.telefone||'';
  document.getElementById('clienteEmail').value=o.email||'';
  document.getElementById('clienteEndereco').value=o.Endereco||o.Endereço||o.endereco||'';
  document.getElementById('equipamento').value=o.aparelho||o.equipamento||'';
  document.getElementById('tipoAparelho').value=o.tipoAparelho||'';
  document.getElementById('marca').value=o.marca||'';
  document.getElementById('modelo').value=o.modelo||'';
  document.getElementById('cor').value=o.cor||'';
  document.getElementById('imei').value=o.imei||'';
  document.getElementById('imei2').value=o.imei2||'';
  document.getElementById('serie').value=o.serie||o.serial||'';
  document.getElementById('patrimonio').value=o.patrimonio||'';
  document.getElementById('senha').value=o.senha||'';
  document.getElementById('estadoFisico').value=o.estadoFisico||o.estadoApar||o.diagEstadoFisico||'';
  document.getElementById('acessorios').value=o.acessorios||'';
  document.getElementById('dataEntrada').value=o.dataAbertura?dataBr(o.dataAbertura):(o.data?dataBr(o.data):'');
  document.getElementById('dataConclusao').value=o.dataFechamento?dataBr(o.dataFechamento):(o.dataConclusao?dataBr(o.dataConclusao):'');
  document.getElementById('tecnico').value=o.tecnico||'';
  var servs=(o.Serviços||o.servicos||[]).map(function(s){return typeof s==='string'?s:(s.nome||s.desc||'')}).filter(Boolean)
  document.getElementById('servicoRealizado').value=servs.join('; ')||o.servico||o.servicoRealizado||'';
  document.getElementById('valorServico').value=o.valor||o.total||'';
  document.getElementById('valor').value=o.valor||o.total||'';
  document.getElementById('pagamento').value=o.pgto||o.pagamento||'';
  document.getElementById('garantia').value='90 dias';
  document.getElementById('defeito').value=o.defeito||'';
  document.getElementById('obs').value=o.obs||'';
  setTerceiro(false)}

function setTerceiro(val){document.querySelectorAll('.terceiro-btn').forEach(function(b){b.classList.remove('active')});document.querySelector('.terceiro-btn[data-terceiro="'+val+'"]').classList.add('active');document.getElementById('terceiroFields').style.display=val?'block':'none';if(!val){document.getElementById('terceiroNome').value='';document.getElementById('terceiroDoc').value='';document.getElementById('terceiroTel').value='';document.getElementById('terceiroRelacao').value='';document.getElementById('autorizacaoVia').value='';document.getElementById('autorizacaoProtocolo').value=''}}

document.addEventListener('click',function(e){
  var t=e.target;
  if(t&&t.matches&&t.matches('input[name="motivo"]')){
    document.getElementById('motivoOutroWrap').style.display=t.value==='Outro motivo'?'block':'none';
  }
});

function setupPhotoCapture(){
  document.getElementById('photoInput').addEventListener('change',function(e){var files=e.target.files;for(var i=0;i<files.length;i++){(function(file){var reader=new FileReader();reader.onload=function(ev){photos.push(ev.target.result);renderPhotos()};reader.readAsDataURL(file)})(files[i])};e.target.value=''});
  document.getElementById('photoInputCliente').addEventListener('change',function(e){var files=e.target.files;for(var i=0;i<files.length;i++){(function(file){var reader=new FileReader();reader.onload=function(ev){fotosCliente.push(ev.target.result);renderCategPhotos()};reader.readAsDataURL(file)})(files[i])};e.target.value=''});
  document.getElementById('photoInputDoc').addEventListener('change',function(e){var files=e.target.files;for(var i=0;i<files.length;i++){(function(file){var reader=new FileReader();reader.onload=function(ev){fotosDoc.push(ev.target.result);renderCategPhotos()};reader.readAsDataURL(file)})(files[i])};e.target.value=''});
  document.getElementById('photoInputEntrega').addEventListener('change',function(e){var files=e.target.files;for(var i=0;i<files.length;i++){(function(file){var reader=new FileReader();reader.onload=function(ev){fotosEntrega.push(ev.target.result);renderCategPhotos()};reader.readAsDataURL(file)})(files[i])};e.target.value=''});
}
function renderPhotos(){
  var ctn=document.getElementById('photoGrid');
  ctn.innerHTML=photos.map(function(p,i){return'<div class="photo-item"><img src="'+p+'" alt="Foto '+(i+1)+'"><button class="photo-del" onclick="removePhoto('+i+')" title="Remover foto">&times;</button></div>'}).join('')+      '<div class="photo-add" onclick="document.getElementById(\'photoInput\').click()"><div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 4px;display:block"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Adicionar foto</div></div>'
  renderCategPhotos()
}
function removePhoto(i){photos.splice(i,1);renderPhotos()}
function removeCategPhoto(cat,i){
  if(cat==='cliente')fotosCliente.splice(i,1)
  else if(cat==='doc')fotosDoc.splice(i,1)
  else if(cat==='entrega')fotosEntrega.splice(i,1)
  renderCategPhotos()
}
function renderCategPhotos(){
  var map={cliente:{grid:'fotosClienteGrid',input:'photoInputCliente',arr:fotosCliente},doc:{grid:'fotosDocGrid',input:'photoInputDoc',arr:fotosDoc},entrega:{grid:'fotosEntregaGrid',input:'photoInputEntrega',arr:fotosEntrega}}
  Object.keys(map).forEach(function(k){
    var m=map[k];var ctn=document.getElementById(m.grid);if(!ctn)return
    ctn.innerHTML=m.arr.map(function(p,i){return'<div class="photo-item"><img src="'+p+'" alt="Foto '+(i+1)+'"><button class="photo-del" onclick="removeCategPhoto(\''+k+'\','+i+')" title="Remover foto">&times;</button></div>'}).join('')+
      '<div class="photo-add" onclick="document.getElementById(\''+m.input+'\').click()"><div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 4px;display:block"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Adicionar</div></div>'
  })
}

function getClientIP(){
  try{
    var ctrl=new AbortController();var t=setTimeout(function(){ctrl.abort()},4000);
    fetch('https://api.ipify.org?format=json',{signal:ctrl.signal}).then(function(r){return r.json()}).then(function(d){clearTimeout(t);_secIP=d.ip||'—';var el=document.getElementById('termoIP');if(el)el.textContent=_secIP}).catch(function(){clearTimeout(t)})
  }catch(e){}
}
function capturarGeo(){
  if(!navigator.geolocation){document.getElementById('geoStatus').textContent='Geolocalização não suportada neste navegador';return}
  document.getElementById('geoStatus').textContent='Capturando localização...';
  navigator.geolocation.getCurrentPosition(function(pos){
    _secGeo=pos.coords.latitude.toFixed(6)+', '+pos.coords.longitude.toFixed(6);
    document.getElementById('termoGeo').value=_secGeo;
    document.getElementById('geoStatus').textContent='Localização capturada';
  },function(){document.getElementById('geoStatus').textContent='Falha ao capturar (permita o acesso)';},{timeout:10000})
}

function validarCPF(cpf){
  cpf=String(cpf||'').replace(/\D/g,'');if(cpf.length!==11)return false
  if(/^(\d)\1{10}$/.test(cpf))return false
  var sum=0,rest
  for(var i=1;i<=9;i++)sum+=parseInt(cpf.charAt(i-1))*(11-i)
  rest=(sum*10)%11;if(rest===10||rest===11)rest=0;if(rest!==parseInt(cpf.charAt(9)))return false
  sum=0
  for(var j=1;j<=10;j++)sum+=parseInt(cpf.charAt(j-1))*(12-j)
  rest=(sum*10)%11;if(rest===10||rest===11)rest=0;if(rest!==parseInt(cpf.charAt(10)))return false
  return true
}
function validarTelefone(tel){
  var d=String(tel||'').replace(/\D/g,'');return d.length>=10
}
function getPremiumChecked(){
  var out=[];
  var items=document.querySelectorAll('#checklistPremiumGrid .checklist-item')
  items.forEach(function(el){var cb=el.querySelector('input[type="checkbox"]');if(cb&&cb.checked){var sp=el.querySelector('span:last-child');out.push(sp?sp.textContent.trim():'')}})
  return out
}
function getFisicoChecked(){
  var out=[];
  var items=document.querySelectorAll('#checklistGrid .checklist-item')
  items.forEach(function(el){var cb=el.querySelector('input[type="checkbox"]');if(cb&&cb.checked){var sp=el.querySelector('span:last-child');out.push(sp?sp.textContent.trim():'')}})
  return out
}

function confirmRetirada(){
  var data={osId:document.getElementById('osId').value||null,
    numeroOS:document.getElementById('numeroOS').value||'',
    cliente:document.getElementById('clienteNome').value.trim(),
    cpf:document.getElementById('clienteCpf').value.trim(),
    rg:document.getElementById('clienteRg').value.trim(),
    telefone:document.getElementById('clienteTel').value.trim(),
    whatsapp:document.getElementById('clienteWhatsapp').value.trim(),
    email:document.getElementById('clienteEmail').value.trim(),
    endereco:document.getElementById('clienteEndereco').value.trim(),
    equipamento:document.getElementById('equipamento').value.trim(),
    tipoAparelho:document.getElementById('tipoAparelho').value,
    marca:document.getElementById('marca').value.trim(),
    modelo:document.getElementById('modelo').value.trim(),
    cor:document.getElementById('cor').value.trim(),
    imei:document.getElementById('imei').value.trim(),
    imei2:document.getElementById('imei2').value.trim(),
    serie:document.getElementById('serie').value.trim(),
    patrimonio:document.getElementById('patrimonio').value.trim(),
    senha:document.getElementById('senha').value.trim(),
    estadoFisico:document.getElementById('estadoFisico').value.trim(),
    defeito:document.getElementById('defeito').value.trim(),
    acessorios:document.getElementById('acessorios').value.trim(),
    obs:document.getElementById('obs').value.trim(),
    checklistObs:document.getElementById('checklistObs').value.trim(),
    garantia:document.getElementById('garantia').value.trim()||'90 dias',
    valor:document.getElementById('valor').value.trim(),
    valorServico:document.getElementById('valorServico').value.trim(),
    pagamento:document.getElementById('pagamento').value.trim(),
    tecnico:document.getElementById('tecnico').value.trim()||getCurrentUser(),
    servicoRealizado:document.getElementById('servicoRealizado').value.trim(),
    dataEntrada:document.getElementById('dataEntrada').value.trim(),
    dataConclusao:document.getElementById('dataConclusao').value.trim(),
    motivo:document.querySelector('input[name="motivo"]:checked')?document.querySelector('input[name="motivo"]:checked').value:'',
    motivoDesc:document.getElementById('motivoOutro').value.trim(),
    terceiro:document.querySelector('.terceiro-btn.active').getAttribute('data-terceiro')==='true',
    terceiroNome:document.getElementById('terceiroNome').value.trim(),
    terceiroDoc:document.getElementById('terceiroDoc').value.trim(),
    terceiroTel:document.getElementById('terceiroTel').value.trim(),
    terceiroRelacao:document.getElementById('terceiroRelacao').value.trim(),
    autorizacaoVia:document.getElementById('autorizacaoVia').value,
    autorizacaoProtocolo:document.getElementById('autorizacaoProtocolo').value.trim(),
    checklistPremium:getPremiumChecked(),
    checklistFisico:getFisicoChecked(),
    fotos:photos,fotosCliente:fotosCliente,fotosDoc:fotosDoc,fotosEntrega:fotosEntrega,
    dataRetirada:hoje(),horaRetirada:hora()}

  var pend=[]
  if(!data.cliente)pend.push('Nome do cliente')
  if(!data.equipamento)pend.push('Equipamento')
  if(!data.motivo)pend.push('Motivo da retirada')
  if(data.motivo==='Outro motivo'&&!data.motivoDesc)pend.push('Descrição do outro motivo')
  if(data.terceiro&&!data.terceiroNome)pend.push('Nome do terceiro')
  if(data.terceiro&&!data.terceiroDoc)pend.push('Documento do terceiro')
  if(data.terceiro&&!data.autorizacaoVia)pend.push('Forma de autorização (terceiro)')
  if(data.cpf&&!validarCPF(data.cpf))pend.push('CPF inválido')
  if(data.terceiroDoc&&data.terceiroDoc.replace(/\D/g,'').length===11&&!validarCPF(data.terceiroDoc))pend.push('CPF do terceiro inválido')
  if(data.telefone&&!validarTelefone(data.telefone))pend.push('Telefone incompleto')
  if(data.terceiroTel&&!validarTelefone(data.terceiroTel))pend.push('Telefone do terceiro incompleto')
  if(!document.getElementById('termCheck').checked)pend.push('Aceite do termo de declaração')
  if(data.checklistPremium.indexOf('Entrega autorizada')===-1)pend.push('Checklist: Entrega autorizada')
  if(!document.getElementById('entregaConfirmada').checked)pend.push('Confirmação final da entrega')

  if(pend.length){
    toast('Pendências: '+pend.join('; '),'warning');
    var ph='<div class="alert-box alert-warning" style="margin-bottom:12px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><div><strong>Campos pendentes:</strong><ul style="margin:4px 0 0 16px;font-size:11px">'+pend.map(function(p){return'<li>'+escH(p)+'</li>'}).join('')+'</ul></div></div>'
    showModal('Confirmação de Retirada',ph,'<button class="btn btn-sm btn-secondary" onclick="closeModal()">Fechar</button>','480px')
    return
  }

  var body='<div class="alert-box alert-info" style="margin-bottom:12px"><div><strong>Confirme a entrega do equipamento</strong><br><span style="font-size:11px">Revise os dados antes de confirmar. Após a confirmação o comprovante será gerado.</span></div></div>'+
    '<div class="preview-box"><div class="preview-row"><div class="preview-label">Cliente:</div><div class="preview-value"><strong>'+escH(data.cliente)+'</strong></div></div>'+
    '<div class="preview-row"><div class="preview-label">Equipamento:</div><div class="preview-value">'+escH(data.equipamento)+(data.marca?' - '+escH(data.marca):'')+(data.modelo?' - '+escH(data.modelo):'')+'</div></div>'+
    (data.osId?'<div class="preview-row"><div class="preview-label">OS:</div><div class="preview-value">'+escH(data.numeroOS||data.osId)+'</div></div>':'')+
    '<div class="preview-row"><div class="preview-label">Motivo:</div><div class="preview-value">'+escH(data.motivo)+(data.motivoDesc?' - '+escH(data.motivoDesc):'')+'</div></div>'+
    (data.terceiro?'<div class="preview-row"><div class="preview-label">Terceiro:</div><div class="preview-value">'+escH(data.terceiroNome)+' ('+escH(data.terceiroDoc)+')</div></div>':'')+
    '<div class="preview-row"><div class="preview-label">Valor:</div><div class="preview-value">'+fmt$(data.valor)+'</div></div></div>'
  showModal('Confirmar Entrega',body,
    '<button class="btn btn-sm btn-secondary" onclick="closeModal()">Revisar</button>'+
    '<button class="btn btn-sm btn-success" onclick="closeModal();finalizeRetirada()">✔ Confirmar Entrega</button>','560px')
}

function finalizeRetirada(){
  var data={osId:document.getElementById('osId').value||null,
    numeroOS:document.getElementById('numeroOS').value||'',
    cliente:document.getElementById('clienteNome').value.trim(),
    cpf:document.getElementById('clienteCpf').value.trim(),
    rg:document.getElementById('clienteRg').value.trim(),
    telefone:document.getElementById('clienteTel').value.trim(),
    whatsapp:document.getElementById('clienteWhatsapp').value.trim(),
    email:document.getElementById('clienteEmail').value.trim(),
    endereco:document.getElementById('clienteEndereco').value.trim(),
    equipamento:document.getElementById('equipamento').value.trim(),
    tipoAparelho:document.getElementById('tipoAparelho').value,
    marca:document.getElementById('marca').value.trim(),
    modelo:document.getElementById('modelo').value.trim(),
    cor:document.getElementById('cor').value.trim(),
    imei:document.getElementById('imei').value.trim(),
    imei2:document.getElementById('imei2').value.trim(),
    serie:document.getElementById('serie').value.trim(),
    patrimonio:document.getElementById('patrimonio').value.trim(),
    senha:document.getElementById('senha').value.trim(),
    estadoFisico:document.getElementById('estadoFisico').value.trim(),
    defeito:document.getElementById('defeito').value.trim(),
    acessorios:document.getElementById('acessorios').value.trim(),
    obs:document.getElementById('obs').value.trim(),
    checklistObs:document.getElementById('checklistObs').value.trim(),
    garantia:document.getElementById('garantia').value.trim()||'90 dias',
    valor:document.getElementById('valor').value.trim(),
    valorServico:document.getElementById('valorServico').value.trim(),
    pagamento:document.getElementById('pagamento').value.trim(),
    tecnico:document.getElementById('tecnico').value.trim()||getCurrentUser(),
    servicoRealizado:document.getElementById('servicoRealizado').value.trim(),
    dataEntrada:document.getElementById('dataEntrada').value.trim(),
    dataConclusao:document.getElementById('dataConclusao').value.trim(),
    motivo:document.querySelector('input[name="motivo"]:checked')?document.querySelector('input[name="motivo"]:checked').value:'',
    motivoDesc:document.getElementById('motivoOutro').value.trim(),
    terceiro:document.querySelector('.terceiro-btn.active').getAttribute('data-terceiro')==='true',
    terceiroNome:document.getElementById('terceiroNome').value.trim(),
    terceiroDoc:document.getElementById('terceiroDoc').value.trim(),
    terceiroTel:document.getElementById('terceiroTel').value.trim(),
    terceiroRelacao:document.getElementById('terceiroRelacao').value.trim(),
    autorizacaoVia:document.getElementById('autorizacaoVia').value,
    autorizacaoProtocolo:document.getElementById('autorizacaoProtocolo').value.trim(),
    checklistPremium:getPremiumChecked(),
    checklistFisico:getFisicoChecked(),
    fotos:photos,fotosCliente:fotosCliente,fotosDoc:fotosDoc,fotosEntrega:fotosEntrega,
    dataRetirada:hoje(),horaRetirada:hora()}
  var num=editingId?editingId:nextNum();var now=new Date().toISOString();
  var ret={id:num,numero:'RET-'+String(num).padStart(4,'0'),uuid:_secUUID,protocolo:_secProtocolo,ip:_secIP,geo:_secGeo,usuario:getCurrentUser(),
    osId:data.osId?parseInt(data.osId):null,osCode:data.numeroOS||null,
    cliente:data.cliente,cpf:data.cpf,rg:data.rg,telefone:data.telefone,whatsapp:data.whatsapp,email:data.email,endereco:data.endereco,
    equipamento:data.equipamento,tipoAparelho:data.tipoAparelho,marca:data.marca,modelo:data.modelo,cor:data.cor,
    imei:data.imei,imei2:data.imei2,serie:data.serie,patrimonio:data.patrimonio,senha:data.senha,estadoFisico:data.estadoFisico,
    defeito:data.defeito,acessorios:data.acessorios,obs:data.obs,garantia:data.garantia,valor:data.valor,valorServico:data.valorServico,
    pagamento:data.pagamento,tecnico:data.tecnico,servicoRealizado:data.servicoRealizado,dataEntrada:data.dataEntrada,dataConclusao:data.dataConclusao,
    motivo:data.motivo,motivoDesc:data.motivoDesc,
    terceiro:data.terceiro,terceiroNome:data.terceiroNome,terceiroDoc:data.terceiroDoc,terceiroTel:data.terceiroTel,terceiroRelacao:data.terceiroRelacao,
    autorizacaoVia:data.autorizacaoVia,autorizacaoProtocolo:data.autorizacaoProtocolo,
    checklistPremium:data.checklistPremium,checklistFisico:data.checklistFisico,checklistObs:data.checklistObs,
    fotos:data.fotos,fotosCliente:data.fotosCliente,fotosDoc:data.fotosDoc,fotosEntrega:data.fotosEntrega,
    assinatura:data.assinatura,
    dataRetirada:data.dataRetirada,horaRetirada:data.horaRetirada,createdAt:now,updatedAt:now,status:'concluida',
    auditoria:[{data:data.dataRetirada,hora:data.horaRetirada,usuario:data.tecnico||getCurrentUser(),acao:'Termo criado e entrega finalizada'}]}
  if(editingId){
    var idx=retDB.retiradas.findIndex(function(r){return r.id===editingId});if(idx!==-1){
      ret.auditoria=(retDB.retiradas[idx].auditoria||[]).concat([{data:hoje(),hora:hora(),usuario:getCurrentUser(),acao:'Termo atualizado'}]);
      ret.createdAt=retDB.retiradas[idx].createdAt;ret.uuid=retDB.retiradas[idx].uuid||_secUUID;ret.protocolo=retDB.retiradas[idx].protocolo||_secProtocolo;
      retDB.retiradas[idx]=ret;toast('Retirada atualizada','success')
    }else{retDB.retiradas.push(ret);toast('Retirada registrada com sucesso!','success')}
  }else{
    retDB.retiradas.push(ret);toast('Retirada registrada com sucesso!','success')
    if(ret.osId)addOSHistory(ret.osId,ret.osCode||ret.osId,'Equipamento retirado sem apresentação da Ordem de Serviço. Termo '+ret.numero)
  }
  saveRetDB();currentRet=ret;editingId=null;renderPreview();renderHistory();goToStep('preview')
}

function addOSHistory(osId,osCode,msg){
  try{
    var raw=localStorage.getItem(DASH_KEY);if(!raw)return
    var db=JSON.parse(raw);if(!db.os||!Array.isArray(db.os))return
    var o=db.os.find(function(x){return String(x.id)===String(osId)})
    if(!o)return
    if(!o.statusLog||!Array.isArray(o.statusLog))o.statusLog=[]
    o.statusLog.push({from:o.status||'',to:o.status||'',date:hoje(),time:hora(),note:msg})
    if(!o.notes)o.notes=''
    if(o.notes)o.notes+='\n'
    o.notes+='['+hoje()+' '+hora()+'] '+msg
    localStorage.setItem(DASH_KEY,JSON.stringify(db))
  }catch(e){console.warn('[Retirada] addOSHistory:',e)}
}

function renderPreview(){var r=currentRet;if(!r)return
  document.getElementById('previewNumero').textContent=r.numero||'RET-'+String(r.id).padStart(4,'0');
  document.getElementById('previewProtocolo').textContent=r.protocolo||'—';
  document.getElementById('previewData').textContent=fmtDateTime(r.dataRetirada,r.horaRetirada);
  document.getElementById('previewMotivo').textContent=r.motivo||'—';
  document.getElementById('previewOS').textContent=r.osCode||(r.osId?'OS-'+String(r.osId).padStart(4,'0'):'—');
  document.getElementById('previewCliente').textContent=escH(r.cliente);
  document.getElementById('previewCpf').textContent=r.cpf||'—';
  document.getElementById('previewTel').textContent=escH(r.telefone||'—');
  document.getElementById('previewEquip').textContent=[r.equipamento,r.marca,r.modelo].filter(Boolean).join(' / ')||'—';
  document.getElementById('previewImei').textContent=r.imei||'—';
  document.getElementById('previewSerie').textContent=[r.serie,r.patrimonio].filter(Boolean).join(' / ')||'—';
  document.getElementById('previewDefeito').textContent=r.defeito||'—';
  document.getElementById('previewAcessorios').textContent=r.acessorios||'—';
  document.getElementById('previewGarantia').textContent=r.garantia||'—';
  document.getElementById('previewValor').textContent=r.valor?fmt$(r.valor):'—';
  document.getElementById('previewTecnico').textContent=escH(r.tecnico||getCurrentUser());
  document.getElementById('previewServico').textContent=escH(r.servicoRealizado||'—');
  document.getElementById('previewPagamento').textContent=escH(r.pagamento||'—');
  document.getElementById('previewTerceiro').textContent=r.terceiro?(escH(r.terceiroNome||'')+' ('+escH(r.terceiroDoc||'')+(r.terceiroRelacao?' - '+escH(r.terceiroRelacao):'')+')'):'Próprio cliente';
  document.getElementById('previewObs').textContent=r.obs||'—';
  var pc=document.getElementById('previewPhotos');
  var all=(r.fotos||[]).concat(r.fotosCliente||[]).concat(r.fotosDoc||[]).concat(r.fotosEntrega||[])
  if(all.length){pc.innerHTML='<div style="display:flex;gap:6px;flex-wrap:wrap">'+all.map(function(f){return'<img src="'+f+'" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid var(--bdr)">'}).join('')+'</div>';pc.style.display='block'}else pc.style.display='none'
  var qrData='RETIRADA SEM OS | Termo: '+(r.numero||'')+' | Protocolo: '+(r.protocolo||'')+' | Cliente: '+r.cliente+' | Equip: '+r.equipamento+' | Data: '+r.dataRetirada
  document.getElementById('previewQR').src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(qrData)
  generateBarcode((r.numero||'RET-'+String(r.id).padStart(4,'0')))
  document.getElementById('previewTermo').innerHTML=buildTerm(r.cliente,r.equipamento,r.motivo+(r.motivoDesc?' - '+r.motivoDesc:''),r.osCode||'')
  renderAuditLog()}

function renderAuditLog(){
  var r=currentRet;var ctn=document.getElementById('auditLog');if(!ctn)return
  if(!r||!r.auditoria||!r.auditoria.length){ctn.innerHTML='<div class="form-hint">Nenhum registro de ação</div>';return}
  ctn.innerHTML=r.auditoria.slice().reverse().map(function(a){return'<div class="audit-item"><span class="a-time">'+escH(a.data+' '+a.hora)+'</span><span class="a-user">'+escH(a.usuario||'')+'</span><span class="a-action">'+escH(a.acao||'')+'</span></div>'}).join('')
}

function generateBarcode(text){
  var canvas=document.getElementById('barcodeCanvas');var fb=document.getElementById('barcodeFallback');
  if(!canvas)return
  function fallback(){canvas.style.display='none';fb.style.display='block';fb.textContent=text}
  if(typeof JsBarcode==='undefined'){
    canvas.style.display='none';fb.style.display='block';fb.textContent=text;return
  }
  try{JsBarcode(canvas,text,{format:'CODE128',width:1.5,height:40,displayValue:true,fontSize:10,margin:2});canvas.style.display='block';fb.style.display='none'}catch(e){fallback()}
}
function loadBarcodeLib(cb){
  if(typeof JsBarcode!=='undefined'){cb();return}
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js';
  s.onload=cb;s.onerror=function(){if(cb)cb()};
  document.head.appendChild(s)
}

function renderHistory(){
  var ctn=document.getElementById('historyList');
  var list=(retDB.retiradas||[]).slice().reverse()
  var f=(document.getElementById('historyFilter')||{}).value||''
  if(f){f=f.toLowerCase();list=list.filter(function(r){return String(r.numero+r.cliente+r.equipamento).toLowerCase().indexOf(f)!==-1})}
  if(!list.length){ctn.innerHTML='<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><h3>Nenhuma retirada registrada</h3><p>As retiradas sem OS aparecerão aqui</p></div>';return}
  ctn.innerHTML=list.map(function(r){
    var badge=r.status==='cancelada'?'<span class="badge badge-red">Cancelada</span>':(r.status==='concluida'?'<span class="badge badge-grn">Concluída</span>':'<span class="badge badge-ylw">'+escH(r.status)+'</span>')
    var dt=fmtDateTime(r.dataRetirada,r.horaRetirada)
    return'<div class="history-item" onclick="viewRetirada('+r.id+')" style="cursor:pointer">'+
      '<div class="h-icon '+(r.status==='cancelada'?'red':(r.terceiro?'grn':'cyan'))+'">'+'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></div>'+
      '<div class="h-info"><div class="h-title">'+(r.numero||'RET-'+String(r.id).padStart(4,'0'))+' – '+escH(r.cliente)+' '+badge+'</div>'+
      '<div class="h-desc">'+escH(r.equipamento)+(r.terceiro?' (Terceiro: '+escH(r.terceiroNome)+')':'')+'</div>'+
      '<div class="h-meta"><span>'+dt+'</span><span>'+escH(r.tecnico||'')+'</span>'+
      (r.valor?'<span>'+fmt$(r.valor)+'</span>':'')+
      '</div></div></div>'
  }).join('')}

function viewRetirada(id){var r=retDB.retiradas.find(function(x){return x.id===id});if(!r){  toast('Retirada não encontrada','error');return}
  var html='<div class="preview-box">'+
    '<div class="preview-row"><div class="preview-label">Número:</div><div class="preview-value"><strong>'+(r.numero||'RET-'+String(r.id).padStart(4,'0'))+'</strong>'+(r.protocolo?' <span class="badge badge-cyan mono">'+escH(r.protocolo)+'</span>':'')+'</div></div>'+
    '<div class="preview-row"><div class="preview-label">Data:</div><div class="preview-value">'+fmtDateTime(r.dataRetirada,r.horaRetirada)+'</div></div>'+
    (r.motivo?'<div class="preview-row"><div class="preview-label">Motivo:</div><div class="preview-value">'+escH(r.motivo)+(r.motivoDesc?' - '+escH(r.motivoDesc):'')+'</div></div>':'')+
    '<div class="preview-row"><div class="preview-label">Cliente:</div><div class="preview-value">'+escH(r.cliente)+(r.telefone?' ('+escH(r.telefone)+')':'')+'</div></div>'+
    (r.cpf?'<div class="preview-row"><div class="preview-label">CPF:</div><div class="preview-value">'+escH(r.cpf)+'</div></div>':'')+
    (r.osCode?'<div class="preview-row"><div class="preview-label">OS:</div><div class="preview-value">'+escH(r.osCode)+'</div></div>':'')+
    '<div class="preview-row"><div class="preview-label">Equipamento:</div><div class="preview-value">'+escH(r.equipamento)+(r.marca?' - '+escH(r.marca):'')+(r.modelo?' - '+escH(r.modelo):'')+'</div></div>'+
    (r.imei?'<div class="preview-row"><div class="preview-label">IMEI:</div><div class="preview-value">'+escH(r.imei)+'</div></div>':'')+
    (r.defeito?'<div class="preview-row"><div class="preview-label">Defeito:</div><div class="preview-value">'+escH(r.defeito)+'</div></div>':'')+
    (r.acessorios?'<div class="preview-row"><div class="preview-label">Acessórios:</div><div class="preview-value">'+escH(r.acessorios)+'</div></div>':'')+
    '<div class="preview-row"><div class="preview-label">Garantia:</div><div class="preview-value">'+escH(r.garantia||'90 dias')+'</div></div>'+
    (r.valor?'<div class="preview-row"><div class="preview-label">Valor:</div><div class="preview-value">'+fmt$(r.valor)+'</div></div>':'')+
    '<div class="preview-row"><div class="preview-label">Terceiro:</div><div class="preview-value">'+(r.terceiro?(escH(r.terceiroNome||'')+' ('+escH(r.terceiroDoc||'')+')'):'Próprio cliente')+'</div></div>'+
    '<div class="preview-row"><div class="preview-label">Técnico:</div><div class="preview-value">'+escH(r.tecnico||getCurrentUser())+'</div></div>'+
    (r.obs?'<div class="preview-row"><div class="preview-label">Obs:</div><div class="preview-value">'+escH(r.obs)+'</div></div>':'')+
    (r.auditoria&&r.auditoria.length?'<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--bdr)"><div class="form-hint" style="margin-bottom:4px">AUDITORIA</div>'+r.auditoria.slice().reverse().map(function(a){return'<div style="font-size:10px;color:var(--txt3);padding:2px 0">'+escH(a.data+' '+a.hora)+' - '+escH(a.usuario||'')+': '+escH(a.acao||'')+'</div>'}).join('')+'</div>':'')+
    '</div>';
  var footer='<button class="btn btn-sm btn-secondary" onclick="closeModal()">Fechar</button>'+
    (r.status!=='cancelada'?'<button class="btn btn-sm btn-primary" onclick="closeModal();editRetirada('+id+')">Editar</button>':'')+
    '<button class="btn btn-sm btn-success" onclick="closeModal();generatePDF('+id+')">PDF</button>'+
    '<button class="btn btn-sm btn-secondary" onclick="closeModal();imprimirRetirada('+id+')">Imprimir</button>'+
    (r.status!=='cancelada'?'<button class="btn btn-sm btn-danger" onclick="closeModal();cancelRetirada('+id+')">Cancelar</button>':'');
  showModal('Retirada '+(r.numero||'RET-'+String(r.id).padStart(4,'0')),html,footer,'640px')}

function editRetirada(id){var r=retDB.retiradas.find(function(x){return x.id===id});if(!r){  toast('Retirada não encontrada','error');return}
  editingId=id;currentRet=r;photos=r.fotos||[];fotosCliente=r.fotosCliente||[];fotosDoc=r.fotosDoc||[];fotosEntrega=r.fotosEntrega||[];
  document.getElementById('osId').value=r.osId||'';
  document.getElementById('numeroOS').value=r.osCode||'';
  document.getElementById('osCodeDisplay').value=r.osCode||'';
  document.getElementById('osStatusDisplay').value=''
  document.getElementById('clienteNome').value=r.cliente||'';
  document.getElementById('clienteCpf').value=r.cpf||'';
  document.getElementById('clienteRg').value=r.rg||'';
  document.getElementById('clienteTel').value=r.telefone||'';
  document.getElementById('clienteWhatsapp').value=r.whatsapp||'';
  document.getElementById('clienteEmail').value=r.email||'';
  document.getElementById('clienteEndereco').value=r.endereco||'';
  document.getElementById('equipamento').value=r.equipamento||'';
  document.getElementById('tipoAparelho').value=r.tipoAparelho||'';
  document.getElementById('marca').value=r.marca||'';
  document.getElementById('modelo').value=r.modelo||'';
  document.getElementById('cor').value=r.cor||'';
  document.getElementById('imei').value=r.imei||'';
  document.getElementById('imei2').value=r.imei2||'';
  document.getElementById('serie').value=r.serie||'';
  document.getElementById('patrimonio').value=r.patrimonio||'';
  document.getElementById('senha').value=r.senha||'';
  document.getElementById('estadoFisico').value=r.estadoFisico||'';
  document.getElementById('acessorios').value=r.acessorios||'';
  document.getElementById('dataEntrada').value=r.dataEntrada||'';
  document.getElementById('dataConclusao').value=r.dataConclusao||'';
  document.getElementById('servicoRealizado').value=r.servicoRealizado||'';
  document.getElementById('valorServico').value=r.valorServico||'';
  document.getElementById('pagamento').value=r.pagamento||'';
  document.getElementById('defeito').value=r.defeito||'';
  document.getElementById('obs').value=r.obs||'';
  document.getElementById('garantia').value=r.garantia||'90 dias';
  document.getElementById('valor').value=r.valor||'';
  document.getElementById('tecnico').value=r.tecnico||'';
  document.getElementById('checklistObs').value=r.checklistObs||'';
  if(r.motivo){document.querySelectorAll('input[name="motivo"]').forEach(function(x){x.checked=x.value===r.motivo});document.getElementById('motivoOutroWrap').style.display=r.motivo==='Outro motivo'?'block':'none'}
  document.getElementById('motivoOutro').value=r.motivoDesc||'';
  if(r.checklistPremium&&r.checklistPremium.length){document.querySelectorAll('#checklistPremiumGrid .checklist-item').forEach(function(el){var sp=el.querySelector('span:last-child');if(sp&&r.checklistPremium.indexOf(sp.textContent.trim())!==-1){el.classList.add('checked');var cb=el.querySelector('input[type="checkbox"]');if(cb)cb.checked=true}})}
  if(r.checklistFisico&&r.checklistFisico.length){document.querySelectorAll('#checklistGrid .checklist-item').forEach(function(el){var sp=el.querySelector('span:last-child');if(sp&&r.checklistFisico.indexOf(sp.textContent.trim())!==-1){el.classList.add('checked');var cb=el.querySelector('input[type="checkbox"]');if(cb)cb.checked=true}})}
  setTerceiro(r.terceiro);if(r.terceiro){document.getElementById('terceiroNome').value=r.terceiroNome||'';document.getElementById('terceiroDoc').value=r.terceiroDoc||'';document.getElementById('terceiroTel').value=r.terceiroTel||'';document.getElementById('terceiroRelacao').value=r.terceiroRelacao||'';document.getElementById('autorizacaoVia').value=r.autorizacaoVia||'';document.getElementById('autorizacaoProtocolo').value=r.autorizacaoProtocolo||''}
  document.getElementById('termCheck').checked=true;document.getElementById('termCheckWrapper').classList.add('checked')
  document.getElementById('entregaConfirmada').checked=true;document.getElementById('entregaConfirmWrapper').classList.add('checked')
  renderPhotos();
  document.getElementById('searchQuery').textContent='Editando: '+(r.numero||'RET-'+String(r.id).padStart(4,'0'));
  goToStep('form')}

function cancelRetirada(id){
  var r=retDB.retiradas.find(function(x){return x.id===id});if(!r)return
  var body='<div class="alert-box alert-warning"><div><strong>Cancele a retirada '+escH(r.numero)+'</strong><br><span style="font-size:11px">Informe o motivo do cancelamento. O registro será mantido no histórico com status cancelada.</span></div></div>'+
    '<div class="form-group"><label>Motivo do Cancelamento</label><textarea class="form-control" id="cancelMotivo" rows="2" placeholder="Descreva o motivo..."></textarea></div>'
  showModal('Cancelar Retirada',body,'<button class="btn btn-sm btn-secondary" onclick="closeModal()">Voltar</button><button class="btn btn-sm btn-danger" onclick="confirmCancelRetirada('+id+')">✔ Cancelar Retirada</button>','480px')
}
function confirmCancelRetirada(id){
  var motivo=(document.getElementById('cancelMotivo')||{}).value||''
  var r=retDB.retiradas.find(function(x){return x.id===id});if(!r)return
  r.status='cancelada';r.motivoCancelamento=motivo;r.auditoria=r.auditoria||[]
  r.auditoria.push({data:hoje(),hora:hora(),usuario:getCurrentUser(),acao:'Retirada cancelada'+(motivo?' - Motivo: '+motivo:'')})
  saveRetDB();closeModal();toast('Retirada cancelada','warning');renderHistory()}

function imprimirRetirada(id){var r=retDB.retiradas.find(function(x){return x.id===id});if(!r){toast('Retirada não encontrada','error');return}
  currentRet=r;r.auditoria=r.auditoria||[];r.auditoria.push({data:hoje(),hora:hora(),usuario:getCurrentUser(),acao:'Comprovante reimpresso'});saveRetDB();renderPreview();goToStep('preview');setTimeout(function(){window.print()},400)}

function generatePDF(id){var r=id?retDB.retiradas.find(function(x){return x.id===id}):currentRet;if(!r){toast('Nenhuma retirada para gerar PDF','error');return}
  if(typeof window.jspdf==='undefined'&&typeof jspdf==='undefined'){toast('Carregando jsPDF, tente novamente...','info');var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=function(){toast('jsPDF carregado!','success');generatePDF(id)};document.head.appendChild(s);return}
  try{
    var _j=(window.jspdf||{}).jsPDF||jspdf;if(!_j){toast('jsPDF não disponível','error');return}
    var doc=new _j({unit:'mm',format:'a4',orientation:'portrait'});var pageW=210;var margin=15;var y=margin;var lineH=7;var pageH=297;
    var db=loadDashDB();var cfg=db.config||{};var company=cfg.empresa||'InfoCelll';var logo=cfg.logo||'';
    var now=new Date();
    function h(t){return escH(String(t||''))}
    function chkPage(need){if(y+need>pageH-margin-15){doc.addPage();y=margin+14}}
    function heading(text){chkPage(16);doc.setFontSize(13);doc.setFont('helvetica','bold');doc.setTextColor(6,182,212);doc.text(text,margin,y);y+=7;doc.setDrawColor(6,182,212);doc.setLineWidth(0.4);doc.line(margin,y,pageW-margin,y);y+=4}
    function field(label,value){chkPage(lineH+2);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(100);doc.text(label+':',margin,y);doc.setFont('helvetica','normal');doc.setTextColor(40);var v=String(value||'—');doc.text(v,margin+doc.getTextWidth(label+': ')+2,y);y+=lineH}
    function wrapField(label,value){chkPage(lineH*2);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(100);doc.text(label+':',margin,y);doc.setFont('helvetica','normal');doc.setTextColor(40);var v=String(value||'—');var lines=doc.splitTextToSize(v,pageW-margin*2-35);doc.text(lines,margin+35,y);y+=lines.length*lineH+2}
    var num=r.numero||'RET-'+String(r.id).padStart(4,'0');var dt=fmtDateTime(r.dataRetirada,r.horaRetirada);

    doc.setFillColor(6,100,160);doc.rect(0,0,pageW,30,'F');doc.setTextColor(255);
    if(logo){try{doc.addImage(logo,'PNG',margin,6,20,20)}catch(e){}}
    doc.setFontSize(17);doc.setFont('helvetica','bold');doc.text('TERMO DE RETIRADA SEM OS',margin+(logo?26:0),15);
    doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text(company+' | '+num+' | '+dt,margin+(logo?26:0),21);
    doc.setFontSize(7);doc.text('UUID: '+(r.uuid||'—')+' | Protocolo: '+(r.protocolo||'—'),margin+(logo?26:0),26);
    doc.setFillColor(230,240,248);doc.rect(0,30,pageW,12,'F');doc.setTextColor(40);doc.setFontSize(8);
    var headInfo=[cfg.cnpj?'CNPJ: '+cfg.cnpj:'',cfg.Endereco||cfg.Endereço?cfg.Endereco||cfg.Endereço:'',cfg.tel?'Tel: '+cfg.tel:'',cfg.email?'Email: '+cfg.email:'',cfg.site?'Site: '+cfg.site:''].filter(Boolean).join('  |  ')
    doc.text(headInfo||company,margin,36);
    y=52;

    heading('1. CLIENTE');
    field('Nome',r.cliente);field('CPF',r.cpf||'—');field('RG/CNH',r.rg||'—');field('Telefone',r.telefone||'—');field('WhatsApp',r.whatsapp||'—');field('E-mail',r.email||'—');wrapField('Endereço',r.endereco);
    y+=3;heading('2. EQUIPAMENTO');
    field('Equipamento',r.equipamento);field('Tipo',r.tipoAparelho||'—');field('Marca/Modelo',[r.marca,r.modelo].filter(Boolean).join(' / '));field('Cor',r.cor||'—');field('IMEI 1',r.imei||'—');field('IMEI 2',r.imei2||'—');field('Nº de Série',r.serie||'—');field('Patrimônio',r.patrimonio||'—');field('Estado Físico',r.estadoFisico||'—');field('Acessórios',r.acessorios||'Nenhum');
    y+=3;heading('3. SERVIÇO / OS');
    field('Nº da OS',r.osCode||'—');field('Data de Entrada',r.dataEntrada||'—');field('Data de Conclusão',r.dataConclusao||'—');field('Técnico',r.tecnico||'—');wrapField('Serviço Realizado',r.servicoRealizado);field('Valor',r.valor?fmt$(r.valor):'—');field('Pagamento',r.pagamento||'—');field('Garantia',r.garantia||'90 dias');
    y+=3;heading('4. MOTIVO DA RETIRADA SEM OS');
    field('Motivo',r.motivo||'—');if(r.motivoDesc)wrapField('Descrição',r.motivoDesc);
    if(r.terceiro){
      y+=3;heading('5. RETIRADA POR TERCEIRO');
      field('Nome',r.terceiroNome||'—');field('Documento',r.terceiroDoc||'—');field('Telefone',r.terceiroTel||'—');field('Relação',r.terceiroRelacao||'—');field('Autorização via',r.autorizacaoVia||'—');field('Protocolo',r.autorizacaoProtocolo||'—')
    }
    y+=3;heading('6. CHECKLIST PREMIUM');
    var chk=(r.checklistPremium||[]).map(function(c){return'☑ '+c}).join('   ')
    wrapField('Verificações',chk||'Nenhum item')
    if(r.checklistObs)wrapField('Obs. Checklist',r.checklistObs)
    y+=3;heading('7. DECLARAÇÃO DO CLIENTE');
    doc.setFontSize(8.5);doc.setFont('helvetica','italic');doc.setTextColor(70);
    var declText='Eu, '+r.cliente+', solicito a retirada do equipamento '+r.equipamento+' sem apresentação da Ordem de Serviço original, por motivo de '+(r.motivo||'não informado')+'. Declaro ser o proprietário do equipamento ou estar devidamente autorizado, confirmo que os dados informados são verdadeiros e assumo integral responsabilidade pelas informações fornecidas. Confirmei o equipamento e os acessórios, e recebi o equipamento após conferência realizada no ato. Reconheço que a retirada foi realizada mediante solicitação própria e mantenho todos os meus direitos previstos em lei.';
    var dl=doc.splitTextToSize(declText,pageW-margin*2);doc.text(dl,margin,y);y+=dl.length*lineH+4;
    y+=3;heading('8. ASSINATURAS');
    y+=14;doc.setDrawColor(120);doc.setLineWidth(0.3);doc.line(margin,y,pageW-margin-70,y);doc.line(margin+100,y,pageW-margin,y);
    doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(100);doc.text('Cliente / Responsável',margin+5,y+4);doc.text('InfoCelll',pageW-margin-85,y+4);
    y+=16;
    if(r.fotos&&r.fotos.length){
      chkPage(40);heading('9. FOTOS DO EQUIPAMENTO');
      var fw=40,rowY=y;r.fotos.slice(0,4).forEach(function(f,i){try{doc.addImage(f,'JPEG',margin+(i%2)*(fw+5),rowY+Math.floor(i/2)*28,fw,26)}catch(e){}});
      y+=Math.ceil(r.fotos.slice(0,4).length/2)*28+6
    }
    if(r.ip||r.geo){y+=3;heading('10. RASTREABILIDADE');field('Usuário',r.usuario||'—');field('IP',r.ip||'—');field('Geolocalização',r.geo||'—');field('UUID',r.uuid||'—');field('Versão do documento', 'v1.0')}

    var pages=doc.getNumberOfPages();
    for(var p=1;p<=pages;p++){doc.setPage(p);doc.setFontSize(7);doc.setTextColor(150);
      doc.text(company+' – '+num, margin, pageH-8);doc.text('Emitido em '+now.toLocaleDateString('pt-BR')+' às '+now.toLocaleTimeString('pt-BR')+' por '+ (r.usuario||'—'), margin, pageH-4);
      doc.text('Página '+p+' de '+pages, pageW-margin-doc.getTextWidth('Página '+p+' de '+pages), pageH-4)
    }
    r.auditoria=r.auditoria||[];r.auditoria.push({data:hoje(),hora:hora(),usuario:getCurrentUser(),acao:'PDF gerado'});saveRetDB();
    doc.save(num+'.pdf');toast('PDF gerado: '+num+'.pdf','success')
  }catch(e){toast('Erro ao gerar PDF: '+e.message,'error');console.error('[Retirada] PDF error:',e)}}

function dashboardBtn(){window.location.href='dashboard.html'}

function imprimirComprovante(){
  if(!currentRet){toast('Nenhum comprovante para imprimir','error');return}
  currentRet.auditoria=currentRet.auditoria||[];currentRet.auditoria.push({data:hoje(),hora:hora(),usuario:getCurrentUser(),acao:'Comprovante impresso'});saveRetDB();
  window.print()
}

function exportarComprovante(){
  if(!currentRet){toast('Nenhum comprovante para exportar','error');return}
  var r=currentRet
  var html=
    '<div style="padding:8px 0">'+
    '<p style="color:var(--txt3);font-size:12px;margin-bottom:16px">Exportar dados do comprovante</p>'+
    '<button class="btn btn-block btn-primary" onclick="closeModal();exportarJSON()" style="margin-bottom:8px;justify-content:center">Exportar como JSON</button>'+
    '<button class="btn btn-block btn-secondary" onclick="closeModal();exportarCSV()" style="margin-bottom:8px;justify-content:center">Exportar como CSV</button>'+
    '<button class="btn btn-block btn-secondary" onclick="closeModal();exportarTXT()" style="justify-content:center">Exportar como TXT</button>'+
    '</div>'
  showModal('Exportar Comprovante',html,'','400px')
}

function exportarJSON(){
  if(!currentRet){toast('Nenhum comprovante','error');return}
  var r=currentRet
  var dados={tipo:'termo_retirada_sem_os',sistema:'InfoCelll',versao:'v1.0',numero:r.numero,protocolo:r.protocolo,uuid:r.uuid,usuario:r.usuario,ip:r.ip,geo:r.geo,os:r.osCode,cliente:r.cliente,cpf:r.cpf,telefone:r.telefone,equipamento:r.equipamento,marca:r.marca,modelo:r.modelo,imei:r.imei,serie:r.serie,defeito:r.defeito,acessorios:r.acessorios,garantia:r.garantia,valor:r.valor,tecnico:r.tecnico,motivo:r.motivo,motivoDesc:r.motivoDesc,terceiro:r.terceiro?{nome:r.terceiroNome,documento:r.terceiroDoc,telefone:r.terceiroTel,relacao:r.terceiroRelacao,autorizacaoVia:r.autorizacaoVia,protocolo:r.autorizacaoProtocolo}:null,checklistPremium:r.checklistPremium,dataRetirada:r.dataRetirada,horaRetirada:r.horaRetirada,status:r.status,auditoria:r.auditoria}
  downloadFile(JSON.stringify(dados,null,2),'application/json',(r.numero||'RET-'+String(r.id).padStart(4,'0'))+'.json')
  toast('JSON exportado!','success')
}
function exportarCSV(){
  if(!currentRet){toast('Nenhum comprovante','error');return}
  var r=currentRet
  var linhas=[
    ['Número',r.numero],['Protocolo',r.protocolo],['UUID',r.uuid],['Usuário',r.usuario],['IP',r.ip],
    ['OS',r.osCode],['Cliente',r.cliente],['CPF',r.cpf],['Telefone',r.telefone],
    ['Equipamento',r.equipamento],['Marca',r.marca],['Modelo',r.modelo],['IMEI',r.imei],['Série',r.serie],
    ['Motivo',r.motivo+(r.motivoDesc?' - '+r.motivoDesc:'')],['Acessórios',r.acessorios],['Garantia',r.garantia],
    ['Valor',r.valor],['Técnico',r.tecnico],
    ['Terceiro',r.terceiro?r.terceiroNome+' ('+r.terceiroDoc+')':'Próprio cliente'],
    ['Checklist Premium',(r.checklistPremium||[]).join('; ')],
    ['Data',r.dataRetirada],['Hora',r.horaRetirada],['Status',r.status]
  ]
  var csv=linhas.map(function(l){return'"'+String(l[0]||'').replace(/"/g,'""')+'";"'+String(l[1]||'').replace(/"/g,'""')+'"'}).join('\n')
  downloadFile(csv,'text/csv;charset=utf-8',(r.numero||'RET-'+String(r.id).padStart(4,'0'))+'.csv')
  toast('CSV exportado!','success')
}
function exportarTXT(){
  if(!currentRet){toast('Nenhum comprovante','error');return}
  var r=currentRet
  var linha=function(k,v){return k+': '+(v||'—')+'\n'}
  var txt='=== TERMO DE RETIRADA SEM OS ===\n\n'
  txt+=linha('Número',r.numero);txt+=linha('Protocolo',r.protocolo);txt+=linha('UUID',r.uuid);txt+=linha('Usuário',r.usuario)
  txt+=linha('Data',dataBr(r.dataRetirada)+' às '+r.horaRetirada);txt+=linha('OS',r.osCode)
  txt+=linha('Cliente',r.cliente);txt+=linha('CPF',r.cpf);txt+=linha('Telefone',r.telefone)
  txt+=linha('Equipamento',r.equipamento+(r.marca?' - '+r.marca:'')+(r.modelo?' - '+r.modelo:''))
  txt+=linha('IMEI',r.imei);txt+=linha('Série',r.serie);txt+=linha('Motivo',r.motivo+(r.motivoDesc?' - '+r.motivoDesc:''))
  txt+=linha('Acessórios',r.acessorios);txt+=linha('Garantia',r.garantia)
  if(r.valor)txt+=linha('Valor',fmt$(r.valor))
  txt+=linha('Técnico',r.tecnico)
  txt+=linha('Retirado por',r.terceiro?r.terceiroNome+' ('+r.terceiroDoc+')':'Próprio cliente')
  txt+=linha('Checklist',(r.checklistPremium||[]).join(', '))
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
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url)},100)
}

function compartilharWhatsApp(){
  if(!currentRet){toast('Nenhum comprovante para compartilhar','error');return}
  var r=currentRet
  currentRet.auditoria=currentRet.auditoria||[];currentRet.auditoria.push({data:hoje(),hora:hora(),usuario:getCurrentUser(),acao:'Comprovante enviado via WhatsApp'});saveRetDB();
  var num=r.numero||'RET-'+String(r.id).padStart(4,'0')
  var txt='🧾 *TERMO DE RETIRADA SEM OS*\n'
  txt+='📋 Número: '+num+(r.protocolo?' | Protocolo: '+r.protocolo:'')+'\n'
  txt+='📅 Data: '+dataBr(r.dataRetirada)+' às '+r.horaRetirada+'\n'
  txt+='👤 Cliente: '+r.cliente+'\n'
  txt+='📱 Equipamento: '+r.equipamento+(r.marca?' ('+r.marca+')':'')+'\n'
  if(r.imei)txt+='🔢 IMEI: '+r.imei+'\n'
  if(r.motivo)txt+='📝 Motivo: '+r.motivo+(r.motivoDesc?' - '+r.motivoDesc:'')+'\n'
  if(r.osCode)txt+='🔧 OS: '+r.osCode+'\n'
  if(r.acessorios)txt+='📦 Acessórios: '+r.acessorios+'\n'
  txt+='🛡️ Garantia: '+(r.garantia||'90 dias')+'\n'
  if(r.valor)txt+='💰 Valor: '+fmt$(r.valor)+'\n'
  txt+='👨‍🔧 Técnico: '+(r.tecnico||'Silvio')+'\n'
  txt+='📌 Retirado por: '+(r.terceiro?r.terceiroNome+' ('+r.terceiroDoc+')':'Próprio cliente')+'\n\n'
  txt+='✅ _Documento gerado pelo sistema InfoCelll_'
  window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank')
  toast('WhatsApp aberto!','success')
}

function enviarEmail(){
  if(!currentRet){toast('Nenhum comprovante para enviar','error');return}
  var r=currentRet
  var num=r.numero||'RET-'+String(r.id).padStart(4,'0')
  var subject=encodeURIComponent('Termo de Retirada sem OS - '+num+' - InfoCelll')
  var body=encodeURIComponent(
    'TERMO DE RETIRADA SEM OS\n\n'+
    'Número: '+num+'\nProtocolo: '+(r.protocolo||'—')+'\nData: '+dataBr(r.dataRetirada)+' às '+r.horaRetirada+'\n'+
    'Cliente: '+r.cliente+'\nEquipamento: '+r.equipamento+(r.marca?' - '+r.marca:'')+(r.modelo?' - '+r.modelo:'')+'\n'+
    (r.imei?'IMEI: '+r.imei+'\n':'')+
    (r.motivo?'Motivo: '+r.motivo+(r.motivoDesc?' - '+r.motivoDesc:'')+'\n':'')+
    'Garantia: '+(r.garantia||'90 dias')+'\n\n'+
    'Retirado por: '+(r.terceiro?r.terceiroNome+' ('+r.terceiroDoc+')':'Próprio cliente')+'\n'+
    'Técnico: '+(r.tecnico||'—')+'\n\n'+
    'Documento gerado pelo sistema InfoCelll.')
  var to=r.email||''
  currentRet.auditoria=currentRet.auditoria||[];currentRet.auditoria.push({data:hoje(),hora:hora(),usuario:getCurrentUser(),acao:'Comprovante enviado por e-mail'});saveRetDB();
  window.location.href='mailto:'+to+'?subject='+subject+'&body='+body
  toast('E-mail aberto no seu aplicativo de e-mail','success')
}

function copiarResumo(){
  if(!currentRet){toast('Nenhum comprovante para copiar','error');return}
  var r=currentRet
  var num=r.numero||'RET-'+String(r.id).padStart(4,'0')
  var txt='TERMO DE RETIRADA SEM OS\n'
  txt+='Número: '+num+(r.protocolo?' | Protocolo: '+r.protocolo:'')+' | Data: '+dataBr(r.dataRetirada)+' às '+r.horaRetirada+'\n'
  txt+='Cliente: '+r.cliente+(r.telefone?' ('+r.telefone+')':'')+'\n'
  txt+='Equipamento: '+r.equipamento+(r.marca?' - '+r.marca:'')+(r.modelo?' - '+r.modelo:'')+'\n'
  if(r.imei)txt+='IMEI: '+r.imei+'\n'
  if(r.motivo)txt+='Motivo: '+r.motivo+(r.motivoDesc?' - '+r.motivoDesc:'')+'\n'
  txt+='Garantia: '+(r.garantia||'90 dias')+'\n'
  if(r.valor)txt+='Valor: '+fmt$(r.valor)+'\n'
  txt+='Técnico: '+(r.tecnico||'Silvio')+'\n'
  txt+='InfoCelll - '+hoje()
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){toast('Resumo copiado!','success')}).catch(function(){fallbackCopy(txt)})
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

loadBarcodeLib(function(){});

document.addEventListener('keydown',function(e){
  if(e.ctrlKey&&e.key==='p'&&currentStep==='preview'&&currentRet){
    e.preventDefault()
    imprimirComprovante()
  }
});
