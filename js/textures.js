function isRetroFuture(item) { return (item?.style || 'normal') === 'futurist'; }
function isArabia(item) { return (item?.style || 'normal') === 'arabia'; }

function drawFutureArea(x,y,w,h,mat) {
  const palette = {
    grass:'#233b38',sand:'#655c55',dirt:'#51483d',snow:'#b8c7d1',
    water:'#124e70',bridge:'#556674',wood:'#4b555f',checker:'#343e52',
    marble:'#929ead',carpet:'#403957'
  };
  ctx.save();
  ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.fillStyle=palette[mat] || '#3c4652';ctx.fillRect(x,y,w,h);
  const step=mat==='grass'?38:32;
  if(mat==='water'){
    ctx.strokeStyle='rgba(69,202,237,.43)';ctx.lineWidth=2;
    for(let wy=y+16;wy<y+h;wy+=28){
      ctx.beginPath();ctx.moveTo(x,wy);ctx.lineTo(x+w,wy+Math.sin(animTick+wy*.03)*5);ctx.stroke();
    }
  } else {
    ctx.strokeStyle=mat==='wood'||mat==='checker'||mat==='marble'?'rgba(120,215,241,.24)':'rgba(133,198,187,.12)';
    ctx.lineWidth=1;
    for(let gx=Math.floor(x/step)*step;gx<x+w;gx+=step){
      ctx.beginPath();ctx.moveTo(gx,y);ctx.lineTo(gx,y+h);ctx.stroke();
    }
    for(let gy=Math.floor(y/step)*step;gy<y+h;gy+=step){
      ctx.beginPath();ctx.moveTo(x,gy);ctx.lineTo(x+w,gy);ctx.stroke();
    }
    if(mat==='carpet'||mat==='bridge'){
      ctx.strokeStyle='#ca9c58';ctx.lineWidth=3;ctx.strokeRect(x+3,y+3,w-6,h-6);
    }
    if(mat==='grass'){
      ctx.fillStyle='rgba(108,189,148,.18)';
      for(let gx=x+12;gx<x+w;gx+=40)for(let gy=y+12;gy<y+h;gy+=40)ctx.fillRect(gx,gy,3,3);
    }
  }
  ctx.restore();
}


function drawCustomTileFinish(x,y,w,h,settings){
 const conf={material:'ceramic',pattern:'checker',size:32,color1:'#667388',color2:'#a9b7bf',...(settings||{})};
 const mat=conf.material,pattern=conf.pattern,size=Math.max(16,Number(conf.size)||32);
 let a=conf.color1||'#667388',b=conf.color2||'#a9b7bf';
 // Older saved parquet areas sometimes retain blue-grey steel colors.
 // Keep stored data unchanged, but render curated physically plausible material tones.
 if(typeof tilePaletteFor==='function'&&['parquet','metal','marble','masonry'].includes(mat)){
   const palette=tilePaletteFor(mat);
   const curated=palette.some(v=>v[1].toLowerCase()===String(a).toLowerCase()&&v[2].toLowerCase()===String(b).toLowerCase());
   if(!curated){
     if(mat==='parquet'){
       const looksWood=hex=>{
         const v=String(hex).match(/^#([0-9a-f]{6})$/i);if(!v)return false;
         const n=parseInt(v[1],16),r=n>>16,g=n>>8&255,bl=n&255;
         return r>=g*.92&&g>=bl*.91&&r-bl>18;
       };
       if(!looksWood(a)||!looksWood(b))[a,b]=[palette[1][1],palette[1][2]];
     }else [a,b]=[palette[0][1],palette[0][2]];
   }
 }

 // Desenhar em coordenadas globais evita deslocamentos entre áreas adjacentes.
 ctx.fillStyle=a;ctx.fillRect(x,y,w,h);
 for(let ty=Math.floor(y/size)*size;ty<y+h;ty+=size){
  for(let tx=Math.floor(x/size)*size;tx<x+w;tx+=size){
   const col=Math.round(tx/size),row=Math.round(ty/size),even=(col+row)%2===0;
   const shade=pattern==='plain'?a:even?a:b;
   ctx.fillStyle=shade;ctx.fillRect(tx,ty,size,size);
   ctx.strokeStyle=mat==='marble'?'rgba(243,244,238,.33)':'rgba(13,20,28,.3)';
   ctx.lineWidth=mat==='metal'?2.5:1.2;
   ctx.strokeRect(tx+.5,ty+.5,size-1,size-1);
   if(mat==='marble'){
     ctx.strokeStyle='rgba(246,244,230,.42)';ctx.lineWidth=1;
     ctx.beginPath();ctx.moveTo(tx+size*.12,ty+size*.92);
     ctx.bezierCurveTo(tx+size*.34,ty+size*.58,tx+size*.58,ty+size*.68,tx+size*.89,ty+size*.10);ctx.stroke();
     ctx.strokeStyle='rgba(31,36,46,.18)';ctx.beginPath();
     ctx.moveTo(tx+size*.02,ty+size*.7);ctx.lineTo(tx+size*.42,ty+size*.3);ctx.lineTo(tx+size*.66,ty+size*.35);ctx.stroke();
   }else if(mat==='masonry'){
     ctx.strokeStyle='rgba(24,29,33,.44)';ctx.lineWidth=2;
     ctx.beginPath();ctx.moveTo(tx+size*.5,ty);ctx.lineTo(tx+size*.5,ty+size*.5);ctx.moveTo(tx,ty+size*.5);ctx.lineTo(tx+size,ty+size*.5);ctx.stroke();
     ctx.fillStyle='rgba(255,255,255,.06)';ctx.fillRect(tx+2,ty+2,size-4,3);
   }else if(mat==='metal'){
     ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(tx+3,ty+3,size-6,Math.max(2,size*.13));
     for(const ix of [4,size-5])for(const iy of [4,size-5]){
       ctx.fillStyle='#354d58';ctx.beginPath();ctx.arc(tx+ix,ty+iy,Math.max(1.4,size*.05),0,Math.PI*2);ctx.fill();
     }
   }else if(mat==='parquet'){
     ctx.strokeStyle='rgba(63,38,22,.47)';ctx.lineWidth=2;
     const count=Math.max(2,Math.floor(size/10));
     for(let j=1;j<count;j++){ctx.beginPath();
       if(even){ctx.moveTo(tx+j*size/count,ty);ctx.lineTo(tx+j*size/count,ty+size);}
       else {ctx.moveTo(tx,ty+j*size/count);ctx.lineTo(tx+size,ty+j*size/count);}
       ctx.stroke();
     }
     ctx.strokeStyle='rgba(255,233,173,.25)';ctx.lineWidth=.8;ctx.beginPath();
     ctx.moveTo(tx+4,ty+size*.3);ctx.lineTo(tx+size-4,ty+size*.3);ctx.stroke();
   }else if(mat==='decorative'){
     ctx.strokeStyle='rgba(255,236,191,.55)';ctx.lineWidth=1.5;
     ctx.beginPath();ctx.arc(tx+size/2,ty+size/2,size*.27,0,Math.PI*2);ctx.stroke();
   }
   ctx.save();ctx.translate(tx+size/2,ty+size/2);
   if(pattern==='diagonal'){
     ctx.strokeStyle='rgba(255,255,255,.42)';ctx.beginPath();ctx.moveTo(-size/2,-size/2);ctx.lineTo(size/2,size/2);ctx.stroke();
   }else if(pattern==='diamond'){
     ctx.strokeStyle='rgba(244,225,175,.7)';ctx.lineWidth=2;ctx.beginPath();
     ctx.moveTo(0,-size*.4);ctx.lineTo(size*.4,0);ctx.lineTo(0,size*.4);ctx.lineTo(-size*.4,0);ctx.closePath();ctx.stroke();
   }else if(pattern==='rosette'){
     ctx.strokeStyle='rgba(239,220,171,.8)';ctx.lineWidth=1.5;
     for(let i=0;i<8;i++){let angle=i*Math.PI/4;ctx.beginPath();ctx.ellipse(Math.cos(angle)*size*.13,Math.sin(angle)*size*.13,size*.13,size*.06,angle,0,Math.PI*2);ctx.stroke();}
   }else if(pattern==='herringbone'){
     ctx.strokeStyle='rgba(28,36,42,.35)';ctx.lineWidth=2;
     ctx.beginPath();ctx.moveTo(-size*.4,0);ctx.lineTo(0,-size*.4);ctx.lineTo(size*.4,0);ctx.moveTo(-size*.4,size*.4);ctx.lineTo(0,0);ctx.lineTo(size*.4,size*.4);ctx.stroke();
   }
   ctx.restore();
  }
 }
}
function drawTexturedArea(x, y, w, h, mat, customColor = null, tileConfig = null, roofPitch = null, roofHeight = null, flow = 0) {
  if(isRoofMaterial(mat)){drawRoofSurface(x,y,w,h,mat,roofPitch,roofHeight);return;}
  if(mat==='kenney_water')mat='water';
  if(mat==='kenney_wood')mat='wood';
  if(isDownloadedMaterial(mat)){drawDownloadedMaterial(x,y,w,h,mat);return;}
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if(drawCachedTerrain(mat,x,y,w,h,flow)){ctx.restore();return;}
  if (mat === 'space' || mat === 'forest') {
    const space=mat==='space', cell=space?48:38;
    ctx.fillStyle=space?'#101529':'#29482e';
    ctx.fillRect(x,y,w,h);
    for(let gy=Math.floor(y/cell)*cell;gy<y+h;gy+=cell){
      for(let gx=Math.floor(x/cell)*cell;gx<x+w;gx+=cell){
        const n=Math.abs(Math.sin(gx*12.9898+gy*78.233)*43758.5453)%1;
        const px=gx+cell*n,py=gy+cell*((n*23)%1);
        ctx.fillStyle=space?(n>.83?'#c9daff':'#757f9f'):(n>.5?'#365a36':'#24402a');
        ctx.beginPath();
        ctx.arc(px,py,space?1+n:12+n*10,0,Math.PI*2);
        ctx.fill();
      }
    }
  } else if (mat === 'wood') {
    // Tábuas contínuas com veios e pregos; malha fixa no mundo, sem emendas entre áreas.
    ctx.fillStyle='#744b2d';ctx.fillRect(x,y,w,h);
    const pw=102,ph=29;
    for(let row=Math.floor(y/ph)-1;row<Math.ceil((y+h)/ph)+1;row++){
      const py=row*ph,offset=(row%2)*pw/2;
      for(let col=Math.floor((x-offset)/pw)-1;col<Math.ceil((x+w-offset)/pw)+1;col++){
        const px=col*pw+offset;
        const n=Math.abs(Math.sin(col*12.18+row*44.67));
        ctx.fillStyle=n>.66?'#996a40':n>.33?'#855934':'#7b502d';
        ctx.fillRect(px+1,py+1,pw-2,ph-2);
        ctx.strokeStyle='#3f281c';ctx.lineWidth=2;ctx.strokeRect(px+.5,py+.5,pw-1,ph-1);
        ctx.strokeStyle='rgba(48,27,15,.27)';ctx.lineWidth=1;
        for(let k=0;k<3;k++){
          let fy=py+6+k*8+n*3;
          ctx.beginPath();ctx.moveTo(px+9,fy);ctx.bezierCurveTo(px+30,fy+3,px+60,fy-2,px+pw-8,fy+1);ctx.stroke();
        }
        ctx.fillStyle='#4a3324';ctx.beginPath();ctx.arc(px+7,py+7,1.4,0,Math.PI*2);ctx.arc(px+pw-8,py+ph-7,1.4,0,Math.PI*2);ctx.fill();
      }
    }
  } else if (mat === 'checker') {
    drawCustomTileFinish(x,y,w,h,tileConfig);
  } else if (mat === 'carpet') {
    ctx.fillStyle = customColor || '#8c1d28';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255, 210, 140, 0.22)';
    for (let cy = y + 10; cy < y + h - 6; cy += 12) {
      for (let cx = x + 10; cx < x + w - 6; cx += 12) ctx.fillRect(cx, cy, 2, 2);
    }
    ctx.strokeStyle = '#c99b32';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  } else if(Object.hasOwn(bridgeFinishes,mat)){
    drawBridgeFinish(mat,x,y,w,h);
  } else if (mat === 'bridge') {
    if(h>w){
      ctx.translate(x+w/2,y+h/2);ctx.rotate(Math.PI/2);
      [w,h]=[h,w];x=-w/2;y=-h/2;
    }
    ctx.fillStyle = '#824d24';
    ctx.fillRect(x, y, w, h);
    for (let bx = x + 6; bx < x + w - 4; bx += 14) {
      ctx.fillStyle = '#9c6030';
      ctx.fillRect(bx, y + 6, 10, h - 12);
      ctx.strokeStyle = '#3d210b';
      ctx.strokeRect(bx, y + 6, 10, h - 12);
    }
    ctx.fillStyle = '#4f2c10';
    ctx.fillRect(x, y, w, 6);
    ctx.fillRect(x, y + h - 6, w, 6);
  } else if (mat === 'marble') {
    ctx.fillStyle = '#c6cdd8';
    ctx.fillRect(x, y, w, h);
  } else if (mat === 'stone') {
    // Pedras irregulares assentadas com juntas finas, em vez de ladrilhos quadrados.
    ctx.fillStyle='#5f605a';ctx.fillRect(x,y,w,h);
    const tileW=58,tileH=42;
    for(let row=Math.floor(y/tileH)-1;row<Math.ceil((y+h)/tileH)+1;row++){
      for(let col=Math.floor(x/tileW)-1;col<Math.ceil((x+w)/tileW)+1;col++){
        const hsh=Math.abs(Math.sin(col*43.73+row*19.17)*11331.19)%1;
        const px=col*tileW+(row%2)*tileW/2,py=row*tileH;
        const pts=[[-26,-15],[-11-hsh*5,-20],[18,-17+hsh*5],[27,-6],[23,12],[4,18],[-21,14],[-29,2]];
        ctx.beginPath();pts.forEach(([dx,dy],i)=>i?ctx.lineTo(px+dx,py+dy):ctx.moveTo(px+dx,py+dy));ctx.closePath();
        ctx.fillStyle=['#8d8e82','#9a9b90','#777f7b','#a0a397'][Math.floor(hsh*4)];
        ctx.fill();ctx.strokeStyle='#4d534f';ctx.lineWidth=2.5;ctx.stroke();
        ctx.beginPath();ctx.moveTo(px-17,py-6);ctx.lineTo(px+8,py-12);ctx.strokeStyle='rgba(239,241,222,.20)';ctx.lineWidth=2;ctx.stroke();
      }
    }
  } else if (['cobble','metal','mosaic'].includes(mat)) {
    const base={stone:'#899089',cobble:'#797e80',metal:'#b6c8d3',mosaic:'#e3d1a6'};
    ctx.fillStyle=base[mat];ctx.fillRect(x,y,w,h);
    const cell=mat==='mosaic'?20:mat==='metal'?48:32;
    for(let yy=Math.floor(y/cell)*cell; yy<y+h; yy+=cell){
      for(let xx=Math.floor(x/cell)*cell;xx<x+w;xx+=cell){
        const variation=Math.abs(Math.sin(xx*11.7+yy*3.4))*0.12;
        ctx.fillStyle=mat==='mosaic'?(Math.floor(xx/cell)+Math.floor(yy/cell))%3===0?'#438b96':'rgba(155,80,65,.28)':'rgba(20,39,47,'+variation.toFixed(2)+')';
        ctx.fillRect(xx+2,yy+2,cell-4,cell-4);
        ctx.strokeStyle=mat==='metal'?'#7a98a8':'rgba(69,62,55,.38)';
        ctx.lineWidth=1.5;ctx.strokeRect(xx+1,yy+1,cell-2,cell-2);
        if(mat==='metal'){ctx.fillStyle='#f5e2a8';ctx.fillRect(xx+4,yy+4,3,3);ctx.fillRect(xx+cell-7,yy+cell-7,3,3);}
      }
    }
  }

  ctx.restore();
}


function brushPointInside(stroke,point,x,y,index){
 const r=stroke.size*(stroke.terrain&&stroke.shape==='spray'?.18:1)/2,dx=x-point.x,dy=y-point.y;
 if(stroke.shape==='quadrado')return Math.abs(dx)<=r && Math.abs(dy)<=r;
 if(stroke.terrain)return dx*dx+dy*dy<=r*r;
 const hash=Math.abs(Math.sin((x+index*13)*12.37+y*7.33))*100;
 if(stroke.shape==='irregular')return dx*dx+dy*dy<r*r*(.8+.32*Math.sin(Math.atan2(dy,dx)*7+hash));
 if(stroke.shape==='spray')return dx*dx+dy*dy<r*r && hash%1>.28;
 return dx*dx+dy*dy<=r*r;
}
function drawBrushStrokes(floor){
 for(const stroke of (floor.brushStrokes||[])){
  if(!stroke.points?.length)continue;
  if(stroke.mesaScatter){drawMesaScatter(stroke);continue;}
  if(stroke.terrain){drawTerrainStroke(stroke);continue;}
  const r=stroke.size/2;
  for(let pi=0;pi<stroke.points.length;pi++){
   const p=stroke.points[pi];ctx.save();ctx.beginPath();
   if(stroke.shape==='quadrado')ctx.rect(p.x-r,p.y-r,stroke.size,stroke.size);
   else if(stroke.shape==='irregular'){
    for(let i=0;i<=16;i++){const a=i*Math.PI/8,rr=r*(.78+.2*Math.sin(i*3.21+p.x*.07+p.y*.04));
     const x=p.x+Math.cos(a)*rr,y=p.y+Math.sin(a)*rr;
     if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }ctx.closePath();
   }else ctx.arc(p.x,p.y,r,0,Math.PI*2);
   ctx.clip();
   if(stroke.mat==='void'){ctx.fillStyle='#0b0e15';ctx.fillRect(p.x-r-2,p.y-r-2,r*2+4,r*2+4);}
   else drawTexturedArea(p.x-r-2,p.y-r-2,r*2+4,r*2+4,stroke.mat);
   if(stroke.shape==='spray'||stroke.texture!=='solida'){
    const density=stroke.texture==='pontilhada'?18:stroke.texture==='giz'?40:25;
    for(let j=0;j<density;j++){
      const n=Math.sin((j+1)*23.37+p.x*7.1+p.y*3.4)*43758.5,frac=n-Math.floor(n);
      const a=frac*Math.PI*2,dist=r*Math.sqrt(Math.abs(Math.sin(n*3.3)));
      ctx.fillStyle=stroke.mat==='void'?'#0b0e15':stroke.texture==='giz'?'rgba(246,244,225,.26)':'rgba(27,29,28,.22)';
      ctx.beginPath();ctx.arc(p.x+Math.cos(a)*dist,p.y+Math.sin(a)*dist,stroke.texture==='ranhura'?1.5:2,0,Math.PI*2);ctx.fill();
    }
   }
   ctx.restore();
  }
 }
}
// Escadas arquitetônicas em perspectiva top-down: patamar, profundidade e sombra.
// Escada vazada tem degraus parcialmente oclusivos e fundo transparente.
function drawUpperStairOpening(stair){
 // On an upper floor the reciprocal "down" stair is a cut-out, not a duplicate
 // of the opaque, elevated staircase below.
 const floor=getScene().floors[state.currentFloor];
 const slab=hasBuiltFloorAt(floor,stair.x,stair.y);
 const shape=stairVisualShape(stair.shape);
 const w=shape==='spiral'?82:65,h=shape==='spiral'?82:100;
 ctx.save();
 if(shape==='spiral'){
   ctx.beginPath();ctx.arc(0,0,41,0,Math.PI*2);
 }else{
   ctx.beginPath();ctx.rect(-w/2,-h/2,w,h);
 }
 ctx.save();ctx.clip();
 // 画出下层的真实结构，不用假台阶遮盖上层的人物。
 const sc=getScene(),current=state.currentFloor;
 const destination=stairLinkedIndex(sc,current,stair);
 const lower=destination>=0?sc.floors[destination]:null;
 if(lower){
   // We are already translated and rotated into the stair's local coordinates.
   // Temporarily return to world coordinates to draw the lower level through the opening.
   ctx.save();ctx.rotate(-(stair.rot||0)*Math.PI/2);ctx.translate(-stair.x,-stair.y);
   if(lower.terrainBounds&&lower.baseTerrain){
     const b=lower.terrainBounds;
     drawTexturedArea(b.x,b.y,b.w,b.h,lower.baseTerrain);
   }
   for(const area of lower.areas||[]){
     drawTexturedArea(area.x,area.y,area.w,area.h,area.mat,area.color,area.tile,area.roofPitch,area.roofHeight);
   }
   for(const cave of lower.caves||[]){
     if(insideCave(cave,stair.x,stair.y))drawCaveBase(cave);
   }
   for(const prop of lower.props||[]){
     if(Math.hypot(prop.x-stair.x,prop.y-stair.y)<90)drawProp(prop);
   }
   for(const peer of lower.stairs||[]){
     if(peer.linkId&&peer.linkId===stair.linkId||(!peer.linkId&&Math.hypot(peer.x-stair.x,peer.y-stair.y)<3))
       drawArchitecturalStair(peer);
   }
   // People standing beneath an open staircase are visible through the gaps.
   for(const ent of state.entities||[]){
     if(ent.sceneId===state.activeSceneId&&ent.floor===destination&&
        Math.hypot(ent.x-stair.x,ent.y-stair.y)<100)drawCharacterToken(ent,true);
   }
   // The stair's open treads should occlude some lower objects, but not upper-floor actors.
   const lowStair=(lower.stairs||[]).find(peer=>peer.linkId&&peer.linkId===stair.linkId);
   if(lowStair&&stairVisualShape(lowStair.shape)==='open')drawArchitecturalStair(lowStair,true);
   ctx.restore();
 }
 ctx.fillStyle=slab?'rgba(5,12,22,.24)':'rgba(5,12,22,.10)';
 ctx.fillRect(-w/2,-h/2,w,h);
 ctx.restore();
 ctx.lineWidth=5;ctx.strokeStyle=slab?'#536574':'#91a3ac';ctx.stroke();
 ctx.lineWidth=2;ctx.strokeStyle='#c2d0d2';ctx.stroke();
 // Near lip provides a visible reference for safe stair descent.
 ctx.fillStyle='#c1ab7c';
 if(shape==='spiral'){
   ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();
 }else{
   ctx.fillRect(-w/2+6,-h/2+6,w-12,4);
   ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(-w/2+5,h/2-11,w-10,3);
 }
 ctx.restore();
}
function drawArchitecturalStair(stair,overlay=false){
 const shape=stairVisualShape(stair.shape),up=stair.dir!=='down',mat=stair.material||(isRetroFuture(stair)?'metal':'wood');
 const materials={
  wood:['#85522f','#dab67c','#402b20'],stone:['#777f81','#c3c5c0','#434c51'],
  castle:['#767974','#c1baae','#434442'],masonry:['#929b9d','#c4ccca','#48525c'],
  brick:['#ab654a','#d09c7e','#643d32'],metal:['#6b92a0','#cbdfe1','#293f4b'],
  rust:['#8c5944','#bd9471','#4c3632'],sandstone:['#bba071','#ecce99','#72604b']
 };
 const [base,lit,edge]=materials[mat]||materials.wood;
 ctx.save();ctx.translate(stair.x,stair.y);ctx.rotate((stair.rot||0)*Math.PI/2);
 if(stair.dir==='down'){
   if(!overlay)drawUpperStairOpening(stair);
   ctx.restore();return;
 }
 if(overlay&&shape!=='open'){ctx.restore();return;}
 if(!overlay){
   ctx.fillStyle='rgba(0,0,0,.27)';ctx.fillRect(-32+6,-49+7,68,98);
 }
 if(shape==='spiral'){
   if(overlay){ctx.restore();return;}
   ctx.fillStyle=edge;ctx.beginPath();ctx.arc(0,0,46,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=up?'rgba(15,22,31,.45)':'rgba(7,11,21,.8)';
   ctx.beginPath();ctx.arc(0,0,41,0,Math.PI*2);ctx.fill();
   for(let i=0;i<12;i++){
     const angle=i*Math.PI/6-.3,finish=angle+Math.PI/6;
     ctx.fillStyle=i%2===0?base:lit;ctx.beginPath();ctx.moveTo(0,0);
     ctx.arc(0,0,39,angle,finish);ctx.closePath();ctx.fill();
     ctx.strokeStyle=edge;ctx.lineWidth=1.7;ctx.stroke();
     ctx.strokeStyle='rgba(255,255,255,.13)';ctx.beginPath();ctx.arc(0,0,35,angle,finish);ctx.stroke();
   }
   ctx.fillStyle=edge;ctx.beginPath();ctx.arc(0,0,8,0,2*Math.PI);ctx.fill();
   ctx.strokeStyle=lit;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,45,0,2*Math.PI);ctx.stroke();
 }else if(shape==='open'){
   if(!overlay){
     ctx.fillStyle='rgba(11,14,21,.10)';ctx.fillRect(-30,-47,60,94);
   }
   ctx.strokeStyle=edge;ctx.lineWidth=7;ctx.beginPath();
   ctx.moveTo(-29,-48);ctx.lineTo(-29,48);
   ctx.moveTo(29,-48);ctx.lineTo(29,48);ctx.stroke();
   ctx.strokeStyle=lit;ctx.lineWidth=3;ctx.beginPath();
   ctx.moveTo(-27,-45);ctx.lineTo(-27,45);
   ctx.moveTo(27,-45);ctx.lineTo(27,45);ctx.stroke();
   for(let i=0;i<7;i++){
     const y=-40+i*14;
     ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(-25,y+3,53,6);
     ctx.fillStyle=i%2===0?lit:base;ctx.fillRect(-26,y,52,6);
     ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(-24,y,48,1.3);
   }
 }else{
   if(overlay){ctx.restore();return;}
   ctx.fillStyle=edge;ctx.fillRect(-36,-52,72,104);
   const shade=ctx.createLinearGradient(0,-50,0,50);
   if(up){shade.addColorStop(0,'#28303a');shade.addColorStop(.27,base);shade.addColorStop(1,lit);}
   else{shade.addColorStop(0,lit);shade.addColorStop(.66,base);shade.addColorStop(1,'#1c2634');}
   ctx.fillStyle=shade;ctx.fillRect(-31,-48,62,96);
   for(let i=0;i<8;i++){
      const y=-46+i*12,depth=up?i/7:1-i/7;
      ctx.fillStyle=i%2===0?base:lit;
      ctx.globalAlpha=.45+depth*.48;ctx.fillRect(-28,y,56,9);ctx.globalAlpha=1;
      ctx.fillStyle='rgba(255,255,255,.20)';ctx.fillRect(-28,y,56,1.4);
      ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(-28,y+9,56,2);
      if(mat==='metal'||mat==='rust'){
       ctx.fillStyle=mat==='rust'?'#6d4435':'#3b5b6a';
       ctx.fillRect(-25,y+3,3,3);ctx.fillRect(22,y+3,3,3);
      }
   }
   const lipY=up?-48:37;
   ctx.fillStyle=up?'rgba(21,28,37,.65)':'rgba(7,14,22,.8)';
   ctx.fillRect(-30,lipY,60,11);
   ctx.fillStyle=up?lit:base;ctx.fillRect(-30,up?-40:36,60,3);
   if(shape==='continuous'){
     ctx.strokeStyle=lit;ctx.lineWidth=3;
     for(const x of [-30,30]){
       ctx.beginPath();ctx.moveTo(x,-49);ctx.lineTo(x,49);ctx.stroke();
     }
   }
 }
 ctx.restore();
}

function lowerOpeningWallSpans(floor) {
 const openings = [
   ...floor.doors.map(door => ({...door, halfGap:34})),
   ...floor.windows.map(win => ({...win, halfGap:(win.width||40)/2+2}))
 ];
 const spans = [];
 for(const opening of openings){
   const vertical = opening.orient==='v';
   const along = vertical ? opening.y : opening.x;
   const across = vertical ? opening.x : opening.y;
   let before, after;
   for(const wall of floor.walls){
     const [a,b,c,d] = vertical
       ? [wall.y1,wall.y2,wall.x1,wall.x2]
       : [wall.x1,wall.x2,wall.y1,wall.y2];
     if(Math.abs(c-across)>=2 || Math.abs(d-across)>=2)continue;
     const start = Math.min(a,b), end = Math.max(a,b);
     if(end<along && (!before || end>before.edge))before={edge:end,wall};
     if(start>along && (!after || start<after.edge))after={edge:start};
   }
   if(!before || !after ||
      Math.abs(along-before.edge-opening.halfGap)>12 ||
      Math.abs(after.edge-along-opening.halfGap)>12)continue;
   spans.push({...before.wall,...(vertical
     ? {x1:across,y1:before.edge,x2:across,y2:after.edge}
     : {x1:before.edge,y1:across,x2:after.edge,y2:across})});
 }
 return spans;
}

function exposedLowerWallSpans(wall, slabs) {
 const dx=wall.x2-wall.x1,dy=wall.y2-wall.y1,pad=(wall.width||16)/2;
 let exposed=[[0,1]];
 for(const slab of slabs){
   let start=0,end=1;
   for(const [origin,delta,min,max] of [
     [wall.x1,dx,slab.x-pad,slab.x+slab.w+pad],
     [wall.y1,dy,slab.y-pad,slab.y+slab.h+pad]
   ]){
     if(!delta){
       if(origin<min||origin>max){start=1;end=0;break;}
       continue;
     }
     const a=(min-origin)/delta,b=(max-origin)/delta;
     start=Math.max(start,Math.min(a,b));
     end=Math.min(end,Math.max(a,b));
   }
   if(start>=end)continue;
   exposed=exposed.flatMap(([a,b])=>start>=b||end<=a?[[a,b]]:[
     ...(a<start?[[a,start]]:[]),...(b>end?[[end,b]]:[])
   ]);
   if(!exposed.length)break;
 }
 return exposed.map(([a,b])=>({...wall,
   x1:wall.x1+a*dx,y1:wall.y1+a*dy,x2:wall.x1+b*dx,y2:wall.y1+b*dy
 }));
}

function drawLowerStoreyWallContinuations(sc,upperIndex){
 const upper=sc.floors[upperIndex],level=floorLevel(sc,upperIndex);
 const underIndex=floorIndexForLevel(sc,level-1,false);
 if(underIndex<0)return;
 const beneath=sc.floors[underIndex];
 if(!beneath?.walls?.length)return;
 // Lower walls can remain visible from upstairs as enclosing structural masonry,
 // but lower windows and doors do not appear on the upper storey.
 const colors={wallWood:'#906842',wallBrick:'#a56853',wallMasonry:'#a3aaac',
   wallCastle:'#8a8b87',wallMetal:'#a5bdc9',wallRust:'#96715a',wallSandstone:'#d1b381'};
 ctx.save();ctx.lineCap='square';ctx.lineJoin='bevel';
 // Reconstitui visualmente os recortes das portas e janelas vistas de cima.
 const slabs = upper.areas.filter(isStructuralSlab);
 const walls = [...beneath.walls, ...lowerOpeningWallSpans(beneath)]
   .flatMap(wall => exposedLowerWallSpans(wall, slabs));
 for(const wall of walls){
   const covered=(upper.walls||[]).some(other=>
     distToSegment(wall.x1,wall.y1,other.x1,other.y1,other.x2,other.y2)<7&&
     distToSegment(wall.x2,wall.y2,other.x1,other.y1,other.x2,other.y2)<7);
   if(covered)continue;
   const color=wall.color||catalogWallPaint(wall)||colors[wall.material]||'#8d9a9f';
   ctx.strokeStyle='rgba(4,9,16,.35)';ctx.lineWidth=(wall.width||16)+8;
   ctx.beginPath();ctx.moveTo(wall.x1+4,wall.y1+4);ctx.lineTo(wall.x2+4,wall.y2+4);ctx.stroke();
   ctx.strokeStyle=color;ctx.lineWidth=(wall.width||16)*.85;
   ctx.beginPath();ctx.moveTo(wall.x1,wall.y1);ctx.lineTo(wall.x2,wall.y2);ctx.stroke();
   ctx.strokeStyle='rgba(255,255,255,.23)';ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(wall.x1-3,wall.y1-3);ctx.lineTo(wall.x2-3,wall.y2-3);ctx.stroke();
 }
 ctx.restore();
}
function drawFloorLayer(sc, floorIdx, isBelow, interior=null) {
  const floor = sc.floors[floorIdx];
  if (!floor) return;

  // Área inicial compacta e expansível
  if (floor.terrainBounds && floor.baseTerrain) {
    const b = floor.terrainBounds;
    drawTexturedArea(b.x,b.y,b.w,b.h,floor.baseTerrain,null,null,null,null,floor.flowAngle);
  }
  if (floor.bounds) {
    const b = floor.bounds;
    if (!isBelow && state.mode === 'architect') {
      ctx.strokeStyle = 'rgba(245, 185, 66, 0.35)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.setLineDash([]);
    }
  }

  const actor=typeof activeActor==='function'?activeActor():null;
  floor.areas.forEach(a=>{
    const inside=actor&&actor.floor===floorIdx&&actor.sceneId===state.activeSceneId
      &&a.roof&&a.roofAttic&&pointInArchitectArea(a,actor.x,actor.y);
    if(inside&&state.mode!=='architect')return; // 阁楼内部不被屋顶贴图覆盖
    if(interior)return;
    ctx.save();
    if(a.roof||isRoofMaterial(a.mat))clipOutsideCaves(floor.caves,a);
    if(a.fromBuildingId){traceBuilding(a);ctx.clip();}
    drawTexturedArea(a.x,a.y,a.w,a.h,a.mat,a.color,a.tile,a.roofPitch,a.roofHeight,a.flowAngle);
    ctx.restore();
  });
  drawBrushStrokes(floor);
  for(const cave of interior?[interior]:(floor.caves||[])){
    if(!interior)drawCaveApron(cave);
    drawCaveBase(cave);
  }
  if(!interior)for(const building of floor.buildings||[])drawBuildingBase(building,floor);
  // 只将楼下的自然地形和地板作为背景，隐藏门、窗、墙、家具和人物。
  if(isBelow)return;

  drawLowerStoreyWallContinuations(sc,floorIdx);
  if(typeof drawRoofOpenings==='function')drawRoofOpenings(floor);
  floor.stairs.forEach(stair=>drawArchitecturalStair(stair));

  // Paredes contínuas por material e espessura. Colisões usam a mesma largura.
  const walls=floor.walls;
  function wallPath(w,offset=0){
    ctx.moveTo(w.x1+offset,w.y1+offset);
    if(w.material==='caveRock'){
      const dx=w.x2-w.x1,dy=w.y2-w.y1,length=Math.hypot(dx,dy);
      const seed=(w.x1+w.y1)*.07;
      for(let dist=9;dist<length;dist+=9){
        const wobble=Math.sin(dist*.28+seed)*(w.width||16)*.24;
        ctx.lineTo(w.x1+offset+dx*dist/length-dy/length*wobble,
          w.y1+offset+dy*dist/length+dx/length*wobble);
      }
    }
    ctx.lineTo(w.x2+offset,w.y2+offset);
  }
  const groups=new Map();
  for(const w of walls){
    const key=(w.style||'normal')+'|'+(w.material||'wallMasonry')+'|'+(w.width||16)+'|'+(w.color||'');
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(w);
  }
  const wallBase=(w)=>{
    const colors={wallWood:'#966a40',wallBrick:'#ae6047',wallMasonry:'#adb5b4',wallCastle:'#91918b',
      wallMetal:'#c3d5de',wallRust:'#917762',wallSandstone:'#d8b982'};
    return w.color||catalogWallPaint(w)||colors[w.material]||(isRetroFuture(w)?'#d1e0e6':isArabia(w)?'#d9b889':'#747c86');
  };
  for(const group of groups.values()){
    const w=group[0],width=w.width||16;
    for(const [extra,color,offset] of [[9,'rgba(0,0,0,.28)',4],[5,'#313440',0],[0,wallBase(w),0]]){
      ctx.save();ctx.lineCap=w.material==='caveRock'?'round':'square';ctx.lineJoin='bevel';
      ctx.strokeStyle=color;ctx.lineWidth=width+extra;
      ctx.beginPath();
      for(const line of group){
        wallPath(line,offset);
      }
      ctx.stroke();ctx.restore();
    }
  }
  walls.forEach((w,idx)=>{
    const width=w.width||16,material=w.material||'wallMasonry';
    const dx=w.x2-w.x1,dy=w.y2-w.y1,length=Math.hypot(dx,dy);
    if(!length)return;
    ctx.save();ctx.translate(w.x1,w.y1);ctx.rotate(Math.atan2(dy,dx));
    if(material==='scifiBulkhead'){
      ctx.fillStyle=w.neonColor||'#38bdf8';
      ctx.fillRect(2,-1,Math.max(0,length-4),2);
    }else if(material==='wallCastle'||material==='wallMasonry'||material==='wallBrick'||material==='wallSandstone'){
      const joint=material==='wallBrick'?'rgba(79,36,25,.6)':'rgba(58,59,56,.50)';
      ctx.strokeStyle=joint;ctx.lineWidth=1.5;
      for(let row=-1;row<2;row++){
        const offset=(row%2?12:0);
        for(let t=offset;t<length;t+=material==='wallCastle'?34:material==='wallBrick'?23:29){
          const jitter=(Math.sin(t*1.7+row*9.2)+1)*2;
          ctx.beginPath();ctx.moveTo(t+jitter,row*width/3-width/6);ctx.lineTo(t-2+jitter,row*width/3+width/8);ctx.stroke();
        }
      }
      ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(2,-width*.38);ctx.lineTo(length-2,-width*.38);ctx.stroke();
    }else if(material==='wallWood'){
      ctx.strokeStyle='rgba(61,35,19,.57)';ctx.lineWidth=1.5;
      for(let t=17;t<length;t+=40){ctx.beginPath();ctx.moveTo(t,-width*.45);ctx.lineTo(t,width*.45);ctx.stroke();}
      ctx.strokeStyle='rgba(242,203,146,.40)';ctx.lineWidth=1;
      for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(3,k*width/4);ctx.lineTo(length-3,k*width/4);ctx.stroke();}
    }else if(material==='wallMetal'||material==='wallRust'){
      ctx.strokeStyle='rgba(36,49,58,.55)';ctx.lineWidth=2;
      for(let t=26;t<length;t+=44){ctx.beginPath();ctx.moveTo(t,-width/2);ctx.lineTo(t,width/2);ctx.stroke();}
      for(let t=9;t<length;t+=44){
        ctx.fillStyle='#3f4f57';for(const off of [-width*.32,width*.32]){ctx.beginPath();ctx.arc(t,off,2.1,0,Math.PI*2);ctx.fill();}
        if(material==='wallRust'){
          ctx.fillStyle='rgba(165,74,33,.53)';
          ctx.beginPath();ctx.ellipse(t+11,1,10,Math.max(3,width*.18),.1,0,Math.PI*2);ctx.fill();
          ctx.fillStyle='rgba(80,45,30,.36)';ctx.fillRect(t+8,0,3,width*.45);
        }
      }
    }
    if(isRetroFuture(w)){
      ctx.strokeStyle='#70dce9';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(4,-width*.22);ctx.lineTo(length-4,-width*.22);ctx.stroke();
    }
    ctx.restore();
    if(!isBelow&&state.mode==='architect'&&state.selectedWallIdx===idx){
      ctx.save();ctx.strokeStyle='#f5b942';ctx.lineWidth=2;
      ctx.beginPath();wallPath(w);ctx.stroke();
      ctx.fillStyle='#f5b942';for(const xy of [[w.x1,w.y1],[w.x2,w.y2]]){ctx.beginPath();ctx.arc(...xy,5,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }
  });

  floor.windows.forEach(win => {
    ctx.save();
    ctx.translate(win.x, win.y);
    if (win.orient === 'v') ctx.rotate(Math.PI / 2);
    ctx.fillStyle=win.color||(isRetroFuture(win)?'rgba(55,210,226,.6)':'rgba(135,220,255,.45)');
    ctx.fillRect(-(win.width||40)/2, -8, win.width||40, 16);
    ctx.strokeStyle = ({wood:'#b9875b',stone:'#a7b3b5',castle:'#90939a',brick:'#a65f49',masonry:'#b4bbbc',metal:'#729bab',rust:'#9a6344',sandstone:'#d7b36f'})[win.material] || (isRetroFuture(win) ? '#dba95d' : isArabia(win) ? '#e0a44e' : '#eaf7ff');
    ctx.lineWidth = 2;
    ctx.strokeRect(-(win.width||40)/2, -8, win.width||40, 16);
    ctx.strokeStyle='rgba(241,250,252,.55)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,8);ctx.stroke();
    ctx.restore();
  });

  floor.doors.forEach(d => {
    ctx.save();
    ctx.translate(d.x,d.y);
    if(d.orient==='v') ctx.rotate(Math.PI/2);
    const retro=(d.mechanism||((d.style==='futurist')?'sliding':'hinged'))==='sliding';
    // Trilho ou batente permanece fixo na parede.
    ctx.fillStyle=retro?'#728b9b':isArabia(d)?'#895f3d':'#3d2819';
    ctx.fillRect(-38,-10,76,20);
    ctx.fillStyle=retro?'#e3c184':isArabia(d)?'#dcb874':'#a8733e';
    ctx.fillRect(-38,-11,5,22);
    ctx.fillRect(33,-11,5,22);
    if(retro){
      // Dois painéis retráteis recolhem-se lateralmente, sem giro.
      const left=d.open?-35:-34,right=d.open?35:34;
      const span=d.open?7:34;
      ctx.fillStyle=d.color||({wood:'#a5794b',stone:'#9a9f9e',castle:'#7e8382',brick:'#a65b43',masonry:'#b5bbb8',metal:'#829aa8',rust:'#986042',sandstone:'#d3b77a'})[d.material]||'#788fa4';ctx.strokeStyle='#182735';ctx.lineWidth=2;
      ctx.fillRect(left,-8,span,16);ctx.strokeRect(left,-8,span,16);
      ctx.fillRect(right-span,-8,span,16);ctx.strokeRect(right-span,-8,span,16);
      ctx.strokeStyle='#55d5e5';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(left+2,0);ctx.lineTo(left+span-2,0);
      ctx.moveTo(right-span+2,0);ctx.lineTo(right-2,0);ctx.stroke();
      ctx.fillStyle=d.keyId&&!d.open?'#ee4d70':'#51d1a5';
      ctx.fillRect(29,-4,4,8);
    } else {
      // A folha gira a 90 graus em torno da dobradiça na ponta esquerda.
      // Antes girava pelo centro, criando a aparência de porta atravessada.
      const side=d.hingeSide==='right'?-1:1;
      ctx.translate(side<0?34:-34,0);
      if(side<0)ctx.scale(-1,1);
      if(d.open)ctx.rotate((d.swing==='out'?1:-1)*Math.PI/2);
      ctx.fillStyle=d.color||({wood:'#9c5a27',stone:'#9a9f9e',castle:'#7e8382',brick:'#a65b43',masonry:'#b5bbb8',metal:'#829aa8',rust:'#986042',sandstone:'#d3b77a'})[d.material] || (d.keyId&&!d.open?'#bb843a':isArabia(d)?'#c28a50':'#9c5a27');
      ctx.fillRect(0,-8,68,16);
      ctx.strokeStyle='#322014';ctx.lineWidth=2.5;ctx.strokeRect(0,-8,68,16);
      ctx.strokeStyle='#c89457';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(9,-5);ctx.lineTo(59,-5);ctx.stroke();
      ctx.fillStyle=d.keyId?'#e11d48':'#f5b942';
      ctx.beginPath();ctx.arc(55,2,3.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e6c27c';
      ctx.beginPath();ctx.arc(1,0,4,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  });

  floor.chests.forEach(c => {
    if(isRetroFuture(c)){
      ctx.fillStyle='#1e2e3d';ctx.fillRect(c.x-24,c.y-15,48,30);
      ctx.fillStyle=c.opened?'#455668':'#798b99';ctx.fillRect(c.x-20,c.y-12,40,24);
      ctx.strokeStyle='#c69d5b';ctx.lineWidth=2;ctx.strokeRect(c.x-24,c.y-15,48,30);
      ctx.fillStyle='#57d0da';ctx.fillRect(c.x-5,c.y-4,10,8);
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(c.x - 20, c.y - 12, 44, 28);
    ctx.fillStyle = c.opened ? '#6e563e' : (({wood:'#bc873f',stone:'#8f9797',castle:'#747b7c',brick:'#a25a43',masonry:'#c0c3bd',metal:'#829fab',rust:'#986044',sandstone:'#d9ba78'})[c.material] || (isArabia(c) ? '#b98a56' : '#f5b942'));
    ctx.fillRect(c.x - 22, c.y - 14, 44, 28);
    ctx.strokeStyle = '#2b1c0c';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(c.x - 22, c.y - 14, 44, 28);
    ctx.strokeRect(c.x - 5, c.y - 4, 10, 8);
  });

  floor.props.forEach(p => {
    if(plantTypes.has(p.type))drawPlantBase(p);
    else{drawProp(p);drawFireEffect(p);}
  });
  if(state.mode==='architect'&&!isBelow&&typeof selectedMapObject!=='undefined'&&selectedMapObject){
    const sel=floor[selectedMapObject.kind]?.[selectedMapObject.index];
    if(sel&&sel.x!==undefined&&sel.y!==undefined){
      const rr=selectedMapObject.kind==='stairs'?53: selectedMapObject.kind==='props'&&['bed','bedDouble','capsuleBed'].includes(sel.type)?53:29;
      ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle='#ffe49a';ctx.lineWidth=2.5;
      ctx.strokeRect(sel.x-rr,sel.y-rr,rr*2,rr*2);ctx.restore();
    }
  }


  state.entities.filter(e => e.sceneId === state.activeSceneId && e.floor === floorIdx).forEach(ent => {
    drawCharacterToken(ent, isBelow);
  });
  // 镂空楼梯对下方人物显示台阶遮挡；攀爬时人物绘制在台阶上方。
  floor.stairs.filter(s=>s.dir!=='down'&&stairVisualShape(s.shape)==='open' &&
    !state.entities.some(e=>e.sceneId===state.activeSceneId&&e.floor===floorIdx&&e.stairClimb &&
      ((e.stairClimb.linkId&&e.stairClimb.linkId===s.linkId)||
       (!e.stairClimb.linkId&&Math.hypot(e.stairClimb.x-s.x,e.stairClimb.y-s.y)<5))))
    .forEach(s=>drawArchitecturalStair(s,true));
  const viewer=activeActor();
  const underCanopy=viewer?.floor===floorIdx&&viewer.sceneId===state.activeSceneId?viewer:null;
  for(const p of floor.props)if(plantTypes.has(p.type))drawPlantCanopy(p,underCanopy);
  if(!interior){
    drawBuildingRoofs(floor,floorIdx);
    drawCaveRoofs(floor,floorIdx);
  }
}

function drawCharacterToken(ent, isBelow) {
  const cx=ent.x,cy=ent.y,now=performance.now();
  if(ent.sleepPose&&TENT_TYPES.has(ent.sleepBed?.type))return;
  if(ent.sleepPose){
    const bed=ent.sleepBed||{x:cx,y:cy,type:'bed',rot:0};
    ctx.save();ctx.translate(cx,cy);
    if(bed.type!=='capsuleBed'){
      ctx.rotate((bed.rot||0)*Math.PI/2);
      ctx.fillStyle='rgba(0,0,0,.15)';ctx.beginPath();ctx.ellipse(0,0,10,31,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=ent.color||'#6986a1';ctx.beginPath();ctx.roundRect(-10,-9,20,37,7);ctx.fill();
      ctx.fillStyle='#e3b08b';ctx.beginPath();ctx.arc(0,-24,9,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5c443d';ctx.fillRect(-8,-29,16,4);
    }
    ctx.restore();
    if(ent.sleepPose==='sleeping'&&!isBelow){
      const n=2+Math.floor((now/1400)%3);
      ctx.save();ctx.textAlign='center';ctx.font='bold '+(15+Math.round((Math.sin(now/450)+1)*3))+'px system-ui';ctx.fillStyle='#e1eefb';
      ctx.fillText('Z'.repeat(n),cx+28,cy-39-Math.sin(now/600)*8);ctx.restore();
    }
    ctx.save();ctx.textAlign='center';ctx.font='bold 11px system-ui';ctx.fillStyle='#f5f3eb';
    ctx.fillText(ent.name,cx,cy-51);ctx.restore();
    return;
  }
  let lift=0;
  if(ent.stairClimb){
    const progress=ent.stairClimbProgress||0;
    lift=ent.stairClimb.dir==='down'?Math.max(0,20*(1-progress)):6+22*progress;
  }
  if(ent.jumpUntil && now<ent.jumpUntil){
    const t=1-(ent.jumpUntil-now)/380;
    lift=Math.sin(Math.PI*Math.max(0,Math.min(1,t)))*21;
  }
  if(ent.fallUntil&&now<ent.fallUntil){
    const t=Math.max(0,Math.min(1,1-(ent.fallUntil-now)/430));
    lift=-Math.sin(Math.PI*t)*11; // stumble and recover after dropping through an open shaft
  }
  const moving=ent.walkingUntil>now||Boolean(ent.stairClimb);
  const stride=moving?Math.sin(now/90)*3:0;
  const hostile=ent.attitude==='Hostil';
  const isMonster=ent.role==='Monstro'||ent.role==='Fera';
  const body=ent.color||'#688aab';
  ctx.save();
  // Silhueta superior em vez de um emoji circular: pés, torso, rosto e equipamento.
  ctx.fillStyle='rgba(0,0,0,.3)';
  ctx.beginPath();ctx.ellipse(cx+3,cy+9,15+lift*.15,8+lift*.1,0,0,Math.PI*2);ctx.fill();
  ctx.translate(cx,cy-lift);
  if(state.timeOfDay==='night'){
    const light=ctx.createRadialGradient(0,0,3,0,0,70);
    light.addColorStop(0,'rgba(255,210,128,.16)');light.addColorStop(1,'rgba(255,210,128,0)');
    ctx.fillStyle=light;ctx.beginPath();ctx.arc(0,0,70,0,7);ctx.fill();
  }
  if(isMonster){
    const beast=ent.icon==='🐉'||ent.icon==='🐺';
    ctx.fillStyle=body;ctx.strokeStyle='#233029';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,3,beast?16:12,beast?11:13,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=ent.icon==='💀'?'#d7d5bd':'#6a8762';
    ctx.beginPath();ctx.arc(0,-6,beast?10:9,0,7);ctx.fill();
    ctx.fillStyle=hostile?'#f45d54':'#fff5d8';
    for(const x of [-4,4]){ctx.beginPath();ctx.arc(x,-8,2,0,7);ctx.fill();}
    if(beast){ctx.strokeStyle=body;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(8,5);ctx.lineTo(19,13);ctx.stroke();}
  }else{
    ctx.fillStyle='#2b2c38';
    ctx.fillRect(-10,6+stride,7,12);ctx.fillRect(3,6-stride,7,12);
    ctx.fillStyle=body;ctx.strokeStyle='#263044';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(-11,-8,22,21,5);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e6b48d';
    ctx.beginPath();ctx.arc(0,-12,9,0,7);ctx.fill();
    ctx.fillStyle=ent.role==='Arcanista'?'#534390':'#62442a';
    ctx.beginPath();ctx.arc(0,-16,9,Math.PI,Math.PI*2);ctx.fill();
    ctx.fillStyle='#292229';ctx.fillRect(-4,-12,2,2);ctx.fillRect(3,-12,2,2);
    ctx.strokeStyle='#c2a98c';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(-10,-3);ctx.lineTo(-15,8-stride);ctx.moveTo(10,-3);ctx.lineTo(15,8+stride);ctx.stroke();
    if(ent.inventory?.some(x=>/Espada|Lança|Cajado|Arco/i.test(x))){
      ctx.strokeStyle='#bdc8d8';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(15,8+stride);ctx.lineTo(18,-14);ctx.stroke();
    }
  }
  if(ent.id===state.selectedEntityId){
    ctx.strokeStyle='#f5b942';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,5,21,17,0,0,7);ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  if(state.mode==='gm'&&ent.id===gmPreviewId){ctx.strokeStyle='#e6c466';ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.beginPath();ctx.arc(cx,cy-lift,28,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#e6c466';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText('TAB · ENTER',cx,cy-56-lift);}
  ctx.font='bold 11px system-ui';ctx.textAlign='center';
  const labelW=ctx.measureText(ent.name).width+11;
  ctx.fillStyle='rgba(14,18,25,.88)';
  ctx.fillRect(cx-labelW/2,cy-44-lift,labelW,15);
  ctx.fillStyle='#f4f5f8';ctx.fillText(ent.name,cx,cy-32-lift);
  if(!isBelow&&ent.speech)drawSpeechBubble(cx,cy-50-lift,ent.speech);
  ctx.restore();
}

function drawFutureProp(p){
  const x=p.x,y=p.y;
  ctx.save();ctx.translate(x,y);ctx.rotate((p.rot||0)*Math.PI/2);
  ctx.fillStyle='rgba(0,0,0,.33)';ctx.fillRect(-24,-12,50,32);
  const casing='#d2e0e9',edge='#597589',light='#5cd4dd',brass='#dbad62';
  if(p.type==='log'){
    ctx.fillStyle=casing;ctx.fillRect(-70,-11,140,22);
    ctx.strokeStyle=light;ctx.lineWidth=2;ctx.strokeRect(-70,-11,140,22);
    for(let i=-60;i<65;i+=20){ctx.fillStyle=brass;ctx.fillRect(i,-7,4,14);}
  }else if(['tree','pine','fruitTree','bush'].includes(p.type)){
    ctx.fillStyle='#7cae96';ctx.beginPath();ctx.arc(0,0,p.type==='bush'?16:27,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=light;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#79ba94';
    for(let i=0;i<5;i++){let a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(Math.cos(a)*12,Math.sin(a)*12,5,0,Math.PI*2);ctx.fill();}
    if(p.type==='fruitTree'){ctx.fillStyle='#e87769';ctx.fillRect(-4,-4,8,8);}
  }else if(p.type==='rock'){
    ctx.fillStyle='#677581';ctx.beginPath();ctx.moveTo(-18,9);ctx.lineTo(-12,-14);ctx.lineTo(8,-17);ctx.lineTo(21,4);ctx.lineTo(8,15);ctx.closePath();ctx.fill();
    ctx.strokeStyle=light;ctx.lineWidth=2;ctx.stroke();
  }else if(p.type==='barrel'){
    ctx.fillStyle=casing;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.strokeStyle=brass;ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle=edge;ctx.fillRect(-7,-8,14,16);ctx.fillStyle=light;ctx.fillRect(-3,-4,6,8);
  }else if(p.type==='hearth'){
    ctx.fillStyle=edge;ctx.fillRect(-33,-20,66,40);ctx.fillStyle=casing;ctx.fillRect(-28,-15,56,30);
    ctx.fillStyle='#df9859';ctx.fillRect(-20,-9,40,18);ctx.fillStyle='#ffdf86';ctx.fillRect(-9,-6,18,12);
    ctx.strokeStyle=light;ctx.strokeRect(-33,-20,66,40);
  }else if(p.type==='table'){
    ctx.fillStyle=edge;ctx.fillRect(-36,-21,72,42);ctx.fillStyle=casing;ctx.fillRect(-32,-18,64,36);
    ctx.strokeStyle=brass;ctx.lineWidth=2;ctx.strokeRect(-32,-18,64,36);
    ctx.fillStyle=light;ctx.fillRect(-8,-2,16,4);
  }else if(p.type==='chair'){
    ctx.fillStyle=casing;ctx.fillRect(-14,-14,28,28);ctx.strokeStyle=edge;ctx.lineWidth=3;ctx.strokeRect(-14,-14,28,28);
    ctx.fillStyle=brass;ctx.fillRect(-12,-14,24,5);ctx.fillStyle=light;ctx.fillRect(-4,-5,8,10);
  }else if(p.type==='bed'){
    ctx.fillStyle=edge;ctx.fillRect(-25,-32,50,64);ctx.fillStyle=casing;ctx.fillRect(-21,-28,42,56);
    ctx.fillStyle='#8b7191';ctx.fillRect(-17,-4,34,29);ctx.fillStyle='#d1dcd9';ctx.fillRect(-17,-24,34,14);
    ctx.strokeStyle=light;ctx.lineWidth=2;ctx.strokeRect(-25,-32,50,64);
  }else if(p.type==='bookshelf'){
    ctx.fillStyle=edge;ctx.fillRect(-28,-19,56,38);ctx.fillStyle=casing;ctx.fillRect(-25,-16,50,32);
    for(let i=-18;i<=18;i+=12){ctx.fillStyle=i%24===0?brass:light;ctx.fillRect(i,-12,6,24);}
    ctx.strokeStyle=brass;ctx.lineWidth=2;ctx.strokeRect(-28,-19,56,38);
  }
  ctx.restore();
}

function drawArabiaProp(p){
  const x=p.x,y=p.y,t=p.type;
  ctx.save();ctx.translate(x,y);
  const palm=t==='palm'||(['tree','pine','fruitTree'].includes(t)&&isArabia(p));
  if(palm){
    ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(7,8,25,13,0,0,7);ctx.fill();
    ctx.fillStyle='#8d6746';ctx.beginPath();ctx.arc(0,0,7,0,7);ctx.fill();
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9;ctx.strokeStyle=i%2?'#5c8549':'#3d754b';ctx.lineWidth=7;
      ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(a)*16,Math.sin(a)*16,Math.cos(a)*32,Math.sin(a)*32);ctx.stroke();}
    ctx.fillStyle='#b18b53';ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();
  } else if(t==='desertTree'){
    ctx.strokeStyle='#806344';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,10);ctx.lineTo(0,-9);ctx.stroke();
    for(const [dx,dy] of [[-16,-12],[13,-14],[0,-22]]){ctx.fillStyle='#72854c';ctx.beginPath();ctx.arc(dx,dy,13,0,7);ctx.fill();}
  } else if(t==='tent'){
    ctx.fillStyle='#b97851';ctx.beginPath();ctx.moveTo(-40,25);ctx.lineTo(0,-33);ctx.lineTo(40,25);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#714b3a';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#e5c592';ctx.beginPath();ctx.moveTo(0,-33);ctx.lineTo(0,25);ctx.lineTo(36,25);ctx.closePath();ctx.fill();
    ctx.fillStyle='#553c31';ctx.beginPath();ctx.moveTo(-9,25);ctx.lineTo(0,1);ctx.lineTo(9,25);ctx.fill();
  } else if(t==='oilLamp'){
    ctx.fillStyle='#b78b49';ctx.beginPath();ctx.ellipse(0,3,17,10,0,0,7);ctx.fill();
    ctx.fillStyle='#f1c86a';ctx.fillRect(-8,-8,16,10);ctx.strokeStyle='#825321';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(15,0,8,-1.2,1.3);ctx.stroke();ctx.fillStyle='#efae37';ctx.beginPath();ctx.arc(0,-12,5,0,7);ctx.fill();
  } else if(t==='cushions'||t==='chair'){
    for(const [dx,dy,c] of [[-11,0,'#9d4045'],[10,2,'#d39e4c']]){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(dx,dy,14,11,0,0,7);ctx.fill();}
  } else if(t==='table'){
    ctx.fillStyle='#b17a48';ctx.beginPath();ctx.arc(0,0,27,0,7);ctx.fill();ctx.strokeStyle='#dfbd83';ctx.lineWidth=5;ctx.stroke();
  } else if(t==='bed'){ctx.fillStyle='#d8b67f';ctx.fillRect(-26,-31,52,62);ctx.fillStyle='#9d3d51';ctx.fillRect(-20,-15,40,40);}
  else if(t==='bookshelf'){ctx.fillStyle='#c59c69';ctx.fillRect(-27,-18,54,36);ctx.strokeStyle='#916b44';ctx.lineWidth=4;ctx.strokeRect(-27,-18,54,36);}
  else if(t==='barrel'||t==='hearth'){ctx.fillStyle='#ab7f4d';ctx.beginPath();ctx.arc(0,0,20,0,7);ctx.fill();}
  else{ctx.restore();drawProp({...p,style:'normal'});return;}
  ctx.restore();
}

function drawExpandedProp(p){
 const t=p.type,x=p.x,y=p.y;
 const set=new Set(['bench','cabinet','desk','sofa','sofaBlue','sofaRed','sofaGreen','lowTable','console','lamp','cactus','flowers','reeds','crystal','urn','crate','rug','screen','fountain','torch']);
 if(!set.has(t))return false;
 ctx.save();ctx.translate(x,y);ctx.rotate(((p.rot||0)%4)*Math.PI/2);
 const future=isRetroFuture(p),arabia=isArabia(p);
 const wood=arabia?'#bd9563':future?'#c7dbe4':'#885a35';
 const edge=arabia?'#79523a':future?'#5f8b9a':'#4b3022';
 ctx.fillStyle='rgba(0,0,0,.24)';ctx.fillRect(-24,-16,52,34);
 if(['bench','desk','sofa','sofaBlue','sofaRed','sofaGreen','lowTable','console'].includes(t)){
   const widths={bench:60,desk:62,sofa:67,sofaBlue:67,sofaRed:67,sofaGreen:67,lowTable:48,console:54},w=widths[t];
   ctx.fillStyle=edge;ctx.fillRect(-w/2-2,-19,w+4,38);
   ctx.fillStyle=p.color||({sofa:'#c7b5a4',sofaBlue:'#477cad',sofaRed:'#ae4e55',sofaGreen:'#538b69'}[t])||wood;ctx.fillRect(-w/2,-16,w,32);
   ctx.strokeStyle=future?'#45bfc9':'#d7b079';ctx.lineWidth=2;ctx.strokeRect(-w/2+3,-13,w-6,26);
   if(t==='console'){ctx.fillStyle='#75e9e1';ctx.fillRect(-18,-10,36,16);}
   if(t.startsWith('sofa')){ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(-w/2,-16,w,9);}
 }else if(['cabinet','screen','crate'].includes(t)){
   const w=t==='screen'?54:42,h=t==='screen'?12:44;
   ctx.fillStyle=edge;ctx.fillRect(-w/2-2,-h/2-2,w+4,h+4);
   ctx.fillStyle=wood;ctx.fillRect(-w/2,-h/2,w,h);
   ctx.strokeStyle=future?'#58d4df':'#e4b97a';ctx.lineWidth=2;
   ctx.strokeRect(-w/2+4,-h/2+4,w-8,h-8);
   if(t==='cabinet'){ctx.fillStyle=edge;ctx.fillRect(-2,-h/2,4,h);}
 }else if(['lamp','torch','urn'].includes(t)){
   ctx.fillStyle=edge;ctx.beginPath();ctx.ellipse(0,6,14,8,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=t==='urn'?'#c6a27c':wood;ctx.beginPath();ctx.ellipse(0,0,11,15,0,0,Math.PI*2);ctx.fill();
   if(t!=='urn'){ctx.fillStyle=future?'#85e8f2':'#f7bd62';ctx.beginPath();ctx.arc(0,-12,9,0,Math.PI*2);ctx.fill();}
 }else if(['cactus','reeds','flowers'].includes(t)){
   ctx.strokeStyle=t==='cactus'?'#4a8459':'#577648';ctx.lineWidth=t==='cactus'?8:3;
   for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*5,12);ctx.lineTo(i*7,-14+Math.abs(i)*5);ctx.stroke();}
   if(t==='flowers'){ctx.fillStyle='#e79bac';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.arc(i*7,-12+Math.abs(i)*5,4,0,Math.PI*2);ctx.fill();}}
 }else if(t==='crystal'){
   ctx.fillStyle='#6ae2e0';ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(18,-3);ctx.lineTo(6,18);ctx.lineTo(-16,7);ctx.closePath();ctx.fill();ctx.strokeStyle='#e6fbff';ctx.lineWidth=2;ctx.stroke();
 }else if(t==='rug'){
   ctx.fillStyle=p.color||(arabia?'#a14551':'#744b79');ctx.fillRect(-30,-22,60,44);
   ctx.strokeStyle='#d8ad6e';ctx.lineWidth=4;ctx.strokeRect(-26,-18,52,36);
 }else if(t==='fountain'){
   ctx.fillStyle='#9aa8a9';ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#49a9c5';ctx.beginPath();ctx.arc(0,0,21,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#b5edf4';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();return true;
}


function drawSleepingFurniture(p){
  const type=p.type,x=p.x,y=p.y;
  const future=isRetroFuture(p)||type==='capsuleBed';
  const sizes={bed:[44,84],bedDouble:[78,90],sleepingBag:[32,76],capsuleBed:[66,100]};
  const [w,h]=sizes[type]||sizes.bed;
  const occupant=state.entities.find(e=>e.sleepPose&&e.sleepBed&&e.sceneId===state.activeSceneId&&e.floor===state.currentFloor&&Math.hypot(e.sleepBed.x-x,e.sleepBed.y-y)<2);
  ctx.save();ctx.translate(x,y);ctx.rotate(((p.rot||0)%4)*Math.PI/2);
  ctx.fillStyle='rgba(0,0,0,.30)';ctx.fillRect(-w/2+4,-h/2+5,w,h);
  if(type==='sleepingBag'){
    ctx.fillStyle=p.color||(future?'#b7d1d2':'#637d4c');
    ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,14);ctx.fill();
    ctx.strokeStyle=future?'#6bbfc2':'#354e37';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#ddd0b3';ctx.beginPath();ctx.ellipse(0,-h/2+15,13,10,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#cdbd8a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,-8);ctx.lineTo(12,16);ctx.stroke();
  }else if(type==='capsuleBed'){
    ctx.fillStyle='#8da8b6';ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,25);ctx.fill();
    ctx.strokeStyle='#d3b875';ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle=occupant?'#83b8c2':'#d5e9eb';
    ctx.beginPath();ctx.roundRect(-w/2+8,-h/2+9,w-16,h-18,18);ctx.fill();
    ctx.strokeStyle='#42cde0';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=occupant?'rgba(48,116,137,.52)':'rgba(109,191,207,.16)';
    ctx.beginPath();ctx.roundRect(-w/2+10,-h/2+11,w-20,h-22,15);ctx.fill();
    ctx.fillStyle=occupant?'#53e3b9':'#dcb66c';ctx.fillRect(w/2-5,-7,8,14);
  }else{
    const frame=future?'#c3d4df':isArabia(p)?'#c69d69':'#765236';
    ctx.fillStyle=frame;ctx.fillRect(-w/2,-h/2,w,h);
    ctx.strokeStyle=future?'#6e9eae':'#443221';ctx.lineWidth=3;ctx.strokeRect(-w/2,-h/2,w,h);
    ctx.fillStyle=p.color||(future?'#f0efec':isArabia(p)?'#cb7067':type==='bedDouble'?'#677d9c':'#9e6473');
    ctx.fillRect(-w/2+5,-h/2+5,w-10,h-10);
    ctx.fillStyle='#eee7d8';ctx.fillRect(-w/2+6,-h/2+7,w-12,21);
    ctx.fillStyle=type==='bedDouble'?'#e7d4be':'#d6b98f';
    if(type==='bedDouble'){
      ctx.fillRect(-w/2+7,-h/2+8,(w-19)/2,17);
      ctx.fillRect(3,-h/2+8,(w-19)/2,17);
    }else ctx.fillRect(-w/2+9,-h/2+9,w-18,17);
    ctx.strokeStyle='rgba(255,255,255,.30)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-w/2+7,h/2-8);ctx.lineTo(w/2-7,h/2-8);ctx.stroke();
  }
  ctx.restore();
}
function drawProp(p) {
  if(drawPlant(p))return;
  if(p.scale&&p.scale!==1){
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.scale,p.scale);ctx.translate(-p.x,-p.y);
    drawProp({...p,scale:1});ctx.restore();return;
  }
  if(isPortableLadder(p)){drawPortableLadder(p);return;}
  if(isKenneyObject(p.type)){drawKenneyObject(p);return;}
  if(isKenneyRoguelikeObject(p.type)){drawKenneyRoguelikeObject(p);return;}
  if(isSleepingFurniture(p)&&!TENT_TYPES.has(p.type)){drawSleepingFurniture(p);return;}
  if(drawSceneryProp(p)||drawMesaFurniture(p)||drawMaterialFurniture(p)||drawGeologyProp(p)||drawCatalogProp(p)||drawExpandedProp(p))return;
  if(p.type==='key'){
    ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle='#e7be4c';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(-5,-2,5,0,Math.PI*2);ctx.moveTo(0,0);ctx.lineTo(15,11);ctx.moveTo(9,6);ctx.lineTo(7,11);ctx.moveTo(13,9);ctx.lineTo(11,14);ctx.stroke();
    ctx.restore();return;
  }
  if(isRetroFuture(p)) {drawFutureProp(p); return;}
  if(isArabia(p) || ['palm','desertTree','tent','oilLamp','cushions'].includes(p.type)){drawArabiaProp(p);return;}
  if(p.rot&&p.type!=='log'){
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/2);ctx.translate(-p.x,-p.y);
    drawProp({...p,rot:0});ctx.restore();return;
  }
  const cx = p.x;
  const cy = p.y;

  if (p.type === 'log') {
    ctx.save();ctx.translate(cx,cy);
    ctx.rotate(((p.rot||0)%4)*Math.PI/2);
    ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(-70,-9,140,22);
    ctx.fillStyle='#85532b';ctx.fillRect(-70,-11,140,21);
    ctx.strokeStyle='#402616';ctx.lineWidth=3;ctx.strokeRect(-70,-11,140,21);
    ctx.strokeStyle='rgba(221,162,94,.65)';ctx.lineWidth=1;
    for(let i=-54;i<70;i+=23){ctx.beginPath();ctx.moveTo(i,-9);ctx.lineTo(i+5,7);ctx.stroke();}
    ctx.fillStyle='#af7844';ctx.fillRect(-68,-8,6,15);
    ctx.restore();
  } else if (p.type === 'tree' || p.type === 'fruitTree') {
    const sway = Math.sin(animTick + p.x * 0.02) * 2.5;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.arc(cx + 8, cy + 10, 30, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#4a3018';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy - 7); ctx.stroke();
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx - 15, cy - 12);
    ctx.moveTo(cx, cy - 2); ctx.lineTo(cx + 15, cy - 10);
    ctx.stroke();

    const clusters = [
      { dx: -13, dy: -7, r: 17, c: '#234d20' },
      { dx: 13, dy: -6, r: 17, c: '#2b5c27' },
      { dx: 0, dy: -15, r: 20, c: '#387533' },
      { dx: 0, dy: 3, r: 16, c: '#2e6329' }
    ];
    clusters.forEach(cl => {
      ctx.fillStyle = cl.c;
      ctx.beginPath(); ctx.arc(cx + cl.dx + sway, cy + cl.dy, cl.r, 0, Math.PI * 2); ctx.fill();
    });

    if (p.type === 'fruitTree') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx - 8 + sway, cy - 12, 4, 0, Math.PI * 2);
      ctx.arc(cx + 9 + sway, cy - 8, 4, 0, Math.PI * 2);
      ctx.arc(cx + 2 + sway, cy - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.type === 'pine') {
    const sway = Math.sin(animTick + p.x * 0.02) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.arc(cx + 7, cy + 9, 25, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3d2612'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx, cy + 12); ctx.lineTo(cx, cy - 12); ctx.stroke();
    const tiers = [{ dy: 6, r: 22, c: '#193d24' }, { dy: -4, r: 17, c: '#1f4d2d' }, { dy: -13, r: 12, c: '#286139' }];
    tiers.forEach(t => {
      ctx.fillStyle = t.c;
      ctx.beginPath(); ctx.arc(cx + sway, cy + t.dy, t.r, 0, Math.PI * 2); ctx.fill();
    });
  } else if (p.type === 'bush') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.arc(cx + 3, cy + 4, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#26a641';
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#122616'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ff4757';
    ctx.beginPath(); ctx.arc(cx - 5, cy - 2, 2.5, 0, Math.PI * 2); ctx.arc(cx + 5, cy + 2, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (p.type === 'rock') {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.ellipse(cx + 4, cy + 7, 22, 15, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5f6775';
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 5); ctx.lineTo(cx - 13, cy - 14); ctx.lineTo(cx + 6, cy - 16);
    ctx.lineTo(cx + 19, cy - 3); ctx.lineTo(cx + 12, cy + 13); ctx.lineTo(cx - 8, cy + 14);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1c212b'; ctx.lineWidth = 2; ctx.stroke();
  } else if (p.type === 'table') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(cx - 32, cy - 18, 68, 40);
    ctx.fillStyle = '#8a5426';
    ctx.fillRect(cx - 34, cy - 20, 68, 40);
    ctx.strokeStyle = '#241306'; ctx.lineWidth = 2.5; ctx.strokeRect(cx - 34, cy - 20, 68, 40);
  } else if (p.type === 'chair') {
    ctx.fillStyle = '#75441c';
    ctx.fillRect(cx - 13, cy - 13, 26, 26);
    ctx.strokeStyle = '#241306'; ctx.lineWidth = 2; ctx.strokeRect(cx - 13, cy - 13, 26, 26);
  } else if (p.type === 'barrel') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(cx + 3, cy + 4, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8f4719';
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#241306'; ctx.lineWidth = 2.5; ctx.stroke();
  } else if (p.type === 'bed') {
    ctx.fillStyle = '#543318';
    ctx.fillRect(cx - 24, cy - 30, 48, 60);
    ctx.fillStyle = '#9c2d3c';
    ctx.fillRect(cx - 20, cy - 8, 40, 34);
    ctx.fillStyle = '#eef2f7';
    ctx.fillRect(cx - 17, cy - 25, 34, 12);
  } else if (p.type === 'bookshelf') {
    ctx.fillStyle = '#4f3117';
    ctx.fillRect(cx - 26, cy - 16, 52, 32);
    ctx.fillStyle = '#c94a4a'; ctx.fillRect(cx - 20, cy - 10, 8, 14);
    ctx.fillStyle = '#4a89c9'; ctx.fillRect(cx - 8, cy - 10, 8, 14);
    ctx.fillStyle = '#e3b23c'; ctx.fillRect(cx + 6, cy - 10, 8, 14);
  } else if (p.type === 'hearth') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(cx - 32, cy - 18, 68, 40);
    ctx.fillStyle = '#384152';
    ctx.fillRect(cx - 34, cy - 20, 68, 40);
    ctx.strokeStyle = '#181d26'; ctx.lineWidth = 2.5; ctx.strokeRect(cx - 34, cy - 20, 68, 40);
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.arc(cx, cy + 4, 16, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(cx, cy + 4, 9, Math.PI, 0); ctx.fill();
  }
}

function drawSpeechBubble(x, y, text) {
  ctx.font = '12px sans-serif';
  const w = Math.min(220, ctx.measureText(text).width + 18);
  const h = 26;
  ctx.fillStyle = 'rgba(18, 22, 32, 0.95)';
  ctx.strokeStyle = '#f5b942';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(text.slice(0, 34), x, y - 9);
}

// UI & FICHA
