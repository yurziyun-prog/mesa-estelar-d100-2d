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
function drawMesaCreature(g,design,stride,key,time=null){
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
 const sway=(phase,amount)=>time===null?0:Math.sin(time/880+seed%19+phase)*amount;
 const eye=(x,y)=>ellipse(x,y,1.45,1.6,'#ffd27f');
 g.save();
 g.translate(0,13*(1-scale));g.scale(scale,scale);
 if(key==='cila'){
   for(let i=0;i<6;i++){
     g.save();g.rotate(i*Math.PI/3-.14);
     const tip=sway(i*1.65,1.6);
     limb([[4,0],[10,-2],[17,tip*.5],[24,1+tip]],3.5);
     g.strokeStyle='#dbc09a70';g.lineWidth=.65;g.beginPath();
     g.moveTo(8,-1);g.quadraticCurveTo(15,-1,22,tip);g.stroke();
     ellipse(24,1+tip,3.3,2.2,'#866a4c');
     eye(25,tip);
     g.restore();
   }
   ellipse(0,0,9,7.4,'#906a62');
   ellipse(-2,-2,5.6,4,'#b48a74');
   for(const [x,y] of [[-4,-2],[0,-4],[3,0],[-1,3]])ellipse(x,y,1.05,.75,'#77554e');
 }else if(form==='slime'){
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
   const tail=sway(1,1.7);
   g.lineCap='round';g.beginPath();
   g.moveTo(-14,8+tail);g.bezierCurveTo(-4,21,18,9,8,1);
   g.bezierCurveTo(3,-4,-8,7,-8,0);g.quadraticCurveTo(-9,-6,-3,-10);
   g.strokeStyle='#27353c';g.lineWidth=6.7;g.stroke();
   g.strokeStyle=color;g.lineWidth=5.1;g.stroke();
   for(const [x,y] of [[-9,11],[-5,13],[0,13],[5,11],[9,7],[9,3],[-6,-2]])
     ellipse(x,y,1.1,.67,'#ffffff56',-.35);
   avatarShape(g,color,[[-7,-10],[-6,-14],[-1,-16],[3,-13],[2,-9],[-3,-7]]);
   eye(-4.5,-12);eye(.5,-12);
 }else if(key==='lagarto_de_galeria'||key==='predador_couracado'){
   limb([[1,9],[5,15],[13,19],[21,16]],4.2);
   for(const side of [-1,1])for(const y of [-3,6]){
     limb([[side*5,y],[side*10,y+2],[side*13,y+6+side*stride*.4]],3.2);
     ellipse(side*13,y+6+side*stride*.4,2.5,1.5,'#647459');
   }
   ellipse(0,3,8,11,color);
   for(const y of [-4,0,4,8])avatarShape(g,'#7f8860',[[-5,y],[-3,y-2],[3,y-2],[5,y],[0,y+2]]);
   avatarShape(g,'#8d936d',[[-6,-4],[-6,-10],[-3,-15],[4,-15],[7,-10],[5,-5]]);
   eye(-3.5,-10);eye(3.5,-10);
 }else if(form==='humanoid'){
   const infected=/errante_parasitado|carnical_dominante|inchado_pustulento/.test(key);
   const torso=infected?'#665349':color;
   if(infected){
     limb([[4,-6],[11,-12],[15,-8]],2.2);
     ellipse(10,-9,3.2,2.2,'#98685a',.5);
   }
   for(const side of [-1,1]){
     limb([[side*4,4],[side*6,10],[side*8,15+side*stride]],4);
     limb([[side*6,-6],[side*11,0],[side*13,7]],3.5);
   }
   avatarShape(g,torso,[[-8,-8],[8,-8],[6,3],[0,8],[-6,3]]);
   if(infected){
     avatarShape(g,'#b5886c',[[-3,-7],[3,-4],[2,1],[-3,4],[-4,0]]);
     ellipse(0,-12,5.6,5.5,'#aa9772',-.12);
   }else ellipse(0,-12,6,6,color);
   eye(-2.5,-13);eye(2.5,-13);
 }else if(form==='rock'){
   for(let i=-2;i<=2;i++)avatarShape(g,color,[[i*5-5,10],[i*6-1,-3-Math.abs(i-1)*3],[i*6+4,-6],[i*6+6,8],[i*5+3,14]]);
   eye(0,3);eye(5,3);
 }else{
   if(form==='winged')for(const side of [-1,1]){
     const tip=-13+sway(0,1.5);
     avatarShape(g,'#83a6a6b8',[[side*3,1],[side*10,-10],[side*20,tip],[side*16,-3],[side*20,5],[side*7,6]]);
     g.strokeStyle='#314a51';g.lineWidth=.75;g.beginPath();
     g.moveTo(side*5,1);g.quadraticCurveTo(side*12,-2,side*19,tip+1);
     g.moveTo(side*7,2);g.lineTo(side*18,4);g.stroke();
   }
   if(form==='reptile'||form==='beast')limb([[7,7],[14,11],[20,9]],3);
   const mechanical=key==='cao_de_sucata';
   const legCount=form==='insect'?3:form==='winged'?1:2;
   for(const side of [-1,1])for(let i=0;i<legCount;i++){
     const y=i*5;
     limb([[side*5,y],[side*(11+i),y-2],[side*(13+i),y+4+side*stride]],form==='insect'?1.8:3);
   }
   ellipse(0,5,form==='insect'?7:9,10,color);
   if(mechanical){
     avatarShape(g,'#7f9398',[[-6,1],[6,1],[7,8],[3,13],[-5,12]]);
     ellipse(0,6,2.4,1.5,'#7ed0c3');
   }else ellipse(-2,3,4,6,'#ffffff24',-.29);
   if(form==='insect'||form==='reptile')for(const y of [1,5,9]){
     g.strokeStyle='#26373a';g.beginPath();g.moveTo(-5,y);g.quadraticCurveTo(0,y+3,5,y);g.stroke();
   }
   if(mechanical){
     avatarShape(g,'#819093',[[-7,-6],[-5,-13],[4,-13],[7,-8],[4,-4],[-4,-4]]);
     avatarShape(g,'#465b61',[[-4,-9],[4,-9],[5,-13],[-4,-13]]);
   }else ellipse(0,-6,5.7,form==='reptile'?7:5.2,color);
   if(form==='insect'){
     g.strokeStyle='#d6d4ac50';g.lineWidth=.75;
     for(const y of [1,5,9]){g.beginPath();g.moveTo(-4,y);g.quadraticCurveTo(0,y+2,4,y);g.stroke();}
   }
   if(form==='beast'||form==='insect')for(const side of [-1,1])limb([[side*3,-8],[side*6,-14],[side*8,-13]],1.6);
   eye(-2.6,-8);eye(2.6,-8);
 }
 g.restore();
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
