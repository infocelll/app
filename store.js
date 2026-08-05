/**
 * Central de IA - Store
 * Persistência local via localStorage (favoritos, histórico, prompts, config).
 */
(function(){
  var KEY_FAV='cia_favorites';
  var KEY_HIST='cia_history';
  var KEY_PROMPTS='cia_prompts';
  var KEY_FAVPROMPTS='cia_favPrompts';
  var KEY_CFG='cia_config';
  var KEY_THEME='cia_theme';

  function load(k,fallback){
    try{
      var raw=localStorage.getItem(k);
      return raw?JSON.parse(raw):fallback;
    }catch(e){return fallback;}
  }
  function save(k,v){
    try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}
  }
  function deepCopy(o){return o?JSON.parse(JSON.stringify(o)):o;}

  var Store={
    getFavorites:function(){return load(KEY_FAV,[]);},
    isFavorite:function(id){return Store.getFavorites().indexOf(id)>=0;},
    toggleFavorite:function(id){
      var f=Store.getFavorites();
      var i=f.indexOf(id);
      if(i>=0){f.splice(i,1);Store.saveFavorites(f);return false;}
      f.push(id);Store.saveFavorites(f);return true;
    },
    saveFavorites:function(f){save(KEY_FAV,f);},

    getHistory:function(){return load(KEY_HIST,[]);},
    addHistory:function(entry){
      var h=Store.getHistory();
      h.unshift(entry);
      if(h.length>100)h=h.slice(0,100);
      save(KEY_HIST,h);
    },
    clearHistory:function(){save(KEY_HIST,[]);},

    getPrompts:function(){return load(KEY_PROMPTS,[]);},
    savePrompts:function(p){save(KEY_PROMPTS,p);},

    getFavPrompts:function(){return load(KEY_FAVPROMPTS,[]);},
    toggleFavPrompt:function(id){
      var f=Store.getFavPrompts();var i=f.indexOf(id);
      if(i>=0){f.splice(i,1);Store.saveFavPrompts(f);return false;}
      f.push(id);Store.saveFavPrompts(f);return true;
    },
    saveFavPrompts:function(f){save(KEY_FAVPROMPTS,f);},

    getConfig:function(){return load(KEY_CFG,{provider:'offline',apiKey:'',model:'',customUrl:''});},
    saveConfig:function(c){save(KEY_CFG,c);},

    getTheme:function(){return localStorage.getItem(KEY_THEME)||'dark';},
    setTheme:function(t){localStorage.setItem(KEY_THEME,t);}
  };

  window.CentralAI=window.CentralAI||{};
  window.CentralAI.Store=Store;
})();