const starterSkills=[
 ['Natação',20],['Percepção',25],['Furtividade',20],['Escalada',20],
 ['Primeiros socorros',20],['Sobrevivência',15],['Persuasão',15],['Ofício',15]
];
const characterItems={
 'Espada Curta':{slot:'hand'},'Lança':{slot:'hand'},'Cajado Arcano':{slot:'hand'},'Pistola':{slot:'hand'},
 'Espada':{slot:'hand'},'Cajado':{slot:'hand'},'Arco':{slot:'hand'},'Escudo':{slot:'hand'},
 'Gorro de viagem':{slot:'head'},'Casaco de viagem':{slot:'body',color:'#577282'},
 'Colete de couro':{slot:'body',color:'#76543e'},'Botas':{slot:'feet'},
 'Lanterna de Óleo':{slot:'light',use:'light'},
 'Ração':{use:'food'},'Poção':{use:'heal'}
};
const characterSlots={head:'Cabeça',body:'Tronco',feet:'Pés',hand:'Mão',light:'Luz'};
const avatarDefaults={body:'balanced',hairStyle:'short',hair:'#62442a',eyes:'#292229',skin:'#e6b48d',clothing:'#688aab'};
let editedCharacterId=null;
let characterEditorMap=null;

function characterAppearance(ent){
 return {...avatarDefaults,clothing:ent.color||avatarDefaults.clothing,...ent.appearance};
}

function drawCharacterAppearance(g,ent,stride=0){
 const a=characterAppearance(ent),half=a.body==='slim'?9:a.body==='broad'?14:11;
 const equipped=ent.equipment||{};
 g.fillStyle=equipped.feet?'#533c2b':'#2b2c38';
 g.fillRect(-10,6+stride,7,12);g.fillRect(3,6-stride,7,12);
 g.fillStyle=characterItems[equipped.body]?.color||a.clothing;
 g.strokeStyle='#263044';g.lineWidth=2;
 g.beginPath();g.roundRect(-half,-8,half*2,21,5);g.fill();g.stroke();
 if(a.hairStyle==='long'){
   g.fillStyle=a.hair;
   g.beginPath();g.roundRect(-10,-21,20,23,6);g.fill();
 }
 g.fillStyle=a.skin;
 g.beginPath();g.arc(0,-12,9,0,Math.PI*2);g.fill();
 if(a.hairStyle!=='shaved'||equipped.head){
   g.fillStyle=equipped.head?'#ad9261':a.hair;
   g.beginPath();g.arc(0,-16,9,Math.PI,Math.PI*2);g.fill();
 }
 g.fillStyle=a.eyes;g.fillRect(-4,-12,2,2);g.fillRect(3,-12,2,2);
 g.strokeStyle=a.skin;g.lineWidth=5;g.lineCap='round';
 g.beginPath();g.moveTo(-half+1,-3);g.lineTo(-half-4,8-stride);
 g.moveTo(half-1,-3);g.lineTo(half+4,8+stride);g.stroke();
 if(equipped.hand||(!ent.equipment&&ent.inventory?.some(item=>/Espada|Lança|Cajado|Arco/i.test(item)))){
   g.strokeStyle='#bfcbd5';g.lineWidth=2.5;
   g.beginPath();g.moveTo(half+4,8+stride);g.lineTo(half+7,-14);g.stroke();
 }
 if(equipped.light){
   g.fillStyle=ent.lanternLit?'#ffdf9b':'#655846';g.fillRect(-half-10,8-stride,6,8);
 }
}

function drawCharacterPortrait(id,ent){
 const picture=document.getElementById(id),g=picture.getContext('2d');
 g.clearRect(0,0,picture.width,picture.height);
 g.save();g.translate(picture.width/2,picture.height/2+4);g.scale(2.2,2.2);
 drawCharacterAppearance(g,ent);g.restore();
}

function labeledChoice(name,value,label,checked=false){
 const row=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');
 input.type='checkbox';input.name=name;input.value=value;input.checked=checked;
 text.textContent=translateSiteText(label);row.append(input,text);return row;
}

function characterInputAppearance(form){
 const output={};
 for(const key of Object.keys(avatarDefaults))output[key]=form.elements[key].value;
 return output;
}

function openCharacterEditor(ent=null){
 if(!['gm','player'].includes(state.mode))return;
 const dialog=document.getElementById('characterEditor'),form=dialog.querySelector('form');
 editedCharacterId=ent?.id||null;
 characterEditorMap={scene:state.activeSceneId,floor:state.currentFloor,mode:state.mode};
 form.reset();
 const data={name:ent?.name||'',sex:ent?.sex||'',species:ent?.species||'',profession:ent?.role||'',
   type:ent?.type||'pc',...characterAppearance(ent||{})};
 for(const [key,value] of Object.entries(data))form.elements[key].value=value;
 document.getElementById('characterEditorTitle').textContent=translateSiteText(ent?'Editar personagem':'Novo personagem');
 document.getElementById('characterTypeRow').hidden=Boolean(ent)||state.mode!=='gm';
 document.getElementById('characterKit').hidden=Boolean(ent);
 const choices=new Map(starterSkills);
 for(const skill of ent?.skillsD100||[])choices.set(skill.name,skill.base);
 document.getElementById('characterSkillOptions').replaceChildren(...[...choices].map(([name])=>
   labeledChoice('skill',name,name,Boolean(ent?.skillsD100?.some(skill=>skill.name===name)))));
 document.getElementById('characterKitOptions').replaceChildren(...Object.keys(characterItems)
   .filter(name=>name!=='Pistola').map(name=>labeledChoice('item',name,name)));
 const preview=()=>drawCharacterPortrait('characterEditorPortrait',{
   appearance:characterInputAppearance(form),equipment:ent?.equipment
 });
 form.oninput=preview;preview();
 document.getElementById('characterEditorStatus').textContent='';
 dialog.showModal();form.elements.name.focus();
}

function characterSpawnPoint(floor){
 const actor=activeActor(),bounds=floor.terrainBounds||floor.bounds;
 const x=actor?.x??(bounds?bounds.x+bounds.w/2:320);
 const y=actor?.y??(bounds?bounds.y+bounds.h/2:240);
 const points=[[x,y]];
 for(const radius of [40,68,96])for(let i=0;i<12;i++){
   const a=i*Math.PI/6;points.push([x+Math.cos(a)*radius,y+Math.sin(a)*radius]);
 }
 return points.find(([px,py])=>canMoveTo(state.currentFloor,px,py)&&!waterDepthAt(floor,px,py)&&
   !state.entities.some(e=>e.sceneId===state.activeSceneId&&e.floor===state.currentFloor&&Math.hypot(e.x-px,e.y-py)<28));
}

function saveCharacterEditor(event){
 event.preventDefault();
 const dialog=document.getElementById('characterEditor'),form=event.currentTarget,data=new FormData(form);
 const name=String(data.get('name')||'').trim();
 const old=editedCharacterId?state.entities.find(e=>e.id===editedCharacterId):null;
 if(!name||!characterEditorMap||characterEditorMap.mode!==state.mode||
    characterEditorMap.scene!==state.activeSceneId||characterEditorMap.floor!==state.currentFloor||
    (editedCharacterId&&!old)||(old&&state.mode==='player'&&old!==activeActor()))return;
 const floor=getScene().floors[state.currentFloor];
 const point=old?null:characterSpawnPoint(floor);
 if(!old&&!point){
   document.getElementById('characterEditorStatus').textContent=translateSiteText('Não há espaço livre próximo para colocar o personagem.');
   return;
 }
 const checked=new Set(data.getAll('skill'));
 const existing=old?.skillsD100||[];
 const skills=existing.filter(skill=>checked.has(skill.name));
 for(const [key,base] of starterSkills){
   if(checked.has(key)&&!skills.some(skill=>skill.name===key))skills.push({name:key,base,training:0,total:base,provisional:true});
 }
 const appearance=characterInputAppearance(form);
 beginEdit();
 const ent=old||instantiateTemplate({name,type:state.mode==='gm'&&data.get('type')==='npc'?'npc':'pc',
   role:'',color:appearance.clothing,icon:'◆',hp:12,inventory:data.getAll('item')},...point);
 Object.assign(ent,{name,sex:String(data.get('sex')).trim(),species:String(data.get('species')).trim()||'Humano',
   role:String(data.get('profession')).trim(),appearance,skillsD100:skills});
 normalizeD100Character(ent);
 if(!old)state.entities.push(ent);
 state.selectedEntityId=ent.id;
 if(state.mode==='player')selectPlayerChar(ent.id);
 else {gmPreviewId=ent.id;refreshGmFocus();updateUI();renderGmPullList();}
 finishEdit();dialog.close();
}

function characterItemAction(ent,name,action){
 if(ent!==getSelectedEntity()||!['gm','player'].includes(state.mode)||!ent.inventory.includes(name))return;
 const item=characterItems[name];
 if(!item)return;
 if(action==='equip'&&item.slot){
   beginEdit();
   (ent.equipment||={})[item.slot]=name;
 }else if(action==='remove'&&item.slot&&ent.equipment?.[item.slot]===name){
   beginEdit();
   delete ent.equipment[item.slot];
   if(item.slot==='light')ent.lanternLit=false;
 }else if(action==='use'&&item.use){
   if(item.use==='light'&&ent.equipment?.light!==name)return;
   if(item.use==='food'&&ent.hunger>=100||item.use==='heal'&&ent.hp>=ent.maxHp)return;
   beginEdit();
   if(item.use==='light')ent.lanternLit=!ent.lanternLit;
   else{
     if(item.use==='food')ent.hunger=Math.min(100,ent.hunger+25);
     if(item.use==='heal')ent.hp=Math.min(ent.maxHp,ent.hp+5);
     ent.inventory.splice(ent.inventory.indexOf(name),1);
   }
 }else return;
 finishEdit();updateUI();
}

function characterActionButton(label,handler){
 const button=document.createElement('button');button.type='button';button.className='btn';
 button.textContent=translateSiteText(label);button.onclick=handler;return button;
}

function addCharacterItem(){
 const ent=getSelectedEntity(),name=document.getElementById('characterItemPicker').value;
 if(!ent||state.mode!=='gm'||!Object.hasOwn(characterItems,name))return;
 beginEdit();ent.inventory.push(name);finishEdit();updateUI();
}

function renderCharacterEquipment(ent){
 drawCharacterPortrait('characterPortrait',ent);
 const slots=document.getElementById('equipmentSlots'),inventory=document.getElementById('inventoryList');
 slots.replaceChildren(...Object.entries(characterSlots).map(([slot,label])=>{
   const row=document.createElement('div'),text=document.createElement('span');row.className='character-equipment-slot';
   const name=ent.equipment?.[slot];
   text.textContent=translateSiteText(label)+' · '+(name?translateSiteText(name):'—');row.append(text);
   if(name)row.append(characterActionButton('Tirar',()=>characterItemAction(ent,name,'remove')));
   return row;
 }));
 const items=new Map();
 for(const name of ent.inventory)items.set(name,(items.get(name)||0)+1);
 inventory.replaceChildren(...[...items].map(([name,count])=>{
   const row=document.createElement('div'),text=document.createElement('span');row.className='list-item character-inventory-row';
   text.textContent=translateSiteText(name)+(count>1?' ×'+count:'');row.append(text);
   const definition=characterItems[name],equipped=definition?.slot&&ent.equipment?.[definition.slot]===name;
   if(definition?.slot&&!equipped)row.append(characterActionButton('Equipar',()=>characterItemAction(ent,name,'equip')));
   if(definition?.use&&(!definition.slot||equipped))row.append(characterActionButton(
     definition.use==='light'?(ent.lanternLit?'Apagar':'Acender'):'Usar',()=>characterItemAction(ent,name,'use')));
   return row;
 }));
 if(!items.size)inventory.textContent=translateSiteText('Mochila vazia');
 const picker=document.getElementById('characterItemPicker');
 picker.parentElement.classList.toggle('hidden',state.mode!=='gm');
 if(!picker.options.length)for(const name of Object.keys(characterItems))picker.add(new Option(translateSiteText(name),name));
}

const localRolls=[];
const localRollBus=typeof BroadcastChannel==='function'?new BroadcastChannel('mesa-estelar-2d-rolls'):null;
let cloudRollStop=null;
let rollListenAccount=null;
let rollCloudGeneration=0;

function rollSessionCode(){
 return (localStorage.getItem('mesa2d-roll-session')||'').trim().toLowerCase();
}

function showRollResults(){
 const root=document.getElementById('rollResults');
 const selected=getSelectedEntity();
 root.replaceChildren(...localRolls.filter(roll=>roll.session===rollSessionCode()&&
   (state.mode==='gm'||roll.actor===selected?.id)).sort((a,b)=>(a.time||0)-(b.time||0)).slice(-8).reverse().map(roll=>{
   const row=document.createElement('div');row.className='list-item';
   row.textContent=roll.name+' · '+translateSiteText(roll.skill)+' · '+roll.roll+'/'+roll.target+
     ' · '+translateSiteText(roll.success?'Sucesso':'Falha');return row;
 }));
}

function receiveSkillRoll(roll){
 if(!roll||typeof roll.id!=='string'||typeof roll.name!=='string'||typeof roll.skill!=='string'||
    !Number.isInteger(roll.roll)||!Number.isFinite(roll.target)||localRolls.some(item=>item.id===roll.id))return;
 localRolls.push(roll);if(localRolls.length>100)localRolls.shift();
 if(typeof state!=='undefined'&&state)showRollResults();
}

if(localRollBus)localRollBus.onmessage=event=>receiveSkillRoll(event.data);

function setRollSession(value){
 localStorage.setItem('mesa2d-roll-session',value.trim().toLowerCase().slice(0,40));
 refreshRollSharing();showRollResults();
}

function skillMapNotice(message){
 const text=translateSiteText(message);
 document.getElementById('skillMapStatus').textContent=text;
 logEvent(text);
}

function rollShareStatus(message){
 document.getElementById('rollShareStatus').textContent=translateSiteText(message);
}

async function refreshRollSharing(){
 const session=rollSessionCode(),mode=state?.mode,cloud=mesaCloud;
 const user=cloud?.auth.currentUser;
 document.getElementById('rollSessionCode').value=session;
 const key=[mode,user?.uid,session].join('|');
 if(key===rollListenAccount)return;
 rollListenAccount=key;const generation=++rollCloudGeneration;
 cloudRollStop?.();cloudRollStop=null;
 if(!session||!user||mode==='architect'){
   rollShareStatus('Testes locais. Informe o mesmo código da sessão e entre na nuvem para compartilhar.');
   return;
 }
 if(mode!=='gm'){rollShareStatus('O mestre conectado com o mesmo código recebe os testes.');return;}
 try{
   const store=cloud.storeSdk;
   if(generation!==rollCloudGeneration)return;
   const feed=store.query(store.collection(cloud.db,'usuarios'),store.where('mesa2dRollFeed.session','==',session));
   cloudRollStop=store.onSnapshot(feed,snapshot=>{
     if(generation!==rollCloudGeneration)return;
     for(const doc of snapshot.docs)for(const roll of doc.data().mesa2dRollFeed?.rolls||[])receiveSkillRoll(roll);
     if(generation===rollCloudGeneration)rollShareStatus('Sessão conectada.');
   },()=>{if(generation===rollCloudGeneration)rollShareStatus('Não foi possível receber os testes. Verifique se a conta tem acesso de mestre.');});
 }catch{
   if(generation===rollCloudGeneration)rollShareStatus('Não foi possível receber os testes da nuvem.');
 }
}

async function publishSkillRoll(ent,skill,roll,target){
 const record={id:crypto.randomUUID(),actor:ent.id,name:ent.name,skill:skill.name,roll,target,
   success:roll<=target,session:rollSessionCode(),time:Date.now()};
 receiveSkillRoll(record);localRollBus?.postMessage(record);
 const cloud=mesaCloud,user=cloud?.auth.currentUser;
 if(!record.session||!user)return;
 try{
   const store=cloud.storeSdk,ref=store.doc(cloud.db,'usuarios',user.uid);
   await store.runTransaction(cloud.db,async transaction=>{
     const snapshot=await transaction.get(ref),prior=snapshot.data()?.mesa2dRollFeed;
     if(!snapshot.exists())throw Error('Missing profile');
     const rolls=prior?.session===record.session&&Array.isArray(prior.rolls)?prior.rolls.slice(-19):[];
     transaction.update(ref,{mesa2dRollFeed:{session:record.session,rolls:[...rolls,record]}});
   });
 }catch{rollShareStatus('O teste ficou local. A nuvem não confirmou o envio.');}
}
