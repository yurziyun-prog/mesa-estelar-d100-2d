function createEmptyFloor(baseTerrain = null) {
  return {
    baseTerrain,
    terrainBounds: { x: 80, y: 60, w: 680, h: 480 },
    bounds: { x: 80, y: 60, w: 680, h: 480 }, // Mapa inicial compacto e expansível
    areas: [],
    walls: [],
    doors: [],
    windows: [],
    stairs: [],
    props: [],
    chests: [],
    openings: []
  };
}

// CASA 100% RETANGULAR E ALINHADA (SEM INCLINAÇÃO)
function buildHouseScene(name = 'Casa de 2 Andares') {
  const f0 = createEmptyFloor('grass');
  f0.bounds = { x: 70, y: 50, w: 860, h: 640 };
  f0.terrainBounds = {...f0.bounds};

  const f1 = createEmptyFloor(null);
  f1.bounds = { x: 140, y: 150, w: 510, h: 410 };
  f1.terrainBounds = {...f1.bounds};

  // Trilha de terra e rio vertical com ponte alinhada
  f0.areas.push(
    { x: 356, y: 556, w: 68, h: 125, mat: 'dirt' },
    { x: 644, y: 422, w: 120, h: 48, mat: 'dirt' },
    { x: 760, y: 50, w: 112, h: 640, mat: 'water' },
    { x: 754, y: 406, w: 124, h: 80, mat: 'bridge' }
  );

  // Sala de madeira em tábuas + sala lateral quadriculada + tapete
  f0.areas.push(
    { x: 140, y: 160, w: 364, h: 400, mat: 'wood' },
    { x: 504, y: 160, w: 144, h: 400, mat: 'checker' },
    { x: 244, y: 312, w: 176, h: 144, mat: 'carpet' }
  );

  // Paredes ortogonais exatas (90 graus)
  f0.walls.push(
    { x1: 140, y1: 160, x2: 648, y2: 160 },
    { x1: 140, y1: 160, x2: 140, y2: 560 },
    { x1: 648, y1: 160, x2: 648, y2: 560 },
    { x1: 504, y1: 160, x2: 504, y2: 362 },
    { x1: 504, y1: 430, x2: 504, y2: 560 },
    { x1: 140, y1: 560, x2: 356, y2: 560 },
    { x1: 424, y1: 560, x2: 648, y2: 560 }
  );

  f0.doors.push(
    { x: 390, y: 560, open: false, keyId: '', orient: 'h' },
    { x: 504, y: 396, open: false, keyId: 'chave_dourada', orient: 'v' }
  );

  // 2º Andar alinhado sobre a casa
  f1.areas.push({ x: 140, y: 160, w: 508, h: 400, mat: 'wood' });
  f1.walls.push(
    { x1: 140, y1: 160, x2: 648, y2: 160 },
    { x1: 140, y1: 160, x2: 140, y2: 560 },
    { x1: 648, y1: 160, x2: 648, y2: 560 },
    { x1: 140, y1: 560, x2: 648, y2: 560 }
  );
  f1.windows.push({ x: 310, y: 560, orient: 'h' }, { x: 470, y: 560, orient: 'h' }, { x: 648, y: 340, orient: 'v' });

  // Escada bidirecional
  f0.stairs.push({ x: 204, y: 236, dir: 'up', label: '→ 2º' });
  f1.stairs.push({ x: 204, y: 236, dir: 'down', label: '→ 1º' });
  f1.openings.push({ x: 168, y: 184, w: 72, h: 104 });

  // Móveis, árvores variadas e pedras
  f0.props.push(
    { x: 372, y: 202, type: 'hearth', rot: 0 },
    { x: 336, y: 382, type: 'table', rot: 0 },
    { x: 274, y: 384, type: 'chair', rot: 0 },
    { x: 206, y: 508, type: 'barrel', rot: 0 },
    { x: 448, y: 586, type: 'bush', rot: 0 },
    { x: 692, y: 256, type: 'rock', rot: 0 },
    { x: 896, y: 544, type: 'rock', rot: 0 },
    { x: 96, y: 136, type: 'tree', rot: 0 },
    { x: 96, y: 620, type: 'pine', rot: 0 },
    { x: 896, y: 210, type: 'fruitTree', rot: 0 }
  );

  f1.props.push(
    { x: 580, y: 230, type: 'bed', rot: 0 },
    { x: 580, y: 470, type: 'bookshelf', rot: 0 }
  );

  f0.chests.push({ x: 598, y: 396, opened: false, keyId: '', loot: ['Elixir Estelar', '120 Moedas'] });
  f1.chests.push({ x: 585, y: 310, opened: false, keyId: '', loot: ['chave_dourada', 'Diário Antigo'] });

  return { name, style: 'normal', floors: [f0, f1] };
}

function buildDesertRuinsScene(name = 'Ruínas do Deserto') {
  const f0 = createEmptyFloor('sand');
  f0.bounds = { x: 120, y: 120, w: 680, h: 460 };
  f0.terrainBounds = {...f0.bounds};
  const f1 = createEmptyFloor(null);

  f0.areas.push({ x: 260, y: 180, w: 420, h: 320, mat: 'checker' });
  f0.walls.push(
    { x1: 260, y1: 180, x2: 680, y2: 180 },
    { x1: 260, y1: 180, x2: 260, y2: 500 },
    { x1: 680, y1: 180, x2: 680, y2: 500 },
    { x1: 260, y1: 500, x2: 435, y2: 500 },
    { x1: 505, y1: 500, x2: 680, y2: 500 }
  );
  f0.doors.push({ x: 470, y: 500, open: false, keyId: '', orient: 'h' });
  f0.props.push(
    { x: 165, y: 210, type: 'rock', rot: 0 },
    { x: 185, y: 510, type: 'rock', rot: 0 },
    { x: 745, y: 310, type: 'bush', rot: 0 },
    { x: 430, y: 340, type: 'table', rot: 0 }
  );
  f0.chests.push({ x: 590, y: 280, opened: false, keyId: '', loot: ['Relíquia Solar', '80 Moedas'] });

  return { name, style: 'normal', floors: [f0, f1] };
}

function createInitialState() {
  return {
    mode: 'architect',
    currentFloor: 0,
    timeOfDay: 'day',
    tool: 'floor',
    material: 'grass',
    propType: 'tree',
    buildStyle: 'normal',
    rotation: 0,
    selectedEntityId: 'pc_1',
    selectedWallIdx: null,
    camera: { x: 24, y: 12, zoom: 1 },
    activeSceneId: 'scene_1',
    scenes: {
      scene_1: buildHouseScene('Casa de 2 Andares'),
      scene_2: buildDesertRuinsScene('Ruínas do Deserto')
    },
    entities: [
      {
        id: 'pc_1', type: 'pc', name: 'Sir Aldric', role: 'Explorador', icon: '🛡️', color: '#4f8cff',
        sceneId: 'scene_1', floor: 0, x: 372, y: 635, hp: 24, maxHp: 24, hunger: 85, attitude: 'Aliado',
        speech: '', speechTimer: 0,
        attrs: { FOR: 14, DES: 16, CON: 13, INT: 12, SAB: 14, CAR: 11 },
        skills: ['Furtividade +5', 'Percepção +4', 'Arrombamento +4'],
        powers: ['Passo Sombrio', 'Olhar Aguçado'],
        inventory: ['Espada Curta', 'Lanterna de Óleo', 'Ração']
      },
      {
        id: 'pc_2', type: 'pc', name: 'Lyra', role: 'Arcanista', icon: '✨', color: '#3ec483',
        sceneId: 'scene_1', floor: 0, x: 422, y: 635, hp: 18, maxHp: 18, hunger: 90, attitude: 'Aliado',
        speech: '', speechTimer: 0,
        attrs: { FOR: 8, DES: 14, CON: 12, INT: 17, SAB: 15, CAR: 13 },
        skills: ['Arcanismo +6', 'História +5', 'Investigação +5'],
        powers: ['Raio Arcano', 'Detectar Magia'],
        inventory: ['Cajado Arcano', 'Grimório', 'Poção']
      },
      {
        id: 'npc_1', type: 'npc', name: 'Mestre Tobias', role: 'Conselheiro', icon: '🎭', color: '#17a2b8',
        sceneId: 'scene_1', floor: 0, x: 244, y: 376, hp: 22, maxHp: 22, hunger: 75, attitude: 'Aliado',
        speech: 'A chave dourada abre a porta da sala ao lado.', speechTimer: 360,
        attrs: { FOR: 9, DES: 12, CON: 11, INT: 16, SAB: 15, CAR: 14 },
        skills: ['Conhecimento +6', 'Persuasão +5'],
        powers: ['Conselho Sábio'],
        inventory: ['Cachimbo', 'Pergaminho']
      }
    ]
  };
}

let state = null;

function getScene() {
  return state.scenes[state.activeSceneId];
}

function init() {
  const saved = localStorage.getItem('rpg_vtt_aligned_v8');
  state = saved ? JSON.parse(saved) : createInitialState();
  migrateFixedTerrain();
  migrateBuildStyles();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  setupInputs();
  setMode(state.mode || 'architect');
  logEvent(`Cenário ativo: ${getScene().name}.`);
  requestAnimationFrame(gameLoop);
}

function refreshSceneSelect() {
  const sel = document.getElementById('sceneSelect');
  sel.innerHTML = Object.entries(state.scenes).map(([id, sc]) =>
    `<option value="${id}" ${id === state.activeSceneId ? 'selected' : ''}>${sc.name}</option>`
  ).join('');
  document.getElementById('activeSceneTag').textContent = getScene().name;
  const styleSelect = document.getElementById('sceneStyleSelect');
  if(styleSelect) styleSelect.value = state.buildStyle || 'normal';
  renderGmPullList();
  if (typeof refreshGmSpawnList === 'function') refreshGmSpawnList();
}

function onSceneSelectChange(id) {
  if (state.mode === 'architect') {
    state.activeSceneId = id;
    if (typeof selectedMapObject !== 'undefined') selectedMapObject = null;
    state.currentFloor = 0;
    state.selectedWallIdx = null;
    updateFloorLabel();
    refreshSceneSelect();
  } else {
    renderGmPullList();
  }
}

function createNewSceneAsArchitect() {
  const input = document.getElementById('newSceneName');
  const name = input.value.trim() || `Cenário ${Object.keys(state.scenes).length + 1}`;
  beginEdit();
  const id = 'scene_' + Date.now();
  const f0 = createEmptyFloor('grass');
  f0.bounds = { x: 120, y: 100, w: 540, h: 400 };
  f0.terrainBounds = {...f0.bounds};
  state.scenes[id] = { name, style: getScene()?.style || 'normal', floors: [f0, createEmptyFloor(null)] };
  state.activeSceneId = id;
  state.currentFloor = 0;
  state.selectedWallIdx = null;
  input.value = '';
  updateFloorLabel();
  refreshSceneSelect();
  finishEdit();
  saveBank();
  logEvent(`🏛️ Novo cenário criado: "${name}".`);
}

function saveCurrentSceneToBank() {
  saveBank();
  logEvent(`💾 Cenário "${getScene().name}" salvo no banco.`);
}

function duplicateCurrentScene() {
  beginEdit();
  const cur = getScene();
  const id = 'scene_' + Date.now();
  const copy = JSON.parse(JSON.stringify(cur));
  copy.name = `${cur.name} (Cópia)`;
  state.scenes[id] = copy;
  state.activeSceneId = id;
  refreshSceneSelect();
  finishEdit();
  saveBank();
}

function renderGmPullList() {
  const box = document.getElementById('gmPullEntitiesList');
  if (!box) return;
  const previous = new Set([...box.querySelectorAll('.gm-pull-chk:checked')].map(el => el.value));
  box.replaceChildren();
  for (const ent of state.entities) {
    const here = ent.sceneId === state.activeSceneId && ent.floor === state.currentFloor;
    const label = document.createElement('label');
    label.className = 'check-row';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'gm-pull-chk';
    check.value = ent.id;
    check.checked = previous.has(ent.id);
    const name = document.createElement('span');
    name.textContent = (ent.icon || '🎭') + ' ' + ent.name;
    const status = document.createElement('span');
    status.style = 'margin-left:auto;font-size:10px;color:' + (here?'var(--success)':'var(--gold)');
    status.textContent = here ? 'Aqui' : 'Outro';
    label.append(check,name,status);
    box.append(label);
  }
}
function armGmRosterPlacement() {
  const ids = [...document.querySelectorAll('.gm-pull-chk:checked')].map(c => c.value);
  if (!ids.length) { logEvent('Marque pelo menos um personagem para colocar.'); return; }
  gmRosterPlacementIds = ids;
  gmPlacementTemplate = null;
  logEvent('📍 Clique no mapa aberto para colocar os '+ids.length+' personagens.');
}
function gmSwitchScene() {
  const targetId = document.getElementById('sceneSelect').value;
  if (!targetId || !state.scenes[targetId]) return;
  state.activeSceneId = targetId;
  state.currentFloor = 0;
  updateFloorLabel();
  refreshSceneSelect();
  updateUI();
  logEvent('👑 Mestre abriu o cenário "' + getScene().name + '".');
}

function saveBank() {
  try { localStorage.setItem('rpg_vtt_aligned_v8', JSON.stringify(state)); logEvent('💾 Cenários salvos neste navegador.'); }
  catch(error) { alert('Não foi possível salvar: ' + error.message); }
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'banco_cenarios_rpg.json';
  a.click();
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      beginEdit();
      state = JSON.parse(ev.target.result);
      migrateFixedTerrain();
      migrateBuildStyles();
      finishEdit();
      state.currentFloor = 0;
      state.selectedWallIdx = null;
      updateFloorLabel();
      refreshSceneSelect();
      updateUI();
      logEvent('⬆️ Banco de cenários importado.');
    } catch {
      alert('Arquivo JSON inválido.');
    }
  };
  reader.readAsText(file);
}


const undoHistory = [], redoHistory = [];
let editSnapshot = null;
function snapshotState(){ return JSON.stringify(state); }
function beginEdit(){ if(editSnapshot === null) editSnapshot = snapshotState(); }
function finishEdit(){
  if(editSnapshot === null) return;
  if(editSnapshot !== snapshotState()){
    undoHistory.push(editSnapshot);
    if(undoHistory.length > 60) undoHistory.shift();
    redoHistory.length = 0;
  }
  editSnapshot = null;
}
function restoreState(serialized){
  state = JSON.parse(serialized);
  migrateFixedTerrain();
  migrateBuildStyles();
  dragStart = null; previewRect = null; draggedObj = null;
  selectedMapObject = null; draggingEntity = null; isDragging = false;
  updateFloorLabel(); setMode(state.mode); refreshSceneSelect(); updateSelectedWallBar(); updateUI();
}
function undoEdit(){
  finishEdit();
  if(!undoHistory.length) return;
  redoHistory.push(snapshotState());
  restoreState(undoHistory.pop());
  logEvent('↶ Última alteração desfeita.');
}
function redoEdit(){
  if(!redoHistory.length) return;
  undoHistory.push(snapshotState());
  restoreState(redoHistory.pop());
  logEvent('↷ Alteração refeita.');
}

// O tamanho do terreno pintado não depende dos limites de edição.
function migrateFixedTerrain() {
  for (const [sceneId, scene] of Object.entries(state.scenes || {})) {
    for (let i = 0; i < (scene.floors || []).length; i++) {
      const floor = scene.floors[i];
      if (!floor || floor.terrainBounds) continue;
      if (sceneId === 'scene_1' && i === 0) {
        floor.terrainBounds = {x:70,y:50,w:860,h:640};
      } else if (sceneId === 'scene_2' && i === 0) {
        floor.terrainBounds = {x:120,y:120,w:680,h:460};
      } else {
        floor.terrainBounds = floor.bounds ? {...floor.bounds} : {x:80,y:60,w:680,h:480};
      }
    }
  }
}

function setBuildStyle(style) {
  if(state.mode!=='architect' || !['normal','futurist','arabia'].includes(style))return;
  state.buildStyle=style;
  document.getElementById('sceneStyleSelect').value=style;
  logEvent('🧱 Coleção de construção: '+(style==='arabia'?'Arábia':style==='futurist'?'Retro-futurista':'Normal'));
}
function migrateBuildStyles(){
  if(!state.buildStyle)state.buildStyle='normal';
  for(const scene of Object.values(state.scenes||{})){
    const oldStyle=scene.style==='futurist'?'futurist':'normal';
    for(const floor of scene.floors||[]){
      for(const kind of ['walls','doors','windows','stairs','props','chests']){
        for(const item of floor[kind]||[]) if(!item.style)item.style=oldStyle;
      }
    }
    // O estilo do cenário antigo serve apenas para migrar os objetos.
    delete scene.style;
  }
}
