function cavePath(points,closed=false){
 ctx.beginPath();
 ctx.moveTo(points[0].x,points[0].y);
 for(const point of points.slice(1))ctx.lineTo(point.x,point.y);
 if(closed)ctx.closePath();
}

function insideCave(cave,x,y){
 let inside=false;
 for(let i=0,j=cave.points.length-1;i<cave.points.length;j=i++){
  const a=cave.points[i],b=cave.points[j];
  if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}

// Fixed world units keep the shell thickness independent of the cave's span.
const CAVE_FOOT_MARGIN=12;
const CAVE_MOUNTAIN_TIERS=[[CAVE_FOOT_MARGIN,1],[8,.8],[4,.58],[0,.34]];

function caveWallBlocks(floor,x,y){
 return (floor.caves||[]).some(cave=>{
   if(mergedBoundary(floor,cave,x,y))return false;
   if(caveOpenings(cave).some(door=>(door.kind==='door'||door.kind==='passage')&&door.open&&
     caveDoorThreshold(door,x,y,CAVE_FOOT_MARGIN+24)))return false;
   const outside=!insideCave(cave,x,y);
   const foot=outside&&floor.level>=0&&!cave.subsurface?CAVE_FOOT_MARGIN:0;
   const clearance=Math.max(cave.thickness/2,foot)+10;
   return caveWallPieces(cave,true).some(([a,b])=>
     distToSegment(x,y,a.x,a.y,b.x,b.y)<clearance);
 });
}

function currentCaveBrushRadius(){
 const levels=Number(document.getElementById('caveLevels').value)||1;
 const radius=Number(document.getElementById('caveBrushRadius').value)||110;
 return Math.max(levels>1?106:65,radius);
}

function applyCaveTool(x,y,isDrag){
 if(state.tool==='caveRoom'){
   dragStart ||= {x,y,points:[{x,y}]};
   if(document.getElementById('caveEditMode').value!=='paint')return;
   const radius=currentCaveBrushRadius();
   sampleCaveBrush(dragStart.points,x,y,Math.max(8,radius/6));
   previewRect={caveBrush:{points:dragStart.points,radius}};
 }else{
   if(!isDrag||!dragStart)dragStart={points:[{x,y}]};
   const points=dragStart.points,last=points.at(-1);
   const length=Math.hypot(x-last.x,y-last.y);
   if(length>=11){
     const count=Math.ceil(length/17);
     for(let i=1;i<=count;i++){
       const bend=i===count?0:Math.sin(points.length*2.4)*3.5;
       points.push({x:last.x+(x-last.x)*i/count-(y-last.y)*bend/length,
        y:last.y+(y-last.y)*i/count+(x-last.x)*bend/length});
     }
   }
   previewRect={caveWall:points};
 }
}

function finishCaveTool(floor,x,y){
 if(state.tool==='caveRoom'){
   if(document.getElementById('caveEditMode').value!=='paint'){
     editCaveOpening(floor,dragStart,x,y);
     return;
   }
   const radius=currentCaveBrushRadius();
   sampleCaveBrush(dragStart.points,x,y,4);
   const cave=buildPaintedCave(dragStart.points,radius);
   if(cave)placeCaveStack(getScene(),state.currentFloor,cave,Number(document.getElementById('caveLevels').value)||1,
     Number(document.getElementById('caveLevelDirection').value)||-1);
   return;
 }
 const points=dragStart.points;
 const group='cave-wall-'+crypto.randomUUID();
 for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];
   floor.walls.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,width:state.wallWidth||16,material:'caveRock',archGroupId:group});
   expandFloorToInclude(floor,b.x,b.y);
 }
}

function placeCaveStack(scene,index,cave,levels,direction){
 const level=floorLevel(scene,index),id=crypto.randomUUID(),bounds=caveBounds(cave);
 const middle={x:bounds.x+bounds.w/2,y:bounds.y+bounds.h/2};
 const candidates=[middle,...(cave.points.map(point=>({x:(point.x+middle.x)/2,y:(point.y+middle.y)/2})))];
 const clearance=p=>insideCave(cave,p.x,p.y)?closestCaveBoundary(cave,p.x,p.y).distance:-1;
 const {x,y}=candidates.reduce((best,p)=>clearance(p)>clearance(best)?p:best,middle);
 for(let i=0;i<levels;i++){
   const at=level+i*direction;
   const target=scene.floors[floorIndexForLevel(scene,at,true,{x,y})];
   (target.caves ||= []).push({...cave,stackId:id,subsurface:at<0,entrance:i===0?cave.entrance:-1,openings:i===0?caveOpenings(cave):[]});
   for(const point of cave.points)expandFloorToInclude(target,point.x,point.y);
   if(i>0){
     const pair=createStairPair(scene,at-direction,at,x+(i%2?-42:42),y,'open','stone','normal');
     pair.origin.caveStackId=pair.destination.caveStackId=id;
   }
 }
}

function viewerCave(floor,index){
 const actor=state.mode==='architect'?null:activeActor();
 if(!actor||actor.sceneId!==state.activeSceneId||actor.floor!==index)return null;
 return (floor.caves||[]).findLast(cave=>insideCave(cave,actor.x,actor.y))||null;
}

function caveBounds(cave){
 const xs=cave.points.map(point=>point.x),ys=cave.points.map(point=>point.y);
 const x=Math.min(...xs),y=Math.min(...ys);
 return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
}

function drawCaveSurface(cave,material){
 const b=caveBounds(cave);
 ctx.save();cavePath(cave.points,true);ctx.clip();
 drawTexturedArea(b.x,b.y,b.w,b.h,material);
 ctx.restore();
}

function drawCaveBase(cave,floor=null){
 drawCaveSurface(cave,cave.ground);
 ctx.save();
 ctx.lineJoin='round';ctx.lineCap='round';
 ctx.beginPath();
 for(const [a,b] of caveWallPieces(cave,false)){
   const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/10));
   for(let i=0;i<n;i++){
     const point=t=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
     const m=point((i+.5)/n);
     if(floor&&mergedBoundary(floor,cave,m.x,m.y))continue;
     const p=point(i/n),q=point((i+1)/n);
     ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
   }
 }
 ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=cave.thickness+9;ctx.stroke();
 ctx.lineWidth=cave.thickness;ctx.strokeStyle=getTerrainPattern(ctx,cave.wall);
 ctx.stroke();
 ctx.restore();
 for(const opening of caveOpenings(cave))drawCaveOpening(opening);
}

function overlapsCaveMountain(cave,rect){
 const margin=CAVE_FOOT_MARGIN+2;
 return polygonOverlapsRoof(cave.points,{
   x:rect.x-margin,y:rect.y-margin,w:rect.w+2*margin,h:rect.h+2*margin
 });
}

function polygonOverlapsRoof(points,rect){
 const outline={points};
 const {x,y,w,h}=rect;
 if(outline.points.some(p=>pointInArchitectArea(rect,p.x,p.y)))return true;
 if([[x,y],[x+w,y],[x,y+h],[x+w,y+h]].some(([px,py])=>insideCave(outline,px,py)))return true;
 return outline.points.some((a,i)=>{
   const next=outline.points[(i+1)%outline.points.length],dx=next.x-a.x,dy=next.y-a.y;
   return (dx!==0&&[x,x+w].some(edge=>{
     const t=(edge-a.x)/dx,at=a.y+t*dy;
     return t>=0&&t<=1&&at>=y&&at<=y+h;
   }))||(dy!==0&&[y,y+h].some(edge=>{
     const t=(edge-a.y)/dy,at=a.x+t*dx;
     return t>=0&&t<=1&&at>=x&&at<=x+w;
   }));
 });
}

function caveMountainMasksRoof(floor,rect){
 return floor.level>=0&&(floor.caves||[]).some(cave=>!cave.subsurface&&overlapsCaveMountain(cave,rect));
}

// Prevent house roofs projected from the same or a higher floor from covering the cave.
function clipOutsideCaves(caves,bounds){
 for(const cave of caves||[]){
   if(!overlapsCaveMountain(cave,bounds))continue;
   cavePath(cave.points,true);
   ctx.rect(bounds.x-1,bounds.y-1,bounds.w+2,bounds.h+2);
   ctx.clip('evenodd');
 }
}

function drawCaveApron(cave){
 for(const door of caveOpenings(cave)){
   if(door.kind!=='door')continue;
   ctx.save();ctx.translate(door.x,door.y);ctx.rotate(door.angle||0);
   const radius=Math.max(48,door.width)/2;
   ctx.beginPath();ctx.ellipse(0,0,radius+2,45,0,0,Math.PI*2);
   ctx.fillStyle=getTerrainPattern(ctx,cave.ground);ctx.fill();
   ctx.restore();
 }
}

function drawCaveMountain(cave,roof,showOpenings=true){
 const b=caveBounds(cave);
 ctx.save();
 ctx.lineJoin='round';
 ctx.save();ctx.translate(3,5);
 cavePath(cave.points,true);
 ctx.fillStyle='rgba(7,10,13,.42)';ctx.fill();
 ctx.strokeStyle='rgba(7,10,13,.42)';ctx.lineWidth=CAVE_FOOT_MARGIN*2;ctx.stroke();
 ctx.restore();
 for(const [margin,depth] of CAVE_MOUNTAIN_TIERS){
   cavePath(cave.points,true);
   const texture=mesaTerrainPaint(roof)||getTerrainPattern(ctx,roof);
   const light=ctx.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);
   light.addColorStop(0,'rgba(218,206,181,'+(.29*(1-depth)+.11)+')');
   light.addColorStop(.52,'rgba(48,49,52,.07)');
   light.addColorStop(1,'rgba(12,15,22,'+(.46*depth+.19)+')');
   if(margin){
     ctx.lineWidth=margin*2+2;ctx.strokeStyle='rgba(26,28,34,.56)';ctx.stroke();
     ctx.lineWidth=margin*2;ctx.strokeStyle=texture;ctx.stroke();
     ctx.strokeStyle=light;ctx.stroke();
   }
   ctx.fillStyle=texture;ctx.fill();
   ctx.fillStyle=light;ctx.fill();
 }
 ctx.lineWidth=2;ctx.strokeStyle='rgba(26,28,34,.68)';ctx.stroke();
 if(showOpenings)for(const entrance of caveOpenings(cave))drawCaveOpening(entrance);
 ctx.restore();
}

function drawCaveRoofs(floor,index){
 const actor=activeActor();
 for(const cave of floor.caves||[]){
  const roof=cave.roof||cave.wall||'caveStone';
  if(state.mode==='architect'||floor.level<0||cave.subsurface||caveUnderSibling(getScene(),floor,cave))continue;
  const person=actor?.floor===index&&actor.sceneId===state.activeSceneId?actor:null;
  if(person&&insideCave(cave,person.x,person.y))continue;
  ctx.save();
  if(floor.level>=0)drawCaveMountain(cave,roof);
  else drawCaveSurface(cave,roof);
  ctx.restore();
 }
}

function eraseCave(floor,x,y){
 const cave=(floor.caves||[]).findLast(c=>caveWallPieces(c,true).some(([a,b])=>
  distToSegment(x,y,a.x,a.y,b.x,b.y)<c.thickness/2+5));
 if(!cave)return false;
 const scene=getScene();
 if(!cave.stackId){floor.caves=floor.caves.filter(c=>c!==cave);return true;}
 for(const level of scene.floors){
   const links=new Set(level.stairs.filter(stair=>stair.caveStackId===cave.stackId).map(stair=>stair.linkId));
   level.caves=(level.caves||[]).filter(c=>c.stackId!==cave.stackId);
   level.stairs=level.stairs.filter(stair=>stair.caveStackId!==cave.stackId);
   level.openings=level.openings.filter(opening=>!links.has(opening.stairLinkId));
 }
 return true;
}


function drawCaveOpening(opening){
 if(opening.kind==='passage')return;
 ctx.save();ctx.translate(opening.x,opening.y);ctx.rotate(opening.angle);
 const r=opening.width/2;
 ctx.fillStyle=opening.kind==='window'?'#313c45':opening.open?'#241f1a':'#584331';
 ctx.beginPath();ctx.ellipse(0,0,r,10,0,0,Math.PI*2);ctx.fill();
 if(opening.kind==='door'){
   const rim=ctx.createLinearGradient(0,-11,0,11);
   rim.addColorStop(0,'#988e77');rim.addColorStop(.55,'#57534a');rim.addColorStop(1,'#282724');
   ctx.strokeStyle=rim;ctx.lineWidth=4;ctx.stroke();
   ctx.strokeStyle='#c1ac85';ctx.lineWidth=1;
   ctx.beginPath();ctx.ellipse(0,0,r-2,8,0,Math.PI*1.1,Math.PI*1.88);ctx.stroke();
 }else{
   ctx.strokeStyle='#9a9588';ctx.lineWidth=2;ctx.stroke();
 }
 if(opening.kind==='window'){
   ctx.strokeStyle='#aab6b2';
   for(let x=-r+8;x<r-5;x+=10){
     ctx.beginPath();ctx.moveTo(x,-6);ctx.lineTo(x,6);ctx.stroke();
   }
 }else if(!opening.open){
   ctx.fillStyle='#b79b61';ctx.fillRect(r*.57,-2,4,4);
 }
 ctx.restore();
}

function drawCaveBrushPreview(brush){
 ctx.save();ctx.globalAlpha=.58;
 ctx.fillStyle=getTerrainPattern(ctx,document.getElementById('caveGround').value);
 ctx.beginPath();
 for(const p of brush.points){
   ctx.moveTo(p.x+brush.radius,p.y);
   ctx.arc(p.x,p.y,brush.radius,0,Math.PI*2);
 }
 ctx.fill();ctx.restore();
}
