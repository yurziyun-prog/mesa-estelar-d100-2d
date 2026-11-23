// Ferramenta unificada de seleção, movimentação e transformação do Arquiteto.
// Estado apenas de interface, não é gravado nos cenários.
let architectSelections=[];
let architectSelectionGesture=null;
let architectShiftHeld=false;
let architectCtrlHeld=false;
let architectContextPosition=null;
const MAP_UNITS_PER_METER=32; // convenção de projeto: 32 unidades de mundo = 1 m
function objectForSelection(ref){
 const scene=getScene(),floor=scene?.floors?.[state.currentFloor];
 return ref.kind==='entities'?null:floor?.[ref.kind]?.[ref.index];
}
function selectionBoundsOne(ref){
 const obj=objectForSelection(ref);if(!obj)return null;
 if(ref.kind==='walls')return {x:Math.min(obj.x1,obj.x2),y:Math.min(obj.y1,obj.y2),w:Math.abs(obj.x2-obj.x1),h:Math.abs(obj.y2-obj.y1)};
 if(ref.kind==='areas')return {x:obj.x,y:obj.y,w:obj.w,h:obj.h};
 const r=ref.kind==='stairs'?50:ref.kind==='props'?24*(obj.scale||1):ref.kind==='entities'?16:24;
 if(ref.kind==='windows')return obj.orient==='v'?{x:obj.x-12,y:obj.y-(obj.width||40)/2,w:24,h:obj.width||40}:{x:obj.x-(obj.width||40)/2,y:obj.y-12,w:obj.width||40,h:24};
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
function architectSelectionHit(wx,wy){return hitArchitectObjectAt(wx,wy);}

// Expandir componentes ligados geometricamente, preservando cada segmento e suas aberturas.
const ARCH_CONNECT_EPS=.75;
function architectSameWall(a,b){
 return (a.material||'wallMasonry')===(b.material||'wallMasonry') &&
 (a.color||'')===(b.color||'') &&
 (a.style||'normal')===(b.style||'normal') &&
 (a.width||16)===(b.width||16);
}
function architectWallsTouch(a,b){
 const endsA=[[a.x1,a.y1],[a.x2,a.y2]], endsB=[[b.x1,b.y1],[b.x2,b.y2]];
 // Segmentos só se conectam quando uma extremidade toca o outro segmento.
 // Nunca unir geometricamente dois lados separados por um vão de porta.
 return endsA.some(([x,y])=>distToSegment(x,y,b.x1,b.y1,b.x2,b.y2)<=ARCH_CONNECT_EPS) ||
        endsB.some(([x,y])=>distToSegment(x,y,a.x1,a.y1,a.x2,a.y2)<=ARCH_CONNECT_EPS);
}
function architectAreaSignature(a){
 return JSON.stringify({mat:a.mat||'',color:a.color||'',
   tile:a.mat==='checker'?(a.tile||state.tileConfig||null):null});
}
function architectAreasTouch(a,b){
 const ax=a.x+a.w,ay=a.y+a.h,bx=b.x+b.w,by=b.y+b.h,e=ARCH_CONNECT_EPS;
 const overlapX=Math.min(ax,bx)-Math.max(a.x,b.x);
 const overlapY=Math.min(ay,by)-Math.max(a.y,b.y);
 return (overlapX>e&&overlapY>=-e)||(overlapY>e&&overlapX>=-e);
}
function expandArchitectSelection(seed,includeManual=true){
 const scene=getScene(),floor=scene.floors[state.currentFloor];
 const result=[],visited=new Set(),queue=seed.slice();
 const key=ref=>ref.kind+':'+ref.index;
 while(queue.length){
  const ref=queue.shift(),k=key(ref);
  if(visited.has(k))continue;
  const obj=objectForSelection(ref);if(!obj)continue;
  if(ref.kind==='entities')continue;
  visited.add(k);result.push(ref);
  if(includeManual&&obj.archGroupId){
   for(const kind of ['areas','walls','doors','windows','stairs','chests','props','roofOpenings']){
    const arr=floor[kind]||[];
    arr.forEach((p,i)=>{if(p.archGroupId===obj.archGroupId&&!visited.has(kind+':'+i))queue.push({kind,index:i});});
   }
  }
  if(ref.kind==='walls'){
   floor.walls.forEach((wall,i)=>{
    if(!visited.has('walls:'+i)&&architectSameWall(obj,wall)&&architectWallsTouch(obj,wall))queue.push({kind:'walls',index:i});
   });
  }else if(ref.kind==='areas'){
   floor.areas.forEach((area,i)=>{
    if(!visited.has('areas:'+i)&&architectAreaSignature(obj)===architectAreaSignature(area)&&architectAreasTouch(obj,area))queue.push({kind:'areas',index:i});
   });
  }
 }
 return result;
}
function uniqueArchitectRefs(refs){
 const keys=new Set();return refs.filter(ref=>{const key=ref.kind+':'+ref.index;if(keys.has(key))return false;keys.add(key);return Boolean(objectForSelection(ref));});
}
function updateArchitectSelectionUI(){
 selectedMapObject=architectSelections.length===1&&architectSelections[0].kind!=='entities'?architectSelections[0]:null;
 state.selectedWallIdx=selectedMapObject?.kind==='walls'?selectedMapObject.index:null;
 updateSelectedWallBar();
 if(typeof onArchitectSelectionChange==='function')onArchitectSelectionChange();
 const label=document.getElementById('architectLibrarySelected');
 if(label&&state.tool==='move')label.textContent=architectSelections.length?
  architectSelections.length+' item(ns) selecionado(s). Ctrl+clique adiciona/remove · botão direito: Agrupar/Desagrupar.':
  'Arraste sobre uma área vazia para selecionar vários objetos.';
}
function selectionSnapshot(){
 return architectSelections.map(ref=>({ref,original:structuredClone(objectForSelection(ref))})).filter(e=>e.original);
}
function handleArchitectSelection(wx,wy,isDrag){
 if(!isDrag){
  closeArchitectContextMenu();
  const hit=architectSelectionHit(wx,wy);
  if(architectCtrlHeld){
   if(hit){
    const component=expandArchitectSelection([hit]);
    const exists=component.some(ref=>architectSelections.some(x=>x.kind===ref.kind&&x.index===ref.index));
    const selected=new Set(component.map(ref=>ref.kind+':'+ref.index));
    architectSelections=exists?architectSelections.filter(ref=>!selected.has(ref.kind+':'+ref.index)):
      uniqueArchitectRefs([...architectSelections,...component]);
   }
   architectSelectionGesture={mode:'ctrl-click'};
   updateArchitectSelectionUI();
   return;
  }
  const b=architectSelectionBounds();
  if(b&&Math.hypot(wx-(b.x+b.w),wy-(b.y+b.h))<Math.max(11,12/state.camera.zoom)){
   architectSelectionGesture={mode:'resize',x:wx,y:wy,bounds:b,items:selectionSnapshot()};
   return;
  }
  const already=hit&&architectSelections.some(x=>x.kind===hit.kind&&x.index===hit.index);
  if(hit?.kind==='areas'&&!already){
   // Clique simples seleciona o piso; arrasto começa nova seleção retangular.
   architectSelections=[];
   architectSelectionGesture={mode:'marquee',x:wx,y:wy,x2:wx,y2:wy,clickTarget:hit};
  }else if(hit){
   if(!already)architectSelections=expandArchitectSelection([hit]);
   architectSelectionGesture={mode:'move',x:wx,y:wy,items:selectionSnapshot()};
  }else{
   architectSelections=[];
   architectSelectionGesture={mode:'marquee',x:wx,y:wy,x2:wx,y2:wy};
  }
  updateArchitectSelectionUI();
  return;
 }
 const gesture=architectSelectionGesture;if(!gesture||gesture.mode==='ctrl-click')return;
 if(gesture.mode==='marquee'){gesture.x2=wx;gesture.y2=wy;return;}
 if(gesture.mode==='move'){
  const dx=wx-gesture.x,dy=wy-gesture.y;
  for(const {ref,original} of gesture.items){
   const item=objectForSelection(ref);if(!item)continue;
   if(ref.kind==='walls'){
    item.x1=original.x1+dx;item.x2=original.x2+dx;
    item.y1=original.y1+dy;item.y2=original.y2+dy;
   }else{const fromX=item.x,fromY=item.y;item.x=original.x+dx;item.y=original.y+dy;
    if(ref.kind==='stairs')syncLinkedStairPosition(item,fromX,fromY);}
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
    const fromX=item.x,fromY=item.y;
    item.x=b.x+(original.x-b.x)*fx;item.y=b.y+(original.y-b.y)*fy;
    if(ref.kind==='stairs')syncLinkedStairPosition(item,fromX,fromY);
    if(ref.kind==='props')item.scale=Math.max(.25,Math.min(4,(original.scale||1)*Math.min(fx,fy)));
    if(ref.kind==='windows'){
      const oldWidth=original.width||40;
      const newWidth=Math.max(24,Math.min(224,oldWidth*(original.orient==='v'?fy:fx)));
      resizeWindowOpening(getScene().floors[state.currentFloor],item,item.width||oldWidth,newWidth);
      item.width=newWidth;
    }
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
   for(const kind of ['areas','walls','doors','windows','stairs','chests','props','roofOpenings']){
    for(let i=0;i<(floor[kind]||[]).length;i++){
     const ref={kind,index:i},box=selectionBoundsOne(ref);
     if(box&&box.x>=b.x&&box.y>=b.y&&box.x+box.w<=b.x+b.w&&box.y+box.h<=b.y+b.h)selected.push(ref);
    }
   }
   architectSelections=uniqueArchitectRefs(selected.flatMap(ref=>expandArchitectSelection([ref])));
  }else if(g.clickTarget)architectSelections=expandArchitectSelection([g.clickTarget]);
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

function deleteArchitectSelection(){
 if(state.mode!=='architect')return false;
 const refs=architectSelections.length?architectSelections.slice():
   (selectedMapObject?[selectedMapObject]:[]);
 if(!refs.length)return false;
 const floor=getScene().floors[state.currentFloor];
 const byKind=new Map();
 for(const ref of refs){
  if(!byKind.has(ref.kind))byKind.set(ref.kind,new Set());
  byKind.get(ref.kind).add(ref.index);
 }
 const valid=[...byKind].flatMap(([kind,indices])=>
  [...indices].filter(i=>Number.isInteger(i)&&i>=0&&
   floor[kind]?.[i]!==undefined).map(i=>({kind,index:i})));
 if(!valid.length)return false;
 beginEdit();
 for(const [kind,indices] of byKind){
  const list=floor[kind];
  if(!Array.isArray(list))continue;
  for(const i of [...indices].sort((a,b)=>b-a)){
   if(i>=0&&i<list.length)list.splice(i,1);
  }
 }
 architectSelections=[];
 architectSelectionGesture=null;
 selectedMapObject=null;
 state.selectedWallIdx=null;
 updateArchitectSelectionUI();
 finishEdit();
 if(typeof updateUI==='function')updateUI();
 logEvent('🗑️ '+valid.length+' item(ns) removido(s). Ctrl+Z para desfazer.');
 return true;
}

function architectGroupSelection(){
 if(state.mode!=='architect'||architectSelections.length<2)return;
 const id='archgrp_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
 beginEdit();
 for(const ref of architectSelections){const obj=objectForSelection(ref);if(obj)obj.archGroupId=id;}
 finishEdit();updateArchitectSelectionUI();closeArchitectContextMenu();
 logEvent('🔗 '+architectSelections.length+' elementos agrupados. O grupo será salvo no cenário.');
}
function architectUngroupSelection(){
 if(state.mode!=='architect'||!architectSelections.length)return;
 beginEdit();
 for(const ref of architectSelections){const obj=objectForSelection(ref);if(obj)delete obj.archGroupId;}
 finishEdit();updateArchitectSelectionUI();closeArchitectContextMenu();
 logEvent('🔓 Agrupamento removido dos itens selecionados.');
}
function closeArchitectContextMenu(){
 const node=document.getElementById('architectContextMenu');
 if(node)node.remove();
}
function openArchitectContextMenu(sx,sy,clientX,clientY){
 if(state.mode!=='architect'||state.tool!=='move')return false;
 const {wx,wy}=screenToWorld(sx,sy);
 const clicked=architectSelectionHit(wx,wy);
 const bounds=architectSelectionBounds();
 const insideSelection=bounds && rectContains(bounds,wx,wy);
 if(clicked&&!insideSelection&&!architectSelections.some(ref=>ref.kind===clicked.kind&&ref.index===clicked.index)){
   architectSelections=expandArchitectSelection([clicked]);
   updateArchitectSelectionUI();
 }
 if(!architectSelections.length)return false;
 closeArchitectContextMenu();
 const menu=document.createElement('div');
 menu.id='architectContextMenu';menu.className='architect-context-menu';
 const grouped=architectSelections.some(ref=>Boolean(objectForSelection(ref)?.archGroupId));
 const single=architectSelections.length===1?architectSelections[0]:null;
 const wall=clicked?.kind==='walls'?objectForSelection(clicked):null;
 const items=[
  ...(wall?[['Estender parede +3 m',()=>{closeArchitectContextMenu();extendWallUp(wall);}]]:[]),
  ...(single&&['windows','doors','chests','props','walls','stairs'].includes(single.kind)?[['✏️ Editar propriedades',()=>{closeArchitectContextMenu();editArchitectObject(single);}]]:[]),
  ...(architectSelections.length>1?[['🔗 Agrupar',architectGroupSelection]]:[]),
  ...(grouped?[['🔓 Desagrupar',architectUngroupSelection]]:[])
 ];
 if(!items.length)return false;
 for(const [label,fn] of items){
   const btn=document.createElement('button');btn.type='button';btn.textContent=label;
   btn.addEventListener('click',e=>{e.stopPropagation();fn();});menu.append(btn);
 }
 menu.style.left=Math.min(clientX,window.innerWidth-170)+'px';
 document.body.append(menu);
 menu.style.top=Math.max(0,Math.min(clientY,window.innerHeight-menu.offsetHeight))+'px';
 return true;
}
