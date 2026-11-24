let buildingPointer=null;
let showGmBuildingRoofs=true;

function buildingRadius(building) {
  return Math.min(building.cornerRadius,building.w/2,building.h/2);
}

function buildingDistance(x,y,b) {
  const radius=buildingRadius(b);
  const dx=Math.abs(x-b.x-b.w/2)-(b.w/2-radius);
  const dy=Math.abs(y-b.y-b.h/2)-(b.h/2-radius);
  return Math.hypot(Math.max(dx,0),Math.max(dy,0))+Math.min(Math.max(dx,dy),0)-radius;
}

function buildingFromDrag(x,y) {
  const a=dragStart,ex=snapCoord(x),ey=snapCoord(y);
  const field=id=>document.getElementById(id);
  const material=field('bldWallMat').value;
  return {
    x:Math.min(a.x,ex),y:Math.min(a.y,ey),w:Math.max(64,Math.abs(ex-a.x)),h:Math.max(64,Math.abs(ey-a.y)),
    wallMaterial:material,wallColor:field('bldWallColor').value,wallThickness:Number(field('bldWallThick').value),
    cornerRadius:Number(field('bldRadius').value),hasFloor:field('bldHasFloor').checked,
    floorMaterial:field('bldFloorMat').value,floorColor:field('bldFloorColor').value,
    hasRoof:field('bldHasRoof').checked,roofType:field('bldRoofType').value,roofColor:field('bldRoofColor').value
  };
}

function placeBuilding(scene,index,b) {
  b.id=crypto.randomUUID();
  const floor=scene.floors[index];
  (floor.buildings ||= []).push(b);
  expandFloorToInclude(floor,b.x,b.y);
  expandFloorToInclude(floor,b.x+b.w,b.y+b.h);
  if(b.hasRoof&&b.roofType==='upperFloorBase'){
    const upper=floorIndexForLevel(scene,floorLevel(scene,index)+1,true,b);
    const target=scene.floors[upper];
    const {x,y,w,h,cornerRadius}=b;
    target.areas.push({x,y,w,h,cornerRadius,mat:'wood',fromBuildingId:b.id});
    expandFloorToInclude(target,x,y);
    expandFloorToInclude(target,x+w,y+h);
  }
}

function eraseBuilding(scene,floor,x,y) {
  const building=(floor.buildings||[]).findLast(b=>Math.abs(buildingDistance(x,y,b))<b.wallThickness/2+8);
  if(!building)return false;
  floor.buildings=floor.buildings.filter(b=>b!==building);
  for(const kind of ['doors','windows'])floor[kind]=floor[kind].filter(item=>item.buildingId!==building.id);
  for(const level of scene.floors)level.areas=level.areas.filter(area=>area.fromBuildingId!==building.id);
  return true;
}

function snapBuildingOpening(floor,x,y,halfWidth) {
  let nearest=null;
  for(const b of floor.buildings||[]){
    const r=buildingRadius(b), margin=halfWidth+8;
    for(const [orient,across,start,end] of [
      ['h',b.y,b.x+r,b.x+b.w-r],['h',b.y+b.h,b.x+r,b.x+b.w-r],
      ['v',b.x,b.y+r,b.y+b.h-r],['v',b.x+b.w,b.y+r,b.y+b.h-r]
    ]){
      const along=orient==='h'?x:y, distance=Math.abs((orient==='h'?y:x)-across);
      if(distance>Math.max(18,b.wallThickness)||end-start<margin*2||along<start||along>end)continue;
      const pos=Math.max(start+margin,Math.min(end-margin,along));
      const opening={x:orient==='h'?pos:across,y:orient==='h'?across:pos,orient,buildingId:b.id};
      const overlap=[...floor.doors,...floor.windows].some(item=>item.buildingId===b.id &&
        Math.hypot(item.x-opening.x,item.y-opening.y)<halfWidth+(item.width||68)/2+4);
      if(!overlap&&(!nearest||distance<nearest.distance))nearest={opening,distance};
    }
  }
  return nearest?.opening;
}

function architectOpeningPosition(floor,x,y,halfWidth){
  const opening=snapBuildingOpening(floor,x,y,halfWidth);
  if(opening)return opening;
  if((floor.buildings||[]).some(b=>Math.abs(buildingDistance(x,y,b))<=Math.max(18,b.wallThickness))){
    logEvent('Escolha um trecho reto e livre da parede.');
    return null;
  }
  return carveOpeningOnWalls(floor,x,y,halfWidth);
}

function buildingWallBlocks(floor,x,y) {
  return (floor.buildings||[]).some(b=>{
    if(Math.abs(buildingDistance(x,y,b))>=b.wallThickness/2+10)return false;
    return !floor.doors.some(door=>door.open&&door.buildingId===b.id&&
      (door.orient==='v'?Math.abs(y-door.y):Math.abs(x-door.x))<24&&
      (door.orient==='v'?Math.abs(x-door.x):Math.abs(y-door.y))<b.wallThickness/2+12);
  });
}

function traceBuilding(b) {
  ctx.beginPath();
  ctx.roundRect(b.x,b.y,b.w,b.h,buildingRadius(b));
}

function drawBuildingBase(b,floor,preview=false) {
  ctx.save();
  if(b.hasFloor){
    traceBuilding(b);
    ctx.save();
    ctx.clip();
    if(b.floorMaterial==='custom'){
      ctx.fillStyle=b.floorColor;
      ctx.fillRect(b.x,b.y,b.w,b.h);
    }else drawTexturedArea(b.x,b.y,b.w,b.h,b.floorMaterial,b.floorColor);
    ctx.restore();
  }
  if(!preview){
    for(const item of [...floor.doors,...floor.windows]){
      if(item.buildingId!==b.id)continue;
      const half=(floor.doors.includes(item)?68:(item.width||40))/2;
      const width=b.wallThickness+12;
      ctx.beginPath();
      ctx.rect(b.x-64,b.y-64,b.w+128,b.h+128);
      if(item.orient==='v')ctx.rect(item.x-width/2,item.y-half,width,half*2);
      else ctx.rect(item.x-half,item.y-width/2,half*2,width);
      ctx.clip('evenodd');
    }
  }
  traceBuilding(b);
  ctx.lineWidth=b.wallThickness+4;
  ctx.strokeStyle='#1e2430';
  ctx.stroke();
  ctx.lineWidth=b.wallThickness;
  const colors={stone:'#717987',brick:'#a35e4b',wood:'#90663e',marble:'#cbd3dc'};
  ctx.strokeStyle=catalogWallPaint(b)||colors[b.wallMaterial]||b.wallColor;
  ctx.stroke();
  ctx.restore();
}

function drawBuildingRoofs(floor,index) {
  const actor=activeActor();
  for(const b of floor.buildings||[]){
    if(!b.hasRoof)continue;
    if(state.mode==='gm'&&!showGmBuildingRoofs)continue;
    if(state.mode==='architect'&&buildingPointer&&buildingDistance(buildingPointer.x,buildingPointer.y,b)<=b.wallThickness/2)continue;
    if(state.mode==='player'&&actor?.floor===index&&actor.sceneId===state.activeSceneId&&buildingDistance(actor.x,actor.y,b)<0)continue;
    ctx.save();
    if(state.mode==='gm')ctx.globalAlpha=.25;
    clipOutsideCaves(floor.caves,b);
    traceBuilding(b);
    ctx.clip();
    if(b.roofType==='upperFloorBase')drawTexturedArea(b.x,b.y,b.w,b.h,'wood');
    else {
      ctx.fillStyle=b.roofColor;
      ctx.fillRect(b.x,b.y,b.w,b.h);
      const spacing=b.roofType==='thatch'?8:b.roofType==='flatStone'?28:17;
      ctx.strokeStyle='rgba(0,0,0,.32)';
      ctx.beginPath();
      for(let y=b.y+spacing;y<b.y+b.h;y+=spacing){ctx.moveTo(b.x,y);ctx.lineTo(b.x+b.w,y);}
      ctx.stroke();
    }
    traceBuilding(b);
    ctx.lineWidth=5;
    ctx.strokeStyle='#1e2430';
    ctx.stroke();
    ctx.restore();
  }
}
