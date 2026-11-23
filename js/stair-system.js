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
 return (floor?.areas||[]).some(a=>!['water','kenney_water','void','carpet'].includes(a.mat)
  &&x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h);
}
function warnMissingStairFloor(scene,index,x,y){
 if(!hasBuiltFloorAt(scene.floors[index],x,y)){
  const msg='⚠️ '+floorName(floorLevel(scene,index))+' 还没有楼板。楼梯仍可安装，人物只能留在梯顶平台；以后可以自行铺设楼板。';
  logEvent(msg);
  if(typeof alert==='function')alert(msg);
 }
}
function safeStairArrival(scene,targetIndex,x,y,offset){
 const floor=scene.floors[targetIndex];
 const candidates=[[x+offset,y+20],[x,y+30],[x,y-30],[x-offset,y+20],[x,y]];
 const selected=candidates.find(([px,py])=>canMoveTo(targetIndex,px,py));
 if(selected)return selected;
 // 无楼板时，人物站在梯子顶部，不会凭空创建整块地板。
 if(!hasBuiltFloorAt(floor,x,y))return [x,y];
 return null;
}
function createStairPair(scene,fromLevel,toLevel,x,y,shape,material,style,continuous=false,linkId=''){
 const srcIndex=floorIndexForLevel(scene,fromLevel,true,{x,y});
 const dstIndex=floorIndexForLevel(scene,toLevel,true,{x,y});
 const from=scene.floors[srcIndex],to=scene.floors[dstIndex];
 const up=toLevel>fromLevel;
 const pairId=linkId||'stair_'+Date.now().toString(36)+'_'+(++stairTransferSequence);
 const common={x,y,shape,material,style,linkId:pairId,continuous};
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
 for(let level=start+sign;sign>0?level<=end:level>=end;level+=sign){
  const idx=floorIndexForLevel(scene,level,false);
  if(idx>=0)warnMissingStairFloor(scene,idx,wx,wy);
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
 const landing=safeStairArrival(scene,target,counterpart.stair.x,counterpart.stair.y,offset);
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
function tryWalkingStair(ent,dx,dy){
 if(!ent||!dx&&!dy)return;
 const scene=getScene(),floor=scene.floors[ent.floor];if(!floor)return;
 const now=performance.now();
 if(now<(ent.stairCooldown||0))return;
 // Entrar no núcleo da escada usando movimento, sem exigir E ou marcador textual.
 // A aproximação evita trocar de nível só por estar parado sobre a escada.
 for(const stair of floor.stairs){
  const d=Math.hypot(ent.x-stair.x,ent.y-stair.y);
  if(d<19 && transferOnStair(ent,stair,true))break;
 }
}
