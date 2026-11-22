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
  // Congela o terreno pintado antes de ampliar a área de trabalho.
  if (floor.baseTerrain) {
    floor.areas.unshift({x:floor.bounds.x,y:floor.bounds.y,w:floor.bounds.w,h:floor.bounds.h,mat:floor.baseTerrain});
    floor.baseTerrain = null;
  }
  floor.bounds.x -= 90;
  floor.bounds.y -= 70;
  floor.bounds.w += 180;
  floor.bounds.h += 140;
  finishEdit();
  logEvent(`📐 Área do ${state.currentFloor + 1}º andar expandida.`);
}

function selectTool(tool) {
  state.tool = tool;
  document.querySelectorAll('#architectTools [data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
}

function openCategoryMenu(cat) {
  if (cat === 'furniture') {
    document.getElementById('furnitureOptions').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    selectProp('table');
  } else {
    document.getElementById('treeOptions').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    selectProp('tree');
  }
}

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
  const sc = getScene();
  const next = state.currentFloor + delta;
  if (next < 0) return;
  while (sc.floors.length <= next) sc.floors.push(createEmptyFloor(null));
  state.currentFloor = next;
  state.selectedWallIdx = null;
  updateSelectedWallBar();
  updateFloorLabel();
}

function updateFloorLabel() {
  document.getElementById('floorLabel').textContent = state.currentFloor === 0 ? '1º (Térreo)' : `${state.currentFloor + 1}º Andar`;
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
        if (ox - gapHalf > minX) nextWalls.push({ x1: minX, y1: w.y1, x2: ox - gapHalf, y2: w.y1 });
        if (ox + gapHalf < maxX) nextWalls.push({ x1: ox + gapHalf, y1: w.y1, x2: maxX, y2: w.y1 });
        return;
      }
    }

    if (isVert && Math.abs(ox - w.x1) < 18) {
      const minY = Math.min(w.y1, w.y2), maxY = Math.max(w.y1, w.y2);
      if (oy > minY + 12 && oy < maxY - 12) {
        orient = 'v';
        ox = w.x1;
        oy = Math.max(minY + gapHalf + 8, Math.min(maxY - gapHalf - 8, oy));
        if (oy - gapHalf > minY) nextWalls.push({ x1: w.x1, y1: minY, x2: w.x1, y2: oy - gapHalf });
        if (oy + gapHalf < maxY) nextWalls.push({ x1: w.x1, y1: oy + gapHalf, x2: w.x1, y2: maxY });
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

  if (state.tool === 'move') {
    if (!isDrag) {
      selectedMapObject = null;
      // Verifica parede primeiro (extremidade ou corpo)
      for (let i = 0; i < floor.walls.length; i++) {
        const w = floor.walls[i];
        if (Math.hypot(wx - w.x1, wy - w.y1) < 16) {
          state.selectedWallIdx = i;
          selectedMapObject = { kind: 'walls', index: i };
          updateSelectedWallBar();
          draggedObj = { kind: 'wallEnd', item: w, end: 1 };
          return;
        }
        if (Math.hypot(wx - w.x2, wy - w.y2) < 16) {
          state.selectedWallIdx = i;
          updateSelectedWallBar();
          selectedMapObject = { kind: 'walls', index: i };
          draggedObj = { kind: 'wallEnd', item: w, end: 2 };
          return;
        }
        if (distToSegment(wx, wy, w.x1, w.y1, w.x2, w.y2) < 12) {
          state.selectedWallIdx = i;
          updateSelectedWallBar();
          selectedMapObject = { kind: 'walls', index: i };
          draggedObj = { kind: 'wallMove', item: w, lastX: wx, lastY: wy };
          return;
        }
      }

      // Verifica props, portas, janelas, baús, escadas
      const lists = [
        { kind: 'props', arr: floor.props },
        { kind: 'doors', arr: floor.doors },
        { kind: 'windows', arr: floor.windows },
        { kind: 'chests', arr: floor.chests },
        { kind: 'stairs', arr: floor.stairs }
      ];
      for (const entry of lists) {
        const found = entry.arr.find(it => Math.hypot(it.x - wx, it.y - wy) < 28);
        if (found) {
          selectedMapObject = { kind: entry.kind, index: entry.arr.indexOf(found) };
          draggedObj = { kind: 'point', item: found };
          return;
        }
      }
      const idx = [...floor.areas].map((a, i) => ({a, i})).reverse().find(({a}) => wx >= a.x && wx <= a.x + a.w && wy >= a.y && wy <= a.y + a.h)?.i;
      if (idx !== undefined) selectedMapObject = {kind:'areas',index:idx};
      state.selectedWallIdx = null;
      updateSelectedWallBar();
    } else if (draggedObj) {
      if (draggedObj.kind === 'point') {
        draggedObj.item.x = wx;
        draggedObj.item.y = wy;
      } else if (draggedObj.kind === 'wallEnd') {
        if (draggedObj.end === 1) { draggedObj.item.x1 = wx; draggedObj.item.y1 = wy; }
        else { draggedObj.item.x2 = wx; draggedObj.item.y2 = wy; }
      } else if (draggedObj.kind === 'wallMove') {
        const dx = wx - draggedObj.lastX;
        const dy = wy - draggedObj.lastY;
        draggedObj.item.x1 += dx; draggedObj.item.y1 += dy;
        draggedObj.item.x2 += dx; draggedObj.item.y2 += dy;
        draggedObj.lastX = wx; draggedObj.lastY = wy;
      }
    }
    return;
  }

  if (state.tool === 'floor') {
    if (!dragStart) dragStart = { x: snapCoord(wx), y: snapCoord(wy) };
    const ex = snapCoord(wx), ey = snapCoord(wy);
    previewRect = {
      x: Math.min(dragStart.x, ex),
      y: Math.min(dragStart.y, ey),
      w: Math.max(32, Math.abs(ex - dragStart.x)),
      h: Math.max(32, Math.abs(ey - dragStart.y)),
      mat: state.material
    };
  } else if (state.tool === 'wall') {
    if (!dragStart) dragStart = { x: snapCoord(wx), y: snapCoord(wy) };
    else if (isDrag) {
      const seg = makeOrthoSegment(dragStart.x, dragStart.y, wx, wy);
      previewRect = { wallPreview: seg };
    }
  } else if (state.tool === 'window') {
    if (!isDrag) {
      const carved = carveOpeningOnWalls(floor, wx, wy, 22);
      floor.windows.push({ x: carved.x, y: carved.y, orient: carved.orient });
    }
  } else if (state.tool === 'door') {
    if (!isDrag) {
      const carved = carveOpeningOnWalls(floor, wx, wy, 34);
      const keyId = document.getElementById('lockKeyInput').value.trim();
      floor.doors.push({ x: carved.x, y: carved.y, open: false, keyId, orient: carved.orient });
    }
  } else if (state.tool === 'stairs') {
    if (!isDrag) {
      floor.stairs.push({ x: wx, y: wy, dir: 'up', label: `→ ${state.currentFloor + 2}º` });
      const upperIdx = state.currentFloor + 1;
      while (getScene().floors.length <= upperIdx) getScene().floors.push(createEmptyFloor(null));
      const upper = getScene().floors[upperIdx];
      upper.stairs.push({ x: wx, y: wy, dir: 'down', label: `→ ${state.currentFloor + 1}º` });
      upper.openings.push({ x: wx - 36, y: wy - 52, w: 72, h: 104 });
    }
  } else if (state.tool === 'prop') {
    if (!isDrag) floor.props.push({ x: wx, y: wy, type: state.propType, rot: state.rotation });
  } else if (state.tool === 'chest') {
    if (!isDrag) {
      const keyId = document.getElementById('lockKeyInput').value.trim();
      const loot = document.getElementById('chestLootInput').value.split(',').map(s => s.trim()).filter(Boolean);
      floor.chests.push({ x: wx, y: wy, opened: false, keyId, loot });
    }
  } else if (state.tool === 'erase') {
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
  const floor = getScene().floors[state.currentFloor];

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

  if (state.tool === 'floor' && dragStart) {
    const ex = snapCoord(wx), ey = snapCoord(wy);
    const x = Math.min(dragStart.x, ex);
    const y = Math.min(dragStart.y, ey);
    const w = Math.max(32, Math.abs(ex - dragStart.x));
    const h = Math.max(32, Math.abs(ey - dragStart.y));
    floor.areas.push({ x, y, w, h, mat: state.material });
    selectedMapObject = {kind:'areas', index:floor.areas.length - 1};
  } else if (state.tool === 'wall' && dragStart && Math.hypot(wx - dragStart.x, wy - dragStart.y) > 12) {
    const seg = makeOrthoSegment(dragStart.x, dragStart.y, wx, wy);
    floor.walls.push(seg);
    selectedMapObject = {kind:'walls', index:floor.walls.length - 1};
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
