const canvas = document.getElementById('mapCanvas');
let ctx = canvas.getContext('2d');

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  state.camera.x += (Math.floor(rect.width) - canvas.width) / 2;
  state.camera.y += (Math.floor(rect.height) - canvas.height) / 2;
  canvas.width = rect.width;
  canvas.height = rect.height;
}

// EXPANSÃO DO MAPA CONFORME CONSTRUÇÃO
const keys = {};
let isDragging = false;
let isPanning = false;
let mapPanTool = false;
let draggingEntity = null;
let draggingProp = null;
let cameraFollowsActor = false;
let cameraMapKey = null;
let cameraCentersActor = false;

function centerCameraAt(x, y) {
  state.camera.x = canvas.width / 2 - x * state.camera.zoom;
  state.camera.y = canvas.height / 2 - y * state.camera.zoom;
}

function cameraMapBounds(scene) {
  const level = floorLevel(scene, state.currentFloor);
  const areas = scene.floors.filter(floor => floor.level <= level).flatMap(floor => [
    ...(floor.baseTerrain && floor.terrainBounds ? [floor.terrainBounds] : []),
    ...floor.areas,
    ...(floor.buildings||[]),
    ...(floor.caves||[]).map(caveBounds)
  ]);
  if (!areas.length) areas.push(scene.floors[state.currentFloor].bounds);
  const left = Math.min(...areas.map(area => area.x));
  const right = Math.max(...areas.map(area => area.x + area.w));
  const top = Math.min(...areas.map(area => area.y));
  const bottom = Math.max(...areas.map(area => area.y + area.h));
  return {left,right,top,bottom};
}

function centerMap(fit = false) {
  const scene=getScene();
  if(!scene)return;
  cameraFollowsActor=false;
  cameraCentersActor=false;
  cameraMapKey=JSON.stringify([state.mode,state.activeSceneId,state.currentFloor]);
  const {left,right,top,bottom}=cameraMapBounds(scene);
  if(fit&&canvas.width>64&&canvas.height>64){
    const fitZoom=Math.min((canvas.width-48)/Math.max(1,right-left),
      (canvas.height-48)/Math.max(1,bottom-top));
    state.camera.zoom=Math.min(2.2,fitZoom);
  }
  centerCameraAt((left + right) / 2, (top + bottom) / 2);
}

function recenterView(exact = true) {
  const actor=state.mode==='player'?activeActor():null;
  if(actor&&actor.sceneId===state.activeSceneId&&actor.floor===state.currentFloor){
    cameraFollowsActor=true;
    cameraCentersActor=exact;
    followCamera();
  }else centerMap();
}

function setMapPanTool(enabled) {
  mapPanTool=enabled;
  const button=document.getElementById('mapPanButton');
  button.classList.toggle('active',enabled);
  button.setAttribute('aria-pressed',String(enabled));
}

function boundedCameraOffset(offset,start,end,viewport) {
  const padding=24;
  if(end-start<=viewport-padding*2)return (viewport-start-end)/2;
  return Math.max(viewport-padding-end,Math.min(padding-start,offset));
}

function followCamera() {
  const key = JSON.stringify([state.mode, state.activeSceneId, state.currentFloor]);
  if (cameraFollowsActor) {
    const actor = activeActor();
    if (actor?.sceneId === state.activeSceneId && actor.floor === state.currentFloor) {
      centerCameraAt(actor.x, actor.y);
      if(state.mode==='player'&&!cameraCentersActor){
        const {left,right,top,bottom}=cameraMapBounds(getScene());
        const zoom=state.camera.zoom;
        // Keep a small map centered. Pan a large map only within its edges.
        state.camera.x=boundedCameraOffset(state.camera.x,left*zoom,right*zoom,canvas.width);
        state.camera.y=boundedCameraOffset(state.camera.y,top*zoom,bottom*zoom,canvas.height);
      }
      cameraMapKey = key;
      return;
    }
  }
  if (key !== cameraMapKey) centerMap();
}
let lastMouse = { x: 0, y: 0 };

function screenToWorld(sx, sy) {
  return {
    wx: (sx - state.camera.x) / state.camera.zoom,
    wy: (sy - state.camera.y) / state.camera.zoom
  };
}

function setupInputs() {
  window.addEventListener('keydown', e => {
    if(e.key==='Escape'&&document.getElementById('architectContextMenu')){closeArchitectContextMenu();return;}
    if(e.key==='Escape'&&typeof architectEyedropper!=='undefined'&&architectEyedropper){architectEyedropper=false;document.getElementById('architectLibrarySelected').textContent='Conta-gotas cancelado.';return;}
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
    if(state.mode==='gm'&&!e.ctrlKey&&!e.metaKey){
      if(e.key==='Tab'){e.preventDefault();if(!e.repeat)gmCycle();return;}
      if(e.key==='Enter'){e.preventDefault();gmConfirm();return;}
      if(e.key==='Escape'){e.preventDefault();gmRelease();return;}
    }
    if (e.ctrlKey || e.metaKey) {
      const k=e.key.toLowerCase();
      if(['z','y','c','v','s'].includes(k)) e.preventDefault();
      if(k==='z') { e.shiftKey ? redoEdit() : undoEdit(); return; }
      if(k==='y') { redoEdit(); return; }
      if(k==='c') { copySelectedObject(); return; }
      if(k==='v') { pasteSelectedObject(); return; }
      if(k==='s') { saveCurrentSceneToBank(); return; }
    }
    if(e.key === ' ' && activeActor()) {
      e.preventDefault();
      const ent=activeActor();
      if(ent && ent.sceneId===state.activeSceneId) {
        if(ent.sleepPose||liftRides.has(ent))return;
        let dx=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0);
        let dy=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0);
        if(!dx&&!dy) {dx=ent.facingX||0;dy=ent.facingY||1;}
        if(!attemptJump(ent,dx,dy))tryJumpDownFromUnfinishedFloor(ent,dx,dy);
      }
      return;
    }
    if(e.key.startsWith('Arrow'))e.preventDefault();
    keys[e.key.toLowerCase()] = true;
    if(e.key.toLowerCase()==='r'&&!e.repeat&&!rotateArchitectSelection())state.rotation=(state.rotation+1)%4;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if(state.mode==='architect'){
        if(deleteArchitectSelection()){e.preventDefault();return;}
      }else if(state.mode==='gm'){
        if(gmRemoveEntityFromScene()){e.preventDefault();return;}
      }
      // O modo Jogador nunca exclui personagens.
    }
    if (e.key.toLowerCase() === 'e' && !e.repeat && activeActor()) {
      const ent = activeActor();
      if (ent && ent.sceneId === state.activeSceneId) interactNearby(ent);
    }
  });

  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  canvas.addEventListener('mouseleave',()=>{buildingPointer=null;});
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('pointerdown',e=>{
    if(!e.target.closest?.('#architectContextMenu'))closeArchitectContextMenu();
  });

  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    lastMouse = { x: sx, y: sy };

    if(e.button===1||(e.button===0&&mapPanTool&&state.mode!=='player')){
      e.preventDefault();
      isPanning=true;
      return;
    }
    if (e.button === 2) {
      if(state.mode==='architect'&&openArchitectContextMenu(sx,sy,e.clientX,e.clientY)){
        isPanning=false;return;
      }
      isPanning=true;return;
    }

    const { wx, wy } = screenToWorld(sx, sy);

    if (state.mode === 'architect') {
      architectShiftHeld=e.shiftKey;
      architectCtrlHeld=e.ctrlKey||e.metaKey;
      if(typeof sampleArchitectColorAt==='function'&&sampleArchitectColorAt(wx,wy))return;
      if(placePendingKey(wx,wy)) return;
      beginEdit();
      isDragging = true;
      dragStart = null;
      applyArchitectAction(wx, wy, false);
    } else if (state.mode === 'gm') {
      if ((gmPlacementTemplate || gmRosterPlacementIds?.length) && placeGmEntityAt(wx,wy)) return;
      const clicked = state.entities.find(ent =>
        ent.sceneId === state.activeSceneId && ent.floor === state.currentFloor && Math.hypot(ent.x - wx, ent.y - wy) < 28
      );
      if (clicked) {
        gmPreviewId = clicked.id;
        refreshGmFocus();
        beginEdit();draggingEntity = clicked;
      }
    } else if (activeActor()) {
      const ent = activeActor();
      if (!ent || ent.sceneId !== state.activeSceneId) return;
      const floor=getScene().floors[ent.floor];
      if(worldAction){
        if(ent.sleepPose||liftRides.has(ent))return;
        if(worldAction==='dig'||worldAction==='trim')digGround(ent,floor,wx,wy);
        else inspectOrDamage(ent,floor,wx,wy);
        return;
      }
      const movable=floor.props.find(p=>(p.type==='log'||isPortableLadder(p)) && Math.hypot(p.x-wx,p.y-wy)<42 && Math.hypot(p.x-ent.x,p.y-ent.y)<110);
      if(movable) {beginEdit();draggingProp={item:movable,ent};return;}
      interactNearby(ent);
    }
  });

  window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isPanning) {
      cameraFollowsActor = false;
      state.camera.x += sx - lastMouse.x;
      state.camera.y += sy - lastMouse.y;
      lastMouse = { x: sx, y: sy };
      return;
    }

    const { wx, wy } = screenToWorld(sx, sy);
    buildingPointer={x:wx,y:wy};
    if (isDragging && state.mode === 'architect') {
      architectShiftHeld=e.shiftKey;
      architectCtrlHeld=e.ctrlKey||e.metaKey;
      applyArchitectAction(wx, wy, true);
    } else if (draggingProp && activeActor()) {
      const ent=draggingProp.ent;
      if(isPortableLadder(draggingProp.item)&&uprightPortableLadder(draggingProp.item))return;
      const dx=wx-ent.x,dy=wy-ent.y,dist=Math.hypot(dx,dy);
      const factor=dist>105?105/dist:1;
      draggingProp.item.x=ent.x+dx*factor;
      draggingProp.item.y=ent.y+dy*factor;
    } else if (draggingEntity && state.mode === 'gm') {
      draggingEntity.x = wx;
      draggingEntity.y = wy;
    }
    lastMouse = { x: sx, y: sy };
  });

  window.addEventListener('mouseup', e => {
    const rect = canvas.getBoundingClientRect();
    const { wx, wy } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    if (isDragging && state.mode === 'architect') {
      architectShiftHeld=e.shiftKey;
      architectCtrlHeld=e.ctrlKey||e.metaKey;
      finalizeArchitectDrag(wx, wy, e.shiftKey);
    }
    finishEdit();
    isDragging = false;
    isPanning = false;
    draggingEntity = null;
    draggingProp = null;
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const prior=state.camera.zoom, next=Math.max(Math.min(.45,prior),Math.min(2.2,prior*factor));
    const rect=canvas.getBoundingClientRect(),sx=e.clientX-rect.left,sy=e.clientY-rect.top;
    const wx=(sx-state.camera.x)/prior,wy=(sy-state.camera.y)/prior;
    state.camera.zoom=next;
    if(cameraFollowsActor)followCamera();else{state.camera.x=sx-wx*next;state.camera.y=sy-wy*next;}
  }, { passive: false });
}

// LOOP E RENDERIZAÇÃO
let animTick = 0;
let lastFrameTime = null;
const WALK_SPEED = 3 * MAP_UNITS_PER_METER;
const HIGH_GRASS_SPEED_FACTOR = .6;
const SPRINT_SPEED = 224;
const MAX_MOVEMENT_STEP = 4;

function gameLoop(now) {
  const elapsed = lastFrameTime===null ? 1/60 : Math.min(.15,(now-lastFrameTime)/1000);
  lastFrameTime = now;
  animTick += 0.03;
  advanceMapDaylight(elapsed);
  updateSimulation(elapsed);
  updateSkeletonAutonomy();
  followCamera();
  render();
  requestAnimationFrame(gameLoop);
}

function updateSimulation(elapsed) {
  state.entities.forEach(ent => {
    if (ent.speechTimer > 0) {
      ent.speechTimer--;
      if (ent.speechTimer <= 0) ent.speech = '';
    }
  });

  const ent = activeActor();
  if(!ent&&state.mode!=='player'){
    const dx=Number(Boolean(keys.d||keys.arrowright))-Number(Boolean(keys.a||keys.arrowleft));
    const dy=Number(Boolean(keys.s||keys.arrowdown))-Number(Boolean(keys.w||keys.arrowup));
    const length=Math.hypot(dx,dy);
    if(length&&!isPanning){
      state.camera.x-=dx/length*elapsed*420;
      state.camera.y-=dy/length*elapsed*420;
    }
  }
  if (ent) {
    if (ent.sceneId === state.activeSceneId) {
      // 攀爬期间锁定水平输入，动画逐帧运行，完成时才进入相邻楼层。
      if(advanceStairClimb(ent))return;
      if(trackHoverLift(ent))return;
      let dx = 0, dy = 0;
      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;

      if (dx !== 0 || dy !== 0) {
        if(ent.sleepPose){awakenEntity(ent);return;}
        const len = Math.hypot(dx, dy);
        ent.facingX=dx/len; ent.facingY=dy/len;
        if(state.mode==='player'&&!isPanning)cameraFollowsActor=true;
        const floor=getScene().floors[ent.floor];
        const grass=highGrassAt(floor,ent.x,ent.y);
        const depth=waterDepthAt(floor,ent.x,ent.y);
        const travelSpeed=depth?WALK_SPEED*(depth==='shallow'?.62:.48):(keys['shift']?SPRINT_SPEED:WALK_SPEED);
        const distance = travelSpeed*elapsed*(grass&&!depth?HIGH_GRASS_SPEED_FACTOR:1);
        const steps = Math.max(1, Math.ceil(distance / MAX_MOVEMENT_STEP));
        const vx = ent.facingX * distance / steps;
        const vy = ent.facingY * distance / steps;
        for(let step=0;step<steps;step++){
          if(tryWalkingStair(ent,ent.facingX,ent.facingY))break;
          if(vx&&canWalkStep(ent,ent.x+vx,ent.y))ent.x+=vx;
          if(vy&&canWalkStep(ent,ent.x,ent.y+vy))ent.y+=vy;
        }
        ent.walkingUntil=performance.now()+130;
      }
    }
  }
}

let roofViewFloors=null;

function render() {
  const sc = getScene();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Renderizar conforme a altura física, não conforme o índice no array.
  // Isso preserva os níveis antigos e permite subterrâneos anexados ao fim da lista.
  ensureStructureStoreys(sc);
  renderedRoofCovers.length=0;
  visibleChimneys=findChimneys(sc);
  chimneyScene=sc;
  const currentLevel=floorLevel(sc,state.currentFloor);
  const interior=viewerCave(sc.floors[state.currentFloor],state.currentFloor);
  const visible=sc.floors.map((floor,i)=>({i,level:floor.level}))
    .filter(item=>item.level<=currentLevel)
    .sort((a,b)=>a.level-b.level);
  // All world roof draws share this guard, including terrain and projected storeys.
  roofViewFloors=state.mode==='architect'?null:visible
    .filter(entry=>entry.level>=currentLevel-1)
    .map(entry=>sc.floors[entry.i]);
  try {
    renderMapSurfaces(sc,visible,currentLevel,interior);
  } finally {
    roofViewFloors=null;
  }
  drawMapOverlays(sc,interior);
}

function renderMapSurfaces(sc,visible,currentLevel,interior){
  for(const entry of visible){
    const f=entry.i,isBelow=f!==state.currentFloor;
    if(interior&&isBelow)continue;
    const depthDiff=currentLevel-entry.level;
    ctx.save();
    ctx.translate(state.camera.x,state.camera.y);
    ctx.scale(state.camera.zoom,state.camera.zoom);
    // Os pisos inferiores e suas paredes projetadas usam as mesmas coordenadas.
    // A sombra distingue a profundidade sem deslocar as bordas do piso.
    if(interior)clipCaveInterior(sc.floors[f],interior);
    if(isBelow)clipLowerFloorUnderSlabs(sc,f);
    drawFloorLayer(sc,f,isBelow,interior);
    if(isBelow){
      ctx.fillStyle='rgba(14,20,32,'+Math.min(.36,depthDiff*.2)+')';
      ctx.fillRect(-2000,-2000,6000,6000);
    }
    ctx.restore();
  }

  if (previewRect && state.mode === 'architect') {
    ctx.save();
    ctx.translate(state.camera.x, state.camera.y);
    ctx.scale(state.camera.zoom, state.camera.zoom);
    if(previewRect.curve){
      ctx.lineWidth=state.wallWidth||16;ctx.strokeStyle='#f5c373';ctx.lineCap='round';
      cavePath(previewRect.curve);ctx.stroke();
    }else if(previewRect.caveBrush){
      drawCaveBrushPreview(previewRect.caveBrush);
    }else if(previewRect.cave){
      ctx.globalAlpha=.64;drawCaveBase(previewRect.cave);
    }else if(previewRect.caveWall){
      ctx.strokeStyle=getTerrainPattern(ctx,'caveStone');ctx.lineWidth=state.wallWidth||16;
      ctx.lineCap='round';ctx.lineJoin='round';cavePath(previewRect.caveWall);ctx.stroke();
    }else if(previewRect.building){
      ctx.globalAlpha=.55;
      drawBuildingBase(previewRect.building,null,true);
    } else if (previewRect.wallPreview) {
      ctx.strokeStyle = '#f5b942';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(previewRect.wallPreview.x1, previewRect.wallPreview.y1);
      ctx.lineTo(previewRect.wallPreview.x2, previewRect.wallPreview.y2);
      ctx.stroke();
    } else {
      ctx.globalAlpha = 0.6;
      drawTexturedArea(previewRect.x, previewRect.y, previewRect.w, previewRect.h, previewRect.mat, null, previewRect.tile,null,null,0,previewRect.water);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
    }
    ctx.restore();
  }

  if(!interior)drawExternalBuildingTop();
}

function drawMapOverlays(sc,interior){
  const lighting=daylightLighting();
  if(lighting.warm){
    ctx.fillStyle=lighting.evening?`rgba(212,132,125,${lighting.warm})`:`rgba(250,166,93,${lighting.warm})`;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  if(lighting.dark){
    ctx.fillStyle=`rgba(8,15,35,${lighting.dark})`;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  renderSceneryLights(sc.floors[state.currentFloor],interior);
  drawIndoorSightMask(sc.floors[state.currentFloor],interior);
  drawArchitectSelectionHUD();
  drawArchitectMapGuides();
  const actor=activeActor();
  if(actor?.stairTransitionAt){
    const elapsed=performance.now()-actor.stairTransitionAt;
    if(elapsed<420){
      ctx.fillStyle='rgba(11,17,26,'+(0.66*(1-elapsed/420))+')';
      ctx.fillRect(0,0,canvas.width,canvas.height);
    }else delete actor.stairTransitionAt;
  }
}

initVisualCatalog();
initMesaImports();
initTerrainFinishes();
initPlantCatalog();
initGeologyCatalog();
initSceneryCatalog();
initVerticalWorld();
initTerrainTools();
init();
