const TERRAIN_PALETTES = {
    grass:         { base: '#385e2b', dark: '#27451d', light: '#4e7d3c', accent: '#e8d96f' },
    grassLush:     { base: '#244a27', dark: '#163319', light: '#346938', accent: '#68a357' },
    grassDry:      { base: '#7d7236', dark: '#5e5423', light: '#9e9149', accent: '#c9ba6b' },
    dirt:          { base: '#694930', dark: '#4a311e', light: '#856042', accent: '#9c7a5b' },
    mud:           { base: '#3d2c22', dark: '#241811', light: '#543e31', accent: '#6e5c4f' },
    sand:          { base: '#cfa963', dark: '#b38c46', light: '#e3c281', accent: '#f5dfa9' },
    snow:          { base: '#dce7f2', dark: '#b9cbe0', light: '#ffffff', accent: '#8fb4db' },
    ice:           { base: '#6ea8cc', dark: '#497fa3', light: '#b8e2fa', accent: '#ffffff' },
    gravel:        { base: '#5e646e', dark: '#3f444d', light: '#7d8491', accent: '#9ca3af' },
    cave:          { base: '#2c3038', dark: '#1a1d24', light: '#3f4552', accent: '#525b6b' },
    basalt:        { base: '#232329', dark: '#121217', light: '#35353d', accent: '#ff5722' },
    lava:          { base: '#291512', dark: '#140806', light: '#e65100', accent: '#ffca28' },
    water:         { base: '#1874c4', dark: '#0f5494', light: '#3898eb', accent: '#a8dcff' },
    swampWater:    { base: '#2b4d36', dark: '#1b3323', light: '#3e6b4c', accent: '#84cc16' },
    alienMycelium: { base: '#3a1d5c', dark: '#230f3b', light: '#572d87', accent: '#e879f9' },
    alienCrystal:  { base: '#134e5e', dark: '#0a2f38', light: '#1f748a', accent: '#67e8f9' },
    alienCrimson:  { base: '#8c3427', dark: '#5e1f16', light: '#b34837', accent: '#e07a5f' },
    alienBlight:   { base: '#2d3b32', dark: '#1a241e', light: '#3f5246', accent: '#a3e635' }
  };

const PATTERN_CACHE = new Map();

// Gerador determinístico para evitar ruído aleatório piscando a cada frame
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function getTerrainPattern(ctx, mat) {
  if (PATTERN_CACHE.has(mat)) return PATTERN_CACHE.get(mat);

  const size = 256;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const octx = off.getContext('2d');
  const rand = seededRandom(mat.split('').reduce((a, c) => a + c.charCodeAt(0), 1337));

  // 1. Cor base + granulação mineral/orgânica em 3 camadas
  const p = TERRAIN_PALETTES[mat];
  octx.fillStyle = p.base;
  octx.fillRect(0, 0, size, size);

  // Manchas orgânicas de variação de solo (wrap nas bordas para tiling perfeito)
  for (let i = 0; i < 90; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 8 + rand() * 24;
    octx.fillStyle = rand() > 0.5 ? p.dark : p.light;
    octx.globalAlpha = 0.14;
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        octx.beginPath();
        octx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        octx.fill();
      }
    }
  }

  // Micro-granulação (areia, terra, poeira marciana, neve)
  octx.globalAlpha = 0.25;
  for (let i = 0; i < 450; i++) {
    const x = rand() * size;
    const y = rand() * size;
    octx.fillStyle = rand() > 0.4 ? p.dark : p.light;
    octx.fillRect(x, y, 2, 2);
  }

  // Detalhes específicos de cada bioma
  octx.globalAlpha = 0.55;
  if (mat.startsWith('grass')) {
    // Tufos de grama e flores raras
    for (let i = 0; i < 110; i++) {
      const gx = rand() * size;
      const gy = rand() * size;
      octx.strokeStyle = rand() > 0.3 ? p.light : p.dark;
      octx.lineWidth = 1.3;
      octx.beginPath();
      octx.moveTo(gx, gy); octx.lineTo(gx - 3, gy - 6);
      octx.moveTo(gx, gy); octx.lineTo(gx + 1, gy - 7);
      octx.moveTo(gx, gy); octx.lineTo(gx + 4, gy - 5);
      octx.stroke();

      if (mat === 'grass' && rand() > 0.92) {
        octx.fillStyle = p.accent;
        octx.beginPath(); octx.arc(gx, gy - 6, 1.8, 0, Math.PI * 2); octx.fill();
      }
    }
  } else if (mat === 'gravel' || mat === 'cave' || mat === 'dirt') {
    // Pedrinhas e fissuras
    for (let i = 0; i < 75; i++) {
      const rx = rand() * size;
      const ry = rand() * size;
      const rw = 3 + rand() * 6;
      octx.fillStyle = rand() > 0.5 ? p.dark : p.accent;
      octx.beginPath();
      octx.ellipse(rx, ry, rw, rw * 0.7, rand() * Math.PI, 0, Math.PI * 2);
      octx.fill();
    }
  } else if (mat === 'sand' || mat === 'alienCrimson') {
    // Ondulações de dunas
    octx.strokeStyle = p.light;
    octx.lineWidth = 1.5;
    for (let y = 16; y < size; y += 32) {
      octx.beginPath();
      for (let x = 0; x <= size; x += 16) {
        const wy = y + Math.sin((x / size) * Math.PI * 2) * 4;
        x === 0 ? octx.moveTo(x, wy) : octx.lineTo(x, wy);
      }
      octx.stroke();
    }
  } else if (mat === 'basalt' || mat === 'lava' || mat === 'alienBlight') {
    // Veios incandescentes / ácidos
    octx.strokeStyle = p.accent;
    octx.lineWidth = mat === 'lava' ? 3 : 1.5;
    for (let i = 0; i < 14; i++) {
      let cx = rand() * size, cy = rand() * size;
      octx.beginPath();
      octx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (rand() - 0.5) * 48;
        cy += (rand() - 0.5) * 48;
        octx.lineTo(cx, cy);
      }
      octx.stroke();
    }
  } else if (mat === 'alienMycelium' || mat === 'alienCrystal' || mat === 'ice') {
    // Cristais / esporos bioluminescentes
    for (let i = 0; i < 36; i++) {
      const cx = rand() * size;
      const cy = rand() * size;
      octx.fillStyle = p.accent;
      octx.beginPath();
      octx.moveTo(cx, cy - 6);
      octx.lineTo(cx + 4, cy);
      octx.lineTo(cx, cy + 6);
      octx.lineTo(cx - 4, cy);
      octx.closePath();
      octx.fill();
    }
  }

  if (['water','swampWater','mud','snow'].includes(mat)) {
    for(let i=0;i<65;i++){
      const x=rand()*size,y=rand()*size,r=2+rand()*13;
      octx.strokeStyle=i%3?p.light:p.accent;
      octx.beginPath();
      octx.ellipse(x,y,r,r*.29,0,0,Math.PI*2);
      octx.stroke();
    }
  }
  octx.globalAlpha = 1;
  const pattern = ctx.createPattern(off, 'repeat');
  PATTERN_CACHE.set(mat, pattern);
  return pattern;
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
    stroke={mat,shape:mode==='spray'?'spray':'redondo',size,softness,terrain:true,points:[]};
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
  ctx.fillStyle=getTerrainPattern(ctx,stroke.mat);
  for(const [diameter,alpha] of [[size*(1+stroke.softness),stroke.softness*.6],[size,1]]){
    if(!alpha)continue;
    ctx.globalAlpha=alpha;
    ctx.beginPath();
    for(const point of stroke.points){
      ctx.moveTo(point.x+diameter/2,point.y);
      ctx.arc(point.x,point.y,diameter/2,0,Math.PI*2);
    }
    ctx.fill();
  }
  ctx.restore();
}
