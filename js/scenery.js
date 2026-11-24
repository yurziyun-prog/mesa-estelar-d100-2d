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
const sceneryArt=new Image();
sceneryArt.src='assets/nature/scenery-atlas.webp';

function sceneryEntries(){
 return [...sceneryItems].map(([id,[name]])=>[id,'',name,'prop','Cenografia']);
}

function scenerySolidRadius(type){
 const item=sceneryItems.get(type);
 return item?.[6]?item[3]*.31:0;
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
 ctx.drawImage(sceneryArt,sprite%4*w,Math.floor(sprite/4)*h,w,h,-size/2,-size/2,size,size);
 if(prop.type==='neonSignCyan'&&prop.signText){
   ctx.fillStyle='#d1ffff';ctx.font='bold '+Math.max(5,size*.14)+'px sans-serif';
   ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillText(prop.signText,0,size*.038,size*.69);
 }
 ctx.restore();
 return true;
}

function curvedWallPoints(start,x,y,reverse){
 const dx=x-start.x,dy=y-start.y,length=Math.hypot(dx,dy);
 if(length<12)return [start];
 const bend=reverse?-.77:.77;
 const controlX=(start.x+x)/2-dy*bend,controlY=(start.y+y)/2+dx*bend;
 const count=Math.min(72,Math.max(8,Math.ceil(length/12)));
 return Array.from({length:count+1},(_,i)=>{
   const t=i/count,s=1-t;
   return {x:s*s*start.x+2*s*t*controlX+t*t*x,y:s*s*start.y+2*s*t*controlY+t*t*y};
 });
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

const coastOutlineCache=new WeakMap();
function drawShoreBreakers(stroke,diameter){
 if(stroke.shape!=='redondo'||diameter<24||!stroke.points.length)return;
 let cached=coastOutlineCache.get(stroke);
 if(!cached||cached.points!==stroke.points||cached.count!==stroke.points.length){
   cached={points:stroke.points,count:stroke.points.length,
     outline:caveBrushContour(stroke.points,diameter/2)};
   coastOutlineCache.set(stroke,cached);
 }
 if(cached.outline.length<3)return;
 const time=terrainMotionPreference.matches?0:performance.now()/1000;
 const crest=3+(Math.sin(time*1.8)+1)*2;
 ctx.save();
 cavePath(cached.outline,true);
 ctx.clip();
 ctx.lineJoin='round';ctx.lineCap='round';
 for(const [width,color,dash,pace] of [
   [crest+17,'rgba(112,230,220,.36)',[],0],
   [crest+7,'rgba(203,252,240,.39)',[31,8,12,5],4],
   [crest,'rgba(241,254,247,.84)',[26,9,4,7],9]
 ]){
   ctx.lineWidth=width;ctx.strokeStyle=color;
   ctx.setLineDash(dash);ctx.lineDashOffset=-time*pace;
   ctx.stroke();
 }
 ctx.restore();
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
   const s=r*(prop.scale||1),x=prop.x,y=prop.y;
   const corners=[[x-s,y-s],[x+s,y-s],[x+s,y+s],[x-s,y+s]];
   for(let i=0;i<4;i++){
     const [x1,y1]=corners[i],[x2,y2]=corners[(i+1)%4];
     walls.push({x1,y1,x2,y2,source:prop});
   }
 }
 return walls;
}

function renderSceneryLights(floor,interior){
 if(!floor)return;
 const night=state.timeOfDay==='night';
 const emitters=floor.props.map(prop=>{
   const item=sceneryItems.get(prop.type);
   if(item?.[4])return {prop,color:item[4],radius:item[5]};
   if(['campfire','hearth','braziers','torch','oilLamp','lamp'].includes(prop.type)){
     return {prop,color:'#ffae61',radius:prop.type==='campfire'?119:83};
   }
   return null;
 }).filter(Boolean);
 if(!emitters.length)return;
 const actor=activeActor();
 const walls=lightOccluders(floor);
 ctx.save();ctx.translate(state.camera.x,state.camera.y);ctx.scale(state.camera.zoom,state.camera.zoom);
 ctx.globalCompositeOperation='screen';
 for(const {prop,color,radius} of emitters){
   const x=prop.x,y=prop.y,r=radius*(prop.scale||1),zoom=state.camera.zoom;
   if(x*zoom+state.camera.x<-r*zoom||y*zoom+state.camera.y<-r*zoom||
      x*zoom+state.camera.x>canvas.width+r*zoom||y*zoom+state.camera.y>canvas.height+r*zoom)continue;
   if(interior&&!connectedCaves(floor,interior).some(c=>insideCave(c,x,y)))continue;
   const cave=(floor.caves||[]).find(c=>insideCave(c,x,y));
   if(state.mode==='player'&&cave&&(!interior||!connectedCaves(floor,interior).includes(cave)))continue;
   if(state.mode==='player'&&(floor.buildings||[]).some(b=>b.hasRoof&&buildingDistance(x,y,b)<0&&
      (!actor||actor.floor!==state.currentFloor||buildingDistance(actor.x,actor.y,b)>=0)))continue;
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
   gradient.addColorStop(0,color+'bc');gradient.addColorStop(.32,color+'69');gradient.addColorStop(1,color+'00');
   ctx.fillStyle=gradient;
   const flicker=terrainMotionPreference.matches?1:.91+.09*Math.sin(performance.now()/140+x);
   ctx.globalAlpha=(night?.92:.48)*flicker;
   ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
 }
 ctx.restore();
}

function initSceneryCatalog(){
 for(const [label,zh] of sceneryItems.values())SITE_ZH.set(label,zh);
 SITE_ZH.set('Cenografia','场景装饰');
 SITE_ZH.set('Parede curva','弧形墙');
 SITE_ZH.set('Mar costeiro','海岸水域');
 SITE_ZH.set('Costas','海岸');
 TERRAIN_GROUPS.push(['Costas',[['coastSea','Mar costeiro']]]);
 sceneryArt.addEventListener('load',()=>{
   for(const key of catalogThumbnailCache.keys()){
     if(sceneryItems.has(key.split(':')[1]))catalogThumbnailCache.delete(key);
   }
   if(architectCategory==='props')renderArchitectLibrary();
 },{once:true});
}
