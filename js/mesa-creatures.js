// Silhuetas originais, compartilhadas pelo mapa e pelo retrato do Mestre.
function mesaCreatureDesign(sheet,seed){
 const name=String(sheet.nome).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const species=String(sheet.especie||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const text=name+' '+species;
 const form=/enxame/.test(text)?'swarm':/limo|amorfo/.test(text)?'slime':
   /serpente|serpentiforme/.test(text)?'serpent':/macaco|carnical|parasitado|sentinela|pustulento/.test(text)?'humanoid':
   /mariposa|vespa|alado|pterodatil|galinha/.test(text)?'winged':
   /inset|artr|carrapato|hexapode|carapaca/.test(text)?'insect':
   /cila|litofilo/.test(text)?'rock':/dragao|trombet|lagarto|reptil/.test(text)?'reptile':'beast';
 const scale={'Minúsculo':.65,Pequeno:.82,Grande:1.16,Enorme:1.28,'Titânico':1.4}[sheet.tamanho]||1;
 const palette=['#6c825e','#587b87','#896b5b','#82748d','#a18452','#587268'];
 return {form,scale,seed,color:palette[seed%palette.length]};
}
function drawMesaCreature(g,design,stride){
 const {form,scale,seed,color}=design;
 const ellipse=(x,y,rx,ry,fill,angle=0)=>{
   g.fillStyle=fill;g.strokeStyle='#212b32';g.lineWidth=.9;
   g.beginPath();g.ellipse(x,y,rx,ry,angle,0,Math.PI*2);g.fill();g.stroke();
 };
 const limb=(points,width=3)=>{
   g.strokeStyle='#27353c';g.lineWidth=width+1;g.lineCap='round';g.lineJoin='round';
   g.beginPath();g.moveTo(...points[0]);for(const point of points.slice(1))g.lineTo(...point);g.stroke();
   g.strokeStyle=color;g.lineWidth=width;g.stroke();
 };
 const eye=(x,y)=>ellipse(x,y,1.45,1.6,'#ffd27f');
 g.save();
 g.translate(0,13*(1-scale));g.scale(scale,scale);
 if(form==='slime'){
   ellipse(0,5,16,9,color);
   ellipse(-5,0,7,5,color);ellipse(6,2,7,6,color);
   ellipse(-5,0,2,1,'#b6dcc599');ellipse(5,5,3,2,'#b6dcc599');
 }else if(form==='swarm'){
   for(let i=0;i<9;i++){
     const angle=i*2.4+seed%5;
     const x=Math.cos(angle)*(5+i),y=Math.sin(angle)*(3+i*.65)+4;
     ellipse(x,y,2.6,1.8,color,angle);
   }
 }else if(form==='serpent'){
   limb([[-13,8],[-6,13],[5,11],[10,4],[5,-1],[-4,2],[-7,-3],[-3,-9]],5);
   ellipse(-3,-10,4.8,5,color);eye(-5,-11);eye(-1,-11);
 }else if(form==='humanoid'){
   for(const side of [-1,1]){
     limb([[side*4,4],[side*6,10],[side*8,15+side*stride]],4);
     limb([[side*6,-6],[side*11,0],[side*13,7]],3.5);
   }
   avatarShape(g,color,[[-8,-8],[8,-8],[6,3],[0,8],[-6,3]]);
   ellipse(0,-12,6,6,color);eye(-2.5,-13);eye(2.5,-13);
 }else if(form==='rock'){
   for(let i=-2;i<=2;i++)avatarShape(g,color,[[i*5-5,10],[i*6-1,-3-Math.abs(i-1)*3],[i*6+4,-6],[i*6+6,8],[i*5+3,14]]);
   eye(0,3);eye(5,3);
 }else{
   if(form==='winged')for(const side of [-1,1]){
     avatarShape(g,'#697d8b',[[side*3,1],[side*10,-10],[side*20,-13],[side*16,-3],[side*20,5],[side*7,6]]);
   }
   if(form==='reptile'||form==='beast')limb([[7,7],[14,11],[20,9]],3);
   const legCount=form==='insect'?3:form==='winged'?1:2;
   for(const side of [-1,1])for(let i=0;i<legCount;i++){
     const y=i*5;
     limb([[side*5,y],[side*(11+i),y-2],[side*(13+i),y+4+side*stride]],form==='insect'?1.8:3);
   }
   ellipse(0,5,form==='insect'?7:9,10,color);
   if(form==='insect'||form==='reptile')for(const y of [1,5,9]){
     g.strokeStyle='#26373a';g.beginPath();g.moveTo(-5,y);g.quadraticCurveTo(0,y+3,5,y);g.stroke();
   }
   ellipse(0,-6,5.7,form==='reptile'?7:5.2,color);
   if(form==='beast'||form==='insect')for(const side of [-1,1])limb([[side*3,-8],[side*6,-14],[side*8,-13]],1.6);
   eye(-2.6,-8);eye(2.6,-8);
 }
 g.restore();
}


const creatureImages=new Map();
function creatureAsset(filename){
 if(!creatureImages.has(filename)){
   const image=new Image();image.src='assets/creatures/'+filename;
   creatureImages.set(filename,image);
 }
 const image=creatureImages.get(filename);
 return image.complete&&image.naturalWidth?image:null;
}
function creatureArtKey(ent){
 return (ent.mesaSourceSheet?.nome||ent.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
   .toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
}

function creatureMapWidth(ent){
 const scale=ent.creature?.scale||1;
 return (creatureArtKey(ent)==='cila'?60:52)*scale;
}

function drawCreatureGroundShadow(g,ent,x,y,lift){
 const width=creatureMapWidth(ent);
 const radial=creatureArtKey(ent)==='cila';
 const yOffset=radial?2:6;
 const alpha=Math.max(.13,.46-Math.max(0,lift)*.015);
 g.save();
 g.translate(x+width*.035,y+yOffset);
 g.scale(width*(radial?.36:.39),width*(radial?.33:.22));
 const gradient=g.createRadialGradient(0,0,.15,0,0,1);
 gradient.addColorStop(0,'rgba(19,24,14,'+alpha+')');
 gradient.addColorStop(.54,'rgba(19,24,14,'+alpha*.54+')');
 gradient.addColorStop(1,'rgba(19,24,14,0)');
 g.fillStyle=gradient;
 g.beginPath();g.arc(0,0,1,0,Math.PI*2);g.fill();
 g.restore();
}

function drawOriginalMesaCreature(g,ent){
 const name=creatureArtKey(ent);
 const filename=Object.hasOwn(mesaCreatureArt,name)?mesaCreatureArt[name]:null;
 if(!filename)return false;
 const time=performance.now();
 const walking=ent.hp!==0&&!terrainMotionPreference.matches&&entityIsWalking(ent,time);
 const width=creatureMapWidth(ent);
 const motion=Object.hasOwn(mesaCreatureMotion,name)?mesaCreatureMotion[name]:null;
 if(motion){
   const [sheet,,walkFrames]=motion;
   const image=creatureAsset(sheet);
   if(image){
     const frame=walking?Math.floor(time/95)%walkFrames:0;
     g.save();
     g.filter='saturate(.91) contrast(1.08)';
     g.drawImage(image,frame*96,walking?96:0,96,96,-width/2,-width/2,width,width);
     g.restore();
     return true;
   }
 }
 const image=creatureAsset(filename);
 if(!image)return false;
 const height=width*image.naturalHeight/image.naturalWidth;
 g.drawImage(image,-width/2,-height/2,width,height);
 return true;
}
