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
 const read=id=>document.getElementById(id).value;
 const levels=Number(read('caveLevels'))||1;
 const w=Math.max(levels>1?290:115,Math.abs(x-a.x)),h=Math.max(levels>1?240:103,Math.abs(y-a.y));
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
   ground:read('caveGround'),wall:read('caveWall'),roof:read('caveRoof')||read('caveWall')};
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
   placeCaveStack(getScene(),state.currentFloor,cave,Number(document.getElementById('caveLevels').value)||1,
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
 const x=bounds.x+bounds.w/2,y=bounds.y+bounds.h/2;
 for(let i=0;i<levels;i++){
   const at=level+i*direction;
   const target=scene.floors[floorIndexForLevel(scene,at,true,{x,y})];
   (target.caves ||= []).push({...cave,stackId:id,entrance:i===0?cave.entrance:-1});
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

function drawCaveMountain(cave,roof){
 const b=caveBounds(cave),cx=b.x+b.w/2,cy=b.y+b.h/2;
 ctx.save();
 ctx.lineJoin='round';
 const ring=(scale,offsetX=0,offsetY=0)=>cave.points.map(p=>({
   x:cx+(p.x-cx)*scale+offsetX,y:cy+(p.y-cy)*scale+offsetY
 }));
 cavePath(ring(1.12,7,10),true);
 ctx.fillStyle='rgba(7,10,13,.48)';ctx.fill();
 for(const [scale,depth] of [[1.08,1],[.91,.8],[.70,.58],[.46,.34]]){
   cavePath(ring(scale,-9*(1-scale),-13*(1-scale)),true);
   ctx.fillStyle=mesaTerrainPaint(roof)||getTerrainPattern(ctx,roof);
   ctx.fill();
   const light=ctx.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);
   light.addColorStop(0,'rgba(218,206,181,'+(.29*(1-depth)+.11)+')');
   light.addColorStop(.52,'rgba(48,49,52,.07)');
   light.addColorStop(1,'rgba(12,15,22,'+(.46*depth+.19)+')');
   ctx.fillStyle=light;ctx.fill();
   ctx.lineWidth=2+depth*2;ctx.strokeStyle='rgba(26,28,34,.56)';ctx.stroke();
 }
 if(cave.entrance>=0){
   const a=cave.points[cave.entrance],end=cave.points[(cave.entrance+1)%cave.points.length];
   const x=(a.x+end.x)/2,y=(a.y+end.y)/2;
   ctx.translate(x,y);ctx.rotate(Math.atan2(end.y-a.y,end.x-a.x));
   ctx.fillStyle='#15191f';ctx.beginPath();ctx.ellipse(0,0,25,12,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#828078';ctx.lineWidth=3;ctx.stroke();
 }
 ctx.restore();
}

function drawCaveRoofs(floor,index){
 const actor=activeActor();
 for(const cave of floor.caves||[]){
  const roof=cave.roof||cave.wall||'caveStone';
  const person=state.mode==='architect'?buildingPointer:actor?.floor===index&&actor.sceneId===state.activeSceneId?actor:null;
  if(person&&insideCave(cave,person.x,person.y))continue;
  if(state.mode==='gm'&&!showGmBuildingRoofs)continue;
  ctx.save();
  if(state.mode==='gm')ctx.globalAlpha=.25;
  if(floor.level>=0)drawCaveMountain(cave,roof);
  else drawCaveSurface(cave,roof);
  ctx.restore();
 }
}

function eraseCave(floor,x,y){
 const cave=(floor.caves||[]).findLast(c=>caveEdges(c).some(([a,b])=>
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
