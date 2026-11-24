const geologyTypes=new Map([
 ['rock',['Rocha','单块岩石',1,42]],
 ['rockCluster',['Aglomerado de Rochas','岩石群',4,74]],
 ['mossRock',['Rocha musgosa','苔藓岩',0,47]],
 ['slateRock',['Rocha de ardósia','板岩',1,49]],
 ['sandstoneRock',['Rocha de arenito','砂岩',2,49]],
 ['volcanicRock',['Rocha vulcânica','火山岩',3,45]],
 ['mountainRock',['Rocha de montanha','山地岩石',1,59]],
 ['riverRock',['Seixo de rio','河卵石',1,37]],
 ['caveStalactite',['Estalactites','钟乳石',1,56]],
 ['amethyst',['Ametista','紫水晶',7,48]],
 ['citrine',['Citrino','黄水晶',6,46]],
 ['iceCrystal',['Cristal glacial','冰蓝水晶',6,51]],
 ['crystal',['Cristal','单枚水晶',6,36]],
 ['crystalCluster',['Cristais Arcanos','水晶群',8,60]],
 ['pottedMonstera',['Monstera em vaso','龟背竹盆栽',10,32,'props']],
 ['pottedSucculent',['Suculenta em vaso','多肉盆栽',11,25,'props']]
]);
const geologyAtlas=new Image();
geologyAtlas.src='assets/nature/geology-and-pots.webp';

function geologyEntries(category){
 const existing=['rock','rockCluster','crystal','crystalCluster'];
 return [...geologyTypes].filter(([id,item])=>!existing.includes(id)&&(item[4]||'nature')===category)
   .map(([id,[label]])=>[id,'',label,'prop']);
}

function newGeologyVariant(floor,type){
 const entry=geologyTypes.get(type);
 if(!entry)return {};
 const last=floor.props.findLast(prop=>prop.type===type);
 let seed=crypto.getRandomValues(new Uint32Array(1))[0];
 if(last&&seed===geologySeed(last))seed=(seed+1)>>>0;
 return {artSeed:seed};
}

function geologySeed(prop){
 return prop.artSeed??(Math.imul(Math.round(prop.x*31),73856093)^Math.imul(Math.round(prop.y*29),19349663))>>>0;
}

function geologyPropRadius(type){
 const entry=geologyTypes.get(type);
 return entry?entry[3]*.29:0;
}

function drawGeologyProp(prop){
 const entry=geologyTypes.get(prop.type);
 if(!entry)return false;
 if(!geologyAtlas.complete||!geologyAtlas.naturalWidth)return false;
 const random=seededRandom(geologySeed(prop)),width=entry[3],sprite=entry[2];
 const w=geologyAtlas.naturalWidth/4,h=geologyAtlas.naturalHeight/3;
 ctx.save();ctx.translate(prop.x,prop.y);ctx.rotate((prop.rot||0)*Math.PI/2+(random()-.5)*1.6);
 if(sprite>=10){
   ctx.drawImage(geologyAtlas,(sprite%4)*w,Math.floor(sprite/4)*h,w,h,-width/2,-width/2,width,width);
 }else if(sprite>=6){
   const hues={crystal:169,crystalCluster:169,amethyst:277,citrine:43,iceCrystal:200};
   const count=prop.type==='crystal'?1:3+Math.floor(random()*4);
   for(let i=0;i<count;i++){
     const spread=(i+.5)/count-.5;
     ctx.save();ctx.translate(spread*width*.75,width*.26-random()*width*.23);
     ctx.rotate(spread*1.8+(random()-.5)*.48);
     drawMineralPoint(width*(.45+random()*.47),width*(.1+random()*.11),hues[prop.type],random);
     ctx.restore();
   }
 }else if(prop.type==='caveStalactite'){
   const count=2+Math.floor(random()*4);
   for(let i=0;i<count;i++){
     ctx.save();ctx.translate((i/count-.38)*width*.9,width*.25-random()*width*.18);
     ctx.rotate((random()-.5)*.69);
     drawMineralPoint(width*(.37+random()*.36),width*(.12+random()*.11),37,random,22);
     ctx.restore();
   }
 }else{
   const count=prop.type==='rockCluster'?4+Math.floor(random()*3):1;
   const texture=prop.type==='rockCluster'?1:sprite;
   for(let i=0;i<count;i++){
     const radius=count===1?width*.48:width*(.11+random()*.14);
     const angle=i/count*Math.PI*2;
     const reach=count===1?0:width*(.12+random()*.17);
     ctx.save();ctx.translate(Math.cos(angle)*reach,Math.sin(angle)*reach);
     ctx.rotate((random()-.5)*2);
     const aspect=prop.type==='riverRock'?.52+random()*.27:.75+random()*.26;
     ctx.scale(1,aspect);
     ctx.beginPath();
     const sides=prop.type==='riverRock'?14:7+Math.floor(random()*6);
     for(let j=0;j<sides;j++){
       const theta=j/sides*Math.PI*2,r=radius*(.72+random()*.28);
       const x=Math.cos(theta)*r,y=Math.sin(theta)*r;
       if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
     }
     ctx.closePath();
     ctx.fillStyle=['#586046','#656662','#996744','#413939'][texture];
     ctx.fill();ctx.clip();
     const span=radius*2.75;
     ctx.drawImage(geologyAtlas,(texture%4)*w,0,w,h,-span/2,-span/2,span,span);
     ctx.restore();
   }
 }
 ctx.restore();
 return true;
}

function drawMineralPoint(length,width,hue,random,saturation=65){
 const tip=(random()-.5)*width*.65;
 const shoulder=length*(.58+random()*.28);
 const polygon=(points,light)=>{
   ctx.beginPath();ctx.moveTo(...points[0]);
   for(const point of points.slice(1))ctx.lineTo(...point);
   ctx.closePath();ctx.fillStyle='hsl('+hue+' '+saturation+'% '+light+'%)';ctx.fill();
 };
 polygon([[-width,0],[-width*.78,-shoulder],[tip,-length],[0,-shoulder*.86],[0,0]],52);
 polygon([[0,0],[0,-shoulder*.86],[tip,-length],[width*.72,-shoulder],[width,0]],34);
 polygon([[-width*.78,-shoulder],[tip,-length],[width*.72,-shoulder],[0,-shoulder*.86]],73);
}

function initGeologyCatalog(){
 for(const [label,zh] of geologyTypes.values())SITE_ZH.set(label,zh);
 geologyAtlas.addEventListener('load',()=>{
   for(const key of catalogThumbnailCache.keys()){
     if(geologyTypes.has(key.split(':')[1]))catalogThumbnailCache.delete(key);
   }
   if(['nature','props'].includes(architectCategory))renderArchitectLibrary();
 },{once:true});
}
