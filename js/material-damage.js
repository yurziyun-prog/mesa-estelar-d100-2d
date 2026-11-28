// Durability values belong to the map instance and are migrated lazily for old maps.
function materialDurability(item,kind){
 const material=item.material||item.wallMaterial||item.wall||'';
 let [hardness,maxPv]=[2,18];
 if(kind==='wall'||kind==='building'||kind==='cave'){
   [hardness,maxPv]=['wood','wallWood'].includes(material)?[4,24]:[7,36];
   if(/metal|steel/i.test(material))[hardness,maxPv]=[9,45];
 }else if(kind==='door'||kind==='window'){
   [hardness,maxPv]=kind==='window'?[1,8]:[/metal/i.test(material)?7:3,20];
 }else if(kind==='prop'){
   if(plantTrunkRadius(item.type))[hardness,maxPv]=[3,24];
   else if(geologyPropRadius(item.type)&&!item.type.startsWith('potted'))[hardness,maxPv]=[7,28];
   else if(worldFixtures.has(item.type))[hardness,maxPv]=[5,27];
 }
 hardness=item.hardness??hardness;
 maxPv=item.maxPv??maxPv;
 return {hardness,maxPv,pv:item.pv??maxPv};
}

function projectOnSegment(x,y,a,b){
 const dx=b.x-a.x,dy=b.y-a.y;
 const length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/length)):0;
 return {x:a.x+dx*t,y:a.y+dy*t};
}

function roomImpact(room,x,y){
 const horizontal=Math.max(room.x,Math.min(x,room.x+room.w));
 const vertical=Math.max(room.y,Math.min(y,room.y+room.h));
 return [{x:horizontal,y:room.y,orient:'h'},{x:horizontal,y:room.y+room.h,orient:'h'},
   {x:room.x,y:vertical,orient:'v'},{x:room.x+room.w,y:vertical,orient:'v'}]
   .sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
}

function damageTargetAt(floor,x,y){
 const targets=[];
 const add=(item,kind,point,range,priority=0)=>{
   const distance=Math.hypot(x-point.x,y-point.y);
   if(distance<=range)targets.push({item,kind,point,score:distance-priority});
 };
 for(const prop of floor.props)add(prop,'prop',prop,Math.max(18,fixtureRadius(prop.type),scenerySolidRadius(prop.type),geologyPropRadius(prop.type),plantTrunkRadius(prop.type))*(prop.scale||1),3);
 for(const wall of floor.walls)add(wall,'wall',projectOnSegment(x,y,{x:wall.x1,y:wall.y1},{x:wall.x2,y:wall.y2}),(wall.width||16)/2+8);
 for(const door of floor.doors)add(door,'door',door,26,9);
 for(const win of floor.windows)add(win,'window',win,23,8);
 for(const chest of floor.chests)add(chest,'chest',chest,24,4);
 for(const room of floor.buildings||[]){
   const p=roomImpact(room,x,y);
   const gap=(room.wallGaps||[]).some(g=>g.orient===p.orient&&Math.hypot(g.x-p.x,g.y-p.y)<g.width/2);
   if(!gap&&Math.abs(buildingDistance(x,y,room))<room.wallThickness/2+9&&!mergedBoundary(floor,room,p.x,p.y))add(room,'building',p,22);
 }
 for(const cave of floor.caves||[]){
   const segments=caveWallPieces(cave,true);
   for(const [a,b] of segments){
     const p=projectOnSegment(x,y,a,b);
     if(!mergedBoundary(floor,cave,p.x,p.y))add(cave,'cave',{...p,angle:Math.atan2(b.y-a.y,b.x-a.x)},cave.thickness/2+8);
   }
 }
 return targets.sort((a,b)=>a.score-b.score)[0];
}

function breakMapTarget(floor,{item,kind,point}){
 const lists={prop:'props',wall:'walls',door:'doors',window:'windows',chest:'chests'};
 if(lists[kind]){
   floor[lists[kind]]=floor[lists[kind]].filter(entry=>entry!==item);
   if(kind==='prop'&&plantTrunkRadius(item.type)){
     const restorationId=crypto.randomUUID();
     (floor.damagedPlants||=[]).push({restorationId,plant:{...item,pv:materialDurability(item,kind).maxPv}});
     floor.props.push({type:'log',x:item.x,y:item.y,rot:item.rot||0,scale:item.scale||1,restorationId});
   }
   return;
 }
 // Open the damaged section, preserving the rest of the structure.
 if(kind==='building')(item.wallGaps ||= []).push({...point,width:78});
 else{
   item.openings ||= caveOpenings(item);
   item.openings.push({...point,kind:'passage',open:true,width:78});
 }
 delete item.pv;
}

let gmRestoreArmed=false;
function toggleGmRestore(){
 if(state.mode!=='gm')return;
 gmRestoreArmed=!gmRestoreArmed;
 gmCreatureAttack=null;gmCreatureOrder=null;refreshCreatureCombatControls();
 gmRosterPlacementIds=null;gmPlacementTemplate=null;
 const button=document.getElementById('gmRestoreTool');
 button.setAttribute('aria-pressed',String(gmRestoreArmed));
 button.classList.toggle('btn-gold',gmRestoreArmed);
 gmRestoreNotice(gmRestoreArmed?'Clique em uma criatura, personagem ou planta para restaurar.':'');
}
function gmRestoreNotice(message){
 document.getElementById('gmRestoreStatus').textContent=translateSiteText(message);
}
function restoreGmTargetAt(x,y){
 if(state.mode!=='gm')return false;
 const floor=getScene().floors[state.currentFloor];
 const candidates=[];
 function add(target,kind,point,radius){
   const distance=Math.hypot(x-point.x,y-point.y);
   if(distance<=radius)candidates.push({target,kind,score:distance});
 }
 for(const ent of state.entities){
   if(ent.sceneId===state.activeSceneId&&ent.floor===state.currentFloor&&ent.hp<ent.maxHp)
     add(ent,'entity',ent,ent.creature?creatureMapWidth(ent)/2+4:28);
 }
 for(const prop of floor.props){
   if(plantTrunkRadius(prop.type)&&materialDurability(prop,'prop').pv<materialDurability(prop,'prop').maxPv)
     add(prop,'plant',prop,Math.max(20,plantTrunkRadius(prop.type))*(prop.scale||1));
 }
 for(const entry of floor.damagedPlants||[])add(entry,'fallen',entry.plant,Math.max(22,plantTrunkRadius(entry.plant.type))*(entry.plant.scale||1));
 for(const entry of floor.excavations||[])if(entry.trimmed)add(entry,'trimmed',entry,18);
 candidates.sort((a,b)=>a.score-b.score);
 const choice=candidates[0];
 if(!choice){gmRestoreNotice('Nenhum alvo danificado neste ponto.');return false;}
 const {target,kind}=choice;
 beginEdit();
 if(kind==='entity'){
   if(target.hp<=0&&target.ai)target.ai.enabled=true;
   target.hp=target.maxHp;
 }else if(kind==='plant')target.pv=materialDurability(target,'prop').maxPv;
 else if(kind==='trimmed')floor.excavations=floor.excavations.filter(item=>item!==target);
 else{
   floor.props=floor.props.filter(item=>item.restorationId!==target.restorationId);
   floor.props.push(target.plant);
   floor.damagedPlants=floor.damagedPlants.filter(entry=>entry!==target);
 }
 finishEdit();updateUI();saveBank();
 gmRestoreNotice('Alvo restaurado.');
 return true;
}

let worldAction=null;
function chooseWorldAction(action){
 worldAction=worldAction===action?null:action;
 for(const button of document.querySelectorAll('[data-world-action]'))
   button.classList.toggle('active',button.dataset.worldAction===worldAction);
}

function worldNotice(message){
 const translated=translateSiteText(message);
 document.getElementById('worldActionStatus').textContent=translated;
 logEvent(translated);
}

function carriesPistol(actor){
 return (actor.inventory||[]).some(i=>typeof i==='string'&&/(pistola|pistol|手枪)/i.test(i));
}

let mapShot=null;
const mapWeaponSkills={
 pistola_energia:['combate_pistola_laser','pistolas_laser','armas_energia'],
 rifle_energia:['rifles_laser','armas_energia'],
 energia_pesada:['arma_laser_pesada','armas_energia'],
 precisao:['atirador_elite','fuzis_carabinas'],
 pistola:['pistolas_revolveres'],
 rifle:['fuzis_carabinas']
};
function mapWeaponRangeMetres(weapon){
 const data=characterItems[weapon]?.data;
 const bands=String(data?.alcance||'').match(/^\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)*)(?:\s*m)?\s*$/i);
 const last=bands?.[1].split('/').at(-1);
 const metres=Number(last?.trim().replace(',','.')||data?.alcanceMetros);
 return Number.isFinite(metres)&&metres>0?metres:10;
}

function shotWithinMapRange(distance,weapon){
 const metres=mapWeaponRangeMetres(weapon);
 const distanceMetres=distance/MAP_UNITS_PER_METER;
 if(distanceMetres<=metres)return true;
 worldNotice(translateSiteText('Alvo fora de alcance.')+' '+distanceMetres.toFixed(1)+' m / '+metres+' m');
 return false;
}

function mapWeaponHitChance(actor,weapon){
 const data=characterItems[weapon]?.data;
 const ids=mapWeaponSkills[data?.familiaArma]||mapWeaponSkills[data?.plataforma]||mapWeaponSkills.pistola;
 for(const group of [ids.filter(id=>id!=='armas_energia'),ids.filter(id=>id==='armas_energia')]){
   const totals=(actor.skillsD100||[]).filter(skill=>group.includes(skill.id)&&Number.isFinite(skill.total)).map(skill=>skill.total);
   if(totals.length)return Math.max(1,Math.min(99,Math.max(...totals)));
 }
 const formula=ids[0]==='arma_laser_pesada'?'FOR+DES':ids[0]==='combate_pistola_laser'||ids[0]==='pistolas_revolveres'?'DES*2':'DES+INT';
 return Math.max(1,Math.min(99,mesaSkillBase(formula,actor.attrs)||20));
}
let combatTarget=null;
function combatCreature(ent){
 return Boolean(ent.creature||['Monstro','Fera','Animal'].includes(ent.role));
}
function selectedCombatCreature(actor){
 if(!actor||combatTarget?.actor!==actor||actor.sceneId!==state.activeSceneId||actor.floor!==state.currentFloor)return null;
 const target=combatTarget.target;
 return state.entities.includes(target)&&target.sceneId===actor.sceneId&&target.floor===actor.floor?target:null;
}
function targetCreatureAt(actor,x,y){
 let selected=null,distance=Infinity;
 for(const ent of state.entities){
   if(ent===actor||ent.sceneId!==actor.sceneId||ent.floor!==actor.floor||!combatCreature(ent))continue;
   const radius=(ent.creature?creatureMapWidth(ent)/2:27)+3;
   const dx=(x-ent.x)/radius,dy=(y-ent.y)/radius;
   const score=dx*dx+dy*dy;
   if(score<=1&&score<=distance){selected=ent;distance=score;}
 }
 return selected;
}
function equippedMapGun(actor){
 const weapon=actor.equipment?.hand;
 return weapon&&characterHandStyle(weapon)==='gun'?weapon:null;
}
function selectCombatCreature(actor,target){
 combatTarget={actor,target};
 worldNotice(translateSiteText('Alvo selecionado.')+' '+target.name+' · '+target.hp+'/'+target.maxHp+' PV');
}
function useMapFireButton(){
 const actor=activeActor();
 const target=selectedCombatCreature(actor);
 if(!target){chooseWorldAction('shoot');worldNotice('Clique em uma criatura para disparar.');return;}
 if(actor.sleepPose||liftRides.has(actor)){worldNotice('O personagem não pode disparar agora.');return;}
 fireAtCreature(actor,getScene().floors[actor.floor],target,equippedMapGun(actor));
}
function fireAtCreature(actor,floor,target,weapon){
 if(target.hp<=0){worldNotice('Criatura já derrotada.');return true;}
 if(actor.hp<=0){worldNotice('Personagem caído. O Mestre pode restaurar seus PV.');return true;}
 if(!weapon){worldNotice('Equipe uma arma de disparo.');return true;}
 if(!shotWithinMapRange(Math.hypot(target.x-actor.x,target.y-actor.y),weapon))return true;
 if(crossesWall(floor,actor.x,actor.y,target.x,target.y)){worldNotice('Uma parede bloqueia o alvo.');return true;}
 const chance=mapWeaponHitChance(actor,weapon);
 const roll=Math.floor(Math.random()*100)+1;
 if(roll>chance){
   noteCreatureAttacked(target,actor);
   const dx=target.x-actor.x,dy=target.y-actor.y,length=Math.hypot(dx,dy)||1;
   showMapShot(actor,floor,target.x+dy*21/length,target.y-dx*21/length,weapon,false);
   worldNotice(translateSiteText('Disparo errou.')+' D100 '+roll+' / '+chance+'%');
   return true;
 }
 const damage=String(characterItems[weapon]?.data?.dano||'').match(/^(\d+)d(\d+)(?:([+-]\d+))?$/i);
 const dealt=damage?Math.max(1,Math.floor(Number(damage[1])*(Number(damage[2])+1)/2)+Number(damage[3]||0)):6;
 showMapShot(actor,floor,target.x,target.y,weapon);
 markBattleMotion(target,'hit',target.x-actor.x,target.y-actor.y);
 beginEdit();
 target.hp=Math.max(0,target.hp-dealt);
 noteCreatureAttacked(target,actor,dealt);
 if(target.hp===0&&target.ai)target.ai.enabled=false;
 finishEdit();saveBank();updateUI();
 worldNotice(target.name+' · '+(target.hp?target.hp+'/'+target.maxHp+' PV':translateSiteText('Criatura derrotada.'))+' · D100 '+roll+' / '+chance+'%');
 return true;
}
function showMapShot(actor,floor,x,y,weapon,impact=true){
 markBattleMotion(actor,'fire',x-actor.x,y-actor.y);
 const energy=/laser|phaser|blaster|gauss|energia/i.test(weapon||'');
 mapShot={floor,x0:actor.x+9,y0:actor.y-9,x,y:y-7,energy,impact,until:performance.now()+220};
}
function drawMapShot(floor){
 if(mapShot?.floor!==floor)return;
 const {x0,y0,x,y,energy,impact,until}=mapShot;
 const alpha=(until-performance.now())/220;
 if(alpha<=0)return;
 ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';
 ctx.strokeStyle=energy?'#5bf7e2':'#edb965';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=energy?13:3;ctx.lineWidth=energy?4:1.4;
 ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x,y);ctx.stroke();
 if(energy){ctx.strokeStyle='#e4fff9';ctx.lineWidth=1.25;ctx.stroke();}
 ctx.fillStyle=energy?'#a8fff3':'#ffe2a2';
 for(let i=0;impact&&i<6;i++){
   const a=i*Math.PI/3,push=3+(1-alpha)*9;
   ctx.beginPath();ctx.arc(x+Math.cos(a)*push,y+Math.sin(a)*push,1.4,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}

function inspectOrDamage(actor,floor,x,y){
 if(worldAction==='shoot'&&actor.hp<=0){worldNotice('Personagem caído. O Mestre pode restaurar seus PV.');return;}
 const weapon=equippedMapGun(actor);
 if(worldAction==='shoot'){
   const creature=targetCreatureAt(actor,x,y);
   if(creature){
     selectCombatCreature(actor,creature);
     fireAtCreature(actor,floor,creature,weapon);
     return;
   }
 }
 const target=damageTargetAt(floor,x,y);
 if(!target){worldNotice('Nenhum objeto neste ponto.');return;}
 const health=materialDurability(target.item,target.kind);
 if(worldAction==='inspect'){
   worldNotice(translateSiteText('Dureza')+' '+health.hardness+' · PV '+health.pv+'/'+health.maxPv);
   return;
 }
 if(!weapon&&!carriesPistol(actor)){worldNotice('É preciso ter uma pistola no inventário.');return;}
 const p=target.point,range=Math.hypot(p.x-actor.x,p.y-actor.y);
 if(!shotWithinMapRange(range,weapon))return;
 // Stop short of the hit surface so its own collision does not block the shot.
 if(range>55&&crossesWall(floor,actor.x,actor.y,p.x+(actor.x-p.x)*40/range,p.y+(actor.y-p.y)*40/range)){
   worldNotice('Uma parede bloqueia o alvo.');return;
 }
 showMapShot(actor,floor,p.x,p.y,weapon);
 const hit=Math.max(0,12-health.hardness);
 if(!hit){worldNotice('A dureza absorveu o dano.');return;}
 beginEdit();
 target.item.pv=Math.max(0,health.pv-hit);
 const pv=target.item.pv;
 if(!pv)breakMapTarget(floor,target);
 finishEdit();
 worldNotice(pv?translateSiteText('Dureza')+' '+health.hardness+' · PV '+pv+'/'+health.maxPv:'Objeto destruído.');
}

function diggableAt(floor,x,y,trim=false){
 if((floor.buildings||[]).some(b=>b.hasFloor&&buildingDistance(x,y,b)<0))return false;
 if((floor.caves||[]).some(c=>insideCave(c,x,y)))return false;
 if((floor.reliefs||[]).some(a=>pointInArchitectArea(a,x,y)))return false;
 const top=topMapSurfaceAt(floor,x,y);
 const roof=floor.areas.findLast(a=>!isStackedArea(a)&&pointInArchitectArea(a,x,y));
 const bounds=floor.terrainBounds||floor.bounds;
 const surface=roof?.mat||top?.mat||(bounds&&pointInArchitectArea(bounds,x,y)?floor.baseTerrain:null);
 const vegetation=['grass','grassLush','grassDry','mesaAutumn','mesaGrass','forest'];
 return (trim?vegetation:[...vegetation,'dirt','sand','mud','sandDesert','snow']).includes(surface);
}

function digGround(actor,floor,x,y){
 if(Math.hypot(x-actor.x,y-actor.y)>62){worldNotice('Aproxime-se para cavar.');return;}
 if(!diggableAt(floor,x,y,worldAction==='trim')||damageTargetAt(floor,x,y)){
   worldNotice('Este ponto não pode ser escavado.');return;
 }
 const scene=getScene(),below=floorIndexForLevel(scene,floorLevel(scene,actor.floor)-1);
 const tunnel=worldAction==='dig'&&below>=0&&(scene.floors[below].caves||[]).some(c=>insideCave(c,x,y))&&
   canMoveTo(below,x,y,true);
 beginEdit();
 (floor.excavations ||= []);
 const existing=floor.excavations.find(p=>Math.hypot(p.x-x,p.y-y)<14);
 if(existing&&worldAction==='dig')Object.assign(existing,{x,y,target:tunnel?below:null,trimmed:false});
 if(!existing)floor.excavations.push({x,y,target:tunnel?below:null,trimmed:worldAction==='trim'});
 finishEdit();
 worldNotice(tunnel?'Abertura para a caverna. Use E para descer.':worldAction==='trim'?'Vegetação removida.':'Solo escavado.');
}

function useExcavation(actor){
 const scene=getScene(),floor=scene.floors[actor.floor],index=actor.floor;
 const near=entry=>Math.hypot(entry.x-actor.x,entry.y-actor.y)<35;
 const down=(floor.excavations||[]).find(p=>Number.isInteger(p.target)&&near(p));
 const up=down?null:scene.floors.flatMap((f,i)=>(f.excavations||[])
   .filter(p=>p.target===index&&near(p)).map(p=>({p,index:i}))).sort((a,b)=>
    Math.hypot(a.p.x-actor.x,a.p.y-actor.y)-Math.hypot(b.p.x-actor.x,b.p.y-actor.y))[0];
 if(!down&&!up)return false;
 const p=down||up.p,dest=down?down.target:up.index;
 if(!canMoveTo(dest,p.x,p.y,true)||!stairLandingUnoccupied(scene,dest,p.x,p.y,actor.id)){
   worldNotice('A passagem está bloqueada.');return true;
 }
 actor.x=p.x;actor.y=p.y;actor.floor=dest;
 state.currentFloor=dest;actor.stairTransitionAt=performance.now();updateFloorLabel();
 return true;
}

function drawExcavations(floor){
 const scene=getScene(),index=scene.floors.indexOf(floor);
 const holes=[...(floor.excavations||[]),...scene.floors.flatMap(f=>(f.excavations||[]).filter(p=>p.target===index))];
 for(const p of holes){
   ctx.save();
   ctx.beginPath();ctx.ellipse(p.x,p.y,17,12,.3,0,2*Math.PI);
   ctx.fillStyle=Number.isInteger(p.target)?'#17191d':p.trimmed?'#655e43':'#76614b';ctx.fill();
   if(!p.trimmed){ctx.strokeStyle='#9f8564';ctx.lineWidth=3;ctx.stroke();}
   ctx.restore();
 }
}

function pickupWorldTool(actor,floor){
 const item=floor.props.find(p=>p.type==='handgunPickup'&&Math.hypot(p.x-actor.x,p.y-actor.y)<35);
 if(!item)return false;
 beginEdit();
 floor.props=floor.props.filter(p=>p!==item);
 actor.inventory.push('Pistola');finishEdit();updateUI();
 worldNotice('Pistola recolhida.');
 return true;
}
