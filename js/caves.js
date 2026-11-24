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

function caveEdges(cave){
 return cave.points.map((point,i)=>[point,cave.points[(i+1)%cave.points.length],i])
  .filter(([, ,i])=>i!==cave.entrance);
}

function caveWallBlocks(floor,x,y){
 return (floor.caves||[]).some(cave=>caveEdges(cave).some(([a,b])=>
  distToSegment(x,y,a.x,a.y,b.x,b.y)<cave.thickness/2+10));
}

function caveFromDrag(a,x,y){
 const left=Math.min(a.x,x),top=Math.min(a.y,y);
 const w=Math.max(115,Math.abs(x-a.x)),h=Math.max(103,Math.abs(y-a.y));
 const read=id=>document.getElementById(id).value;
 const entry={right:0,bottom:6,left:12,top:18}[read('caveEntrance')];
 const cx=left+w/2,cy=top+h/2;
 const points=[];
 for(let i=0;i<24;i++){
   const angle=(i-.5)*Math.PI/12;
   const r=1+Math.sin(i*2.39)*.105+Math.cos(i*1.61)*.048;
   points.push({x:cx+Math.cos(angle)*w/2*r,y:cy+Math.sin(angle)*h/2*r});
 }
 if(entry!==undefined){
   const angle=entry*Math.PI/12;
   const [xMid,yMid]=[cx+Math.cos(angle)*w/2,cy+Math.sin(angle)*h/2];
   const dx=-Math.sin(angle)*28,dy=Math.cos(angle)*28;
   points[entry]={x:xMid-dx,y:yMid-dy};
   points[(entry+1)%24]={x:xMid+dx,y:yMid+dy};
   // Afastar os vértices vizinhos da boca mesmo em cavernas estreitas.
   for(const [index,sign] of [[(entry+23)%24,-1],[(entry+2)%24,1]]){
     const p=points[index],tangent=-Math.sin(angle)*(p.x-xMid)+Math.cos(angle)*(p.y-yMid);
     if(tangent*sign<36){
       p.x+=-Math.sin(angle)*(36*sign-tangent);
       p.y+=Math.cos(angle)*(36*sign-tangent);
     }
   }
 }
 return {points,entrance:entry??-1,thickness:state.wallWidth||16,
   ground:read('caveGround'),wall:read('caveWall'),roof:read('caveRoof')};
}

function applyCaveTool(x,y,isDrag){
 if(state.tool==='caveRoom'){
   dragStart ||= {x,y};
   previewRect={cave:caveFromDrag(dragStart,x,y)};
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
   if(Math.hypot(x-dragStart.x,y-dragStart.y)<=12)return;
   const cave=caveFromDrag(dragStart,x,y);
   (floor.caves ||= []).push(cave);
   for(const p of cave.points)expandFloorToInclude(floor,p.x,p.y);
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

function drawCaveBase(cave){
 drawCaveSurface(cave,cave.ground);
 ctx.save();
 ctx.lineJoin='round';ctx.lineCap='round';
 ctx.beginPath();
 for(const [a,b] of caveEdges(cave)){ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}
 ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=cave.thickness+9;ctx.stroke();
 ctx.lineWidth=cave.thickness;ctx.strokeStyle=getTerrainPattern(ctx,cave.wall);
 ctx.stroke();
 ctx.restore();
}

function drawCaveRoofs(floor,index){
 const actor=activeActor();
 for(const cave of floor.caves||[]){
  if(!cave.roof)continue;
  const person=state.mode==='architect'?buildingPointer:actor?.floor===index&&actor.sceneId===state.activeSceneId?actor:null;
  if(person&&insideCave(cave,person.x,person.y))continue;
  if(state.mode==='gm'&&!showGmBuildingRoofs)continue;
  ctx.save();
  if(state.mode==='gm')ctx.globalAlpha=.25;
  drawCaveSurface(cave,cave.roof);
  ctx.restore();
 }
}

function eraseCave(floor,x,y){
 const cave=(floor.caves||[]).findLast(c=>caveEdges(c).some(([a,b])=>
  distToSegment(x,y,a.x,a.y,b.x,b.y)<c.thickness/2+5));
 if(!cave)return false;
 floor.caves=floor.caves.filter(c=>c!==cave);
 return true;
}
