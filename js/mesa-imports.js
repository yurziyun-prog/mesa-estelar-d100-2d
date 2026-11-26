// Traçado determinístico adaptado de js/mesa-pinceis.js do Mesa Estelar.
const mulberry=s=>{let a=s>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};};
const hex=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(String(h||''));const v=m?parseInt(m[1],16):0x4f8c3e;return [(v>>16)&255,(v>>8)&255,v&255];};
const mix=(c,k,r)=>{const j=1+(r()-.5)*k;return 'rgb('+c.map(x=>Math.max(0,Math.min(255,Math.round(x*j)))).join(',')+')';};
/** pontos do caminho já "costurados" a cada ~passo m, com a direção do trecho */
function amostra(pts,passo){const out=[];if(!pts.length)return out;if(pts.length===1)return [{x:pts[0][0],y:pts[0][1],a:0}];let resto=0;
 for(let i=1;i<pts.length;i++){const [x0,y0]=pts[i-1],[x1,y1]=pts[i],d=Math.hypot(x1-x0,y1-y0),a=Math.atan2(y1-y0,x1-x0);if(d<1e-6)continue;let t=passo-resto;
  while(t<=d){out.push({x:x0+(x1-x0)*t/d,y:y0+(y1-y0)*t/d,a});t+=passo;}resto=d-(t-passo);}
 if(!out.length)out.push({x:pts[0][0],y:pts[0][1],a:0});return out;}
/** desenha o pincel num canvas (metros → pixels) */
function drawMesaScatterPattern(ctx,P){
 const r=mulberry(P.seed||1),est=P.estilo,cor=hex(P.cor),tam=Math.max(.4,Number(P.tam)||1.5),dens=Math.max(.2,Math.min(4,Number(P.dens)||1)),S=32,pts=P.pts||[];
 const L=(x,y,x2,y2,lw,c,al=1)=>{ctx.globalAlpha=al;ctx.strokeStyle=c;ctx.lineWidth=lw*S;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x*S,y*S);ctx.lineTo(x2*S,y2*S);ctx.stroke();};
 const E=(x,y,rx,ry,rot,c,al=1)=>{ctx.globalAlpha=al;ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x*S,y*S,Math.max(.4,rx*S),Math.max(.4,ry*S),rot,0,Math.PI*2);ctx.fill();};
 const passo=({grama:.16,mato:.22,palha:.2,folhas:.28,flores:.3,areia:.12,cascalho:.2,neve:.14,pelos:.2,sangue:.4,spray:.1}[est])||.7;
 const sm=amostra(pts,est.startsWith('pegada')?(est==='pegada_pata'?.78:.7):passo);
 const raio=tam/2;
 if(est==='pegada_pata'||est==='pegada_bota'){
  sm.forEach((q,i)=>{const lado=i%2?1:-1,ox=-Math.sin(q.a)*lado*.15*(tam/1.5),oy=Math.cos(q.a)*lado*.15*(tam/1.5),x=q.x+ox,y=q.y+oy,k=.7+tam/4,al=.5+r()*.3,c=mix(cor,.25,r);
   ctx.save();ctx.translate(x*S,y*S);ctx.rotate(q.a);ctx.scale(S,S);
   ctx.globalAlpha=al;ctx.fillStyle=c;
   if(est==='pegada_pata'){ctx.beginPath();ctx.ellipse(-.02*k,0,.1*k,.085*k,0,0,7);ctx.fill();for(let t=-1.5;t<=1.5;t+=1){ctx.beginPath();ctx.ellipse(.12*k,t*.065*k,.04*k,.034*k,0,0,7);ctx.fill();}}
   else{ctx.beginPath();ctx.ellipse(.07*k,0,.13*k,.065*k,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(-.1*k,0,.06*k,.05*k,0,0,7);ctx.fill();}
   ctx.restore();});
  ctx.globalAlpha=1;return;}
 for(const q of sm){
  const n=Math.max(1,Math.round(dens*raio*raio*(est==='areia'||est==='neve'?26:est==='cascalho'?5:est==='spray'?16:est==='sangue'?3:est==='folhas'?5:est==='flores'?2.2:est==='pelos'?10:est==='mato'?9:est==='palha'?10:14)));
  for(let i=0;i<n;i++){const a=r()*6.283,d=Math.sqrt(r())*raio,x=q.x+Math.cos(a)*d,y=q.y+Math.sin(a)*d;
   if(est==='grama'||est==='mato'||est==='palha'){const len=(est==='mato'?.5*(P.height||1):est==='palha'?.38:.26)*(.6+r()*.8),an=-Math.PI/2+(r()-.5)*(est==='palha'?2.6:1.1),cu=(r()-.5)*.25;ctx.globalAlpha=.9;ctx.strokeStyle=mix(cor,.5,r);ctx.lineWidth=(est==='mato'?.034:est==='palha'?.03:.04)*S;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x*S,y*S);ctx.quadraticCurveTo((x+Math.cos(an+cu)*len*.55)*S,(y+Math.sin(an+cu)*len*.55)*S,(x+Math.cos(an+cu*2)*len)*S,(y+Math.sin(an+cu*2)*len)*S);ctx.stroke();}
   else if(est==='folhas'){E(x,y,.07+r()*.07,.035+r()*.03,r()*6.28,mix(cor,.7,r),.85);}
   else if(est==='flores'){const c=r()<.5?mix(cor,.2,r):(r()<.5?'rgb(240,240,245)':'rgb(220,110,150)');E(x,y,.05+r()*.04,.05+r()*.04,0,c,.95);E(x,y,.018,.018,0,'rgb(250,200,40)',1);}
   else if(est==='areia'){E(x,y,.014+r()*.022,.014+r()*.022,0,mix(cor,.28,r),.45+r()*.45);}
   else if(est==='cascalho'){const g=mix(cor,.55,r);E(x,y,.04+r()*.07,.03+r()*.05,r()*6.28,g,.95);E(x+.012,y+.014,.04+r()*.05,.03+r()*.04,0,'rgb(20,20,20)',.18);}
   else if(est==='neve'){E(x,y,.03+r()*.05,.03+r()*.05,0,'rgb(255,255,255)',.45+r()*.5);}
   else if(est==='pelos'){const an=q.a+(r()-.5)*1.1,len=.1+r()*.22;L(x,y,x+Math.cos(an)*len,y+Math.sin(an)*len,.012+r()*.01,mix(cor,.4,r),.55+r()*.35);}
   else if(est==='sangue'){const rr=.03+r()*r()*.16;E(x,y,rr,rr*(.7+r()*.5),r()*6.28,mix(cor,.3,r),.78);if(r()<.18){const an=r()*6.28;L(x,y,x+Math.cos(an)*rr*3,y+Math.sin(an)*rr*3,.014,mix(cor,.3,r),.7);}}
   else{const g=ctx.createRadialGradient(x*S,y*S,0,x*S,y*S,.09*S);g.addColorStop(0,'rgba('+cor.join(',')+','+(.25+r()*.3)+')');g.addColorStop(1,'rgba('+cor.join(',')+',0)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.arc(x*S,y*S,.09*S,0,7);ctx.fill();}
  }}
 ctx.globalAlpha=1;
}

const MESA_TERRAINS=[
 ['mesaAutumn','Chão de outono','秋季林地','chao_floresta_outono','#77523a'],
 ['mesaDrySoil','Terra rachada','龟裂土地','terra_rachada','#9a714f'],
 ['mesaVolcanicSand','Areia vulcânica','火山沙地','areia_escura','#544841'],
 ['mesaShallows','Água rasa','浅水','agua_rasa','#3385a5'],
 ['mesaScrap','Sucata','废金属地面','sucata','#656064']
];
const MESA_FURNITURE=[
 ['mesaDesk','Escrivaninha clássica','古典书桌','sl_escrivaninha',58],
 ['mesaRetroFridge','Geladeira retrô','复古冰箱','rf_geladeira_retro',34],
 ['mesaSurgeryBench','Bancada cirúrgica','手术台','rf_bancada_cirurgica',61],
 ['mesaMoldedChair','Cadeira moldada','模压椅','rf_cadeira_moldada',30]
];
const MESA_SCATTER=[
 ['mato','Mato alto','高草','#9aa43e',1],
 ['matoVerde','Capim alto verde','高大翠绿草','#568749',1.65],
 ['matoDourado','Capim alto dourado','高大金黄草','#bf9949',1.75],
 ['matoRoxo','Capim alto roxo','高大紫草','#997299',1.6],
 ['folhas','Folhas caídas','落叶','#c0702a'],
 ['flores','Flores espalhadas','零散野花','#f2d34a'],['pegada_pata','Pegadas de pata','动物脚印','#4a3220'],
 ['pegada_bota','Pegadas de bota','靴印','#3a2a1c']
];
const scatterById=new Map(MESA_SCATTER.map(item=>[item[0],item]));
const scatterGroups=[
 ['Capins altos',MESA_SCATTER.filter(item=>item[4])],
 ['Folhagem e flores',MESA_SCATTER.filter(item=>['folhas','flores'].includes(item[0]))],
 ['Rastros',MESA_SCATTER.filter(item=>item[0].startsWith('pegada'))]
];

function tallScatterAt(floor,x,y){
 return (floor.brushStrokes||[]).findLast(stroke=>stroke.mesaScatter?.estilo==='mato'&&
   stroke.points.some(p=>(p.x-x)**2+(p.y-y)**2<=(stroke.size/2)**2));
}
const mesaTerrainById=new Map(MESA_TERRAINS.map(item=>[item[0],item]));
const mesaFurnitureById=new Map(MESA_FURNITURE.map(item=>[item[0],item]));
const mesaImages=new Map();
const mesaPatterns=new Map();

function mesaImage(file){
 if(!mesaImages.has(file)){
   const image=new Image();
   image.src='assets/mesa-estelar/'+file+'.webp';
   mesaImages.set(file,image);
 }
 return mesaImages.get(file);
}

const recoloredSandTiles=new Map();
function desertSandTile(image,id){
 if(recoloredSandTiles.has(id))return recoloredSandTiles.get(id);
 const [red,green,blue,gain]=sandColors[id];
 const tile=document.createElement('canvas');
 tile.width=tile.height=96;
 const layer=tile.getContext('2d');
 layer.drawImage(image,0,0,96,96);
 const pixels=layer.getImageData(0,0,96,96);
 for(let i=0;i<pixels.data.length;i+=4){
   const light=pixels.data[i]*.2126+pixels.data[i+1]*.7152+pixels.data[i+2]*.0722;
   pixels.data[i]=red+light*gain;
   pixels.data[i+1]=green+light*gain*.95;
   pixels.data[i+2]=blue+light*gain*.86;
 }
 layer.putImageData(pixels,0,0);
 recoloredSandTiles.set(id,tile);
 return tile;
}

function mesaTerrainPaint(id){
 const terrain=mesaTerrainById.get(Object.hasOwn(sandColors,id)?'mesaVolcanicSand':id);
 if(!terrain)return null;
 if(!mesaPatterns.has(id)){
   const image=mesaImage(terrain[3]);
   if(image.complete&&image.naturalWidth){
     const tile=Object.hasOwn(sandColors,id)?desertSandTile(image,id):document.createElement('canvas');
     if(!Object.hasOwn(sandColors,id)){
       tile.width=tile.height=96;
       tile.getContext('2d').drawImage(image,0,0,96,96);
     }
     mesaPatterns.set(id,ctx.createPattern(tile,'repeat'));
   }
 }
 return mesaPatterns.get(id)||(Object.hasOwn(sandColors,id)?null:terrain[4]);
}

function drawMesaFurniture(prop){
 const furniture=mesaFurnitureById.get(prop.type);
 if(!furniture)return false;
 const image=mesaImage(furniture[3]);
 if(!image.complete||!image.naturalWidth)return true;
 const scale=furniture[4]/Math.max(image.naturalWidth,image.naturalHeight);
 const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
 ctx.save();ctx.translate(prop.x,prop.y);ctx.rotate((prop.rot||0)*Math.PI/2);
 ctx.drawImage(image,-w/2,-h/2,w,h);ctx.restore();
 return true;
}

function createMesaPreview(id){
 const terrain=mesaTerrainById.get(Object.hasOwn(sandColors,id)?'mesaVolcanicSand':id),furniture=mesaFurnitureById.get(id);
 if(!terrain&&!furniture)return null;
 const image=mesaImage((terrain||furniture)[3]);
 const preview=document.createElement('canvas');
 preview.width=preview.height=32;
 preview.className='terrain-preview';
 preview.setAttribute('aria-hidden','true');
 const paint=()=>{
   if(!image.naturalWidth)return;
   const scale=32/Math.max(image.naturalWidth,image.naturalHeight);
   const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
   preview.getContext('2d').drawImage(Object.hasOwn(sandColors,id)?desertSandTile(image,id):image,(32-w)/2,(32-h)/2,w,h);
 };
 if(image.complete)paint();else image.addEventListener('load',paint,{once:true});
 return preview;
}

function addMesaScatterPoint(floor,x,y,isDrag,size,id){
 let stroke=window.activeBrushStroke;
 if(!isDrag||!stroke){
   const [style,,,cor,height]=scatterById.get(id);
   stroke={size,mesaScatter:{estilo:height?'mato':style,cor,height,seed:Math.floor(Math.random()*0xffffffff)},points:[]};
   (floor.brushStrokes ||= []).push(stroke);
   window.activeBrushStroke=stroke;
 }
 const last=stroke.points.at(-1);
 if(!last||Math.hypot(x-last.x,y-last.y)>=8)stroke.points.push({x,y});
 expandFloorToInclude(floor,x,y,size/2);
}

const mesaScatterCache=new WeakMap();
function drawMesaScatter(stroke){
 let cached=mesaScatterCache.get(stroke);
 if(!cached||cached.points!==stroke.points||cached.count!==stroke.points.length){
   const margin=stroke.size/2+32;
   let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
   for(const {x,y} of stroke.points){
     left=Math.min(left,x-margin);top=Math.min(top,y-margin);
     right=Math.max(right,x+margin);bottom=Math.max(bottom,y+margin);
   }
   const w=right-left,h=bottom-top,scale=Math.min(1,2048/Math.max(w,h));
   const image=document.createElement('canvas');
   image.width=Math.ceil(w*scale);image.height=Math.ceil(h*scale);
   const layer=image.getContext('2d');layer.scale(scale,scale);
   drawMesaScatterPattern(layer,{...stroke.mesaScatter,tam:stroke.size/32,dens:.45,
     pts:stroke.points.map(({x,y})=>[(x-left)/32,(y-top)/32])});
   cached={image,left,top,w,h,points:stroke.points,count:stroke.points.length};
   mesaScatterCache.set(stroke,cached);
 }
 ctx.drawImage(cached.image,cached.left,cached.top,cached.w,cached.h);
}

function initMesaImports(){
 TERRAIN_GROUPS.push(['Terrenos do Mesa Estelar',MESA_TERRAINS.map(([id,label])=>[id,label])]);
 for(const [,label,zh] of [...MESA_TERRAINS,...MESA_FURNITURE,...MESA_SCATTER])SITE_ZH.set(label,zh);
 SITE_ZH.set('Terrenos do Mesa Estelar','Mesa Estelar 地形');
 SITE_ZH.set('Móveis do Mesa Estelar','Mesa Estelar 家具');
 SITE_ZH.set('Dispersão do Mesa Estelar','Mesa Estelar 散布画笔');
 for(const [pt,zh] of [['Capins altos','高草'],['Folhagem e flores','落叶与野花'],['Rastros','足迹']])SITE_ZH.set(pt,zh);
}
