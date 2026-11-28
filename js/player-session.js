// The GM browser owns the campaign and runs every action.
const guestPage=new URLSearchParams(location.search).has('jogador');
const playerClientId=crypto.randomUUID();
const playerControls=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'];
const playerGrants=new Map(),playerPeers=new Map();
let hostingPlayers=false,guestToken=null,guestActorId=null,guestLastUpdate=0,guestRequest=null;
let playerSaveTime=0,playerDirty=false,playerHostView=null;
function sessionLabel(pt,zh){return siteLanguage==='zh-CN'?zh:pt;}
function sessionStatus(message){
 for(const id of ['playerSessionStatus','playerSessionLoginStatus'])document.getElementById(id).textContent=message;
}
async function passwordDigest(password){
 const raw=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password));
 return Array.from(new Uint8Array(raw),x=>x.toString(16).padStart(2,'0')).join('');
}
function playerLink(){
 const url=new URL(location.href);
 url.search='';url.hash='';url.searchParams.set('jogador','1');return url;
}
function openPlayerSessionHost(){
 if(state.mode!=='gm')return;
 if(!hostingPlayers){
  try{startNetworkHost();hostingPlayers=true;}catch(error){alert(error.message);return;}
 }
 const dialog=document.getElementById('playerSessionHost');
 const select=dialog.querySelector('select');
 select.replaceChildren(...state.entities.filter(ent=>ent.type==='pc'&&state.scenes[ent.sceneId]?.floors[ent.floor]).map(ent=>new Option(ent.name,ent.id)));
 dialog.querySelector('a').href=playerLink().href;
 dialog.querySelector('output').textContent='';
 dialog.showModal();
}
async function generatePlayerPassword(){
 if(state.mode!=='gm'||!hostingPlayers)return;
 const dialog=document.getElementById('playerSessionHost');
 const actor=state.entities.find(ent=>ent.id===dialog.querySelector('select').value&&ent.type==='pc');
 if(!actor)return;
 if(!hostPeerId){dialog.querySelector('output').textContent=sessionLabel('Conectando. Aguarde e tente novamente.','正在连接，请稍后重试。');return;}
 const password=Array.from(crypto.getRandomValues(new Uint8Array(12)),x=>x.toString(16).padStart(2,'0')).join('');
 for(const [key,id] of playerGrants)if(id===actor.id)playerGrants.delete(key);
 for(const [key,peer] of playerPeers)if(peer.actorId===actor.id){
  playerBus.postMessage({type:'revoked',to:key});playerPeers.delete(key);
 }
 playerGrants.set(await passwordDigest(password),actor.id);
 dialog.querySelector('output').textContent=hostPeerId+'.'+password;
}
async function guestLogin(form){
 if(!guestPage||!playerBus||guestToken)return;
 const [host,password]=form.elements.password.value.trim().split('.');
 form.elements.password.value='';
 if(!/^[a-zA-Z0-9_-]{8,100}$/.test(host)||!/^[a-f0-9]{24}$/.test(password||'')){
  sessionStatus(sessionLabel('Gere uma nova senha no Mestre.','请在主持人页面生成新版密码。'));return;
 }
 guestRequest=crypto.randomUUID();
 const request=guestRequest;
 try{joinNetworkHost(host,await passwordDigest(password),request);}catch(error){sessionStatus(error.message);return;}
 sessionStatus(sessionLabel('Aguardando o Mestre…','正在连接主持人…'));
 setTimeout(()=>{
  if(!guestToken&&guestRequest===request)sessionStatus(sessionLabel('Sem resposta. Confira a senha e mantenha a aba do Mestre aberta.','未收到回应。请确认密码，并保持主持人页面打开。'));
 },12000);
}
function guestCommand(action,data={}){
 if(!guestPage)return false;
 if(guestToken)playerBus.postMessage({type:'command',from:playerClientId,token:guestToken,action,data});
 return true;
}
function playerSnapshot(actor){
 const scene=structuredClone(state.scenes[actor.sceneId]);
 for(const floor of scene.floors){
  for(const lock of [...floor.doors,...floor.chests]){
   if(lock.lockCode)lock.lockCode='●';
   if(lock.keyId)lock.keyId='●';
  }
  for(const chest of floor.chests)chest.loot=[];
 }
 const publicFields=['id','name','type','role','species','sex','sceneId','floor','x','y','hp','maxHp','attitude','color','appearance','creature','equipment','equipmentLights','seatPose','sleepPose','sleepBed','speech','icon','facingX','facingY','stairClimb','stairClimbProgress'];
 const entities=state.entities.filter(ent=>ent.sceneId===actor.sceneId).map(ent=>ent===actor?ent:
  Object.fromEntries(publicFields.filter(field=>field in ent).map(field=>[field,ent[field]])));
 return {scene,activeSceneId:actor.sceneId,currentFloor:actor.floor,entities,selectedEntityId:actor.id,
  worldDay:state.worldDay,worldCalendarEpoch:state.worldCalendarEpoch,daylightMinute:state.daylightMinute,timeOfDay:state.timeOfDay};
}
function installPlayerSnapshot(message){
 const payload=message.snapshot;
 if(!payload||payload.selectedEntityId!==guestActorId||!payload.scene&&!guestLastUpdate)return;
 const prior=guestLastUpdate&&getSelectedEntity();
 const actor=payload.entities.find(ent=>ent.id===guestActorId);
 if(!actor)return;
 const sheetChanged=!prior||JSON.stringify([prior.hp,prior.hunger,prior.credits,prior.inventory,prior.equipment,prior.communications])!==
  JSON.stringify([actor.hp,actor.hunger,actor.credits,actor.inventory,actor.equipment,actor.communications]);
 const changedPlace=!prior||prior.sceneId!==actor.sceneId||prior.floor!==actor.floor;
 if(payload.scene)state.scenes={[payload.activeSceneId]:payload.scene};
 for(const field of ['activeSceneId','currentFloor','entities','selectedEntityId','worldDay','worldCalendarEpoch','daylightMinute','timeOfDay'])state[field]=payload[field];
 if(combatTarget){
  const target=payload.entities.find(ent=>ent.id===combatTarget.target?.id);
  combatTarget=target?{actor,target}:null;
 }
 if(!guestLastUpdate){
  setMode('player');recenterView(true);
  document.getElementById('playerSessionLogin').close();
 }else{
  if(changedPlace){updateFloorLabel();recenterView(true);}
  if(!changedPlace&&(actor.x!==prior.x||actor.y!==prior.y))markEntityWalking(actor,160);
  if(sheetChanged)updateUI();else{showFatigue(actor);updateCharacterClock();}
  if(document.getElementById('characterMarket').open){
   marketActor=actor;
   if(sheetChanged)renderCharacterMarket();
  }
 }
 guestLastUpdate=Date.now();
 sessionStatus('');
}
function inActorSession(actor,action){
 const previous={mode:state.mode,selectedEntityId:state.selectedEntityId,activeSceneId:state.activeSceneId,currentFloor:state.currentFloor};
 const follow=cameraFollowsActor,center=cameraCentersActor;
 playerHostView=previous;
 try{
  Object.assign(state,{mode:'player',selectedEntityId:actor.id,activeSceneId:actor.sceneId,currentFloor:actor.floor});
  return action();
 }finally{
  Object.assign(state,previous);
  playerHostView=null;
  cameraFollowsActor=follow;cameraCentersActor=center;
 }
}
function performPlayerCommand(peer,action,data){
 const actor=state.entities.find(ent=>ent.id===peer.actorId&&ent.type==='pc'&&state.scenes[ent.sceneId]?.floors[ent.floor]);
 if(!actor)return false;
 if(action==='input'){
  peer.keys=Object.fromEntries(playerControls.map(key=>[key, data.keys?.[key]===true]));
  const now=performance.now();
  const elapsed=Math.min(.25,Math.max(0,(now-(peer.inputAt||now))/1000));
  peer.inputAt=now;
  if(elapsed&&(actor.stairClimb||Object.entries(peer.keys).some(([key,value])=>key!=='shift'&&value))){
   inActorSession(actor,()=>stepControlledActor(actor,elapsed,peer.keys));
   playerDirty=true;
  }
  publishPlayerState(performance.now());
  return true;
 }
 if(!['buy','interact','equip','shoot','push','inspect','trim','dig','jump'].includes(action)||actor.hp<=0&&action!=='buy')return false;
 const previousNotice=document.getElementById('worldActionStatus').textContent;
 let result;
 inActorSession(actor,()=>{
  const floor=getScene().floors[actor.floor];
  if(action==='buy'&&typeof data.id==='string')result=buyCharacterMarketItem(data.id,actor);
  if(action==='interact'&&!actor.seatPose)interactNearby(actor,null,true);
  if(action==='interact'&&actor.seatPose)standFromSeat(actor);
  if(action==='equip'&&typeof data.name==='string'&&['equip','remove','use'].includes(data.operation)){
   const from=data.fromSlot&&actor.equipment?.[data.fromSlot]===data.name?data.fromSlot:null;
   characterItemAction(actor,data.name,data.operation,data.slot,from);
  }
  if(!actor.sleepPose&&!actor.seatPose&&!liftRides.has(actor)){
   if(action==='jump'){
    const dx=Number(Boolean(peer.keys.d||peer.keys.arrowright))-Number(Boolean(peer.keys.a||peer.keys.arrowleft));
    const dy=Number(Boolean(peer.keys.s||peer.keys.arrowdown))-Number(Boolean(peer.keys.w||peer.keys.arrowup));
    if(!attemptJump(actor,dx||(!dy?actor.facingX||0:0),dy||(!dx?actor.facingY||1:0)))tryJumpDownFromUnfinishedFloor(actor,dx,dy);
   }
   if(Number.isFinite(data.x)&&Number.isFinite(data.y)){
    if(action==='push')pushMapTarget(actor,floor,data.x,data.y);
    if(action==='inspect')inspectOrDamage(actor,floor,data.x,data.y,'inspect');
    if(action==='trim'||action==='dig')digGround(actor,floor,data.x,data.y,action);
   }
  }
  if(action==='shoot'&&!actor.sleepPose&&!actor.seatPose&&!liftRides.has(actor)){
   const target=state.entities.find(ent=>ent.id===data.target&&ent!==actor&&ent.sceneId===actor.sceneId&&ent.floor===actor.floor&&ent.type!=='pc');
   if(target)fireAtCreature(actor,floor,target,equippedMapGun(actor));
  }
 });
 const notice=document.getElementById('worldActionStatus');
 const text=action==='buy'?(result?sessionLabel('Compra salva.','购买已保存。'):sessionLabel('Compra não concluída.','购买未完成。')):notice.textContent!==previousNotice?notice.textContent:'';
 notice.textContent=previousNotice;
 if(text)playerBus.postMessage({type:'notice',to:peer.client,text});
 playerDirty=true;
 sendPlayerSnapshot(peer,actor);
 updateUI();
 return true;
}
async function receivePlayerSession(event){
 const m=event.data;if(!m||typeof m!=='object')return;
 if(guestPage){
  if(m.to!==playerClientId)return;
  if(m.type==='accepted'&&m.request===guestRequest&&!guestToken){
   guestToken=m.token;guestActorId=m.actorId;installPlayerSnapshot(m);
  }else if(m.type==='state'&&guestToken&&m.token===guestToken)installPlayerSnapshot(m);
  else if(m.type==='notice'&&guestToken){
   document.getElementById('worldActionStatus').textContent=m.text;
   if(document.getElementById('characterMarket').open)document.getElementById('marketStatus').textContent=m.text;
  }
  else if(m.type==='denied'){sessionStatus(sessionLabel('Senha inválida.','角色密码无效。'));guestRequest=null;}
  else if(m.type==='revoked'){
   guestToken=null;guestActorId=null;guestLastUpdate=0;
   sessionStatus(sessionLabel('Senha revogada pelo Mestre.','主持人已撤销此密码。'));
   document.getElementById('playerSessionLogin').showModal();
  }
  return;
 }
 if(!hostingPlayers)return;
 if(m.type==='join'&&typeof m.proof==='string'&&/^[a-f0-9]{64}$/.test(m.proof)&&typeof m.from==='string'){
  const id=playerGrants.get(m.proof);
  const actor=state.entities.find(ent=>ent.id===id&&ent.type==='pc'&&state.scenes[ent.sceneId]?.floors[ent.floor]);
  if(!actor){playerBus.postMessage({type:'denied',to:m.from});return;}
  for(const [key,peer] of playerPeers)if(key!==m.from&&peer.actorId===id){
   playerBus.postMessage({type:'revoked',to:key});playerPeers.delete(key);
  }
  const token=crypto.randomUUID();
  playerPeers.set(m.from,{actorId:id,token,client:m.from,keys:{},inputAt:0,lastAction:0});
  sendPlayerSnapshot(playerPeers.get(m.from),actor,m.request);
 }else if(m.type==='command'){
  const peer=playerPeers.get(m.from);
  if(!peer||peer.token!==m.token||!m.data||typeof m.data!=='object')return;
  const now=performance.now();
  if(m.action!=='input'&&now-peer.lastAction<100)return;
  if(m.action!=='input')peer.lastAction=now;
  performPlayerCommand(peer,m.action,m.data);
 }
}
function sendPlayerSnapshot(peer,actor,request){
 const snapshot=playerSnapshot(actor),scene=JSON.stringify(snapshot.scene);
 if(!request&&scene===peer.lastScene)delete snapshot.scene;
 peer.lastScene=scene;
 playerBus.postMessage({type:request?'accepted':'state',to:peer.client,token:peer.token,request,actorId:actor.id,snapshot});
}
function tickPlayerSession(){
 if(guestPage){
  if(guestToken)guestCommand('input',{keys:Object.fromEntries(playerControls.map(key=>[key,Boolean(keys[key]&&!document.querySelector('dialog[open]'))]))});
  if(guestLastUpdate&&Date.now()-guestLastUpdate>10000)sessionStatus(sessionLabel('Aba do Mestre desconectada.','主持人页面已断开。'));
  return;
 }
 if(hostingPlayers)publishPlayerState(performance.now());
}
function publishPlayerState(now){
 for(const [client,peer] of playerPeers){
  const actor=state.entities.find(ent=>ent.id===peer.actorId&&ent.type==='pc'&&state.scenes[ent.sceneId]?.floors[ent.floor]);
  if(!actor){playerBus.postMessage({type:'revoked',to:client});playerPeers.delete(client);continue;}
  if(now-(peer.lastSnapshot||0)>=90){
   peer.lastSnapshot=now;
   sendPlayerSnapshot(peer,actor);
  }
 }
 if(playerDirty&&now-playerSaveTime>750){
  playerSaveTime=now;
  playerDirty=!saveBank(true);
 }
}
function initPlayerSession(){
 if(guestPage){
  document.body.classList.add('guest-player');
  const login=document.getElementById('playerSessionLogin');
  login.addEventListener('cancel',event=>event.preventDefault());
  login.showModal();
 }
 setInterval(tickPlayerSession,50);
 window.addEventListener('pagehide',()=>{
  if(guestPage&&guestToken)guestCommand('input',{keys:{}});
  if(!guestPage&&playerDirty)saveBank(true);
 });
}
