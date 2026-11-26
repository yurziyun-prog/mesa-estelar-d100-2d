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
   dark:.61*Math.max(0,Math.min(1,(.15-elevation)/.48)),
   warm:twilight*.14,
   evening:minute>=720
 };
}

function updateDaylightControls(){
 const minute=daylightMinute();
 document.getElementById('mapTime').value=String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
 document.getElementById('mapTimeAuto').checked=Boolean(state.daylightAuto);
 document.getElementById('timeOfDaySelect').value=state.timeOfDay||'day';
}

function setMapDaylight(minute){
 state.daylightMinute=((minute%1440)+1440)%1440;
 const time=state.daylightMinute;
 state.timeOfDay=time<330||time>=1140?'night':time<435?'dawn':time>=1020?'dusk':'day';
 updateDaylightControls();
}

function advanceMapDaylight(elapsed){
 if(!state.daylightAuto){daylightSeconds=0;return;}
 daylightSeconds+=elapsed;
 const minutes=Math.floor(daylightSeconds);
 if(!minutes)return;
 daylightSeconds-=minutes;
 setMapDaylight(daylightMinute()+minutes);
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

function renderSceneryLights(floor,interior){
 if(!floor)return;
 const darkness=daylightLighting().dark;
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
   ctx.globalAlpha=(.48+darkness*.72)*flicker;
   ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
 }
 ctx.restore();
}

function initSceneryCatalog(){
 for(const [label,zh] of sceneryItems.values())SITE_ZH.set(label,zh);
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
     const sx=px+dx*.01,sy=py+dy*.01;
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
