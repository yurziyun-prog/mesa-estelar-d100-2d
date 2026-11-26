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
    alienBlight:   { base: '#2b3830', dark: '#161f19', mid: '#3d5245', light: '#55705f', accent: '#a8ff35' },
  dirtTrail:    { base: '#7d5c3e', dark: '#4a3420', mid: '#967150', light: '#b58e6b', accent: '#69625c' },
  cobblePath:   { base: '#595550', dark: '#2e2b28', mid: '#757069', light: '#948e85', accent: '#b3aca2' },
  caveStone:    { base: '#454c54', dark: '#23272c', mid: '#5c6570', light: '#7b8694', accent: '#a8d5e5' },
  caveFungal:   { base: '#2c2b42', dark: '#181726', mid: '#434166', light: '#6c689e', accent: '#b77dff' },
  lavaAbyss:    { base: '#d93800', dark: '#261410', mid: '#ff6a00', light: '#ffb703', accent: '#fff3b0' },
  crystalFloor: { base: '#385870', dark: '#1c2f3d', mid: '#5682a3', light: '#89bce0', accent: '#ccf2ff' },
  dungeonBrick: { base: '#4f4b46', dark: '#24221f', mid: '#69635c', light: '#857e75', accent: '#4e6338' },
  tavernWood:   { base: '#784722', dark: '#3d210c', mid: '#91572b', light: '#ad6b39', accent: '#261407' },
  scifiMetal:   { base: '#49525e', dark: '#262b33', mid: '#606b7a', light: '#7d8a9c', accent: '#38bdf8' },
  scifiGrate:   { base: '#1e2229', dark: '#0d0f12', mid: '#343b47', light: '#525c6e', accent: '#f59e0b' },
  cyberFloor:   { base: '#24222e', dark: '#121117', mid: '#363245', light: '#4e4863', accent: '#e879f9' }
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

  drawCatalogFloorDetails(octx,size,mat,p,rand);
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
  const g=thumbnail.getContext('2d');
  if(waterDefaults[mat]){
    g.fillStyle=waterPattern(mat,waterDefaults[mat].color);
    g.scale(1/3,1/3);
    g.fillRect(0,0,96,96);
  }else g.drawImage(getTerrainTile(mat),72,72,96,96,0,0,32,32);
  return thumbnail;
}

const TERRAIN_GROUPS = [
  ['Campos e florestas', [['grass','Grama Campestre'],['grassLush','Grama Densa'],['grassDry','Savana'],['dirt','Terra Batida'],['mud','Lama'],['sand','Areia do Deserto']]],
  ['Climas extremos', [['snow','Neve Profunda'],['ice','Gelo Glacial'],['gravel','Cascalho']]],
  ['Subsolo e líquidos', [['cave','Chão de caverna'],['basalt','Basalto'],['lava','Lava'],['swampWater','Água Pantanosa']]],
  ['Solos alienígenas', [['alienMycelium','Micélio Violáceo'],['alienCrystal','Solo Cristalino'],['alienCrimson','Solo Carmesim'],['alienBlight','Solo Corrompido']]]
];

function isStackedArea(area) {
  return !area.roof && !isRoofMaterial(area.mat);
}

function orderedSurfaces(floor) {
  const areas=(floor.areas||[]).filter(isStackedArea);
  const strokes=(floor.brushStrokes||[]).filter(stroke=>!stroke.mesaScatter);
  // Mapas antigos não têm uma ordem compartilhada. Preserve as pinceladas
  // sobre as áreas existentes e deixe as pontes antigas visíveis.
  return [...areas.filter(area=>!isBridgeMaterial(area.mat)),...strokes,
    ...areas.filter(area=>isBridgeMaterial(area.mat))]
    .sort((a,b)=>(a.surfaceOrder||0)-(b.surfaceOrder||0));
}

function moveSurfaceToEdge(floor,surface,front) {
  let edge=0;
  for(const item of orderedSurfaces(floor)){
    const order=item.surfaceOrder||0;
    edge=front?Math.max(edge,order):Math.min(edge,order);
  }
  surface.surfaceOrder=edge+(front?1:-1);
  return surface;
}

function topMapSurfaceAt(floor,x,y) {
  return orderedSurfaces(floor).findLast(surface=>surface.points
    ?surface.points.some((point,i)=>brushPointInside(surface,point,x,y,i))
    :pointInArchitectArea(surface,x,y)&&(!surface.fromBuildingId||buildingDistance(x,y,surface)<=0));
}

function highGrassAt(floor,x,y) {
  const surface=topMapSurfaceAt(floor,x,y);
  if(!surface){
    if((floor.buildings||[]).some(room=>room.hasFloor&&buildingDistance(x,y,room)<=0))return null;
    if((floor.caves||[]).some(cave=>insideCave(cave,x,y)))return null;
    const bounds=floor.terrainBounds||floor.bounds;
    if(!bounds||!pointInArchitectArea(bounds,x,y))return null;
  }
  const mat=surface?.mat||floor.baseTerrain;
  return Object.hasOwn(highGrassColors,mat)?mat:null;
}

function terrainIsBlocked(mat) {
  return ['water','kenney_water','swampWater','lava','lavaAbyss','mesaShallows','riverWater','coastSea','space','void'].includes(mat);
}

const terrainMotionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const terrainMotionKinds=new Map([
  ['grass','grass'],['grassLush','grass'],['grassDry','grass'],
  ['riverWater','river'],
  ['water','water'],['coastSea','water'],['swampWater','water'],['mesaShallows','water'],
  ['lava','lava'],['lavaAbyss','lava']
]);

function drawTerrainMotion(mat,x,y,w,h,flow=0,water=null){
  const kind=terrainMotionKinds.get(mat);
  if(!kind||ctx.canvas!==canvas||terrainMotionPreference.matches)return;
  const time=performance.now()/1000;
  const zoom=state.camera.zoom;
  const left=Math.max(x,-state.camera.x/zoom-40);
  const top=Math.max(y,-state.camera.y/zoom-40);
  const right=Math.min(x+w,(canvas.width-state.camera.x)/zoom+40);
  const bottom=Math.min(y+h,(canvas.height-state.camera.y)/zoom+40);
  if(left>=right||top>=bottom)return;
  ctx.save();
  if(kind==='lava'){
    ctx.globalCompositeOperation='screen';
    ctx.globalAlpha*=.11+.09*Math.sin(time*4.4)+.025*Math.sin(time*10.3);
    ctx.fillStyle='#ff7028';
    ctx.fillRect(left,top,right-left,bottom-top);
    ctx.restore();
    return;
  }
  const cell=(kind==='grass'?29:52)*Math.max(1,Math.ceil(.8/zoom));
  ctx.lineCap='round';
  for(let row=Math.floor(top/cell);row*cell<bottom;row++){
    for(let col=Math.floor(left/cell);col*cell<right;col++){
      const seed=Math.sin(col*127.1+row*311.7)*43758.5453;
      const n=seed-Math.floor(seed);
      const px=(col+.12+n*.62)*cell,py=(row+.12+(n*7%1)*.62)*cell;
      const phase=px*.018+py*.012;
      const wind=Math.sin(time*2.2-phase);
      ctx.beginPath();
      if(kind==='grass'){
        ctx.strokeStyle=mat==='grassDry'?'rgba(236,212,128,.38)':'rgba(160,209,113,.42)';
        ctx.lineWidth=1.2;
        for(const offset of [-3,0,3]){
          const blade=7+Math.abs(offset)*.6;
          ctx.moveTo(px+offset,py);
          ctx.quadraticCurveTo(px+offset+wind*1.2,py-blade*.58,px+offset*1.5+wind*4,py-blade);
        }
      }else if(kind==='river'){
        const travel=(time*.48*(water?.speed??1)+n)%1;
        const distance=(travel-.5)*cell;
        const dx=Math.cos(flow),dy=Math.sin(flow);
        const sx=px+dx*distance,sy=py+dy*distance;
        const shine=(.17+.17*(water?.speed??1))*Math.sin(Math.PI*travel);
        ctx.strokeStyle='rgba(204,250,255,'+shine.toFixed(3)+')';
        ctx.lineWidth=1.4;
        ctx.moveTo(sx-dx*11,sy-dy*11);
        ctx.quadraticCurveTo(sx-dy*4,sy+dx*4,sx+dx*13,sy+dy*13);
      }else{
        const strength=water?.waves??1;
        if(!strength)continue;
        const ocean=mat==='coastSea', span=ocean?24:14;
        const offset=wind*6*strength, rise=Math.cos(time*1.45-phase)*4*strength;
        const light=(.12+.1*Math.sin(time*1.7+n*6.28))*strength;
        ctx.strokeStyle='rgba(190,247,255,'+light.toFixed(3)+')';
        ctx.lineWidth=1.35;
        ctx.moveTo(px-span+offset,py+rise);
        ctx.bezierCurveTo(px-4+offset,py-6+rise,px+5+offset,py+5+rise,px+span+offset,py+rise);
        ctx.moveTo(px-6+offset,py+9+rise);
        ctx.quadraticCurveTo(px+offset,py+6+rise,px+8+offset,py+8+rise);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

const waterDefaults={
  riverWater:{color:'#237b79',speed:1},
  water:{color:'#326f79',waves:.55},
  coastSea:{color:'#226b83',waves:1.45}
};
const waterPatterns=new Map();

function waterAppearance(mat,settings){
  const defaults=waterDefaults[mat];
  if(!defaults)return null;
  const number=(value,fallback)=>Number.isFinite(value)?Math.max(0,Math.min(3,value)):fallback;
  return {
    color:/^#[0-9a-f]{6}$/i.test(settings?.color)?settings.color.toLowerCase():defaults.color,
    speed:number(settings?.speed,defaults.speed||0),
    waves:number(settings?.waves,defaults.waves||0)
  };
}

function syncWaterControls(prefix,mat,settings){
  const box=document.getElementById(prefix+'Settings');
  const appearance=waterAppearance(mat,settings);
  box.classList.toggle('hidden',!appearance);
  if(appearance&&(settings!==undefined||box.dataset.material!==mat)){
    document.getElementById(prefix+'Color').value=appearance.color;
    document.getElementById(prefix+'Flow').value=appearance.speed;
    document.getElementById(prefix+'Waves').value=appearance.waves;
  }
  document.getElementById(prefix+'FlowRow').classList.toggle('hidden',mat!=='riverWater');
  document.getElementById(prefix+'WavesRow').classList.toggle('hidden',mat==='riverWater');
  box.dataset.material=mat;
}

function readWaterControls(prefix,mat){
  return waterAppearance(mat,{
    color:document.getElementById(prefix+'Color').value,
    speed:Number(document.getElementById(prefix+'Flow').value),
    waves:Number(document.getElementById(prefix+'Waves').value)
  });
}

function waterPattern(mat,color){
  const key=mat+color;
  if(waterPatterns.has(key))return waterPatterns.get(key);
  const tile=document.createElement('canvas');
  const size=192;
  tile.width=tile.height=size;
  const g=tile.getContext('2d');
  const pixels=g.createImageData(size,size);
  const rgb=[1,3,5].map(offset=>parseInt(color.slice(offset,offset+2),16));
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const u=x*Math.PI*2/size,v=y*Math.PI*2/size;
      const depth=Math.sin(u*2+v+Math.sin(v*3))*.19+Math.cos(v*2-u)*.16;
      const ripple=Math.abs(Math.sin(u*7+v*3+Math.sin(v*5-u*2)*1.4));
      const grain=Math.sin(u*37+v*43)*Math.cos(u*29-v*53)*6;
      const shine=(mat==='water'?14:22)*Math.pow(1-ripple,5);
      const i=(y*size+x)*4;
      for(let channel=0;channel<3;channel++)pixels.data[i+channel]=rgb[channel]*(.94+depth)+shine+grain;
      pixels.data[i+3]=255;
    }
  }
  g.putImageData(pixels,0,0);
  const pattern=ctx.createPattern(tile,'repeat');
  if(waterPatterns.size>=32)waterPatterns.delete(waterPatterns.keys().next().value);
  waterPatterns.set(key,pattern);
  return pattern;
}

function drawWaterSurface(mat,x,y,w,h,flow,settings){
  const appearance=waterAppearance(mat,settings);
  ctx.fillStyle=waterPattern(mat,appearance.color);
  ctx.fillRect(x,y,w,h);
  drawTerrainMotion(mat,x,y,w,h,flow,appearance);
}

function drawCachedTerrain(mat,x,y,w,h,flow,settings) {
  if(waterDefaults[mat]){
    drawWaterSurface(mat,x,y,w,h,flow,settings);
    return true;
  }
  const imported=finishTerrainPaint(mat)||mesaTerrainPaint(mat);
  const fallback=terrainFinishFallback(mat);
  if(!imported&&!Object.hasOwn(TERRAIN_PALETTES,fallback))return false;
  ctx.fillStyle=imported||getTerrainPattern(ctx,fallback);
  ctx.fillRect(x,y,w,h);
  drawTerrainMotion(mat,x,y,w,h,flow);
  return true;
}

function chooseTerrainMaterial(mat) {
  state.brush.mat=mat;
  syncWaterControls('brushWater',mat);
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
    if(!isDrag){floor.baseTerrain=mat;floor.water=waterDefaults[mat]?readWaterControls('brushWater',mat):null;dragStart=mat==='riverWater'?{x,y,baseFlow:true}:null;}
    else if(dragStart?.baseFlow)floor.flowAngle=Math.atan2(y-dragStart.y,x-dragStart.x);
    return;
  }
  if(mode==='rect'){
    dragStart ||= {x,y};
    previewRect={x:Math.min(x,dragStart.x),y:Math.min(y,dragStart.y),
      w:Math.abs(x-dragStart.x),h:Math.abs(y-dragStart.y),mat,water:waterDefaults[mat]?readWaterControls('brushWater',mat):null};
    return;
  }
  const size=Number(document.getElementById('terrainPaintSize').value);
  if(mode==='mesaScatter'){addMesaScatterPoint(floor,x,y,isDrag,size);return;}
  const softness=Number(document.getElementById('terrainPaintEdge').value);
  let stroke=window.activeBrushStroke;
  if(!isDrag||!stroke){
    stroke={mat,shape:mode==='spray'?'spray':mode==='square'?'quadrado':'redondo',size,softness,terrain:true,points:[]};
    if(waterDefaults[mat])stroke.water=readWaterControls('brushWater',mat);
    (floor.brushStrokes ||= []).push(moveSurfaceToEdge(floor,stroke,true));
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
  const water=waterAppearance(stroke.mat,stroke.water);
  ctx.fillStyle=water?waterPattern(stroke.mat,water.color):finishTerrainPaint(stroke.mat)||mesaTerrainPaint(stroke.mat)||getTerrainPattern(ctx,terrainFinishFallback(stroke.mat));
  for(const [diameter,alpha] of [[size*(1+stroke.softness),stroke.softness*.6],[size,1]]){
    if(!alpha)continue;
    ctx.globalAlpha=alpha;
    trace(diameter);
    ctx.fill();
  }
  if(water){
    const breakers=stroke.mat==='coastSea'?water.waves:stroke.mat==='riverWater'?water.speed*.36:0;
    drawShoreBreakers(stroke,size,breakers);
  }
  if(terrainMotionKinds.has(stroke.mat)&&!terrainMotionPreference.matches){
    let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    for(const point of stroke.points){
      left=Math.min(left,point.x);right=Math.max(right,point.x);
      top=Math.min(top,point.y);bottom=Math.max(bottom,point.y);
    }
    ctx.clip();
    const first=stroke.points[0],last=stroke.points.at(-1);
    const angle=first&&last?Math.atan2(last.y-first.y,last.x-first.x):0;
    drawTerrainMotion(stroke.mat,left-size/2,top-size/2,right-left+size,bottom-top+size,angle,water);
  }
  ctx.restore();
}
