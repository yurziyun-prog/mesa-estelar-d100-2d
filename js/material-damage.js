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
   if(kind==='prop'&&plantTrunkRadius(item.type))floor.props.push({type:'log',x:item.x,y:item.y,rot:item.rot||0,scale:item.scale||1});
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

function inspectOrDamage(actor,floor,x,y){
 const target=damageTargetAt(floor,x,y);
 if(!target){worldNotice('Nenhum objeto neste ponto.');return;}
 const health=materialDurability(target.item,target.kind);
 if(worldAction==='inspect'){
   worldNotice(translateSiteText('Dureza')+' '+health.hardness+' · PV '+health.pv+'/'+health.maxPv);
   return;
 }
 if(!carriesPistol(actor)){worldNotice('É preciso ter uma pistola no inventário.');return;}
 const p=target.point,range=Math.hypot(p.x-actor.x,p.y-actor.y);
 if(range>320){worldNotice('Alvo fora de alcance.');return;}
 // Stop short of the hit surface so its own collision does not block the shot.
 if(range>55&&crossesWall(floor,actor.x,actor.y,p.x+(actor.x-p.x)*40/range,p.y+(actor.y-p.y)*40/range)){
   worldNotice('Uma parede bloqueia o alvo.');return;
 }
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
 const paint=[...(floor.brushStrokes||[])].reverse().find(stroke=>
   !stroke.mesaScatter&&stroke.points.some((p,i)=>brushPointInside(stroke,p,x,y,i)));
 const area=[...floor.areas].reverse().find(a=>pointInArchitectArea(a,x,y));
 const bounds=floor.terrainBounds||floor.bounds;
 const surface=paint?.mat||area?.mat||(bounds&&pointInArchitectArea(bounds,x,y)?floor.baseTerrain:null);
 const vegetation=['grass','grassLush','grassDry','mesaAutumn','forest'];
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
