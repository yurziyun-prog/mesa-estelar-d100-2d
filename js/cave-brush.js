function sampleCaveBrush(points,x,y,spacing){
 const last=points.at(-1);
 const distance=Math.hypot(x-last.x,y-last.y);
 if(distance<spacing)return;
 const count=Math.ceil(distance/spacing);
 for(let i=1;i<=count;i++)points.push({x:last.x+(x-last.x)*i/count,y:last.y+(y-last.y)*i/count});
}

function caveBrushContour(samples,radius){
 const step=Math.max(7,Math.round(radius/11));
 const cells=new Set();
 for(const {x,y} of samples){
   for(let j=Math.floor((y-radius)/step);j<=Math.floor((y+radius)/step);j++){
     for(let i=Math.floor((x-radius)/step);i<=Math.floor((x+radius)/step);i++){
       if(((i+.5)*step-x)**2+((j+.5)*step-y)**2<=radius**2)cells.add(i+','+j);
     }
   }
 }
 const boundary=new Map();
 const add=(x,y,u,v)=>{
   const key=x+','+y;
   const edge={x:u,y:v};
   if(!boundary.has(key))boundary.set(key,[]);
   boundary.get(key).push(edge);
 };
 for(const key of cells){
   const [x,y]=key.split(',').map(Number);
   if(!cells.has(x+','+(y-1)))add(x,y,x+1,y);
   if(!cells.has((x+1)+','+y))add(x+1,y,x+1,y+1);
   if(!cells.has(x+','+(y+1)))add(x+1,y+1,x,y+1);
   if(!cells.has((x-1)+','+y))add(x,y+1,x,y);
 }
 let largest=[],largestArea=0;
 while(boundary.size){
   const start=boundary.keys().next().value;
   const loop=[];
   let key=start;
   do{
     const [x,y]=key.split(',').map(Number);
     loop.push({x:x*step,y:y*step});
     const edges=boundary.get(key);
     if(!edges?.length)break;
     const to=edges.pop();
     if(!edges.length)boundary.delete(key);
     key=to.x+','+to.y;
   }while(key!==start);
   if(key!==start||loop.length<3)continue;
   const area=Math.abs(loop.reduce((sum,p,i)=>{
     const next=loop[(i+1)%loop.length];
     return sum+p.x*next.y-next.x*p.y;
   },0));
   if(area>largestArea){largestArea=area;largest=loop;}
 }
 // Suaviza a malha sem transformar corredores curvos em um retângulo.
 const smoothed=largest.filter((_,i)=>i%2===0);
 return smoothed.map((p,i)=>{
   const a=smoothed[(i+smoothed.length-1)%smoothed.length],b=smoothed[(i+1)%smoothed.length];
   return {x:(a.x+2*p.x+b.x)/4,y:(a.y+2*p.y+b.y)/4};
 });
}

function closestCaveBoundary(cave,x,y){
 let best;
 for(let i=0;i<cave.points.length;i++){
   const a=cave.points[i],b=cave.points[(i+1)%cave.points.length],dx=b.x-a.x,dy=b.y-a.y;
   const lengthSquared=dx*dx+dy*dy;
   const t=lengthSquared?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/lengthSquared)):0;
   const p={x:a.x+dx*t,y:a.y+dy*t,angle:Math.atan2(dy,dx)};
   const distance=Math.hypot(x-p.x,y-p.y);
   if(!best||distance<best.distance)best={...p,distance};
 }
 return best;
}

function buildPaintedCave(points,radius){
 const read=id=>document.getElementById(id).value;
 const cave={points:caveBrushContour(points,radius),entrance:-1,thickness:state.wallWidth||16,
   ground:read('caveGround'),wall:read('caveWall'),roof:read('caveRoof')||read('caveWall'),openings:[]};
 if(!cave.points.length)return null;
 const first=points[0],next=points[1]||{x:first.x+1,y:first.y};
 const dir=Math.atan2(next.y-first.y,next.x-first.x);
 const entrance=closestCaveBoundary(cave,first.x-Math.cos(dir)*radius,first.y-Math.sin(dir)*radius);
 cave.openings.push({x:entrance.x,y:entrance.y,angle:entrance.angle,kind:'door',width:67,open:true});
 return cave;
}

function caveOpenings(cave){
 if(cave.openings)return cave.openings;
 if(!Number.isInteger(cave.entrance)||cave.entrance<0||cave.entrance>=cave.points.length)return [];
 const a=cave.points[cave.entrance],b=cave.points[(cave.entrance+1)%cave.points.length];
 return [{x:(a.x+b.x)/2,y:(a.y+b.y)/2,angle:Math.atan2(b.y-a.y,b.x-a.x),
   kind:'door',width:Math.hypot(b.x-a.x,b.y-a.y),open:true}];
}

const cavePieceCache=new WeakMap();
function caveWallPieces(cave,solid){
 const openings=caveOpenings(cave);
 const signature=JSON.stringify(openings);
 let cache=cavePieceCache.get(cave);
 if(!cache||cache.signature!==signature||cache.points!==cave.points){
   cache={signature,points:cave.points};
   cavePieceCache.set(cave,cache);
 }
 const key=solid?'solid':'visible';
 if(!cache[key])cache[key]=computeCaveWallPieces(cave,openings.filter(o=>!solid||((o.kind==='door'&&o.open)||o.kind==='passage'))
   .map(o=>solid?{...o,width:Math.max(48,o.width)}:o));
 return cache[key];
}

function computeCaveWallPieces(cave,gaps){
 if(!gaps.length)return cave.points.map((a,i)=>[a,cave.points[(i+1)%cave.points.length]]);
 const pieces=[];
 for(let i=0;i<cave.points.length;i++){
   const a=cave.points[i],b=cave.points[(i+1)%cave.points.length],dx=b.x-a.x,dy=b.y-a.y;
   const length=Math.hypot(dx,dy);
   if(!length)continue;
   let remaining=[[0,1]];
   for(const gap of gaps){
     const vx=gap.x-a.x,vy=gap.y-a.y,r=gap.width/2;
     const perpendicular=(dx*vy-dy*vx)/length;
     if(Math.abs(perpendicular)>=r)continue;
     const mid=(vx*dx+vy*dy)/(length*length);
     const span=Math.sqrt(r*r-perpendicular*perpendicular)/length;
     const from=mid-span,to=mid+span;
     remaining=remaining.flatMap(([l,h])=>to<=l||from>=h?[[l,h]]:[
       ...(from>l?[[l,from]]:[]),...(to<h?[[to,h]]:[])
     ]);
   }
   const point=t=>({x:a.x+dx*t,y:a.y+dy*t});
   for(const [l,h] of remaining)pieces.push([point(l),point(h)]);
 }
 return pieces;
}

function editCaveOpening(floor,start,x,y){
 const mode=document.getElementById('caveEditMode').value;
 const candidates=(floor.caves||[]).map(cave=>({cave,hit:closestCaveBoundary(cave,start.x,start.y)}))
   .sort((a,b)=>a.hit.distance-b.hit.distance);
 const selected=candidates[0];
 if(!selected||selected.hit.distance>36)return;
 const {cave}=selected;
 cave.openings=caveOpenings(cave);
 cave.entrance=-1;
 const existing=cave.openings.find(o=>Math.hypot(o.x-start.x,o.y-start.y)<Math.max(24,o.width/2));
 if(mode==='seal'){
   if(existing)cave.openings=cave.openings.filter(o=>o!==existing);
   return;
 }
 const hit=closestCaveBoundary(cave,x,y);
 if(hit.distance>45)return;
 const kind=mode==='window'?'window':'door',width=Number(document.getElementById('caveGapWidth').value)||60;
 if(cave.openings.some(o=>o!==existing&&Math.hypot(o.x-hit.x,o.y-hit.y)<(width+o.width)/2))return;
 const detail={x:hit.x,y:hit.y,angle:hit.angle,kind,width,open:kind==='door'&&(existing?.kind!=='door'||existing.open)};
 if(existing)Object.assign(existing,detail);else cave.openings.push(detail);
}

// The threshold bridges the terrain seam in either direction, including old maps.
function caveDoorThreshold(door,x,y,depth=45){
 const dx=x-door.x,dy=y-door.y;
 const angle=door.angle||0,c=Math.cos(angle),s=Math.sin(angle);
 return Math.abs(dx*c+dy*s)<Math.max(48,door.width)/2-10 &&
   Math.abs(-dx*s+dy*c)<depth;
}

function caveEntranceGround(floor,x,y){
 return (floor.caves||[]).some(cave=>caveOpenings(cave).some(door=>
   door.kind==='door'&&caveDoorThreshold(door,x,y)));
}

function interactCaveDoor(floor,entity){
 for(const cave of floor.caves||[]){
   const door=caveOpenings(cave).find(opening=>opening.kind==='door'&&Math.hypot(opening.x-entity.x,opening.y-entity.y)<44);
   if(!door)continue;
   if(!door.open){
     door.open=true;
   }else if(cave.openings&&insideCave(cave,entity.x,entity.y)&&!caveDoorThreshold(door,entity.x,entity.y,23)){
     door.open=false;
   }
   return true;
 }
 return false;
}
