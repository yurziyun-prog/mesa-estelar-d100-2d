const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

// EXPANSÃO DO MAPA CONFORME CONSTRUÇÃO
const keys = {};
let isDragging = false;
let isPanning = false;
let draggingEntity = null;
let draggingProp = null;
function followCamera(){const e=activeActor();if(!e)return;state.camera.x=canvas.width/2-e.x*state.camera.zoom;state.camera.y=canvas.height/2-e.y*state.camera.zoom;}
let lastMouse = { x: 0, y: 0 };

function screenToWorld(sx, sy) {
  return {
    wx: (sx - state.camera.x) / state.camera.zoom,
    wy: (sy - state.camera.y) / state.camera.zoom
  };
}

function setupInputs() {
  window.addEventListener('keydown', e => {
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
        attemptJump(ent,dx,dy);
      }
      return;
    }
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'r') state.rotation = (state.rotation + 1) % 4;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if(state.mode==='architect'){
        if(deleteArchitectSelection()){e.preventDefault();return;}
      }
      // Del não remove nada nos modos Mestre/Jogador.
    }
    if (e.key.toLowerCase() === 'e' && activeActor()) {
      const ent = activeActor();
      if (ent && ent.sceneId === state.activeSceneId) interactNearby(ent);
    }
  });

  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    lastMouse = { x: sx, y: sy };

    if (e.button === 2) {
      isPanning = true;
      return;
    }

    const { wx, wy } = screenToWorld(sx, sy);

    if (state.mode === 'architect') {
      architectShiftHeld=e.shiftKey;
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
      const movable=floor.props.find(p=>p.type==='log' && Math.hypot(p.x-wx,p.y-wy)<42 && Math.hypot(p.x-ent.x,p.y-ent.y)<100);
      if(movable) {beginEdit();draggingProp={item:movable,ent};return;}
      interactNearby(ent);
    }
  });

  window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isPanning) {
      state.camera.x += sx - lastMouse.x;
      state.camera.y += sy - lastMouse.y;
      lastMouse = { x: sx, y: sy };
      return;
    }

    const { wx, wy } = screenToWorld(sx, sy);
    if (isDragging && state.mode === 'architect') {
      architectShiftHeld=e.shiftKey;
      applyArchitectAction(wx, wy, true);
    } else if (draggingProp && activeActor()) {
      const ent=draggingProp.ent;
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
    if(activeActor())followCamera();else{state.camera.x=sx-wx*next;state.camera.y=sy-wy*next;}
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
        if (canMoveTo(ent.floor, ent.x + vx, ent.y)) ent.x += vx;
        if (canMoveTo(ent.floor, ent.x, ent.y + vy)) ent.y += vy;
        ent.walkingUntil=performance.now()+130;
      }
    }
  }
}

function render() {
  const sc = getScene();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let f = 0; f <= state.currentFloor; f++) {
    const isBelow = f < state.currentFloor;
    const depthDiff = state.currentFloor - f;

    ctx.save();
    ctx.translate(state.camera.x, state.camera.y);
    ctx.scale(state.camera.zoom, state.camera.zoom);

    if (isBelow) {
      const scale = Math.pow(0.97, depthDiff);
      ctx.scale(scale, scale);
    }

    drawFloorLayer(sc, f, isBelow);

    if (isBelow) {
      ctx.fillStyle = `rgba(14, 20, 32, ${Math.min(0.36, depthDiff * 0.2)})`;
      ctx.fillRect(-2000, -2000, 6000, 6000);
    }

    ctx.restore();
  }

  if (previewRect && state.mode === 'architect') {
    ctx.save();
    ctx.translate(state.camera.x, state.camera.y);
    ctx.scale(state.camera.zoom, state.camera.zoom);
    if (previewRect.wallPreview) {
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
  drawArchitectSelectionHUD();
  drawArchitectMapGuides();
}

init();
