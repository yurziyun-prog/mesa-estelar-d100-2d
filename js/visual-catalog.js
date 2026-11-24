function drawCatalogFloorDetails(octx,size,mat,p,rand) {
if(mat==='dirtTrail'){
  for(let i=0;i<360;i++){
    const x=rand()*size,y=rand()*size,r=1+rand()*4;
    drawTiled(octx,size,g=>{
      g.fillStyle=p.dark;g.beginPath();g.ellipse(x+1,y+1,r,r*.7,0,0,Math.PI*2);g.fill();
      g.fillStyle=p.accent;g.beginPath();g.ellipse(x,y,r,r*.7,0,0,Math.PI*2);g.fill();
    });
  }
}else if(mat==='tavernWood'){
  for(let y=0;y<size;y+=32){
    octx.fillStyle=y%64?p.mid:p.base;octx.fillRect(0,y,size,32);
    octx.fillStyle=p.dark;octx.fillRect(0,y,size,2);
    for(let x=0;x<size;x+=32){
      const offset=4+rand()*22;
      octx.fillStyle=p.light;octx.fillRect(x,y+offset,27,1);
      if(x%128===0){octx.fillStyle=p.accent;octx.fillRect(x+3,y+6,3,3);}
    }
  }
}else if (mat === 'cobblePath' || mat === 'dungeonBrick') {
  const step = mat === 'cobblePath' ? 32 : 48;
  for (let y = 0; y < size; y += step) {
    const row = Math.floor(y / step);
    const offset = (row % 2) * (step * 0.5);
    for (let x = -step; x < size + step; x += step) {
      const px = x + offset + (rand() - 0.5) * 4;
      const py = y + (rand() - 0.5) * 4;
      const w = step - 5;
      const h = step - 5;
      const r = mat === 'cobblePath' ? 10 : 3;
      drawTiled(octx, size, g => {
        // Sombra da junta
        g.fillStyle = p.dark;
        g.beginPath(); g.roundRect(px + 2, py + 2, w, h, r); g.fill();
        // Face da pedra
        g.fillStyle = rand() > 0.5 ? p.mid : p.base;
        g.beginPath(); g.roundRect(px, py, w, h, r); g.fill();
        // Realce superior esquerdo
        g.strokeStyle = p.light;
        g.lineWidth = 1.2;
        g.globalAlpha = 0.45;
        g.beginPath(); g.roundRect(px + 1, py + 1, w - 2, h - 2, r); g.stroke();
      });
    }
  }
} else if (mat === 'caveStone' || mat === 'caveFungal' || mat === 'crystalFloor') {
  // Rachaduras angulosas de caverna + rochas ou cogumelos
  for (let i = 0; i < 38; i++) {
    let x = rand() * size, y = rand() * size;
    drawTiled(octx, size, g => {
      g.strokeStyle = p.dark;
      g.lineWidth = 1.8;
      g.globalAlpha = 0.7;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 5; s++) {
        x += (rand() - 0.5) * 48;
        y += (rand() - 0.5) * 48;
        g.lineTo(x, y);
      }
      g.stroke();
    });
  }
  if (mat === 'caveFungal') {
    // Cogumelos lilases top-down como na referência
    for (let i = 0; i < 42; i++) {
      const x = rand() * size, y = rand() * size;
      const r = 4 + rand() * 11;
      drawTiled(octx, size, g => {
        g.fillStyle = '#141221';
        g.beginPath(); g.arc(x + 2, y + 3, r, 0, Math.PI * 2); g.fill();
        g.fillStyle = rand() > 0.4 ? '#8b63c7' : '#a985e0';
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#241c38'; g.lineWidth = 1.5; g.stroke();
      });
    }
  }
} else if (mat === 'lavaAbyss') {
  // Brilho intenso de magma + placas de rocha vulcânica escura flutuando
  for (let i = 0; i < 55; i++) {
    const x = rand() * size, y = rand() * size, r = 18 + rand() * 34;
    drawTiled(octx, size, g => {
      g.globalAlpha = 0.45;
      g.fillStyle = rand() > 0.4 ? p.mid : p.light;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    });
  }
  // Crostas de rocha escura
  for (let i = 0; i < 46; i++) {
    const x = rand() * size, y = rand() * size, r = 6 + rand() * 14;
    drawTiled(octx, size, g => {
      g.globalAlpha = 0.92;
      g.fillStyle = p.dark;
      g.beginPath();
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        const rad = r * (0.7 + rand() * 0.45);
        const px = x + Math.cos(ang) * rad;
        const py = y + Math.sin(ang) * rad;
        a === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
      }
      g.closePath(); g.fill();
      g.strokeStyle = p.accent; g.lineWidth = 1; g.stroke();
    });
  }
} else if (mat === 'scifiMetal' || mat === 'scifiGrate' || mat === 'cyberFloor') {
  const tile = 64;
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      drawTiled(octx, size, g => {
        g.strokeStyle = p.dark;
        g.lineWidth = 2;
        g.strokeRect(x, y, tile, tile);
        if(mat==='cyberFloor'){
          g.fillStyle=(x+y)%128?'#3fa2bf':'#b953a4';
          g.fillRect(x+3,y+3,tile-6,2);g.fillRect(x+3,y+3,2,tile-6);
          g.fillStyle=p.mid;g.fillRect(x+8,y+8,tile-16,tile-16);
        }else if (mat === 'scifiGrate') {
          // Furos da grade metálica
          g.fillStyle = p.dark;
          for (let gy = y + 8; gy < y + tile - 4; gy += 8) {
            for (let gx = x + 8; gx < x + tile - 4; gx += 8) {
              g.fillRect(gx, gy, 4, 4);
            }
          }
        } else {
          // Rebites nos 4 cantos da chapa
          g.fillStyle = p.light;
          g.fillRect(x + 5, y + 5, 2.5, 2.5);
          g.fillRect(x + tile - 7, y + 5, 2.5, 2.5);
          g.fillRect(x + 5, y + tile - 7, 2.5, 2.5);
          g.fillRect(x + tile - 7, y + tile - 7, 2.5, 2.5);
        }
      });
    }
  }
}
}

const catalogFloors=[
 ['dirtTrail','Trilha de Terra e Pedras','碎石土路'],['cobblePath','Calçamento de Pedra','石板道路'],
 ['caveStone','Rocha de Caverna','洞穴岩地'],['caveFungal','Caverna de Cogumelos','蘑菇洞穴'],
 ['lavaAbyss','Magma Abissal','深渊岩浆'],['crystalFloor','Caverna Cristalina','水晶洞穴'],
 ['dungeonBrick','Ladrilho de Masmorra','地牢石砖'],['tavernWood','Tábuas de Taverna','酒馆木板'],
 ['scifiMetal','Piso Metálico de Nave','飞船金属地板'],['scifiGrate','Grade Industrial','工业格栅'],['cyberFloor','Piso Neon','霓虹地板']
];
const catalogInteriorFloors=new Set(catalogFloors.slice(6).map(([id])=>id));
const catalogWalls=[
 ['stoneMasonry','Alvenaria de Pedra','石砌墙','#666a72','dungeonBrick'],
 ['caveRock','Parede de Caverna','洞穴岩壁','#555c68','caveStone'],
 ['woodTimber','Parede de Vigas','木梁墙','#875932','tavernWood'],
 ['scifiBulkhead','Anteparo Metálico','飞船金属隔墙','#485667','scifiMetal']
];
const catalogProps=[
 ['Medieval e taverna','中世纪与酒馆',[
  ['roundTable','Mesa Redonda de Taverna','酒馆圆桌','#9b633f'],['longTable','Mesa de Banquete','宴会长桌','#8f5b39'],['tavernBar','Balcão de Taverna','酒馆吧台','#754226'],['armchair','Poltrona Estofada','软垫扶手椅','#803c3d']]],
 ['Masmorra e cripta','地牢与墓穴',[
  ['treasurePile','Pilha de Tesouro','成堆宝藏','#d89d37'],['ironGrate','Grade de Ferro','铁格栅','#676f80'],['arcaneCircle','Círculo Rúnico','符文法阵','#60e6e0'],['statue','Estátua de Pedra','石雕像','#a3a5ae'],['braziers','Braseiro Aceso','燃烧的火盆','#df662a'],['bones','Ossada','骸骨','#ded4b8']]],
 ['Moderno e lounge','现代与休闲区',[
  ['sofaBooth','Sofá de Canto','转角沙发','#416b89'],['modernTable','Mesa Moderna','现代餐桌','#424958'],['planter','Jardineira Interna','室内花槽','#536347']]],
 ['Ficção científica','科幻',[
  ['holoTable','Mesa Holográfica','全息桌','#4bdded'],['scifiConsole','Painel de Controle','控制台','#567787'],['medBed','Leito Médico','医疗床','#afccd2'],['cargoContainer','Contêiner de Carga','货运集装箱','#747a87'],['reactorCore','Núcleo de Energia','能源核心','#e68b41']]]
];
const catalogPropStyles=new Map(catalogProps.flatMap(group=>group[2]).map(item=>[item[0],item]));
const catalogNature=[
 ['fern','Samambaia','蕨类植物'],['rockCluster','Aglomerado de Rochas','岩石群'],
 ['crystalCluster','Cristais Arcanos','魔法水晶群'],['campfire','Fogueira','篝火']
];

function catalogWallStyle(id){return catalogWalls.find(wall=>wall[0]===id);}
function catalogWallPaint(wall){
 const style=catalogWallStyle(wall.wallFinish||wall.material||wall.wallMaterial);
 return style?getTerrainPattern(ctx,style[4]):null;
}
function catalogPropIsSolid(type){
 return ['roundTable','longTable','tavernBar','armchair','statue','sofaBooth','modernTable','planter',
  'holoTable','scifiConsole','medBed','cargoContainer','reactorCore','rockCluster','crystalCluster'].includes(type);
}

function drawCatalogProp(p){
 const type=p.type;
 const style=catalogPropStyles.get(type);
 const nature=['tree','pine','bush','rock','crystal',...catalogNature.map(item=>item[0])];
 if(!style&&!nature.includes(type))return false;
 const color=style?.[3]||'#427040';
 const box=(x,y,w,h,c,r=3)=>{
   ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
 };
 const disc=(x,y,r,c)=>{
   ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
 };
 const polygon=(points,c)=>{
   ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(...points[0]);
   for(const point of points.slice(1))ctx.lineTo(...point);
   ctx.closePath();ctx.fill();
 };
 ctx.save();
 ctx.translate(p.x,p.y);
 ctx.rotate((p.rot||0)*Math.PI/2);
 if(!['ironGrate','arcaneCircle','bones'].includes(type)){
   ctx.fillStyle='rgba(0,0,0,.34)';ctx.beginPath();ctx.ellipse(5,8,29,18,0,0,Math.PI*2);ctx.fill();
 }
 if(['tree','pine','bush','fern','planter'].includes(type)){
   if(type==='tree'||type==='pine')box(-4,-4,8,25,'#51402b');
   if(type==='planter')box(-29,-13,58,28,'#756558');
   const count=type==='tree'?14:type==='pine'?5:11;
   for(let i=0;i<count;i++){
     const angle=i*2.4,r=5+Math.sqrt(i)*5;
     const x=Math.cos(angle)*r,y=Math.sin(angle)*r-(type==='tree'?9:0);
     const leaf=['#204636','#306544','#4c8850','#76a75d'][i%4];
     if(type==='pine'||type==='fern'){
       const span=type==='pine'?24-i*3:10;
       const dy=type==='pine'?12-i*8:y;
       polygon([[x*.4,dy-16],[x*.4+span,dy+5],[x*.4,dy+2],[x*.4-span,dy+5]],leaf);
     }else{
       disc(x+1,y+2,9,'#1b4532');disc(x,y,8,leaf);disc(x-2,y-3,2,'#8ab86c');
     }
   }
 }else if(['rock','rockCluster','crystal','crystalCluster'].includes(type)){
   const crystal=type.startsWith('crystal');
   for(const [x,y,s] of [[-19,8,.44],[14,13,.52],[18,-7,.5],[0,0,1]]){
     ctx.save();ctx.translate(x,y);ctx.scale(s,s);
     polygon([[-19,8],[-14,-10],[1,-21],[16,-11],[20,7],[7,15]],crystal?'#247993':'#545967');
     polygon([[-14,-10],[1,-21],[16,-11],[6,1],[-7,2]],crystal?'#91e4ec':'#a2a4ab');
     polygon([[6,1],[16,-11],[20,7],[7,15]],crystal?'#4ab6d0':'#767c8b');
     ctx.restore();
   }
 }else if(['campfire','braziers'].includes(type)){
   for(let i=0;i<9;i++)disc(Math.cos(i*.7)*18,Math.sin(i*.7)*18,4,'#7c756b');
   disc(0,0,15,'#392828');
   box(-12,3,24,5,'#6b442a');
   polygon([[-10,5],[-7,-7],[-2,-6],[3,-20],[10,-7],[10,5],[0,10]],'#ed733c');
   polygon([[-4,4],[2,-8],[6,1],[3,6]],'#ffdd72');
 }else if(type==='ironGrate'){
   box(-25,-18,50,36,'#20262e');
   for(let x=-21;x<25;x+=7)box(x,-15,3,30,color,0);
   for(let y=-11;y<16;y+=9)box(-23,y,46,2,'#8795a2',0);
 }else if(type==='arcaneCircle'){
   ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.arc(0,0,17,0,Math.PI*2);ctx.stroke();
   for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);polygon([[0,-22],[3,-18],[-3,-18]],color);}
 }else if(type==='bones'){
   for(let i=0;i<5;i++){ctx.rotate(.9);box(-17,-3,24,4,color);disc(-17,-1,3,color);}
   disc(9,-6,7,color);disc(7,-7,1.5,'#4c4945');disc(11,-7,1.5,'#4c4945');
 }else if(type==='treasurePile'){
   for(let i=0;i<35;i++){
     const a=i*2.4,r=Math.sqrt(i)*4;
     disc(Math.cos(a)*r,Math.sin(a)*r*.65,3,i%3?'#e4ae4f':'#ffe29a');
   }
   box(-10,-15,21,12,'#745040');box(-9,-8,19,4,'#ecca73');
 }else if(type==='statue'){
   box(-17,-16,34,33,'#6b707e');box(-13,-13,26,26,'#8a919f');
   polygon([[-9,5],[-6,-3],[5,-3],[9,6]],color);disc(0,-7,6,'#c0c4c8');
 }else if(['roundTable','holoTable','reactorCore'].includes(type)){
   disc(0,0,26,'#2a2e35');disc(0,0,23,color);
   disc(0,0,19,type==='roundTable'?'#b9814f':'#203b50');
   for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);disc(0,-15,3,type==='roundTable'?'#f0d9b0':color);}
   if(type!=='roundTable'){disc(0,0,11,color);disc(0,0,6,'#d7feff');}
 }else{
   const width=type==='longTable'?68:52;
   box(-width/2,-15,width,33,'#2b2c34');
   box(-width/2+2,-14,width-4,27,color);
   if(['armchair','sofaBooth'].includes(type)){
     box(-width/2,-17,width,10,'#343948');box(-width/2,-11,9,26,color);
     if(type==='sofaBooth')box(width/2-9,-12,9,25,'#273d54');
     box(-10,-5,14,12,'#a88a87');
   }else if(type==='medBed'){
     box(-19,-9,35,17,'#d8eced');box(-18,-8,11,14,'#f3faf7');box(13,-12,9,8,'#58c3ab');
   }else if(type==='cargoContainer'){
     for(let x=-19;x<25;x+=8)box(x,-12,3,24,'#a6adb6');
     box(-23,5,45,4,'#d0a54d');
   }else if(type==='scifiConsole'){
     for(let x=-19;x<23;x+=14){box(x,-10,11,12,'#263746');box(x+2,-8,7,6,'#5ed7db');}
   }else{
     for(let x=-width/2+10;x<width/2-4;x+=13)disc(x,-2,4,'#d6ba98');
     if(type==='tavernBar')box(-24,10,48,6,'#b98050');
     if(type==='longTable')box(-28,18,56,5,'#7c5239');
   }
 }
 ctx.restore();
 return true;
}

const catalogThumbnailCache=new Map();
function catalogThumbnail(kind,id){
 const imported=createFinishThumbnail(id)||createMesaPreview(id);
 if(imported)return imported;
 if(kind==='terrain'||(kind==='mat'&&Object.hasOwn(TERRAIN_PALETTES,id)))return createTerrainThumbnail(id);
 if(!['prop','mat','wallFinish','roof'].includes(kind)&&!(kind==='tool'&&id==='wall'))return null;
 const key=[kind,id,state.buildStyle].join(':');
 let image=catalogThumbnailCache.get(key);
 if(!image){
   image=document.createElement('canvas');
   image.width=image.height=32;
   const previous=ctx;
   ctx=image.getContext('2d');
   try{
     if(kind==='prop'){
       ctx.translate(16,16);ctx.scale(.42,.42);
       drawProp({x:0,y:0,type:id,style:state.buildStyle});
     }else if(kind==='wallFinish'||id==='wall'){
       ctx.fillStyle='#262b33';ctx.fillRect(1,10,30,13);
       ctx.fillStyle=catalogWallPaint({material:id})||'#78818d';ctx.fillRect(2,11,28,10);
       ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(2,11,28,1);
     }else{
       ctx.scale(.5,.5);drawTexturedArea(0,0,64,64,id,null,state.tileConfig);
     }
   }finally{ctx=previous;}
   catalogThumbnailCache.set(key,image);
 }
 const preview=document.createElement('canvas');
 preview.width=preview.height=32;
 preview.className='terrain-preview';
 preview.setAttribute('aria-hidden','true');
 preview.getContext('2d').drawImage(image,0,0);
 return preview;
}

function catalogEntries(category){
 if(category==='terrain')return TERRAIN_GROUPS.flatMap(([group,items])=>items.map(([id,label])=>[id,'',label,'terrain',group]));
 const entries=ARCHITECT_LIBRARY[category]||[];
 if(category==='architecture')return [...entries,
   ...catalogWalls.map(([id,label])=>[id,'',label,'wallFinish','Paredes texturizadas']),
   ...[...finishTextures].map(([id,[label]])=>[id,'',label,'mat','Pisos texturizados']),
   ...[['bridgeMetal','Ponte metálica'],['bridgeMarble','Ponte de mármore'],['bridgeStone','Ponte de pedra']].map(([id,label])=>[id,'',label,'mat','Pisos texturizados']),
   ...catalogFloors.slice(6).map(([id,label])=>[id,'',label,'mat','Pisos texturizados'])];
 if(category==='nature')return [...entries,...extraPlantIds.map(id=>[id,'',plantTypes.get(id)[0],'prop']),...catalogNature.map(([id,label])=>[id,'',label,'prop'])];
 if(category==='furniture')return [...entries,...furnitureFinishes.map(([id,label])=>[id,'',label,'prop','Materiais de mesa e cadeira']),...MESA_FURNITURE.map(([id,label])=>[id,'',label,'prop','Móveis do Mesa Estelar']),...catalogProps.flatMap(([group,,props])=>props.map(([id,label])=>[id,'',label,'prop',group]))];
 return entries;
}

function initVisualCatalog(){
 TERRAIN_GROUPS.push(['Trilhas e cavernas',catalogFloors.slice(0,6).map(([id,label])=>[id,label])]);
 for(const [id,label] of catalogWalls){
   CONSTRUCTION_WALL_MATERIALS[id]=id;
   for(const selectId of ['bldWallMat','constructionMaterial','objectDialogMaterial']){
     document.getElementById(selectId)?.add(new Option(label,id));
   }
 }
 for(const [label,zh,props] of catalogProps){
   SITE_ZH.set(label,zh);
   for(const [,name,translation] of props)SITE_ZH.set(name,translation);
 }
 for(const [,name,zh] of [...catalogWalls,...catalogNature,...catalogFloors])SITE_ZH.set(name,zh);
 for(const [pt,zh] of [['Trilhas e cavernas','道路与洞穴'],['Paredes texturizadas','纹理墙体'],['Pisos texturizados','纹理地板']])SITE_ZH.set(pt,zh);
}
