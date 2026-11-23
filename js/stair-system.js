// Sistema de escadas arquitetônicas do Mesa Estelar 2D.
// Níveis absolutos: -1 = 1º subterrâneo, 0 = térreo, 1 = 2º andar.
// Índices em scene.floors permanecem estáveis para não danificar personagens salvos.
const STAIR_SHAPES=['straight','spiral','open','continuous'];
let stairTransferSequence=0;
function ensureFloorLevels(scene){
 if(!scene?.floors)return;
 scene.floors.forEach((floor,index)=>{
  if(!Number.isInteger(floor.level))floor.level=index;
  if(!Array.isArray(floor.openings))floor.openings=[];
  if(!Array.isArray(floor.stairs))floor.stairs=[];
 });
}
function floorIndexForLevel(scene,level,create=false,at=null){
 ensureFloorLevels(scene);
 let index=scene.floors.findIndex(f=>f.level===level);
 if(index!==-1||!create)return index;
 const floor=createEmptyFloor(null);
 floor.level=level;
 const x=at?.x??400,y=at?.y??320;
 // 创建空楼层，不擅自替建筑师铺设地板。
 floor.bounds={x:x-150,y:y-154,w:300,h:308};
 floor.terrainBounds={...floor.bounds};
 scene.floors.push(floor);
 return scene.floors.length-1;
}
function floorLevel(scene,index){ensureFloorLevels(scene);return scene.floors[index]?.level??0;}
function floorName(level){return level===0?'Térreo':level<0?Math.abs(level)+'º Subterrâneo':(level+1)+'º Andar';}
function stairVisualShape(value){return value==='ladder'?'open':value||'straight';}
function stairLinkedIndex(scene,sourceIndex,stair){
 if(Number.isInteger(stair.targetFloor)&&scene.floors[stair.targetFloor])return stair.targetFloor;
 if(Number.isInteger(stair.targetLevel))return floorIndexForLevel(scene,stair.targetLevel,false);
 return floorIndexForLevel(scene,floorLevel(scene,sourceIndex)+(stair.dir==='down'?-1:1),false);
}
// 旧版本曾自动复制楼板。保留用户保存的现有数据，不再进行此类迁移。
function repairExistingStairLandings(scene){ensureFloorLevels(scene);}
function hasBuiltFloorAt(floor,x,y){
 if(!floor)return false;
 const hit=a=>x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h;
 const top=[...(floor.areas||[])].reverse().find(hit);
 if(!top)return false;
 if(top.roof){
   if(roofPitchFor(top.mat,top.roofPitch)==='flat')return true;
   return (floor.areas||[]).some(a=>a.attic&&hit(a)&&
     (a.atticRoofId===top.roofId||!top.roofId));
 }
 return !['water','kenney_water','void','carpet'].includes(top.mat);
}
function warnMissingStairFloor(scene,index,x,y){
 if(!hasBuiltFloorAt(scene.floors[index],x,y)){
  const msg='⚠️ '+floorName(floorLevel(scene,index))+' 还没有楼板。楼梯仍可安装，人物只能留在梯顶平台；以后可以自行铺设楼板。';
  logEvent(msg);
  if(typeof alert==='function')alert(msg);
 }
}
// 人物卡仍留在银行中；只有同场景、同楼层、真正站在地图上的角色占据出口。
function stairLandingUnoccupied(scene,floorIndex,x,y,ignoreId=null){
 return !state.entities?.some(e=>e.id!==ignoreId&&e.sceneId===state.activeSceneId&&e.floor===floorIndex
  &&Math.hypot(e.x-x,e.y-y)<26);
}
function stairBusyForEntity(ent,stair){
 const sceneId=state.activeSceneId,sourceFloor=ent.floor;
 return state.entities?.some(e=>e.id!==ent.id&&e.sceneId===sceneId&&e.stairClimb
  &&e.stairClimb.floor===sourceFloor&&(
   (stair.linkId&&e.stairClimb.linkId===stair.linkId)||
   (!stair.linkId&&Math.hypot(e.stairClimb.x-stair.x,e.stairClimb.y-stair.y)<14)
  ))||false;
}
// 把梯身当成立体通道：禁止梯身穿过实体墙或关着的门，但不禁止从下面横向走过。
function stairPathBlocked(floor,stair){
 const radius=stairVisualShape(stair.shape)==='spiral'?32:20;
 const points=stairVisualShape(stair.shape)==='spiral'
  ?[[0,0],[-radius,0],[radius,0],[0,-radius],[0,radius]]
  :[[0,-37],[0,0],[0,37]];
 return points.some(([lx,ly])=>{
   const v=stairWorld(stair,lx,ly),x=stair.x+v.x,y=stair.y+v.y;
   return (floor.walls||[]).some(w=>distToSegment(x,y,w.x1,w.y1,w.x2,w.y2)<13+(w.width||16)/2)
      ||(floor.doors||[]).some(d=>!d.open&&Math.hypot(d.x-x,d.y-y)<24)
      ||(floor.windows||[]).some(win=>Math.hypot(win.x-x,win.y-y)<18);
 });
}
function safeStairArrival(scene,targetIndex,x,y,offset,stair=null){
 const floor=scene.floors[targetIndex];
 const local=[[offset,20],[0,30],[0,-30],[-offset,20],[0,0]];
 const candidates=local.map(([lx,ly])=>{
   const point=stair?stairWorld(stair,lx,ly):{x:lx,y:ly};
   return [x+point.x,y+point.y];
 });
 const selected=candidates.find(([px,py])=>canMoveTo(targetIndex,px,py)&&stairLandingUnoccupied(scene,targetIndex,px,py));
 if(selected)return selected;
 // 无楼板时，人物站在梯子顶部，不会凭空创建整块地板。
 if(!hasBuiltFloorAt(floor,x,y)&&stairLandingUnoccupied(scene,targetIndex,x,y))return [x,y];
 return null;
}
function createStairPair(scene,fromLevel,toLevel,x,y,shape,material,style,continuous=false,linkId=''){
 const srcIndex=floorIndexForLevel(scene,fromLevel,true,{x,y});
 const dstIndex=floorIndexForLevel(scene,toLevel,true,{x,y});
 const from=scene.floors[srcIndex],to=scene.floors[dstIndex];
 const up=toLevel>fromLevel;
 const pairId=linkId||'stair_'+Date.now().toString(36)+'_'+(++stairTransferSequence);
 const common={x,y,shape,material,style,rot:state.rotation||0,linkId:pairId,continuous};
 // A direcionalidade é sempre local ao andar em que a escada está desenhada.
 const origin={...common,dir:up?'up':'down',targetFloor:dstIndex,targetLevel:toLevel};
 const destination={...common,dir:up?'down':'up',targetFloor:srcIndex,targetLevel:fromLevel};
 from.stairs.push(origin);
 to.stairs.push(destination);
 // 不再自动生成任何地板。
 // O furo é apenas decorativo no piso superior e acompanha o destino.
 const upper=up?to:from;
 if(!upper.openings.some(o=>o.stairLinkId===pairId))
  upper.openings.push({x:x-36,y:y-52,w:72,h:104,stairLinkId:pairId});
 return {srcIndex,dstIndex,origin,destination};
}
function createArchitectStair(wx,wy){
 const scene=getScene();ensureFloorLevels(scene);
 const start=floorLevel(scene,state.currentFloor);
 const answer=prompt('Esta escada SOBE ou DESCE neste andar?\nDigite: sobe / desce', 'sobe');
 if(answer===null)return false;
 const direction=answer.trim().toLowerCase();
 if(!['sobe','subir','desce','descer'].includes(direction)){
  alert('Escolha "sobe" ou "desce".');return false;
 }
 const up=direction==='sobe'||direction==='subir';
 const sign=up?1:-1;
 const rawShape=state.stairShape||'straight',shape=stairVisualShape(rawShape);
 let end=start+sign;
 if(shape==='continuous'){
  const answer=prompt('Escada contínua: até qual andar?\n0 = térreo, 1 = 2º, 2 = 3º; -1 = 1º subterrâneo.',String(start+sign*2));
  if(answer===null)return false;
  const requested=Number(answer.trim());
  if(!Number.isInteger(requested)||requested*sign<=start*sign||Math.abs(requested-start)>12){
   alert('Indique um nível válido na direção escolhida (até 12 andares).');
   return false;
  }
  end=requested;
 }
 const material=state.stairMaterial||'wood',style=state.buildStyle||'normal';
 const shaft='shaft_'+Date.now().toString(36)+'_'+(++stairTransferSequence);
 let level=start,count=0;
 while(level!==end){
  const next=level+sign;
  // Nos pavimentos intermediários há uma entrada de descida e outra de subida.
  // Afastar as duas extremidades permite ao jogador escolher continuar ou sair.
  const baseX=shape==='continuous'?wx+(count%2===0?36:-36):wx;
  const baseY=wy;
  const pair=createStairPair(scene,level,next,baseX,baseY,shape,material,style,shape==='continuous',shaft+'_'+count);
  pair.origin.shaftId=shaft;pair.destination.shaftId=shaft;
  level=next;count++;
 }
 const incomplete=[];
 for(let level=start+sign;sign>0?level<=end:level>=end;level+=sign){
   const idx=floorIndexForLevel(scene,level,false);
   if(idx>=0&&!hasBuiltFloorAt(scene.floors[idx],wx,wy))incomplete.push(floorName(level));
 }
 if(incomplete.length){
   const msg='⚠️ 这些楼层还没有楼板：'+incomplete.join('、')+'。楼梯可以保留，之后由建筑师自行铺设楼板。';
   logEvent(msg);alert(msg);
 }
 updateFloorLabel();
 logEvent('🪜 '+(shape==='continuous'?'Escada contínua':'Escada')+' '+(up?'subindo':'descendo')+' de '+floorName(start)+' até '+floorName(end)+'; ligação nos dois sentidos.');
 return true;
}
function refreshStairDestinationLinks(scene){
 ensureFloorLevels(scene);
 for(let i=0;i<scene.floors.length;i++){
  for(const stair of scene.floors[i].stairs){
   if(!Number.isInteger(stair.targetFloor)||!scene.floors[stair.targetFloor]){
    const idx=floorIndexForLevel(scene,floorLevel(scene,i)+(stair.dir==='down'?-1:1));
    if(idx!==-1){stair.targetFloor=idx;stair.targetLevel=floorLevel(scene,idx);}
   }
  }
 }
}
function findStairCounterpart(scene,floorIndex,stair){
 const targetIndex=stairLinkedIndex(scene,floorIndex,stair);
 if(targetIndex<0)return null;
 const target=scene.floors[targetIndex];
 const matched=(stair.linkId&&target.stairs.find(s=>s.linkId===stair.linkId&&s.dir!==stair.dir))
  ||target.stairs.find(s=>s.dir!==stair.dir&&Math.hypot(s.x-stair.x,s.y-stair.y)<55);
 return {index:targetIndex,stair:matched||stair};
}
function transferOnStair(ent,stair,automatic=false){
 const scene=getScene();
 const counterpart=findStairCounterpart(scene,ent.floor,stair);
 if(!counterpart)return false;
 const now=performance.now();
 if(automatic && now<(ent.stairCooldown||0))return false;
 const originFloor=ent.floor;
 const target=counterpart.index;
 // 目的地可以是尚未铺楼板的空层。
 ent.floor=target;
 const offset=stair.dir==='up'?32:-32;
 const landing=safeStairArrival(scene,target,counterpart.stair.x,counterpart.stair.y,offset,counterpart.stair);
 if(!landing){
   ent.floor=originFloor;
   logEvent('⚠️ A saída da escada está bloqueada; libere o patamar no andar de destino.');
   return false;
 }
 const [arrivalX,arrivalY]=landing;
 ent.x=arrivalX;ent.y=arrivalY;
 ent.stairCooldown=now+1050;
 ent.stairTransitionAt=now;
 state.currentFloor=target;updateFloorLabel();
 if(typeof refreshGmFocus==='function')refreshGmFocus();
 logEvent('🪜 '+ent.name+' chegou ao '+floorName(floorLevel(scene,target))+'.');
 return true;
}
// 对于旧地图，台阶朝向默认与绘图一致：底端 +Y，顶端 -Y。
// 从侧面穿行不启动攀爬，保留镂空楼梯下方的通道。
const STAIR_TRAVEL_MS=1050;
function clearTransientStairClimbs(entities){
 for(const ent of entities||[]){
  if(ent.stairClimb){
   ent.x=ent.stairClimb.fromX??ent.x;
   ent.y=ent.stairClimb.fromY??ent.y;
   delete ent.stairClimb;
  }
  delete ent.stairClimbProgress;
  // performance.now() 的时间基准在刷新页面后会改变。
  delete ent.stairCooldown;
 }
}
function stairLocal(stair,x,y){
 const angle=(stair.rot||0)*Math.PI/2,c=Math.cos(angle),s=Math.sin(angle);
 return {x:c*x+s*y,y:-s*x+c*y};
}
function stairWorld(stair,x,y){
 const angle=(stair.rot||0)*Math.PI/2,c=Math.cos(angle),s=Math.sin(angle);
 return {x:c*x-s*y,y:s*x+c*y};
}
function stairEntryAllowed(stair,ent,dx,dy){
 const shape=stairVisualShape(stair.shape);
 const location=stairLocal(stair,ent.x-stair.x,ent.y-stair.y);
 const movement=stairLocal(stair,dx,dy);
 const localX=location.x,localY=location.y;
 if(shape==='spiral'){
  const near=Math.hypot(localX,localY)<52;
  return near&&Math.abs(movement.y)>.6&&(stair.dir==='down'?movement.y>0:movement.y<0);
 }
 if(Math.abs(localX)>27)return false;
 // 低层往上：从画面下方走向上方；高层往下反之。
 if(stair.dir==='down')return localY>=-65&&localY<=-22&&movement.y>.55;
 return localY>=22&&localY<=65&&movement.y<-.55;
}
function beginStairClimb(ent,stair,dx,dy){
 if(ent.stairClimb||performance.now()<(ent.stairCooldown||0))return false;
 const scene=getScene(),counterpart=findStairCounterpart(scene,ent.floor,stair);
 if(!counterpart)return false;
 if(!stairEntryAllowed(stair,ent,dx,dy))return false;
 // 同一梯段同一时间只有一人开始攀爬；其他人继续按移动键即可排队。
 if(stairBusyForEntity(ent,stair))return false;
 if(stairPathBlocked(scene.floors[ent.floor],stair)){
   ent.stairCooldown=performance.now()+750;
   logEvent('⚠️ 楼梯被墙壁、门或窗挡住，不能开始攀爬。');
   return false;
 }
 ent.stairClimb={
  floor:ent.floor,linkId:stair.linkId||null,x:stair.x,y:stair.y,
  fromX:ent.x,fromY:ent.y,
  start:performance.now(),duration:STAIR_TRAVEL_MS,
  dir:stair.dir,shape:stairVisualShape(stair.shape),
  target:counterpart.index,
  angle:Math.atan2(ent.y-stair.y,ent.x-stair.x)
 };
 const forward=stairWorld(stair,0,stair.dir==='down'?1:-1);
 ent.facingX=forward.x;ent.facingY=forward.y;
 ent.walkingUntil=performance.now()+160;
 return true;
}
function advanceStairClimb(ent){
 const climb=ent.stairClimb;if(!climb)return false;
 const scene=getScene(),floor=scene.floors[climb.floor];
 const stair=floor?.stairs.find(s=>(climb.linkId&&s.linkId===climb.linkId)||
  (!climb.linkId&&Math.hypot(s.x-climb.x,s.y-climb.y)<5&&s.dir===climb.dir));
 if(!stair){
  ent.x=climb.fromX;ent.y=climb.fromY;
  delete ent.stairClimb;delete ent.stairClimbProgress;return true;
 }
 const progress=Math.max(0,Math.min(1,(performance.now()-climb.start)/climb.duration));
 const eased=progress*progress*(3-2*progress);
 // 动画期间保持当前楼层，人物在台阶上逐渐向上（或向下）移动。
 if(climb.shape==='spiral'){
   // 从人物原来的切线位置，沿圆形楼梯绕行；不是沿直线穿过中心柱。
   const beginning=climb.angle;
   const winding=climb.dir==='down'?1:-1;
   const sweep=winding*Math.PI*1.5*eased;
   const radius=34*(1-eased*.12);
   const angle=beginning+sweep;
   ent.x=stair.x+Math.cos(angle)*radius;
   ent.y=stair.y+Math.sin(angle)*radius;
   ent.facingX=-Math.sin(angle)*winding;
   ent.facingY=Math.cos(angle)*winding;
 }else{
   const endpoint=stairWorld(stair,0,climb.dir==='down'?31:-31);
   ent.y=climb.fromY+(stair.y+endpoint.y-climb.fromY)*eased;
   ent.x=climb.fromX+(stair.x+endpoint.x-climb.fromX)*eased;
 }
 ent.stairClimbProgress=progress;
 ent.walkingUntil=performance.now()+140;
 if(progress>=1){
  const sourceX=climb.fromX,sourceY=climb.fromY;
  delete ent.stairClimb;
  delete ent.stairClimbProgress;
  if(!transferOnStair(ent,stair,true)){
   ent.x=sourceX;ent.y=sourceY;ent.stairCooldown=performance.now()+400;
  }
 }
 return true;
}
function tryWalkingStair(ent,dx,dy){
 if(!ent||(!dx&&!dy)||ent.stairClimb)return false;
 const floor=getScene().floors[ent.floor];if(!floor)return false;
 return floor.stairs.some(stair=>beginStairClimb(ent,stair,dx,dy));
}
