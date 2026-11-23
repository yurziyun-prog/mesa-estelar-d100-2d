// Ferramenta unificada de seleção, movimentação e transformação do Arquiteto.
// Estado apenas de interface, não é gravado nos cenários.
let architectSelections=[];
let architectSelectionGesture=null;
let architectShiftHeld=false;
const MAP_UNITS_PER_METER=32; // convenção de projeto: 32 unidades de mundo = 1 m
function objectForSelection(ref){
 const scene=getScene(),floor=scene?.floors?.[state.currentFloor];
 return ref.kind==='entities'?state.entities[ref.index]:floor?.[ref.kind]?.[ref.index];
}
function selectionBoundsOne(ref){
 const obj=objectForSelection(ref);if(!obj)return null;
 if(ref.kind==='walls')return {x:Math.min(obj.x1,obj.x2),y:Math.min(obj.y1,obj.y2),w:Math.abs(obj.x2-obj.x1),h:Math.abs(obj.y2-obj.y1)};
 if(ref.kind==='areas')return {x:obj.x,y:obj.y,w:obj.w,h:obj.h};
 const r=ref.kind==='stairs'?50:ref.kind==='props'?24*(obj.scale||1):ref.kind==='entities'?16:24;
 return {x:obj.x-r,y:obj.y-r,w:2*r,h:2*r};
}
function architectSelectionBounds(){
 const boxes=architectSelections.map(selectionBoundsOne).filter(Boolean);
 if(!boxes.length)return null;
 const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
 const x2=Math.max(...boxes.map(b=>b.x+b.w)),y2=Math.max(...boxes.map(b=>b.y+b.h));
 return {x,y,w:Math.max(1,x2-x),h:Math.max(1,y2-y)};
}
function rectContains(b,x,y){return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;}
function architectSelectionHit(wx,wy){
 const hit=hitArchitectObjectAt(wx,wy);
 if(hit)return hit;
 for(let i=state.entities.length-1;i>=0;i--){
  const e=state.entities[i];
  if(e.sceneId===state.activeSceneId&&e.floor===state.currentFloor&&Math.hypot(e.x-wx,e.y-wy)<23)return {kind:'entities',index:i};
 }
 return null;
}
function updateArchitectSelectionUI(){
 selectedMapObject=architectSelections.length===1&&architectSelections[0].kind!=='entities'?architectSelections[0]:null;
 state.selectedWallIdx=selectedMapObject?.kind==='walls'?selectedMapObject.index:null;
 updateSelectedWallBar();
 if(typeof onArchitectSelectionChange==='function')onArchitectSelectionChange();
 const label=document.getElementById('architectLibrarySelected');
 if(label&&state.tool==='move')label.textContent=architectSelections.length?
  architectSelections.length+' item(ns) selecionado(s). Arraste para mover ou use o canto inferior direito para redimensionar.':
  'Arraste sobre uma área vazia para selecionar vários objetos.';
}
function selectionSnapshot(){
 return architectSelections.map(ref=>({ref,original:structuredClone(objectForSelection(ref))})).filter(e=>e.original);
}
function handleArchitectSelection(wx,wy,isDrag){
 if(!isDrag){
  const b=architectSelectionBounds();
  if(b&&Math.hypot(wx-(b.x+b.w),wy-(b.y+b.h))<Math.max(11,12/state.camera.zoom)){
   architectSelectionGesture={mode:'resize',x:wx,y:wy,bounds:b,items:selectionSnapshot()};
   return;
  }
  const hit=architectSelectionHit(wx,wy);
  if(hit?.kind==='areas'){
   // Clique simples seleciona o piso; arrastar sobre ele cria seleção por área.
   architectSelections=[];
   architectSelectionGesture={mode:'marquee',x:wx,y:wy,x2:wx,y2:wy,clickTarget:hit};
   updateArchitectSelectionUI();
  }else if(hit){
   if(!architectSelections.some(s=>s.kind===hit.kind&&s.index===hit.index))architectSelections=[hit];
   architectSelectionGesture={mode:'move',x:wx,y:wy,items:selectionSnapshot()};
   updateArchitectSelectionUI();
  }else{
   architectSelections=[];architectSelectionGesture={mode:'marquee',x:wx,y:wy,x2:wx,y2:wy};updateArchitectSelectionUI();
  }
  return;
 }
 const gesture=architectSelectionGesture;if(!gesture)return;
 if(gesture.mode==='marquee'){gesture.x2=wx;gesture.y2=wy;return;}
 if(gesture.mode==='move'){
  const dx=wx-gesture.x,dy=wy-gesture.y;
  for(const {ref,original} of gesture.items){
   const item=objectForSelection(ref);if(!item)continue;
   if(ref.kind==='walls'){
    item.x1=original.x1+dx;item.x2=original.x2+dx;
    item.y1=original.y1+dy;item.y2=original.y2+dy;
   }else{item.x=original.x+dx;item.y=original.y+dy;}
  }
 }else if(gesture.mode==='resize'){
  const b=gesture.bounds;
  const fx=Math.max(.15,Math.min(5,(wx-b.x)/Math.max(1,b.w)));
  const fy=Math.max(.15,Math.min(5,(wy-b.y)/Math.max(1,b.h)));
  for(const {ref,original} of gesture.items){
   const item=objectForSelection(ref);if(!item)continue;
   if(ref.kind==='walls'){
    item.x1=b.x+(original.x1-b.x)*fx;item.x2=b.x+(original.x2-b.x)*fx;
    item.y1=b.y+(original.y1-b.y)*fy;item.y2=b.y+(original.y2-b.y)*fy;
   }else if(ref.kind==='areas'){
    item.x=b.x+(original.x-b.x)*fx;item.y=b.y+(original.y-b.y)*fy;
    item.w=Math.max(1,original.w*fx);item.h=Math.max(1,original.h*fy);
   }else{
    item.x=b.x+(original.x-b.x)*fx;item.y=b.y+(original.y-b.y)*fy;
    if(ref.kind==='props')item.scale=Math.max(.25,Math.min(4,(original.scale||1)*Math.min(fx,fy)));
   }
  }
 }
}
function finishArchitectSelection(wx,wy){
 const g=architectSelectionGesture;architectSelectionGesture=null;
 if(!g)return;
 if(g.mode==='marquee'){
  const b={x:Math.min(g.x,wx),y:Math.min(g.y,wy),w:Math.abs(wx-g.x),h:Math.abs(wy-g.y)};
  if(b.w>3&&b.h>3){
   const floor=getScene().floors[state.currentFloor],selected=[];
   for(const kind of ['areas','walls','doors','windows','stairs','chests','props']){
    for(let i=0;i<(floor[kind]||[]).length;i++){
     const ref={kind,index:i},box=selectionBoundsOne(ref);
     if(box&&box.x>=b.x&&box.y>=b.y&&box.x+box.w<=b.x+b.w&&box.y+box.h<=b.y+b.h)selected.push(ref);
    }
   }
   for(let i=0;i<state.entities.length;i++){
    const e=state.entities[i];
    if(e.sceneId===state.activeSceneId&&e.floor===state.currentFloor&&rectContains(b,e.x,e.y))selected.push({kind:'entities',index:i});
   }
   architectSelections=selected;
  }else if(g.clickTarget)architectSelections=[g.clickTarget];
 }
 updateArchitectSelectionUI();
}
function drawArchitectSelectionHUD(){
 if(state.mode!=='architect')return;
 ctx.save();ctx.translate(state.camera.x,state.camera.y);ctx.scale(state.camera.zoom,state.camera.zoom);
 const g=architectSelectionGesture;
 const b=g?.mode==='marquee'
   ?{x:Math.min(g.x,g.x2),y:Math.min(g.y,g.y2),w:Math.abs(g.x2-g.x),h:Math.abs(g.y2-g.y)}
   :architectSelectionBounds();
 if(b){
  ctx.strokeStyle='#f1c562';ctx.lineWidth=1.7/state.camera.zoom;
  ctx.setLineDash([6/state.camera.zoom,4/state.camera.zoom]);
  ctx.fillStyle='rgba(241,197,98,.08)';ctx.fillRect(b.x,b.y,b.w,b.h);
  ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.setLineDash([]);
  const measure=(b.w/MAP_UNITS_PER_METER).toFixed(1)+' × '+(b.h/MAP_UNITS_PER_METER).toFixed(1)+' m';
  ctx.font=(12/state.camera.zoom)+'px system-ui';ctx.textAlign='left';ctx.textBaseline='bottom';
  const tw=ctx.measureText(measure).width;
  ctx.fillStyle='rgba(14,20,30,.9)';
  ctx.fillRect(b.x,b.y-24/state.camera.zoom,tw+12/state.camera.zoom,21/state.camera.zoom);
  ctx.fillStyle='#f7e4b7';ctx.fillText(measure,b.x+6/state.camera.zoom,b.y-7/state.camera.zoom);
  if(g?.mode!=='marquee'){
   const size=10/state.camera.zoom;ctx.fillStyle='#f1c562';ctx.fillRect(b.x+b.w-size/2,b.y+b.h-size/2,size,size);
  }
 }
 ctx.restore();
}
function drawArchitectMapGuides(){
 if(state.mode!=='architect')return;
 const w=canvas.width,h=canvas.height;
 ctx.save();ctx.fillStyle='rgba(14,20,30,.72)';
 ctx.beginPath();ctx.roundRect(w-92,12,80,87,9);ctx.fill();
 ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillStyle='#e3eaf2';ctx.font='bold 11px system-ui';
 ctx.fillText('N',w-52,26);ctx.fillText('S',w-52,85);
 ctx.fillText('O',w-76,57);ctx.fillText('L',w-29,57);
 ctx.strokeStyle='#e7ba65';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(w-52,35);ctx.lineTo(w-46,60);ctx.lineTo(w-52,54);ctx.lineTo(w-58,60);ctx.closePath();ctx.stroke();
 // Escala em unidades de mundo, não em pixels fixos: acompanha zoom.
 const meters=state.camera.zoom>.9?4:state.camera.zoom>.55?8:12;
 const width=meters*MAP_UNITS_PER_METER*state.camera.zoom;
 const bx=18,by=h-30;
 ctx.fillStyle='rgba(14,20,30,.75)';ctx.beginPath();ctx.roundRect(10,h-62,Math.max(155,width+20),54,8);ctx.fill();
 ctx.strokeStyle='#e7edf0';ctx.lineWidth=2;ctx.beginPath();
 ctx.moveTo(bx,by);ctx.lineTo(bx+width,by);
 for(const x of [bx,bx+width/2,bx+width]){ctx.moveTo(x,by-5);ctx.lineTo(x,by+5);}ctx.stroke();
 ctx.fillStyle='#e7edf0';ctx.textAlign='left';ctx.font='11px system-ui';
 ctx.fillText('0',bx,by-13);ctx.fillText(meters/2+' m',bx+width/2-10,by-13);
 ctx.fillText(meters+' m',bx+width-18,by-13);
 ctx.font='10px system-ui';ctx.fillStyle='#b8c8d4';ctx.fillText('32 unid. = 1 m (escala de projeto)',bx,by+18);
 ctx.restore();
}
