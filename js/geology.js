const geologyTypes=new Map([
 ['rock',['Rocha','单块岩石',[0,1,2,3],42]],
 ['rockCluster',['Aglomerado de Rochas','岩石群',[4,5],74]],
 ['mossRock',['Rocha musgosa','苔藓岩',[0],47]],
 ['slateRock',['Rocha de ardósia','板岩',[1],49]],
 ['sandstoneRock',['Rocha de arenito','砂岩',[2],49]],
 ['volcanicRock',['Rocha vulcânica','火山岩',[3],45]],
 ['crystal',['Cristal','单枚水晶',[6,7],36]],
 ['crystalCluster',['Cristais Arcanos','水晶群',[8,9],60]],
 ['pottedMonstera',['Monstera em vaso','龟背竹盆栽',[10],32,'props']],
 ['pottedSucculent',['Suculenta em vaso','多肉盆栽',[11],25,'props']]
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
 const seed=crypto.getRandomValues(new Uint32Array(1))[0];
 const count=entry[2].length,last=floor.props.findLast(prop=>prop.type===type);
 const prior=last?geologyVariant(last):null;
 const artVariant=prior===null||count===1?seed%count:(prior+1+seed%(count-1))%count;
 return {artSeed:seed,artVariant};
}

function geologySeed(prop){
 return prop.artSeed??(Math.imul(Math.round(prop.x*31),73856093)^Math.imul(Math.round(prop.y*29),19349663))>>>0;
}

function geologyVariant(prop){
 const count=geologyTypes.get(prop.type)[2].length;
 return ((prop.artVariant??geologySeed(prop))%count+count)%count;
}

function geologyPropRadius(type){
 const entry=geologyTypes.get(type);
 return entry?entry[3]*.29:0;
}

function drawGeologyProp(prop){
 const entry=geologyTypes.get(prop.type);
 if(!entry)return false;
 if(!geologyAtlas.complete||!geologyAtlas.naturalWidth)return false;
 const seed=geologySeed(prop),random=seededRandom(seed),width=entry[3];
 const sprite=entry[2][geologyVariant(prop)];
 const w=geologyAtlas.naturalWidth/4,h=geologyAtlas.naturalHeight/3;
 ctx.save();ctx.translate(prop.x,prop.y);ctx.rotate((prop.rot||0)*Math.PI/2+(random()-.5)*.9);
 ctx.scale((.83+random()*.28)*(random()<.5?-1:1),.84+random()*.28);
 ctx.drawImage(geologyAtlas,(sprite%4)*w,Math.floor(sprite/4)*h,w,h,-width/2,-width/2,width,width);
 ctx.restore();
 return true;
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
