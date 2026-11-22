function drawTexturedArea(x, y, w, h, mat) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (mat === 'grass') {
    ctx.fillStyle = '#365c29';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(145, 205, 105, 0.18)';
    ctx.lineWidth = 1.2;
    const step = 44;
    const startX = Math.floor(x / step) * step;
    const startY = Math.floor(y / step) * step;
    for (let gy = startY; gy < y + h; gy += step) {
      for (let gx = startX; gx < x + w; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx + 10, gy + 16); ctx.lineTo(gx + 13, gy + 10); ctx.lineTo(gx + 16, gy + 16);
        ctx.moveTo(gx + 26, gy + 32); ctx.lineTo(gx + 29, gy + 26); ctx.lineTo(gx + 32, gy + 32);
        ctx.stroke();
      }
    }
  } else if (mat === 'wood') {
    ctx.fillStyle = '#8f582c';
    ctx.fillRect(x, y, w, h);
    const plankH = 22, plankW = 68;
    for (let py = y; py < y + h; py += plankH) {
      const rowIdx = Math.floor((py - y) / plankH);
      const offset = (rowIdx % 2) * (plankW / 2);
      for (let px = x - plankW; px < x + w + plankW; px += plankW) {
        ctx.fillStyle = ((rowIdx + Math.floor(px / plankW)) % 2 === 0) ? 'rgba(255,220,175,0.05)' : 'rgba(40,18,5,0.08)';
        ctx.fillRect(px + offset, py, plankW, plankH);
        ctx.strokeStyle = 'rgba(42, 20, 6, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(px + offset, py, plankW, plankH);
      }
    }
  } else if (mat === 'checker') {
    ctx.fillStyle = '#535c6e';
    ctx.fillRect(x, y, w, h);
    const tile = 36;
    for (let ty = y; ty < y + h; ty += tile) {
      for (let tx = x; tx < x + w; tx += tile) {
        const ix = Math.floor((tx - x) / tile);
        const iy = Math.floor((ty - y) / tile);
        if ((ix + iy) % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(tx, ty, tile, tile);
        }
        ctx.strokeStyle = 'rgba(20, 24, 32, 0.25)';
        ctx.strokeRect(tx, ty, tile, tile);
      }
    }
  } else if (mat === 'carpet') {
    ctx.fillStyle = '#8c1d28';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255, 210, 140, 0.22)';
    for (let cy = y + 10; cy < y + h - 6; cy += 12) {
      for (let cx = x + 10; cx < x + w - 6; cx += 12) ctx.fillRect(cx, cy, 2, 2);
    }
    ctx.strokeStyle = '#c99b32';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  } else if (mat === 'water') {
    ctx.fillStyle = '#1877c9';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(190, 235, 255, 0.35)';
    ctx.lineWidth = 2;
    for (let wy = y + 24; wy < y + h; wy += 48) {
      const wave = Math.sin(animTick + wy * 0.025) * 6;
      ctx.beginPath();
      ctx.moveTo(x + 18 + wave, wy);
      ctx.quadraticCurveTo(x + w / 2 + wave, wy - 5, x + w - 18 + wave, wy);
      ctx.stroke();
    }
    ctx.strokeStyle = '#0e4c85';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
  } else if (mat === 'bridge') {
    ctx.fillStyle = '#824d24';
    ctx.fillRect(x, y, w, h);
    for (let bx = x + 6; bx < x + w - 4; bx += 14) {
      ctx.fillStyle = '#9c6030';
      ctx.fillRect(bx, y + 6, 10, h - 12);
      ctx.strokeStyle = '#3d210b';
      ctx.strokeRect(bx, y + 6, 10, h - 12);
    }
    ctx.fillStyle = '#4f2c10';
    ctx.fillRect(x, y, w, 6);
    ctx.fillRect(x, y + h - 6, w, 6);
  } else if (mat === 'dirt') {
    ctx.fillStyle = '#6b4b32';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(40, 22, 10, 0.25)';
    for (let dy = y + 14; dy < y + h; dy += 28) {
      for (let dx = x + 14; dx < x + w; dx += 32) {
        ctx.beginPath(); ctx.arc(dx, dy, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (mat === 'sand') {
    ctx.fillStyle = '#c9a966';
    ctx.fillRect(x, y, w, h);
  } else if (mat === 'snow') {
    ctx.fillStyle = '#dce6f0';
    ctx.fillRect(x, y, w, h);
  } else if (mat === 'marble') {
    ctx.fillStyle = '#c6cdd8';
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function drawFloorLayer(sc, floorIdx, isBelow) {
  const floor = sc.floors[floorIdx];
  if (!floor) return;

  // Área inicial compacta e expansível
  if (floor.terrainBounds && floor.baseTerrain) {
    const b = floor.terrainBounds;
    drawTexturedArea(b.x, b.y, b.w, b.h, floor.baseTerrain);
  }
  if (floor.bounds) {
    const b = floor.bounds;
    if (!isBelow && state.mode === 'architect') {
      ctx.strokeStyle = 'rgba(245, 185, 66, 0.35)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.setLineDash([]);
    }
  }

  floor.areas.forEach(a => drawTexturedArea(a.x, a.y, a.w, a.h, a.mat));

  floor.stairs.forEach(s => {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(s.x - 32, s.y - 48, 68, 102);
    ctx.fillStyle = '#c9a473';
    ctx.fillRect(s.x - 36, s.y - 52, 72, 104);
    ctx.strokeStyle = '#382412';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(s.x - 36, s.y - 52, 72, 104);
    for (let stepY = s.y - 38; stepY < s.y + 48; stepY += 14) {
      ctx.beginPath(); ctx.moveTo(s.x - 36, stepY); ctx.lineTo(s.x + 36, stepY); ctx.stroke();
    }
    ctx.fillStyle = '#1f140a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.label || (s.dir === 'up' ? '→ 2º' : '→ 1º'), s.x, s.y + 5);
    ctx.textAlign = 'left';
  });

  floor.walls.forEach((w, idx) => {
    const isSel = !isBelow && state.mode === 'architect' && state.selectedWallIdx === idx;
    ctx.save();
    ctx.lineCap = 'square';
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 18;
    ctx.beginPath(); ctx.moveTo(w.x1 + 5, w.y1 + 6); ctx.lineTo(w.x2 + 5, w.y2 + 6); ctx.stroke();

    ctx.strokeStyle = isSel ? '#f5b942' : '#1e2430';
    ctx.lineWidth = 18;
    ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();

    ctx.strokeStyle = '#535d70';
    ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();

    if (isSel) {
      ctx.fillStyle = '#f5b942';
      ctx.beginPath(); ctx.arc(w.x1, w.y1, 6, 0, Math.PI * 2); ctx.arc(w.x2, w.y2, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  });

  floor.windows.forEach(win => {
    ctx.save();
    ctx.translate(win.x, win.y);
    if (win.orient === 'v') ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(135, 220, 255, 0.45)';
    ctx.fillRect(-20, -8, 40, 16);
    ctx.strokeStyle = '#eaf7ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -8, 40, 16);
    ctx.restore();
  });

  floor.doors.forEach(d => {
    ctx.save();
    ctx.translate(d.x, d.y);
    if (d.orient === 'v') ctx.rotate(Math.PI / 2);
    if (d.open) ctx.rotate(-0.85);
    ctx.fillStyle = d.keyId && !d.open ? '#eab308' : '#9c5a27';
    ctx.fillRect(-34, -9, 68, 18);
    ctx.strokeStyle = '#1e2430';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-34, -9, 68, 18);
    ctx.fillStyle = d.keyId ? '#e11d48' : '#f5b942';
    ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  floor.chests.forEach(c => {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(c.x - 20, c.y - 12, 44, 28);
    ctx.fillStyle = c.opened ? '#6e563e' : '#f5b942';
    ctx.fillRect(c.x - 22, c.y - 14, 44, 28);
    ctx.strokeStyle = '#2b1c0c';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(c.x - 22, c.y - 14, 44, 28);
    ctx.strokeRect(c.x - 5, c.y - 4, 10, 8);
  });

  floor.props.forEach(p => drawProp(p));

  state.entities.filter(e => e.sceneId === sc.id && e.floor === floorIdx).forEach(ent => {
    drawCharacterToken(ent, isBelow);
  });
}

function drawCharacterToken(ent, isBelow) {
  const cx = ent.x;
  const cy = ent.y;

  if (state.timeOfDay === 'night') {
    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 120);
    grad.addColorStop(0, 'rgba(255, 210, 120, 0.35)');
    grad.addColorStop(1, 'rgba(255, 210, 120, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, 120, 0, Math.PI * 2); ctx.fill();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath(); ctx.arc(cx + 2, cy + 4, 18, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = ent.color;
  ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = ent.id === state.selectedEntityId ? 3.5 : 2.5;
  ctx.strokeStyle = ent.id === state.selectedEntityId ? '#f5b942' : '#ffffff';
  ctx.stroke();

  ctx.font = '15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ent.icon || '⚔️', cx, cy + 5);

  ctx.font = 'bold 11px sans-serif';
  const w = ctx.measureText(ent.name).width + 10;
  ctx.fillStyle = 'rgba(15, 18, 26, 0.85)';
  ctx.fillRect(cx - w / 2, cy - 33, w, 15);
  ctx.fillStyle = '#fff';
  ctx.fillText(ent.name, cx, cy - 22);

  if (!isBelow && ent.speech) drawSpeechBubble(cx, cy - 38, ent.speech);
  ctx.textAlign = 'left';
}

function drawProp(p) {
  const cx = p.x;
  const cy = p.y;

  if (p.type === 'tree' || p.type === 'fruitTree') {
    const sway = Math.sin(animTick + p.x * 0.02) * 2.5;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.arc(cx + 8, cy + 10, 30, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#4a3018';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy - 7); ctx.stroke();
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx - 15, cy - 12);
    ctx.moveTo(cx, cy - 2); ctx.lineTo(cx + 15, cy - 10);
    ctx.stroke();

    const clusters = [
      { dx: -13, dy: -7, r: 17, c: '#234d20' },
      { dx: 13, dy: -6, r: 17, c: '#2b5c27' },
      { dx: 0, dy: -15, r: 20, c: '#387533' },
      { dx: 0, dy: 3, r: 16, c: '#2e6329' }
    ];
    clusters.forEach(cl => {
      ctx.fillStyle = cl.c;
      ctx.beginPath(); ctx.arc(cx + cl.dx + sway, cy + cl.dy, cl.r, 0, Math.PI * 2); ctx.fill();
    });

    if (p.type === 'fruitTree') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx - 8 + sway, cy - 12, 4, 0, Math.PI * 2);
      ctx.arc(cx + 9 + sway, cy - 8, 4, 0, Math.PI * 2);
      ctx.arc(cx + 2 + sway, cy - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.type === 'pine') {
    const sway = Math.sin(animTick + p.x * 0.02) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.arc(cx + 7, cy + 9, 25, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3d2612'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx, cy + 12); ctx.lineTo(cx, cy - 12); ctx.stroke();
    const tiers = [{ dy: 6, r: 22, c: '#193d24' }, { dy: -4, r: 17, c: '#1f4d2d' }, { dy: -13, r: 12, c: '#286139' }];
    tiers.forEach(t => {
      ctx.fillStyle = t.c;
      ctx.beginPath(); ctx.arc(cx + sway, cy + t.dy, t.r, 0, Math.PI * 2); ctx.fill();
    });
  } else if (p.type === 'bush') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.arc(cx + 3, cy + 4, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#26a641';
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#122616'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ff4757';
    ctx.beginPath(); ctx.arc(cx - 5, cy - 2, 2.5, 0, Math.PI * 2); ctx.arc(cx + 5, cy + 2, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (p.type === 'rock') {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.ellipse(cx + 4, cy + 7, 22, 15, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5f6775';
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 5); ctx.lineTo(cx - 13, cy - 14); ctx.lineTo(cx + 6, cy - 16);
    ctx.lineTo(cx + 19, cy - 3); ctx.lineTo(cx + 12, cy + 13); ctx.lineTo(cx - 8, cy + 14);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1c212b'; ctx.lineWidth = 2; ctx.stroke();
  } else if (p.type === 'table') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(cx - 32, cy - 18, 68, 40);
    ctx.fillStyle = '#8a5426';
    ctx.fillRect(cx - 34, cy - 20, 68, 40);
    ctx.strokeStyle = '#241306'; ctx.lineWidth = 2.5; ctx.strokeRect(cx - 34, cy - 20, 68, 40);
  } else if (p.type === 'chair') {
    ctx.fillStyle = '#75441c';
    ctx.fillRect(cx - 13, cy - 13, 26, 26);
    ctx.strokeStyle = '#241306'; ctx.lineWidth = 2; ctx.strokeRect(cx - 13, cy - 13, 26, 26);
  } else if (p.type === 'barrel') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(cx + 3, cy + 4, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8f4719';
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#241306'; ctx.lineWidth = 2.5; ctx.stroke();
  } else if (p.type === 'bed') {
    ctx.fillStyle = '#543318';
    ctx.fillRect(cx - 24, cy - 30, 48, 60);
    ctx.fillStyle = '#9c2d3c';
    ctx.fillRect(cx - 20, cy - 8, 40, 34);
    ctx.fillStyle = '#eef2f7';
    ctx.fillRect(cx - 17, cy - 25, 34, 12);
  } else if (p.type === 'bookshelf') {
    ctx.fillStyle = '#4f3117';
    ctx.fillRect(cx - 26, cy - 16, 52, 32);
    ctx.fillStyle = '#c94a4a'; ctx.fillRect(cx - 20, cy - 10, 8, 14);
    ctx.fillStyle = '#4a89c9'; ctx.fillRect(cx - 8, cy - 10, 8, 14);
    ctx.fillStyle = '#e3b23c'; ctx.fillRect(cx + 6, cy - 10, 8, 14);
  } else if (p.type === 'hearth') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(cx - 32, cy - 18, 68, 40);
    ctx.fillStyle = '#384152';
    ctx.fillRect(cx - 34, cy - 20, 68, 40);
    ctx.strokeStyle = '#181d26'; ctx.lineWidth = 2.5; ctx.strokeRect(cx - 34, cy - 20, 68, 40);
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.arc(cx, cy + 4, 16, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(cx, cy + 4, 9, Math.PI, 0); ctx.fill();
  }
}

function drawSpeechBubble(x, y, text) {
  ctx.font = '12px sans-serif';
  const w = Math.min(220, ctx.measureText(text).width + 18);
  const h = 26;
  ctx.fillStyle = 'rgba(18, 22, 32, 0.95)';
  ctx.strokeStyle = '#f5b942';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(text.slice(0, 34), x, y - 9);
}

// UI & FICHA
