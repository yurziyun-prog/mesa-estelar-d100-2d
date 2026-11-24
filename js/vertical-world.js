const LEVEL_METRES=3;
const JUMP_CLEARANCE=2;
const worldFixtures=new Map([
 ['holoSign',['Letreiro holográfico','全息招牌',65,24]],
 ['vendingFridge',['Geladeira de venda','自动售货冰箱',47,34]],
 ['kitchenStove',['Fogão','炉灶',42,32]],
 ['industrialStove',['Fogão industrial','工业炉灶',67,40]],
 ['smartToilet',['Vaso sanitário','智能马桶',28,42]],
 ['smartSink',['Pia','洗手池',40,29]],
 ['futureBar',['Balcão futurista','未来风吧台',87,32]],
 ['poolTable',['Mesa de bilhar','台球桌',82,49]],
 ['loungeChair',['Poltrona elegante','休闲扶手椅',42,42]],
 ['loungeSofa',['Sofá elegante','休闲沙发',84,43]],
 ['hoverLift',['Elevador flutuante','悬浮电梯',62,62]]
]);

function worldFixtureEntries(decoration){
 return [...worldFixtures].filter(([id])=>['holoSign','hoverLift'].includes(id)===decoration)
   .map(([id,[label]])=>[id,'',label,'prop','Equipamentos futuristas']);
}

function isWritableSign(type){return type==='neonSignCyan'||type==='holoSign';}

function caveUnderSibling(scene,floor,cave){
 return Boolean(cave.stackId&&scene.floors.some(f=>f.level===floor.level+1&&
   (f.caves||[]).some(other=>other.stackId===cave.stackId)));
}

function roofStorey(scene,index){
 const floor=scene.floors[index],level=floorLevel(scene,index);
 return (floor.caves||[]).some(cave=>level>=0&&!cave.subsurface&&!caveUnderSibling(scene,floor,cave))||(floor.buildings||[]).some(b=>b.hasRoof);
}

function ensureStructureStoreys(scene){
 ensureFloorLevels(scene);
 scene.floors.slice().forEach((floor,index)=>{
   if(roofStorey(scene,index))floorIndexForLevel(scene,floor.level+1,true);
 });
}

function structureBelow(scene,index){
 return scene.floors.find(floor=>floor.level===scene.floors[index].level-1);
}

function onStructureTop(scene,index,x,y){
 const below=structureBelow(scene,index);
 return Boolean(below&&((below.buildings||[]).some(b=>b.hasRoof&&buildingDistance(x,y,b)<=0)||
   (below.level>=0&&(below.caves||[]).some(c=>!c.subsurface&&!caveUnderSibling(scene,below,c)&&insideCave(c,x,y)))));
}

function drawStructureStorey(scene,index){
 const below=structureBelow(scene,index);
 if(!below)return;
 drawBuildingRoofs(below,scene.floors.indexOf(below),true);
 if(below.level>=0){
   for(const cave of below.caves||[])if(!cave.subsurface&&!caveUnderSibling(scene,below,cave))drawCaveMountain(cave,cave.roof||cave.wall,false);
 }
}

function drawOutdoorTopProps(scene,index){
 const upper=floorIndexForLevel(scene,scene.floors[index].level+1);
 if(upper<0)return;
 const viewer=activeActor(),floor=scene.floors[index];
 const indoor=viewer?.floor===index?(floor.buildings||[]).filter(b=>buildingDistance(viewer.x,viewer.y,b)<0):[];
 const props=scene.floors[upper].props.filter(p=>onStructureTop(scene,upper,p.x,p.y)&&
   !indoor.some(b=>buildingDistance(p.x,p.y,b)<=0));
 for(const prop of props)drawProp(prop);
 for(const prop of props)if(plantTypes.has(prop.type))drawPlantCanopy(prop);
}

function rockTop(prop){return (prop.baseMetres||0)+(prop.metres||1);}

function reliefAt(floor,x,y){
 let height=0;
 for(const area of floor.reliefs||[]){
   if(!pointInArchitectArea(area,x,y))continue;
   let fraction=1;
   if(area.direction==='east')fraction=(x-area.x)/area.w;
   if(area.direction==='west')fraction=1-(x-area.x)/area.w;
   if(area.direction==='south')fraction=(y-area.y)/area.h;
   if(area.direction==='north')fraction=1-(y-area.y)/area.h;
   height=Math.max(height,area.metres*fraction);
 }
 return height;
}

function addRelief(floor,start,end,mode,metres){
 const dx=end.x-start.x,dy=end.y-start.y;
 if(Math.min(Math.abs(dx),Math.abs(dy))<8)return;
 const axis=Math.abs(dx)>=Math.abs(dy)?(dx>0?'east':'west'):(dy>0?'south':'north');
 const x=Math.min(start.x,end.x),y=Math.min(start.y,end.y);
 (floor.reliefs ||= []).push({x,y,w:Math.abs(dx),h:Math.abs(dy),mode,metres,
   direction:mode==='platform'?null:axis});
 expandFloorToInclude(floor,x,y);
 expandFloorToInclude(floor,x+Math.abs(dx),y+Math.abs(dy));
}

function drawReliefs(floor){
 for(const a of floor.reliefs||[]){
   ctx.save();
   ctx.fillStyle='#40382d';ctx.fillRect(a.x,a.y+6,a.w,a.h+Math.min(18,a.metres*8));
   drawTexturedArea(a.x,a.y,a.w,a.h,'dirt');
   ctx.strokeStyle='#b8a581';ctx.lineWidth=2;ctx.strokeRect(a.x,a.y,a.w,a.h);
   if(a.mode==='steps'){
     const count=Math.ceil(a.metres/.23),horizontal=['east','west'].includes(a.direction);
     ctx.beginPath();
     for(let i=1;i<count;i++){
       const x=a.x+(horizontal?a.w*i/count:0),y=a.y+(horizontal?0:a.h*i/count);
       ctx.moveTo(x,y);ctx.lineTo(x+(horizontal?0:a.w),y+(horizontal?a.h:0));
     }
     ctx.stroke();
   }
   ctx.fillStyle='#fff2d4';ctx.font='bold 12px sans-serif';ctx.fillText(a.metres+' m',a.x+6,a.y+15);
   ctx.restore();
 }
}

function fixtureRadius(type){
 const entry=worldFixtures.get(type);
 return entry&&!['hoverLift','holoSign'].includes(type)?Math.min(entry[2],entry[3])*.46:0;
}

function drawWorldFixture(p){
 const fixture=worldFixtures.get(p.type);
 if(!fixture)return false;
 const [, ,w,h]=fixture;
 const box=(x,y,width,height,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,width,height);};
 const ellipse=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,2*Math.PI);ctx.fill();};
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate((p.rot||0)*Math.PI/2);
 box(-w/2+4,-h/2+6,w,h,'rgba(0,0,0,.35)');
 box(-w/2,-h/2,w,h,'#1d2935');box(-w/2+3,-h/2+3,w-6,h-6,'#758995');
 switch(p.type){
  case 'hoverLift':
   ellipse(0,0,28,28,'#283948');ellipse(0,0,24,24,'#41d9df');ellipse(0,0,20,20,'#3e6574');
   box(-10,-1,20,2,'#c1ffff');box(-1,-10,2,20,'#c1ffff');break;
  case 'holoSign':
   box(-30,-10,60,20,'#1c6776');box(-28,-8,56,16,'#153c51');
   ctx.fillStyle='#bcfcff';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(p.signText||'◆',0,4,53);break;
  case 'vendingFridge':
   box(-19,-12,28,23,'#223a51');box(12,-11,7,11,'#56f2e8');
   for(let i=0;i<5;i++)box(-17+i*5,-5,4,9,['#efb44c','#72c7f6','#a2d56b'][i%3]);
   box(-16,9,24,3,'#0f2336');break;
  case 'kitchenStove':case 'industrialStove':
   for(const x of [-w*.23,w*.23])for(const y of [-7,6]){ellipse(x,y,6,5,'#192329');ellipse(x,y,3,3,'#a2b1bb');}
   break;
  case 'smartToilet':case 'smartSink':
   ellipse(0,2,w*.37,h*.36,'#e3edf0');ellipse(0,3,w*.27,h*.25,'#7ea6b6');
   box(-2,-h*.34,4,7,'#345261');break;
  case 'poolTable':
   box(-w/2+6,-h/2+6,w-12,h-12,'#286754');
   for(const x of [-34,0,34])for(const y of [-17,17])ellipse(x,y,3,3,'#111818');
   [[9,0],[-12,4],[-17,0],[-17,8]].forEach(([x,y],i)=>ellipse(x,y,2,2,['#fff2cb','#f4d44d','#c75965','#66a7dd'][i]));break;
  case 'loungeChair':case 'loungeSofa':
   box(-w/2+5,-h/2+4,w-10,h-8,'#514159');box(-w/2+9,-h/2+9,w-18,h-17,'#ae758d');
   if(p.type==='loungeSofa')box(-1,-h/2+9,2,h-17,'#664d69');
   box(-w/2+8,h/2-6,w-16,2,'#d5aa71');break;
  case 'futureBar':
   box(-w/2+5,-h/2+5,w-10,h-10,'#b79471');box(-w/2+5,h/2-7,w-10,2,'#48d8db');
   box(17,-10,17,11,'#374256');box(20,-8,10,6,'#69dace');break;
 }
 ctx.restore();return true;
}

function liftStops(scene,source,fixture){
 return [...new Set([source,...(fixture.stops||[])])].filter(level=>
   Number.isInteger(level)&&floorIndexForLevel(scene,level)>=0).sort((a,b)=>a-b);
}

function remoteLifts(scene,index){
 const level=floorLevel(scene,index);
 return scene.floors.flatMap(f=>f.level===level?[]:f.props.filter(p=>
   p.type==='hoverLift'&&(p.stops||[]).includes(level)).map(prop=>({prop,source:f.level})));
}

const liftRides=new WeakMap();

function liftVisualOffset(ent,now=performance.now()){
 const ride=liftRides.get(ent);
 return ride?Math.sin(Math.PI*Math.min(1,(now-ride.start)/ride.duration))*30:0;
}

function trackHoverLift(ent){
 const ride=liftRides.get(ent);
 if(ride){
   if(ride.sceneId!==ent.sceneId){liftRides.delete(ent);return false;}
   if(performance.now()<ride.start+ride.duration)return true;
   liftRides.delete(ent);
   if(canMoveTo(ride.index,ride.x,ride.y)&&stairLandingUnoccupied(getScene(),ride.index,ride.x,ride.y,ent.id)){
     ent.floor=ride.index;ent.x=ride.x;ent.y=ride.y;
     ent.stairTransitionAt=performance.now();state.currentFloor=ride.index;updateFloorLabel();
   }
   return true;
 }
 const scene=getScene(),floor=scene.floors[ent.floor];
 const lifts=[...floor.props.filter(p=>p.type==='hoverLift').map(prop=>({prop,source:floor.level})),
   ...remoteLifts(scene,ent.floor)];
 const lift=lifts.find(({prop})=>Math.hypot(prop.x-ent.x,prop.y-ent.y)<20*(prop.scale||1));
 if(!lift){ent.liftLatch=null;return;}
 const {prop,source}=lift,key=source+':'+prop.x+':'+prop.y;
 if(ent.liftLatch===key)return;
 ent.liftLatch=key;
 const levels=liftStops(scene,source,prop).filter(level=>level!==floor.level);
 if(!levels.length)return;
 const answer=prompt(translateSiteText('Escolha o andar do elevador:')+'\n'+levels.map((level,i)=>
   (i+1)+'. '+translateSiteText(floorName(level))).join('\n'));
 if(answer===null||!/^\d+$/.test(answer.trim()))return;
 const index=floorIndexForLevel(scene,levels[Number(answer)-1]);
 if(index<0||!canMoveTo(index,prop.x,prop.y)||!stairLandingUnoccupied(scene,index,prop.x,prop.y,ent.id))return;
 liftRides.set(ent,{index,x:prop.x,y:prop.y,sceneId:ent.sceneId,start:performance.now(),
   duration:Math.min(2200,450+Math.abs(scene.floors[index].level-floor.level)*LEVEL_METRES*100)});
 return true;
}

function interactVending(ent,floor){
 const fridge=floor.props.find(p=>p.type==='vendingFridge'&&Math.hypot(p.x-ent.x,p.y-ent.y)<55);
 if(!fridge)return false;
 const stock=fridge.stock||[{name:'Refrigerante',price:2},{name:'Cerveja',price:3},{name:'Comida',price:4}];
 if(!stock.length)return true;
 const credits=ent.credits??20;
 const choice=prompt(translateSiteText('Comprar produto')+' · '+credits+' CR\n'+stock.map((item,i)=>
   (i+1)+'. '+translateSiteText(item.name)+' — '+item.price+' CR').join('\n'));
 if(choice===null||!/^\d+$/.test(choice.trim()))return true;
 const item=stock[Number(choice)-1];
 if(!item)return true;
 if(item.price>credits){
   alert(translateSiteText('Créditos insuficientes.'));return true;
 }
 beginEdit();
 ent.credits=credits-item.price;
 ent.inventory.push(item.name);
 finishEdit();updateUI();return true;
}

function initVerticalWorld(){
 for(const [pt,zh] of worldFixtures.values())SITE_ZH.set(pt,zh);
}

// Boundaries covered by another room or cave are internal to the combined space.
function connectedCaves(floor,first){
 const result=[first];
 for(let i=0;i<result.length;i++){
   const one=result[i];
   for(const other of floor.caves||[]){
     if(result.includes(other))continue;
     if(one.points.some(p=>insideCave(other,p.x,p.y))||other.points.some(p=>insideCave(one,p.x,p.y)))result.push(other);
   }
 }
 return result;
}

function clipCaveInterior(floor,first){
 ctx.beginPath();
 for(const cave of connectedCaves(floor,first)){
   const area=cave.points.reduce((sum,a,i)=>{const b=cave.points[(i+1)%cave.points.length];return sum+a.x*b.y-b.x*a.y;},0);
   const points=area<0?cave.points.slice().reverse():cave.points;
   ctx.moveTo(points[0].x,points[0].y);
   for(const p of points.slice(1))ctx.lineTo(p.x,p.y);
   ctx.closePath();
 }
 ctx.clip();
}

function mergedBoundary(floor,owner,x,y){
 const rooms=(floor.buildings||[]).filter(b=>b!==owner);
 const caves=(floor.caves||[]).filter(c=>c!==owner);
 if(rooms.some(b=>buildingDistance(x,y,b)<-2)||
    caves.some(c=>insideCave(c,x,y)&&closestCaveBoundary(c,x,y).distance>2))return true;
 if(!owner.points){
   return rooms.some(other=>{
     const vertical=y>Math.max(owner.y,other.y)+5&&y<Math.min(owner.y+owner.h,other.y+other.h)-5;
     const horizontal=x>Math.max(owner.x,other.x)+5&&x<Math.min(owner.x+owner.w,other.x+other.w)-5;
     return (vertical&&[[owner.x,other.x+other.w],[owner.x+owner.w,other.x]]
       .some(([a,b])=>Math.abs(a-b)<1&&Math.abs(x-a)<owner.wallThickness/2+10))||
       (horizontal&&[[owner.y,other.y+other.h],[owner.y+owner.h,other.y]]
         .some(([a,b])=>Math.abs(a-b)<1&&Math.abs(y-a)<owner.wallThickness/2+10));
   });
 }
 return false;
}

function eraseStructureWall(floor,x,y){
 const hits=(floor.caves||[]).map(cave=>({cave,hit:closestCaveBoundary(cave,x,y)}));
 const caveHit=hits.sort((a,b)=>a.hit.distance-b.hit.distance)[0];
 if(caveHit?.hit.distance<20){
   const {cave,hit}=caveHit;
   cave.openings ||= caveOpenings(cave);
   cave.openings.push({x:hit.x,y:hit.y,angle:hit.angle,kind:'passage',width:68,open:true});
   return true;
 }
 const b=(floor.buildings||[]).findLast(room=>Math.abs(buildingDistance(x,y,room))<20);
 if(!b)return false;
 const gaps=[[Math.abs(y-b.y),{x,y:b.y,orient:'h'}],[Math.abs(y-b.y-b.h),{x,y:b.y+b.h,orient:'h'}],
   [Math.abs(x-b.x),{x:b.x,y,orient:'v'}],[Math.abs(x-b.x-b.w),{x:b.x+b.w,y,orient:'v'}]];
 const [,gap]=gaps.sort(([a],[b])=>a-b)[0];
 (b.wallGaps ||= []).push({...gap,width:68});
 return true;
}

function clipRoomWalls(floor,building){
 const bounds={x:building.x-40,y:building.y-40,w:building.w+80,h:building.h+80};
 for(const room of floor.buildings||[]){
   if(room===building)continue;
   ctx.beginPath();ctx.roundRect(room.x-2,room.y-2,room.w+4,room.h+4,buildingRadius(room)+2);
   ctx.rect(bounds.x,bounds.y,bounds.w,bounds.h);
   ctx.clip('evenodd');
 }
 for(const cave of floor.caves||[]){
   cavePath(cave.points,true);
   ctx.rect(bounds.x,bounds.y,bounds.w,bounds.h);
   ctx.clip('evenodd');
 }
}
