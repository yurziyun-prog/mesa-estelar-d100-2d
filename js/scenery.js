const sceneryItems=new Map([
 ['neonSignCyan',['Placa de neon ciano','青色霓虹招牌',0,52,'#36ccff',95]],
 ['neonTubeMagenta',['Luminária magenta','洋红灯管',1,46,'#fa5bcf',103]],
 ['industrialGenerator',['Gerador industrial','工业发电机',2,60,'#68d8ff',86,true]],
 ['industrialPipe',['Tubulação industrial','工业弯管',3,60,null,0,true]],
 ['campTent',['Barraca de campismo','露营帐篷',4,104]],
 ['roundPavilion',['Pavilhão circular','圆形营帐',5,125]],
 ['sandstoneRuin',['Ruína de arenito','砂岩废墟',6,112,null,0,true]],
 ['snowyRuin',['Ruína nevada','覆雪废墟',7,112,null,0,true]]
]);
const decorationItems=new Map([
 ['wallLantern',['Lanterna de parede','壁挂灯笼','light','#f5bc83',123,'medieval']],
 ['hangingTorch',['Tocha de parede','壁挂火把','fire','#ffb86b',137,'medieval']],
 ['candleCluster',['Velas','蜡烛组','fire','#ffe4b3',76,'medieval']],
 ['ceilingBulb',['Lâmpada de teto','吸顶灯','light','#fff0cd',178,'modern']],
 ['tubeLight',['Lâmpada fluorescente','荧光灯管','light','#c9ecff',190,'modern']],
 ['festiveLights',['Luzes festivas','节日串灯','string','#f5c98a',108,'modern']],
 ['arabHangingLamp',['Lanterna árabe suspensa','阿拉伯吊灯','light','#ffcb71',137,'arabia']],
 ['futureLightPanel',['Painel de luz','未来照明板','light','#86edff',192,'futurist']],
 ['grimePatch',['Mancha de sujeira','污渍','grime',null,0]],
 ['cobweb',['Teia de aranha','蜘蛛网','web',null,0]],
 ['graffitiMark',['Grafite','涂鸦','mark',null,0,'modern']],
 ['foldedBlanket',['Manta','毛毯','cloth',null,0]],
 ['tablecloth',['Toalha de mesa','桌布','cloth',null,0]],
 ['wallConduit',['Eletroduto','固定电线管','conduit',null,0,'modern']],
 ['futuristConduit',['Duto de energia','能量管线','conduit',null,0,'futurist']],
 ['floorLampshade',['Abajur de piso','落地灯罩','light','#ffe1a6',115,'modern']]
]);
const fixedConduits=new Set(['wallConduit','futuristConduit']);
const overheadDecorations=new Set(['wallLantern','hangingTorch','ceilingBulb','tubeLight',
 'festiveLights','arabHangingLamp','futureLightPanel','neonSignCyan','neonTubeMagenta','lamp','holoSign']);

function drawDecorationItem(prop){
 const item=decorationItems.get(prop.type);
 if(!item)return false;
 const [,,kind,light]=item;
 if(prop.decorationOff&&!light&&kind!=='cloth')return true;
 ctx.save();
 ctx.translate(prop.x,prop.y);ctx.rotate((prop.rot||0)*Math.PI/2);
 const lit=prop.decorationOff!==true;
 const color=light&&lit?light:'#4a4e5b';
 if(kind==='light'||kind==='fire'){
   ctx.fillStyle='#363846';ctx.fillRect(-17,-8,34,16);
   ctx.fillStyle=color;
   if(kind==='fire'){
     ctx.fillRect(-9,4,18,4);
     ctx.beginPath();ctx.moveTo(-8,4);ctx.quadraticCurveTo(-13,-5,2,-13);
     ctx.quadraticCurveTo(11,-3,8,4);ctx.fill();
   }else{
     ctx.beginPath();ctx.roundRect(-13,-4,26,8,2);ctx.fill();
   }
 }else if(kind==='string'){
   ctx.strokeStyle='#41483a';ctx.beginPath();ctx.moveTo(-28,-3);ctx.quadraticCurveTo(0,17,28,-3);ctx.stroke();
   for(let i=0;i<7;i++){
     ctx.fillStyle=lit?['#ffcc5a','#e6736d','#83c883','#9fc4f4'][i%4]:'#515964';
     ctx.beginPath();ctx.arc(-27+i*9,6-((i-3)**2)*.8,2.7,0,Math.PI*2);ctx.fill();
   }
 }else if(kind==='web'){
   ctx.strokeStyle='rgba(227,232,225,.68)';ctx.beginPath();
   for(let i=0;i<6;i++){
     const a=i*Math.PI/3;
     ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*19,Math.sin(a)*19);
   }
   for(const r of [5,11,17]){
     ctx.moveTo(r,0);
     for(let i=1;i<=6;i++)ctx.lineTo(Math.cos(i*Math.PI/3)*r,Math.sin(i*Math.PI/3)*r);
   }
   ctx.stroke();
 }else if(kind==='grime'){
   ctx.fillStyle='rgba(55,43,27,.47)';
   for(let i=0;i<12;i++){
     ctx.beginPath();ctx.ellipse(Math.sin(i*2.4)*16,Math.cos(i*1.8)*10,4+i%7,3+i%4,i,0,Math.PI*2);ctx.fill();
   }
 }else if(kind==='mark'){
   ctx.strokeStyle=prop.color||'#c879ab';ctx.lineWidth=4;
   ctx.beginPath();ctx.moveTo(-20,6);ctx.lineTo(-10,-8);ctx.lineTo(0,7);ctx.lineTo(10,-8);ctx.lineTo(20,6);ctx.stroke();
 }else if(kind==='cloth'){
   const h=lit?11:5;
   ctx.fillStyle=prop.color||'#a67481';ctx.fillRect(-20,-h,40,h*2);
   ctx.strokeStyle='#d4b594';ctx.strokeRect(-17,-h+2,34,h*2-4);
 }else{
   ctx.fillStyle='#535769';ctx.fillRect(-29,-6,58,12);
   ctx.fillStyle=prop.type==='futuristConduit'?'#67c5d5':'#96929a';ctx.fillRect(-28,-2,56,4);
   ctx.fillStyle='#333945';
   for(const x of [-23,0,23])ctx.fillRect(x-2,-7,4,14);
 }
 ctx.restore();
 return true;
}

function toggleNearbyDecoration(floor,actor){
 const nearest=floor.props.map(prop=>({prop,d:Math.hypot(prop.x-actor.x,prop.y-actor.y)}))
   .filter(({prop,d})=>d<52&&!fixedConduits.has(prop.type)&&
     (decorationItems.has(prop.type)||['lamp','oilLamp','torch','campfire','braziers','neonSignCyan','neonTubeMagenta'].includes(prop.type)))
   .sort((a,b)=>a.d-b.d)[0];
 if(!nearest)return false;
 nearest.prop.decorationOff=!nearest.prop.decorationOff;
 return true;
}

const sceneryArt=new Image();
sceneryArt.src='assets/nature/scenery-atlas.webp';

function sceneryEntries(){
 return [...sceneryItems].map(([id,[name]])=>[id,'',name,'prop','Cenografia']);
}

function scenerySolidRadius(type){
 const item=sceneryItems.get(type);
 return fixedConduits.has(type)?14:type==='floorLampshade'?11:item?.[6]?item[3]*.31:0;
}

function drawSceneryProp(prop){
 const item=sceneryItems.get(prop.type);
 if(!item)return false;
 if(!sceneryArt.complete||!sceneryArt.naturalWidth)return true;
 const [, ,sprite,size]=item;
 const w=sceneryArt.naturalWidth/4,h=sceneryArt.naturalHeight/2;
 ctx.save();ctx.translate(prop.x,prop.y);ctx.rotate((prop.rot||0)*Math.PI/2);
 ctx.fillStyle='rgba(12,14,20,.27)';
 ctx.beginPath();ctx.ellipse(size*.14,size*.18,size*.39,size*.21,.45,0,Math.PI*2);ctx.fill();
 if(prop.decorationOff&&item[4])ctx.filter='brightness(.58) saturate(.4)';
 ctx.drawImage(sceneryArt,sprite%4*w,Math.floor(sprite/4)*h,w,h,-size/2,-size/2,size,size);
 if(prop.type==='neonSignCyan'&&prop.signText){
   ctx.fillStyle=prop.decorationOff?'#737e88':'#d1ffff';ctx.font='bold '+Math.max(5,size*.14)+'px sans-serif';
   ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillText(prop.signText,0,size*.038,size*.69);
 }
 ctx.restore();
 return true;
}

function curvedWallPoints(start,x,y,reverse){
 const dx=x-start.x,dy=y-start.y,length=Math.hypot(dx,dy);
 if(length<12)return [start];
 const cx=(start.x+x)/2,cy=(start.y+y)/2,radius=length/2;
 const startAngle=Math.atan2(start.y-cy,start.x-cx);
 const direction=reverse?1:-1;
 const count=Math.min(96,Math.max(10,Math.ceil(Math.PI*radius/10)));
 const points=Array.from({length:count+1},(_,i)=>{
   const angle=startAngle+direction*Math.PI*i/count;
   return {x:cx+Math.cos(angle)*radius,y:cy+Math.sin(angle)*radius};
 });
 points[0]=start;points[count]={x,y};
 return points;
}

function addCurvedWall(floor,points){
 if(points.length<2)return;
 const id='curved-wall-'+crypto.randomUUID();
 for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];
   floor.walls.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,width:state.wallWidth||16,
     material:state.wallVariant||'wallMasonry',style:state.buildStyle,archGroupId:id,
     ...(state.wallCustomColor?{color:state.propColor}:{})});
   expandFloorToInclude(floor,b.x,b.y);
 }
}

function rayWallDistance(x,y,dx,dy,wall,radius){
 const sx=wall.x2-wall.x1,sy=wall.y2-wall.y1;
 const denominator=dx*sy-dy*sx;
 if(Math.abs(denominator)<.00001)return radius;
 const ax=wall.x1-x,ay=wall.y1-y;
 const range=(ax*sy-ay*sx)/denominator;
 const along=(ax*dy-ay*dx)/denominator;
 return range>0&&along>=0&&along<=1?Math.min(range,radius):radius;
}

function lightOccluders(floor){
 const walls=[...floor.walls];
 for(const cave of floor.caves||[]){
   for(const [a,b] of caveWallPieces(cave,true))walls.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y});
 }
 for(const building of floor.buildings||[]){
   const {x,y,w,h}=building;
   const sides=[[x,y,x+w,y],[x+w,y,x+w,y+h],[x+w,y+h,x,y+h],[x,y+h,x,y]];
   for(const [x1,y1,x2,y2] of sides){
     const vertical=x1===x2,length=Math.hypot(x2-x1,y2-y1);
     if(!length)continue;
     const gaps=floor.doors.filter(door=>door.buildingId===building.id&&door.open&&
       (vertical?Math.abs(door.x-x1)<2:Math.abs(door.y-y1)<2))
       .map(door=>vertical?Math.abs(door.y-y1):Math.abs(door.x-x1)).sort((a,b)=>a-b);
     const point=distance=>({x:x1+(x2-x1)*distance/length,y:y1+(y2-y1)*distance/length});
     let start=0;
     for(const gap of [...gaps,length+35]){
       const end=Math.min(length,gap-34);
       if(end>start){
         const a=point(start),b=point(end);
         walls.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y});
       }
       start=Math.max(start,gap+34);
     }
   }
 }
 for(const prop of floor.props){
   const r=scenerySolidRadius(prop.type)||plantTrunkRadius(prop.type);
   if(!r)continue;
   const s=r*(prop.scale||1)*treeSizeFactor(prop),x=prop.x,y=prop.y;
   const corners=[[x-s,y-s],[x+s,y-s],[x+s,y+s],[x-s,y+s]];
   for(let i=0;i<4;i++){
     const [x1,y1]=corners[i],[x2,y2]=corners[(i+1)%4];
     walls.push({x1,y1,x2,y2,source:prop});
   }
 }
 return walls;
}

const daylightPresets={dawn:390,day:720,dusk:1050,night:1320};
let daylightSeconds=0;

function daylightMinute(){
 return Number.isFinite(state.daylightMinute)
   ?((Math.floor(state.daylightMinute)%1440)+1440)%1440
   :daylightPresets[state.timeOfDay]??720;
}

function daylightLighting(minute=daylightMinute()){
 const angle=(minute-360)*Math.PI/720;
 const elevation=Math.sin(angle);
 const day=Math.max(0,elevation);
 const twilight=Math.max(0,1-Math.abs(elevation)*5);
 return {
   shadow:day>0?{x:-Math.cos(angle)*(1.8-1.15*day),y:.28+.53*(1-day),alpha:.18+.14*day}:null,
   dark:.86*Math.max(0,Math.min(1,(.15-elevation)/.82)),
   warm:twilight*.14,
   evening:minute>=720
 };
}

function updateDaylightControls(){
 const minute=daylightMinute();
 document.getElementById('mapTime').value=String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
 document.getElementById('mapTimeAuto').checked=state.daylightAuto!==false;
 document.getElementById('mapTimeRate').value=String(state.daylightRate||1);
 document.getElementById('worldDateSetting').value=worldDateInput();
 updateCharacterClock();
 document.getElementById('timeOfDaySelect').value=state.timeOfDay||'day';
}

function setMapDaylight(minute){
 state.daylightMinute=((minute%1440)+1440)%1440;
 const time=state.daylightMinute;
 state.timeOfDay=time<330||time>=1140?'night':time<435?'dawn':time>=1020?'dusk':'day';
 updateDaylightControls();
}

function advanceMapDaylight(elapsed){
 if(state.daylightAuto===false){daylightSeconds=0;return;}
 daylightSeconds+=elapsed*(state.daylightRate||1);
 const minutes=Math.floor(daylightSeconds);
 if(!minutes)return;
 daylightSeconds-=minutes;
 const start=worldClockStamp();
 const save=advanceRestClock(start,minutes);
 state.worldDay=Math.floor((start+minutes)/DAY_MINUTES);
 setMapDaylight(start+minutes);
 if(save)saveBank();
}

function drawSunShadows(floor){
 const sun=daylightLighting().shadow;
 if(!sun)return;
 ctx.save();
 ctx.fillStyle='#111923';
 ctx.globalAlpha*=sun.alpha*.72;
 ctx.beginPath();
 const cast=(x1,y1,x2,y2)=>{
   const dx=sun.x*34,dy=sun.y*34;
   ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
   ctx.lineTo(x2+dx,y2+dy);ctx.lineTo(x1+dx,y1+dy);ctx.closePath();
 };
 for(const wall of floor.walls||[])cast(wall.x1,wall.y1,wall.x2,wall.y2);
 for(const b of floor.buildings||[]){
   cast(b.x,b.y,b.x+b.w,b.y);
   cast(b.x+b.w,b.y,b.x+b.w,b.y+b.h);
   cast(b.x+b.w,b.y+b.h,b.x,b.y+b.h);
   cast(b.x,b.y+b.h,b.x,b.y);
 }
 ctx.fill();
 ctx.restore();
 for(const prop of floor.props)if(plantTypes.has(prop.type))drawPlantSunShadow(prop,sun);
}

const renderedRoofCovers=[];
let visibleChimneys=[];
let chimneyScene=null;

function chimneyBlocksMovement(scene,index,x,y,radius){
 const level=floorLevel(scene,index);
 const chimneys=scene===chimneyScene?visibleChimneys:findChimneys(scene);
 return chimneys.some(({prop,source,top})=>{
   if(level<=source||level>top.level)return false;
   const half=(prop.type==='ironStove'?6:11)*(prop.scale||1);
   return Math.hypot(Math.max(0,Math.abs(prop.x-x)-half),Math.max(0,Math.abs(prop.y-y)-half))<radius;
 });
}

function fireplaceDesign(type){
 return ({hearth:['#737479','#4b4e53',34,20],brickHearth:['#9d5947','#683f37',34,21],
   ironStove:['#454951','#252932',21,19]})[type];
}

function findChimneys(scene){
 const roofs=scene.floors.flatMap((floor,index)=>[
   ...(floor.areas||[]).filter(a=>isRoofMaterial(a.mat)),
   ...(floor.buildings||[]).filter(b=>b.hasRoof&&b.roofType!=='upperFloorBase')
 ].map(roof=>({roof,level:floorLevel(scene,index)})));
 return scene.floors.flatMap((floor,index)=>(floor.props||[]).filter(p=>fireplaceDesign(p.type)).flatMap(prop=>{
   const source=floorLevel(scene,index);
   const top=roofs.filter(r=>r.level>=source&&pointInArchitectArea(r.roof,prop.x,prop.y))
     .sort((a,b)=>b.level-a.level)[0];
   return top?[{prop,source,top}]:[];
 }));
}

function drawChimneySection(prop,cap){
 const [masonry,dark]=fireplaceDesign(prop.type);
 const size=prop.type==='ironStove'?12:22;
 ctx.save();ctx.translate(prop.x,prop.y);ctx.scale(prop.scale||1,prop.scale||1);
 ctx.fillStyle='rgba(5,9,15,.35)';ctx.fillRect(-size/2+3,-size/2+5,size+2,size+2);
 ctx.fillStyle=masonry;ctx.strokeStyle=dark;ctx.lineWidth=2;
 ctx.fillRect(-size/2,-size/2,size,size);ctx.strokeRect(-size/2,-size/2,size,size);
 ctx.fillStyle=dark;
 if(cap)ctx.fillRect(-size*.29,-size*.27,size*.58,size*.54);
 else ctx.fillRect(-size*.37,0,size*.74,2);
 if(cap&&prop.fireLit!==false){
   const now=terrainMotionPreference.matches?1.4:performance.now()/1000;
   for(let i=0;i<5;i++){
     const t=(now*.49+i/5)%1,r=3+t*9;
     ctx.fillStyle=`rgba(199,207,215,${.36*(1-t)})`;
     ctx.beginPath();ctx.ellipse(t*18+Math.sin(t*11+i)*3,-t*31,r,r*.76,0,0,Math.PI*2);
     ctx.fill();
   }
 }
 ctx.restore();
}

function markVisibleRoofCover(bounds,roof=bounds,views=[]){
 renderedRoofCovers.push({bounds,views});
 for(const chimney of visibleChimneys){
   if(chimney.top.roof===roof)drawChimneySection(chimney.prop,true);
 }
}

function lightWallsWithOpenings(floor){
 const walls=lightOccluders(floor);
 const windows=(floor.windows||[]).map(opening=>({opening,width:opening.width||40,pass:!opening.curtain?.closed}));
 const doors=(floor.doors||[]).map(opening=>({opening,width:opening.width||68,pass:opening.open}));
 const openings=[...windows,...doors];
 return [...walls.filter(wall=>wall.source),...sightWallsWithOpenings(walls.filter(wall=>!wall.source),openings),
   ...openings.filter(item=>!item.pass).map(item=>sightOpeningEdge(item.opening,item.width))];
}

function sceneryEmitter(prop){
 if(prop.decorationOff)return null;
 const decoration=decorationItems.get(prop.type);
 if(decoration?.[3])return {prop,color:decoration[3],radius:decoration[4],fire:decoration[2]==='fire'};
 const item=sceneryItems.get(prop.type);
 if(item?.[4])return {prop,color:item[4],radius:item[5]};
 if(fireplaceDesign(prop.type))return prop.fireLit===false?null:{prop,color:'#ffc992',radius:485,fire:true};
 if(['campfire','braziers','torch','oilLamp','lamp'].includes(prop.type)){
   return {prop,color:'#ffc189',radius:prop.type==='campfire'?188:116,fire:true};
 }
 const luminous={
   alienPodTree:['#86ccff',78],alienShelfTree:['#8fead3',70],alienFanTree:['#bf8bea',67],
   crystal:['#79eccc',43],crystalCluster:['#80f0da',67],amethyst:['#bb91fa',52],
   citrine:['#f9c475',52],iceCrystal:['#8fd1fa',52]
 }[prop.type];
 return luminous?{prop,color:luminous[0],radius:luminous[1]*(plantTypes.has(prop.type)?treeSizeFactor(prop):1),strength:.39}:null;
}

function lightFromLowerStairs(floor){
 const scene=getScene(),index=state.currentFloor;
 return (floor.stairs||[]).filter(s=>s.dir==='down').flatMap(stair=>{
   const target=stairLinkedIndex(scene,index,stair);
   const lower=scene.floors[target];
   if(!lower||floorLevel(scene,target)>=floorLevel(scene,index))return [];
   const walls=lightWallsWithOpenings(lower);
   for(const lamp of lower.props.map(sceneryEmitter).filter(Boolean)){
     const dx=stair.x-lamp.prop.x,dy=stair.y-lamp.prop.y,dist=Math.hypot(dx,dy);
     if(dist>=lamp.radius*.68)continue;
     if(dist&&walls.some(w=>w.source!==lamp.prop&&rayWallDistance(lamp.prop.x,lamp.prop.y,dx/dist,dy/dist,w,dist)<dist-.01))continue;
     return [{prop:stair,color:lamp.color,radius:62,strength:.32}];
   }
   return [];
 });
}

const darknessLayer=document.createElement('canvas');

function drawNightLighting(floor,interior,darkness){
 if(!darkness)return;
 if(darknessLayer.width!==canvas.width||darknessLayer.height!==canvas.height){
   darknessLayer.width=canvas.width;darknessLayer.height=canvas.height;
 }
 const sceneContext=ctx;
 const shade=darknessLayer.getContext('2d');
 const tint=`rgba(8,15,35,${darkness})`;
 shade.clearRect(0,0,canvas.width,canvas.height);
 shade.fillStyle=tint;
 shade.fillRect(0,0,canvas.width,canvas.height);
 ctx=shade;
 try{
   renderSceneryLights(floor,interior);
   shade.save();
   shade.translate(state.camera.x,state.camera.y);
   shade.scale(state.camera.zoom,state.camera.zoom);
   shade.fillStyle=tint;
   for(const {bounds,views} of renderedRoofCovers){
     shade.save();
     clipCoverForExteriorSight(bounds,views);
     shade.clearRect(bounds.x,bounds.y,bounds.w,bounds.h);
     shade.fillRect(bounds.x,bounds.y,bounds.w,bounds.h);
     shade.restore();
   }
   shade.restore();
 }finally{ctx=sceneContext;}
 ctx.drawImage(darknessLayer,0,0);
}

function renderSceneryLights(floor,interior){
 if(!floor)return;
 const actorLights=state.entities.filter(ent=>ent.sceneId===state.activeSceneId&&ent.floor===state.currentFloor&&
   ent.hp>0&&['head','wrist','hand','leftHand'].some(slot=>equipmentLightOn(ent,slot)))
   .map(prop=>({prop,radius:108,strength:.8}));
 const emitters=[...floor.props.map(sceneryEmitter).filter(Boolean),...lightFromLowerStairs(floor),...actorLights];
 if(!emitters.length)return;
 const walls=lightWallsWithOpenings(floor);
 ctx.save();ctx.translate(state.camera.x,state.camera.y);ctx.scale(state.camera.zoom,state.camera.zoom);
 ctx.globalCompositeOperation='destination-out';
 for(const {prop,radius,strength=1,fire} of emitters){
   const x=prop.x,y=prop.y,r=radius*(prop.scale||1),zoom=state.camera.zoom;
   if(x*zoom+state.camera.x<-r*zoom||y*zoom+state.camera.y<-r*zoom||
      x*zoom+state.camera.x>canvas.width+r*zoom||y*zoom+state.camera.y>canvas.height+r*zoom)continue;
   if(interior&&!connectedCaves(floor,interior).some(c=>insideCave(c,x,y)))continue;
   const cave=(floor.caves||[]).find(c=>insideCave(c,x,y));
   if(state.mode==='player'&&cave&&(!interior||!connectedCaves(floor,interior).includes(cave)))continue;
   const nearby=walls.filter(wall=>wall.source!==prop&&distToSegment(x,y,wall.x1,wall.y1,wall.x2,wall.y2)<r);
   ctx.save();
   if(interior)clipCaveInterior(floor,interior);
   ctx.beginPath();
   for(let i=0;i<96;i++){
     const angle=i*Math.PI/48,dx=Math.cos(angle),dy=Math.sin(angle);
     let distance=r;
     for(const wall of nearby)distance=rayWallDistance(x,y,dx,dy,wall,distance);
     if(i===0)ctx.moveTo(x+dx*distance,y+dy*distance);
     else ctx.lineTo(x+dx*distance,y+dy*distance);
   }
   ctx.closePath();ctx.clip();
   const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
   gradient.addColorStop(0,'rgba(0,0,0,.97)');
   gradient.addColorStop(.28,fire?'rgba(0,0,0,.85)':'rgba(0,0,0,.65)');
   gradient.addColorStop(.60,fire?'rgba(0,0,0,.52)':'rgba(0,0,0,.25)');
   gradient.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=gradient;
   const flicker=terrainMotionPreference.matches?1:.91+.09*Math.sin(performance.now()/140+x);
   ctx.globalAlpha=flicker*strength;
   ctx.fillRect(x-r,y-r,r*2,r*2);
   ctx.restore();
 }
 ctx.restore();
}

function initSceneryCatalog(){
 for(const [label,zh] of [...sceneryItems.values(),...decorationItems.values()])SITE_ZH.set(label,zh);
 SITE_ZH.set('Cenografia','场景装饰');
 SITE_ZH.set('Parede curva','弧形墙');
 SITE_ZH.set('Mar costeiro','海洋');
 sceneryArt.addEventListener('load',()=>{
   for(const key of catalogThumbnailCache.keys()){
     if(sceneryItems.has(key.split(':')[1]))catalogThumbnailCache.delete(key);
   }
   if(architectCategory==='props')renderArchitectLibrary();
 },{once:true});
}

// Indoor sight rays stop at walls or continue a short distance beyond a nearby opening.
function sightOpeningEdge(opening,width){
 const dx=opening.orient==='v'?0:width/2,dy=opening.orient==='v'?width/2:0;
 const {x,y}=opening;
 return {x1:x-dx,y1:y-dy,x2:x+dx,y2:y+dy};
}

function sightWallsWithOpenings(walls,openings){
 return walls.flatMap(wall=>{
   const dx=wall.x2-wall.x1,dy=wall.y2-wall.y1,length=Math.hypot(dx,dy);
   if(!length)return [];
   let spans=[[0,length]];
   for(const {opening,width} of openings){
     if(opening.orient==='v'?Math.abs(dx)>1:Math.abs(dy)>1)continue;
     const ox=opening.x-wall.x1,oy=opening.y-wall.y1;
     if(Math.abs(ox*dy-oy*dx)/length>(wall.width||16)/2+6)continue;
     const center=(ox*dx+oy*dy)/length,start=center-width/2,end=center+width/2;
     spans=spans.flatMap(([a,b])=>end<=a||start>=b?[[a,b]]:
       [[a,Math.min(b,start)],[Math.max(a,end),b]].filter(([l,r])=>r-l>.001));
   }
   return spans.map(([a,b])=>({x1:wall.x1+dx*a/length,y1:wall.y1+dy*a/length,
     x2:wall.x1+dx*b/length,y2:wall.y1+dy*b/length}));
 });
}

function slabSightLimit(slabs,x,y,dx,dy){
 const spans=[];
 for(const slab of slabs){
   let start=0,end=Infinity;
   for(const [origin,direction,min,max] of [[x,dx,slab.x,slab.x+slab.w],[y,dy,slab.y,slab.y+slab.h]]){
     if(Math.abs(direction)<1e-9){
       if(origin<min||origin>max)end=-1;
       continue;
     }
     const a=(min-origin)/direction,b=(max-origin)/direction;
     start=Math.max(start,Math.min(a,b));end=Math.min(end,Math.max(a,b));
   }
   if(end>=start)spans.push([start,end]);
 }
 let limit=0;
 for(const [start,end] of spans.sort((a,b)=>a[0]-b[0])){
   if(start>limit+.01)break;
   limit=Math.max(limit,end);
 }
 return limit;
}

function indoorSightPolygon(floor,actor){
 const rooms=floor.buildings||[];
 const {x,y}=actor;
 const surface=topMapSurfaceAt(floor,x,y);
 const covered=surface?.mat==='bridgeCovered'&&!surface.points?surface:null;
 const slabs=floor.areas.filter(isStructuralSlab).concat(rooms);
 const bridgeEnds=[];
 if(covered){
   slabs.push(covered);
   const {x:left,y:top,w,h}=covered;
   if(w>=h){
     bridgeEnds.push({x:left,y:top+h/2,orient:'v',width:h},{x:left+w,y:top+h/2,orient:'v',width:h});
   }else{
     bridgeEnds.push({x:left+w/2,y:top,orient:'h',width:w},{x:left+w/2,y:top+h,orient:'h',width:w});
   }
 }
 if(!slabs.some(area=>pointInArchitectArea(area,x,y)))return null;
 const openings=[
   ...bridgeEnds.map(opening=>({opening,width:opening.width,pass:true})),
   ...(floor.doors||[]).map(door=>({opening:door,width:door.width||68,pass:door.open})),
   ...(floor.windows||[]).map(window=>({opening:window,width:window.width||40,pass:!window.curtain?.closed}))
 ].map(item=>({...item,edge:sightOpeningEdge(item.opening,item.width)}));
 const solid=sightWallsWithOpenings(lightOccluders(floor).filter(wall=>!wall.source),openings);
 const walls=[...solid,...openings.map(item=>item.edge)];
 const rim=12;
 const wallRim=slabs.map(a=>({x:a.x-rim,y:a.y-rim,w:a.w+2*rim,h:a.h+2*rim}));
 const range=3000;
 const closest=(x,y,dx,dy,items,radius)=>items.reduce((distance,wall)=>rayWallDistance(x,y,dx,dy,wall,distance),radius);
 const angles=Array.from({length:180},(_,i)=>i*Math.PI/90);
 for(const edge of walls){
   for(const [px,py] of [[edge.x1,edge.y1],[edge.x2,edge.y2]]){
     const a=Math.atan2(py-y,px-x);
     for(const off of [-.0002,.0002])angles.push((a+off+Math.PI*2)%(Math.PI*2));
   }
 }
 return angles.sort((a,b)=>a-b).map(a=>{
   const dx=Math.cos(a),dy=Math.sin(a);
   const limit=slabSightLimit(slabs,x,y,dx,dy);
   const first=closest(x,y,dx,dy,walls,range);
   const visibleRim=slabSightLimit(wallRim,x,y,dx,dy);
   let distance=first>=limit-.01?visibleRim:Math.min(first+rim,visibleRim);
   for(const {opening,edge,pass} of openings){
     const proximity=Math.hypot(opening.x-x,opening.y-y);
     if(!pass||proximity>=128||first===range||first>visibleRim+.01)continue;
     const through=rayWallDistance(x,y,dx,dy,edge,range);
     if(Math.abs(through-first)>.001||closest(x,y,dx,dy,solid,range)<through-.001)continue;
     const offset=through+.005;
     const outside=visibleRim<=offset+(opening.orient==='v'?rim/Math.max(.1,Math.abs(dx)):rim/Math.max(.1,Math.abs(dy)))+.01||limit<=offset+rim;
     const reach=outside?320*Math.min(1,(128-proximity)/36):Math.max(0,limit-offset+8);
     distance=offset+closest(x+dx*offset,y+dy*offset,dx,dy,walls,reach);
     break;
   }
   return {x:x+dx*distance,y:y+dy*distance};
 });
}

function drawIndoorSightMask(floor,interior){
 if(state.mode!=='player'||interior)return;
 const actor=activeActor();
 if(!actor||actor.floor!==state.currentFloor||actor.sceneId!==state.activeSceneId)return;
 const points=indoorSightPolygon(floor,actor);
 if(!points)return;
 const {x,y,zoom}=state.camera;
 ctx.save();
 ctx.beginPath();ctx.rect(0,0,canvas.width,canvas.height);
 ctx.moveTo(x+points[0].x*zoom,y+points[0].y*zoom);
 for(const point of points.slice(1))ctx.lineTo(x+point.x*zoom,y+point.y*zoom);
 ctx.closePath();
 ctx.fillStyle='#0b111b';ctx.fill('evenodd');
 ctx.restore();
}

// The same openings that allow a view out also allow a limited view in.
function exteriorSightThroughOpenings(floor,actor){
 if(state.mode!=='player'||!actor)return [];
 const slabs=floor.areas.filter(isStructuralSlab).concat(floor.buildings||[]);
 const inside=(x,y)=>slabs.some(a=>pointInArchitectArea(a,x,y));
 if(inside(actor.x,actor.y))return [];
 const openings=[
   ...(floor.doors||[]).map(opening=>({opening,width:opening.width||68,pass:opening.open})),
   ...(floor.windows||[]).map(opening=>({opening,width:opening.width||40,pass:!opening.curtain?.closed}))
 ].map(item=>({...item,edge:sightOpeningEdge(item.opening,item.width)}));
 const solid=sightWallsWithOpenings(lightOccluders(floor).filter(w=>!w.source),openings);
 const walls=solid.concat(openings.map(item=>item.edge));
 const {x,y}=actor;
 const nearest=(x,y,dx,dy,limit)=>walls.reduce((r,w)=>rayWallDistance(x,y,dx,dy,w,r),limit);
 const views=[];
 for(const {opening,edge,pass} of openings){
   const proximity=Math.hypot(opening.x-x,opening.y-y);
   if(!pass||proximity>=128)continue;
   const points=[];
   for(let i=0;i<=32;i++){
     const t=(i+.02)/32.04;
     const px=edge.x1+(edge.x2-edge.x1)*t,py=edge.y1+(edge.y2-edge.y1)*t;
     const length=Math.hypot(px-x,py-y);
     if(length<.01)continue;
     const dx=(px-x)/length,dy=(py-y)/length;
     const sx=px+dx*2,sy=py+dy*2;
     if(nearest(x,y,dx,dy,length)<length-.01||!inside(sx,sy)){
       points.push({near:{x:px,y:py},far:{x:px,y:py}});continue;
     }
     const range=Math.min(slabSightLimit(slabs,sx,sy,dx,dy),320*Math.min(1,(128-proximity)/36));
     const reach=nearest(sx,sy,dx,dy,range);
     points.push({near:{x:px,y:py},far:{x:sx+dx*reach,y:sy+dy*reach}});
   }
   if(points.some(({near,far})=>Math.hypot(far.x-near.x,far.y-near.y)>1))
     views.push({opening,points:points.map(p=>p.near).concat(points.slice().reverse().map(p=>p.far))});
 }
 return views;
}

function clipCoverForExteriorSight(bounds,views){
 for(const {opening,points} of views){
   if(!pointInArchitectArea(bounds,opening.x,opening.y,4))continue;
   ctx.beginPath();
   ctx.rect(bounds.x-2,bounds.y-2,bounds.w+4,bounds.h+4);
   ctx.moveTo(points[0].x,points[0].y);
   for(const p of points.slice(1))ctx.lineTo(p.x,p.y);
   ctx.closePath();ctx.clip('evenodd');
 }
}

function closestCurtainWindow(floor,x,y,radius,installedOnly=false){
 return (floor.windows||[]).filter(w=>!installedOnly||w.curtain)
   .map(window=>{
     const edge=sightOpeningEdge(window,window.width||40);
     return {window,distance:distToSegment(x,y,edge.x1,edge.y1,edge.x2,edge.y2)};
   }).filter(hit=>hit.distance<=radius).sort((a,b)=>a.distance-b.distance)[0];
}

function installWindowCurtain(floor,x,y,remove){
 const hit=closestCurtainWindow(floor,x,y,25,remove);
 if(!hit)return false;
 if(remove)delete hit.window.curtain;
 else hit.window.curtain={closed:false,color:state.propColor||'#704455'};
 return true;
}

function toggleNearbyCurtain(floor,actor,door){
 const hit=closestCurtainWindow(floor,actor.x,actor.y,46,true);
 if(!hit)return false;
 if(door&&Math.hypot(door.x-actor.x,door.y-actor.y)<=hit.distance+8)return false;
 hit.window.curtain.closed=!hit.window.curtain.closed;
 say(actor,translateSiteText(hit.window.curtain.closed?'Cortina fechada.':'Cortina aberta.'));
 return true;
}

function drawWindowCurtain(width,curtain){
 const half=width/2;
 ctx.fillStyle='#352735';ctx.fillRect(-half-4,-7,width+8,3);
 ctx.strokeStyle='#e1bb7e';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-half-4,-6);ctx.lineTo(half+4,-6);ctx.stroke();
 const strip=curtain.closed?width+2:Math.max(8,width*.18);
 for(const x of [-half-1,half+1-strip]){
   ctx.fillStyle=curtain.color||'#704455';ctx.fillRect(x,-4,strip,11);
   ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;
   ctx.beginPath();
   for(let t=x+4;t<x+strip-1;t+=5){ctx.moveTo(t,-3);ctx.lineTo(t,6);}
   ctx.stroke();
   if(curtain.closed)break;
 }
}

function switchableSceneLight(prop){
 const active={...prop,decorationOff:false,fireLit:true};
 return Boolean(sceneryEmitter(active))&&(
   Boolean(fireplaceDesign(prop.type))||Boolean(decorationItems.get(prop.type)?.[3])||
   Boolean(sceneryItems.get(prop.type)?.[4])||['campfire','braziers','torch','oilLamp','lamp'].includes(prop.type)
 );
}
function openSceneLightMenu(sx,sy,clientX,clientY){
 const {wx,wy}=screenToWorld(sx,sy);
 const floor=getScene().floors[state.currentFloor];
 const actor=activeActor();
 if(state.mode==='player'&&(!actor||actor.hp<=0||actor.sleepPose||actor.floor!==state.currentFloor||actor.sceneId!==state.activeSceneId))return false;
 const hit=floor?.props.filter(p=>switchableSceneLight(p)&&
   Math.hypot(p.x-wx,p.y-wy)<Math.min(55,25*(p.scale||1))&&
   (state.mode!=='player'||Math.hypot(p.x-actor.x,p.y-actor.y)<78))
   .sort((a,b)=>Math.hypot(a.x-wx,a.y-wy)-Math.hypot(b.x-wx,b.y-wy))[0];
 if(!hit)return false;
 closeArchitectContextMenu();
 const menu=document.createElement('div');menu.id='architectContextMenu';menu.className='architect-context-menu';
 const button=document.createElement('button');button.type='button';
 const isOff=!sceneryEmitter(hit);
 button.textContent=siteLanguage==='zh-CN'?(isOff?'开灯／点火':'关灯／熄火'):(isOff?'Acender':'Apagar');
 button.onclick=()=>{
   beginEdit();
   hit.decorationOff=!isOff;
   if(fireplaceDesign(hit.type))hit.fireLit=isOff;
   finishEdit();saveBank();closeArchitectContextMenu();
 };
 menu.append(button);document.body.append(menu);
 menu.style.left=Math.max(0,Math.min(clientX,innerWidth-menu.offsetWidth-6))+'px';
 menu.style.top=Math.max(0,Math.min(clientY,innerHeight-menu.offsetHeight-6))+'px';
 return true;
}
