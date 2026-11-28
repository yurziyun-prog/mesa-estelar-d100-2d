const defaultControls={w:'w',a:'a',s:'s',d:'d',shift:'shift',' ':' ',e:'e'};
const controlNames={w:['Cima','上'],a:['Esquerda','左'],s:['Baixo','下'],d:['Direita','右'],shift:['Correr','跑步'],' ':['Pular','跳跃'],e:['Interagir','互动']};
let controlBindings={...defaultControls};
try{Object.assign(controlBindings,JSON.parse(localStorage.getItem('mesa-controls-v1'))||{});}catch{}
const pressedControls=new Map();
function controlKey(event){
 const key=event.key.toLowerCase();
 if(key.startsWith('arrow'))return key;
 return Object.keys(controlBindings).find(action=>controlBindings[action]===key)||null;
}
function saveControlBindings(){
 localStorage.setItem('mesa-controls-v1',JSON.stringify(controlBindings));
}
function drawControlSettings(){
 const zh=siteLanguage==='zh-CN';
 const dialog=document.getElementById('controlsDialog');
 dialog.querySelector('h3').textContent=zh?'控制设置':'Configurações de controle';
 dialog.querySelector('[data-controls-help]').textContent=zh?'方向键也能移动。右键拖动镜头，滚轮缩放。':'As setas também movem. Arraste com o botão direito para mover a câmera e use a roda para ampliar.';
 dialog.querySelector('[data-restore-controls]').textContent=zh?'恢复默认':'Restaurar padrões';
 dialog.querySelector('[data-close-controls]').textContent=zh?'关闭':'Fechar';
 document.getElementById('controlBindings').replaceChildren(...Object.entries(controlNames).map(([action,name])=>{
  const button=document.createElement('button');
  button.type='button';button.className='btn';
  const label=controlBindings[action]===' '?(zh?'空格':'Espaço'):controlBindings[action].toUpperCase();
  button.textContent=name[zh?1:0]+' · '+label;
  button.onclick=()=>{
   button.textContent=zh?'按下新键':'Pressione uma tecla';
   button.focus();
   button.onkeydown=event=>{
    event.preventDefault();event.stopPropagation();
    const key=event.key.toLowerCase();
    if(event.ctrlKey||event.metaKey||event.altKey||!(/^[a-z0-9 ]$/.test(key)||key==='shift'))return;
    const previous=Object.keys(controlBindings).find(other=>controlBindings[other]===key);
    if(previous)controlBindings[previous]=controlBindings[action];
    controlBindings[action]=key;saveControlBindings();drawControlSettings();
   };
  };
  return button;
 }));
}
function openControlSettings(){
 drawControlSettings();document.getElementById('controlsDialog').showModal();
}
function resetControlSettings(){
 controlBindings={...defaultControls};saveControlBindings();drawControlSettings();
}
