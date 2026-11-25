// Coberturas arquitetônicas independentes das lajes.
// O telhado só existe quando o Arquiteto o coloca explicitamente.
const ROOF_TYPES=new Set(['roof_tile','roof_concrete','roof_metal','roof_thatch']);
const ROOF_OVERHANG=24; // unidades de projeto: beiral limitado pela estrutura inferior
function isRoofMaterial(mat){return ROOF_TYPES.has(mat);}
function pointInArchitectArea(a,x,y,pad=0){
 return x>=a.x-pad&&y>=a.y-pad&&x<=a.x+a.w+pad&&y<=a.y+a.h+pad;
}
const NON_STRUCTURAL_SURFACES = new Set(['grass','sand','dirt','snow','water','kenney_water','void','cave','mud','carpet','forest','space']);
function isStructuralSlab(area){
 return !area.roof && !isRoofMaterial(area.mat) && !NON_STRUCTURAL_SURFACES.has(area.mat) && !mesaTerrainById.has(area.mat) && (!Object.hasOwn(TERRAIN_PALETTES,area.mat)||catalogInteriorFloors.has(area.mat));
}
function roofSupportingBounds(floor){
 const pieces=[...(floor.buildings||[])];
 for(const w of floor.walls||[]){
  pieces.push({x:Math.min(w.x1,w.x2),y:Math.min(w.y1,w.y2),
    w:Math.abs(w.x2-w.x1),h:Math.abs(w.y2-w.y1)});
 }
 for(const a of floor.areas||[]){
  if(isStructuralSlab(a))pieces.push(a);
 }
 if(!pieces.length)return null;
 const x=Math.min(...pieces.map(p=>p.x)),y=Math.min(...pieces.map(p=>p.y));
 const right=Math.max(...pieces.map(p=>p.x+p.w)),bottom=Math.max(...pieces.map(p=>p.y+p.h));
 return {x,y,w:right-x,h:bottom-y};
}
function roofHasStructuralSupport(floor,rect){
 const ov=ROOF_OVERHANG+2;
 const corners=[[rect.x,rect.y],[rect.x+rect.w,rect.y],[rect.x,rect.y+rect.h],[rect.x+rect.w,rect.y+rect.h]];
 const structural=(floor.areas||[]).filter(isStructuralSlab);
 // 楼板必须支撑整个屋顶轮廓，避免悬空的 L 形角落。
 if(structural.length&&corners.every(([x,y])=>structural.some(a=>pointInArchitectArea(a,x,y,ov))))return true;
 // 无楼板时，四面墙必须形成近似封闭的矩形。
 if((floor.buildings||[]).some(building=>corners.every(([x,y])=>
  buildingDistance(x,y,building)<=ov)))return true;
 const walls=floor.walls||[];
 if(walls.length<4)return false;
 const checks=[
  {horizontal:true,coord:rect.y,a:rect.x,b:rect.x+rect.w},
  {horizontal:true,coord:rect.y+rect.h,a:rect.x,b:rect.x+rect.w},
  {horizontal:false,coord:rect.x,a:rect.y,b:rect.y+rect.h},
  {horizontal:false,coord:rect.x+rect.w,a:rect.y,b:rect.y+rect.h}
 ];
 return checks.every(side=>{
  const candidates=walls.filter(w=>{
   const horizontal=Math.abs(w.y2-w.y1)<1,vertical=Math.abs(w.x2-w.x1)<1;
   return side.horizontal?horizontal&&Math.abs(w.y1-side.coord)<=ov:vertical&&Math.abs(w.x1-side.coord)<=ov;
  });
  // 检查边界的四个采样点，拒绝明显断开的墙。
  return [0.1,0.35,0.65,0.9].every(t=>{
   const pos=side.a+(side.b-side.a)*t;
   return candidates.some(w=>{
     const start=side.horizontal?Math.min(w.x1,w.x2):Math.min(w.y1,w.y2);
     const end=side.horizontal?Math.max(w.x1,w.x2):Math.max(w.y1,w.y2);
     return pos>=start-ov&&pos<=end+ov;
   });
  });
 });
}
function findRoofSupport(scene,rect){
 ensureFloorLevels(scene);
 const cx=rect.x+rect.w/2,cy=rect.y+rect.h/2;
 const candidates=scene.floors.map((floor,i)=>({floor,i,level:floor.level,bounds:roofSupportingBounds(floor)}))
   .filter(p=>p.bounds&&pointInArchitectArea(p.bounds,cx,cy,ROOF_OVERHANG)&&roofHasStructuralSupport(p.floor,rect))
   .sort((a,b)=>b.level-a.level);
 return candidates[0]||null;
}
function placeArchitectRoof(rect){
 const scene=getScene(),support=findRoofSupport(scene,rect);
 if(!support){
  alert('屋顶需要下层建筑物支撑。请先建造墙壁或铺设建筑楼板。');
  return false;
 }
 const b=support.bounds,ov=ROOF_OVERHANG;
 if(rect.x<b.x-ov||rect.y<b.y-ov||rect.x+rect.w>b.x+b.w+ov||rect.y+rect.h>b.y+b.h+ov){
  alert('屋檐超出了下层的支撑范围。请缩小屋顶，最大外伸约 '+(ROOF_OVERHANG/32).toFixed(2)+' 米。');
  return false;
 }
 const level=support.level+1,target=floorIndexForLevel(scene,level,true,{x:rect.x,y:rect.y});
 const floor=scene.floors[target];
 const mat=state.roofMaterial||'roof_tile';
 const pitch=state.roofPitch||(mat==='roof_concrete'?'flat':'gable');
 const height=pitch==='flat'?0:Math.min(6,Math.max(.25,Number(state.roofHeight)||2));
 const attic=Boolean(state.roofAttic&&pitch!=='flat');
 const roofId='roof_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
 if(attic){
   // 阁楼是明确的建筑选择；预留边缘以表示屋檐下方的低矮空间。
   const inset=Math.min(26,Math.min(rect.w,rect.h)*.15);
   floor.areas.push({x:rect.x+inset,y:rect.y+inset,
     w:Math.max(1,rect.w-2*inset),h:Math.max(1,rect.h-2*inset),
     mat:'wood',attic:true,atticRoofId:roofId});
 }
 floor.areas.push({...rect,mat,roof:true,roofId,roofPitch:pitch,roofHeight:height,
   roofAttic:attic,supportLevel:support.level,roofWalkable:pitch==='flat'});
 state.currentFloor=target;updateFloorLabel();
 logEvent('🏠 已在 '+floorName(level)+' 建造屋顶。可以把屋顶当作可行走表面，混凝土屋顶可作为露台。');
 return true;
}
// 仅供游戏内移动碰撞使用的简化净空模型，非工程结构计算。
// 屋檐处约 0.8 米；屋脊根据建筑师设置的高度逐渐升高。
function atticHeadroomAt(roof,x,y){
 const pitch=roofPitchFor(roof.mat,roof.roofPitch);
 if(pitch==='flat')return Infinity;
 const nx=Math.max(0,1-Math.abs(x-(roof.x+roof.w/2))/(roof.w/2||1));
 const ny=Math.max(0,1-Math.abs(y-(roof.y+roof.h/2))/(roof.h/2||1));
 const slope=roof.w>=roof.h?ny:nx;
 const fraction=pitch==='hip'?Math.min(nx,ny):slope;
 return .8+Math.max(.25,roof.roofHeight??2)*fraction;
}
function setRoofPitch(pitch){
 if(!['gable','hip','flat'].includes(pitch))return;
 const obj=typeof selectedArchitectItem==='function'?selectedArchitectItem():null;
 if(obj&&isRoofMaterial(obj.mat)){
   beginEdit();obj.roofPitch=pitch;obj.roofWalkable=pitch==='flat';finishEdit();
 }else state.roofPitch=pitch;
}
function setRoofHeight(value){
 const height=Math.min(6,Math.max(0,Number(value)||0));
 const obj=typeof selectedArchitectItem==='function'?selectedArchitectItem():null;
 if(obj&&isRoofMaterial(obj.mat)){
   beginEdit();obj.roofHeight=height;finishEdit();
 }else state.roofHeight=height;
}
function setRoofAttic(enabled){
 const obj=typeof selectedArchitectItem==='function'?selectedArchitectItem():null;
 if(obj&&isRoofMaterial(obj.mat)){
   const floor=getScene().floors[state.currentFloor];
   beginEdit();
   obj.roofAttic=Boolean(enabled);
   if(!obj.roofId)obj.roofId='roof_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);
   const existing=floor.areas.filter(a=>a.attic&&a.atticRoofId===obj.roofId);
   if(enabled&&!existing.length){
     const inset=Math.min(26,Math.min(obj.w,obj.h)*.15);
     floor.areas.splice(Math.max(0,floor.areas.indexOf(obj)),0,{
       x:obj.x+inset,y:obj.y+inset,w:Math.max(1,obj.w-inset*2),h:Math.max(1,obj.h-inset*2),
       mat:'wood',attic:true,atticRoofId:obj.roofId
     });
   }else if(!enabled){
     for(let i=floor.areas.length-1;i>=0;i--){
       if(floor.areas[i].attic&&floor.areas[i].atticRoofId===obj.roofId)floor.areas.splice(i,1);
     }
   }
   finishEdit();
   logEvent(enabled?'🏠 已按你的选择添加阁楼地板。':'🏠 已删除此屋顶的阁楼地板。');
 }else state.roofAttic=Boolean(enabled);
}
function roofPitchFor(mat,pitch){
 if(['gable','hip','flat'].includes(pitch))return pitch;
 return mat==='roof_concrete'?'flat':'gable';
}
// 天窗只属于屋顶，不在其他楼层制造开口。梯口优先使用现有楼梯连接坐标。
function addRoofOpening(x,y,type='skylight'){
 const floor=getScene().floors[state.currentFloor];
 const roof=(floor.areas||[]).find(a=>a.roof&&pointInArchitectArea(a,x,y,-18));
 if(!roof){logEvent('⚠️ 请先切换到有屋顶的楼层，再放置天窗或阁楼出口。');return false;}
 if(!Array.isArray(floor.roofOpenings))floor.roofOpenings=[];
 if(floor.roofOpenings.some(o=>Math.hypot(o.x-x,o.y-y)<35)){
  logEvent('⚠️ 两个屋顶开口距离太近。');return false;
 }
 let stairLinkId;
 if(type==='hatch'){
  const scene=getScene(),index=state.currentFloor,level=floorLevel(scene,index);
  const lowerIndex=floorIndexForLevel(scene,level-1,false);
  if(lowerIndex<0)return false;
  const lower=scene.floors[lowerIndex];
  const stair=floor.stairs.find(st=>st.dir==='down'&&Math.hypot(st.x-x,st.y-y)<62);
  if(stair){
   x=stair.x;y=stair.y;stairLinkId=stair.linkId;
   if(!pointInArchitectArea(roof,x,y,-18))return false;
  }else{
   if(!onPaintedGround(lower,x,y)){logEvent('O alçapão precisa de piso no andar de baixo.');return false;}
   const pair=createStairPair(scene,level-1,level,x,y,'open',state.stairMaterial||'wood',state.buildStyle);
   stairLinkId=pair.destination.linkId;
  }
 }
 floor.roofOpenings.push({x,y,w:type==='hatch'?66:78,h:type==='hatch'?74:52,type,roofId:roof.roofId||null,stairLinkId});
 logEvent(type==='hatch'?'🚪 已添加楼梯屋顶出口。':'🪟 已添加屋顶天窗。');
 return true;
}
function drawRoofOpenings(floor,region=null){
 const openings=[...(floor.roofOpenings||[])];
 for(const opening of (floor.openings||[])){
  if(!opening.stairLinkId)continue;
  if(!floor.areas.some(a=>a.roof&&pointInArchitectArea(a,opening.x+opening.w/2,opening.y+opening.h/2)))continue;
  if(openings.some(o=>Math.hypot(o.x-(opening.x+opening.w/2),o.y-(opening.y+opening.h/2))<26))continue;
  openings.push({x:opening.x+opening.w/2,y:opening.y+opening.h/2,
   w:Math.min(62,opening.w),h:Math.min(74,opening.h),type:'hatch'});
 }
 for(const o of openings){
  if(region&&!pointInArchitectArea(region,o.x,o.y))continue;
  if(!region&&!floor.areas.some(a=>isRoofMaterial(a.mat)&&pointInArchitectArea(a,o.x,o.y)))continue;
  ctx.save();ctx.translate(o.x,o.y);
  ctx.fillStyle='#263039';ctx.fillRect(-o.w/2-5,-o.h/2-5,o.w+10,o.h+10);
  ctx.fillStyle=o.type==='skylight'?'#6dc7d4':'#202c37';
  ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h);
  ctx.strokeStyle=o.type==='skylight'?'#d6f4ef':'#af9877';ctx.lineWidth=4;
  ctx.strokeRect(-o.w/2,-o.h/2,o.w,o.h);
  if(o.type==='skylight'){
   ctx.strokeStyle='rgba(240,255,255,.75)';ctx.lineWidth=3;
   ctx.beginPath();ctx.moveTo(0,-o.h/2);ctx.lineTo(0,o.h/2);
   ctx.moveTo(-o.w/2,0);ctx.lineTo(o.w/2,0);ctx.stroke();
   ctx.fillStyle='rgba(255,255,255,.22)';
   ctx.beginPath();ctx.moveTo(-o.w/2+5,-o.h/2+4);ctx.lineTo(o.w/2-9,-o.h/2+4);
   ctx.lineTo(-o.w/2+5,o.h/2-7);ctx.closePath();ctx.fill();
  }else{
   ctx.strokeStyle='#dcb96e';ctx.lineWidth=3;
   ctx.beginPath();ctx.moveTo(-o.w/2+8,o.h/2-10);ctx.lineTo(o.w/2-8,o.h/2-10);ctx.stroke();
  }
  ctx.restore();
 }
}
function roofHiddenByMountain(rect){
 return Boolean(roofViewFloors?.some(floor=>caveMountainMasksRoof(floor,rect)));
}

function roofHiddenInCaveCourtyard(rect){
 const floor=roofViewFloors?.at(-1);
 if(!floor||!caveCourtyardContains(floor,rect.x+rect.w/2,rect.y+rect.h/2))return false;
 // A slab alone is insufficient evidence of a real house in the courtyard.
 return !roofHasStructuralSupport({...floor,areas:[]},rect);
}

function drawRoofSurface(x,y,w,h,mat,pitchValue=null,roofHeight=null){
 const bounds={x,y,w,h};
 if(roofHiddenByMountain(bounds)||roofHiddenInCaveCourtyard(bounds))return;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 const palettes={
  roof_tile:['#9a493e','#c06d54','#5d3431'],
  roof_concrete:['#afb5b8','#d7d9d4','#737d84'],
  roof_metal:['#64859c','#a3b8be','#354d5b'],
  roof_thatch:['#a9874b','#c7aa68','#6b5832']
 };
 const [base,light,dark]=palettes[mat]||palettes.roof_tile;
 ctx.fillStyle=base;ctx.fillRect(x,y,w,h);
 if(mat==='roof_concrete'){
  const cell=52;
  for(let yy=Math.floor(y/cell)*cell;yy<y+h;yy+=cell)
   for(let xx=Math.floor(x/cell)*cell;xx<x+w;xx+=cell){
    ctx.strokeStyle='rgba(42,49,54,.22)';ctx.lineWidth=1;
    ctx.strokeRect(xx,yy,cell,cell);
    ctx.fillStyle='rgba(255,255,255,.10)';ctx.fillRect(xx+2,yy+2,cell-4,3);
   }
  ctx.strokeStyle=dark;ctx.lineWidth=5;ctx.strokeRect(x+3,y+3,w-6,h-6);
 }else if(mat==='roof_metal'){
  for(let xx=Math.floor(x/24)*24;xx<x+w;xx+=24){
    ctx.fillStyle='rgba(225,240,244,.10)';ctx.fillRect(xx+2,y,8,h);
    ctx.strokeStyle=dark;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,y+h);ctx.stroke();
  }
 }else if(mat==='roof_tile'){
  for(let yy=Math.floor(y/18)*18;yy<y+h;yy+=18){
    for(let xx=Math.floor(x/30)*30-(Math.floor(yy/18)%2)*15;xx<x+w;xx+=30){
     ctx.fillStyle=(Math.abs(Math.sin(xx*2.17+yy*.83))>.5)?light:base;
     ctx.fillRect(xx+1,yy+2,28,14);
     ctx.strokeStyle=dark;ctx.lineWidth=1.5;ctx.strokeRect(xx+.5,yy+1.5,29,15);
    }
  }
 }else{
  for(let yy=Math.floor(y/12)*12;yy<y+h;yy+=12)
   for(let xx=Math.floor(x/22)*22;xx<x+w;xx+=22){
    ctx.strokeStyle=(Math.sin(xx*.8+yy)>.5)?light:dark;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(xx,yy+2);ctx.lineTo(xx+17,yy+7);ctx.stroke();
   }
 }
 const pitch=roofPitchFor(mat,pitchValue);
 if(pitch!=='flat'){
  // 从上往下观察的屋面：屋脊是高点，两侧明暗形成坡度。
  const across=w>=h;
  const gradient=across?ctx.createLinearGradient(0,y,0,y+h):ctx.createLinearGradient(x,0,x+w,0);
  const heightRatio=Math.max(.1,Math.min(1,(Number(roofHeight)||2)/4));
  gradient.addColorStop(0,'rgba(245,238,218,'+(0.18+heightRatio*.3)+')');
  gradient.addColorStop(.47,'rgba(255,255,255,.10)');
  gradient.addColorStop(.53,'rgba(12,17,22,.28)');
  gradient.addColorStop(1,'rgba(0,0,0,'+(0.19+heightRatio*.39)+')');
  ctx.fillStyle=gradient;ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='rgba(247,222,174,.76)';ctx.lineWidth=3;
  ctx.beginPath();
  if(across){ctx.moveTo(x+5,y+h/2);ctx.lineTo(x+w-5,y+h/2);}
  else{ctx.moveTo(x+w/2,y+5);ctx.lineTo(x+w/2,y+h-5);}
  ctx.stroke();
  if(pitch==='hip'){
   ctx.strokeStyle='rgba(51,39,36,.56)';ctx.lineWidth=2;
   ctx.beginPath();
   if(across){
     const ridge=Math.min(w*.2,h*.5);
     ctx.moveTo(x,y);ctx.lineTo(x+ridge,y+h/2);ctx.lineTo(x,y+h);
     ctx.moveTo(x+w,y);ctx.lineTo(x+w-ridge,y+h/2);ctx.lineTo(x+w,y+h);
   }else{
     const ridge=Math.min(h*.2,w*.5);
     ctx.moveTo(x,y);ctx.lineTo(x+w/2,y+ridge);ctx.lineTo(x+w,y);
     ctx.moveTo(x,y+h);ctx.lineTo(x+w/2,y+h-ridge);ctx.lineTo(x+w,y+h);
   }
   ctx.stroke();
  }
  ctx.fillStyle='rgba(0,0,0,.18)';
  ctx.fillRect(x+2,y+h-8,w-4,6);
 }
 ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=6;ctx.strokeRect(x+2,y+2,w-4,h-4);
 ctx.restore();
}
// 每次切换室内外平滑过渡，不修改场景数据。
const roofFadeLevels=new Map();
function roofCoverageAtActor(area,actor){
 const margin=Math.min(12,Math.max(1,Math.min(area.w,area.h)/5));
 return pointInArchitectArea(area,actor.x,actor.y,-margin);
}
function roofSupportFloor(scene,floor,roof){
 const level=roof.supportLevel??floor.level-1;
 if(level>=floor.level)return null;
 return scene.floors.find(candidate=>candidate.level===level);
}

function effectiveRoofBounds(scene,floor,roof){
 const below=roofSupportFloor(scene,floor,roof);
 if(!below)return roof;
 const support=roofSupportingBounds(below);
 if(!support||!roofHasStructuralSupport({...below,areas:[]},support))return roof;
 // When the roof already follows a home's full footprint, cover its wall thickness.
 const near=ROOF_OVERHANG+12;
 if(Math.abs(roof.x-support.x)>near||Math.abs(roof.y-support.y)>near||
    Math.abs(roof.x+roof.w-support.x-support.w)>near||
    Math.abs(roof.y+roof.h-support.y-support.h)>near)return roof;
 const wallMargin=Math.min(ROOF_OVERHANG,Math.max(8,
   ...(below.walls||[]).map(w=>(w.width||16)/2+3),
   ...(below.buildings||[]).map(b=>(b.wallThickness||16)/2+3)));
 const x=Math.min(roof.x,support.x-wallMargin),y=Math.min(roof.y,support.y-wallMargin);
 return {...roof,x,y,w:Math.max(roof.x+roof.w,support.x+support.w+wallMargin)-x,
   h:Math.max(roof.y+roof.h,support.y+support.h+wallMargin)-y};
}

function savedRoofHasSupport(scene,floor,area){
 const below=roofSupportFloor(scene,floor,area);
 if(below&&(effectiveRoofBounds(scene,floor,area)!==area||roofHasStructuralSupport(below,area)))return true;
 // Historic roofs can have an outdated support level or snap beyond the old
 // validation tolerance. Require a real building footprint directly below.
 const adjacent=scene.floors.find(candidate=>candidate.level===floor.level-1);
 if(!adjacent)return false;
 const ox=area.x+area.w/2,oy=area.y+area.h/2;
 const intersects=(b)=>{
   const width=Math.max(0,Math.min(area.x+area.w,b.x+b.w)-Math.max(area.x,b.x));
   const height=Math.max(0,Math.min(area.y+area.h,b.y+b.h)-Math.max(area.y,b.y));
   return width*height>=area.w*area.h*.55&&pointInArchitectArea(b,ox,oy);
 };
 return (adjacent.buildings||[]).some(intersects)||
   (adjacent.walls||[]).length>=4&&Boolean(roofSupportingBounds(adjacent)&&intersects(roofSupportingBounds(adjacent)));
}

function externalBuildingSurfaces(scene,current){
 const candidates=[];
 for(const floor of scene.floors){
  if(floor.level<=current)continue;
  const areas=floor.areas||[];
  const roofs=areas.filter(area=>isRoofMaterial(area.mat)&&savedRoofHasSupport(scene,floor,area));
  const surfaces=roofs.length?roofs:areas.filter(area=>
   !area.attic&&!area.fromBuildingId&&isStructuralSlab(area));
  for(const area of surfaces)candidates.push({area,level:floor.level,floor});
 }
 return candidates;
}

function actorUnderBuildingCover(floor,area,actor){
 if(!roofCoverageAtActor(area,actor))return false;
 if((floor.buildings||[]).some(room=>buildingDistance(actor.x,actor.y,room)<0))return true;
 return (floor.areas||[]).some(slab=>isStructuralSlab(slab)&&pointInArchitectArea(slab,actor.x,actor.y));
}

function roofDoorCutouts(floor,roof,actor){
 if(state.mode!=='player'||!actor)return [];
 const cutouts=[];
 for(const door of floor.doors||[]){
   if(Math.hypot(door.x-actor.x,door.y-actor.y)>95)continue;
   const vertical=door.orient==='v';
   const along=vertical?door.y:door.x;
   const alongStart=vertical?roof.y:roof.x;
   const span=vertical?roof.h:roof.w;
   if(along<=alongStart||along>=alongStart+span)continue;
   const cross=vertical?door.x:door.y;
   const crossStart=vertical?roof.x:roof.y;
   const crossEnd=crossStart+(vertical?roof.w:roof.h);
   const edge=Math.abs(cross-crossStart)<=Math.abs(cross-crossEnd)?crossStart:crossEnd;
   if(Math.abs(cross-edge)>96||cross<crossStart-5||cross>crossEnd+5)continue;
   // Interior doors may be close to a roof edge in a narrow room.
   const inside=(x,y)=>(floor.buildings||[]).some(b=>b.hasFloor&&buildingDistance(x,y,b)<0)||
     (floor.areas||[]).some(a=>isStructuralSlab(a)&&pointInArchitectArea(a,x,y));
   const a=vertical?inside(door.x-12,door.y):inside(door.x,door.y-12);
   const b=vertical?inside(door.x+12,door.y):inside(door.x,door.y+12);
   if(a&&b)continue;
   const from=Math.min(edge,cross)-4,to=Math.max(edge,cross)+8;
   const half=(door.width||68)/2+8;
   cutouts.push(vertical?{x:from,y:along-half,w:to-from,h:half*2}:
     {x:along-half,y:from,w:half*2,h:to-from});
 }
 return cutouts;
}

function clipRoofOverhang(floor,roof,actor){
 if(state.mode!=='player'||!actor||!pointInArchitectArea(roof,actor.x,actor.y))return false;
 // Relate the roof to the underlying building's walls. Legacy houses store
 // the enclosure as wall segments and floors, rather than a building object.
 const footprint=(floor.buildings||[]).find(b=>pointInArchitectArea(b,roof.x+roof.w/2,roof.y+roof.h/2))
   ||roofSupportingBounds(floor);
 if(!footprint||pointInArchitectArea(footprint,actor.x,actor.y))return false;
 const x=Math.max(roof.x,footprint.x),y=Math.max(roof.y,footprint.y);
 const right=Math.min(roof.x+roof.w,footprint.x+footprint.w);
 const bottom=Math.min(roof.y+roof.h,footprint.y+footprint.h);
 if(right<=x||bottom<=y||!pointInArchitectArea({x,y,w:right-x,h:bottom-y},roof.x+roof.w/2,roof.y+roof.h/2))return false;
 ctx.beginPath();
 if(footprint.cornerRadius>0)ctx.roundRect(x,y,right-x,bottom-y,Math.min(footprint.cornerRadius,(right-x)/2,(bottom-y)/2));
 else ctx.rect(x,y,right-x,bottom-y);
 ctx.clip();
 return true;
}

function clipRoofAtDoors(floor,roof,actor){
 for(const gap of roofDoorCutouts(floor,roof,actor)){
   ctx.beginPath();
   ctx.rect(roof.x-1,roof.y-1,roof.w+2,roof.h+2);
   ctx.rect(gap.x,gap.y,gap.w,gap.h);
   ctx.clip('evenodd');
 }
}

function drawExternalBuildingTop(){
 if(state.mode==='architect')return;
 const actor=activeActor();if(!actor||actor.sceneId!==state.activeSceneId)return;
 const scene=getScene(),current=floorLevel(scene,actor.floor);
 const higher=scene.floors.filter(f=>f.level>current);
 const viewFloor=scene.floors[actor.floor];
 const candidates=externalBuildingSurfaces(scene,current).filter(({area})=>
   !caveMountainMasksRoof(viewFloor,area)&&!roofHiddenByMountain(area)&&!roofHiddenInCaveCourtyard(area));
 if(!candidates.length)return;
 const top=candidates.sort((a,b)=>a.level-b.level);
 const underSlab=higher.some(floor=>floor.areas.some(area=>
  isStructuralSlab(area)&&pointInArchitectArea(area,actor.x,actor.y)
 ) && !(floor.openings||[]).some(opening=>pointInArchitectArea(opening,actor.x,actor.y)));
 ctx.save();ctx.translate(state.camera.x,state.camera.y);ctx.scale(state.camera.zoom,state.camera.zoom);
 for(const {area:stored,level,floor} of top){
  const area=isRoofMaterial(stored.mat)?effectiveRoofBounds(scene,floor,stored):stored;
  // Lajes feitas de vários recortes mudam de visibilidade juntas e sem sobrepor o personagem.
  if(!isRoofMaterial(area.mat)){
   if(underSlab||top.some(entry=>entry.level>level&&isRoofMaterial(entry.area.mat)&&
     pointInArchitectArea(entry.area,area.x+area.w/2,area.y+area.h/2)))continue;
   ctx.save();
   clipOutsideCaves(scene.floors[actor.floor].caves,area);
   for(const opening of floor.openings||[]){
    ctx.beginPath();
    ctx.rect(area.x,area.y,area.w,area.h);
    const x=Math.max(area.x,opening.x),y=Math.max(area.y,opening.y);
    const right=Math.min(area.x+area.w,opening.x+opening.w);
    const bottom=Math.min(area.y+area.h,opening.y+opening.h);
    if(right>x&&bottom>y)ctx.rect(x,y,right-x,bottom-y);
    ctx.clip('evenodd');
   }
   drawTexturedArea(area.x,area.y,area.w,area.h,area.mat,area.color,area.tile);
   ctx.restore();
   continue;
  }
  const key=state.activeSceneId+':'+level+':'+area.x+':'+area.y+':'+area.w+':'+area.h;
  const indoor=actorUnderBuildingCover(viewFloor,area,actor);
  const now=performance.now();
  let fade=roofFadeLevels.get(key);
  if(!fade)fade={alpha:indoor?0:1,time:now};
  const elapsed=Math.min(.12,Math.max(0,(now-fade.time)/1000));
  fade.time=now;
  fade.alpha+=((indoor?0:1)-fade.alpha)*Math.min(1,elapsed*7);
  roofFadeLevels.set(key,fade);
  if(fade.alpha<.015)continue;
  ctx.save();ctx.globalAlpha=fade.alpha;
  clipOutsideCaves(scene.floors[actor.floor].caves,area);
  if(!clipRoofOverhang(viewFloor,area,actor))clipRoofAtDoors(viewFloor,area,actor);
  drawRoofSurface(area.x,area.y,area.w,area.h,area.mat,area.roofPitch,area.roofHeight);
  drawRoofOpenings(floor,area);
  ctx.restore();
 }
 ctx.restore();
}
