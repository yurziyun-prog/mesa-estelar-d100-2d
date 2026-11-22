function isRetroFuture(item) { return (item?.style || 'normal') === 'futurist'; }
function isArabia(item) { return (item?.style || 'normal') === 'arabia'; }

function drawFutureArea(x,y,w,h,mat) {
  const palette = {
    grass:'#233b38',sand:'#655c55',dirt:'#51483d',snow:'#b8c7d1',
    water:'#124e70',bridge:'#556674',wood:'#4b555f',checker:'#343e52',
    marble:'#929ead',carpet:'#403957'
  };
  ctx.save();
  ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.fillStyle=palette[mat] || '#3c4652';ctx.fillRect(x,y,w,h);
  const step=mat==='grass'?38:32;
  if(mat==='water'){
    ctx.strokeStyle='rgba(69,202,237,.43)';ctx.lineWidth=2;
    for(let wy=y+16;wy<y+h;wy+=28){
      ctx.beginPath();ctx.moveTo(x,wy);ctx.lineTo(x+w,wy+Math.sin(animTick+wy*.03)*5);ctx.stroke();
    }
  } else {
    ctx.strokeStyle=mat==='wood'||mat==='checker'||mat==='marble'?'rgba(120,215,241,.24)':'rgba(133,198,187,.12)';
    ctx.lineWidth=1;
    for(let gx=Math.floor(x/step)*step;gx<x+w;gx+=step){
      ctx.beginPath();ctx.moveTo(gx,y);ctx.lineTo(gx,y+h);ctx.stroke();
    }
    for(let gy=Math.floor(y/step)*step;gy<y+h;gy+=step){
      ctx.beginPath();ctx.moveTo(x,gy);ctx.lineTo(x+w,gy);ctx.stroke();
    }
    if(mat==='carpet'||mat==='bridge'){
      ctx.strokeStyle='#ca9c58';ctx.lineWidth=3;ctx.strokeRect(x+3,y+3,w-6,h-6);
    }
    if(mat==='grass'){
      ctx.fillStyle='rgba(108,189,148,.18)';
      for(let gx=x+12;gx<x+w;gx+=40)for(let gy=y+12;gy<y+h;gy+=40)ctx.fillRect(gx,gy,3,3);
    }
  }
  ctx.restore();
}

function drawTexturedArea(x, y, w, h, mat) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (mat === 'grass') {
    ctx.fillStyle='#4e7540';ctx.fillRect(x,y,w,h);
    const cell=13, sx=Math.floor(x/cell)*cell,sy=Math.floor(y/cell)*cell;
    for(let gy=sy;gy<y+h;gy+=cell) for(let gx=sx;gx<x+w;gx+=cell){
      const n=Math.sin(gx*12.9898+gy*78.233)*43758.5453;
      const f=n-Math.floor(n);
      ctx.strokeStyle=f>.55?'rgba(148,187,94,.30)':'rgba(28,73,31,.32)';
      ctx.lineWidth=f>.7?1.7:1.0;
      const xx=gx+f*10, yy=gy+((f*43)%10);
      ctx.beginPath();ctx.moveTo(xx,yy+4);ctx.lineTo(xx-2,yy-2-f*3);
      ctx.moveTo(xx,yy+4);ctx.lineTo(xx+3,yy-1-f*2);ctx.stroke();
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
    ctx.fillStyle='#dac38c';ctx.fillRect(x,y,w,h);
    for(let gy=Math.floor(y/11)*11;gy<y+h;gy+=11)for(let gx=Math.floor(x/11)*11;gx<x+w;gx+=11){
      const n=Math.sin(gx*13.17+gy*8.91)*18437.12,f=n-Math.floor(n);
      ctx.fillStyle=f>.5?'rgba(255,248,213,.30)':'rgba(137,96,48,.16)';
      ctx.fillRect(gx+f*7,gy+f*6,f>.8?3:1.4,1.4);
    }
    ctx.strokeStyle='rgba(157,117,62,.13)';ctx.lineWidth=1.4;
    for(let gy=y+14;gy<y+h;gy+=24){ctx.beginPath();ctx.moveTo(x,gy);ctx.quadraticCurveTo(x+w/2,gy-7,x+w,gy+2);ctx.stroke();}
  } else if (mat === 'snow') {
    ctx.fillStyle = '#dce6f0';
    ctx.fillRect(x, y, w, h);
  } else if (mat === 'marble') {
    ctx.fillStyle = '#c6cdd8';
    ctx.fillRect(x, y, w, h);
  } else if (['stone','cobble','metal','mosaic'].includes(mat)) {
    const base={stone:'#899089',cobble:'#797e80',metal:'#b6c8d3',mosaic:'#e3d1a6'};
    ctx.fillStyle=base[mat];ctx.fillRect(x,y,w,h);
    const cell=mat==='mosaic'?20:mat==='metal'?48:32;
    for(let yy=Math.floor(y/cell)*cell; yy<y+h; yy+=cell){
      for(let xx=Math.floor(x/cell)*cell;xx<x+w;xx+=cell){
        const variation=Math.abs(Math.sin(xx*11.7+yy*3.4))*0.12;
        ctx.fillStyle=mat==='mosaic'?(Math.floor(xx/cell)+Math.floor(yy/cell))%3===0?'#438b96':'rgba(155,80,65,.28)':'rgba(20,39,47,'+variation.toFixed(2)+')';
        ctx.fillRect(xx+2,yy+2,cell-4,cell-4);
        ctx.strokeStyle=mat==='metal'?'#7a98a8':'rgba(69,62,55,.38)';
        ctx.lineWidth=1.5;ctx.strokeRect(xx+1,yy+1,cell-2,cell-2);
        if(mat==='metal'){ctx.fillStyle='#f5e2a8';ctx.fillRect(xx+4,yy+4,3,3);ctx.fillRect(xx+cell-7,yy+cell-7,3,3);}
      }
    }
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
    if(isRetroFuture(s)){
      ctx.fillStyle='#2b3846';ctx.fillRect(s.x-36,s.y-52,72,104);
      ctx.strokeStyle='#5cc4d5';ctx.lineWidth=2;ctx.strokeRect(s.x-36,s.y-52,72,104);
      for(let k=0;k<7;k++){
        ctx.fillStyle=k%2?'#476078':'#8498a6';ctx.fillRect(s.x-31,s.y-46+k*14,62,9);
      }
      ctx.fillStyle='#dceee9';ctx.font='12px system-ui';ctx.fillText(s.label||'ESCADA',s.x-25,s.y+5);
      return;
    }
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

    ctx.strokeStyle = isSel ? '#f5b942' : (isRetroFuture(w) ? '#506e80' : isArabia(w) ? '#735238' : '#1e2430');
    ctx.lineWidth = 18;
    ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();

    ctx.strokeStyle = isRetroFuture(w) ? '#d1e0e6' : isArabia(w) ? '#d9b889' : '#535d70';
    ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();

    if(isRetroFuture(w)){
      ctx.strokeStyle='#43b5c4';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(w.x1,w.y1);ctx.lineTo(w.x2,w.y2);ctx.stroke();
      ctx.fillStyle='#d5a55a';
      for(let t=0;t<=1;t+=0.2){
        ctx.beginPath();ctx.arc(w.x1+(w.x2-w.x1)*t,w.y1+(w.y2-w.y1)*t,2.2,0,Math.PI*2);ctx.fill();
      }
    }
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
    ctx.fillStyle = isRetroFuture(win) ? 'rgba(55, 210, 226, .6)' : 'rgba(135, 220, 255, 0.45)';
    ctx.fillRect(-20, -8, 40, 16);
    ctx.strokeStyle = isRetroFuture(win) ? '#dba95d' : isArabia(win) ? '#e0a44e' : '#eaf7ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -8, 40, 16);
    ctx.restore();
  });

  floor.doors.forEach(d => {
    ctx.save();
    ctx.translate(d.x,d.y);
    if(d.orient==='v') ctx.rotate(Math.PI/2);
    const retro=isRetroFuture(d);
    // Trilho ou batente permanece fixo na parede.
    ctx.fillStyle=retro?'#728b9b':isArabia(d)?'#895f3d':'#3d2819';
    ctx.fillRect(-38,-10,76,20);
    ctx.fillStyle=retro?'#e3c184':isArabia(d)?'#dcb874':'#a8733e';
    ctx.fillRect(-38,-11,5,22);
    ctx.fillRect(33,-11,5,22);
    if(retro){
      // Dois painéis retráteis recolhem-se lateralmente, sem giro.
      const left=d.open?-35:-34,right=d.open?35:34;
      const span=d.open?7:34;
      ctx.fillStyle='#788fa4';ctx.strokeStyle='#182735';ctx.lineWidth=2;
      ctx.fillRect(left,-8,span,16);ctx.strokeRect(left,-8,span,16);
      ctx.fillRect(right-span,-8,span,16);ctx.strokeRect(right-span,-8,span,16);
      ctx.strokeStyle='#55d5e5';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(left+2,0);ctx.lineTo(left+span-2,0);
      ctx.moveTo(right-span+2,0);ctx.lineTo(right-2,0);ctx.stroke();
      ctx.fillStyle=d.keyId&&!d.open?'#ee4d70':'#51d1a5';
      ctx.fillRect(29,-4,4,8);
    } else {
      // A folha gira a 90 graus em torno da dobradiça na ponta esquerda.
      // Antes girava pelo centro, criando a aparência de porta atravessada.
      ctx.translate(-34,0);
      if(d.open) ctx.rotate(-Math.PI/2);
      ctx.fillStyle=d.keyId&&!d.open?'#bb843a':isArabia(d)?'#c28a50':'#9c5a27';
      ctx.fillRect(0,-8,68,16);
      ctx.strokeStyle='#322014';ctx.lineWidth=2.5;ctx.strokeRect(0,-8,68,16);
      ctx.strokeStyle='#c89457';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(9,-5);ctx.lineTo(59,-5);ctx.stroke();
      ctx.fillStyle=d.keyId?'#e11d48':'#f5b942';
      ctx.beginPath();ctx.arc(55,2,3.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e6c27c';
      ctx.beginPath();ctx.arc(1,0,4,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  });

  floor.chests.forEach(c => {
    if(isRetroFuture(c)){
      ctx.fillStyle='#1e2e3d';ctx.fillRect(c.x-24,c.y-15,48,30);
      ctx.fillStyle=c.opened?'#455668':'#798b99';ctx.fillRect(c.x-20,c.y-12,40,24);
      ctx.strokeStyle='#c69d5b';ctx.lineWidth=2;ctx.strokeRect(c.x-24,c.y-15,48,30);
      ctx.fillStyle='#57d0da';ctx.fillRect(c.x-5,c.y-4,10,8);
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(c.x - 20, c.y - 12, 44, 28);
    ctx.fillStyle = c.opened ? '#6e563e' : isArabia(c) ? '#b98a56' : '#f5b942';
    ctx.fillRect(c.x - 22, c.y - 14, 44, 28);
    ctx.strokeStyle = '#2b1c0c';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(c.x - 22, c.y - 14, 44, 28);
    ctx.strokeRect(c.x - 5, c.y - 4, 10, 8);
  });

  floor.props.forEach(p => drawProp(p));

  state.entities.filter(e => e.sceneId === state.activeSceneId && e.floor === floorIdx).forEach(ent => {
    drawCharacterToken(ent, isBelow);
  });
}

function drawCharacterToken(ent, isBelow) {
  const cx=ent.x,cy=ent.y,now=performance.now();
  let lift=0;
  if(ent.jumpUntil && now<ent.jumpUntil){
    const t=1-(ent.jumpUntil-now)/380;
    lift=Math.sin(Math.PI*Math.max(0,Math.min(1,t)))*21;
  }
  const moving=ent.walkingUntil>now;
  const stride=moving?Math.sin(now/90)*3:0;
  const hostile=ent.attitude==='Hostil';
  const isMonster=ent.role==='Monstro'||ent.role==='Fera';
  const body=ent.color||'#688aab';
  ctx.save();
  // Silhueta superior em vez de um emoji circular: pés, torso, rosto e equipamento.
  ctx.fillStyle='rgba(0,0,0,.3)';
  ctx.beginPath();ctx.ellipse(cx+3,cy+9,15+lift*.15,8+lift*.1,0,0,Math.PI*2);ctx.fill();
  ctx.translate(cx,cy-lift);
  if(state.timeOfDay==='night'){
    const light=ctx.createRadialGradient(0,0,3,0,0,70);
    light.addColorStop(0,'rgba(255,210,128,.16)');light.addColorStop(1,'rgba(255,210,128,0)');
    ctx.fillStyle=light;ctx.beginPath();ctx.arc(0,0,70,0,7);ctx.fill();
  }
  if(isMonster){
    const beast=ent.icon==='🐉'||ent.icon==='🐺';
    ctx.fillStyle=body;ctx.strokeStyle='#233029';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,3,beast?16:12,beast?11:13,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=ent.icon==='💀'?'#d7d5bd':'#6a8762';
    ctx.beginPath();ctx.arc(0,-6,beast?10:9,0,7);ctx.fill();
    ctx.fillStyle=hostile?'#f45d54':'#fff5d8';
    for(const x of [-4,4]){ctx.beginPath();ctx.arc(x,-8,2,0,7);ctx.fill();}
    if(beast){ctx.strokeStyle=body;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(8,5);ctx.lineTo(19,13);ctx.stroke();}
  }else{
    ctx.fillStyle='#2b2c38';
    ctx.fillRect(-10,6+stride,7,12);ctx.fillRect(3,6-stride,7,12);
    ctx.fillStyle=body;ctx.strokeStyle='#263044';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(-11,-8,22,21,5);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e6b48d';
    ctx.beginPath();ctx.arc(0,-12,9,0,7);ctx.fill();
    ctx.fillStyle=ent.role==='Arcanista'?'#534390':'#62442a';
    ctx.beginPath();ctx.arc(0,-16,9,Math.PI,Math.PI*2);ctx.fill();
    ctx.fillStyle='#292229';ctx.fillRect(-4,-12,2,2);ctx.fillRect(3,-12,2,2);
    ctx.strokeStyle='#c2a98c';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(-10,-3);ctx.lineTo(-15,8-stride);ctx.moveTo(10,-3);ctx.lineTo(15,8+stride);ctx.stroke();
    if(ent.inventory?.some(x=>/Espada|Lança|Cajado|Arco/i.test(x))){
      ctx.strokeStyle='#bdc8d8';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(15,8+stride);ctx.lineTo(18,-14);ctx.stroke();
    }
  }
  if(ent.id===state.selectedEntityId){
    ctx.strokeStyle='#f5b942';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,5,21,17,0,0,7);ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.font='bold 11px system-ui';ctx.textAlign='center';
  const labelW=ctx.measureText(ent.name).width+11;
  ctx.fillStyle='rgba(14,18,25,.88)';
  ctx.fillRect(cx-labelW/2,cy-44-lift,labelW,15);
  ctx.fillStyle='#f4f5f8';ctx.fillText(ent.name,cx,cy-32-lift);
  if(!isBelow&&ent.speech)drawSpeechBubble(cx,cy-50-lift,ent.speech);
  ctx.restore();
}

function drawFutureProp(p){
  const x=p.x,y=p.y;
  ctx.save();ctx.translate(x,y);ctx.rotate((p.rot||0)*Math.PI/2);
  ctx.fillStyle='rgba(0,0,0,.33)';ctx.fillRect(-24,-12,50,32);
  const casing='#d2e0e9',edge='#597589',light='#5cd4dd',brass='#dbad62';
  if(p.type==='log'){
    ctx.fillStyle=casing;ctx.fillRect(-70,-11,140,22);
    ctx.strokeStyle=light;ctx.lineWidth=2;ctx.strokeRect(-70,-11,140,22);
    for(let i=-60;i<65;i+=20){ctx.fillStyle=brass;ctx.fillRect(i,-7,4,14);}
  }else if(['tree','pine','fruitTree','bush'].includes(p.type)){
    ctx.fillStyle='#7cae96';ctx.beginPath();ctx.arc(0,0,p.type==='bush'?16:27,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=light;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#79ba94';
    for(let i=0;i<5;i++){let a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(Math.cos(a)*12,Math.sin(a)*12,5,0,Math.PI*2);ctx.fill();}
    if(p.type==='fruitTree'){ctx.fillStyle='#e87769';ctx.fillRect(-4,-4,8,8);}
  }else if(p.type==='rock'){
    ctx.fillStyle='#677581';ctx.beginPath();ctx.moveTo(-18,9);ctx.lineTo(-12,-14);ctx.lineTo(8,-17);ctx.lineTo(21,4);ctx.lineTo(8,15);ctx.closePath();ctx.fill();
    ctx.strokeStyle=light;ctx.lineWidth=2;ctx.stroke();
  }else if(p.type==='barrel'){
    ctx.fillStyle=casing;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.strokeStyle=brass;ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle=edge;ctx.fillRect(-7,-8,14,16);ctx.fillStyle=light;ctx.fillRect(-3,-4,6,8);
  }else if(p.type==='hearth'){
    ctx.fillStyle=edge;ctx.fillRect(-33,-20,66,40);ctx.fillStyle=casing;ctx.fillRect(-28,-15,56,30);
    ctx.fillStyle='#df9859';ctx.fillRect(-20,-9,40,18);ctx.fillStyle='#ffdf86';ctx.fillRect(-9,-6,18,12);
    ctx.strokeStyle=light;ctx.strokeRect(-33,-20,66,40);
  }else if(p.type==='table'){
    ctx.fillStyle=edge;ctx.fillRect(-36,-21,72,42);ctx.fillStyle=casing;ctx.fillRect(-32,-18,64,36);
    ctx.strokeStyle=brass;ctx.lineWidth=2;ctx.strokeRect(-32,-18,64,36);
    ctx.fillStyle=light;ctx.fillRect(-8,-2,16,4);
  }else if(p.type==='chair'){
    ctx.fillStyle=casing;ctx.fillRect(-14,-14,28,28);ctx.strokeStyle=edge;ctx.lineWidth=3;ctx.strokeRect(-14,-14,28,28);
    ctx.fillStyle=brass;ctx.fillRect(-12,-14,24,5);ctx.fillStyle=light;ctx.fillRect(-4,-5,8,10);
  }else if(p.type==='bed'){
    ctx.fillStyle=edge;ctx.fillRect(-25,-32,50,64);ctx.fillStyle=casing;ctx.fillRect(-21,-28,42,56);
    ctx.fillStyle='#8b7191';ctx.fillRect(-17,-4,34,29);ctx.fillStyle='#d1dcd9';ctx.fillRect(-17,-24,34,14);
    ctx.strokeStyle=light;ctx.lineWidth=2;ctx.strokeRect(-25,-32,50,64);
  }else if(p.type==='bookshelf'){
    ctx.fillStyle=edge;ctx.fillRect(-28,-19,56,38);ctx.fillStyle=casing;ctx.fillRect(-25,-16,50,32);
    for(let i=-18;i<=18;i+=12){ctx.fillStyle=i%24===0?brass:light;ctx.fillRect(i,-12,6,24);}
    ctx.strokeStyle=brass;ctx.lineWidth=2;ctx.strokeRect(-28,-19,56,38);
  }
  ctx.restore();
}

function drawArabiaProp(p){
  const x=p.x,y=p.y,t=p.type;
  ctx.save();ctx.translate(x,y);
  const palm=t==='palm'||(['tree','pine','fruitTree'].includes(t)&&isArabia(p));
  if(palm){
    ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(7,8,25,13,0,0,7);ctx.fill();
    ctx.fillStyle='#8d6746';ctx.beginPath();ctx.arc(0,0,7,0,7);ctx.fill();
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9;ctx.strokeStyle=i%2?'#5c8549':'#3d754b';ctx.lineWidth=7;
      ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(a)*16,Math.sin(a)*16,Math.cos(a)*32,Math.sin(a)*32);ctx.stroke();}
    ctx.fillStyle='#b18b53';ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();
  } else if(t==='desertTree'){
    ctx.strokeStyle='#806344';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,10);ctx.lineTo(0,-9);ctx.stroke();
    for(const [dx,dy] of [[-16,-12],[13,-14],[0,-22]]){ctx.fillStyle='#72854c';ctx.beginPath();ctx.arc(dx,dy,13,0,7);ctx.fill();}
  } else if(t==='tent'){
    ctx.fillStyle='#b97851';ctx.beginPath();ctx.moveTo(-40,25);ctx.lineTo(0,-33);ctx.lineTo(40,25);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#714b3a';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#e5c592';ctx.beginPath();ctx.moveTo(0,-33);ctx.lineTo(0,25);ctx.lineTo(36,25);ctx.closePath();ctx.fill();
    ctx.fillStyle='#553c31';ctx.beginPath();ctx.moveTo(-9,25);ctx.lineTo(0,1);ctx.lineTo(9,25);ctx.fill();
  } else if(t==='oilLamp'){
    ctx.fillStyle='#b78b49';ctx.beginPath();ctx.ellipse(0,3,17,10,0,0,7);ctx.fill();
    ctx.fillStyle='#f1c86a';ctx.fillRect(-8,-8,16,10);ctx.strokeStyle='#825321';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(15,0,8,-1.2,1.3);ctx.stroke();ctx.fillStyle='#efae37';ctx.beginPath();ctx.arc(0,-12,5,0,7);ctx.fill();
  } else if(t==='cushions'||t==='chair'){
    for(const [dx,dy,c] of [[-11,0,'#9d4045'],[10,2,'#d39e4c']]){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(dx,dy,14,11,0,0,7);ctx.fill();}
  } else if(t==='table'){
    ctx.fillStyle='#b17a48';ctx.beginPath();ctx.arc(0,0,27,0,7);ctx.fill();ctx.strokeStyle='#dfbd83';ctx.lineWidth=5;ctx.stroke();
  } else if(t==='bed'){ctx.fillStyle='#d8b67f';ctx.fillRect(-26,-31,52,62);ctx.fillStyle='#9d3d51';ctx.fillRect(-20,-15,40,40);}
  else if(t==='bookshelf'){ctx.fillStyle='#c59c69';ctx.fillRect(-27,-18,54,36);ctx.strokeStyle='#916b44';ctx.lineWidth=4;ctx.strokeRect(-27,-18,54,36);}
  else if(t==='barrel'||t==='hearth'){ctx.fillStyle='#ab7f4d';ctx.beginPath();ctx.arc(0,0,20,0,7);ctx.fill();}
  else{ctx.restore();drawProp({...p,style:'normal'});return;}
  ctx.restore();
}

function drawExpandedProp(p){
 const t=p.type,x=p.x,y=p.y;
 const set=new Set(['bench','cabinet','desk','sofa','lowTable','console','lamp','cactus','flowers','reeds','crystal','urn','crate','rug','screen','fountain','torch']);
 if(!set.has(t))return false;
 ctx.save();ctx.translate(x,y);ctx.rotate(((p.rot||0)%4)*Math.PI/2);
 const future=isRetroFuture(p),arabia=isArabia(p);
 const wood=arabia?'#bd9563':future?'#c7dbe4':'#885a35';
 const edge=arabia?'#79523a':future?'#5f8b9a':'#4b3022';
 ctx.fillStyle='rgba(0,0,0,.24)';ctx.fillRect(-24,-16,52,34);
 if(['bench','desk','sofa','lowTable','console'].includes(t)){
   const widths={bench:60,desk:62,sofa:67,lowTable:48,console:54},w=widths[t];
   ctx.fillStyle=edge;ctx.fillRect(-w/2-2,-19,w+4,38);
   ctx.fillStyle=t==='sofa'?'#a77b73':wood;ctx.fillRect(-w/2,-16,w,32);
   ctx.strokeStyle=future?'#45bfc9':'#d7b079';ctx.lineWidth=2;ctx.strokeRect(-w/2+3,-13,w-6,26);
   if(t==='console'){ctx.fillStyle='#75e9e1';ctx.fillRect(-18,-10,36,16);}
   if(t==='sofa'){ctx.fillStyle='#dfbcb1';ctx.fillRect(-w/2,-16,w,9);}
 }else if(['cabinet','screen','crate'].includes(t)){
   const w=t==='screen'?54:42,h=t==='screen'?12:44;
   ctx.fillStyle=edge;ctx.fillRect(-w/2-2,-h/2-2,w+4,h+4);
   ctx.fillStyle=wood;ctx.fillRect(-w/2,-h/2,w,h);
   ctx.strokeStyle=future?'#58d4df':'#e4b97a';ctx.lineWidth=2;
   ctx.strokeRect(-w/2+4,-h/2+4,w-8,h-8);
   if(t==='cabinet'){ctx.fillStyle=edge;ctx.fillRect(-2,-h/2,4,h);}
 }else if(['lamp','torch','urn'].includes(t)){
   ctx.fillStyle=edge;ctx.beginPath();ctx.ellipse(0,6,14,8,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=t==='urn'?'#c6a27c':wood;ctx.beginPath();ctx.ellipse(0,0,11,15,0,0,Math.PI*2);ctx.fill();
   if(t!=='urn'){ctx.fillStyle=future?'#85e8f2':'#f7bd62';ctx.beginPath();ctx.arc(0,-12,9,0,Math.PI*2);ctx.fill();}
 }else if(['cactus','reeds','flowers'].includes(t)){
   ctx.strokeStyle=t==='cactus'?'#4a8459':'#577648';ctx.lineWidth=t==='cactus'?8:3;
   for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*5,12);ctx.lineTo(i*7,-14+Math.abs(i)*5);ctx.stroke();}
   if(t==='flowers'){ctx.fillStyle='#e79bac';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.arc(i*7,-12+Math.abs(i)*5,4,0,Math.PI*2);ctx.fill();}}
 }else if(t==='crystal'){
   ctx.fillStyle='#6ae2e0';ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(18,-3);ctx.lineTo(6,18);ctx.lineTo(-16,7);ctx.closePath();ctx.fill();ctx.strokeStyle='#e6fbff';ctx.lineWidth=2;ctx.stroke();
 }else if(t==='rug'){
   ctx.fillStyle=arabia?'#a14551':'#744b79';ctx.fillRect(-30,-22,60,44);
   ctx.strokeStyle='#d8ad6e';ctx.lineWidth=4;ctx.strokeRect(-26,-18,52,36);
 }else if(t==='fountain'){
   ctx.fillStyle='#9aa8a9';ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#49a9c5';ctx.beginPath();ctx.arc(0,0,21,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#b5edf4';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();return true;
}

function drawProp(p) {
  if(drawExpandedProp(p))return;
  if(p.type==='key'){
    ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle='#e7be4c';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(-5,-2,5,0,Math.PI*2);ctx.moveTo(0,0);ctx.lineTo(15,11);ctx.moveTo(9,6);ctx.lineTo(7,11);ctx.moveTo(13,9);ctx.lineTo(11,14);ctx.stroke();
    ctx.restore();return;
  }
  if(isRetroFuture(p)) {drawFutureProp(p); return;}
  if(isArabia(p) || ['palm','desertTree','tent','oilLamp','cushions'].includes(p.type)){drawArabiaProp(p);return;}
  const cx = p.x;
  const cy = p.y;

  if (p.type === 'log') {
    ctx.save();ctx.translate(cx,cy);
    ctx.rotate(((p.rot||0)%4)*Math.PI/2);
    ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(-70,-9,140,22);
    ctx.fillStyle='#85532b';ctx.fillRect(-70,-11,140,21);
    ctx.strokeStyle='#402616';ctx.lineWidth=3;ctx.strokeRect(-70,-11,140,21);
    ctx.strokeStyle='rgba(221,162,94,.65)';ctx.lineWidth=1;
    for(let i=-54;i<70;i+=23){ctx.beginPath();ctx.moveTo(i,-9);ctx.lineTo(i+5,7);ctx.stroke();}
    ctx.fillStyle='#af7844';ctx.fillRect(-68,-8,6,15);
    ctx.restore();
  } else if (p.type === 'tree' || p.type === 'fruitTree') {
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
