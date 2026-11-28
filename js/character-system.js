const legacyCharacterItems={
 'Espada Curta':{slot:'hand'},'Lança':{slot:'hand'},'Cajado Arcano':{slot:'hand'},'Pistola':{slot:'hand'},
 'Espada':{slot:'hand'},'Cajado':{slot:'hand'},'Arco':{slot:'hand'},'Escudo':{slot:'hand'},
 'Gorro de viagem':{slot:'head'},'Casaco de viagem':{slot:'body',color:'#577282'},
 'Colete de couro':{slot:'body',color:'#76543e'},'Botas':{slot:'feet'},
 'Lanterna de Óleo':{slot:'light',use:'light'},
 'Ração':{use:'food'},'Poção':{use:'heal'}
};
const characterSlots={head:'Cabeça',body:'Tronco',feet:'Pés',hand:'Mão',light:'Luz',waist:'Cintura'};
const characterItems=Object.assign(Object.create(null),legacyCharacterItems);
for(const data of mesaItemCatalog){
 const {id,categoria}=data;
 const slot=categoria==='Armas'?'hand':id==='lanterna'?'light':
   /capacete|chapeu/.test(id)?'head':id==='botas_couro'?'feet':id==='cinto_utilitario'?'waist':
   ['Armaduras','Roupas'].includes(categoria)?'body':null;
 const color={armadura_leve:'#70849a',armadura_militar:'#54664d',biomesh:'#496a70',
   biomesh_leve:'#626d8a',capa_viajante:'#465e45',roupa_viajante:'#936c49',coleto_balistico:'#454b52'}[id]
   ||(categoria==='Armaduras'?'#70849a':'#8b6853');
 characterItems[data.nome]={data,slot,color,armor:categoria==='Armaduras',
   use:id==='lanterna'?'light':/^racao/.test(id)?'food':null};
}
function characterItemName(name){
 return siteLanguage==='zh-CN'&&characterItems[name]?.data?.nome_zh||translateSiteText(name);
}

const avatarDefaults={body:'balanced',helmet:'none',helmetColor:'#4f6075',hairStyle:'short',hair:'#62442a',eyes:'#292229',skin:'#e6b48d',clothing:'#688aab'};
let editedCharacterId=null;
let characterEditorMap=null;

function characterIdentity(ent){
 const saved=ent.species||'Humano';
 const key=saved.trim().toLowerCase();
 const legacyForm=ent.appearance?.form;
 const species=legacyForm==='dragon'?'Dracônico':legacyForm==='crocodile'?'Crocodiliano':
   key==='humana'?'Humano':key==='grey'?'Grey Alto':saved;
 const sex=ent.sex||(key==='humana'?'Feminino':'');
 return {species,sex};
}

function characterAppearance(ent){
 const {form:legacyForm,...appearance}=ent.appearance||{};
 const form=characterVisualForm(characterIdentity(ent).species);
 const skin={dragon:'#a47953',crocodile:'#637e52',robot:'#8296aa'}[form]||avatarDefaults.skin;
 return {...avatarDefaults,skin,clothing:ent.color||avatarDefaults.clothing,...appearance};
}

function characterVisualForm(species){
 return characterSpecies.find(([name])=>name===species)?.[2]||'human';
}

function characterAnatomy(ent,a){
 const {species,sex}=characterIdentity(ent);
 const form=characterVisualForm(species);
 const height=species==='Grey Alto'?1.23:species==='Grey Pequeno'?.78:
   form==='zutariano'?.86:form==='dragon'?1.13:1;
 const build=a.body==='slim'?-2:a.body==='broad'?2.5:0;
 const shoulders=11+build+(sex==='Feminino'?-1:sex==='Masculino'?1:0);
 const hips=8.6+build+(sex==='Feminino'?1.8:sex==='Masculino'?-0.5:0);
 const waist=7.7+build+(sex==='Feminino'?-.55:0);
 return {form,sex,height,shoulders,hips,waist,arms:form==='insect'?4:2};
}

function avatarShape(g,color,points){
 g.fillStyle=color;g.strokeStyle='#202935';g.lineWidth=1.1;
 g.beginPath();g.moveTo(...points[0]);
 for(const point of points.slice(1))g.lineTo(...point);
 g.closePath();g.fill();g.stroke();
}

function professionOutfit(role){
 const title=String(role||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 if(/polic|militar|guarda|xerife|marechal|mercenar|assass/.test(title))return 'uniform';
 if(/medic|curand|quim|cient|bio|alquim|veterin/.test(title))return 'clinic';
 if(/sacerd|monge|mission|psiqu/.test(title))return 'robe';
 if(/engenh|mecan|ferrei|minera|eletric|operar|tecnic|cozinh|gari/.test(title))return 'work';
 if(/explor|cacad|arqueo|marinh|pirata|pesc|piloto|lenhad|colono/.test(title))return 'travel';
 if(/advog|diplom|bancar|comerci|administ|polit|profess|juiz|acad/.test(title))return 'formal';
 return 'casual';
}

function drawProfessionDetails(g,outfit,half,hips){
 const line=(color,width,points)=>{
   g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(...points[0]);
   for(const p of points.slice(1))g.lineTo(...p);
   g.stroke();
 };
 if(outfit==='uniform'){
   for(const side of [-1,1])line('#b5bec5',2,[[side*half,-6],[side*5,-8]]);
   g.fillStyle='#dfbc68';g.beginPath();g.arc(4,-2,1.4,0,Math.PI*2);g.fill();
 }else if(outfit==='clinic'||outfit==='formal'){
   const trim=outfit==='clinic'?'#d8deda':'#ccc2a2';
   for(const side of [-1,1])line(trim,1.4,[[side*5,-8],[side*2,-2],[0,2]]);
   line('rgba(10,19,26,.7)',1.1,[[0,2],[0,6]]);
   if(outfit==='clinic')line('#d8deda',1.6,[[3,0],[7,0],[7,3],[3,3]]);
 }else if(outfit==='work'||outfit==='travel'){
   line('#8a6746',2.6,[[-half+2,-7],[1,-.8],[hips-1,7]]);
   g.fillStyle='#9c7951';g.beginPath();g.roundRect(-hips,3,5,5,1);g.fill();
 }else if(outfit==='robe'){
   line('#c7ad72',2.3,[[-half+1,-5],[-4,-2],[4,-2],[half-1,-5]]);
   line('#c7ad72',1.8,[[0,-1],[0,7]]);
 }
}

function avatarShading(g,color,x,y,w,h){
 const gradient=g.createLinearGradient(x,y,x+w,y+h);
 gradient.addColorStop(0,'#ffffff32');
 gradient.addColorStop(.45,'#ffffff00');
 gradient.addColorStop(1,'#0f172a6a');
 g.save();
 g.clip();
 g.fillStyle=color;
 g.fillRect(x,y,w,h);
 g.fillStyle=gradient;
 g.fillRect(x,y,w,h);
 g.restore();
}

function drawScaledAvatarHead(g,a,form,cap,sex){
 const crocodile=form==='crocodile';
 const female=sex==='Feminino';
 if(crocodile){
   // Três quartos: crânio baixo, focinho comprido e mandíbula em um plano separado.
   avatarShape(g,a.skin,[[-10,-16],[-7,-22],[1,-22],[6,-18],[11,-15],[19,-15],[22,-12],[21,-8],
     [16,-5],[7,-4],[-1,-5],[-8,-9]]);
   avatarShape(g,'#a8ad83',[[-3,-10],[5,-9],[15,-9],[21,-11],[20,-7],[15,-5],[6,-4],[1,-6]]);
   g.strokeStyle='#293932';g.lineWidth=.85;g.beginPath();
   g.moveTo(-3,-11);g.bezierCurveTo(5,-8,14,-11,21,-11);g.stroke();
   g.fillStyle='#e8dfb5';
   for(const [x,y] of [[4,-9.6],[8,-9.9],[13,-10.3],[17,-10.7]]){
     g.beginPath();g.moveTo(x,y);g.lineTo(x+1.4,y-.25);g.lineTo(x+.6,y+1.6);g.fill();
   }
 }else{
   // Os chifres seguem para trás. O focinho tem dois planos de escamas, sem linha escura sob o queixo.
   const width=female?8:10;
   for(const side of [-1,1]){
     avatarShape(g,'#b9a383',[[side*5,-20],[side*8,-25],[side*15,-28],[side*11,-22],[side*width,-17]]);
     avatarShape(g,a.skin,[[side*(width-1),-17],[side*(width+5),-20],[side*(width+2),-12],[side*(width-1),-10]]);
   }
   avatarShape(g,a.skin,[[-width,-17],[-5,-23],[3,-23],[width,-19],[width+1,-14],[7,-9],[4,-5],[-2,-5],[-7,-9]]);
   avatarShape(g,'#c8a77e',[[-5,-10],[1,-11],[8,-10],[8,-7],[4,-5],[-2,-5],[-5,-7]]);
   g.fillStyle='#e3c295';g.beginPath();g.ellipse(2,-10,5,1.7,-.16,0,Math.PI*2);g.fill();
   g.strokeStyle='#75563f';g.lineWidth=.6;g.beginPath();
   g.moveTo(-4,-8);g.quadraticCurveTo(2,-6.8,7,-8.5);g.stroke();
 }
 const eyes=crocodile?[[-5,-17],[5,-16.7]]:female?[[-4.2,-15.7],[4.7,-15.6]]:[[-5,-16],[5,-16]];
 for(const [x,y] of eyes){
   g.fillStyle='#32413b';g.beginPath();g.ellipse(x,y,2.5,1.4,-.16,0,Math.PI*2);g.fill();
   g.fillStyle='#e8bf75';g.beginPath();g.ellipse(x,y,1.85,1,-.16,0,Math.PI*2);g.fill();
   g.fillStyle=a.eyes;g.fillRect(x-.33,y-.85,.66,1.6);
 }
 g.fillStyle='#293b34';
 for(const [x,y] of crocodile?[[16,-13],[19,-13]]:[[1,-10.8],[4,-11]])g.fillRect(x,y,1.16,.73);
 g.fillStyle='#ffffff41';
 for(const [x,y] of [[-6,-19],[-2,-21],[2,-20],[7,-13],[11,-13]])g.fillRect(x,y,1.6,.7);
 if(cap)avatarShape(g,'#6b513b',[[-11,-20],[-7,-23],[-5,-25],[5,-25],[8,-22],[12,-20],[7,-19],[-9,-19]]);
}

function drawScaledAvatarBack(g,a,form,cloth){
 const crocodile=form==='crocodile';
 avatarShape(g,a.skin,crocodile?[[4,6],[14,9],[21,14],[26,13],[23,18],[16,19],[6,15]]
   :[[4,8],[12,12],[21,16],[25,12],[23,18],[15,20],[5,14]]);
 for(const [x,y] of [[13,10],[17,12],[21,14]]){
   avatarShape(g,'#47514b',[[x-2,y+1],[x,y-2],[x+2,y+2]]);
 }
 if(form==='dragon')for(const side of [-1,1]){
   const wing=[[side*5,4],[side*10,-10],[side*21,-21],[side*25,-15],[side*22,1],
     [side*20,10],[side*17,4],[side*12,8],[side*10,3]];
   avatarShape(g,cloth,wing);
   g.strokeStyle='#26343c';g.lineWidth=1.15;g.beginPath();
   g.moveTo(side*6,3);g.lineTo(side*21,-20);g.lineTo(side*20,9);
   g.moveTo(side*19,-16);g.lineTo(side*12,7);g.stroke();
 }
}

function drawAvatarHead(g,a,form,cap,sex){
 if(a.helmet!=='none'){
   avatarShape(g,a.helmetColor,[[-10,-19],[-5,-24],[5,-24],[10,-19],[11,-9],[7,-3],[-7,-3],[-11,-9]]);
   g.fillStyle='#121b27';g.fillRect(-8,-16,16,5);
   g.fillStyle=a.helmet==='visor'?a.eyes:'#8b9eb0';g.fillRect(-6,-15,12,1.5);
   g.fillStyle='rgba(255,255,255,.3)';g.fillRect(-4,-22,8,1);
   if(a.helmet==='closed')g.fillRect(-1,-10,2,5);
   return;
 }
 if(form==='dragon'||form==='crocodile'){
   drawScaledAvatarHead(g,a,form,cap,sex);
   return;
 }
 if(form==='reptilian'||form==='thalassian'){
   const snout=form==='reptilian'?-2:-4;
   if(form==='thalassian'){
     avatarShape(g,a.skin,[[-5,-17],[-15,-19],[-9,-6]]);
     avatarShape(g,a.skin,[[5,-17],[15,-19],[9,-6]]);
   }
   avatarShape(g,a.skin,[[-9,-17],[-5,-21],[5,-21],[9,-17],[7,-10],[7,snout],[-7,snout],[-7,-10]]);
   g.fillStyle='rgba(24,30,32,.57)';
   g.fillRect(-5,snout-2,10,1);g.fillRect(-4,snout-6,1.5,1.5);g.fillRect(2.5,snout-6,1.5,1.5);
 }else if(form==='insect'){
   for(const side of [-1,1]){
     g.strokeStyle='#202935';g.lineWidth=2.6;g.beginPath();
     g.moveTo(side*3,-20);g.quadraticCurveTo(side*7,-30,side*14,-28);g.stroke();
     g.strokeStyle=a.skin;g.lineWidth=1.15;g.stroke();
   }
   avatarShape(g,a.skin,[[-9,-17],[-5,-22],[5,-22],[9,-17],[7,-10],[3,-7],[-3,-7],[-7,-10]]);
   for(const side of [-1,1]){
     g.fillStyle='#121825';g.beginPath();g.ellipse(side*5.7,-16,3.65,4.35,side*.38,0,Math.PI*2);g.fill();
     g.fillStyle=a.eyes;g.beginPath();g.ellipse(side*6.7,-17.5,1.5,2.1,side*.38,0,Math.PI*2);g.fill();
     g.fillStyle='#ffffffa0';g.fillRect(side*6.7-.35,-18.4,.7,1.2);
     avatarShape(g,a.skin,[[side*6,-12],[side*7,-8],[side*2,-4],[side*3,-9]]);
   }
   if(cap)avatarShape(g,'#67513e',[[-8,-20],[-4,-23],[5,-23],[9,-20]]);
   return;
 }else if(form==='robot'){
   avatarShape(g,'#4c5d70',[[-11,-17],[-9,-20],[9,-20],[11,-17],[11,-10],[8,-5],[-8,-5],[-11,-10]]);
   avatarShape(g,a.skin,[[-8,-19],[-5,-23],[5,-23],[8,-19],[8,-10],[5,-6],[-5,-6],[-8,-10]]);
   avatarShape(g,'#253747',[[-7,-17],[-4,-19],[4,-19],[7,-17],[5,-12],[-5,-12]]);
   g.fillStyle='#80e3da';g.fillRect(-5,-16,10,1.7);
   g.fillStyle='#516273';for(const x of [-4,-1,2])g.fillRect(x,-9,1.1,2);
   g.fillStyle='#bfcbd7';g.fillRect(-4,-21,8,.8);
   return;
 }else{
   if(form==='nymari'||form==='aeral'){
     avatarShape(g,a.skin,[[-8,-15],[-14,-20],[-10,-10],[-7,-9]]);
     avatarShape(g,a.skin,[[8,-15],[14,-20],[10,-10],[7,-9]]);
   }
   const large=form==='grey'||form==='arisian';
   const faceWidth=large?11:sex==='Feminino'?7.6:8.35;
   const jaw=sex==='Feminino'?faceWidth*.67:faceWidth*.80;
   g.strokeStyle='#28323b';g.lineWidth=.85;
   g.beginPath();
   g.moveTo(-faceWidth,-14);
   g.bezierCurveTo(-faceWidth,-26,faceWidth,-26,faceWidth,-14);
   g.quadraticCurveTo(faceWidth,-7.2,jaw,-5.8);
   g.quadraticCurveTo(0,-2.3,-jaw,-5.8);
   g.quadraticCurveTo(-faceWidth,-7.2,-faceWidth,-14);
   g.closePath();
   avatarShading(g,a.skin,-faceWidth-1,-25,2*faceWidth+2,25);
   g.stroke();
   if(!large&&(a.hairStyle!=='shaved'||cap)){
     g.fillStyle=cap?'#ad9261':a.hair;
     g.beginPath();g.moveTo(-faceWidth,-13);
     g.bezierCurveTo(-faceWidth-1,-25,faceWidth-1,-26,faceWidth+.5,-15);
     g.quadraticCurveTo(faceWidth*.32,-17.5,-.8,-19.5);
     g.quadraticCurveTo(-faceWidth*.45,-15.2,-faceWidth,-13);g.fill();
     g.strokeStyle='rgba(245,219,182,.24)';g.lineWidth=.65;
     for(let i=0;i<3;i++){
       g.beginPath();g.moveTo(-faceWidth+2+i*2,-17.5-i);
       g.quadraticCurveTo(-2+i,-23,3+i,-21);g.stroke();
     }
   }
   g.fillStyle='rgba(122,72,60,.23)';
   for(const side of [-1,1]){
     g.beginPath();g.ellipse(side*5,-9.3,1.85,1.1,0,0,Math.PI*2);g.fill();
   }
   g.strokeStyle='rgba(80,47,42,.69)';g.lineWidth=.63;
   g.beginPath();g.moveTo(.2,-13);g.quadraticCurveTo(.3,-11,1.2,-10.2);g.quadraticCurveTo(.2,-9.4,-1,-9.9);g.stroke();
   g.strokeStyle='rgba(93,48,47,.76)';
   g.beginPath();g.moveTo(-2.4,-7.5);g.quadraticCurveTo(0,-6.7,2.4,-7.5);g.stroke();
   g.fillStyle='rgba(255,227,197,.40)';
   g.fillRect(-.7,-12.2,.7,1.7);
   if(form==='grey'){
     g.fillStyle=a.eyes;
     for(const x of [-5,5]){g.beginPath();g.ellipse(x,-14,3,2,.3,0,Math.PI*2);g.fill();}
     return;
   }
 }
 for(const side of [-1,1]){
   g.fillStyle='#eee4d1';
   g.beginPath();g.ellipse(side*3.5,-13,1.8,1.0,0,0,Math.PI*2);g.fill();
   g.fillStyle=a.eyes;g.beginPath();g.arc(side*3.5,-13,.83,0,Math.PI*2);g.fill();
   g.fillStyle='#fff3d8';g.fillRect(side*3.7-.45,-13.46,.38,.38);
   g.strokeStyle='rgba(28,20,23,.68)';g.lineWidth=.6;
   g.beginPath();g.moveTo(side*1.9,-15.1);g.quadraticCurveTo(side*3.7,-15.8,side*5.5,-15.05);g.stroke();
 }
}

function drawInsectBody(g,a,ent,half,hips,cloth,stride){
 const equipped=ent.equipment||{};
 const limb=(points,width)=>{
   g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(...points[0]);
   for(const point of points.slice(1))g.lineTo(...point);
   g.strokeStyle='#202935';g.lineWidth=width+1.8;g.stroke();
   g.strokeStyle=a.skin;g.lineWidth=width;g.stroke();
 };
 // Abdômen em placas, visível atrás do tronco.
 avatarShape(g,a.skin,[[2,2],[11,5],[17,13],[18,19],[13,19],[6,14],[1,7]]);
 g.strokeStyle='#202935';g.lineWidth=.9;
 for(const [x,y] of [[8,11],[11,14],[14,17]]){
   g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+3,y-1,x+4,y-3);g.stroke();
 }
 for(const side of [-1,1]){
   const lift=side*stride;
   limb([[side*hips*.44,7],[side*(hips*.65+1),13],[side*hips*.6,17+lift]],3.8);
   if(equipped.feet)avatarShape(g,'#664937',[[side*(hips*.6-2),15+lift],[side*(hips*.6+2),15+lift],[side*(hips*.6+3),19+lift],[side*(hips*.6-1),19+lift]]);
   else for(const toe of [-1,1])limb([[side*hips*.6,17+lift],[side*hips*.6+toe*2.8,19+lift]],1.3);
   for(const [root,elbow,tip] of [[-6,-4,-9],[0,6,11]]){
     const x=side*(half+4),y=tip+lift;
     limb([[side*(half-2),root],[side*(half+3),elbow],[x,y]],3.5);
     avatarShape(g,a.skin,[[side*(half+1),elbow-2],[side*(half+5),elbow-1],[x,y],[side*(half+2),elbow+2]]);
     limb([[x,y],[x+side*2.5,y-1],[x+side*2,y-3]],1.2);
     limb([[x,y],[x+side*2.5,y+1]],1.2);
   }
 }
 avatarShape(g,cloth,[[-half+1,-7],[-5,-11],[5,-11],[half-1,-7],[hips-2,1],[hips-1,8],[0,12],[-hips+1,8],[-hips+2,1]]);
 for(const [y,w] of [[-5,half-2],[-1,hips-1],[3,hips-2],[7,hips-2]]){
   g.strokeStyle='#202935b0';g.lineWidth=1.05;g.beginPath();
   g.moveTo(-w,y);g.quadraticCurveTo(0,y+4,w,y);g.stroke();
 }
 if(equipped.body)for(const side of [-1,1]){
   avatarShape(g,cloth,[[side*5,-10],[side*(half+1),-10],[side*(half+2),-6],[side*6,-5]]);
 }
 if(equipped.waist){g.fillStyle='#ced5df';g.fillRect(-2,6,4,3);}
}

function drawCharacterAppearance(g,ent,stride=0){
 if(ent.creature){drawMesaCreature(g,ent.creature,stride);return;}
 const a=characterAppearance(ent);
 const {form,sex,height,shoulders:half,hips,waist,arms}=characterAnatomy(ent,a);
 const equipped=ent.equipment||{};
 const cloth=characterItems[equipped.body]?.color||a.clothing;
 const outfit=equipped.body?(characterItems[equipped.body]?.armor?'uniform':'travel'):professionOutfit(ent.role);
 g.save();
 g.translate(0,18*(1-height));g.scale(1,height);
 if(form==='insect')drawInsectBody(g,a,ent,half,hips,cloth,stride);
 else{
 if(form==='dragon'||form==='crocodile')drawScaledAvatarBack(g,a,form,cloth);
 else if(form==='reptilian'){
   g.strokeStyle=a.skin;g.lineWidth=4;g.lineCap='round';g.beginPath();
   g.moveTo(7,10);g.quadraticCurveTo(19,23,23,14);g.stroke();
 }
 const scaled=form==='dragon'||form==='crocodile';
 const mechanical=form==='robot';
 const leg=mechanical?'#566b7e':scaled?a.skin:'#353e4e';
 const boots=equipped.feet?'#664937':mechanical?'#394756':scaled?a.skin:'#242a36';
 g.lineCap='round';
 for(const side of [-1,1]){
   const lift=side*stride;
   g.strokeStyle=leg;g.lineWidth=5.7;g.beginPath();
   g.moveTo(side*hips*.48,8);g.quadraticCurveTo(side*hips*.53,12,side*hips*.60,16+lift);g.stroke();
   g.strokeStyle=boots;g.lineWidth=5.1;g.beginPath();
   g.moveTo(side*hips*.60,15+lift);g.lineTo(side*hips*.65,18+lift);g.stroke();
   if(scaled&&!equipped.feet){
     const toe=side*hips*.65;
     for(const offset of [-1.8,0,1.8])avatarShape(g,'#d3c09d',[[toe+offset-.6,17+lift],[toe+offset+.6,17+lift],[toe+offset,20+lift]]);
   }
   if(mechanical){
     g.fillStyle='#a2b7c7';g.fillRect(side*hips*.53-1.8,11+lift,3.6,1.6);
   }
 }
 if(a.hairStyle==='long'&&a.helmet==='none'&&['human','nymari','aeral','zutariano'].includes(form)){
   g.fillStyle=a.hair;g.beginPath();g.ellipse(0,-12,10,13,0,0,Math.PI*2);g.fill();
 }
 for(let pair=0;pair<arms/2;pair++){
   for(const side of [-1,1]){
     const bend=pair?7:4,root=pair?0:-6;
     const handX=side*(half+bend),handY=(pair?13:7)+side*stride;
     g.strokeStyle=pair?a.skin:cloth;g.lineWidth=pair?3.8:5.1;
     g.beginPath();g.moveTo(side*(half-1),root);
     g.quadraticCurveTo(side*(half+bend+1),root+5,handX,handY);g.stroke();
     if(mechanical)avatarShape(g,'#99adbd',[[handX-2.2,handY-2],[handX+2.2,handY-2],[handX+2.5,handY+2],[handX-1.8,handY+3]]);
     else{
       g.fillStyle=a.skin;g.beginPath();g.ellipse(handX,handY,2.15,2.8,-side*.22,0,Math.PI*2);g.fill();
       if(scaled)for(const offset of [-1,1])avatarShape(g,'#d3c09d',[[handX+offset-.5,handY+1.7],[handX+offset+.5,handY+1.7],[handX+offset,handY+3.7]]);
     }
   }
 }
 g.fillStyle=cloth;g.strokeStyle='#202935';g.lineWidth=1.3;
 g.beginPath();g.moveTo(-half,-6);
 g.quadraticCurveTo(-half,-11,-4,-10);
 g.quadraticCurveTo(0,-7,4,-10);
 g.quadraticCurveTo(half,-11,half,-6);
 g.bezierCurveTo(half,-2,waist,1,hips,8);
 g.quadraticCurveTo(hips*.7,13,0,12);
 g.quadraticCurveTo(-hips*.7,13,-hips,8);
 g.bezierCurveTo(-waist,1,-half,-2,-half,-6);g.closePath();
 avatarShading(g,cloth,-half-1,-11,half*2+2,25);
 g.stroke();
 g.strokeStyle='rgba(29,26,35,.42)';g.lineWidth=.7;
 for(const side of [-1,1]){
   g.beginPath();g.moveTo(side*(half-1.8),-3.5);
   g.quadraticCurveTo(side*(waist-1),.6,side*(hips-1.5),5);g.stroke();
 }
 g.strokeStyle='rgba(236,220,201,.27)';g.lineWidth=.75;
 g.beginPath();g.moveTo(-hips+2,10.2);g.quadraticCurveTo(0,12,hips-2,10.2);g.stroke();
 drawProfessionDetails(g,outfit,half,hips);
 if(mechanical){
   avatarShape(g,'#566d80',[[-6,-6],[6,-6],[5,0],[0,3],[-5,0]]);
   g.fillStyle='#87ddd7';g.fillRect(-2,-3,4,1.5);
 }
 g.strokeStyle='rgba(232,217,204,.35)';g.lineWidth=1;
 g.beginPath();g.moveTo(-4,-7);g.quadraticCurveTo(0,-3,4,-7);g.stroke();
 g.strokeStyle='rgba(18,23,32,.60)';g.lineWidth=2.3;
 g.beginPath();g.moveTo(-hips+1,7);g.quadraticCurveTo(0,9,hips-1,7);g.stroke();
 g.fillStyle=equipped.waist?'#ced5df':'#bd9e6e';g.fillRect(-1.8,6.6,equipped.waist?5:3.6,3);
 }
 const helmet=characterItems[equipped.head];
 const headAppearance=helmet?.armor&&a.helmet==='none'?{...a,helmet:'visor',helmetColor:helmet.color}:a;
 drawAvatarHead(g,headAppearance,form,equipped.head,sex);
 if(equipped.hand)drawCharacterHeldItem(g,equipped.hand,half+4,(form==='insect'?11:8)+stride);
 if(equipped.light){
   g.fillStyle=ent.lanternLit?'#ffdf9b':'#655846';g.fillRect(-half-10,8-stride,6,8);
 }
 g.restore();
}

function characterHandStyle(name){
 const data=characterItems[name]?.data;
 const key=(data?.id||name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/escudo/.test(key))return 'shield';
 if(/arco/.test(key))return 'bow';
 if(/lanca|cajado/.test(key)&&data?.plataforma!=='distancia')return 'staff';
 if(/pistola|rifle|carabina|revolver|blaster|escopeta|fuzil|gauss|canhao/.test(key)||data?.municoesCompativeis)return 'gun';
 return 'blade';
}
function drawCharacterHeldItem(g,name,x,y){
 g.save();
 g.translate(x,y);
 g.rotate(.13);
 const style=characterHandStyle(name);
 if(style==='shield'){
   avatarShape(g,'#748b9c',[[-7,-8],[7,-8],[6,1],[0,7],[-6,1]]);
 }else if(style==='gun'){
   avatarShape(g,'#435366',[[-3,3],[-3,-5],[-1,-5],[-1,-15],[3,-15],[3,0],[1,0],[1,3]]);
 }else if(style==='bow'){
   g.strokeStyle='#bfa278';g.lineWidth=2;
   g.beginPath();g.moveTo(-2,-15);g.quadraticCurveTo(12,-3,-2,9);g.closePath();g.stroke();
 }else if(style==='staff'){
   g.strokeStyle='#aa784f';g.lineWidth=2.5;
   g.beginPath();g.moveTo(0,10);g.lineTo(0,-20);g.stroke();
   g.fillStyle='#b6d6bc';g.fillRect(-2,-21,4,4);
 }else{
   avatarShape(g,'#c3d2dc',[[-2,-4],[-2,-15],[0,-19],[2,-15],[2,-4]]);
   g.fillStyle='#b29456';g.fillRect(-4,-4,8,2);
 }
 g.restore();
}

function drawCharacterPortrait(id,ent){
 const picture=document.getElementById(id),g=picture.getContext('2d');
 g.clearRect(0,0,picture.width,picture.height);
 const light=g.createRadialGradient(picture.width*.47,picture.height*.38,4,
   picture.width*.52,picture.height*.55,picture.width*.62);
 light.addColorStop(0,'#3b5167');light.addColorStop(1,'#121b28');
 g.fillStyle=light;g.fillRect(0,0,picture.width,picture.height);
 const {form}=characterAnatomy(ent,characterAppearance(ent));
 const zoom=form==='dragon'?Math.min(2.2,picture.width/60,picture.height/65):2.2;
 g.save();g.translate(picture.width/2,picture.height/2+(form==='dragon'?10:4));g.scale(zoom,zoom);
 drawCharacterAppearance(g,ent);g.restore();
}

function characterInputAppearance(form){
 const output={};
 for(const key of Object.keys(avatarDefaults))output[key]=form.elements[key].value;
 return output;
}

function setCharacterChoices(select,entries,current,placeholder=null){
 select.replaceChildren();
 if(placeholder!==null)select.add(new Option(translateSiteText(placeholder),''));
 for(const [name,zh] of entries)select.add(new Option(siteLanguage==='zh-CN'&&zh?zh:translateSiteText(name),name));
 if(current&&!Array.from(select.options).some(option=>option.value===current)){
   select.add(new Option(current,current));
 }
 select.value=current;
}

function openCharacterEditor(ent=null){
 if(!['gm','player'].includes(state.mode))return;
 const dialog=document.getElementById('characterEditor'),form=dialog.querySelector('form');
 editedCharacterId=ent?.id||null;
 characterEditorMap={scene:state.activeSceneId,floor:state.currentFloor,mode:state.mode};
 form.reset();
 const identity=characterIdentity(ent||{});
 setCharacterChoices(form.elements.sex,[['Feminino'],['Masculino'],['Outro']],identity.sex,'Selecione');
 setCharacterChoices(form.elements.species,characterSpecies,identity.species);
 setCharacterChoices(form.elements.profession,characterProfessions,ent?.role||'','Sem profissão');
 const data={name:ent?.name||'',
   type:ent?.type||'pc',...characterAppearance(ent||{})};
 for(const [key,value] of Object.entries(data))form.elements[key].value=value;
 document.getElementById('characterEditorTitle').textContent=translateSiteText(ent?'Editar personagem':'Novo personagem');
 document.getElementById('characterTypeRow').hidden=Boolean(ent)||state.mode!=='gm';
 const preview=()=>drawCharacterPortrait('characterEditorPortrait',{
   appearance:characterInputAppearance(form),species:form.elements.species.value,sex:form.elements.sex.value,role:form.elements.profession.value,equipment:ent?.equipment
 });
 const palette={dragon:'#9c604b',crocodile:'#6c8b57',robot:'#8593a6',grey:'#929ba3',
   thalassian:'#5b8b94',insect:'#937754',arisian:'#ae8293'};
 let previousForm=characterVisualForm(form.elements.species.value);
 form.oninput=event=>{
   if(event.target.name==='species'){
     const next=characterVisualForm(form.elements.species.value);
     if(form.elements.skin.value===(palette[previousForm]||avatarDefaults.skin)){
       form.elements.skin.value=palette[next]||avatarDefaults.skin;
     }
     previousForm=next;
   }
   preview();
 };
 preview();
 document.getElementById('characterEditorStatus').textContent='';
 dialog.showModal();form.elements.name.focus();
}

function characterSpawnPoint(floor){
 const actor=activeActor(),bounds=floor.terrainBounds||floor.bounds;
 const x=actor?.x??(bounds?bounds.x+bounds.w/2:320);
 const y=actor?.y??(bounds?bounds.y+bounds.h/2:240);
 const points=[[x,y]];
 for(const radius of [40,68,96])for(let i=0;i<12;i++){
   const a=i*Math.PI/6;points.push([x+Math.cos(a)*radius,y+Math.sin(a)*radius]);
 }
 return points.find(([px,py])=>canMoveTo(state.currentFloor,px,py)&&!waterDepthAt(floor,px,py)&&
   !state.entities.some(e=>e.sceneId===state.activeSceneId&&e.floor===state.currentFloor&&Math.hypot(e.x-px,e.y-py)<28));
}

function saveCharacterEditor(event){
 event.preventDefault();
 const dialog=document.getElementById('characterEditor'),form=event.currentTarget,data=new FormData(form);
 const name=String(data.get('name')||'').trim();
 const old=editedCharacterId?state.entities.find(e=>e.id===editedCharacterId):null;
 const status=document.getElementById('characterEditorStatus');
 if(!name){status.textContent=translateSiteText('Informe o nome do personagem.');return;}
 const contextChanged=!characterEditorMap||characterEditorMap.mode!==state.mode||
   (!old&&(characterEditorMap.scene!==state.activeSceneId||characterEditorMap.floor!==state.currentFloor));
 if(contextChanged||(editedCharacterId&&!old)||(old&&state.mode==='player'&&old.id!==activeActor()?.id)){
   status.textContent=translateSiteText('O personagem selecionado mudou. Reabra a edição.');
   return;
 }
 const floor=getScene().floors[state.currentFloor];
 const point=old?null:characterSpawnPoint(floor);
 if(!old&&!point){
   document.getElementById('characterEditorStatus').textContent=translateSiteText('Não há espaço livre próximo para colocar o personagem.');
   return;
 }
 const appearance=characterInputAppearance(form);
 beginEdit();
 const ent=old||instantiateTemplate({name,type:state.mode==='gm'&&data.get('type')==='npc'?'npc':'pc',
   role:'',color:appearance.clothing,icon:'◆',hp:12},...point);
 Object.assign(ent,{name,sex:String(data.get('sex')).trim(),species:String(data.get('species')).trim()||'Humano',
   role:String(data.get('profession')).trim(),appearance});
 normalizeD100Character(ent);
 if(!old)state.entities.push(ent);
 state.selectedEntityId=ent.id;
 finishEdit();
 if(!saveBank()){
   editedCharacterId=ent.id;
   status.textContent=translateSiteText('O navegador não conseguiu salvar a ficha. Exporte um JSON para guardar as alterações.');
   return;
 }
 dialog.close();
 if(state.mode==='player')selectPlayerChar(ent.id);
 else {gmPreviewId=ent.id;refreshGmFocus();updateUI();renderGmPullList();}
 if(!old)openD100Sheet(ent);
}

function characterItemAction(ent,name,action){
 if(ent!==getSelectedEntity()||!['gm','player'].includes(state.mode)||!ent.inventory.includes(name))return;
 const item=characterItems[name];
 if(!item)return;
 if(action==='equip'&&item.slot){
   beginEdit();
   if(item.slot==='light'&&ent.equipment?.light!==name)ent.lanternLit=false;
   (ent.equipment||={})[item.slot]=name;
 }else if(action==='remove'&&item.slot&&ent.equipment?.[item.slot]===name){
   beginEdit();
   delete ent.equipment[item.slot];
   if(item.slot==='light')ent.lanternLit=false;
 }else if(action==='use'&&item.use){
   if(item.use==='light'&&ent.equipment?.light!==name)return;
   if(item.use==='food'&&ent.hunger>=100||item.use==='heal'&&ent.hp>=ent.maxHp)return;
   beginEdit();
   if(item.use==='light')ent.lanternLit=!ent.lanternLit;
   else{
     if(item.use==='food')ent.hunger=Math.min(100,ent.hunger+25);
     if(item.use==='heal')ent.hp=Math.min(ent.maxHp,ent.hp+5);
     const index=ent.inventory.indexOf(name);
     ent.inventory.splice(index,1);
     ent.inventoryCells?.splice(index,1);
   }
 }else return;
 finishEdit();updateUI();saveBank();
}

function characterActionButton(label,handler){
 const button=document.createElement('button');button.type='button';button.className='btn';
 button.textContent=translateSiteText(label);button.onclick=handler;return button;
}

function addCharacterItem(){
 const ent=getSelectedEntity(),name=document.getElementById('characterItemPicker').value;
 if(!ent||state.mode!=='gm'||!Object.hasOwn(characterItems,name))return;
 beginEdit();ent.inventory.push(name);finishEdit();updateUI();saveBank();
}

function backpackLayout(ent){
 const positions=[];
 const used=new Set();
 let next=0;
 for(let index=0;index<ent.inventory.length;index++){
   let cell=ent.inventoryCells?.[index];
   if(!Number.isInteger(cell)||cell<0||cell>ent.inventory.length+24||used.has(cell)){
     while(used.has(next)||ent.inventoryCells?.includes(next))next++;
     cell=next;
   }
   used.add(cell);positions.push(cell);
 }
 return positions;
}

function equippedInventoryIndices(ent){
 const equipped=new Map();
 for(const [slot,name] of Object.entries(ent.equipment||{})){
   const index=ent.inventory.findIndex((item,i)=>item===name&&![...equipped.values()].includes(i));
   if(index>=0)equipped.set(slot,index);
 }
 return equipped;
}

function moveBackpackItem(ent,index,cell,fromSlot){
 if(ent!==getSelectedEntity()||!['gm','player'].includes(state.mode)||!ent.inventory[index])return;
 const positions=backpackLayout(ent);
 const occupant=positions.indexOf(cell);
 if(fromSlot&&occupant>=0&&occupant!==index&&![...equippedInventoryIndices(ent).values()].includes(occupant))return;
 beginEdit();
 if(fromSlot){
   delete ent.equipment[fromSlot];
   if(fromSlot==='light')ent.lanternLit=false;
 }
 if(occupant>=0)positions[occupant]=positions[index];
 positions[index]=cell;
 ent.inventoryCells=positions;
 finishEdit();updateUI();saveBank();
}

function characterItemDetails(name){
 const data=characterItems[name]?.data;
 if(!data)return '';
 const labels={categoria:'Categoria',peso:'Peso',preco:'Preço',pa:'PA',pv:'PV',
   alcanceMetros:'Alcance',dano:'Dano',penetracao:'Penetração',municao:'Munição',
   locaisProtegidos:'Proteção',uso:'Usos',nivelAcesso:'Acesso',material:'Material',municoesCompativeis:'Munição compatível'};
 const fields=Object.entries(labels).filter(([field])=>data[field]&&
   (!['alcanceMetros','penetracao'].includes(field)||data[field]!=='0')).map(([field,label])=>{
     const unit=field==='peso'?' kg':field==='alcanceMetros'?' m':'';
     return translateSiteText(label)+' · '+translateSiteText(data[field])+unit;
   });
 const description=siteLanguage==='zh-CN'&&data.descricao_zh||data.descricao;
 return [description,fields.join('  ·  ')].filter(Boolean).join('\n');
}

const equipmentSlotIcons={head:'⛑️',body:'🛡️',feet:'🥾',hand:'⚔️',light:'🔦',waist:'🪢'};
function inventoryIcon(name){
 const item=characterItems[name];
 const key=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const art=[
   [/machado|picareta/,'rpg_axe_small'],[/adaga/,'rpg_dagger'],[/faca/,'rpg_knife'],
   [/escudo/,'rpg_shield_heater'],[/arco/,'rpg_wooden_bow'],[/lanca|cajado/,'rpg_spear'],
   [/espada|sabre/,'rpg_sword'],[/municao|flecha/,'rpg_arrow'],
   [/armadura|biomesh|colete/,'rpg_armor_metal'],[/roupa|capa|casaco/,'rpg_armor_leather'],
   [/mochila/,'rpg_backpack'],[/bolsa/,'rpg_bag'],[/grimorio|livro/,'rpg_book'],
   [/convite|registro|carta/,'rpg_scroll'],[/pocao|nanogel|antidoto/,'rpg_potion_bottle'],
   [/agua|bebida/,'food_bottle'],[/racao|comida/,'food_bread'],[/chave/,'rpg_key'],
   [/miner|cristal/,'rpg_mineral'],[/moeda/,'rpg_coin']
 ].find(([pattern])=>pattern.test(key))?.[1];
 if(art)return {art};
 if(/medic|socorro/.test(key))return {symbol:'🩹'};
 if(/bateria|celula/.test(key))return {symbol:'🔋'};
 if(/comunicador|scanner/.test(key))return {symbol:'📟'};
 if(/kit|ferramenta/.test(key))return {symbol:'🧰'};
 if(item?.slot==='hand')return {symbol:characterHandStyle(name)==='gun'?'🔫':'⚔️'};
 if(item?.slot)return {symbol:equipmentSlotIcons[item.slot]};
 return {art:'rpg_chest'};
}

let selectedInventoryItem=null;
function renderCharacterEquipment(ent){
 document.getElementById('characterMarketAccess').classList.toggle('hidden',ent.type!=='pc'||state.mode==='architect');
 document.getElementById('characterCredits').textContent=creditLabel(ent.credits);
 drawCharacterPortrait('characterPortrait',ent);
 const slots=document.getElementById('equipmentSlots'),inventory=document.getElementById('inventoryList');
 const details=document.getElementById('inventoryDetails');
 const positions=backpackLayout(ent),equipped=equippedInventoryIndices(ent);
 const equippedIndices=new Set(equipped.values());
 let dragged=null;
 const setTarget=(button,accept,drop)=>{
   button.ondragover=event=>{
     if(!dragged||!accept(dragged))return;
     event.preventDefault();event.dataTransfer.dropEffect='move';button.classList.add('inventory-drop');
   };
   button.ondragleave=()=>button.classList.remove('inventory-drop');
   button.ondrop=event=>{
     event.preventDefault();button.classList.remove('inventory-drop');
     if(dragged&&accept(dragged)){
       selectedInventoryItem=null;
       drop(dragged);
     }
   };
 };
 const showSelection=()=>{
   details.replaceChildren();
   const selection=selectedInventoryItem;
   if(selection?.entity!==ent||ent.inventory[selection.index]!==selection.name)return;
   const {index,name}=selection;
   const slot=[...equipped].find(([,i])=>i===index)?.[0];
   const item=characterItems[name];
   const title=document.createElement('strong');title.textContent=characterItemName(name);
   const stats=document.createElement('small');stats.textContent=characterItemDetails(name);
   details.append(title,stats);
   const action=(label,key)=>characterActionButton(label,()=>{
     selectedInventoryItem=null;
     characterItemAction(ent,name,key);
     showSelection();
   });
   if(slot)details.append(action('Tirar','remove'));
   else if(item?.slot)details.append(action('Equipar','equip'));
   if(item?.use&&(!item.slot||slot))details.append(action(
     item.use==='light'?(ent.lanternLit?'Apagar':'Acender'):'Usar','use'));
 };
 const cellButton=(index,label,slot)=>{
   const button=document.createElement('button');button.type='button';button.className='inventory-cell';
   const name=ent.inventory[index];
   if(slot)button.dataset.slot=slot;
   const {art,symbol}=name?inventoryIcon(name):{symbol:equipmentSlotIcons[slot]};
   if(art||symbol){
     const icon=document.createElement(art?'img':'span');
     icon.className='inventory-icon';
     icon.setAttribute('aria-hidden','true');
     if(art){icon.src='assets/item-icons/'+art+'.webp';icon.alt='';icon.draggable=false;}
     else icon.textContent=symbol;
     button.append(icon);
   }
   const title=name?characterItemName(name):label;
   button.setAttribute('aria-label',[label,name&&title].filter(Boolean).join(' · '));
   if(name||slot)button.title=title;
   if(name){
     button.draggable=true;
     button.ondragstart=event=>{
       dragged={index,name,slot};
       event.dataTransfer.setData('text/plain',name);event.dataTransfer.effectAllowed='move';
     };
     button.ondragend=()=>{
       dragged=null;
       slots.parentElement.parentElement.querySelectorAll('.inventory-drop').forEach(cell=>cell.classList.remove('inventory-drop'));
     };
     button.onclick=()=>{
       selectedInventoryItem={entity:ent,index,name};
       showSelection();
     };
   }
   return button;
 };
 slots.replaceChildren(...Object.entries(characterSlots).map(([slot,key])=>{
   const button=cellButton(equipped.get(slot),translateSiteText(key),slot);
   setTarget(button,source=>!source.slot&&characterItems[source.name]?.slot===slot,
     source=>characterItemAction(ent,source.name,'equip'));
   return button;
 }));
 const byCell=new Map(positions.map((cell,index)=>[cell,index]));
 const size=Math.max(12,Math.ceil((Math.max(-1,...positions)+2)/4)*4);
 inventory.replaceChildren(...Array.from({length:size},(_,cell)=>{
   const index=byCell.get(cell),visible=!equippedIndices.has(index);
   const button=cellButton(visible?index:undefined,index===undefined||!visible?translateSiteText('Espaço vazio'):'');
   setTarget(button,source=>!source.slot||!visible||index===undefined,
     source=>moveBackpackItem(ent,source.index,cell,source.slot));
   return button;
 }));
 showSelection();
 const picker=document.getElementById('characterItemPicker');
 picker.parentElement.classList.toggle('hidden',state.mode!=='gm');
 if(picker.dataset.language!==siteLanguage){
   const names=Object.keys(characterItems).sort((a,b)=>characterItemName(a).localeCompare(characterItemName(b),siteLanguage));
   picker.replaceChildren(...names.map(name=>new Option(characterItemName(name),name)));
   picker.dataset.language=siteLanguage;
 }
}

const marketItems=mesaItemCatalog.filter(item=>item.disponivelCampanha==='true'&&
 item.preco&&Number.isFinite(Number(item.preco))&&Number(item.preco)>=0);
let marketActor=null;
function creditLabel(amount){
 return Number(amount||0).toLocaleString(siteLanguage)+' '+translateSiteText('créditos');
}
function canShop(actor){
 return actor?.type==='pc'&&getSelectedEntity()===actor&&
   (state.mode==='gm'||(state.mode==='player'&&actor===activeActor()));
}
function openCharacterMarket(){
 const actor=getSelectedEntity();
 if(!canShop(actor))return;
 marketActor=actor;
 document.getElementById('marketSearch').value='';
 document.getElementById('marketStatus').textContent='';
 renderCharacterMarket();
 document.getElementById('characterMarket').showModal();
}
function buyCharacterMarketItem(id){
 const actor=marketActor,item=marketItems.find(entry=>entry.id===id);
 if(!canShop(actor)||!item||actor.credits<Number(item.preco))return false;
 beginEdit();
 const previousBalance=actor.credits;
 actor.credits-=Number(item.preco);
 actor.inventory.push(item.nome);
 if(!saveBank()){
   actor.inventory.pop();
   actor.credits=previousBalance;
   finishEdit();
   return false;
 }
 finishEdit();
 updateUI();
 return true;
}
function renderCharacterMarket(){
 if(!canShop(marketActor))return;
 const actor=marketActor;
 const search=document.getElementById('marketSearch').value.trim().toLocaleLowerCase(siteLanguage);
 document.getElementById('marketBalance').textContent=translateSiteText('Saldo')+' · '+creditLabel(actor.credits);
 const root=document.getElementById('marketItems');
 const matching=marketItems.filter(item=>
   [item.nome,characterItemName(item.nome),item.categoria,translateSiteText(item.categoria)]
     .some(value=>value.toLocaleLowerCase(siteLanguage).includes(search))
 ).sort((a,b)=>characterItemName(a.nome).localeCompare(characterItemName(b.nome),siteLanguage));
 root.replaceChildren(...matching.map(item=>{
   const row=document.createElement('details');row.className='market-item';
   const summary=document.createElement('summary'),name=characterItemName(item.nome);
   summary.textContent=name+' · '+creditLabel(item.preco);
   const description=document.createElement('p');
   description.textContent=characterItemDetails(item.nome);
   const buy=characterActionButton('Comprar',()=>{
     const purchased=buyCharacterMarketItem(item.id);
     document.getElementById('marketStatus').textContent=purchased?
       translateSiteText('Adicionado à mochila')+' · '+name:translateSiteText('Compra não concluída');
     if(purchased){
       document.getElementById('marketBalance').textContent=translateSiteText('Saldo')+' · '+creditLabel(actor.credits);
       for(const button of root.querySelectorAll('button[data-price]'))button.disabled=Number(button.dataset.price)>actor.credits;
     }
   });
   buy.dataset.price=item.preco;
   buy.disabled=Number(item.preco)>actor.credits;
   row.append(summary,description,buy);
   return row;
 }));
 if(!matching.length)root.textContent=translateSiteText('Nenhum item encontrado.');
}

const localRolls=[];
const localRollBus=typeof BroadcastChannel==='function'?new BroadcastChannel('mesa-estelar-2d-rolls'):null;
let cloudRollStop=null;
let rollListenAccount=null;
let rollCloudGeneration=0;

function rollSessionCode(){
 return (localStorage.getItem('mesa2d-roll-session')||'').trim().toLowerCase();
}

function showRollResults(){
 const root=document.getElementById('rollResults');
 const selected=getSelectedEntity();
 root.replaceChildren(...localRolls.filter(roll=>roll.session===rollSessionCode()&&
   (state.mode==='gm'||roll.actor===selected?.id)).sort((a,b)=>(a.time||0)-(b.time||0)).slice(-8).reverse().map(roll=>{
   const row=document.createElement('div');row.className='list-item';
   row.textContent=roll.name+' · '+mesaSkillLabel(roll.skill)+' · '+roll.roll+'/'+roll.target+
     ' · '+translateSiteText(roll.success?'Sucesso':'Falha');return row;
 }));
}

function receiveSkillRoll(roll){
 if(!roll||typeof roll.id!=='string'||typeof roll.name!=='string'||typeof roll.skill!=='string'||
    !Number.isInteger(roll.roll)||!Number.isFinite(roll.target)||localRolls.some(item=>item.id===roll.id))return;
 localRolls.push(roll);if(localRolls.length>100)localRolls.shift();
 if(typeof state!=='undefined'&&state)showRollResults();
}

if(localRollBus)localRollBus.onmessage=event=>receiveSkillRoll(event.data);

function setRollSession(value){
 localStorage.setItem('mesa2d-roll-session',value.trim().toLowerCase().slice(0,40));
 refreshRollSharing();showRollResults();
}

function skillMapNotice(message){
 const text=translateSiteText(message);
 document.getElementById('skillMapStatus').textContent=text;
 logEvent(text);
}

function rollShareStatus(message){
 document.getElementById('rollShareStatus').textContent=translateSiteText(message);
}

async function refreshRollSharing(){
 const session=rollSessionCode(),mode=state?.mode,cloud=mesaCloud;
 const user=cloud?.auth.currentUser;
 document.getElementById('rollSessionCode').value=session;
 const key=[mode,user?.uid,session].join('|');
 if(key===rollListenAccount)return;
 rollListenAccount=key;const generation=++rollCloudGeneration;
 cloudRollStop?.();cloudRollStop=null;
 if(!session||!user||mode==='architect'){
   rollShareStatus('Testes locais. Informe o mesmo código da sessão e entre na nuvem para compartilhar.');
   return;
 }
 if(mode!=='gm'){rollShareStatus('O mestre conectado com o mesmo código recebe os testes.');return;}
 try{
   const store=cloud.storeSdk;
   if(generation!==rollCloudGeneration)return;
   const feed=store.query(store.collection(cloud.db,'usuarios'),store.where('mesa2dRollFeed.session','==',session));
   cloudRollStop=store.onSnapshot(feed,snapshot=>{
     if(generation!==rollCloudGeneration)return;
     for(const doc of snapshot.docs)for(const roll of doc.data().mesa2dRollFeed?.rolls||[])receiveSkillRoll(roll);
     if(generation===rollCloudGeneration)rollShareStatus('Sessão conectada.');
   },()=>{if(generation===rollCloudGeneration)rollShareStatus('Não foi possível receber os testes. Verifique se a conta tem acesso de mestre.');});
 }catch{
   if(generation===rollCloudGeneration)rollShareStatus('Não foi possível receber os testes da nuvem.');
 }
}

async function publishSkillRoll(ent,skill,roll,target){
 const record={id:crypto.randomUUID(),actor:ent.id,name:ent.name,skill:skill.name,roll,target,
   success:roll<=target,session:rollSessionCode(),time:Date.now()};
 receiveSkillRoll(record);localRollBus?.postMessage(record);
 const cloud=mesaCloud,user=cloud?.auth.currentUser;
 if(!record.session||!user)return;
 try{
   const store=cloud.storeSdk,ref=store.doc(cloud.db,'usuarios',user.uid);
   await store.runTransaction(cloud.db,async transaction=>{
     const snapshot=await transaction.get(ref),prior=snapshot.data()?.mesa2dRollFeed;
     if(!snapshot.exists())throw Error('Missing profile');
     const rolls=prior?.session===record.session&&Array.isArray(prior.rolls)?prior.rolls.slice(-19):[];
     transaction.update(ref,{mesa2dRollFeed:{session:record.session,rolls:[...rolls,record]}});
   });
 }catch{rollShareStatus('O teste ficou local. A nuvem não confirmou o envio.');}
}
