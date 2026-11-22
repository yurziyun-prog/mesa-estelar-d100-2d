function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById('architectTools').classList.toggle('hidden', mode !== 'architect');
  document.getElementById('gmTools').classList.toggle('hidden', mode !== 'gm');
  document.getElementById('playerTools').classList.toggle('hidden', mode !== 'player');
  document.getElementById('gmEntityControls').classList.toggle('hidden', mode !== 'gm');

  document.getElementById('sceneBankCard').classList.toggle('hidden', mode === 'player');
  document.getElementById('architectSceneControls').classList.toggle('hidden', mode !== 'architect');
  document.getElementById('gmSceneControls').classList.toggle('hidden', mode !== 'gm');

  const hud = document.getElementById('hudStatus');
  if (mode === 'architect') hud.textContent = 'Modo Arquiteto • Paredes retas alinhadas • Porta/Janela abre vão na parede • R: Rotacionar';
  if (mode === 'gm') hud.textContent = 'Modo Mestre • Escolha personagens prontos ou marque existentes e clique em Colocar • Arraste no mapa';
  if (mode === 'player') hud.textContent = 'Modo Jogador • WASD/Setas: Mover • E ou Clique próximo: Portas, baús e escadas';

  refreshSceneSelect();
  refreshGmSpawnList();
  updateUI();
}

function onPaintedGround(floor, x, y) {
  const hit = (a) => x >= a.x && x <= a.x+a.w && y >= a.y && y <= a.y+a.h;
  const painted = [...floor.areas].reverse().find(hit);
  if (painted) return painted.mat !== 'water';
  const b = floor.terrainBounds || floor.bounds;
  return Boolean(floor.baseTerrain && b && hit(b) && floor.baseTerrain !== 'water');
}
function onPlacedBridge(floor, x, y) {
  return floor.props.some(p => {
    if (p.type !== 'log') return false;
    const horizontal = (p.rot || 0) % 2 === 0;
    return horizontal ? Math.abs(y-p.y) <= 13 && Math.abs(x-p.x) <= 70
      : Math.abs(x-p.x) <= 13 && Math.abs(y-p.y) <= 70;
  });
}
function walkableFloor(floor, x, y) {
  return onPaintedGround(floor, x, y) || onPlacedBridge(floor, x, y);
}
function canMoveTo(floorIdx, nx, ny, jumpLanding = false) {
  const floor = getScene().floors[floorIdx];
  if (!floor) return false;
  const r = 12;

  for (const w of floor.walls) {
    if (distToSegment(nx, ny, w.x1, w.y1, w.x2, w.y2) < r + 6) {
      const nearOpenDoor = floor.doors.some(d => d.open && Math.hypot(d.x - nx, d.y - ny) < 38);
      if (!nearOpenDoor) return false;
    }
  }

  if (floor.doors.some(d => !d.open && Math.hypot(d.x - nx, d.y - ny) < r + 12)) return false;
  if (floor.windows.some(win => Math.hypot(win.x - nx, win.y - ny) < r + 8)) return false;
  if (floor.chests.some(c => Math.hypot(c.x - nx, c.y - ny) < r + 14)) return false;

  const solidProps = ['tree', 'pine', 'fruitTree', 'rock', 'table', 'bed', 'bookshelf', 'hearth', 'barrel'];
  if (floor.props.some(p => solidProps.includes(p.type) && Math.hypot(p.x - nx, p.y - ny) < r + 14)) return false;

  const onWater = floor.areas.some(a => a.mat === 'water' && nx >= a.x && nx <= a.x + a.w && ny >= a.y && ny <= a.y + a.h);
  const onBridge = floor.areas.some(a => a.mat === 'bridge' && nx >= a.x && nx <= a.x + a.w && ny >= a.y && ny <= a.y + a.h);
  if (onWater && !onBridge && !onPlacedBridge(floor,nx,ny)) return false;
  if (!walkableFloor(floor,nx,ny)) return false;

  return true;
}

function interactNearby(entity) {
  const floor = getScene().floors[entity.floor];

  const stair = floor.stairs.find(s => Math.hypot(s.x - entity.x, s.y - entity.y) < 64);
  if (stair) {
    const targetFloor = stair.dir === 'up' ? entity.floor + 1 : entity.floor - 1;
    if (getScene().floors[targetFloor]) {
      entity.floor = targetFloor;
      state.currentFloor = targetFloor;
      updateFloorLabel();
      logEvent(`${entity.name} foi para o ${targetFloor + 1}º andar.`);
      return;
    }
  }

  const door = floor.doors.find(d => Math.hypot(d.x - entity.x, d.y - entity.y) < 58);
  if (door) {
    if (door.keyId && !door.open) {
      if (entity.inventory.includes(door.keyId)) {
        door.open = true;
        logEvent(`🔓 ${entity.name} destrancou a porta com [${door.keyId}].`);
      } else {
        say(entity, `Trancada! Requer: ${door.keyId}`);
      }
    } else {
      door.open = !door.open;
      logEvent(`${entity.name} ${door.open ? 'abriu' : 'fechou'} uma porta.`);
    }
    return;
  }

  const chest = floor.chests.find(c => Math.hypot(c.x - entity.x, c.y - entity.y) < 58);
  if (chest) {
    if (chest.opened) {
      say(entity, 'Baú vazio.');
      return;
    }
    if (chest.keyId && !entity.inventory.includes(chest.keyId)) {
      say(entity, `Trancado (${chest.keyId}).`);
      return;
    }
    chest.opened = true;
    entity.inventory.push(...chest.loot);
    say(entity, `Peguei: ${chest.loot.join(', ')}!`);
    logEvent(`🧰 ${entity.name} pegou: ${chest.loot.join(', ')}.`);
    updateUI();
  }
}

function say(entity, text) {
  entity.speech = text;
  entity.speechTimer = 260;
}

// CONTROLES
function getSelectedEntity() {
  return state.entities.find(e => e.id === state.selectedEntityId) || state.entities[0];
}

function updateUI() {
  const ent = getSelectedEntity();
  if (!ent) return;

  document.getElementById('charHeader').textContent = `${ent.name} • ${ent.role || ''}`;
  document.getElementById('entityTypeBadge').textContent = ent.type === 'pc' ? 'PJ' : `NPC (${ent.attitude})`;
  document.getElementById('hpText').textContent = `${ent.hp} / ${ent.maxHp}`;
  document.getElementById('hpBar').style.width = `${Math.max(0, (ent.hp / ent.maxHp) * 100)}%`;
  document.getElementById('hungerText').textContent = `${ent.hunger}%`;
  document.getElementById('hungerBar').style.width = `${ent.hunger}%`;
  document.getElementById('attitudeSelect').value = ent.attitude;

  document.getElementById('attrGrid').innerHTML = Object.entries(ent.attrs).map(([k, v]) => `
    <div class="stat-box" onclick="testAttribute('${k}', ${v})" title="Clique para rolar teste de ${k}">
      <div class="lbl">${k}</div>
      <div class="val">${v}</div>
    </div>
  `).join('');

  document.getElementById('skillsList').innerHTML = [
    ...ent.skills.map(s => `<div class="list-item"><span>🎯 ${s}</span></div>`),
    ...ent.powers.map(p => `<div class="list-item" style="border-color:#4f8cff55;"><span>✨ ${p}</span></div>`)
  ].join('');

  document.getElementById('inventoryList').innerHTML = ent.inventory.length
    ? ent.inventory.map(item => `<div class="list-item"><span>🎒 ${item}</span></div>`).join('')
    : '<div style="font-size:11px; color:var(--text-muted);">Mochila vazia</div>';

  const pcs = state.entities.filter(e => e.type === 'pc');
  document.getElementById('playerSwitchList').innerHTML = pcs.map(p => `
    <button class="tool-btn ${p.id === ent.id ? 'active' : ''}" style="width:100%; margin-bottom:4px;"
      onclick="selectPlayerChar('${p.id}')">🗡️ ${p.name} (${state.scenes[p.sceneId]?.name || ''})</button>
  `).join('');
}

function selectPlayerChar(id) {
  state.selectedEntityId = id;
  const ent = getSelectedEntity();
  if (ent) {
    state.activeSceneId = ent.sceneId;
    state.currentFloor = ent.floor;
    updateFloorLabel();
    refreshSceneSelect();
  }
  updateUI();
}

function adjustStat(field, delta) {
  const ent = getSelectedEntity();
  if (!ent) return;
  if (field === 'hp') ent.hp = Math.max(0, Math.min(ent.maxHp, ent.hp + delta));
  if (field === 'hunger') ent.hunger = Math.max(0, Math.min(100, ent.hunger + delta));
  updateUI();
}

function changeAttitude(val) {
  const ent = getSelectedEntity();
  if (ent) { ent.attitude = val; updateUI(); }
}

function changeTimeOfDay(val) {
  state.timeOfDay = val;
  logEvent(`Horário: ${val.toUpperCase()}`);
}

function speakSelected() {
  const input = document.getElementById('speechInput');
  const text = input.value.trim();
  const ent = getSelectedEntity();
  if (!text || !ent) return;
  say(ent, text);
  logEvent(`💬 ${ent.name}: "${text}"`);
  input.value = '';
}

function rollDice(sides) {
  const res = Math.floor(Math.random() * sides) + 1;
  logEvent(`🎲 d${sides}: ${res}`);
}

function testAttribute(attr, val) {
  const mod = Math.floor((val - 10) / 2);
  const roll = Math.floor(Math.random() * 20) + 1;
  const ent = getSelectedEntity();
  logEvent(`🎲 ${ent.name} (${attr}): d20(${roll}) ${mod >= 0 ? '+' : ''}${mod} = ${roll + mod}`);
}

function logEvent(msg) {
  const box = document.getElementById('eventLog');
  if (!box) return;
  const div = document.createElement('div');
  div.textContent = `• ${msg}`;
  box.prepend(div);
}


// Catálogo permanente de modelos. Não depende das entidades já presentes no mapa.
const GM_TEMPLATES = [
  {id:'warrior',name:'Guerreiro',role:'Combatente',type:'pc',icon:'⚔️',color:'#4f8cff',hp:30,attrs:{FOR:16,DES:12,CON:15,INT:10,SAB:10,CAR:11},skills:['Espadas +5'],inventory:['Espada','Escudo']},
  {id:'mage',name:'Maga',role:'Arcanista',type:'pc',icon:'🪄',color:'#9474f5',hp:18,attrs:{FOR:8,DES:12,CON:10,INT:17,SAB:14,CAR:12},skills:['Arcanismo +6'],powers:['Bola de Fogo'],inventory:['Cajado']},
  {id:'ranger',name:'Arqueira',role:'Exploradora',type:'pc',icon:'🏹',color:'#58bf8c',hp:23,attrs:{FOR:12,DES:17,CON:13,INT:11,SAB:14,CAR:10},skills:['Pontaria +6'],inventory:['Arco','Flechas']},
  {id:'villager',name:'Aldeão',role:'Civil',type:'npc',icon:'🧑',color:'#d6aa64',hp:12,attrs:{FOR:10,DES:10,CON:10,INT:10,SAB:10,CAR:10}},
  {id:'guard',name:'Guarda',role:'Soldado',type:'npc',icon:'🛡️',color:'#648eba',hp:25,attrs:{FOR:14,DES:12,CON:14,INT:10,SAB:11,CAR:10},inventory:['Lança']},
  {id:'merchant',name:'Mercadora',role:'Comerciante',type:'npc',icon:'🧳',color:'#e0ac5c',hp:14,attrs:{FOR:9,DES:11,CON:10,INT:14,SAB:12,CAR:15}},
  {id:'goblin',name:'Goblin',role:'Monstro',type:'npc',icon:'👺',color:'#78ae45',hp:12,attitude:'Hostil',attrs:{FOR:9,DES:14,CON:10,INT:8,SAB:8,CAR:7}},
  {id:'skeleton',name:'Esqueleto',role:'Monstro',type:'npc',icon:'💀',color:'#c4c8c8',hp:15,attitude:'Hostil',attrs:{FOR:11,DES:12,CON:10,INT:6,SAB:8,CAR:5}},
  {id:'wolf',name:'Lobo',role:'Fera',type:'npc',icon:'🐺',color:'#8f998e',hp:18,attitude:'Hostil',attrs:{FOR:12,DES:15,CON:13,INT:4,SAB:13,CAR:6}},
  {id:'dragon',name:'Dragão',role:'Monstro',type:'npc',icon:'🐉',color:'#d96363',hp:95,attitude:'Hostil',attrs:{FOR:20,DES:12,CON:20,INT:14,SAB:14,CAR:16},powers:['Sopro de Fogo']}
];
let gmPlacementTemplate = null;
let gmRosterPlacementIds = null;
function refreshGmSpawnList(){
  const sel = document.getElementById('gmSpawnSelect');
  if (!sel) return;
  const old = sel.value;
  sel.replaceChildren();
  for (const template of GM_TEMPLATES) {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.icon + ' ' + template.name + ' (' + template.role + ')';
    sel.append(option);
  }
  if(GM_TEMPLATES.some(t=>t.id===old)) sel.value=old;
}
function armGmPlacement(){
  const select = document.getElementById('gmSpawnSelect');
  gmPlacementTemplate = GM_TEMPLATES.find(t=>t.id===select?.value) || GM_TEMPLATES[0];
  gmRosterPlacementIds = null;
  logEvent('📍 Clique no mapa para colocar '+gmPlacementTemplate.name+'.');
}
function instantiateTemplate(template, wx, wy) {
  const attrs = {FOR:10,DES:10,CON:10,INT:10,SAB:10,CAR:10,...template.attrs};
  return {
    id:'entity_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),
    type:template.type,name:template.name,role:template.role,icon:template.icon,color:template.color,
    sceneId:state.activeSceneId,floor:state.currentFloor,x:wx,y:wy,
    hp:template.hp,maxHp:template.hp,hunger:100,attitude:template.attitude || 'Neutro',
    speech:'',speechTimer:0,attrs,skills:[...(template.skills||[])],
    powers:[...(template.powers||[])],inventory:[...(template.inventory||[])]
  };
}
function placeGmEntityAt(wx, wy){
  if (gmRosterPlacementIds?.length) {
    beginEdit();
    gmRosterPlacementIds.forEach((id,i)=>{
      const ent=state.entities.find(e=>e.id===id);
      if(!ent)return;
      ent.sceneId=state.activeSceneId;
      ent.floor=state.currentFloor;
      ent.x=wx+(i%3)*36;
      ent.y=wy+Math.floor(i/3)*36;
      state.selectedEntityId=ent.id;
    });
    finishEdit();
    gmRosterPlacementIds=null;
    renderGmPullList();updateUI();
    logEvent('📍 Personagens colocados no mapa aberto.');
    return true;
  }
  if (!gmPlacementTemplate) return false;
  beginEdit();
  const entity=instantiateTemplate(gmPlacementTemplate,wx,wy);
  state.entities.push(entity);
  state.selectedEntityId=entity.id;
  finishEdit();
  updateUI();
  renderGmPullList();
  logEvent('📍 '+entity.name+' colocado no mapa.');
  return true;
}
function createGmNpc(){
  const input=document.getElementById('gmNpcName');
  const name=input?.value.trim();
  if(!name) return;
  beginEdit();
  const template={...GM_TEMPLATES.find(t=>t.id==='villager'),name,role:'NPC'};
  const npc=instantiateTemplate(template,340,380);
  state.entities.push(npc);
  state.selectedEntityId=npc.id;
  finishEdit();
  input.value='';
  renderGmPullList();
  updateUI();
  logEvent('🎭 NPC '+name+' criado. Marque-o na lista de cima e use Colocar.');
}

// Saltos curtos verificam uma aterrissagem segura; caminhar jamais cruza o vazio.
function attemptJump(ent, dx, dy) {
  const floor=getScene().floors[ent.floor];
  if(!floor || ent.jumpUntil > performance.now()) return false;
  const len=Math.hypot(dx,dy);
  if(len===0) return false;
  const ux=dx/len,uy=dy/len;
  // Buscar a menor aterrissagem válida, permitindo pular pequenos vãos.
  for(let d=42;d<=104;d+=8){
    const x=ent.x+ux*d,y=ent.y+uy*d;
    if(!canMoveTo(ent.floor,x,y,true)) continue;
    // Não saltar através de paredes, portas ou objetos sólidos.
    const blocked=[0.25,0.5,0.75].some(t=>{
      const px=ent.x+ux*d*t,py=ent.y+uy*d*t;
      return floor.walls.some(w=>distToSegment(px,py,w.x1,w.y1,w.x2,w.y2)<17)
        || floor.doors.some(door=>!door.open&&Math.hypot(door.x-px,door.y-py)<24);
    });
    if(blocked) continue;
    ent.jumpFrom={x:ent.x,y:ent.y};
    ent.jumpStart=performance.now();
    ent.jumpUntil=ent.jumpStart+380;
    ent.x=x;ent.y=y;
    return true;
  }
  logEvent('Não há terreno seguro ao alcance do salto.');
  return false;
}
