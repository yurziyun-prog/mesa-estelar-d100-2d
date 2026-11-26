const plantTypes=new Map([
 ['tree',['Carvalho','橡树',61,'oak']],['fruitTree',['Frutífera','果树',49,'oak']],
 ['pine',['Pinheiro','松树',55,'pine']],['palm',['Palmeira','棕榈树',49,'palm']],
 ['bush',['Arbusto','灌木',21,'bush']],['fern',['Samambaia','蕨类植物',22,'fern']],
 ['desertTree',['Árvore de deserto','沙漠树',30,'winter']],
 ['winterTree',['Árvore de inverno','冬季落叶树',53,'winter']],
 ['deadTree',['Árvore morta','枯树',48,'dead']],
 ['alienPodTree',['Árvore de vagens lunares','月荚树',42,'pods']],
 ['alienFanTree',['Árvore-leque alienígena','外星扇叶树',39,'fan']],
 ['alienShelfTree',['Árvore de discos luminosos','荧光菌盘树',42,'discs']],
 ['flowers',['Flores','花丛',14,'flowers']],['reeds',['Juncos','芦苇',14,'reeds']],
 ['cactus',['Cacto','仙人掌',17,'cactus']]
]);
const extraPlantIds=['winterTree','deadTree','alienPodTree','alienFanTree','alienShelfTree'];
const plantCanopies=new Map();
const plantBases=new Map();
const illustratedCanopies=new Map([
 ['tree',0],['fruitTree',0],['pine',1],['palm',2],
 ['alienPodTree',3],['alienShelfTree',4],['alienFanTree',5]
]);
const overheadCanopyArt=new Image();
overheadCanopyArt.src='assets/nature/overhead-canopies.webp';
const plantTallKinds=new Set(['oak','pine','palm','winter','dead','pods','fan','discs']);

function plantTrunkRadius(type){
 const plant=plantTypes.get(type);
 return plantTallKinds.has(plant?.[3])?Math.max(7,Math.round(plant[2]*.17)):0;
}

function plantDisc(g,x,y,r,color){
 g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
}

function drawPlantBranches(g,radius,kind){
 const rand=seededRandom(kind==='dead'?1297:781);
 const bark=kind==='dead'?'#473b35':kind==='winter'?'#765844':'#5a402b';
 g.lineCap='round';g.lineJoin='round';
 const branch=(x,y,angle,length,width,depth)=>{
   const bend=(rand()-.5)*.7;
   const ex=x+Math.cos(angle+bend)*length,ey=y+Math.sin(angle+bend)*length;
   g.strokeStyle=bark;g.lineWidth=width;g.beginPath();g.moveTo(x,y);
   g.quadraticCurveTo(x+Math.cos(angle)*length*.55,y+Math.sin(angle)*length*.55,ex,ey);g.stroke();
   if(depth>0){
     branch(ex,ey,angle+bend+.53,length*.62,width*.54,depth-1);
     branch(ex,ey,angle+bend-.61,length*.57,width*.52,depth-1);
   }
 };
 for(let i=0;i<8;i++)branch(0,0,i*Math.PI/4,radius*(.31+rand()*.22),4,kind==='dead'||kind==='winter'?3:1);
 plantDisc(g,0,0,6,bark);
 plantDisc(g,-1,-1,3,'#a47b56');
}

function makePlantCanopy(type){
 if(plantCanopies.has(type))return plantCanopies.get(type);
 const [, ,r,kind]=plantTypes.get(type);
 const tile=document.createElement('canvas');
 tile.width=tile.height=(r+7)*4;
 const g=tile.getContext('2d');
 g.translate(tile.width/2,tile.height/2);g.scale(2,2);
 const rand=seededRandom([...type].reduce((seed,ch)=>seed+ch.charCodeAt(0),412));
 if(kind==='oak'||kind==='bush'){
   const scale=kind==='oak'?1:.65;
   // A silhueta e as quatro massas de folhagem do carvalho original.
   const clusters=[[-13,-7,17,'#234d20'],[13,-6,17,'#2b5c27'],[0,-15,20,'#387533'],[0,3,16,'#2e6329']];
   for(const [x,y,s,color] of clusters){
     plantDisc(g,x*scale,y*scale,s*scale,color);
     for(let i=0;i<38;i++){
       const a=rand()*Math.PI*2,d=Math.sqrt(rand())*s*.90;
       const px=(x+Math.cos(a)*d)*scale,py=(y+Math.sin(a)*d)*scale;
       plantDisc(g,px,py,(1+rand()*3)*scale,['#3b7036','#528947','#28582c','#65934b'][i%4]);
     }
   }
   if(type==='fruitTree')for(const [x,y] of [[-8,-12],[9,-8],[2,-2],[-14,1]])plantDisc(g,x,y,2.6,'#de6850');
 }else if(['pine','palm','fern','fan','reeds','cactus'].includes(kind)){
   const fronds=kind==='palm'?11:kind==='pine'?13:kind==='reeds'?8:9;
   for(let i=0;i<fronds;i++){
     g.save();g.rotate(i*2*Math.PI/fronds+(rand()-.5)*.16);
     const length=r*(.64+rand()*.33),wide=kind==='pine'?3:kind==='reeds'?1:kind==='fan'?9:5;
     const colors=kind==='fan'?['#267d72','#69c784','#d1e986']:['#2b5734','#467e44','#7fa35d'];
     g.fillStyle=colors[i%3];g.beginPath();g.moveTo(0,0);
     g.quadraticCurveTo(-wide,-length*.50,3,-length);
     g.quadraticCurveTo(wide+4,-length*.53,0,0);g.fill();
     g.strokeStyle=colors[2];g.lineWidth=.65;g.beginPath();g.moveTo(0,0);g.lineTo(3,-length);g.stroke();
     if(kind==='pine'||kind==='palm'||kind==='fern'){
       g.strokeStyle=colors[(i+1)%3];
       g.beginPath();
       for(let j=1;j<10;j++){
         const f=j/10,span=(1-f)*wide*(kind==='palm'?2:1.7);
         g.moveTo(f*3,-f*length);g.lineTo(f*3-span,-f*length-5);
         g.moveTo(f*3,-f*length);g.lineTo(f*3+span,-f*length-5);
       }
       g.stroke();
     }
     g.restore();
   }
 }else if(kind==='pods'||kind==='discs'){
   drawPlantBranches(g,r*.86,kind);
   for(let i=0;i<7;i++){
     const a=i*2.4,d=r*(.43+rand()*.4),x=Math.cos(a)*d,y=Math.sin(a)*d;
     if(kind==='pods'){
       g.save();g.translate(x,y);g.rotate(a);
       g.fillStyle='#214a68';g.beginPath();g.ellipse(0,0,11,6,0,0,Math.PI*2);g.fill();
       g.fillStyle='#61c4ed';g.beginPath();g.ellipse(1,-1,8,3.5,0,0,Math.PI*2);g.fill();
       plantDisc(g,4,-2,1.4,'#d8f9ff');g.restore();
     }else{
       plantDisc(g,x,y,12,'#413759');plantDisc(g,x-1,y-2,10,'#779cad');
       plantDisc(g,x-2,y-3,7,'#9bbfbc');plantDisc(g,x-1,y+6,2,'#ffd17e');
     }
   }
 }else if(kind==='flowers'){
   for(let i=0;i<14;i++){
     const a=i*2.4,d=r*rand(),x=Math.cos(a)*d,y=Math.sin(a)*d;
     plantDisc(g,x,y,2.4,i%2?'#b375aa':'#e9c988');plantDisc(g,x,y,1,'#efd987');
   }
 }
 plantCanopies.set(type,tile);
 return tile;
}

function beginPlantTransform(p){
 ctx.save();
 ctx.translate(p.x,p.y);ctx.rotate((p.rot||0)*Math.PI/2+(p.freeAngle||0));
 ctx.scale(p.scale||1,p.scale||1);
}

function drawPlantBase(p){
 const [, ,r,kind]=plantTypes.get(p.type);
 if(!plantTallKinds.has(kind))return;
 let layer=plantBases.get(p.type);
 if(!layer){
   layer=document.createElement('canvas');
   layer.width=layer.height=(r+14)*4;
   const g=layer.getContext('2d');
   g.translate(layer.width/2,layer.height/2);g.scale(2,2);
   g.fillStyle=kind==='winter'||kind==='dead'?'rgba(15,20,25,.18)':'rgba(15,20,25,.31)';
   g.beginPath();g.ellipse(8,9,r*.86,r*.66,.36,0,Math.PI*2);g.fill();
   drawPlantBranches(g,r,kind);
   plantBases.set(p.type,layer);
 }
 beginPlantTransform(p);
 const size=layer.width/2;
 ctx.drawImage(layer,-size/2,-size/2,size,size);
 ctx.restore();
}

function drawPlantCanopy(p,actor=null){
 const [, ,radius,kind]=plantTypes.get(p.type);
 if(kind==='dead'||kind==='winter')return;
 const actorUnderCanopy=plantTallKinds.has(kind)&&actor&&Math.hypot(actor.x-p.x,actor.y-p.y)<radius*.79*(p.scale||1);
 const sprite=illustratedCanopies.get(p.type);
 const hasArt=sprite!==undefined&&overheadCanopyArt.complete&&overheadCanopyArt.naturalWidth>0;
 const art=hasArt?overheadCanopyArt:makePlantCanopy(p.type);
 const size=hasArt?(radius+7)*2:art.width/2;
 const wind=ctx.canvas===canvas&&!terrainMotionPreference.matches?(state.windStrength??.35):0;
 const phase=performance.now()/1000*2+p.x*.055+p.y*.024;
 beginPlantTransform(p);
 if(actorUnderCanopy)ctx.globalAlpha*=.34;
 ctx.rotate(Math.sin(phase)*wind*.065);
 ctx.translate(Math.sin(phase)*wind*4,Math.cos(phase*.83)*wind*2);
 if(hasArt){
   const w=art.naturalWidth/3,h=art.naturalHeight/2;
   ctx.drawImage(art,(sprite%3)*w,Math.floor(sprite/3)*h,w,h,-size/2,-size/2,size,size);
   if(p.type==='fruitTree')for(const [x,y] of [[-13,-13],[10,-8],[7,10],[-14,7]])plantDisc(ctx,x,y,2.4,'#e97757');
 }else ctx.drawImage(art,-size/2,-size/2,size,size);
 ctx.restore();
}

function drawPlant(p){
 if(!plantTypes.has(p.type))return false;
 drawPlantBase(p);drawPlantCanopy(p);
 return true;
}

function initPlantCatalog(){
 overheadCanopyArt.addEventListener('load',()=>{
   for(const key of catalogThumbnailCache.keys()){
     if(illustratedCanopies.has(key.split(':')[1]))catalogThumbnailCache.delete(key);
   }
   if(architectCategory==='nature')renderArchitectLibrary();
 },{once:true});
 for(const [id,[label,zh]] of plantTypes)SITE_ZH.set(label,zh);
 SITE_ZH.set('Vento na vegetação','植被风力');
 SITE_ZH.set('Sem vento','无风');
 SITE_ZH.set('Brisa','微风');
 SITE_ZH.set('Vento forte','强风');
}
