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
  if (mode === 'gm') hud.textContent = 'Modo Mestre • Arraste personagens/NPCs • Troque cenários e puxe tokens • Fale em balões';
  if (mode === 'player') hud.textContent = 'Modo Jogador • WASD/Setas: Mover • E ou Clique próximo: Portas, baús e escadas';

  refreshSceneSelect();
  updateUI();
}

function canMoveTo(floorIdx, nx, ny) {
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
  if (onWater && !onBridge) return false;

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

