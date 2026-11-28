let gmControlledId=null,gmPreviewId=null;
function getGmControlledEntity(){return gmControlledId?state.entities.find(e=>e.id===gmControlledId&&e.sceneId===state.activeSceneId&&e.floor===state.currentFloor):null;}
function activeActor(){return state.mode==='gm'?getGmControlledEntity():state.mode==='player'?getSelectedEntity():null;}
function gmRemoveEntityFromScene(){
 if(state.mode!=='gm')return false;
 const ent=state.entities.find(e=>e.id===(gmPreviewId||gmControlledId||state.selectedEntityId)
  &&e.sceneId===state.activeSceneId&&e.floor===state.currentFloor);
 if(!ent)return false;
 beginEdit();
 // 保留角色及其人物卡，只从当前场景移走，方便主持人下次重新放置。
 ent.sceneId=null;ent.floor=-999;
 gmControlledId=null;gmPreviewId=null;
 if(state.selectedEntityId===ent.id)state.selectedEntityId=null;
 finishEdit();
 if(typeof renderGmPullList==='function')renderGmPullList();
 refreshGmFocus();updateUI();
 logEvent('📤 '+ent.name+' 已从场景移除（人物卡保留）。Ctrl+Z 可撤销。');
 return true;
}
function gmActors(){return state.entities.filter(e=>e.sceneId===state.activeSceneId&&e.floor===state.currentFloor);}
function gmCycle(){
 const actors=gmActors();if(!actors.length){logEvent('Sem personagens neste andar.');return;}
 const at=actors.findIndex(e=>e.id===gmPreviewId);
 gmPreviewId=actors[(at+1)%actors.length].id;
 refreshGmFocus();
}
function gmConfirm(){
 if(!gmPreviewId)return;gmControlledId=gmPreviewId;
 cameraFollowsActor=true;
 state.selectedEntityId=gmControlledId;refreshGmFocus();updateUI();
 logEvent('👑 Controlando '+(getGmControlledEntity()?.name||'personagem'));
}
function gmRelease(){
 gmControlledId=null;gmPreviewId=null;
 cameraFollowsActor=false;
 refreshGmFocus();updateUI();logEvent('👑 Mestre: câmera livre.');
}
function refreshGmFocus(){
 refreshCreatureCombatControls();
 const controlled=getGmControlledEntity(),preview=state.entities.find(e=>e.id===gmPreviewId);
 const hint=document.getElementById('gmControlHint');
 if(hint)hint.textContent=controlled?'Controlando '+controlled.name+' · Esc libera':preview?'Enter para controlar '+preview.name+' · Tab muda':'Tab escolhe · Enter controla · Esc libera';
 const sheet=document.getElementById('characterSheetPanel');if(sheet)sheet.classList.toggle('hidden',state.mode==='architect'||(state.mode==='gm'&&!controlled));
 const empty=document.getElementById('gmNoCharacter');if(empty)empty.classList.toggle('hidden',state.mode!=='gm');
 const tools=document.getElementById('rightPlayerControls');if(tools)tools.classList.toggle('hidden',state.mode!=='gm'||!controlled);
 const stats=document.getElementById('gmSessionStats');if(stats){const actors=gmActors(),pcs=actors.filter(e=>e.type==='pc');stats.textContent='Personagens: '+pcs.length+' · NPCs/criaturas: '+(actors.length-pcs.length)+' · Total no banco: '+state.entities.length+' · Cenário: '+getScene().name;}
}
function setMode(mode) {
  if(guestPage)mode='player';
  const priorMode=state.mode;
  if(mode!==priorMode){gmCreatureAttack=null;gmCreatureOrder=null;}
  if(priorMode==='gm'&&mode!=='gm'&&gmRestoreArmed)toggleGmRestore();
  if(mode!==priorMode&&typeof clearTransientStairClimbs==='function')clearTransientStairClimbs(state.entities);
  if(state.scenes && state.activeSceneId){
    migrateModeScenes();
    if(priorMode==='architect'||priorMode==='gm')state.modeScenes[priorMode]=state.activeSceneId;
  }
  state.mode=mode;
  setMapPanTool(false);
  document.getElementById('mapPanButton').classList.toggle('hidden',mode==='player');
  document.getElementById('recenterButton').classList.toggle('hidden',mode!=='player');
  if(worldAction)chooseWorldAction(worldAction);
  if(mode==='architect'||mode==='gm'){
    state.activeSceneId=state.modeScenes[mode]||state.activeSceneId;
    state.currentFloor=0;updateFloorLabel();
  }else if(mode==='player'){
    const pc=state.entities.find(e=>e.id===state.selectedEntityId&&e.type==='pc')||state.entities.find(e=>e.type==='pc');
    if(pc&&state.scenes[pc.sceneId]){state.selectedEntityId=pc.id;state.activeSceneId=pc.sceneId;state.currentFloor=pc.floor;updateFloorLabel();}
  }
  gmControlledId=null;gmPreviewId=null;
  if(mode==='player' && getSelectedEntity()?.type!=='pc') {
    const pc=state.entities.find(e=>e.type==='pc');
    if(pc&&state.scenes[pc.sceneId]){state.selectedEntityId=pc.id;state.activeSceneId=pc.sceneId;state.currentFloor=pc.floor;updateFloorLabel();}
  }
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById('architectTools').classList.toggle('hidden', mode !== 'architect');
  document.getElementById('gmTools').classList.toggle('hidden', mode !== 'gm');
  document.getElementById('playerTools').classList.toggle('hidden', mode !== 'player');
  document.getElementById('gmEntityControls').classList.toggle('hidden', mode !== 'gm');
  document.getElementById('characterSheetPanel').classList.toggle('hidden', mode === 'architect' || mode === 'gm');
  document.getElementById('architectLibraryPanel').classList.toggle('hidden', mode !== 'architect');
  if(mode==='architect')renderArchitectLibrary();

  document.getElementById('sceneBankCard').classList.toggle('hidden', mode === 'player');
  document.getElementById('architectSceneControls').classList.toggle('hidden', mode !== 'architect');
  document.getElementById('deleteMapButton').classList.toggle('hidden',mode!=='architect');
  document.getElementById('gmSceneControls').classList.toggle('hidden', mode !== 'gm');

  const hud = document.getElementById('hudStatus');
  if (mode === 'architect') hud.textContent = 'Modo Arquiteto • Paredes retas alinhadas • Porta/Janela abre vão na parede • R: Rotacionar';
  if (mode === 'gm') hud.textContent = 'Modo Mestre • Escolha personagens prontos ou marque existentes e clique em Colocar • Arraste no mapa';
  if (mode === 'player') hud.textContent = 'Modo Jogador • WASD/Setas: Mover • E ou Clique próximo: Portas, baús e escadas';

  refreshSceneSelect();
  refreshGmSpawnList();
  updateUI();
  refreshGmFocus();
  document.getElementById('plantWind').value=String(state.windStrength??.35);
  updateDaylightControls();
  recenterView(false);
  refreshRollSharing();
  showRollResults();
}

function onPaintedGround(floor, x, y) {
  if(caveEntranceGround(floor,x,y))return true;
  const hit = (a) => x >= a.x && x <= a.x+a.w && y >= a.y && y <= a.y+a.h;
  const surface=topMapSurfaceAt(floor,x,y);
  if(surface?.points||isBridgeMaterial(surface?.mat))return !terrainIsBlocked(surface.mat);
  const cave=(floor.caves||[]).findLast(c=>insideCave(c,x,y));
  if(cave)return !terrainIsBlocked(cave.ground);
  const building=(floor.buildings||[]).findLast(b=>b.hasFloor&&buildingDistance(x,y,b)<=0);
  if(building)return !terrainIsBlocked(building.floorMaterial);
  const painted = floor.areas.findLast(a=>!isStackedArea(a)&&hit(a))||surface;
  if(painted?.roof){
    const pitch=roofPitchFor(painted.mat,painted.roofPitch);
    if(pitch==='flat')return true;
    // 斜屋顶不充当水平楼板，仅允许显式铺设的阁楼活动区域。
    const attic=(floor.areas||[]).some(a=>a.attic&&hit(a)&&(a.atticRoofId===painted.roofId||!painted.roofId));
    return attic&&atticHeadroomAt(painted,x,y)>=1.8;
  }
  if (painted) return !terrainIsBlocked(painted.mat);
  const b = floor.terrainBounds || floor.bounds;
  if(floor.stairs?.some(s=>Math.abs(s.x-x)<18&&Math.abs(s.y-y)<25))return true;
  return Boolean(floor.baseTerrain && b && hit(b) && !terrainIsBlocked(floor.baseTerrain));
}
function onPlacedBridge(floor, x, y) {
  return floor.props.some(p => {
    if (p.type !== 'log') return false;
    const horizontal = (p.rot || 0) % 2 === 0;
    return horizontal ? Math.abs(y-p.y) <= 13 && Math.abs(x-p.x) <= 70
      : Math.abs(x-p.x) <= 13 && Math.abs(y-p.y) <= 70;
  });
}
function walkableFloor(floor, x, y) {
  return onPaintedGround(floor, x, y) || onPlacedBridge(floor, x, y);
}
function openedDoorLeaf(d){
  const mechanism=d.mechanism||(d.style==='futurist'?'sliding':'hinged');
  if(mechanism==='sliding'||!d.open)return null;
  const side=d.hingeSide==='right'?1:-1;
  const half=(d.width||68)/2;
  const swing=d.swing==='out'?1:-1;
  if(d.orient==='v'){
    const hy=d.y+side*half;
    return {x1:d.x,y1:hy,x2:d.x-2*half*swing,y2:hy};
  }
  const hx=d.x+side*half;
  return {x1:hx,y1:d.y,x2:hx,y2:d.y+2*half*swing};
}
const CLOSED_DOOR_RADIUS=24;
function doorOccupants(entity){
 return state.entities.filter(other=>other.sceneId===entity.sceneId&&other.floor===entity.floor);
}
function doorClosingBlocked(door,entity){
 return doorOccupants(entity).some(other=>
   Math.hypot(other.x-door.x,other.y-door.y)<CLOSED_DOOR_RADIUS||
   openDoorPassageAt(door,other.x,other.y,0)
 );
}
// Let old saves escape a closed door only by moving away on the same side.
function escapingClosedDoor(door,x,y,walker){
 if(door.open||!walker||Math.hypot(walker.x-door.x,walker.y-door.y)>=CLOSED_DOOR_RADIUS)return false;
 const vertical=door.orient==='v';
 const offset=vertical?walker.x-door.x:walker.y-door.y;
 const next=vertical?x-door.x:y-door.y;
 return Math.abs(next)>Math.abs(offset)&&next*offset>=0;
}
function closedDoorBlocksStep(door,x,y,walker){
 return !door.open&&Math.hypot(x-door.x,y-door.y)<CLOSED_DOOR_RADIUS&&!escapingClosedDoor(door,x,y,walker);
}
function wallBlocksCharacter(wall,x,y){
 return distToSegment(x,y,wall.x1,wall.y1,wall.x2,wall.y2)<10+(wall.width||16)/2;
}
function openDoorPassageAt(door,x,y,clearance=0,depth=26,walker=null){
 if(!door.open&&!escapingClosedDoor(door,x,y,walker))return false;
 const along=door.orient==='v'?y-door.y:x-door.x;
 const across=door.orient==='v'?x-door.x:y-door.y;
 return Math.abs(along)<Math.max(2,(door.width||68)/2-clearance)&&Math.abs(across)<=depth;
}
function wallBlocksAtOpening(floor,wall,x,y,clearance,walker=null){
 if(!wallBlocksCharacter(wall,x,y))return false;
 if(wall.extendedUp)return true;
 const vertical=Math.abs(wall.x2-wall.x1)<Math.abs(wall.y2-wall.y1);
 return !(floor.doors||[]).some(door=>(door.orient==='v')===vertical&&
   Math.abs(vertical?door.x-wall.x1:door.y-wall.y1)<=(wall.width||16)/2+5&&
   openDoorPassageAt(door,x,y,clearance,26,walker));
}
function crossesWall(floor,x1,y1,x2,y2,extensionsOnly=false){
 const walls=extensionsOnly?floor.walls.filter(wall=>wall.extendedUp):floor.walls;
 const steps=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)/4));
 for(let step=1;step<=steps;step++){
   const t=step/steps,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
   if(caveWallBlocks(floor,x,y)||buildingWallBlocks(floor,x,y)||walls.some(wall=>wallBlocksAtOpening(floor,wall,x,y,0)))return true;
 }
 return false;
}
const swimPermission=new WeakMap();
const swimHintAt=new WeakMap();
const SWIM_TARGET_RANGE=66;

function validSwimTarget(ent,floor,x,y){
 return Math.hypot(x-ent.x,y-ent.y)<=SWIM_TARGET_RANGE&&waterDepthAt(floor,x,y)==='deep'&&
   !crossesWall(floor,ent.x,ent.y,x,y);
}

function trySwimmingTest(ent,point=null){
 const floor=getScene().floors[ent.floor];
 if(!floor||ent.sceneId!==state.activeSceneId)return false;
 if(point&&!validSwimTarget(ent,floor,point.x,point.y))return false;
 const points=point?[point]:[{x:ent.x,y:ent.y}];
 if(!point)for(const distance of [12,28,44,64])for(let i=0;i<24;i++){
   const a=i*Math.PI/12;points.push({x:ent.x+Math.cos(a)*distance,y:ent.y+Math.sin(a)*distance});
 }
 const target=points.find(p=>validSwimTarget(ent,floor,p.x,p.y));
 if(!target)return false;
 const skill=ent.skillsD100?.find(isSwimmingSkill);
 const passed=rollD100Skill(ent,skill);
 swimPermission.delete(ent);
 if(passed===true)swimPermission.set(ent,{floor,x:target.x,y:target.y,until:performance.now()+10000});
 if(passed!==null)skillMapNotice(passed?'Travessia a nado bem-sucedida.':'Falha na travessia a nado.');
 return true;
}

// Narrow horizontal footprint leaves room to skirt a token near a doorway.
function tokenBlocksStep(ent,x,y){
 const scale=ent.creature?creatureRenderScale(ent):1;
 for(const other of state.entities){
   if(other===ent||other.hp<=0||other.sceneId!==ent.sceneId||other.floor!==ent.floor)continue;
   const otherScale=other.creature?creatureRenderScale(other):1;
   const size=(scale+otherScale)/2;
   const side=15*size,depth=24*size;
   const next=((x-other.x)/side)**2+((y-other.y)/depth)**2;
   if(next>=1)continue;
   const current=((ent.x-other.x)/side)**2+((ent.y-other.y)/depth)**2;
   // Older maps may start with overlapping tokens. Let them separate.
   if(next<=current+1e-8)return true;
 }
 return false;
}
function canWalkStep(ent,x,y){
 const floor=getScene().floors[ent.floor];
 if(Math.abs(reliefAt(floor,x,y)-reliefAt(floor,ent.x,ent.y))>.25)return false;
 const depth=waterDepthAt(floor,x,y);
 if(tokenBlocksStep(ent,x,y)||!canMoveTo(ent.floor,x,y,false,depth,null,ent))return false;
 if(depth!=='deep'||waterDepthAt(floor,ent.x,ent.y)==='deep')return true;
 const grant=swimPermission.get(ent),now=performance.now();
 if(grant?.floor===floor&&grant.until>now&&Math.hypot(grant.x-x,grant.y-y)<=SWIM_TARGET_RANGE){
   swimPermission.delete(ent);return true;
 }
 if(now>=(swimHintAt.get(ent)||0)){
   swimHintAt.set(ent,now+1800);
   skillMapNotice('Role Natação na perícia ou clique com o botão direito na água profunda próxima.');
 }
 return false;
}
function canMoveTo(floorIdx, nx, ny, jumpLanding = false, waterAccess = null, ignoredProp = null, walker = null) {
  const source = getScene().floors[floorIdx];
  const floor = source && ignoredProp ? {...source,props:source.props.filter(prop=>prop!==ignoredProp)} : source;
  if (!floor) return false;
  const r = 12;
  if(chimneyBlocksMovement(getScene(),floorIdx,nx,ny,r))return false;
  if(caveWallBlocks(floor,nx,ny)||buildingWallBlocks(floor,nx,ny,walker))return false;

  if(floor.walls.some(wall=>wallBlocksAtOpening(floor,wall,nx,ny,10,walker)))return false;

  if (floor.doors.some(d=>closedDoorBlocksStep(d,nx,ny,walker))) return false;
  if (floor.doors.some(d=>{const leaf=openedDoorLeaf(d);return leaf&&distToSegment(nx,ny,leaf.x1,leaf.y1,leaf.x2,leaf.y2)<r+2;}))return false;
  if (floor.windows.some(win => win.orient==='v'?(Math.abs(nx-win.x)<r+9&&Math.abs(ny-win.y)<(win.width||40)/2+r):(Math.abs(ny-win.y)<r+9&&Math.abs(nx-win.x)<(win.width||40)/2+r))) return false;
  if (floor.chests.some(c => Math.hypot(c.x - nx, c.y - ny) < r + 14)) return false;

  if(floor.props.some(p=>REST_SEATS[p.type]&&seatBlocksPoint(p,nx,ny,r)))return false;
  if(floor.props.some(p=>!REST_SEATS[p.type]&&(catalogPropIsSolid(p.type)||mesaFurnitureById.has(p.type)||furnitureFinishById.has(p.type))&&Math.hypot(p.x-nx,p.y-ny)<r+19*(p.scale||1)))return false;
  if(floor.props.some(p=>plantTrunkRadius(p.type)&&Math.hypot(p.x-nx,p.y-ny)<r+plantTrunkRadius(p.type)*(p.scale||1)*treeSizeFactor(p)))return false;
  if(floor.props.some(p=>geologyPropRadius(p.type)&&Math.hypot(p.x-nx,p.y-ny)<r+geologyPropRadius(p.type)*(p.scale||1)))return false;
  if(floor.props.some(p=>!REST_SEATS[p.type]&&fixtureRadius(p.type)&&Math.hypot(p.x-nx,p.y-ny)<r+fixtureRadius(p.type)*(p.scale||1)))return false;
  if(floor.props.some(p=>scenerySolidRadius(p.type)&&Math.hypot(p.x-nx,p.y-ny)<r+scenerySolidRadius(p.type)*(p.scale||1)))return false;
  const solidProps = ['table','chair','bench','desk','lowTable','crate','screen','bookshelf','barrel','cabinet','sofa','sofaBlue','sofaRed','sofaGreen','fountain'];
  if (floor.props.some(p => !REST_SEATS[p.type]&&(solidProps.includes(p.type)||fireplaceDesign(p.type)) && Math.hypot(p.x - nx, p.y - ny) < r + 14*(p.scale||1))) return false;
  if (floor.props.some(p => isKenneyObject(p.type) && KENNEY_OBJECTS[p.type].solid && Math.hypot(p.x-nx,p.y-ny)<r+17*(p.scale||1)))return false;
  if (floor.props.some(p => isKenneyRoguelikeObject(p.type) && KENNEY_ROGUELIKE_OBJECTS[p.type].solid && Math.hypot(p.x-nx,p.y-ny)<r+17*(p.scale||1)))return false;
  // As camas têm colisão retangular proporcional ao seu tamanho.
  if(floor.props.some(p=>isSleepingFurniture(p)&&p.type!=='sleepingBag' && !TENT_TYPES.has(p.type) && Math.abs(nx-p.x)<sleepFurnitureSize(p).w*(p.scale||1)/2+r-4 && Math.abs(ny-p.y)<sleepFurnitureSize(p).h*(p.scale||1)/2+r-4))return false;

  // 平屋顶上的玻璃天窗不是安全行走区域；连接楼梯的出入口仍交给楼梯系统。
  if((floor.roofOpenings||[]).some(o=>o.type==='skylight' &&
    Math.abs(nx-o.x)<o.w/2+r&&Math.abs(ny-o.y)<o.h/2+r &&
    floor.areas.some(a=>a.roof&&roofPitchFor(a.mat,a.roofPitch)==='flat' &&
      nx>=a.x&&nx<=a.x+a.w&&ny>=a.y&&ny<=a.y+a.h)))return false;
  const lift=[...floor.props.filter(p=>p.type==='hoverLift'),...remoteLifts(getScene(),floorIdx).map(x=>x.prop)]
    .some(p=>Math.hypot(p.x-nx,p.y-ny)<26*(p.scale||1));
  if (!(waterAccess||waterDepthAt(floor,nx,ny)==='shallow')&&!walkableFloor(floor,nx,ny)&&!reliefAt(floor,nx,ny)&&
      !onStructureTop(getScene(),floorIdx,nx,ny)&&!lift) return false;

  return true;
}

const TENT_TYPES=new Set(['tent','campTent','roundPavilion']);
const SLEEP_TYPES=new Set(['bed','bedDouble','sleepingBag','capsuleBed',...TENT_TYPES]);
function isSleepingFurniture(item){return Boolean(item&&SLEEP_TYPES.has(item.type));}
function sleepFurnitureSize(item) {
  const sizes={bed:{w:44,h:84},bedDouble:{w:78,h:90},sleepingBag:{w:32,h:76},capsuleBed:{w:66,h:100}};
  const s=sizes[item.type]||sizes.bed;
  return (item.rot||0)%2?{w:s.h,h:s.w}:s;
}
function awakenEntity(ent){
  if(!ent.sleepPose)return;
  const rest=ent.sleepRest;
  if(rest){ent.x=rest.x;ent.y=rest.y;}
  ent.sleepPose=null;ent.sleepRest=null;ent.sleepBed=null;ent.sleepMinutes=0;
  logEvent('☀️ '+ent.name+' levantou.');
}
function startEntitySleep(ent,bed){
  ent.sleepRest={x:ent.x,y:ent.y};
  ent.sleepBed={x:bed.x,y:bed.y,type:bed.type,rot:bed.rot||0,portable:Boolean(bed.portable)};
  ent.x=bed.x;ent.y=bed.y;
  ent.sleepPose='sleeping';ent.sleepMinutes=0;
  logEvent('💤 '+ent.name+' está dormindo.');
}
function interactWithBed(ent,bed){
  if(ent.sleepPose||state.entities.some(other=>other!==ent&&other.sleepPose&&other.sceneId===ent.sceneId&&other.floor===ent.floor&&other.sleepBed?.x===bed.x&&other.sleepBed?.y===bed.y))return;
  if(confirm(clockLabel('Dormir agora?'))){startEntitySleep(ent,bed);saveBank();}
}
function interactNearby(entity,clickedSeat=null,remote=false) {
  const floor = getScene().floors[entity.floor];
  if(entity.hp<=0||entity.sleepPose||liftRides.has(entity))return;
  if(entity.seatPose){standFromSeat(entity);return;}
  if(clickedSeat&&seatBlocksPoint(clickedSeat,entity.x,entity.y,25)){sitOnSeat(entity,clickedSeat);return;}
  const door = floor.doors.map(d=>{
    const leaf=d.open?openedDoorLeaf(d):null;
    const center=Math.hypot(d.x-entity.x,d.y-entity.y);
    return {d,distance:leaf?Math.min(center,distToSegment(entity.x,entity.y,leaf.x1,leaf.y1,leaf.x2,leaf.y2)):center};
  }).filter(hit=>hit.distance<58).sort((a,b)=>a.distance-b.distance)[0]?.d;
  if(toggleNearbyCurtain(floor,entity,door))return;
  if (door) {
    const wasOpen=door.open;
    if(wasOpen&&doorClosingBlocked(door,entity)){
      say(entity,siteLanguage==='zh-CN'?'门口有人，先让开再关门。':'A passagem está ocupada. Afaste-se da porta para fechar.');
      return;
    }
    if (door.lockCode && !door.open) {
      if(remote){say(entity,'Peça ao Mestre para abrir a porta com código.');return;}
      const answer=prompt('Digite o código de acesso:');
      if(answer===null)return;
      if(answer!==door.lockCode){say(entity,'Código incorreto.');return;}
      door.open=true;logEvent('🔓 Código aceito. Porta aberta.');
    } else if (door.keyId && !door.open) {
      if (entity.inventory.includes(door.keyId)) {
        door.open = true;
        logEvent(`🔓 ${entity.name} destrancou a porta com [${door.keyId}].`);
      } else {
        say(entity, `Trancada! Requer: ${door.keyId}`);
      }
    } else {
      door.open = !door.open;
      logEvent(`${entity.name} ${door.open ? 'abriu' : 'fechou'} uma porta.`);
    }
    if(Boolean(wasOpen)!==Boolean(door.open))playGameSound(door.open?'open':'close',.29);
    return;
  }

  if(useExcavation(entity)||pickupWorldTool(entity,floor)||interactCaveDoor(floor,entity)||interactPortableLadder(entity)||interactVending(entity,floor))return;
  const keyIndex=floor.props.findIndex(p=>p.type==='key'&&Math.hypot(p.x-entity.x,p.y-entity.y)<48);
  if(keyIndex!==-1){const key=floor.props.splice(keyIndex,1)[0];entity.inventory.push(key.keyId);updateUI();saveBank();logEvent('🔑 '+entity.name+' recolheu '+(key.label||'uma chave')+'.');return;}

  const stair=floor.stairs.find(s=>Math.hypot(s.x-entity.x,s.y-entity.y)<48);
  // E continua funcionando em escadas antigas; as novas também se atravessam caminhando.
  if(stair && transferOnStair(entity,stair,false))return;

  const chest = floor.chests.find(c => Math.hypot(c.x - entity.x, c.y - entity.y) < 58);
  if (chest) {
    if (chest.opened||!chest.loot?.length) {
      say(entity, 'Baú vazio.');
      return;
    }
    if(chest.lockCode){
      if(remote){say(entity,'Peça ao Mestre para abrir o baú com código.');return;}
      const code=prompt('Digite o código do baú:');
      if(code===null)return;
      if(code!==chest.lockCode){say(entity,'Código incorreto.');return;}
    }
    if (chest.keyId && !entity.inventory.includes(chest.keyId)) {
      say(entity, `Trancado (${chest.keyId}).`);
      return;
    }
    chest.opened = true;
    const loot=chest.loot.splice(0);
    entity.inventory.push(...loot);
    say(entity, `Peguei: ${loot.join(', ')}!`);
    logEvent(`🧰 ${entity.name} pegou: ${loot.join(', ')}.`);
    saveBank();
    updateUI();
    return;
  }
  const nearBed=floor.props.filter(isSleepingFurniture).map(p=>({p,d:Math.hypot(p.x-entity.x,p.y-entity.y)})).sort((a,b)=>a.d-b.d)[0];
  if(nearBed && nearBed.d<(TENT_TYPES.has(nearBed.p.type)?48*(nearBed.p.scale||1):90)){if(remote)startEntitySleep(entity,nearBed.p);else interactWithBed(entity,nearBed.p);return;}
  const seat=floor.props.find(p=>REST_SEATS[p.type]&&seatBlocksPoint(p,entity.x,entity.y,24));
  if(seat){sitOnSeat(entity,seat);return;}
  if(toggleNearbyDecoration(floor,entity))return;
  const fire=floor.props.filter(p=>fireplaceDesign(p.type))
    .map(p=>({p,distance:Math.hypot(p.x-entity.x,p.y-entity.y)}))
    .sort((a,b)=>a.distance-b.distance)[0];
  if(fire&&fire.distance<62){
    fire.p.fireLit=fire.p.fireLit===false||fire.p.decorationOff===true;
    fire.p.decorationOff=!fire.p.fireLit;
  }
}

function say(entity, text) {
  entity.speech = text;
  entity.speechTimer = 260;
}

// CONTROLES
function getSelectedEntity() {
  return state.entities.find(e => e.id === state.selectedEntityId) || state.entities[0];
}

function updateUI() {
  const ent = getSelectedEntity();
  document.getElementById('characterLeftPanel').classList.toggle('hidden',state.mode==='architect');
  document.getElementById('characterSkillsPanel').classList.toggle('hidden',state.mode==='gm'&&!getGmControlledEntity());
  showRollResults();
  if (!ent) return;
  document.getElementById('skillMapStatus').textContent='';

  document.getElementById('charHeader').textContent = [ent.name,...[ent.species,ent.sex,ent.role].filter(Boolean).map(translateSiteText)].filter(Boolean).join(' · ');
  document.getElementById('entityTypeBadge').textContent = ent.type === 'pc' ? 'PJ' : `NPC (${ent.attitude})`;
  document.getElementById('characterDownNotice').hidden=ent.hp>0;
  document.getElementById('restoreControlledCharacter').hidden=ent.hp>=ent.maxHp;
  document.getElementById('hpText').textContent = `${ent.hp} / ${ent.maxHp}`;
  document.getElementById('hpBar').style.width = `${Math.max(0, (ent.hp / ent.maxHp) * 100)}%`;
  document.getElementById('hungerText').textContent = `${ent.hunger}%`;
  showFatigue(ent);
  updateCharacterClock();
  document.getElementById('fatigueLabel').textContent=restLabel('Fadiga');
  document.getElementById('hungerBar').style.width = `${ent.hunger}%`;
  document.getElementById('attitudeSelect').value = ent.attitude;

  const editAttr=document.getElementById('d100AttrEdit');
  if(editAttr)editAttr.classList.toggle('hidden',state.mode!=='gm');
  const attrsRoot=document.getElementById('attrGrid');
  attrsRoot.replaceChildren();
  for(const key of D100_ATTRIBUTES){
    const node=document.createElement('button');node.type='button';node.className='stat-box d100-attr';
    node.title='Rolar d100 para '+key+' (fórmula-base ainda não importada)';
    const name=document.createElement('div');name.className='lbl';name.textContent=key;
    const value=document.createElement('div');value.className='val';value.textContent=ent.attrs[key];
    node.append(name,value);node.onclick=()=>testD100Attribute(key);attrsRoot.append(node);
  }

  displayD100Skills(ent);
  const ai=document.getElementById('skeletonAIControl');
  if(ai){
    ai.classList.toggle('hidden',ent.ai?.kind!=='skeleton'||state.mode!=='gm');
    const label=document.getElementById('skeletonAIStatus');
    if(label)label.textContent=ent.ai?.enabled?'Autonomia ativa · '+(ent.ai.state||'vigiar'):'Autonomia desligada';
  }

  renderCharacterEquipment(ent);

  const pcs = state.entities.filter(e => e.type === 'pc');
  document.getElementById('playerSwitchList').replaceChildren(...pcs.map(p => {
    const button=document.createElement('button');
    button.className='tool-btn';
    button.classList.toggle('active',p.id===ent.id);
    button.style.cssText='width:100%; margin-bottom:4px;';
    button.dataset.userText='';
    button.textContent=`🗡️ ${p.name} (${state.scenes[p.sceneId]?.name || ''})`;
    button.addEventListener('click',()=>selectPlayerChar(p.id));
    return button;
  }));
}

function selectPlayerChar(id) {
  if(guestPage&&id!==guestActorId)return;
  const candidate=state.entities.find(e=>e.id===id);
  if(!candidate || candidate.type!=='pc')return;
  if(candidate.sceneId==null||candidate.floor<0){logEvent('📍 Esse personagem está na reserva. O Mestre deve colocá-lo no mapa primeiro.');return;}
  state.selectedEntityId = id;
  const ent = getSelectedEntity();
  if (ent) {
    state.activeSceneId = ent.sceneId;
    state.currentFloor = ent.floor;
    cameraFollowsActor = true;
    cameraCentersActor = false;
    updateFloorLabel();
    refreshSceneSelect();
  }
  updateUI();
}

function restoreControlledCharacter(){
 const ent=getGmControlledEntity();
 if(state.mode!=='gm'||!ent||ent.hp>=ent.maxHp)return;
 beginEdit();ent.hp=ent.maxHp;finishEdit();updateUI();saveBank();
}
function adjustStat(field, delta) {
  const ent = getSelectedEntity();
  if (!ent) return;
  if (field === 'hp') ent.hp = Math.max(0, Math.min(ent.maxHp, ent.hp + delta));
  if (field === 'hunger') ent.hunger = Math.max(0, Math.min(100, ent.hunger + delta));
  updateUI();
}

function changeAttitude(val) {
  const ent = getSelectedEntity();
  if (ent) { ent.attitude = val; updateUI(); }
}

function changeTimeOfDay(val) {
  if(Object.hasOwn(daylightPresets,val))setMapDaylight(daylightPresets[val]);
}

function speakSelected() {
  const input = document.getElementById('speechInput');
  const text = input.value.trim();
  const ent = getSelectedEntity();
  if (!text || !ent) return;
  say(ent, text);
  logEvent(`💬 ${ent.name}: "${text}"`);
  input.value = '';
}

function rollDice(sides) {
  playGameSound('dice');
  const res = Math.floor(Math.random() * sides) + 1;
  logEvent(`🎲 d${sides}: ${res}`);
}

function testAttribute(attr) { testD100Attribute(attr); }

function logEvent(msg) {
  const box = document.getElementById('eventLog');
  if (!box) return;
  const div = document.createElement('div');
  div.textContent = `• ${msg}`;
  box.prepend(div);
}


// Catálogo permanente de modelos. Não depende das entidades já presentes no mapa.
const GM_TEMPLATES = [
  {id:'warrior',name:'Guerreiro',role:'Combatente',type:'pc',icon:'⚔️',color:'#4f8cff',hp:30,attrs:{FOR:16,DES:12,CON:15,INT:10,SAB:10,CAR:11},skills:['Espadas +5'],inventory:['Espada','Escudo']},
  {id:'mage',name:'Maga',role:'Arcanista',type:'pc',icon:'🪄',color:'#9474f5',hp:18,attrs:{FOR:8,DES:12,CON:10,INT:17,SAB:14,CAR:12},skills:['Arcanismo +6'],powers:['Bola de Fogo'],inventory:['Cajado']},
  {id:'ranger',name:'Arqueira',role:'Exploradora',type:'pc',icon:'🏹',color:'#58bf8c',hp:23,attrs:{FOR:12,DES:17,CON:13,INT:11,SAB:14,CAR:10},skills:['Pontaria +6'],inventory:['Arco','Flechas']},
  {id:'villager',name:'Aldeão',role:'Civil',type:'npc',icon:'🧑',color:'#d6aa64',hp:12,attrs:{FOR:10,DES:10,CON:10,INT:10,SAB:10,CAR:10}},
  {id:'guard',name:'Guarda',role:'Soldado',type:'npc',icon:'🛡️',color:'#648eba',hp:25,attrs:{FOR:14,DES:12,CON:14,INT:10,SAB:11,CAR:10},inventory:['Lança']},
  {id:'merchant',name:'Mercadora',role:'Comerciante',type:'npc',icon:'🧳',color:'#e0ac5c',hp:14,attrs:{FOR:9,DES:11,CON:10,INT:14,SAB:12,CAR:15}},
  {id:'goblin',name:'Goblin',role:'Monstro',type:'npc',icon:'👺',color:'#78ae45',hp:12,attitude:'Hostil',attrs:{FOR:9,DES:14,CON:10,INT:8,SAB:8,CAR:7}},
  {id:'skeleton',name:'Esqueleto',role:'Monstro',type:'npc',icon:'💀',color:'#c4c8c8',hp:15,attitude:'Hostil',attrs:{FOR:11,DES:12,CON:10,INT:6,SAB:8,CAR:5}},
  {id:'wolf',name:'Lobo',role:'Fera',type:'npc',icon:'🐺',color:'#8f998e',hp:18,attitude:'Hostil',attrs:{FOR:12,DES:15,CON:13,INT:4,SAB:13,CAR:6}},
  {id:'dragon',name:'Dragão',role:'Monstro',type:'npc',icon:'🐉',color:'#d96363',hp:95,attitude:'Hostil',attrs:{FOR:20,DES:12,CON:20,INT:14,SAB:14,CAR:16},powers:['Sopro de Fogo']}
];
let gmPlacementTemplate = null;
let gmRosterPlacementIds = null;
function refreshGmSpawnList(){
  const sel = document.getElementById('gmSpawnSelect');
  if (!sel) return;
  const old = sel.value;
  sel.replaceChildren();
  for (const template of GM_TEMPLATES) {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.icon + ' ' + template.name + ' (' + template.role + ')';
    sel.append(option);
  }
  if(GM_TEMPLATES.some(t=>t.id===old)) sel.value=old;
}
function armGmPlacement(){
  const select = document.getElementById('gmSpawnSelect');
  gmPlacementTemplate = GM_TEMPLATES.find(t=>t.id===select?.value) || GM_TEMPLATES[0];
  gmRosterPlacementIds = null;
  logEvent('📍 Clique no mapa para colocar '+gmPlacementTemplate.name+'.');
}
function instantiateTemplate(template, wx, wy) {
  const attrs = {FOR:10,CON:10,TAM:10,DES:10,INT:10,POD:10,CAR:10,...template.attrs};
  delete attrs.SAB;
  return {
    id:'entity_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),
    type:template.type,name:template.name,role:template.role,icon:template.icon,color:template.color,
    sceneId:state.activeSceneId,floor:state.currentFloor,x:wx,y:wy,
    hp:template.hp,maxHp:template.hp,hunger:100,attitude:template.attitude || 'Neutro',
    speech:'',speechTimer:0,attrs,skills:[...(template.skills||[])],
    powers:[...(template.powers||[])],inventory:[...(template.inventory||[])],
    ai:template.id==='skeleton'?{kind:'skeleton',enabled:true,state:'vigiar',detection:180,reach:34}:null
  };
}
function newCreatureInstance(source){
  const creature=structuredClone(source);
  creature.id='creature_'+crypto.randomUUID();
  creature.spawnedFrom=source.spawnedFrom||source.id;
  creature.hp=creature.maxHp;
  creature.speech='';creature.speechTimer=0;
  if(creature.ai){creature.ai.enabled=source.ai.enabled||source.hp<=0;creature.ai.state='vigiar';}
  clearTransientStairClimbs([creature]);
  return creature;
}
function placeGmEntityAt(wx, wy){
  if(state.mode!=='gm')return false;
  if (gmRosterPlacementIds?.length) {
    beginEdit();
    gmRosterPlacementIds.forEach((id,i)=>{
      const source=state.entities.find(e=>e.id===id);
      if(!source)return;
      const ent=combatCreature(source)?newCreatureInstance(source):source;
      if(ent!==source)state.entities.push(ent);
      awakenEntity(ent);
      ent.sceneId=state.activeSceneId;
      ent.floor=state.currentFloor;
      ent.x=wx+(i%3)*36;
      ent.y=wy+Math.floor(i/3)*36;
      state.selectedEntityId=ent.id;
    });
    finishEdit();
    gmRosterPlacementIds=null;
    renderGmPullList();updateUI();saveBank();
    logEvent('📍 Personagens colocados no mapa aberto.');
    return true;
  }
  if (!gmPlacementTemplate) return false;
  beginEdit();
  const entity=normalizeD100Character(instantiateTemplate(gmPlacementTemplate,wx,wy));
  state.entities.push(entity);
  state.selectedEntityId=entity.id;
  finishEdit();
  updateUI();
  renderGmPullList();
  logEvent('📍 '+entity.name+' colocado no mapa.');
  return true;
}
function createGmNpc(){
  const input=document.getElementById('gmNpcName');
  const name=input?.value.trim();
  if(!name) return;
  beginEdit();
  const template={...GM_TEMPLATES.find(t=>t.id==='villager'),name,role:'NPC'};
  const npc=normalizeD100Character(instantiateTemplate(template,340,380));
  state.entities.push(npc);
  state.selectedEntityId=npc.id;
  finishEdit();
  input.value='';
  renderGmPullList();
  updateUI();
  logEvent('🎭 NPC '+name+' criado. Marque-o na lista de cima e use Colocar.');
}

// 从无楼板的楼梯顶端向下跳：只有下层存在真实、无碰撞的落脚处才允许。
function tryJumpDownFromUnfinishedFloor(ent,dx,dy){
 const scene=getScene(),floor=scene.floors[ent.floor];
 if(!floor||ent.stairClimb||performance.now()<(ent.stairCooldown||0))return false;
 const level=floorLevel(scene,ent.floor);
 if(level<=Math.min(...scene.floors.map(f=>f.level)))return false;
 const len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
 const hereHasSlab=hasBuiltFloorAt(floor,ent.x,ent.y);
 const adjacentShaft=(floor.stairs||[]).some(st=>st.dir==='down'&&Math.hypot(st.x-ent.x,st.y-ent.y)<45);
 // A real balcony/ledge or stairwell is required. You cannot jump down
 // through a solid floor merely by pressing Space.
 const locations=[40,56,72,88,104].map(dist=>[ent.x+ux*dist,ent.y+uy*dist]);
 const candidates=locations.filter(([px,py])=>!hasBuiltFloorAt(floor,px,py)||(
   adjacentShaft&&(floor.stairs||[]).some(st=>st.dir==='down'&&Math.hypot(st.x-px,st.y-py)<32)));
 if(!candidates.length){
  if(hereHasSlab)return false; // regular horizontal jump still available
  candidates.push([ent.x,ent.y]);
 }
 // The first existing solid lower floor intercepts the fall, so do not
 // teleport through intermediate slabs. If no safe landing exists, reject.
 const ordered=scene.floors.map((f,i)=>({f,i,level:f.level}))
  .filter(v=>v.level<level).sort((a,b)=>b.level-a.level);
 for(const [px,py] of candidates){
  if(crossesWall(floor,ent.x,ent.y,px,py))continue;
  for(const target of ordered){
   if(!hasBuiltFloorAt(target.f,px,py)&&!(target.f.baseTerrain&&onPaintedGround(target.f,px,py)))continue;
   if(!canMoveTo(target.i,px,py,true)||
      !stairLandingUnoccupied(scene,target.i,px,py,ent.id))break;
   const dropped=level-target.level;
   ent.floor=target.i;ent.x=px;ent.y=py;
   ent.stairTransitionAt=performance.now();
   ent.stairCooldown=performance.now()+1000;
   ent.fallUntil=performance.now()+430;
   state.currentFloor=target.i;updateFloorLabel();
   applyFallDamage(ent,dropped,'跳下');
   logEvent('↘️ '+ent.name+' 从 '+floorName(level)+' 跳到了 '+floorName(target.level)+'。');
   return true;
  }
 }
 logEvent('⚠️ 下方没有可安全着陆的地板；未执行跨层跳跃。');
 return false;
}

// Saltos curtos verificam uma aterrissagem segura; caminhar jamais cruza o vazio.
function attemptJump(ent, dx, dy) {
  const floor=getScene().floors[ent.floor];
  if(!floor || ent.jumpUntil > performance.now()) return false;
  const len=Math.hypot(dx,dy);
  if(len===0) return false;
  const ux=dx/len,uy=dy/len;
  // Buscar a menor aterrissagem válida, permitindo pular pequenos vãos.
  for(let d=42;d<=104;d+=8){
    const x=ent.x+ux*d,y=ent.y+uy*d;
    const startHeight=reliefAt(floor,ent.x,ent.y);
    if(tokenBlocksStep(ent,x,y)||Math.abs(reliefAt(floor,x,y)-startHeight)>JUMP_CLEARANCE||!canMoveTo(ent.floor,x,y,true))continue;
    if(crossesWall(floor,ent.x,ent.y,x,y))continue;
    let blockedTrajectory=false;
    for(let step=1;step<Math.ceil(d/5);step++){
      const t=step/Math.ceil(d/5),px=ent.x+ux*d*t,py=ent.y+uy*d*t;
      const high=reliefAt(floor,px,py)>startHeight+JUMP_CLEARANCE;
      const tall=floor.props.some(p=>{
        const radius=plantTrunkRadius(p.type)||geologyPropRadius(p.type)||fixtureRadius(p.type);
        return radius&&(plantTrunkRadius(p.type)||rockTop(p)>JUMP_CLEARANCE)
          &&Math.hypot(px-p.x,py-p.y)<radius*(p.scale||1)*treeSizeFactor(p)+10;
      });
      if(high||tall){blockedTrajectory=true;break;}
    }
    if(blockedTrajectory)continue;
    // Não saltar através de paredes, portas ou objetos sólidos.
    const blocked=[0.25,0.5,0.75].some(t=>{
      const px=ent.x+ux*d*t,py=ent.y+uy*d*t;
      return floor.walls.some(w=>distToSegment(px,py,w.x1,w.y1,w.x2,w.y2)<17)
        || floor.doors.some(door=>!door.open&&Math.hypot(door.x-px,door.y-py)<24);
    });
    if(blocked) continue;
    ent.jumpFrom={x:ent.x,y:ent.y};
    ent.jumpStart=performance.now();
    ent.jumpUntil=ent.jumpStart+380;
    ent.x=x;ent.y=y;
    return true;
  }
  logEvent('Não há terreno seguro ao alcance do salto.');
  return false;
}
