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
let draggingEntity = null;
let draggingProp = null;
let cameraFollowsActor = false;
let cameraMapKey = null;

function centerCameraAt(x, y) {
  state.camera.x = canvas.width / 2 - x * state.camera.zoom;
  state.camera.y = canvas.height / 2 - y * state.camera.zoom;
}

function centerMap() {
  const scene = getScene();
  if (!scene) return;
  cameraFollowsActor = false;
  cameraMapKey = JSON.stringify([state.mode, state.activeSceneId, state.currentFloor]);
  const level = floorLevel(scene, state.currentFloor);
  const areas = scene.floors.filter(floor => floor.level <= level).flatMap(floor => [
    ...(floor.baseTerrain && floor.terrainBounds ? [floor.terrainBounds] : []),
    ...floor.areas
  ]);
  if (!areas.length) areas.push(scene.floors[state.currentFloor].bounds);
  const left = Math.min(...areas.map(area => area.x));
  const right = Math.max(...areas.map(area => area.x + area.w));
  const top = Math.min(...areas.map(area => area.y));
  const bottom = Math.max(...areas.map(area => area.y + area.h));
  centerCameraAt((left + right) / 2, (top + bottom) / 2);
}

function followCamera() {
  const key = JSON.stringify([state.mode, state.activeSceneId, state.currentFloor]);
  if (cameraFollowsActor) {
    const actor = activeActor();
    if (actor?.sceneId === state.activeSceneId && actor.floor === state.currentFloor) {
      centerCameraAt(actor.x, actor.y);
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
        if(ent.sleepPose)return;
        let dx=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0);
        let dy=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0);
        if(!dx&&!dy) {dx=ent.facingX||0;dy=ent.facingY||1;}
        if(!tryJumpDownFromUnfinishedFloor(ent,dx,dy))attemptJump(ent,dx,dy);
      }
      return;
    }
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
    if (e.key.toLowerCase() === 'e' && activeActor()) {
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
    const prior=state.camera.zoom, next=Math.max(.45,Math.min(2.2,prior*factor));
    const rect=canvas.getBoundingClientRect(),sx=e.clientX-rect.left,sy=e.clientY-rect.top;
    const wx=(sx-state.camera.x)/prior,wy=(sy-state.camera.y)/prior;
    state.camera.zoom=next;
    if(cameraFollowsActor)followCamera();else{state.camera.x=sx-wx*next;state.camera.y=sy-wy*next;}
  }, { passive: false });
}

// LOOP E RENDERIZAÇÃO
let animTick = 0;

function gameLoop() {
  animTick += 0.03;
  updateSimulation();
  updateSkeletonAutonomy();
  followCamera();
  render();
  requestAnimationFrame(gameLoop);
}

function updateSimulation() {
  state.entities.forEach(ent => {
    if (ent.speechTimer > 0) {
      ent.speechTimer--;
      if (ent.speechTimer <= 0) ent.speech = '';
    }
  });

  if (activeActor()) {
    const ent = activeActor();
    if (ent && ent.sceneId === state.activeSceneId) {
      // 攀爬期间锁定水平输入，动画逐帧运行，完成时才进入相邻楼层。
      if(advanceStairClimb(ent))return;
      let dx = 0, dy = 0;
      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;

      if (dx !== 0 || dy !== 0) {
        if(ent.sleepPose){awakenEntity(ent);return;}
        const len = Math.hypot(dx, dy);
        ent.facingX=dx/len; ent.facingY=dy/len;
        const speed = keys['shift'] ? 6.2 : 3.1;
        const vx = (dx / len) * speed;
        const vy = (dy / len) * speed;
        if(!tryWalkingStair(ent,dx/len,dy/len)){
          const newX=ent.x+vx,newY=ent.y+vy;
          if(!tryFallThroughStairOpening(ent,newX,newY,dx/len,dy/len)){
            if (canMoveTo(ent.floor, ent.x + vx, ent.y)) ent.x += vx;
            if (canMoveTo(ent.floor, ent.x, ent.y + vy)) ent.y += vy;
          }
        }
        ent.walkingUntil=performance.now()+130;
      }
    }
  }
}

function render() {
  const sc = getScene();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Renderizar conforme a altura física, não conforme o índice no array.
  // Isso preserva os níveis antigos e permite subterrâneos anexados ao fim da lista.
  ensureFloorLevels(sc);
  const currentLevel=floorLevel(sc,state.currentFloor);
  const interior=viewerCave(sc.floors[state.currentFloor],state.currentFloor);
  const visible=sc.floors.map((floor,i)=>({i,level:floor.level}))
    .filter(item=>item.level<=currentLevel)
    .sort((a,b)=>a.level-b.level);
  for(const entry of visible){
    const f=entry.i,isBelow=f!==state.currentFloor;
    if(interior&&isBelow)continue;
    const depthDiff=currentLevel-entry.level;
    ctx.save();
    ctx.translate(state.camera.x,state.camera.y);
    ctx.scale(state.camera.zoom,state.camera.zoom);
    // Os pisos inferiores e suas paredes projetadas usam as mesmas coordenadas.
    // A sombra distingue a profundidade sem deslocar as bordas do piso.
    if(interior){cavePath(interior.points,true);ctx.clip();}
    drawFloorLayer(sc,f,isBelow);
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
      drawTexturedArea(previewRect.x, previewRect.y, previewRect.w, previewRect.h, previewRect.mat, null, previewRect.tile);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
    }
    ctx.restore();
  }

  if(!interior)drawExternalBuildingTop();
  const ambientColors = {
    dawn: 'rgba(255, 160, 90, 0.13)',
    day: 'rgba(0, 0, 0, 0)',
    dusk: 'rgba(180, 80, 120, 0.2)',
    night: 'rgba(8, 12, 28, 0.55)'
  };
  if (ambientColors[state.timeOfDay]) {
    ctx.fillStyle = ambientColors[state.timeOfDay];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  renderSceneryLights(sc.floors[state.currentFloor],interior);
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
initTerrainTools();
init();
