const TERRAIN_PALETTES = {
    grass:         { base: '#3b632c', dark: '#25421a', mid: '#4d7d39', light: '#6fa352', accent: '#f0dc6e' },
    grassLush:     { base: '#214725', dark: '#112914', mid: '#2f6134', light: '#47854b', accent: '#82bf69' },
    grassDry:      { base: '#877938', dark: '#5c5120', mid: '#a39246', light: '#c4b25e', accent: '#e3d286' },
    dirt:          { base: '#6e4c31', dark: '#472f1c', mid: '#875e3e', light: '#a37754', accent: '#bfa082' },
    mud:           { base: '#3b2a20', dark: '#1f140e', mid: '#4f382b', light: '#694d3d', accent: '#877264' },
    sand:          { base: '#d1ab62', dark: '#b08943', mid: '#e3c07b', light: '#f5da9d', accent: '#fff0c2' },
    snow:          { base: '#e1ecf7', dark: '#b8cce0', mid: '#edf5fc', light: '#ffffff', accent: '#95b6d6' },
    ice:           { base: '#65a5cc', dark: '#3e779c', mid: '#8bc2e3', light: '#ccebfa', accent: '#ffffff' },
    gravel:        { base: '#5a606b', dark: '#383d45', mid: '#737a87', light: '#929aa8', accent: '#b8c0cc' },
    cave:          { base: '#2a2e38', dark: '#161920', mid: '#3b414f', light: '#525a6e', accent: '#6d778f' },
    basalt:        { base: '#212228', dark: '#101014', mid: '#31333d', light: '#474a57', accent: '#ff5a1f' },
    lava:          { base: '#26120f', dark: '#120705', mid: '#591c12', light: '#ea580c', accent: '#facc15' },
    water:         { base: '#166ec0', dark: '#0d4b87', mid: '#2589e3', light: '#5cb2ff', accent: '#bfe6ff' },
    swampWater:    { base: '#294a34', dark: '#172e1f', mid: '#396648', light: '#528762', accent: '#9be13c' },
    alienMycelium: { base: '#361959', dark: '#1d0b33', mid: '#502682', light: '#733bb5', accent: '#f062fe' },
    alienCrystal:  { base: '#114a5c', dark: '#082933', mid: '#1a6e87', light: '#2d99b8', accent: '#7cf4ff' },
    alienCrimson:  { base: '#8c3123', dark: '#571a11', mid: '#b04332', light: '#d15c47', accent: '#f29479' },
    alienBlight:   { base: '#2b3830', dark: '#161f19', mid: '#3d5245', light: '#55705f', accent: '#a8ff35' }
  };

const TERRAIN_TILES = new Map();
const PATTERN_CACHE = new Map();


function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Desenha primitiva repetida nos 9 quadrantes (-size, 0, +size) para borda sem emenda
function drawTiled(octx, size, fn) {
  for (const ox of [-size, 0, size]) {
    for (const oy of [-size, 0, size]) {
      octx.save();
      octx.translate(ox, oy);
      fn(octx);
      octx.restore();
    }
  }
}

function getTerrainTile(mat) {
  if (TERRAIN_TILES.has(mat)) return TERRAIN_TILES.get(mat);

  const size = 512;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const octx = off.getContext('2d');
  const seed = mat.split('').reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 17), 4099);
  const rand = seededRandom(seed);

  const p = TERRAIN_PALETTES[mat];

  // 1. Base sólida + manchas largas de relevo
  octx.fillStyle = p.base;
  octx.fillRect(0, 0, size, size);

  for (let i = 0; i < 140; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 14 + rand() * 38;
    const col = rand() > 0.5 ? p.mid : p.dark;
    const alpha = 0.14 + rand() * 0.12;
    drawTiled(octx, size, g => {
      g.globalAlpha = alpha;
      g.fillStyle = col;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    });
  }

  // 2. Micro-grão tátil de alta densidade (elimina aspecto liso)
  for (let i = 0; i < 1800; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const s = 1.2 + rand() * 2.2;
    octx.globalAlpha = 0.18 + rand() * 0.2;
    octx.fillStyle = rand() > 0.45 ? p.dark : p.light;
    octx.fillRect(x, y, s, s);
    if(x+s>size)octx.fillRect(x-size,y,s,s);
    if(y+s>size)octx.fillRect(x,y-size,s,s);
    if(x+s>size&&y+s>size)octx.fillRect(x-size,y-size,s,s);
  }

  // 3. Camadas de detalhe características de cada solo
  octx.globalAlpha = 1;

  if (mat === 'grass' || mat === 'grassLush' || mat === 'grassDry') {
    const tuftCount = mat === 'grassLush' ? 420 : 300;
    for (let i = 0; i < tuftCount; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const h = mat === 'grassLush' ? 9 + rand() * 6 : 6 + rand() * 5;
      const lean = (rand() - 0.5) * 6;
      const color=rand()>.35?p.light:p.mid;
      const flower=mat==='grass'&&rand()>.94;
      drawTiled(octx, size, g => {
        // Sombra de base da grama
        g.fillStyle = p.dark;
        g.globalAlpha = 0.45;
        g.beginPath();
        g.ellipse(x, y + 1, 5, 2.2, 0, 0, Math.PI * 2);
        g.fill();

        // Fios de relva
        g.globalAlpha = 0.85;
        g.strokeStyle = color;
        g.lineWidth = 1.6;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(x - 2, y); g.lineTo(x - 4 + lean, y - h);
        g.moveTo(x, y);     g.lineTo(x + lean, y - h - 2);
        g.moveTo(x + 2, y); g.lineTo(x + 4 + lean, y - h + 1);
        g.stroke();

        if (flower) {
          g.fillStyle = p.accent;
          g.beginPath();
          g.arc(x + lean, y - h - 2, 2.2, 0, Math.PI * 2);
          g.fill();
        }
      });
    }
  } else if (mat === 'dirt' || mat === 'mud') {
    // Torrões, pedrinhas e sulcos de solo
    for (let i = 0; i < 240; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const rx = 2.5 + rand() * 5.5;
      const ry = 2 + rand() * 4;
      const rot = rand() * Math.PI;
      const color=rand()>.4?p.light:p.mid;
      drawTiled(octx, size, g => {
        g.save();
        g.translate(x, y);
        g.rotate(rot);
        g.globalAlpha = 0.55;
        g.fillStyle = p.dark;
        g.beginPath();
        g.ellipse(1.5, 1.5, rx, ry, 0, 0, Math.PI * 2);
        g.fill();

        g.fillStyle = color;
        g.beginPath();
        g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      });
    }
    if (mat === 'mud') {
      // Brilho de poças úmidas
      for (let i = 0; i < 28; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const rx = 12 + rand() * 22;
        const ry = 6 + rand() * 11;
        const angle=(rand()-.5)*.4;
        drawTiled(octx, size, g => {
          g.globalAlpha = 0.25;
          g.fillStyle = p.accent;
          g.beginPath();
          g.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
          g.fill();
        });
      }
    }
  } else if (mat === 'gravel' || mat === 'cave') {
    // Mosaico denso de pedras com sombra
    const count = mat === 'gravel' ? 360 : 180;
    for (let i = 0; i < count; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = mat === 'gravel' ? 3 + rand() * 5 : 6 + rand() * 11;
      const color=rand()>.5?p.mid:p.light;
      drawTiled(octx, size, g => {
        g.globalAlpha = 0.65;
        g.fillStyle = p.dark;
        g.beginPath();
        g.arc(x + 2, y + 2, r, 0, Math.PI * 2);
        g.fill();

        g.fillStyle = color;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      });
    }
  } else if (mat === 'sand' || mat === 'alienCrimson') {
    // Dunas onduladas e granulação
    for (let y = 16; y < size; y += 32) {
      const amp = 4 + rand() * 4;
      const phase = rand() * Math.PI * 2;
      drawTiled(octx, size, g => {
        g.globalAlpha = 0.35;
        g.strokeStyle = p.light;
        g.lineWidth = 2;
        g.beginPath();
        for (let x = 0; x <= size; x += 16) {
          const wy = y + Math.sin((x / size) * Math.PI * 2 + phase) * amp;
          x === 0 ? g.moveTo(x, wy) : g.lineTo(x, wy);
        }
        g.stroke();

        g.globalAlpha = 0.22;
        g.strokeStyle = p.dark;
        g.beginPath();
        for (let x = 0; x <= size; x += 16) {
          const wy = y + 4 + Math.sin((x / size) * Math.PI * 2 + phase) * amp;
          x === 0 ? g.moveTo(x, wy) : g.lineTo(x, wy);
        }
        g.stroke();
      });
    }
  } else if (mat === 'snow' || mat === 'ice') {
    // Fraturas de gelo ou relevo de neve
    for (let i = 0; i < 45; i++) {
      let x = rand() * size;
      let y = rand() * size;
      const points=[[x,y]];
      for(let step=0;step<4;step++){
        x+=(rand()-.5)*34;
        y+=(rand()-.5)*34;
        points.push([x,y]);
      }
      drawTiled(octx, size, g => {
        g.globalAlpha = mat === 'ice' ? 0.65 : 0.4;
        g.strokeStyle = mat === 'ice' ? p.accent : p.dark;
        g.lineWidth = mat === 'ice' ? 1.5 : 2;
        g.beginPath();
        g.moveTo(...points[0]);
        for(const point of points.slice(1))g.lineTo(...point);
        g.stroke();
      });
    }
  } else if (mat === 'basalt' || mat === 'lava' || mat === 'alienBlight') {
    // Fissuras luminescentes / crostas
    const veinCount = mat === 'lava' ? 42 : 28;
    for (let i = 0; i < veinCount; i++) {
      let x = rand() * size;
      let y = rand() * size;
      const points=[[x,y]];
      for(let step=0;step<5;step++){
        x+=(rand()-.5)*42;
        y+=(rand()-.5)*42;
        points.push([x,y]);
      }
      drawTiled(octx, size, g => {
        g.globalAlpha = mat === 'lava' ? 0.9 : 0.65;
        g.strokeStyle = p.accent;
        g.lineWidth = mat === 'lava' ? 3.5 : 1.8;
        g.beginPath();
        g.moveTo(...points[0]);
        for(const point of points.slice(1))g.lineTo(...point);
        g.stroke();
      });
    }
  } else if (mat === 'alienMycelium' || mat === 'alienCrystal') {
    // Rede de filamentos e cristais/esporos
    for (let i = 0; i < 34; i++) {
      let x = rand() * size;
      let y = rand() * size;
      const points=[[x,y]];
      for(let step=0;step<4;step++){
        x+=(rand()-.5)*46;
        y+=(rand()-.5)*46;
        points.push([x,y]);
      }
      drawTiled(octx, size, g => {
        g.globalAlpha = 0.5;
        g.strokeStyle = p.light;
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(...points[0]);
        for(const point of points.slice(1))g.lineTo(...point);
        g.stroke();

        g.globalAlpha = 0.9;
        g.fillStyle = p.accent;
        g.beginPath();
        g.arc(x, y, 2.8, 0, Math.PI * 2);
        g.fill();
      });
    }
  } else if (mat === 'water' || mat === 'swampWater') {
    // Ondulações e brilhos na água
    for (let i = 0; i < 65; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = 14 + rand() * 24;
      drawTiled(octx, size, g => {
        g.globalAlpha = 0.35;
        g.strokeStyle = p.accent;
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + w * 0.5, y - 4, x + w, y);
        g.stroke();
      });
    }
  }

  TERRAIN_TILES.set(mat, off);
  return off;
}

function getTerrainPattern(context,mat) {
  if(!PATTERN_CACHE.has(mat))PATTERN_CACHE.set(mat,context.createPattern(getTerrainTile(mat),'repeat'));
  return PATTERN_CACHE.get(mat);
}

function createTerrainThumbnail(mat) {
  const thumbnail=document.createElement('canvas');
  thumbnail.width=thumbnail.height=32;
  thumbnail.className='terrain-preview';
  thumbnail.setAttribute('aria-hidden','true');
  thumbnail.getContext('2d').drawImage(getTerrainTile(mat),72,72,96,96,0,0,32,32);
  return thumbnail;
}

const TERRAIN_GROUPS = [
  ['Campos e florestas', [['grass','Grama Campestre'],['grassLush','Grama Densa'],['grassDry','Savana'],['dirt','Terra Batida'],['mud','Lama'],['sand','Areia do Deserto']]],
  ['Climas extremos', [['snow','Neve Profunda'],['ice','Gelo Glacial'],['gravel','Cascalho']]],
  ['Subsolo e líquidos', [['cave','Chão de caverna'],['basalt','Basalto'],['lava','Lava'],['water','Água Cristalina'],['swampWater','Água Pantanosa']]],
  ['Solos alienígenas', [['alienMycelium','Micélio Violáceo'],['alienCrystal','Solo Cristalino'],['alienCrimson','Solo Carmesim'],['alienBlight','Solo Corrompido']]]
];

function terrainIsBlocked(mat) {
  return ['water','kenney_water','swampWater','lava','space','void'].includes(mat);
}

function drawCachedTerrain(mat,x,y,w,h) {
  if(!Object.hasOwn(TERRAIN_PALETTES,mat))return false;
  ctx.fillStyle=getTerrainPattern(ctx,mat);
  ctx.fillRect(x,y,w,h);
  if(mat==='lava'){
    ctx.save();
    ctx.globalAlpha=.05+.04*Math.sin(animTick);
    ctx.fillStyle='#ff841a';
    ctx.fillRect(x,y,w,h);
    ctx.restore();
  }
  return true;
}

function chooseTerrainMaterial(mat) {
  state.brush.mat=mat;
  selectTool('terrainBrush');
}

function initTerrainTools() {
  const base=document.getElementById('terrainKind');
  const brush=document.getElementById('terrainPaintMaterial');
  for(const [label,entries] of TERRAIN_GROUPS){
    const group=document.createElement('optgroup');
    group.label=label;
    for(const [id,name] of entries){
      if(!Array.from(base.options).some(option=>option.value===id))base.add(new Option(name,id));
      group.append(new Option(name,id));
    }
    brush.append(group);
  }
}

function applyTerrainBrush(floor,x,y,isDrag) {
  const mode=document.getElementById('terrainPaintMode').value;
  const mat=state.brush.mat;
  if(mode==='fill'){
    if(!isDrag)floor.baseTerrain=mat;
    return;
  }
  if(mode==='rect'){
    dragStart ||= {x,y};
    previewRect={x:Math.min(x,dragStart.x),y:Math.min(y,dragStart.y),
      w:Math.abs(x-dragStart.x),h:Math.abs(y-dragStart.y),mat};
    return;
  }
  const size=Number(document.getElementById('terrainPaintSize').value);
  const softness=Number(document.getElementById('terrainPaintEdge').value);
  let stroke=window.activeBrushStroke;
  if(!isDrag||!stroke){
    stroke={mat,shape:mode==='spray'?'spray':mode==='square'?'quadrado':'redondo',size,softness,terrain:true,points:[]};
    (floor.brushStrokes ||= []).push(stroke);
    window.activeBrushStroke=stroke;
    stroke.last=null;
  }
  if(stroke.last&&Math.hypot(x-stroke.last.x,y-stroke.last.y)<8)return;
  const last=stroke.last||{x,y};
  const steps=Math.max(1,Math.ceil(Math.hypot(x-last.x,y-last.y)/Math.min(8,size/3)));
  for(let i=1;i<=steps;i++){
    const px=last.x+(x-last.x)*i/steps,py=last.y+(y-last.y)*i/steps;
    if(mode==='spray'){
      for(let dot=0;dot<5;dot++){
        const theta=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*size/2;
        stroke.points.push({x:px+r*Math.cos(theta),y:py+r*Math.sin(theta)});
      }
    }else stroke.points.push({x:px,y:py});
  }
  stroke.last={x,y};
  expandFloorToInclude(floor,x,y,size/2);
}

function drawTerrainStroke(stroke) {
  const spread=stroke.shape==='spray';
  const size=spread?stroke.size*.18:stroke.size;
  ctx.save();
  const trace=diameter=>{
    ctx.beginPath();
    const half=diameter/2;
    for(const point of stroke.points){
      if(stroke.shape==='quadrado')ctx.rect(point.x-half,point.y-half,diameter,diameter);
      else{
        ctx.moveTo(point.x+half,point.y);
        ctx.arc(point.x,point.y,half,0,Math.PI*2);
      }
    }
  };
  if(stroke.softness>0&&!spread){
    ctx.globalAlpha=.16*stroke.softness;
    ctx.fillStyle='#12151b';
    trace(size*(1+stroke.softness)+2);
    ctx.fill();
  }
  ctx.fillStyle=getTerrainPattern(ctx,stroke.mat);
  for(const [diameter,alpha] of [[size*(1+stroke.softness),stroke.softness*.6],[size,1]]){
    if(!alpha)continue;
    ctx.globalAlpha=alpha;
    trace(diameter);
    ctx.fill();
  }
  ctx.restore();
}
