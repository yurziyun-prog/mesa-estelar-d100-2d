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
const avatarDefaults={body:'balanced',helmet:'none',helmetColor:'#4f6075',hairStyle:'short',hair:'#62442a',eyes:'#292229',skin:'#e6b48d',clothing:'#688aab'};
let editedCharacterId=null;
let characterEditorMap=null;

function characterIdentity(ent){
 const saved=ent.species||'Humano';
 const key=saved.trim().toLowerCase();
 const legacyForm=ent.appearance?.form;
 const species=legacyForm==='dragon'?'Dracônico':legacyForm==='crocodile'?'Crocodiliano':
   key==='humana'?'Humano':key==='grey'?'Grey Alto':saved;
 const sex=ent.sex||(key==='humana'?'Feminino':'');
 return {species,sex};
}

function characterAppearance(ent){
 const {form:legacyForm,...appearance}=ent.appearance||{};
 return {...avatarDefaults,clothing:ent.color||avatarDefaults.clothing,...appearance};
}

function characterVisualForm(species){
 return characterSpecies.find(([name])=>name===species)?.[2]||'human';
}

function characterAnatomy(ent,a){
 const {species,sex}=characterIdentity(ent);
 const form=characterVisualForm(species);
 const height=species==='Grey Alto'?1.23:species==='Grey Pequeno'?.78:
   form==='zutariano'?.86:form==='dragon'?1.13:1;
 const build=a.body==='slim'?-2:a.body==='broad'?2.5:0;
 const shoulders=11+build+(sex==='Feminino'?-1:sex==='Masculino'?1:0);
 const hips=8.6+build+(sex==='Feminino'?1.8:sex==='Masculino'?-0.5:0);
 const waist=7.7+build+(sex==='Feminino'?-.55:0);
 return {form,sex,height,shoulders,hips,waist,arms:form==='insect'?4:2};
}

function avatarShape(g,color,points){
 g.fillStyle=color;g.strokeStyle='#202935';g.lineWidth=1.1;
 g.beginPath();g.moveTo(...points[0]);
 for(const point of points.slice(1))g.lineTo(...point);
 g.closePath();g.fill();g.stroke();
}

function drawAvatarHead(g,a,form,cap,sex){
 if(a.helmet!=='none'){
   avatarShape(g,a.helmetColor,[[-10,-19],[-5,-24],[5,-24],[10,-19],[11,-9],[7,-3],[-7,-3],[-11,-9]]);
   g.fillStyle='#121b27';g.fillRect(-8,-16,16,5);
   g.fillStyle=a.helmet==='visor'?a.eyes:'#8b9eb0';g.fillRect(-6,-15,12,1.5);
   g.fillStyle='rgba(255,255,255,.3)';g.fillRect(-4,-22,8,1);
   if(a.helmet==='closed')g.fillRect(-1,-10,2,5);
   return;
 }
 if(['dragon','crocodile','reptilian','thalassian'].includes(form)){
   const snout=form==='crocodile'?1:form==='reptilian'?-2:-4;
   if(form==='dragon'){
     avatarShape(g,'#dac3a1',[[-8,-17],[-13,-28],[-4,-23],[-3,-17]]);
     avatarShape(g,'#dac3a1',[[8,-17],[13,-28],[4,-23],[3,-17]]);
   }
   if(form==='thalassian'){
     avatarShape(g,a.skin,[[-5,-17],[-15,-19],[-9,-6]]);
     avatarShape(g,a.skin,[[5,-17],[15,-19],[9,-6]]);
   }
   avatarShape(g,a.skin,[[-9,-17],[-5,-21],[5,-21],[9,-17],[7,-10],[7,snout],[-7,snout],[-7,-10]]);
   g.fillStyle='rgba(24,30,32,.57)';
   g.fillRect(-5,snout-2,10,1);g.fillRect(-4,snout-6,1.5,1.5);g.fillRect(2.5,snout-6,1.5,1.5);
 }else if(form==='robot'||form==='insect'){
   avatarShape(g,form==='robot'?'#8397a8':a.skin,[[-9,-20],[9,-20],[11,-13],[8,-5],[-8,-5],[-11,-13]]);
   g.fillStyle='#263447';g.fillRect(-8,-16,16,5);
   if(form==='insect'){
     g.strokeStyle=a.skin;g.lineWidth=1.5;g.beginPath();
     g.moveTo(-7,-19);g.lineTo(-11,-25);g.moveTo(7,-19);g.lineTo(11,-25);g.stroke();
   }
 }else{
   if(form==='nymari'||form==='aeral'){
     avatarShape(g,a.skin,[[-8,-15],[-14,-20],[-10,-10],[-7,-9]]);
     avatarShape(g,a.skin,[[8,-15],[14,-20],[10,-10],[7,-9]]);
   }
   const large=form==='grey'||form==='arisian';
   g.fillStyle=a.skin;g.strokeStyle='#28323b';g.lineWidth=1;
   g.beginPath();g.ellipse(0,-13,large?11:sex==='Feminino'?8.2:9.1,large?11:sex==='Feminino'?9.3:9,0,0,Math.PI*2);g.fill();g.stroke();
   if(!large&&(a.hairStyle!=='shaved'||cap)){
     g.fillStyle=cap?'#ad9261':a.hair;g.beginPath();g.arc(0,-16,9,Math.PI,Math.PI*2);g.fill();
   }
   g.fillStyle='rgba(67,43,38,.5)';g.fillRect(-2,-7,4,1);
   if(form==='grey'){
     g.fillStyle=a.eyes;
     for(const x of [-5,5]){g.beginPath();g.ellipse(x,-14,3,2,.3,0,Math.PI*2);g.fill();}
     return;
   }
 }
 g.fillStyle=a.eyes;g.fillRect(-5,-14,2.8,2);g.fillRect(2.2,-14,2.8,2);
}

function drawCharacterAppearance(g,ent,stride=0){
 const a=characterAppearance(ent);
 const {form,sex,height,shoulders:half,hips,waist,arms}=characterAnatomy(ent,a);
 const equipped=ent.equipment||{};
 const cloth=characterItems[equipped.body]?.color||a.clothing;
 g.save();
 g.translate(0,18*(1-height));g.scale(1,height);
 if(form==='dragon'||form==='crocodile'||form==='reptilian'){
   g.strokeStyle='#23313a';g.lineWidth=6;g.lineCap='round';g.beginPath();
   g.moveTo(7,10);g.quadraticCurveTo(19,23,23,14);g.stroke();
   g.strokeStyle=a.skin;g.lineWidth=3.6;g.stroke();
   if(form==='dragon')for(const side of [-1,1]){
     avatarShape(g,cloth,[[side*4,-4],[side*19,-12],[side*22,0],[side*13,-3],[side*10,8]]);
   }
 }
 const leg='#353e4e',boots=equipped.feet?'#664937':'#242a36';
 g.lineCap='round';
 for(const side of [-1,1]){
   const lift=side*stride;
   g.strokeStyle=leg;g.lineWidth=5.7;g.beginPath();
   g.moveTo(side*hips*.48,8);g.quadraticCurveTo(side*hips*.53,12,side*hips*.60,16+lift);g.stroke();
   g.strokeStyle=boots;g.lineWidth=5.1;g.beginPath();
   g.moveTo(side*hips*.60,15+lift);g.lineTo(side*hips*.65,18+lift);g.stroke();
 }
 if(a.hairStyle==='long'&&a.helmet==='none'&&['human','nymari','aeral','zutariano'].includes(form)){
   g.fillStyle=a.hair;g.beginPath();g.ellipse(0,-12,10,13,0,0,Math.PI*2);g.fill();
 }
 for(let pair=0;pair<arms/2;pair++){
   for(const side of [-1,1]){
     const bend=pair?7:4,root=pair?0:-6;
     const handX=side*(half+bend),handY=(pair?13:7)+side*stride;
     g.strokeStyle=pair?a.skin:cloth;g.lineWidth=pair?3.8:5.1;
     g.beginPath();g.moveTo(side*(half-1),root);
     g.quadraticCurveTo(side*(half+bend+1),root+5,handX,handY);g.stroke();
     g.fillStyle=a.skin;g.beginPath();g.ellipse(handX,handY,2.5,3,0,0,Math.PI*2);g.fill();
   }
 }
 g.fillStyle=cloth;g.strokeStyle='#202935';g.lineWidth=1.3;
 g.beginPath();g.moveTo(-half,-6);
 g.quadraticCurveTo(-half,-11,-4,-10);
 g.quadraticCurveTo(0,-7,4,-10);
 g.quadraticCurveTo(half,-11,half,-6);
 g.bezierCurveTo(half,-2,waist,1,hips,8);
 g.quadraticCurveTo(hips*.7,13,0,12);
 g.quadraticCurveTo(-hips*.7,13,-hips,8);
 g.bezierCurveTo(-waist,1,-half,-2,-half,-6);g.closePath();g.fill();g.stroke();
 g.strokeStyle='rgba(232,217,204,.35)';g.lineWidth=1;
 g.beginPath();g.moveTo(-4,-7);g.quadraticCurveTo(0,-3,4,-7);g.stroke();
 g.strokeStyle='rgba(18,23,32,.60)';g.lineWidth=2.3;
 g.beginPath();g.moveTo(-hips+1,7);g.quadraticCurveTo(0,9,hips-1,7);g.stroke();
 g.fillStyle='#bd9e6e';g.fillRect(-1.8,6.6,3.6,3);
 drawAvatarHead(g,a,form,equipped.head,sex);
 if(equipped.hand||(!ent.equipment&&ent.inventory?.some(item=>/Espada|Lança|Cajado|Arco/i.test(item)))){
   g.strokeStyle='#bfcbd5';g.lineWidth=2.5;
   g.beginPath();g.moveTo(half+4,8+stride);g.lineTo(half+7,-14);g.stroke();
 }
 if(equipped.light){
   g.fillStyle=ent.lanternLit?'#ffdf9b':'#655846';g.fillRect(-half-10,8-stride,6,8);
 }
 g.restore();
}

function drawCharacterPortrait(id,ent){
 const picture=document.getElementById(id),g=picture.getContext('2d');
 g.clearRect(0,0,picture.width,picture.height);
 const light=g.createRadialGradient(picture.width*.47,picture.height*.38,4,
   picture.width*.52,picture.height*.55,picture.width*.62);
 light.addColorStop(0,'#3b5167');light.addColorStop(1,'#121b28');
 g.fillStyle=light;g.fillRect(0,0,picture.width,picture.height);
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

function setCharacterChoices(select,entries,current,placeholder=null){
 select.replaceChildren();
 if(placeholder!==null)select.add(new Option(translateSiteText(placeholder),''));
 for(const [name,zh] of entries)select.add(new Option(siteLanguage==='zh-CN'&&zh?zh:translateSiteText(name),name));
 if(current&&!Array.from(select.options).some(option=>option.value===current)){
   select.add(new Option(current,current));
 }
 select.value=current;
}

function openCharacterEditor(ent=null){
 if(!['gm','player'].includes(state.mode))return;
 const dialog=document.getElementById('characterEditor'),form=dialog.querySelector('form');
 editedCharacterId=ent?.id||null;
 characterEditorMap={scene:state.activeSceneId,floor:state.currentFloor,mode:state.mode};
 form.reset();
 const identity=characterIdentity(ent||{});
 setCharacterChoices(form.elements.sex,[['Feminino'],['Masculino'],['Outro']],identity.sex,'Selecione');
 setCharacterChoices(form.elements.species,characterSpecies,identity.species);
 setCharacterChoices(form.elements.profession,characterProfessions,ent?.role||'','Sem profissão');
 const data={name:ent?.name||'',
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
   appearance:characterInputAppearance(form),species:form.elements.species.value,sex:form.elements.sex.value,equipment:ent?.equipment
 });
 const palette={dragon:'#9c604b',crocodile:'#6c8b57',robot:'#8593a6',grey:'#929ba3',
   thalassian:'#5b8b94',insect:'#937754',arisian:'#ae8293'};
 let previousForm=characterVisualForm(form.elements.species.value);
 form.oninput=event=>{
   if(event.target.name==='species'){
     const next=characterVisualForm(form.elements.species.value);
     if(form.elements.skin.value===(palette[previousForm]||avatarDefaults.skin)){
       form.elements.skin.value=palette[next]||avatarDefaults.skin;
     }
     previousForm=next;
   }
   preview();
 };
 preview();
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
