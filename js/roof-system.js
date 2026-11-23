// Coberturas arquitetônicas independentes das lajes.
// O telhado só existe quando o Arquiteto o coloca explicitamente.
const ROOF_TYPES=new Set(['roof_tile','roof_concrete','roof_metal','roof_thatch']);
const ROOF_OVERHANG=24; // unidades de projeto: beiral limitado pela estrutura inferior
function isRoofMaterial(mat){return ROOF_TYPES.has(mat);}
function pointInArchitectArea(a,x,y,pad=0){
 return x>=a.x-pad&&y>=a.y-pad&&x<=a.x+a.w+pad&&y<=a.y+a.h+pad;
}
function roofSupportingBounds(floor){
 const pieces=[];
 for(const w of floor.walls||[]){
  pieces.push({x:Math.min(w.x1,w.x2),y:Math.min(w.y1,w.y2),
    w:Math.abs(w.x2-w.x1),h:Math.abs(w.y2-w.y1)});
 }
 for(const a of floor.areas||[]){
  if(!isRoofMaterial(a.mat)&&!['grass','sand','dirt','snow','water','kenney_water','void','cave','mud','carpet'].includes(a.mat))pieces.push(a);
 }
 if(!pieces.length)return null;
 const x=Math.min(...pieces.map(p=>p.x)),y=Math.min(...pieces.map(p=>p.y));
 const right=Math.max(...pieces.map(p=>p.x+p.w)),bottom=Math.max(...pieces.map(p=>p.y+p.h));
 return {x,y,w:right-x,h:bottom-y};
}
function findRoofSupport(scene,rect){
 ensureFloorLevels(scene);
 const cx=rect.x+rect.w/2,cy=rect.y+rect.h/2;
 const candidates=scene.floors.map((floor,i)=>({floor,i,level:floor.level,bounds:roofSupportingBounds(floor)}))
   .filter(p=>p.bounds&&pointInArchitectArea(p.bounds,cx,cy,ROOF_OVERHANG))
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
 floor.areas.push({...rect,mat:state.roofMaterial||'roof_tile',roof:true,
   supportLevel:support.level,roofWalkable:true});
 state.currentFloor=target;updateFloorLabel();
 logEvent('🏠 已在 '+floorName(level)+' 建造屋顶。可以把屋顶当作可行走表面，混凝土屋顶可作为露台。');
 return true;
}
function drawRoofSurface(x,y,w,h,mat){
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
 ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=6;ctx.strokeRect(x+2,y+2,w-4,h-4);
 ctx.restore();
}
function drawExternalBuildingTop(){
 if(state.mode==='architect')return;
 const actor=activeActor();if(!actor||actor.sceneId!==state.activeSceneId)return;
 const scene=getScene(),current=floorLevel(scene,actor.floor);
 const higher=scene.floors.filter(f=>f.level>current).sort((a,b)=>a.level-b.level);
 if(!higher.length)return;
 // 从室外看建筑的最上方：有屋顶画屋顶，否则显示最高层现有的楼板。
 const candidates=[];
 for(const floor of higher)for(const area of floor.areas||[]){
  if(['water','void','kenney_water'].includes(area.mat))continue;
  candidates.push({area,level:floor.level});
 }
 if(!candidates.length)return;
 const highest=Math.max(...candidates.map(e=>e.level));
 const top=candidates.filter(e=>e.level===highest);
 ctx.save();ctx.translate(state.camera.x,state.camera.y);ctx.scale(state.camera.zoom,state.camera.zoom);
 for(const {area} of top){
  if(pointInArchitectArea(area,actor.x,actor.y,0))continue; // 角色在室内：切开屋顶以展示内部
  if(isRoofMaterial(area.mat))drawRoofSurface(area.x,area.y,area.w,area.h,area.mat);
  else drawTexturedArea(area.x,area.y,area.w,area.h,area.mat,area.color,area.tile);
 }
 ctx.restore();
}
