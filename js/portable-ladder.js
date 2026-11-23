// Escadas portáteis: móveis, não escadas estruturais.
// Estados: portátil comum (deitada/apoiada), dobrável (fechada/aberta).
const PORTABLE_LADDERS=new Set(['portableLadder','foldingLadder']);
function isPortableLadder(p){return Boolean(p&&PORTABLE_LADDERS.has(p.type));}
function ladderState(p){return p.ladderState||(p.type==='foldingLadder'?'folded':'lying');}
function uprightPortableLadder(p){return isPortableLadder(p)&&['leaning','open'].includes(ladderState(p));}
function portableLadderAt(floor,x,y,radius=43){
 return floor.props.filter(isPortableLadder).find(p=>Math.hypot(p.x-x,p.y-y)<radius);
}
function ladderHasWallSupport(floor,p){
 return floor.walls.some(w=>distToSegment(p.x,p.y,w.x1,w.y1,w.x2,w.y2)<72)
    ||floor.props.some(q=>q!==p&&['rock','cabinet','bookshelf'].includes(q.type)&&Math.hypot(q.x-p.x,q.y-p.y)<72);
}
function deployPortableLadder(ent,p){
 const floor=getScene().floors[ent.floor];
 const current=ladderState(p);
 if(p.type==='portableLadder'){
   if(current==='lying'&&!ladderHasWallSupport(floor,p)){
     say(ent,'Esta escada precisa de uma parede ou apoio próximo.');
     return;
   }
   p.ladderState=current==='lying'?'leaning':'lying';
 }else p.ladderState=current==='folded'?'open':'folded';
 logEvent('🪜 '+ent.name+' '+(uprightPortableLadder(p)?'preparou':'guardou')+' a escada '+(p.type==='foldingLadder'?'dobrável':'de mão')+'.');
}
function interactPortableLadder(ent){
 const scene=getScene(),floor=scene.floors[ent.floor],p=portableLadderAt(floor,ent.x,ent.y,85);
 if(!p){
   // 从楼上回到原来的梯子位置；无需复制楼梯家具。
   const lower=floorIndexForLevel(scene,floorLevel(scene,ent.floor)-1,false);
   const below=lower>=0?portableLadderAt(scene.floors[lower],ent.x,ent.y,60):null;
   if(below&&uprightPortableLadder(below)){
     const answer=prompt('Escada móvel abaixo: digite DESCER para retornar ao andar inferior.','descer');
     if(answer?.trim().toLowerCase()==='descer'){
       ent.floor=lower;ent.x=below.x;ent.y=below.y+28;
       ent.stairCooldown=performance.now()+950;ent.stairTransitionAt=performance.now();
       state.currentFloor=lower;updateFloorLabel();
       logEvent('🪜 '+ent.name+' desceu ao '+floorName(floorLevel(scene,lower))+' pela escada móvel.');
     }
     return true;
   }
   return false;
 }
 const action=ladderState(p);
 if(uprightPortableLadder(p)){
   const answer=prompt('Escada '+(p.type==='foldingLadder'?'dobrável':'de mão')+
     ': digite SUBIR para tentar alcançar o andar superior, ou GUARDAR para recolher.','subir');
   if(answer===null)return true;
   if(answer.trim().toLowerCase()==='subir'){climbPortableLadder(ent,p);return true;}
   if(answer.trim().toLowerCase()!=='guardar')return true;
 }
 deployPortableLadder(ent,p);return true;
}
function climbPortableLadder(ent,p){
 if(!uprightPortableLadder(p))return false;
 const scene=getScene(),level=floorLevel(scene,ent.floor);
 const target=floorIndexForLevel(scene,level+1,false);
 if(target<0){
   say(ent,'Ainda não existe um andar superior para alcançar.');
   return false;
 }
 // A escada móvel não altera a construção nem cria novos andares.
 const destination=scene.floors[target];
 const nearLanding=destination.areas.some(a=>p.x>=a.x-32&&p.x<=a.x+a.w+32&&p.y>=a.y-32&&p.y<=a.y+a.h+32);
 if(!nearLanding){
   say(ent,'Não há um patamar acessível neste ponto.');
   return false;
 }
 ent.floor=target;ent.x=p.x;ent.y=p.y+31;
 ent.stairCooldown=performance.now()+950;ent.stairTransitionAt=performance.now();
 state.currentFloor=target;updateFloorLabel();
 logEvent('🪜 '+ent.name+' alcançou '+floorName(level+1)+' usando uma escada móvel.');
 return true;
}
function drawPortableLadder(p){
 const stateName=ladderState(p),folding=p.type==='foldingLadder';
 const x=p.x,y=p.y;
 ctx.save();ctx.translate(x,y);ctx.rotate(((p.rot||0)%4)*Math.PI/2);
 const wood=p.material!=='metal',base=wood?'#a97745':'#7e9fae',highlight=wood?'#d8ae77':'#c6dfe3',outline=wood?'#533923':'#364e5d';
 ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(5,10,folding?28:23,stateName==='lying'?52:32,0,0,Math.PI*2);ctx.fill();
 if(folding&&stateName==='open'){
   // A-frame: dois lances abertos e travessa central.
   for(const offset of [-13,13]){
     ctx.save();ctx.translate(offset,0);ctx.rotate(offset<0?-.22:.22);
     ctx.strokeStyle=outline;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-14,-38);ctx.lineTo(-14,35);ctx.moveTo(14,-38);ctx.lineTo(14,35);ctx.stroke();
     ctx.strokeStyle=highlight;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-14,-38);ctx.lineTo(-14,35);ctx.moveTo(14,-38);ctx.lineTo(14,35);ctx.stroke();
     for(let i=-28;i<=28;i+=14){ctx.strokeStyle=base;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,i);ctx.lineTo(12,i);ctx.stroke();}
     ctx.restore();
   }
   ctx.strokeStyle='#ddc06d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-20,12);ctx.lineTo(20,12);ctx.stroke();
 }else{
   const folded=stateName==='folded',lying=stateName==='lying';
   if(lying)ctx.rotate(Math.PI/2);
   const half=folded?9:19, length=folded?65:86;
   ctx.strokeStyle=outline;ctx.lineWidth=8;
   ctx.beginPath();ctx.moveTo(-half,-length/2);ctx.lineTo(-half,length/2);ctx.moveTo(half,-length/2);ctx.lineTo(half,length/2);ctx.stroke();
   ctx.strokeStyle=highlight;ctx.lineWidth=4;
   ctx.beginPath();ctx.moveTo(-half,-length/2);ctx.lineTo(-half,length/2);ctx.moveTo(half,-length/2);ctx.lineTo(half,length/2);ctx.stroke();
   for(let i=-length/2+12;i<length/2;i+=13){
     ctx.strokeStyle=outline;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-half+2,i);ctx.lineTo(half-2,i);ctx.stroke();
     ctx.strokeStyle=base;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-half+2,i-1);ctx.lineTo(half-2,i-1);ctx.stroke();
   }
   if(!lying&&!folded){
     ctx.fillStyle='rgba(10,17,24,.35)';ctx.beginPath();ctx.moveTo(half+2,-length/2);ctx.lineTo(half+15,length/2);ctx.lineTo(half+3,length/2);ctx.closePath();ctx.fill();
   }
 }
 ctx.restore();
}
