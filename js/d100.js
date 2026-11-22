// Adaptador de ficha para os atributos e a estrutura de perícias observados no Mesa Estelar d100.
// Fórmulas-base e combate são controlados pelo sistema principal e não foram duplicados aqui.
const D100_ATTRIBUTES=['FOR','CON','TAM','DES','INT','POD','CAR'];
const D100_MIGRATION_VERSION=1;
function normalizeD100Character(ent){
 if(!ent)return ent;
 const old=ent.attrs||{};
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
 ent.powers=Array.isArray(ent.powers)?ent.powers:[];
 ent.inventory=Array.isArray(ent.inventory)?ent.inventory:[];
 ent.hp=Number.isFinite(Number(ent.hp))?Number(ent.hp):12;
 ent.maxHp=Number.isFinite(Number(ent.maxHp))&&Number(ent.maxHp)>0?Number(ent.maxHp):ent.hp;
 ent.hunger=Number.isFinite(Number(ent.hunger))?Number(ent.hunger):100;
 return ent;
}
function parseLegacySkillsD100(skills){
 if(!Array.isArray(skills))return [];
 return skills.map(skill=>{
  if(typeof skill==='object'&&skill){
   return {name:String(skill.name||'Perícia'),base:Number.isFinite(Number(skill.base))?Number(skill.base):null,
     training:Number(skill.training)||0,total:Number.isFinite(Number(skill.total))?Number(skill.total):null,
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
function d100Roll(){return Math.floor(Math.random()*100)+1;}
function testD100Attribute(key){
 const ent=getSelectedEntity();if(!ent||!D100_ATTRIBUTES.includes(key))return;
 const roll=d100Roll();
 logEvent('🎲 '+ent.name+' • '+key+' '+ent.attrs[key]+' • d100: '+roll+' (sem fórmula-base importada, avaliação pendente do Mestre)');
}
function testD100Skill(index){
 const ent=getSelectedEntity(),skill=ent?.skillsD100?.[index];if(!skill)return;
 if(!Number.isFinite(skill.total)){
  logEvent('📚 '+skill.name+': falta importar Base + Treino do Mesa Estelar principal.');
  return;
 }
 const roll=d100Roll(),success=roll<=skill.total;
 logEvent('🎲 '+ent.name+' • '+skill.name+': '+roll+' / '+skill.total+'% • '+(success?'SUCESSO':'FALHA'));
}
function displayD100Skills(ent){
 const skills=ent.skillsD100||[];
 const root=document.getElementById('skillsList');if(!root)return;
 root.replaceChildren();
 for(const [index,skill] of skills.entries()){
  const row=document.createElement('button');row.type='button';row.className='list-item d100-skill-row';
  const target=Number.isFinite(skill.total)?skill.total+'%':'A definir';
  row.textContent='🎯 '+skill.name+' · Base '+(skill.base??'—')+' + Treino '+(skill.training??'—')+' = '+target;
  row.title='Rolar d100 quando o valor total estiver definido';
  row.onclick=()=>testD100Skill(index);root.append(row);
 }
 for(const power of ent.powers||[]){
  const row=document.createElement('div');row.className='list-item';row.textContent='✨ '+power;root.append(row);
 }
 const note=document.createElement('div');note.className='d100-note';
 note.textContent='Perícias: Base + Treino = Total (d100). Fórmulas do sistema principal ainda precisam ser sincronizadas.';
 root.append(note);
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
  if(canMoveTo(ent.floor,x,ent.y))ent.x=x;
  if(canMoveTo(ent.floor,ent.x,y))ent.y=y;
  ent.facingX=dx;ent.facingY=dy;ent.walkingUntil=now+100;
 }
}
function toggleSelectedSkeletonAI(){
 const ent=getSelectedEntity();
 if(!ent||ent.ai?.kind!=='skeleton')return;
 ent.ai.enabled=!ent.ai.enabled;
 ent.ai.state=ent.ai.enabled?'vigiar':'desativada';
 updateUI();saveBank();
}
