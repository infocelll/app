/**
 * Central de IA - AI Provider
 * Executa prompts via provedores externos (Groq, Google Gemini, OpenAI-compatible)
 * ou em Modo Offline (sem API key — apenas gera e copia o prompt).
 */
(function(){
  var Store;
  function cfg(){return Store?Store.getConfig():{provider:'offline',apiKey:'',model:'',customUrl:''};}

  var PROV={
    groq:{name:'Groq',base:'https://api.groq.com/openai/v1/chat/completions',defModel:'llama-3.3-70b-versatile'},
    openai:{name:'OpenAI',base:'https://api.openai.com/v1/chat/completions',defModel:'gpt-4o-mini'},
    gemini:{name:'Google Gemini',base:'https://generativelanguage.googleapis.com/v1beta/models',defModel:'gemini-2.0-flash'},
    custom:{name:'URL Personalizada (OpenAI-compatível)',base:'',defModel:''}
  };

  function statusText(){
    var c=cfg();
    if(c.provider==='offline')return {txt:'Modo Offline',on:false};
    if(c.provider==='custom'){
      if(!c.customUrl)return {txt:'URL personalizada pendente',on:false};
      return {txt:'OpenAI-compatível (URL custom)',on:true};
    }
    if(!c.apiKey)return {txt:'Modo Offline (sem chave)',on:false};
    var p=PROV[c.provider]||PROV.groq;
    return {txt:p.name+' conectado',on:true};
  }

  function run(promptText){
    var c=cfg();
    if(c.provider==='offline'){
      return Promise.resolve({ok:false,offline:true,prompt:promptText});
    }
    if(c.provider==='custom'){
      var base=c.customUrl||'';
      if(!base)return Promise.resolve({ok:false,error:'URL personalizada não configurada. Acesse Configurações.'});
      var customModel=c.model||'default';
      return openaiCompatRun(base,c.apiKey||'',customModel,promptText);
    }
    if(!c.apiKey){
      return Promise.resolve({ok:false,offline:true,prompt:promptText});
    }
    var p=PROV[c.provider];
    if(!p)return Promise.resolve({ok:false,error:'Provedor não suportado.'});
    var model=c.model||p.defModel;

    if(c.provider==='gemini'){
      return geminiRun(p,model,c.apiKey,promptText);
    }
    return openaiCompatRun(p.base,c.apiKey,model,promptText);
  }

  function openaiCompatRun(base,key,model,promptText){
    var controller=typeof AbortController!=='undefined'?new AbortController():null;
    var timer=controller?setTimeout(function(){controller.abort();},60000):null;
    function clearTimer(){if(timer){clearTimeout(timer);timer=null;}}
    return fetch(base,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body:JSON.stringify({model:model,messages:[{role:'user',content:promptText}],temperature:0.7}),
      signal:controller?controller.signal:undefined
    }).then(function(res){
      clearTimer();
      if(!res.ok)return res.json().then(function(d){return {ok:false,error:(d.error&&(d.error.message||d.error.code))||('Erro HTTP '+res.status)};}).catch(function(){return {ok:false,error:'Erro HTTP '+res.status};});
      return res.json().then(function(d){
        var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'';
        return {ok:true,text:txt,model:model};
      });
    }).catch(function(err){
      clearTimer();
      if(err&&err.name==='AbortError')return {ok:false,error:'Timeout: o provedor não respondeu em 60s.'};
      return {ok:false,error:'Falha de rede: '+(err&&err.message?err.message:err)};
    });
  }

  function geminiRun(p,model,key,promptText){
    var controller=typeof AbortController!=='undefined'?new AbortController():null;
    var timer=controller?setTimeout(function(){controller.abort();},60000):null;
    function clearTimer(){if(timer){clearTimeout(timer);timer=null;}}
    var url=p.base+'/'+model+':generateContent?key='+encodeURIComponent(key);
    return fetch(url,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:promptText}]}]}),
      signal:controller?controller.signal:undefined
    }).then(function(res){
      clearTimer();
      if(!res.ok)return res.json().then(function(d){return {ok:false,error:(d.error&&d.error.message)||('Erro HTTP '+res.status)};}).catch(function(){return {ok:false,error:'Erro HTTP '+res.status};});
      return res.json().then(function(d){
        var txt='';
        try{txt=(d.candidates[0].content.parts||[]).map(function(x){return x.text||'';}).join('');}catch(e){}
        return {ok:true,text:txt,model:model};
      });
    }).catch(function(err){
      clearTimer();
      if(err&&err.name==='AbortError')return {ok:false,error:'Timeout: o provedor não respondeu em 60s.'};
      return {ok:false,error:'Falha de rede: '+(err&&err.message?err.message:err)};
    });
  }

  function copy(text){
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){
        return navigator.clipboard.writeText(text).then(function(){return true;});
      }
      var ta=document.createElement('textarea');
      ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();
      var ok=document.execCommand('copy');
      document.body.removeChild(ta);
      return Promise.resolve(ok);
    }catch(e){return Promise.resolve(false);}
  }

  window.CentralAI=window.CentralAI||{};
  window.CentralAI.AI={run:run,copy:copy,statusText:statusText,PROV:PROV,setStore:function(s){Store=s;}};
})();