// Adaptador de ficha para os atributos e a estrutura de perícias observados no Mesa Estelar d100.
// Fórmulas-base e combate são controlados pelo sistema principal e não foram duplicados aqui.
const D100_ATTRIBUTES=['FOR','CON','TAM','DES','INT','POD','CAR'];
const D100_MIGRATION_VERSION=1;
const STARTING_CREDITS=1000;
function mesaImportedTraining(record){
 const points=value=>Math.max(0,parseInt(value,10)||0);
 if(record?.investimentos)return ['origem','carreira','hobbie','xp'].reduce((sum,key)=>sum+points(record.investimentos[key]),0);
 return points(record?.treinoTotal??record?.treinoEtapa)+points(record?.xpTreino);
}
function repairImportedSpecialties(ent){
 const records=ent.mesaSourceSheet?.especializacoes;
 if(!records)return;
 for(const skill of ent.skillsD100){
   if(Number.isFinite(skill.total))continue;
   const recordEntry=Object.entries(records).find(([id,record])=>skill.id===id||
     [id.replaceAll('_',' '),record?.nomeOriginal,record?.escola].includes(skill.name));
   if(!recordEntry)continue;
   const [id,record]=recordEntry;
   const definition=mesaCharacterSkills.find(row=>row[0]===id);
   if(!definition?.[4])continue;
   const base=mesaSkillBase(definition[4],ent.attrs);
   if(base===null)continue;
   const training=skill.training>0?skill.training:mesaImportedTraining(record);
   Object.assign(skill,{id,name:definition[1],base,training,total:base+training,provisional:false});
 }
}
function normalizeD100Character(ent){
 if(!ent)return ent;
 const old=ent.attrs||{};
 if(!ent.legacyAttrs && ('SAB' in old))ent.legacyAttrs={...old};
 const attrs={};
 for(const name of D100_ATTRIBUTES){
  const value=Number(old[name]);
  // TAM e POD não existiam no protótipo; valores de demonstração até importar ficha real.
  attrs[name]=Number.isFinite(value)&&value>0?value:(name==='TAM'||name==='POD'?10:10);
 }
 ent.attrs=attrs;
 ent.system='Mesa Estelar d100';
 ent.d100Version=D100_MIGRATION_VERSION;
 ent.skillsD100=Array.isArray(ent.skillsD100)?ent.skillsD100:parseLegacySkillsD100(ent.skills);
 if(typeof mesaCharacterSkills!=='undefined')repairImportedSpecialties(ent);
 if(!ent.d100SheetConfigured&&!ent.skillsD100.some(isSwimmingSkill)){
   ent.skillsD100.push({name:'Natação',base:null,training:null,total:null,provisional:true});
 }
 ent.powers=Array.isArray(ent.powers)?ent.powers:[];
 ent.inventory=Array.isArray(ent.inventory)?ent.inventory:[];
 if(typeof migrateCharacterPack==='function')migrateCharacterPack(ent);
 if(!Number.isFinite(ent.credits)||ent.credits<0)ent.credits=ent.type==='pc'?STARTING_CREDITS:0;
 ent.hp=Number.isFinite(Number(ent.hp))?Number(ent.hp):12;
 ent.maxHp=Number.isFinite(Number(ent.maxHp))&&Number(ent.maxHp)>0?Number(ent.maxHp):ent.hp;
 ent.hunger=Number.isFinite(Number(ent.hunger))?Number(ent.hunger):100;
 return ent;
}
function parseLegacySkillsD100(skills){
 if(!Array.isArray(skills))return [];
 return skills.map(skill=>{
  if(typeof skill==='object'&&skill){
   return {name:String(skill.name||'Perícia'),base:skill.base!==null&&skill.base!==undefined&&Number.isFinite(Number(skill.base))?Number(skill.base):null,
     training:skill.training!==null&&skill.training!==undefined&&Number.isFinite(Number(skill.training))?Number(skill.training):null,
     total:skill.total!==null&&skill.total!==undefined&&Number.isFinite(Number(skill.total))?Number(skill.total):null,
     provisional:skill.provisional!==false};
  }
  const raw=String(skill),match=raw.match(/^(.*?)\s*\+\s*(\d+)\s*$/);
  // Os antigos "+5" eram bônus no protótipo d20: não são percentuais nem treinos d100.
  return {name:match?match[1].trim():raw,base:null,training:null,total:null,
    previousBonus:match?Number(match[2]):null,provisional:true};
 });
}
function migrateD100Characters(){
 for(const ent of state.entities||[])normalizeD100Character(ent);
}
function isSwimmingSkill(skill){
 return /^(natação|natacao|swimming|游泳)$/i.test(String(skill?.name||'').trim());
}
function d100Roll(){return Math.floor(Math.random()*100)+1;}
function testD100Attribute(key){
 const ent=getSelectedEntity();if(!ent||!D100_ATTRIBUTES.includes(key))return;
 const roll=d100Roll();
 logEvent('🎲 '+ent.name+' • '+key+' '+ent.attrs[key]+' • d100: '+roll+' (sem fórmula-base importada, avaliação pendente do Mestre)');
}
function editD100Attributes(){
 const ent=getSelectedEntity();if(!ent||state.mode!=='gm')return;
 const example=D100_ATTRIBUTES.map(k=>ent.attrs[k]).join(', ');
 const raw=prompt('Atributos FOR, CON, TAM, DES, INT, POD, CAR (separados por vírgulas):',example);
 if(raw===null)return;
 const vals=raw.split(',').map(x=>Number(x.trim()));
 if(vals.length!==7||vals.some((n,i)=>{
   const key=D100_ATTRIBUTES[i];
   const min=ent.type==='pc' && (key==='TAM'||key==='INT')?6:ent.type==='pc'?3:1;
   const max=ent.type==='pc'?18:100;
   return !Number.isInteger(n)||n<min||n>max;
 })){
   logEvent('Atributos inválidos: PJs usam 3–18 (TAM e INT: 6–18); criaturas podem ter valores especiais.');
   return;
 }
 beginEdit();D100_ATTRIBUTES.forEach((k,i)=>ent.attrs[k]=vals[i]);finishEdit();updateUI();
}
function editD100Attribute(key){
 const ent=getSelectedEntity();
 if(!ent||!D100_ATTRIBUTES.includes(key)||state.mode!=='gm')return;
 const raw=prompt('Valor d100 de '+key+' (ficha original do Mesa Estelar):',String(ent.attrs[key]));
 if(raw===null)return;
 const value=Number(raw);
 const min=ent.type==='pc'&&(key==='TAM'||key==='INT')?6:ent.type==='pc'?3:1;
 const max=ent.type==='pc'?18:100;
 if(!Number.isInteger(value)||value<min||value>max){logEvent('Valor de atributo fora dos limites da ficha.');return;}
 beginEdit();ent.attrs[key]=value;finishEdit();updateUI();
}
function editD100Skill(index){
 const ent=getSelectedEntity(),skill=ent?.skillsD100?.[index];
 if(!skill||state.mode!=='gm')return;
 const base=prompt('Base da perícia '+skill.name+' (%). Consulte a fórmula no Mesa Estelar original:',String(skill.base??''));
 if(base===null)return;
 const train=prompt('Treino investido na perícia '+skill.name+' (%):',String(skill.training??''));
 if(train===null)return;
 if(base.trim()===''||train.trim()===''){logEvent('Base e treino são necessários.');return;}
 const b=Number(base),t=Number(train);
 if(!Number.isInteger(b)||!Number.isInteger(t)||b<0||t<0||b+t>100){logEvent('Valores d100 inválidos.');return;}
 beginEdit();skill.base=b;skill.training=t;skill.total=b+t;skill.provisional=false;finishEdit();updateUI();
}
function addD100Skill(){
 const ent=getSelectedEntity();if(!ent||state.mode!=='gm')return;
 const name=prompt('Nome da perícia (conforme o Mesa Estelar d100):');
 if(!name?.trim())return;
 beginEdit();ent.skillsD100.push({name:name.trim(),base:null,training:null,total:null,provisional:true});finishEdit();updateUI();
}
function rollD100Skill(ent,skill){
 if(!Number.isFinite(skill?.total)){
   skillMapNotice('Defina Base + Treino antes de rolar esta perícia.');
   return null;
 }
 const roll=d100Roll();
 publishSkillRoll(ent,skill,roll,skill.total);
 return roll<=skill.total;
}
function testD100Skill(index){
 const ent=getSelectedEntity(),skill=ent?.skillsD100?.[index];if(!skill)return;
 if(isSwimmingSkill(skill)){
   const actor=activeActor();
   if(actor===ent&&trySwimmingTest(actor))return;
   const result=rollD100Skill(ent,skill);
   if(result!==null)skillMapNotice('Teste sem efeito no mapa: aproxime-se da água profunda.');
 }else rollD100Skill(ent,skill);
}
function moveSkill(ent,source,destination){
 if(getSelectedEntity()!==ent||source===destination||!ent.skillsD100[source]||!ent.skillsD100[destination])return;
 beginEdit();
 const [skill]=ent.skillsD100.splice(source,1);
 ent.skillsD100.splice(destination,0,skill);
 finishEdit();displayD100Skills(ent);
}
function displayD100Skills(ent){
 const skills=ent.skillsD100||[];
 const root=document.getElementById('skillsList');if(!root)return;
 root.replaceChildren();
 let dragSource=null;
 for(const [index,skill] of skills.entries()){
  const line=document.createElement('div');line.className='character-skill-line';line.draggable=true;
  const row=document.createElement('button');row.type='button';row.className='list-item d100-skill-row';
  const target=Number.isFinite(skill.total)?skill.total+'%':translateSiteText('A definir');
  row.textContent=mesaSkillLabel(skill.name)+' · '+target;
  row.title=translateSiteText('Clique para rolar d100. Arraste para mudar a ordem.');
  row.onclick=()=>testD100Skill(index);line.append(row);
  line.ondragstart=event=>{dragSource=index;event.dataTransfer.setData('text/plain',String(index));event.dataTransfer.effectAllowed='move';};
  line.ondragend=()=>{dragSource=null;};
  line.ondragover=event=>{if(dragSource!==null)event.preventDefault();};
  line.ondrop=event=>{event.preventDefault();if(dragSource!==null)moveSkill(ent,dragSource,index);};
  if(index>0){
    const up=characterActionButton('↑',()=>moveSkill(ent,index,index-1));
    up.setAttribute('aria-label',translateSiteText('Mover perícia para cima'));
    line.append(up);
  }
  if(state.mode==='gm'){
    const edit=characterActionButton('Editar',()=>editD100Skill(index));line.append(edit);
  }
  root.append(line);
 }
 for(const power of ent.powers||[]){
  const row=document.createElement('div');row.className='list-item';row.textContent='✨ '+translateSiteText(power);root.append(row);
 }
 const note=document.createElement('div');note.className='d100-note';
 note.textContent=translateSiteText('A ficha d100 calcula a base pelas fórmulas do Mesa Estelar.');
 root.append(note);
 if(state.mode==='gm'){
  const add=document.createElement('button');add.type='button';add.className='btn';add.textContent=translateSiteText('+ Perícia');add.onclick=addD100Skill;root.append(add);
 }
}
// Esqueleto autônomo de demonstração: perceber, aproximar-se e parar. Não causa dano.
// A IA de combate será conectada às regras do Mesa Estelar após validação da ficha.
function updateSkeletonAutonomy(){
 if(state.mode==='architect')return;
 const now=performance.now();
 for(const ent of state.entities||[]){
  if(ent.ai?.kind!=='skeleton'||!ent.ai.enabled||ent.hp<=0||ent.sleepPose)continue;
  if(state.mode==='gm'&&getGmControlledEntity()?.id===ent.id)continue;
  if(ent.sceneId!==state.activeSceneId||ent.floor!==state.currentFloor)continue;
  const candidates=state.entities.filter(e=>e.type==='pc'&&e.hp>0&&e.sceneId===ent.sceneId&&e.floor===ent.floor);
  if(!candidates.length)continue;
  candidates.sort((a,b)=>Math.hypot(a.x-ent.x,a.y-ent.y)-Math.hypot(b.x-ent.x,b.y-ent.y));
  const target=candidates[0],dist=Math.hypot(target.x-ent.x,target.y-ent.y);
  const detection=ent.ai.detection||180,reach=ent.ai.reach||34;
  if(dist>detection){ent.ai.state='vigiar';continue;}
  if(dist<=reach){
    ent.ai.state='pronto para combate';
    if(now>(ent.ai.nextNotice||0)){
      ent.ai.nextNotice=now+4200;
      say(ent,'...');
    }
    continue;
  }
  ent.ai.state='perseguir';
  const dx=(target.x-ent.x)/dist,dy=(target.y-ent.y)/dist;
  const speed=1.15;
  const x=ent.x+dx*speed,y=ent.y+dy*speed;
  const beforeX=ent.x,beforeY=ent.y;
  if(canMoveTo(ent.floor,x,ent.y))ent.x=x;
  if(canMoveTo(ent.floor,ent.x,y))ent.y=y;
  ent.facingX=dx;ent.facingY=dy;
  if(ent.x!==beforeX||ent.y!==beforeY)markEntityWalking(ent,100);
 }
}
function toggleSelectedSkeletonAI(){
 const ent=getSelectedEntity();
 if(!ent||ent.ai?.kind!=='skeleton')return;
 ent.ai.enabled=!ent.ai.enabled;
 ent.ai.state=ent.ai.enabled?'vigiar':'desativada';
 updateUI();saveBank();
}

let d100SheetActor=null;
let d100SheetRows=[];

function mesaSkillLabel(name){
 const source=mesaCharacterSkills.find(([,label])=>label===name);
 return siteLanguage==='zh-CN'&&source?.[2]?source[2]:translateSiteText(name);
}

function mesaSkillBase(formula,attrs){
 if(!/^(?:FOR|CON|TAM|DES|INT|POD|CAR)(?:\*2|\+(?:FOR|CON|TAM|DES|INT|POD|CAR|MAIOR))?(?:\+40)?$/.test(formula))return null;
 const value=term=>term==='MAIOR'?Math.max(...['FOR','TAM','DES','INT','CAR'].map(k=>attrs[k])):Number(attrs[term]??term);
 return formula.split('+').reduce((total,term)=>total+(term.endsWith('*2')?2*value(term.slice(0,-2)):value(term)),0);
}

function d100SheetAttributes(){
 const root=document.getElementById('d100SheetAttrs');
 return Object.fromEntries(D100_ATTRIBUTES.map(key=>[key,Number(root.querySelector('[name="'+key+'"]').value)]));
}

function refreshD100SheetTotals(){
 const attrs=d100SheetAttributes();
 for(const row of d100SheetRows){
   const base=row.formula?mesaSkillBase(row.formula,attrs):row.existing?.base??null;
   row.total.textContent=base===null?'—':String(base)+' + '+(Number(row.training.value)||0)+' = '+(base+(Number(row.training.value)||0))+'%';
 }
}

function filterD100Sheet(){
 const text=String(document.getElementById('d100SkillSearch').value).trim().toLowerCase();
 const careerOnly=document.getElementById('d100CareerFilter').checked;
 const selectedOnly=document.getElementById('d100SelectedFilter').checked;
 for(const row of d100SheetRows){
   row.node.hidden=!row.search.includes(text)||(careerOnly&&!row.career)||(selectedOnly&&!row.check.checked);
 }
}

function openD100Sheet(ent=getSelectedEntity()){
 if(!ent||!['gm','player'].includes(state.mode)||(state.mode==='player'&&ent!==activeActor()))return;
 const dialog=document.getElementById('characterD100Sheet'),attrs=document.getElementById('d100SheetAttrs');
 d100SheetActor=ent;
 document.getElementById('d100SheetName').textContent=ent.name;
 document.getElementById('d100SheetStatus').textContent='';
 document.getElementById('d100SkillSearch').value='';
 document.getElementById('d100CareerFilter').checked=false;
 document.getElementById('d100SelectedFilter').checked=false;
 attrs.replaceChildren(...D100_ATTRIBUTES.map(key=>{
   const label=document.createElement('label'),name=document.createElement('span'),input=document.createElement('input');
   name.textContent=key;input.type='number';input.name=key;input.className='ctrl';input.required=true;
   input.min=ent.type==='pc'?(['TAM','INT'].includes(key)?6:3):1;input.max=ent.type==='pc'?18:100;
   input.value=ent.attrs[key];input.oninput=refreshD100SheetTotals;label.append(name,input);return label;
 }));
 const old=ent.skillsD100||[],recommended=new Set(mesaCareerSkillIds[ent.role]||[]);
 const names=new Set(mesaCharacterSkills.map(([,name])=>name.toLowerCase()));
 const entries=[...mesaCharacterSkills.filter(([,name,,,,available])=>available||state.mode==='gm'||old.some(skill=>skill.name===name)),
   ...old.filter(skill=>!names.has(skill.name.toLowerCase())).map(skill=>[null,skill.name,'','',null,true])];
 d100SheetRows=entries.map(([id,name,zh,type,formula])=>{
   const existing=old.find(skill=>(id&&skill.id===id)||(!skill.id&&skill.name.toLowerCase()===name.toLowerCase()));
   const node=document.createElement('div'),choice=document.createElement('label'),check=document.createElement('input'),label=document.createElement('span');
   node.className='d100-sheet-row';choice.className='d100-skill-choice';check.type='checkbox';check.checked=Boolean(existing);
   const translated=(siteLanguage==='zh-CN'&&zh)||translateSiteText(name);
   label.textContent=translated;choice.append(check,label);
   if(type)label.title=translateSiteText(type)+(formula?' · '+formula:'');
   const trainingLabel=document.createElement('label'),trainText=document.createElement('span'),training=document.createElement('input');
   trainText.textContent=translateSiteText('Treino');training.type='number';training.className='ctrl';training.min=0;training.max=100;
   training.value=existing?.training??0;training.disabled=!check.checked;
   training.oninput=refreshD100SheetTotals;
   check.onchange=()=>{training.disabled=!check.checked;filterD100Sheet();};
   trainingLabel.append(trainText,training);
   const total=document.createElement('output');node.append(choice,trainingLabel,total);
   return {id,name,formula,node,check,training,total,existing,career:recommended.has(id),search:(name+' '+translated).toLowerCase()};
 });
 document.getElementById('d100SheetSkills').replaceChildren(...d100SheetRows.map(row=>row.node));
 refreshD100SheetTotals();dialog.showModal();
}

function saveD100Sheet(event){
 event.preventDefault();
 const ent=d100SheetActor,dialog=document.getElementById('characterD100Sheet');
 if(!ent||!state.entities.includes(ent)||!['gm','player'].includes(state.mode)||(state.mode==='player'&&ent!==activeActor()))return;
 const attrs=d100SheetAttributes();
 const picked=d100SheetRows.filter(row=>row.check.checked).map(row=>{
   const training=Number(row.training.value);
   const base=row.formula?mesaSkillBase(row.formula,attrs):row.existing?.base??null;
   return {...row.existing,id:row.id||row.existing?.id,name:row.name,base,training,
     total:base===null?null:base+training,provisional:!row.formula};
 });
 const keyFor=skill=>skill.id||skill.name.toLowerCase();
 const known=new Map(picked.map(skill=>[keyFor(skill),skill]));
 const ordered=(ent.skillsD100||[]).flatMap(skill=>{
   const key=keyFor(skill),value=known.get(key);known.delete(key);return value?[value]:[];
 });
 beginEdit();ent.attrs=attrs;ent.skillsD100=[...ordered,...known.values()];ent.d100SheetConfigured=true;finishEdit();
 if(!saveBank()){
   document.getElementById('d100SheetStatus').textContent=translateSiteText('O navegador não conseguiu salvar a ficha. Exporte um JSON para guardar as alterações.');
   return;
 }
 dialog.close();updateUI();
}
