var PWA_LOCK={
  KEY:'ic_pwa_lock',
  cfg:null,
  timer:null,
  locked:false,
  overlay:null,
  _activityBound:false,

  init:function(){
    this.load();
    if(this.isEnabled()){
      this._bindActivity();
      this._resetTimer();
    }
    document.addEventListener('visibilitychange',function(){
      if(PWA_LOCK.isEnabled()){
        if(document.hidden){
          PWA_LOCK.lock();
        }else{
          PWA_LOCK._resetTimer();
        }
      }
    });
    window.addEventListener('online',function(){
      if(PWA_LOCK.isEnabled())PWA_LOCK._resetTimer();
    });
    window.addEventListener('focus',function(){
      if(PWA_LOCK.isEnabled())PWA_LOCK._resetTimer();
    });
  },

  load:function(){
    try{
      var c=localStorage.getItem(this.KEY);
      if(c)this.cfg=JSON.parse(c);
    }catch(e){}
    if(!this.cfg)this.cfg={enabled:false,pinHash:'',timeoutMin:5};
  },

  save:function(){
    try{localStorage.setItem(this.KEY,JSON.stringify(this.cfg))}catch(e){}
  },

  isEnabled:function(){
    return !!(this.cfg&&this.cfg.enabled&&this.cfg.pinHash);
  },

  enable:function(pin,timeoutMin){
    if(!pin||String(pin).length<4){
      if(typeof toast==='function')toast('PIN deve ter no minimo 4 digitos','error');
      return false;
    }
    this.cfg.enabled=true;
    this.cfg.pinHash=this._hash(String(pin));
    this.cfg.timeoutMin=Math.max(1,parseInt(timeoutMin,10)||5);
    this.save();
    this._bindActivity();
    this._resetTimer();
    if(typeof toast==='function')toast('Bloqueio por inatividade ativado ('+this.cfg.timeoutMin+' min)','success');
    return true;
  },

  disable:function(pin){
    if(!this.isEnabled())return true;
    if(this._hash(String(pin||''))!==this.cfg.pinHash){
      if(typeof toast==='function')toast('PIN incorreto','error');
      return false;
    }
    this.cfg.enabled=false;
    this.save();
    this._stopTimer();
    this.unlock(true);
    if(typeof toast==='function')toast('Bloqueio por inatividade desativado','info');
    return true;
  },

  changePin:function(oldPin,newPin){
    if(this.isEnabled()&&this._hash(String(oldPin||''))!==this.cfg.pinHash){
      if(typeof toast==='function')toast('PIN atual incorreto','error');
      return false;
    }
    return this.enable(newPin,this.cfg.timeoutMin);
  },

  _hash:function(s){
    var h=5381;
    for(var i=0;i<s.length;i++){h=((h<<5)+h+s.charCodeAt(i))>>>0}
    return 'h'+h.toString(16)+'_'+s.length;
  },

  _bindActivity:function(){
    if(this._activityBound)return;
    this._activityBound=true;
    ['pointerdown','keydown','touchstart','scroll','click'].forEach(function(ev){
      document.addEventListener(ev,function(){PWA_LOCK._resetTimer()},{passive:true});
    });
  },

  _resetTimer:function(){
    if(!this.isEnabled())return;
    this._stopTimer();
    var mins=this.cfg.timeoutMin||5;
    this.timer=setTimeout(function(){
      if(!document.hidden)PWA_LOCK.lock();
    },mins*60*1000);
  },

  _stopTimer:function(){
    if(this.timer){clearTimeout(this.timer);this.timer=null}
  },

  lock:function(){
    if(!this.isEnabled()||this.locked)return;
    if(document.getElementById('pwaLockOverlay'))return;
    this.locked=true;
    this._stopTimer();
    var ov=document.createElement('div');
    ov.id='pwaLockOverlay';
    ov.style.cssText='position:fixed;inset:0;z-index:999998;background:linear-gradient(160deg,#0a0e1a,#111827);display:flex;align-items:center;justify-content:center;padding:24px';
    ov.innerHTML='<div style="width:100%;max-width:320px;text-align:center">'+
      '<div style="width:64px;height:64px;margin:0 auto 16px;border-radius:16px;background:linear-gradient(135deg,#06b6d4,#0891b2);display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="logo-infocelll.png" alt="InfoCelll" style="width:100%;height:100%;object-fit:contain;border-radius:inherit"></div>'+
      '<div style="font-size:16px;font-weight:700;color:#f1f5f9;margin-bottom:4px">Tela Bloqueada</div>'+
      '<div style="font-size:12px;color:#94a3b8;margin-bottom:20px">Digite o PIN para desbloquear</div>'+
      '<input type="password" id="pwaLockPin" inputmode="numeric" autocomplete="off" placeholder="PIN" style="width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(100,116,139,.3);background:rgba(30,41,59,.6);color:#f1f5f9;font-size:16px;text-align:center;letter-spacing:8px;outline:none;margin-bottom:12px">'+
      '<button id="pwaLockBtn" style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#06b6d4,#0891b2);color:#fff;font-weight:700;font-size:14px;cursor:pointer">Desbloquear</button>'+
      '<div style="font-size:10px;color:#64748b;margin-top:14px">InfoCelll AI Center</div></div>';
    document.body.appendChild(ov);
    var input=ov.querySelector('#pwaLockPin');
    var btn=ov.querySelector('#pwaLockBtn');
    function tryUnlock(){
      var pin=input.value;
      if(PWA_LOCK._hash(pin)!==PWA_LOCK.cfg.pinHash){
        input.value='';
        input.placeholder='PIN incorreto - tente novamente';
        input.focus();
        return;
      }
      PWA_LOCK.unlock(false);
    }
    btn.addEventListener('click',tryUnlock);
    input.addEventListener('keydown',function(ev){
      if(ev.key==='Enter')tryUnlock();
    });
    setTimeout(function(){input.focus()},100);
  },

  unlock:function(silent){
    this.locked=false;
    if(this.overlay){
      this.overlay.remove();
      this.overlay=null;
    }
    var ov=document.getElementById('pwaLockOverlay');
    if(ov)ov.remove();
    if(this.isEnabled())this._resetTimer();
    if(!silent&&typeof toast==='function')toast('Desbloqueado','success');
  }
};

document.addEventListener('DOMContentLoaded',function(){PWA_LOCK.init()});
