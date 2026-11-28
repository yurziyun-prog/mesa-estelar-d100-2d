const sandColors={
 sand:[128,85,41,1.27],alienCrimson:[135,41,29,1.08],
 purpleSand:[81,42,118,1.12],paleSand:[164,126,78,1.3],ochreSand:[129,70,24,1.28]
};
const finishTextures=new Map([
 ['mesaCeramicGrid',['Azulejo do Mesa Estelar','Mesa Estelar 瓷砖','azulejo']],
 ['mesaMarbleGrid',['Mármore branco em módulos','白色大理石方砖','marmore_branco']],
 ['mesaStoneGrid',['Pedra do Mesa Estelar','Mesa Estelar 石地板','pedra']],
 ['caveGrid',['Rocha de caverna em módulos','洞穴石砖',null,'caveStone']],
 ['crystalGrid',['Cristal em módulos','水晶方砖',null,'crystalFloor']],
 ['cyberGrid',['Placas de neon','霓虹方砖',null,'cyberFloor']]
]);
const referenceGroundTextures=[
 ['pebbledTurf','pebbled-turf',224,'Relva com pedregulhos','碎石草地'],
 ['mossJointPaving','moss-joint-paving-clean',304,'Lajes com juntas verdes','草缝石板路'],
 ['deepGreenGrass','deep-green-grass',152,'Relva verde-forte','浓绿草地'],
 ['fineGrass','fine-grass',168,'Relva de folhas finas','细叶草地'],
 ['leafyRocks','leafy-rocks',264,'Rochas entre folhagens','绿叶岩地'],
 ['mossyPaving','mossy-paving',216,'Pavimento com musgo','苔藓石路'],
 ['patchyBedrock','patchy-bedrock',236,'Rocha com manchas de relva','草斑岩地'],
 ['overgrownCobbles','overgrown-cobbles',256,'Calçamento tomado pela vegetação','长草石砖路'],
 ['tallMeadow','tall-meadow',216,'Capim alto de bosque','林间高草'],
 ['tallBlades','tall-blades',124,'Capim alto de folhas largas','阔叶高草']
];
const highGrassColors={
 tallMeadow:['#2e4322','#546a36','#7d8e49'],
 tallBlades:['#254936','#4c783e','#8cae54']
};
const originalMesaTextures={
 ...Object.fromEntries(referenceGroundTextures.map(([id,file,size])=>[id,[file,size,'#535c39']])),
 wood:['madeira',288,'#795a40'],
 wallBrick:['tijolo',192,'#ae6047'],
 mesaGrass:['grama',192,'#566933']
};

const pavingRects=[
 [22,20,86,92],[133,20,87,92],[244,21,84,90],
 [22,131,86,88],[133,132,84,87],[244,132,86,87],
 [22,240,85,89],[133,240,85,89],[245,240,84,89]
];
const finishImages=new Map(),finishTiles=new Map(),finishPatterns=new Map();
const bridgeFinishes={bridge:'#765237',bridgeCovered:'#493321',bridgeMetal:'#8796a8',bridgeMarble:'#d9d8d4',bridgeStone:'#76796f'};

function finishImage(file){
 if(!finishImages.has(file)){
   const image=new Image();
   image.src='assets/mesa-estelar/'+file;
   finishImages.set(file,image);
 }
 return finishImages.get(file);
}

function getFinishTile(id){
 if(finishTiles.has(id))return finishTiles.get(id);
 const paving=/^paving([1-9])$/.exec(id);
 const finish=finishTextures.get(id);
 if(!paving&&!finish&&id!=='rockyDunes')return null;
 const file=paving?'paving-reference.webp':id==='rockyDunes'?'dune-reference.webp':finish[2]?finish[2]+'.webp':null;
 const image=file?finishImage(file):getTerrainTile(finish[3]);
 if(file&&(!image.complete||!image.naturalWidth))return null;
 const tile=document.createElement('canvas');
 tile.width=tile.height=paving?96:id==='rockyDunes'?512:64;
 const g=tile.getContext('2d'),size=tile.width;
 if(paving){
   const [x,y,w,h]=pavingRects[Number(paving[1])-1];
   g.drawImage(image,x+2,y+2,w-4,h-4,0,0,size,size);
 }else if(id==='rockyDunes'){
   // Espelhar os quadrantes preserva a continuidade ao repetir o terreno.
   for(let y=0;y<2;y++)for(let x=0;x<2;x++){
     g.save();g.translate((x?2:0)*size/2,(y?2:0)*size/2);
     g.scale(x?-1:1,y?-1:1);g.drawImage(image,0,0,size/2,size/2);g.restore();
   }
 }else{
   g.drawImage(image,0,0,size,size);
   g.strokeStyle='rgba(21,24,30,.55)';g.lineWidth=2;
   g.strokeRect(0,0,32,32);g.strokeRect(32,0,32,32);
   g.strokeRect(0,32,32,32);g.strokeRect(32,32,32,32);
   g.strokeStyle='rgba(255,255,255,.32)';g.lineWidth=1;g.strokeRect(2,2,28,28);
   g.strokeRect(34,2,28,28);g.strokeRect(2,34,28,28);g.strokeRect(34,34,28,28);
 }
 finishTiles.set(id,tile);
 return tile;
}

function originalMesaPaint(id){
 const [file,size,fallback]=originalMesaTextures[id];
 if(!finishPatterns.has(id)){
   const image=finishImage(file+'.webp');
   if(!image.complete||!image.naturalWidth)return fallback;
   const pattern=ctx.createPattern(image,'repeat');
   pattern.setTransform(new DOMMatrix().scale(size/image.naturalWidth,size/image.naturalHeight));
   finishPatterns.set(id,pattern);
 }
 return finishPatterns.get(id);
}

function drawMesaBrickWall(x1,y1,x2,y2,width){
 const dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy);
 if(!length)return;
 ctx.save();
 ctx.translate(x1,y1);
 ctx.rotate(Math.atan2(dy,dx));
 ctx.fillStyle=originalMesaPaint('wallBrick');
 ctx.fillRect(-width/2,-width/2,length+width,width);
 ctx.restore();
}

function finishTerrainPaint(id){
 if(id!=='wallBrick'&&Object.hasOwn(originalMesaTextures,id))return originalMesaPaint(id);
 if(!finishTextures.has(id)&&id!=='rockyDunes'&&!/^paving[1-9]$/.test(id))return null;
 if(!finishPatterns.has(id)){
   const tile=getFinishTile(id);
   if(tile)finishPatterns.set(id,ctx.createPattern(tile,'repeat'));
 }
 return finishPatterns.get(id)||(id==='rockyDunes'?'#c49a68':'#95918b');
}

function isBridgeMaterial(mat){
 return Object.hasOwn(bridgeFinishes,mat);
}

function drawBridgeFinish(mat,x,y,w,h){
 const vertical=h>w;
 ctx.save();ctx.translate(x+w/2,y+h/2);
 if(vertical)ctx.rotate(Math.PI/2);
 const length=vertical?h:w,width=vertical?w:h;
 const tile=mat==='bridge'||mat==='bridgeCovered'?'wood':
   mat==='bridgeMetal'?'scifiMetal':mat==='bridgeMarble'?'mesaMarbleGrid':'mesaStoneGrid';
 ctx.fillStyle=finishTerrainPaint(tile)||getTerrainPattern(ctx,tile);
 ctx.fillRect(-length/2,-width/2,length,width);
 for(const side of [-1,1]){
   ctx.fillStyle='#34353c';ctx.fillRect(-length/2,side*(width/2-3)-3,length,6);
   ctx.fillStyle=bridgeFinishes[mat];ctx.fillRect(-length/2,side*(width/2-3)-1,length,2);
 }
 ctx.restore();
}

const furnitureFinishes=[
 ['woodTable','Mesa de Madeira','木桌','longTable','tavernWood'],
 ['stoneTable','Mesa de Pedra','石桌','modernTable','mesaStoneGrid'],
 ['metalTable','Mesa de Metal','金属桌','modernTable','scifiMetal'],
 ['woodChair','Cadeira de Madeira','木椅','armchair','tavernWood'],
 ['stoneChair','Cadeira de Pedra','石椅','armchair','mesaStoneGrid'],
 ['metalChair','Cadeira de Metal','金属椅','armchair','scifiMetal']
];
const furnitureFinishById=new Map(furnitureFinishes.map(item=>[item[0],item]));

function drawFireEffect(prop,coreOnly=false){
 if(prop.decorationOff)return;
 const hearing=Boolean(fireplaceDesign(prop.type));
 if(hearing&&prop.fireLit===false)return;
 if(!hearing&&!['braziers','campfire'].includes(prop.type))return;
 const t=terrainMotionPreference.matches?0:performance.now()/1000;
 ctx.save();ctx.translate(prop.x,prop.y);ctx.rotate((prop.rot||0)*Math.PI/2);
 ctx.scale(prop.scale||1,prop.scale||1);
 ctx.translate(0,hearing?5:0);
 if(!coreOnly){
   const glow=ctx.createRadialGradient(0,0,1,0,0,23+Math.sin(t*9)*2);
   glow.addColorStop(0,'rgba(255,169,62,.19)');glow.addColorStop(1,'rgba(255,115,30,0)');
   ctx.fillStyle=glow;ctx.fillRect(-25,-25,50,50);
 }
 for(let i=0;i<4;i++){
   const flicker=Math.sin(t*(9+i)+i*2.4);
   const x=(i-1.5)*4,h=10+i*2+flicker*4;
   ctx.fillStyle=i%2?'#ffbe55':'#f37b2a';
   ctx.beginPath();ctx.moveTo(x-4,7);ctx.quadraticCurveTo(x-7,-2,x+flicker*4,-h);
   ctx.quadraticCurveTo(x+7,0,x+4,7);ctx.fill();
 }
 ctx.restore();
}

function initTerrainFinishes(){
 const groups=[
  ['Variações de areia','沙地变体',[
   ['purpleSand','Areia violeta','紫色沙地'],['paleSand','Areia clara','浅金沙地'],
   ['ochreSand','Areia ocre','赭色沙地'],['rockyDunes','Dunas rochosas','岩石沙丘']
  ]],
  ['Gramas do Mesa Estelar','Mesa Estelar 草地',[['mesaGrass','Grama original','原版草地']]],
  ['Relva e pavimentos naturais','草地与自然铺装',referenceGroundTextures
    .filter(([id])=>!Object.hasOwn(highGrassColors,id)).map(([id,,,pt,zh])=>[id,pt,zh])],
  ['Capim alto','高草',referenceGroundTextures
    .filter(([id])=>Object.hasOwn(highGrassColors,id)).map(([id,,,pt,zh])=>[id,pt,zh])],
  ['Águas','水域',[['riverWater','Água de rio','河流'],['water','Lago','湖泊'],['coastSea','Mar costeiro','海洋']]],
  ['Calçamentos','石板道路',pavingRects.map((_,i)=>['paving'+(i+1),'Calçamento '+(i+1),'石板道路 '+(i+1)])]
 ];
 for(const [name,zh,items] of groups){
   TERRAIN_GROUPS.push([name,items.map(([id,label])=>[id,label])]);
   SITE_ZH.set(name,zh);
   for(const [,label,translation] of items)SITE_ZH.set(label,translation);
 }
 for(const [label,zh] of finishTextures.values())SITE_ZH.set(label,zh);
 for(const [,label,zh] of furnitureFinishes)SITE_ZH.set(label,zh);
 for(const [pt,zh] of [['Água Cristalina','湖泊／海洋水面'],['Ponte metálica','金属桥'],['Ponte de mármore','大理石桥'],
   ['Ponte de pedra','石桥'],['Girar 90°','旋转 90°'],['Materiais de mesa e cadeira','桌椅材质'],
   ['Edificação / Sala','建筑／房间'],['O alçapão precisa de piso no andar de baixo.','活板门下方需要有可落脚的地面。']])SITE_ZH.set(pt,zh);
}

function terrainFinishFallback(mat){
 return mat==='coastSea'||mat==='riverWater'?'water':Object.hasOwn(sandColors,mat)?'sand':mat;
}

function createFinishThumbnail(id){
 if(waterDefaults[id])return createTerrainThumbnail(id);
 const original=Object.hasOwn(originalMesaTextures,id)?originalMesaTextures[id]:null;
 if(!original&&!finishTextures.has(id)&&id!=='rockyDunes'&&!/^paving[1-9]$/.test(id))return null;
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=32;canvas.className='terrain-preview';canvas.setAttribute('aria-hidden','true');
 const draw=()=>{
   const tile=original?image:getFinishTile(id);
   if(tile)canvas.getContext('2d').drawImage(tile,0,0,32,32);
 };
 const image=original?finishImage(original[0]+'.webp'):id==='rockyDunes'?finishImage('dune-reference.webp'):
   id.startsWith('paving')?finishImage('paving-reference.webp'):
   finishTextures.get(id)[2]?finishImage(finishTextures.get(id)[2]+'.webp'):null;
 if(image&&!image.complete)image.addEventListener('load',draw,{once:true});else draw();
 return canvas;
}

function drawMaterialFurniture(p){
 const finish=furnitureFinishById.get(p.type);
 if(!finish)return false;
 const chair=p.type.endsWith('Chair'),w=chair?23:63,h=chair?24:36;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate((p.rot||0)*Math.PI/2);
 ctx.fillStyle='rgba(0,0,0,.36)';ctx.fillRect(-w/2+4,-h/2+5,w,h);
 ctx.fillStyle=finishTerrainPaint(finish[4])||getTerrainPattern(ctx,finish[4]);
 ctx.fillRect(-w/2,-h/2,w,h);
 ctx.strokeStyle='#282b32';ctx.lineWidth=2;ctx.strokeRect(-w/2,-h/2,w,h);
 ctx.fillStyle='rgba(255,255,255,.31)';ctx.fillRect(-w/2+2,-h/2+2,w-4,3);
 if(chair){ctx.fillStyle='#373a40';ctx.fillRect(-w/2,-h/2,w,5);}
 ctx.restore();
 return true;
}
