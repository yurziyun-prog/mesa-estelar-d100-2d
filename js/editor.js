function openTerrainDialog(creating) {
  const dialog=document.getElementById('terrainDialog');
  const floor=getScene().floors[state.currentFloor];
  const bounds=creating?{w:540,h:400}:floor.terrainBounds||floor.bounds;
  dialog.dataset.creating=String(creating);
  document.getElementById('terrainTitle').textContent=creating?'Configurar novo cenário':'Terreno base';
  document.getElementById('terrainKind').value=creating?'grass':floor.baseTerrain||'';
  document.getElementById('terrainWidth').value=bounds.w/MAP_UNITS_PER_METER;
  document.getElementById('terrainLength').value=bounds.h/MAP_UNITS_PER_METER;
  dialog.showModal();
}

function applyTerrainSettings(event) {
  event.preventDefault();
  const dialog=document.getElementById('terrainDialog');
  const terrain=document.getElementById('terrainKind').value||null;
  const width=Number(document.getElementById('terrainWidth').value)*MAP_UNITS_PER_METER;
  const length=Number(document.getElementById('terrainLength').value)*MAP_UNITS_PER_METER;
  if(state.mode!=='architect'||![width,length].every(n=>n>=32&&n<=8192))return;
  if(dialog.dataset.creating==='true'){
    createNewSceneAsArchitect(terrain,width,length);
  }else{
    const floor=getScene().floors[state.currentFloor];
    const {x,y}=floor.terrainBounds||floor.bounds;
    beginEdit();
    floor.baseTerrain=terrain;
    floor.terrainBounds={x,y,w:width,h:length};
    if(terrain){
      expandFloorToInclude(floor,x,y,0);
      expandFloorToInclude(floor,x+width,y+length,0);
    }
    finishEdit();
  }
  centerMap();
  dialog.close();
}

function expandFloorToInclude(floor, x, y, pad = 120) {
  if (!floor.bounds) floor.bounds = { x: 80, y: 60, w: 680, h: 480 };
  const b = floor.bounds;
  if (x - pad < b.x) {
    const diff = b.x - (x - pad);
    b.x -= diff;
    b.w += diff;
  }
  if (x + pad > b.x + b.w) {
    b.w = (x + pad) - b.x;
  }
  if (y - pad < b.y) {
    const diff = b.y - (y - pad);
    b.y -= diff;
    b.h += diff;
  }
  if (y + pad > b.y + b.h) {
    b.h = (y + pad) - b.y;
  }
}

function expandCurrentMap() {
  const floor = getScene().floors[state.currentFloor];
  if (!floor.bounds) floor.bounds = { x: 80, y: 60, w: 680, h: 480 };
  beginEdit();
  floor.bounds.x -= 90;
  floor.bounds.y -= 70;
  floor.bounds.w += 180;
  floor.bounds.h += 140;
  finishEdit();
  logEvent(`📐 Área do ${state.currentFloor + 1}º andar expandida.`);
}

function selectBuildingKind(){
  selectTool(document.getElementById('buildingKind').value);
}

function selectTool(tool) {
  state.tool = tool;
  document.getElementById('reliefOptions').classList.toggle('hidden',tool!=='relief');
  document.getElementById('buildingKindOptions').classList.toggle('hidden',!['building','caveRoom'].includes(tool));
  if(['building','caveRoom'].includes(tool))document.getElementById('buildingKind').value=tool;
  document.getElementById('caveOptions').classList.toggle('hidden',tool!=='caveRoom');
  document.getElementById('buildingOptions').classList.toggle('hidden',tool!=='building');
  if(tool!=='move'&&typeof architectSelections!=='undefined')architectSelections=[];
  if(typeof refreshArchitectProperties==='function')refreshArchitectProperties();
  document.querySelectorAll('#architectTools [data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool||(tool==='caveRoom'&&b.dataset.tool==='building')));
}

function openCategoryMenu(cat) { openArchitectLibrary(cat === 'trees' ? 'nature' : cat); }

function selectMaterial(mat) {
  state.material = mat;
  selectTool('floor');
  document.querySelectorAll('[data-mat]').forEach(b => b.classList.toggle('active', b.dataset.mat === mat));
}

function selectProp(prop) {
  state.propType = prop;
  selectTool('prop');
  document.querySelectorAll('[data-prop]').forEach(b => b.classList.toggle('active', b.dataset.prop === prop));
}

function changeFloor(delta) {
 const scene=getScene(),level=floorLevel(scene,state.currentFloor);
 const next=floorIndexForLevel(scene,level+delta,state.mode==='architect');
 if(next<0)return;
 state.currentFloor=next;state.selectedWallIdx=null;updateSelectedWallBar();updateFloorLabel();
}
function updateFloorLabel(){
 const label=document.getElementById('floorLabel');
 if(label){
  const scene=getScene(),floor=scene.floors[state.currentFloor];
  const roof=Boolean(floor?.areas?.some(a=>isRoofMaterial(a.mat)));
  const level=floorLevel(scene,state.currentFloor);
  label.textContent=floorName(level)+(roof?' · Cobertura':'');
  label.title=(level*LEVEL_METRES)+' m';
 }
}

// ALINHAMENTO E RECORTE DE PAREDE PARA PORTA / JANELA
function snapCoord(v, step = 16) {
  return Math.round(v / step) * step;
}

function makeOrthoSegment(x1, y1, x2, y2) {
  const sx1 = snapCoord(x1), sy1 = snapCoord(y1);
  const sx2 = snapCoord(x2), sy2 = snapCoord(y2);
  if (Math.abs(sx2 - sx1) >= Math.abs(sy2 - sy1)) {
    return { x1: sx1, y1: sy1, x2: sx2, y2: sy1 };
  }
  return { x1: sx1, y1: sy1, x2: sx1, y2: sy2 };
}

function carveOpeningOnWalls(floor, ox, oy, gapHalf = 34) {
  const nextWalls = [];
  let orient = 'h';

  floor.walls.forEach(w => {
    const isHoriz = Math.abs(w.y1 - w.y2) < 2;
    const isVert = Math.abs(w.x1 - w.x2) < 2;

    if (isHoriz && Math.abs(oy - w.y1) < 18) {
      const minX = Math.min(w.x1, w.x2), maxX = Math.max(w.x1, w.x2);
      if (ox > minX + 12 && ox < maxX - 12) {
        orient = 'h';
        oy = w.y1;
        ox = Math.max(minX + gapHalf + 8, Math.min(maxX - gapHalf - 8, ox));
        if (ox - gapHalf > minX) nextWalls.push({ ...w, x1: minX, y1: w.y1, x2: ox - gapHalf, y2: w.y1 });
        if (ox + gapHalf < maxX) nextWalls.push({ ...w, x1: ox + gapHalf, y1: w.y1, x2: maxX, y2: w.y1 });
        return;
      }
    }

    if (isVert && Math.abs(ox - w.x1) < 18) {
      const minY = Math.min(w.y1, w.y2), maxY = Math.max(w.y1, w.y2);
      if (oy > minY + 12 && oy < maxY - 12) {
        orient = 'v';
        ox = w.x1;
        oy = Math.max(minY + gapHalf + 8, Math.min(maxY - gapHalf - 8, oy));
        if (oy - gapHalf > minY) nextWalls.push({ ...w, x1: w.x1, y1: minY, x2: w.x1, y2: oy - gapHalf });
        if (oy + gapHalf < maxY) nextWalls.push({ ...w, x1: w.x1, y1: oy + gapHalf, x2: w.x1, y2: maxY });
        return;
      }
    }

    nextWalls.push(w);
  });

  floor.walls = nextWalls;
  return { x: ox, y: oy, orient };
}

function updateSelectedWallBar() {
  const bar = document.getElementById('selectedWallBar');
  const floor = getScene().floors[state.currentFloor];
  const valid = state.selectedWallIdx !== null && floor && floor.walls[state.selectedWallIdx];
  bar.classList.toggle('hidden', !valid);
}

function alignSelectedWall(mode) {
  const floor = getScene().floors[state.currentFloor];
  const w = floor?.walls[state.selectedWallIdx];
  if (!w) return;

  beginEdit();
  if (mode === 'ortho') {
    const seg = makeOrthoSegment(w.x1, w.y1, w.x2, w.y2);
    Object.assign(w, seg);
    logEvent('📐 Parede alinhada em 90°.');
  } else if (mode === 'snap') {
    const seg = makeOrthoSegment(w.x1, w.y1, w.x2, w.y2);
    Object.assign(w, seg);
    floor.walls.forEach((other, idx) => {
      if (idx === state.selectedWallIdx) return;
      if (Math.hypot(w.x1 - other.x1, w.y1 - other.y1) < 28) { w.x1 = other.x1; w.y1 = other.y1; }
      if (Math.hypot(w.x1 - other.x2, w.y1 - other.y2) < 28) { w.x1 = other.x2; w.y1 = other.y2; }
      if (Math.hypot(w.x2 - other.x1, w.y2 - other.y1) < 28) { w.x2 = other.x1; w.y2 = other.y1; }
      if (Math.hypot(w.x2 - other.x2, w.y2 - other.y2) < 28) { w.x2 = other.x2; w.y2 = other.y2; }
    });
    logEvent('🧲 Extremidades da parede encaixadas.');
  }
  finishEdit();
}

function deleteSelectedWall() {
  const floor = getScene().floors[state.currentFloor];
  if (state.selectedWallIdx !== null && floor?.walls[state.selectedWallIdx]) {
    beginEdit();
    floor.walls.splice(state.selectedWallIdx, 1);
    state.selectedWallIdx = null;
    updateSelectedWallBar();
    finishEdit();
    logEvent('🗑️ Parede removida.');
  }
}

// CONSTRUÇÃO (ARQUITETO)
let dragStart = null;
let previewRect = null;
let selectedMapObject = null;
let draggedObj = null; // { kind, item, offsetX, offsetY, wallEnd }

function applyArchitectAction(wx, wy, isDrag = false) {
  const floor = getScene().floors[state.currentFloor];
  // Colocar objetos não altera a extensão do terreno-base.

  if(state.tool==='relief'){
    dragStart ||= {x:wx,y:wy};
    previewRect={x:Math.min(wx,dragStart.x),y:Math.min(wy,dragStart.y),w:Math.abs(wx-dragStart.x),h:Math.abs(wy-dragStart.y),mat:'dirt'};
    return;
  }
  if(state.tool==='curvedWall'){
    dragStart ||= {x:wx,y:wy};
    previewRect={curve:curvedWallPoints(dragStart,wx,wy,architectShiftHeld)};
    return;
  }
  if(state.tool==='caveRoom'||state.tool==='caveWall'){applyCaveTool(wx,wy,isDrag);return;}
  if(state.tool==='building'){
    dragStart ||= {x:snapCoord(wx),y:snapCoord(wy)};
    previewRect={building:buildingFromDrag(wx,wy)};
    return;
  }
  if(state.tool==='terrainBrush'){applyTerrainBrush(floor,wx,wy,isDrag);return;}
  if(state.tool==='brush'){
    if(!floor.brushStrokes)floor.brushStrokes=[];
    const brush=state.brush||{shape:'redondo',size:32,texture:'solida',mat:'grass'};
    let stroke=window.activeBrushStroke;
    if(!isDrag || !stroke){
      stroke={mat:brush.mat,shape:brush.shape,size:brush.size,texture:brush.texture,points:[]};
      floor.brushStrokes.push(stroke);window.activeBrushStroke=stroke;
    }
    const last=stroke.points[stroke.points.length-1];
    if(!last||Math.hypot(last.x-wx,last.y-wy)>=Math.max(3,stroke.size/6))stroke.points.push({x:wx,y:wy});
    return;
  }
  if(state.tool==='move'){handleArchitectSelection(wx,wy,isDrag);return;}

  if (state.tool === 'floor' || state.tool === 'roof') {
    if (!dragStart)dragStart={x:architectShiftHeld?wx:snapCoord(wx,32),y:architectShiftHeld?wy:snapCoord(wy,32)};
    const ex=architectShiftHeld?wx:snapCoord(wx,32),ey=architectShiftHeld?wy:snapCoord(wy,32);
    previewRect={
      x:Math.min(dragStart.x,ex),y:Math.min(dragStart.y,ey),
      w:Math.max(architectShiftHeld?1:32,Math.abs(ex-dragStart.x)),
      h:Math.max(architectShiftHeld?1:32,Math.abs(ey-dragStart.y)),
      mat:state.tool==='roof'?(state.roofMaterial||'roof_tile'):state.material,
      tile:state.tool==='roof'?null:structuredClone(state.tileConfig||{})
    };
  } else if (state.tool === 'wall') {
    if (!dragStart) dragStart = { x: snapCoord(wx), y: snapCoord(wy) };
    else if (isDrag) {
      const seg = makeOrthoSegment(dragStart.x, dragStart.y, wx, wy);
      previewRect = { wallPreview: seg };
    }
  } else if (state.tool === 'roofOpening') {
    if(!isDrag)addRoofOpening(wx,wy,state.roofOpeningType||'skylight');
  } else if (state.tool === 'window') {
    if (!isDrag) {
      const width=state.windowWidth||72;
      const carved=architectOpeningPosition(floor,wx,wy,width/2+2);
      if(!carved)return;
      floor.windows.push({...carved,width,
        style:state.buildStyle,material:state.constructionMaterial||'wood'});
      finishEdit();
    }
  } else if (state.tool === 'door') {
    if (!isDrag) {
      const carved = architectOpeningPosition(floor,wx,wy,34);
      if(!carved)return;
      const door={...carved,open:false,keyId:'',
        mechanism:'hinged',hingeSide:'left',swing:'in',lockType:'none',
        material:state.constructionMaterial||'wood',style:state.buildStyle};
      floor.doors.push(door);
      finishEdit();
      openLockDialog(door, 'door');
    }
  } else if (state.tool === 'stairs') {
    if(!isDrag)createArchitectStair(wx,wy);
  } else if (state.tool === 'character') {
    if (!isDrag) placeArchitectCharacter(wx,wy);
  } else if (state.tool === 'prop') {
    if (!isDrag) {
      floor.props.push({ ...newGeologyVariant(floor,state.propType), x: wx, y: wy, type: state.propType, rot: state.rotation, color:state.propColor, style: state.propType.startsWith('kenney_')?'downloads':state.buildStyle,...(isPortableLadder({type:state.propType})?{ladderState:state.propType==='foldingLadder'?'folded':'lying',material:'wood'}:{}) });
      const placed=floor.props.at(-1);
      if(architectShiftHeld&&geologyPropRadius(placed.type)){
        const base=floor.props.slice(0,-1).filter(p=>geologyPropRadius(p.type)&&Math.hypot(p.x-wx,p.y-wy)<20)
          .sort((a,b)=>rockTop(b)-rockTop(a))[0];
        if(base){placed.x=base.x;placed.y=base.y;placed.baseMetres=rockTop(base);}
      }
      selectedMapObject={kind:'props',index:floor.props.length-1};onArchitectSelectionChange();
      if(!isDrag&&(isWritableSign(state.propType)||['hoverLift','vendingFridge'].includes(state.propType))){
        finishEdit();editArchitectObject(selectedMapObject);
      }
    }
  } else if (state.tool === 'chest') {
    if (!isDrag) {
      const loot = document.getElementById('chestLootInput').value.split(',').map(s => s.trim()).filter(Boolean);
      const chest={ x: wx, y: wy, opened: false, keyId:'', loot, material:state.constructionMaterial||'wood', style: state.chestVariant==='chestFuture'?'futurist':state.buildStyle };
      floor.chests.push(chest);
      finishEdit();
      openLockDialog(chest, 'chest');
    }
  } else if (state.tool === 'erase') {
    if(architectShiftHeld&&eraseStructureWall(floor,wx,wy))return;
    if(eraseCave(floor,wx,wy)||eraseBuilding(getScene(),floor,wx,wy))return;
    if(floor.reliefs)floor.reliefs=floor.reliefs.filter(area=>!pointInArchitectArea(area,wx,wy));
    for(const stroke of floor.brushStrokes||[]){
      stroke.points=stroke.points.filter(point=>Math.hypot(point.x-wx,point.y-wy)>Math.max(18,stroke.size/2));
    }
    if(floor.brushStrokes)floor.brushStrokes=floor.brushStrokes.filter(stroke=>stroke.points.length);
    floor.areas = floor.areas.filter(a => !(wx >= a.x && wx <= a.x + a.w && wy >= a.y && wy <= a.y + a.h));
    floor.props = floor.props.filter(p => Math.hypot(p.x - wx, p.y - wy) > 26);
    floor.chests = floor.chests.filter(c => Math.hypot(c.x - wx, c.y - wy) > 26);
    floor.doors = floor.doors.filter(d => Math.hypot(d.x - wx, d.y - wy) > 26);
    floor.windows = floor.windows.filter(w => Math.hypot(w.x - wx, w.y - wy) > 26);
    floor.stairs = floor.stairs.filter(s => Math.hypot(s.x - wx, s.y - wy) > 36);
    floor.walls = floor.walls.filter(w => distToSegment(wx, wy, w.x1, w.y1, w.x2, w.y2) > 16);
  }
}

function finalizeArchitectDrag(wx, wy, shiftHeld = false) {
  if(window.activeBrushStroke?.terrain)delete window.activeBrushStroke.last;
  window.activeBrushStroke=null;
  const floor = getScene().floors[state.currentFloor];

  if(state.tool==='relief'&&dragStart){
    const metres=Math.min(2.9,Math.max(.1,Number(document.getElementById('reliefHeight').value)||1));
    addRelief(floor,dragStart,{x:wx,y:wy},document.getElementById('reliefMode').value,metres);
    dragStart=null;previewRect=null;
    return;
  }
  if(state.tool==='curvedWall'&&dragStart){
    addCurvedWall(floor,curvedWallPoints(dragStart,wx,wy,shiftHeld));
    dragStart=null;previewRect=null;
    return;
  }
  if((state.tool==='caveRoom'||state.tool==='caveWall')&&dragStart){
    finishCaveTool(floor,wx,wy);
    dragStart=null;previewRect=null;
    return;
  }
  if(state.tool==='building'&&dragStart){
    if(Math.hypot(wx-dragStart.x,wy-dragStart.y)>12)placeBuilding(getScene(),state.currentFloor,buildingFromDrag(wx,wy));
    dragStart=null;previewRect=null;
    return;
  }
  if(state.tool==='terrainBrush'){
    if(dragStart&&!dragStart.baseFlow){
      const x=Math.min(dragStart.x,wx),y=Math.min(dragStart.y,wy);
      const w=Math.abs(wx-dragStart.x),h=Math.abs(wy-dragStart.y);
      if(w>0&&h>0){
        floor.areas.push({x,y,w,h,mat:state.brush.mat,flowAngle:Math.atan2(wy-dragStart.y,wx-dragStart.x)});
        expandFloorToInclude(floor,x,y);
        expandFloorToInclude(floor,x+w,y+h);
      }
    }
    dragStart=null;previewRect=null;
    return;
  }
  if(state.tool==='move'){
    finishArchitectSelection(wx,wy);
    dragStart=null;previewRect=null;draggedObj=null;
    return;
  }
  if (draggedObj) {
    if (draggedObj.kind === 'wallEnd' || draggedObj.kind === 'wallMove') {
      const seg = makeOrthoSegment(draggedObj.item.x1, draggedObj.item.y1, draggedObj.item.x2, draggedObj.item.y2);
      Object.assign(draggedObj.item, seg);
    } else if (draggedObj.kind === 'point' && shiftHeld) {
      draggedObj.item.x = snapCoord(draggedObj.item.x);
      draggedObj.item.y = snapCoord(draggedObj.item.y);
    }
    draggedObj = null;
    return;
  }

  if ((state.tool === 'floor'||state.tool==='roof') && dragStart) {
    const ex=shiftHeld?wx:snapCoord(wx,32),ey=shiftHeld?wy:snapCoord(wy,32);
    const x=Math.min(dragStart.x,ex),y=Math.min(dragStart.y,ey);
    const w=Math.max(shiftHeld?1:32,Math.abs(ex-dragStart.x));
    const h=Math.max(shiftHeld?1:32,Math.abs(ey-dragStart.y));
    if(state.tool==='roof'){
      placeArchitectRoof({x,y,w,h});
      dragStart=null;previewRect=null;return;
    }
    floor.areas.push({x,y,w,h,mat:state.material,
       ...(state.material==='checker'?{tile:structuredClone(state.tileConfig||{})}:{}),
       ...(state.material==='carpet'?{color:state.propColor}:{})});
    selectedMapObject = {kind:'areas', index:floor.areas.length - 1};
    if(typeof onArchitectSelectionChange==='function')onArchitectSelectionChange();
  } else if (state.tool === 'wall' && dragStart && Math.hypot(wx - dragStart.x, wy - dragStart.y) > 12) {
    const seg = makeOrthoSegment(dragStart.x, dragStart.y, wx, wy);
    floor.walls.push({...seg, style:state.buildStyle, material:state.wallVariant||'wallMasonry',width:state.wallWidth||16,...(state.wallCustomColor?{color:state.propColor}:{})});
    mergeCollinearWalls(floor);
    selectedMapObject=null;state.selectedWallIdx=null;updateSelectedWallBar();
  }
  dragStart = null;
  previewRect = null;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// COLISÃO E INTERAÇÃO

function copySelectedObject() {
  if (state.mode !== 'architect' || !selectedMapObject) return false;
  const obj = getScene().floors[state.currentFloor]?.[selectedMapObject.kind]?.[selectedMapObject.index];
  if (!obj) return false;
  window.mapClipboard = {kind: selectedMapObject.kind, item: structuredClone(obj)};
  logEvent('📋 Objeto copiado. Ctrl+V para duplicar.');
  return true;
}
function pasteSelectedObject() {
  if (state.mode !== 'architect' || !window.mapClipboard) return;
  const floor = getScene().floors[state.currentFloor];
  const {kind, item} = window.mapClipboard;
  beginEdit();
  const copy = structuredClone(item);
  if (kind === 'walls') {copy.x1 += 32;copy.x2 += 32;copy.y1 += 32;copy.y2 += 32;}
  else {copy.x += 32; copy.y += 32;}
  floor[kind].push(copy);
  selectedMapObject = {kind,index:floor[kind].length - 1};
  if(kind === 'walls') state.selectedWallIdx = selectedMapObject.index;
  updateSelectedWallBar();
  finishEdit();
  // Atualizar a referência permite colar sucessivamente ao lado da cópia anterior.
  window.mapClipboard.item = structuredClone(copy);
  logEvent('📋 Cópia adicionada ao mapa.');
}

let pendingLockItem = null;
let pendingKeyPlacement = null;
function openLockDialog(item,kind){
  pendingLockItem={item,kind,sceneId:state.activeSceneId,floor:state.currentFloor};
  const d=document.getElementById('lockDialog');
  document.getElementById('lockDialogTitle').textContent=kind==='door'?'Configurar porta':'Configurar baú';
  document.getElementById('lockDialogHint').textContent='Chave física ou código, independentemente do estilo arquitetônico.';
  document.getElementById('lockEnabled').checked=Boolean(item.keyId||item.lockCode);
  document.getElementById('lockValue').value=item.lockCode||item.keyLabel||'';
  const mode=document.getElementById('lockMode');
  if(mode)mode.value=item.lockCode?'code':item.keyId?'key':'none';
  const dest=document.getElementById('lockDestination');
  dest.replaceChildren();
  const option=document.createElement('option');option.value='map';option.textContent='🗺️ Posicionar no mapa';dest.append(option);
  for(const ent of state.entities){
    const opt=document.createElement('option');opt.value=ent.id;opt.textContent='🎒 Inventário: '+ent.name;dest.append(opt);
  }
  updateLockForm();
  if(!d.open)d.showModal();
}
function updateLockForm(){
  const on=document.getElementById('lockEnabled').checked;
  const retro=document.getElementById('lockMode')?.value==='code';
  document.getElementById('lockOptions').classList.toggle('hidden',!on);
  document.getElementById('keyDestinationBox').classList.toggle('hidden',retro);
  document.getElementById('lockCodeLabel').textContent=retro?'Código de acesso':'Nome da chave';
  document.getElementById('lockValue').placeholder=retro?'Ex.: 4821 (opcional)':'Ex.: Chave dourada (opcional)';
}
function saveLockDialog(confirmLock){
  if(!pendingLockItem)return;
  const {item}=pendingLockItem;
  const on=confirmLock&&document.getElementById('lockEnabled').checked;
  const mode=document.getElementById('lockMode')?.value||'none';
  const retro=mode==='code';
  beginEdit();
  const value=document.getElementById('lockValue').value.trim();
  if(!on || mode==='none' || !value){item.keyId='';item.lockType='none';delete item.lockCode;}
  else if(retro){item.lockCode=value;item.keyId='';item.lockType='code';}
  else{
    const key='chave_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
    item.keyId=key;item.keyLabel=value;item.lockType='key';delete item.lockCode;
    const destination=document.getElementById('lockDestination').value;
    const ent=state.entities.find(e=>e.id===destination);
    if(ent){ent.inventory.push(key);updateUI();logEvent('🔑 '+value+' adicionada ao inventário de '+ent.name+'.');}
    else{pendingKeyPlacement={keyId:key,label:value,sceneId:state.activeSceneId,floor:state.currentFloor};logEvent('🔑 Clique no mapa para colocar '+value+'.');}
  }
  document.getElementById('lockDialog').close();
  pendingLockItem=null;
  finishEdit();
  saveBank();
}
function placePendingKey(wx,wy){
  if(!pendingKeyPlacement)return false;
  const pk=pendingKeyPlacement;
  const floor=state.scenes[pk.sceneId]?.floors[pk.floor];if(!floor)return false;
  beginEdit();
  floor.props.push({type:'key',x:wx,y:wy,keyId:pk.keyId,label:pk.label,style:'normal',rot:0});
  pendingKeyPlacement=null;
  finishEdit();
  logEvent('🔑 Chave colocada no mapa.');
  return true;
}

function extendWallUp(wall){
 const scene=getScene(),level=floorLevel(scene,state.currentFloor)+1;
 const existing=floorIndexForLevel(scene,level);
 const samePoint=(x,y,a,b)=>Math.hypot(x-a,y-b)<.75;
 const sameSpan=other=>(
   samePoint(wall.x1,wall.y1,other.x1,other.y1)&&samePoint(wall.x2,wall.y2,other.x2,other.y2)
 )||(
   samePoint(wall.x1,wall.y1,other.x2,other.y2)&&samePoint(wall.x2,wall.y2,other.x1,other.y1)
 );
 if(scene.floors[existing]?.walls.some(sameSpan)){
   logEvent('Já existe uma parede nesse trecho do andar acima.');
   return;
 }
 beginEdit();
 const target=floorIndexForLevel(scene,level,true,{x:(wall.x1+wall.x2)/2,y:(wall.y1+wall.y2)/2});
 const extension={...wall,extendedUp:true};
 delete extension.archGroupId;
 scene.floors[target].walls.push(extension);
 finishEdit();
 logEvent('Parede estendida em 3 m até '+floorName(level)+'.');
}

function mergeCollinearWalls(floor){
 const walls=floor.walls;let changed=true,passes=0;
 while(changed&&passes++<Math.max(2,walls.length*2)){
  changed=false;
  for(let i=0;i<walls.length&&!changed;i++){
   const a=walls[i],ah=Math.abs(a.y1-a.y2)<1,av=Math.abs(a.x1-a.x2)<1;
   for(let j=i+1;j<walls.length;j++){
    const b=walls[j];if((a.style||'normal')!==(b.style||'normal')||(a.material||'wallMasonry')!==(b.material||'wallMasonry')||(a.color||'')!==(b.color||'')||(a.width||16)!==(b.width||16)||(a.archGroupId||'')!==(b.archGroupId||'')||Boolean(a.extendedUp)!==Boolean(b.extendedUp))continue;
    const bh=Math.abs(b.y1-b.y2)<1,bv=Math.abs(b.x1-b.x2)<1;
    if(ah&&bh&&Math.abs(a.y1-b.y1)<1){
     const lo=Math.min(a.x1,a.x2,b.x1,b.x2),hi=Math.max(a.x1,a.x2,b.x1,b.x2);
     if(Math.max(Math.min(a.x1,a.x2),Math.min(b.x1,b.x2))>Math.min(Math.max(a.x1,a.x2),Math.max(b.x1,b.x2))+1)continue;
     a.x1=lo;a.x2=hi;a.y2=a.y1;
    }else if(av&&bv&&Math.abs(a.x1-b.x1)<1){
     const lo=Math.min(a.y1,a.y2,b.y1,b.y2),hi=Math.max(a.y1,a.y2,b.y1,b.y2);
     if(Math.max(Math.min(a.y1,a.y2),Math.min(b.y1,b.y2))>Math.min(Math.max(a.y1,a.y2),Math.max(b.y1,b.y2))+1)continue;
     a.y1=lo;a.y2=hi;a.x2=a.x1;
    }else continue;
    walls.splice(j,1);changed=true;break;
   }
  }
 }
}

function hitArchitectObjectAt(wx,wy){
 const floor=getScene().floors[state.currentFloor];
 for(const kind of ['roofOpenings','props','stairs','chests','doors','windows']){
   const items=floor[kind]||[];
   for(let i=items.length-1;i>=0;i--){
     const item=items[i],radius=kind==='stairs'?50:kind==='props'&&['bed','bedDouble','capsuleBed'].includes(item.type)?50:30;
     if(kind==='windows'){
       const half=(item.width||40)/2;
       if(item.orient==='v'?(Math.abs(wx-item.x)<16&&Math.abs(wy-item.y)<half+8):(Math.abs(wy-item.y)<16&&Math.abs(wx-item.x)<half+8))return {kind,index:i};
     }else if(Math.hypot(item.x-wx,item.y-wy)<=radius)return {kind,index:i};
   }
 }
 for(let i=floor.walls.length-1;i>=0;i--){
   const w=floor.walls[i];
   if(distToSegment(wx,wy,w.x1,w.y1,w.x2,w.y2)<Math.max(12,(w.width||16)/2+6))return {kind:'walls',index:i};
 }
 for(let i=floor.areas.length-1;i>=0;i--){
   const a=floor.areas[i];
   if(wx>=a.x&&wx<=a.x+a.w&&wy>=a.y&&wy<=a.y+a.h)return {kind:'areas',index:i};
 }
 return null;
}
