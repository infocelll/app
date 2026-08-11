/**
 * Central de IA - App
 * Navegação, renderização de views, busca global, modal de ferramentas,
 * biblioteca de prompts, histórico, favoritos e configurações.
 */
(function(){
  var S,A,D,V;
  var currentView='dashboard';

  function $(id){return document.getElementById(id);}
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function toolById(id){for(var i=0;i<D.length;i++){if(D[i].id===id)return D[i];}return null;}
  function toolsByView(v){return D.filter(function(t){return t.view===v;});}

  /* ---------- helpers ---------- */
  function showToast(msg,icon){
    var box=$('ciaToasts');
    var el=document.createElement('div');
    el.className='cia-toast';
    el.innerHTML='<span class="cia-toast-ico">'+(icon||'✅')+'</span>'+esc(msg);
    box.appendChild(el);
    setTimeout(function(){el.classList.add('out');},2200);
    setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},2500);
  }

  function copyText(text,msg){
    A.copy(text).then(function(ok){
      showToast(ok?(msg||'Copiado para a área de transferência'):'Não foi possível copiar automaticamente',ok?'📋':'⚠️');
    });
  }

  function openModal(title,html){
    $('ciaModalTitle').textContent=title;
    $('ciaModalBody').innerHTML=html;
    $('ciaModalOverlay').classList.add('show');
  }
  function closeModal(){
    $('ciaModalOverlay').classList.remove('show');
    $('ciaModalBody').innerHTML='';
  }

  /* ---------- navegação ---------- */
  function go(view){
    currentView=view;
    document.querySelectorAll('.cia-view').forEach(function(el){el.classList.remove('active');});
    var target=$('view-'+view);
    if(target)target.classList.add('active');
    document.querySelectorAll('#ciaNav .cia-nav-item').forEach(function(b){
      b.classList.toggle('active',b.getAttribute('data-view')===view);
    });
    renderView(view);
    window.scrollTo(0,0);
    $('ciaGlobalSearch').value='';
    hideSearch();
  }

  function renderView(view){
    switch(view){
      case 'dashboard':renderDashboard();break;
      case 'atendimento':case 'os':case 'orcamento':case 'garantia':case 'marketing':case 'programacao':case 'diagnostico':case 'documentos':
        renderToolsGrid(view);break;
      case 'prompts':renderPrompts();break;
      case 'favoritas':renderFavorites();break;
      case 'historico':renderHistory();break;
      case 'config':renderConfig();break;
    }
  }

  /* ---------- cards de ferramentas ---------- */
  function toolCard(t){
    var fav=S.isFavorite(t.id);
    return '<div class="cia-tool" onclick="CentralAI.openTool(\''+t.id+'\')">'+
      '<button class="cia-fav-btn'+(fav?' active':'')+'" onclick="event.stopPropagation();CentralAI.toggleFav(\''+t.id+'\')" title="Favoritar">'+(fav?'★':'☆')+'</button>'+
      '<div class="cia-tool-ico">'+t.icon+'</div>'+
      '<h4>'+esc(t.nome)+'</h4>'+
      '<p>'+esc(t.desc)+'</p>'+
      '</div>';
  }

  function renderToolsGrid(view){
    var tools=toolsByView(view);
    var title=V[view]||'Ferramentas';
    var sub='Ferramentas de '+title.toLowerCase();
    var html='<div class="cia-view-title">'+esc(title)+'</div><div class="cia-view-sub">'+esc(sub)+'</div>';
    html+='<div class="cia-grid" id="ciaGrid">'+tools.map(toolCard).join('')+'</div>';
    $('view-'+view).innerHTML=html;
  }

  /* ---------- dashboard ---------- */
  function renderDashboard(){
    var favs=S.getFavorites().map(toolById).filter(Boolean);
    var hist=S.getHistory();
    var prompts=S.getPrompts();
    var totalTools=D.length;

    var html='<div class="cia-hero">'+
      '<h1>Olá! 👋 Central de Inteligência InfoCelll</h1>'+
      '<p>Organize, gere e execute prompts de IA para atendimento, ordens de serviço, orçamentos, garantia, marketing, programação, diagnóstico técnico e documentos. Tudo em um só lugar.</p>'+
      '</div>';

    html+='<div class="cia-stats">'+
      '<div class="cia-stat"><b>'+totalTools+'</b><span>Ferramentas</span></div>'+
      '<div class="cia-stat"><b>'+prompts.length+'</b><span>Prompts salvos</span></div>'+
      '<div class="cia-stat"><b>'+favs.length+'</b><span>Favoritas</span></div>'+
      '<div class="cia-stat"><b>'+hist.length+'</b><span>No histórico</span></div>'+
      '</div>';

    html+='<div class="cia-sec-title">⭐ Ferramentas favoritas</div>';
    html+='<div class="cia-grid">'+(favs.length?favs.map(toolCard).join(''):'<div class="cia-empty" style="grid-column:1/-1"><span class="cia-empty-ico">⭐</span><b>Nenhuma favorita ainda</b><span>Toque na estrela de uma ferramenta para fixá-la aqui.</span></div>')+'</div>';

    html+='<div class="cia-sec-title" style="margin-top:26px">🕘 Últimos prompts utilizados</div>';
    html+='<div class="cia-list">'+(hist.length?hist.slice(0,5).map(function(h){
      return '<div class="cia-list-item"><div class="cia-li-ico">'+(h.icon||'🤖')+'</div><div class="cia-li-main"><b>'+esc(h.tool||'Prompt')+'</b><small>'+esc(h.preview||'')+'</small></div>'+
        '<div class="cia-li-actions"><button class="cia-btn cia-sm" onclick="CentralAI.copyText(this.dataset.t)" data-t="'+esc(h.prompt||'')+'">Copiar</button></div></div>';
    }).join(''):'<div class="cia-empty"><span class="cia-empty-ico">🕘</span><b>Histórico vazio</b><span>Use qualquer ferramenta para registrar aqui.</span></div>')+'</div>';

    $('view-dashboard').innerHTML=html;
  }

  /* ---------- modal da ferramenta ---------- */
  function fieldHtml(f){
    var req=f.r?'<span style="color:var(--cia-red)"> *</span>':'';
    var lab='<label>'+esc(f.l)+req+'</label>';
    var v='';
    if(f.t==='textarea'){
      v='<textarea name="'+esc(f.k)+'" placeholder="'+esc(f.ph||'')+'" data-r="'+(f.r?1:0)+'">'+esc(f.v||'')+'</textarea>';
    }else if(f.t==='select'){
      v='<select name="'+esc(f.k)+'">'+(f.op||[]).map(function(o){return '<option'+(f.v===o?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select>';
    }else{
      v='<input type="text" name="'+esc(f.k)+'" placeholder="'+esc(f.ph||'')+'" value="'+esc(f.v||'')+'" data-r="'+(f.r?1:0)+'">';
    }
    return '<div class="cia-field">'+lab+v+'<div class="cia-hint" style="display:none" data-hint="'+esc(f.k)+'">Preencha este campo.</div></div>';
  }

  function openTool(id){
    var t=toolById(id);
    if(!t)return;
    var fields=t.fields||[];
    var html='<div class="cia-form">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div class="cia-tool-ico" style="width:40px;height:40px;font-size:19px;display:flex;align-items:center;justify-content:center;background:var(--cia-rd);border-radius:10px">'+t.icon+'</div><div><div style="font-weight:800;font-size:14px">'+esc(t.nome)+'</div><div style="font-size:11px;color:var(--cia-txt3)">'+esc(t.cat)+'</div></div></div>'+
      fields.map(fieldHtml).join('')+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">'+
        '<button class="cia-btn cia-pri" onclick="CentralAI.runTool(\''+t.id+'\')">🚀 Gerar prompt</button>'+
        '<button class="cia-btn" onclick="CentralAI.runTool(\''+t.id+'\',true)">⚡ Gerar + Enviar à IA</button>'+
      '</div>'+
      '<div class="cia-output" id="ciaOut"></div>'+
      '<div class="cia-output-bar" id="ciaOutBar">'+
        '<button class="cia-btn cia-pri" onclick="CentralAI.copyOut()">📋 Copiar</button>'+
        '<button class="cia-btn" onclick="CentralAI.savePromptFromOut()">💾 Salvar prompt</button>'+
      '</div>'+
      '</div>';
    openModal(esc(t.nome),html);
    var modal=$('ciaModalBody');
    modal.querySelectorAll('[data-r="1"]').forEach(function(el){
      el.addEventListener('input',function(){
        var hint=modal.querySelector('[data-hint="'+el.name+'"]');
        if(hint)hint.style.display='none';
        el.style.borderColor='';
      });
    });
  }

  function collectValues(){
    var out={};
    var modal=$('ciaModalBody');
    var fields=modal.querySelectorAll('.cia-field input,.cia-field textarea,.cia-field select');
    fields.forEach(function(el){
      out[el.name]=el.value;
    });
    return out;
  }

  function validate(){
    var ok=true;
    var modal=$('ciaModalBody');
    modal.querySelectorAll('[data-r="1"]').forEach(function(el){
      if(!el.value.trim()){
        var hint=modal.querySelector('[data-hint="'+el.name+'"]');
        if(hint)hint.style.display='block';
        el.style.borderColor='var(--cia-red)';
        ok=false;
      }else{
        var hint=modal.querySelector('[data-hint="'+el.name+'"]');
        if(hint)hint.style.display='none';
        el.style.borderColor='';
      }
    });
    return ok;
  }

  function runTool(id,autoRun){
    if(!validate()){showToast('Preencha os campos obrigatórios','⚠️');return;}
    var t=toolById(id);
    var vals=collectValues();
    var promptText;
    try{promptText=t.prompt(vals);}catch(e){promptText='Erro ao gerar prompt: '+e.message;}
    var out=$('ciaOut'),bar=$('ciaOutBar');
    if(!out)return;
    out.textContent=promptText;
    out.classList.add('show');
    if(bar){bar.classList.add('show');bar.dataset.prompt=promptText;}

    var histEntry=S.addHistory({tool:t.nome,icon:t.icon,prompt:promptText,preview:promptText.slice(0,90)+'…',date:new Date().toISOString()});

    if(autoRun){
      out.textContent='⏳ Enviando para a IA...';
      A.run(promptText).then(function(r){
        if(!r.ok){
          if(r.offline){out.textContent=promptText;showToast('Modo Offline: prompt gerado. Configure a IA em Configurações.','ℹ️');}
          else{out.textContent=promptText;showToast('Erro: '+(r.error||'falha'),'❌');}
        }else{
          out.textContent=r.text;
          S.updateLastHistory(histEntry&&histEntry.id,{resp:r.text,preview:(promptText.slice(0,60)+'… → '+(r.text||'').slice(0,40)+'…')});
          showToast('Resposta recebida','🤖');
        }
        if(bar)bar.classList.add('show');
      });
    }else{
      showToast('Prompt gerado!','✨');
    }
  }

  function copyOut(){
    var bar=$('ciaOutBar');
    var txt=bar?bar.dataset.prompt:'';
    var out=$('ciaOut');
    var isResponse=false;
    if(out&&out.classList.contains('show')&&out.textContent.indexOf('⏳')<0){
      txt=out.textContent;
      isResponse=true;
    }
    copyText(txt||'',isResponse?'Resposta copiada!':'Prompt copiado!');
  }

  function savePromptFromOut(){
    var bar=$('ciaOutBar');
    var txt=bar?bar.dataset.prompt:'';
    var out=$('ciaOut');
    if(out&&out.classList.contains('show')&&out.textContent.indexOf('⏳')<0)txt=out.textContent;
    var prompts=S.getPrompts();
    prompts.push({id:S.uid('p'),nome:('Prompt '+(prompts.length+1)),texto:txt,cat:'Geral',criado:new Date().toISOString()});
    S.savePrompts(prompts);
    showToast('Prompt salvo na biblioteca','💾');
  }

  /* ---------- busca global ---------- */
  function onSearch(val){
    var box=$('ciaSearchResults');
    if(!val.trim()){hideSearch();return;}
    var q=val.toLowerCase();
    var tools=D.filter(function(t){
      return (t.nome+' '+t.desc+' '+t.tags.join(' ')+' '+t.cat).toLowerCase().indexOf(q)>=0;
    });
    var prompts=S.getPrompts().filter(function(p){
      return (p.nome+' '+p.texto+' '+(p.cat||'')).toLowerCase().indexOf(q)>=0;
    });
    var html='';
    tools.slice(0,8).forEach(function(t){
      html+='<div class="cia-sr-item" onclick="CentralAI.openTool(\''+t.id+'\')"><div class="cia-ico">'+t.icon+'</div><div><b>'+esc(t.nome)+'</b><small>'+esc(t.desc)+'</small></div><span class="cia-sr-cat">'+esc(t.cat)+'</span></div>';
    });
    prompts.slice(0,5).forEach(function(p){
      html+='<div class="cia-sr-item" onclick="CentralAI.openSavedPrompt(\''+p.id+'\')"><div class="cia-ico">💾</div><div><b>'+esc(p.nome)+'</b><small>'+esc(p.texto.slice(0,80))+'</small></div><span class="cia-sr-cat">Prompt</span></div>';
    });
    if(!html){html='<div class="cia-sr-item" style="justify-content:center"><small>Nada encontrado para "'+esc(val)+'"</small></div>';}
    box.innerHTML=html;
    box.classList.add('show');
  }
  function hideSearch(){$('ciaSearchResults').classList.remove('show');}

  /* ---------- biblioteca de prompts ---------- */
  function renderPrompts(){
    var prompts=S.getPrompts();
    var cats=['Geral','Atendimento','OS','Marketing','Programação','Outros'];
    var html='<div class="cia-view-title">📚 Biblioteca de Prompts</div>'+
      '<div class="cia-view-sub">Crie, edite, duplique e favorite seus prompts reutilizáveis.</div>'+
      '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">'+
        '<button class="cia-btn cia-pri" onclick="CentralAI.openPromptEditor()">＋ Novo prompt</button>'+
        '<input type="text" id="ciaPromptSearch" placeholder="Buscar na biblioteca..." oninput="CentralAI.filterPrompts(this.value)" style="flex:1;min-width:200px;padding:9px 12px;border-radius:10px;border:1.5px solid var(--cia-border);background:var(--cia-card);color:var(--cia-txt);outline:none">'+
      '</div>';
    html+='<div class="cia-list" id="ciaPromptList">'+prompts.map(promptItem).join('')+'</div>';
    if(!prompts.length)html+='<div class="cia-empty" style="padding-top:20px"><span class="cia-empty-ico">📚</span><b>Biblioteca vazia</b><span>Salve prompts gerados nas ferramentas ou crie novos.</span></div>';
    $('view-prompts').innerHTML=html;
  }

  function promptItem(p){
    var fav=S.getFavPrompts().indexOf(p.id)>=0;
    return '<div class="cia-list-item" data-pid="'+p.id+'">'+
      '<div class="cia-li-ico">'+(fav?'⭐':'💾')+'</div>'+
      '<div class="cia-li-main"><b>'+esc(p.nome)+'</b><small>'+esc((p.cat||'Geral'))+' · '+esc((p.texto||'').slice(0,110))+'</small></div>'+
      '<div class="cia-li-actions">'+
        '<button class="cia-btn cia-sm" onclick="CentralAI.copyPrompt(\''+p.id+'\')" title="Copiar">📋</button>'+
        '<button class="cia-btn cia-sm" onclick="CentralAI.toggleFavPrompt(\''+p.id+'\')" title="Favoritar">'+(fav?'⭐':'☆')+'</button>'+
        '<button class="cia-btn cia-sm" onclick="CentralAI.openPromptEditor(\''+p.id+'\')" title="Editar">✏️</button>'+
        '<button class="cia-btn cia-sm" onclick="CentralAI.duplicatePrompt(\''+p.id+'\')" title="Duplicar">📑</button>'+
        '<button class="cia-btn cia-sm cia-danger" onclick="CentralAI.deletePrompt(\''+p.id+'\')" title="Excluir">🗑️</button>'+
      '</div></div>';
  }

  function openPromptEditor(id){
    var p=id?S.getPrompts().filter(function(x){return x.id===id;})[0]:null;
    var html='<div class="cia-form">'+
      '<div class="cia-field"><label>Nome</label><input id="ppNome" value="'+esc(p?p.nome:'')+'"></div>'+
      '<div class="cia-field"><label>Categoria</label><select id="ppCat"><option>Geral</option><option>Atendimento</option><option>OS</option><option>Marketing</option><option>Programação</option><option>Outros</option></select></div>'+
      '<div class="cia-field"><label>Prompt</label><textarea id="ppTexto" style="min-height:200px">'+esc(p?p.texto:'')+'</textarea></div>'+
      '<div style="display:flex;gap:8px"><button class="cia-btn cia-pri" onclick="CentralAI.savePromptEditor(\''+(p?p.id:'')+'\')">💾 Salvar</button><button class="cia-btn" onclick="CentralAI.closeModal()">Cancelar</button></div>'+
      '</div>';
    openModal(p?'Editar prompt':'Novo prompt',html);
    if(p){
      var sel=$('ppCat');
      for(var i=0;i<sel.options.length;i++){if(sel.options[i].value===p.cat)sel.selectedIndex=i;}
    }
  }

  function savePromptEditor(id){
    var nome=($('ppNome').value||'').trim();
    var texto=$('ppTexto').value;
    var cat=$('ppCat').value;
    if(!nome||!texto.trim()){showToast('Nome e prompt são obrigatórios','⚠️');return;}
    var prompts=S.getPrompts();
    if(id){
      var p=prompts.filter(function(x){return x.id===id;})[0];
      if(p){p.nome=nome;p.texto=texto;p.cat=cat;}
    }else{
      prompts.push({id:S.uid('p'),nome:nome,texto:texto,cat:cat,criado:new Date().toISOString()});
    }
    S.savePrompts(prompts);
    closeModal();
    renderPrompts();
    showToast('Prompt salvo','💾');
  }

  function deletePrompt(id){
    if(!confirm('Excluir este prompt?'))return;
    var prompts=S.getPrompts().filter(function(x){return x.id!==id;});
    S.savePrompts(prompts);
    renderPrompts();
    showToast('Prompt excluído','🗑️');
  }

  function duplicatePrompt(id){
    var p=S.getPrompts().filter(function(x){return x.id===id;})[0];
    if(!p)return;
    var prompts=S.getPrompts();
    prompts.push({id:S.uid('p'),nome:p.nome+' (cópia)',texto:p.texto,cat:p.cat,criado:new Date().toISOString()});
    S.savePrompts(prompts);
    renderPrompts();
    showToast('Prompt duplicado','📑');
  }

  function copyPrompt(id){
    var p=S.getPrompts().filter(function(x){return x.id===id;})[0];
    if(p)copyText(p.texto,'Prompt copiado!');
  }

  function toggleFavPrompt(id){
    S.toggleFavPrompt(id);
    if(currentView==='favoritas')renderFavorites();
    else renderPrompts();
  }

  function filterPrompts(q){
    var prompts=S.getPrompts().filter(function(p){
      return !q||(p.nome+' '+p.texto+' '+(p.cat||'')).toLowerCase().indexOf(q.toLowerCase())>=0;
    });
    var list=$('ciaPromptList');
    if(list)list.innerHTML=prompts.map(promptItem).join('');
  }

  function openSavedPrompt(id){
    var p=S.getPrompts().filter(function(x){return x.id===id;})[0];
    if(!p)return;
    var html='<div class="cia-form">'+
      '<div style="font-weight:800;margin-bottom:8px">'+esc(p.nome)+'</div>'+
      '<div class="cia-output show" style="display:block;white-space:pre-wrap">'+esc(p.texto)+'</div>'+
      '<div style="display:flex;gap:8px;margin-top:12px"><button class="cia-btn cia-pri" onclick="CentralAI.copyText(this.dataset.t)" data-t="'+esc(p.texto)+'">📋 Copiar</button></div>'+
      '</div>';
    openModal('Prompt salvo',html);
  }

  /* ---------- favoritas ---------- */
  function renderFavorites(){
    var favs=S.getFavorites().map(toolById).filter(Boolean);
    var favPrompts=S.getPrompts().filter(function(p){return S.getFavPrompts().indexOf(p.id)>=0;});
    var html='<div class="cia-view-title">⭐ Favoritas</div><div class="cia-view-sub">Suas ferramentas e prompts favoritos reunidos.</div>';
    html+='<div class="cia-sec-title">Ferramentas favoritas</div><div class="cia-grid">'+(favs.length?favs.map(toolCard).join(''):'<div class="cia-empty" style="grid-column:1/-1"><span class="cia-empty-ico">⭐</span><b>Nenhuma ferramenta favorita</b><span>Use a estrela nos cards para favoritar.</span></div>')+'</div>';
    html+='<div class="cia-sec-title" style="margin-top:26px">Prompts favoritos</div><div class="cia-list">'+(favPrompts.length?favPrompts.map(promptItem).join(''):'<div class="cia-empty"><span class="cia-empty-ico">⭐</span><b>Nenhum prompt favorito</b><span>Favorite prompts na biblioteca.</span></div>')+'</div>';
    $('view-favoritas').innerHTML=html;
  }

  /* ---------- histórico ---------- */
  function renderHistory(){
    var hist=S.getHistory();
    var html='<div class="cia-view-title">🕘 Histórico</div><div class="cia-view-sub">Últimos 100 prompts utilizados.</div>';
    html+='<div style="margin-bottom:14px"><button class="cia-btn cia-danger" onclick="CentralAI.clearHistory()">🗑️ Limpar histórico</button></div>';
    html+='<div class="cia-list">'+(hist.length?hist.map(function(h,i){
      var d=h.date?new Date(h.date):new Date();
      if(isNaN(d.getTime()))d=new Date();
      var ds=d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      return '<div class="cia-list-item"><div class="cia-li-ico">'+(h.icon||'🤖')+'</div><div class="cia-li-main"><b>'+esc(h.tool||'Prompt')+'</b><small>'+esc(ds)+' · '+esc(h.preview||'')+'</small></div>'+
        '<div class="cia-li-actions"><button class="cia-btn cia-sm" onclick="CentralAI.copyText(this.dataset.t)" data-t="'+esc(h.prompt||'')+'" title="Copiar" aria-label="Copiar">📋</button></div></div>';
    }).join(''):'<div class="cia-empty"><span class="cia-empty-ico">🕘</span><b>Histórico vazio</b><span>Os prompts gerados aparecerão aqui.</span></div>')+'</div>';
    $('view-historico').innerHTML=html;
  }

  function clearHistory(){
    if(!confirm('Limpar todo o histórico?'))return;
    S.clearHistory();
    renderHistory();
    showToast('Histórico limpo','🧹');
  }

  /* ---------- configurações ---------- */
  function renderConfig(){
    var c=S.getConfig();
    var provOpts=Object.keys(A.PROV).map(function(k){
      var p=A.PROV[k];
      var sub=k==='custom'?'Endpoint OpenAI-compatível (Ollama, LM Studio, OpenRouter...)':'Modelo padrão: '+(p.defModel||'—');
      return '<label class="cia-opt'+(c.provider===k?' active':'')+'" onclick="CentralAI.selectProvider(\''+k+'\')"><input type="radio" name="ciaProv" value="'+k+'"'+(c.provider===k?' checked':'')+'><div><b>'+p.name+'</b><small>'+esc(sub)+'</small></div></label>';
    }).join('');

    var html='<div class="cia-view-title">⚙️ Configurações</div><div class="cia-view-sub">Conecte a Central de IA ao seu provedor de IA favorito.</div>';

    html+='<div class="cia-config-card"><h3>🤖 Provedor de IA</h3>'+provOpts+
      '<label class="cia-opt'+(c.provider==='offline'?' active':'')+'" onclick="CentralAI.selectProvider(\'offline\')"><input type="radio" name="ciaProv" value="offline"'+(c.provider==='offline'?' checked':'')+'><div><b>Modo Offline</b><small>Sem chave de API — gera prompts prontos para copiar e usar em qualquer IA.</small></div></label>'+
      '</div>';

    html+='<div class="cia-config-card"><h3>🔑 Chave de API</h3>'+
      '<div class="cia-form"><div class="cia-field"><label>API Key</label><input id="ciaApiKey" type="password" value="'+esc(c.apiKey||'')+'" placeholder="Cole sua chave aqui"></div>'+
      '<div class="cia-field"><label>Modelo (opcional — deixe vazio para usar o padrão)</label><input id="ciaModel" value="'+esc(c.model||'')+'" placeholder="ex.: llama-3.3-70b-versatile"></div>'+
      '<div class="cia-field" id="ciaCustomUrlWrap" style="'+(c.provider==='custom'?'':'display:none')+'"><label>URL personalizada (endpoint OpenAI-compatível)</label><input id="ciaCustomUrl" value="'+esc(c.customUrl||'')+'" placeholder="ex.: http://localhost:11434/v1/chat/completions"><div class="cia-hint" style="color:var(--cia-txt3);font-size:11px;margin-top:4px">Para Ollama, LM Studio, OpenRouter ou qualquer API compatível com OpenAI. Modelo vazio usa "default".</div></div>'+
      '<button class="cia-btn cia-pri" onclick="CentralAI.saveConfig()">💾 Salvar configuração</button></div></div>';

    html+='<div class="cia-config-card"><h3>🎨 Aparência</h3>'+
      '<div style="display:flex;gap:8px"><button class="cia-btn'+(S.getTheme()==='dark'?' cia-pri':'')+'" onclick="CentralAI.setTheme(\'dark\')">🌙 Escuro</button><button class="cia-btn'+(S.getTheme()==='light'?' cia-pri':'')+'" onclick="CentralAI.setTheme(\'light\')">☀️ Claro</button></div></div>';

    html+='<div class="cia-config-card"><h3>ℹ️ Sobre</h3>'+
      '<p style="font-size:12px;color:var(--cia-txt2);line-height:1.6">A Central de IA é um hub de ferramentas e prompts. Ela não possui IA própria: os prompts gerados são executados pelo provedor configurado (Groq, Gemini ou OpenAI-compatible) ou copiados para uso em qualquer ferramenta de IA. Seus dados ficam salvos localmente neste dispositivo.</p></div>';

    $('view-config').innerHTML=html;
  }

  function selectProvider(k){
    var c=S.getConfig();
    c.provider=k;
    S.saveConfig(c);
    document.querySelectorAll('.cia-opt').forEach(function(el){el.classList.toggle('active',el.querySelector('input')&&el.querySelector('input').value===k);});
    var w=$('ciaCustomUrlWrap');
    if(w)w.style.display=k==='custom'?'':'none';
    updateBadge();
  }

  function saveConfig(){
    var c=S.getConfig();
    c.apiKey=($('ciaApiKey').value||'').trim();
    c.model=($('ciaModel').value||'').trim();
    var cu=$('ciaCustomUrl');
    if(cu)c.customUrl=(cu.value||'').trim();
    S.saveConfig(c);
    updateBadge();
    showToast('Configuração salva','💾');
  }

  function updateBadge(){
    var st=A.statusText();
    var badge=$('ciaProviderBadge');
    if(badge){
      badge.textContent=st.txt;
      badge.classList.toggle('online',st.on);
    }
    var mt=$('metaTheme');
    if(mt)mt.setAttribute('content',S.getTheme()==='dark'?'#0b0f1a':'#f1f5fb');
  }

  function setTheme(t){
    S.setTheme(t);
    document.documentElement.setAttribute('data-theme',t);
    var btn=$('ciaThemeToggle');
    btn.textContent=t==='dark'?'☀️':'🌙';
    updateBadge();
    if(currentView==='config')renderConfig();
  }

  function toggleFav(id){
    var on=S.toggleFavorite(id);
    showToast(on?'Adicionada às favoritas':'Removida das favoritas',on?'⭐':'☆');
    if(currentView==='favoritas')renderFavorites();
    else if(currentView==='dashboard')renderDashboard();
    else{
      var t=toolById(id);
      if(t)renderToolsGrid(t.view);
    }
  }

  function init(){
    S=window.CentralAI.Store;
    A=window.CentralAI.AI;
    D=window._CIA_TOOLS||[];
    V=window._CI_VIEWS||{};
    A.setStore(S);

    var savedTheme=S.getTheme();
    document.documentElement.setAttribute('data-theme',savedTheme);
    var tb=$('ciaThemeToggle');
    if(tb)tb.textContent=savedTheme==='dark'?'☀️':'🌙';
    updateBadge();

    $('ciaGlobalSearch').addEventListener('input',function(e){onSearch(e.target.value);});
    $('ciaGlobalSearch').addEventListener('keydown',function(e){if(e.key==='Enter')hideSearch();});
    document.addEventListener('click',function(e){
      if(!e.target.closest('.cia-search'))hideSearch();
    });
    document.querySelectorAll('#ciaNav .cia-nav-item').forEach(function(btn){
      btn.addEventListener('click',function(){
        go(btn.getAttribute('data-view'));
        closeSidebar();
      });
    });
    var mt=$('ciaMenuToggle');
    if(mt)mt.addEventListener('click',toggleSidebar);
    document.addEventListener('click',function(e){
      if(window.innerWidth<=560&&!e.target.closest('.cia-sb')&&!e.target.closest('#ciaMenuToggle'))closeSidebar();
    });
    $('ciaThemeToggle').addEventListener('click',function(){
      setTheme(S.getTheme()==='dark'?'light':'dark');
    });
    $('ciaModalOverlay').addEventListener('click',function(e){if(e.target===this)closeModal();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();});

    renderDashboard();
  }

  function toggleSidebar(){
    var sb=$('ciaSidebar');
    if(!sb)return;
    sb.classList.toggle('open');
    var mt=$('ciaMenuToggle');
    if(mt)mt.setAttribute('aria-label',sb.classList.contains('open')?'Fechar menu':'Abrir menu');
  }
  function closeSidebar(){
    var sb=$('ciaSidebar');
    if(sb)sb.classList.remove('open');
  }

  window.CentralAI=window.CentralAI||{};
  Object.assign(window.CentralAI,{
    openTool:openTool,runTool:runTool,copyOut:copyOut,savePromptFromOut:savePromptFromOut,
    toggleFav:toggleFav,openPromptEditor:openPromptEditor,savePromptEditor:savePromptEditor,
    deletePrompt:deletePrompt,duplicatePrompt:duplicatePrompt,copyPrompt:copyPrompt,
    toggleFavPrompt:toggleFavPrompt,filterPrompts:filterPrompts,openSavedPrompt:openSavedPrompt,
    copyText:copyText,clearHistory:clearHistory,selectProvider:selectProvider,saveConfig:saveConfig,
    setTheme:setTheme,closeModal:closeModal,init:init
  });

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}
})();