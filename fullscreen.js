/* Bouton commun de plein écran. Aucun état de jeu n'est modifié. */
(() => {
 'use strict';
 if(window.FLEFullscreen)return;
 const doc=document,root=doc.documentElement,buttons=[];
 const expand='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>';
 const collapse='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h5V3M21 8h-5V3M16 21v-5h5M8 21v-5H3"/></svg>';
 let fallback=false,busy=false,modeTarget=null,headerButton=null,playerButton=null,player=null,wasOpen=false;
 const nativeElement=()=>doc.fullscreenElement||doc.webkitFullscreenElement||null;
 const target=()=>doc.querySelector('#player.open')||root;
 function activeContext(){
  if(nativeElement()||fallback)return window;
  try{if(window.parent!==window&&window.parent.FLEFullscreen?.active)return window.parent;}catch{}
  return null;
 }
 function update(){
  const context=activeContext(),active=!!context;
  let enlarged=fallback;try{if(context&&context!==window)enlarged=context.FLEFullscreen.fallback;}catch{}
  root.classList.toggle('fle-fullscreen-on',active);
  for(const button of buttons){button.innerHTML=active?collapse:expand;button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',active?(enlarged?'Quitter l’affichage agrandi':'Quitter le plein écran'):'Afficher en plein écran');button.title=active?(enlarged?'Quitter l’affichage agrandi':'Quitter le plein écran'):'Afficher en plein écran';button.classList.toggle('is-fullscreen',active);button.disabled=busy;}
  if(headerButton&&player)headerButton.hidden=player.classList.contains('open');
 }
 function notify(){update();doc.dispatchEvent(new Event('fle-fullscreenchange'));}
 function enterFallback(){
  try{if(window.parent!==window&&window.parent.FLEFullscreen&&window.parent.document.querySelector('#player.open')){window.parent.FLEFullscreen.enterFallback();update();return;}}catch{}
  modeTarget=target();fallback=true;root.classList.add('fle-fullscreen-fallback');notify();
 }
 async function exit(){
  if(fallback){fallback=false;modeTarget=null;root.classList.remove('fle-fullscreen-fallback');notify();return;}
  if(nativeElement()){const fn=doc.exitFullscreen||doc.webkitExitFullscreen;try{if(fn)await fn.call(doc);}finally{modeTarget=null;notify();}return;}
  const context=activeContext();if(context&&context!==window){await context.FLEFullscreen.exit();update();}
 }
 async function toggle(){
  if(busy)return;busy=true;update();
  try{
   if(activeContext()){await exit();return;}
   modeTarget=target();const request=modeTarget.requestFullscreen||modeTarget.webkitRequestFullscreen;
   if(!request){enterFallback();return;}
   try{await request.call(modeTarget);}catch{enterFallback();}
  }finally{busy=false;update();}
 }
 function makeButton(placement){
  const button=doc.createElement('button');button.type='button';button.className='fle-fullscreen-button';button.dataset.fleFullscreen=placement;button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Afficher en plein écran');button.title='Afficher en plein écran';button.innerHTML=expand;
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();toggle();});buttons.push(button);return button;
 }
 function init(){
  const style=doc.createElement('style');style.id='fle-fullscreen-style';style.textContent=`
   .fle-fullscreen-button{box-sizing:border-box!important;display:inline-flex;align-items:center;justify-content:center;flex:0 0 38px;width:38px;height:38px;min-width:38px;padding:8px!important;border:1px solid #d9cee7!important;border-radius:11px!important;background:#fffdf8!important;color:#6c5296!important;box-shadow:0 2px 5px #3220470a!important;cursor:pointer;font:inherit;vertical-align:middle;touch-action:manipulation;z-index:2147483647}
   .fle-fullscreen-button[hidden]{display:none!important}.fle-fullscreen-button svg{display:block;width:21px;height:21px;pointer-events:none}.fle-fullscreen-button:hover{background:#eee6f8!important}.fle-fullscreen-button:focus-visible{outline:3px solid #bd8c38!important;outline-offset:3px!important}.fle-fullscreen-button:disabled{opacity:.65}
   .fle-fullscreen-button[data-fle-fullscreen="floating"],.fle-fullscreen-button.is-fullscreen:not([data-fle-fullscreen="player"]){position:fixed!important;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));margin:0!important}
   .fle-fullscreen-fallback{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;overflow:hidden!important}.fle-fullscreen-fallback body{height:100%!important;overflow:auto!important}
   #player:fullscreen,#player:-webkit-full-screen{width:100vw!important;height:100dvh!important;inset:0!important;background:white}
   @media(min-width:781px){.fle-fullscreen-on .shell{max-width:1600px}.fle-fullscreen-on .game-layout{max-width:1360px}.fle-fullscreen-on .game-layout>.character-card .stage{width:clamp(200px,calc((100dvh - 390px)*.6667),360px)!important;max-height:none!important}}
   @media(max-width:580px){.fle-fullscreen-button{width:34px;height:34px;min-width:34px;flex-basis:34px;padding:6px!important;border-radius:9px!important}.fle-fullscreen-button svg{width:20px;height:20px}.header-actions.fle-fullscreen-host{flex-wrap:wrap;justify-content:flex-end;gap:6px}.fle-fullscreen-header{flex-wrap:wrap}}
  `;doc.head.append(style);
  const slot=doc.querySelector('[data-fullscreen-slot]')||doc.querySelector('.header-actions')||doc.querySelector('header .stats')||doc.querySelector('.topline')||doc.querySelector('header');
  if(slot){slot.classList.add('fle-fullscreen-host');slot.closest('header')?.classList.add('fle-fullscreen-header');}
  headerButton=makeButton(slot?'header':'floating');(slot||doc.body).append(headerButton);
  player=doc.querySelector('#player');const bar=doc.querySelector('.playerbar');
  if(player&&bar){
   playerButton=makeButton('player');bar.append(playerButton);wasOpen=player.classList.contains('open');
   const frame=player.querySelector('iframe');if(frame){frame.setAttribute('allowfullscreen','');const allow=frame.getAttribute('allow')||'';if(!allow.includes('fullscreen'))frame.setAttribute('allow',allow+(allow?'; ':'')+'fullscreen');}
   new MutationObserver(()=>{const open=player.classList.contains('open');if(wasOpen&&!open&&(modeTarget===player||nativeElement()===frame))exit();wasOpen=open;update();}).observe(player,{attributes:true,attributeFilter:['class']});
  }
  for(const event of ['fullscreenchange','webkitfullscreenchange'])doc.addEventListener(event,()=>{if(!nativeElement()&&!fallback)modeTarget=null;notify();});
  doc.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const context=activeContext();if(context&&context.FLEFullscreen.fallback){event.preventDefault();context.FLEFullscreen.exit();}});
  try{if(window.parent!==window){for(const event of ['fullscreenchange','webkitfullscreenchange','fle-fullscreenchange'])window.parent.document.addEventListener(event,update);}}catch{}
  update();
 }
 window.FLEFullscreen={toggle,exit,enterFallback,get active(){return !!nativeElement()||fallback;},get fallback(){return fallback;}};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
