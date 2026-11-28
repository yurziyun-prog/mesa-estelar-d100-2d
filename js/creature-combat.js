let gmCreatureAttack=null;
let gmCreatureOrder=null;
let armedCreatureMove=null;
let displayedCreature=null;
const creatureAttackReady=new WeakMap();
let creatureStrike=null;

const tokenBattleMotion=new WeakMap();
function markBattleMotion(ent,kind,dx=0,dy=0){
 const length=Math.hypot(dx,dy)||1;
 tokenBattleMotion.set(ent,{kind,dx:dx/length,dy:dy/length,started:performance.now()});
}
function tokenBattlePose(ent,now){
 const motion=tokenBattleMotion.get(ent);
 if(!motion||terrainMotionPreference.matches)return null;
 const progress=(now-motion.started)/290;
 if(progress<0||progress>=1)return null;
 const force=Math.sin(progress*Math.PI)*(motion.kind==='melee'?8:motion.kind==='fire'?-4:5);
 return {x:motion.dx*force,y:motion.dy*force,kind:motion.kind,tilt:motion.dx*force*.022};
}

function gmCombatCreature(){
 if(state.mode!=='gm')return null;
 const controlled=getGmControlledEntity();
 const ent=controlled&&combatCreature(controlled)?controlled:gmActors().find(actor=>actor.id===gmPreviewId);
 return ent?.hp>0&&combatCreature(ent)?ent:null;
}
function creatureMoveList(ent){
 const sheet=ent?.mesaSourceSheet;
 const links=Object.fromEntries(String(sheet?.vinculosAtaquesPericias||'').split('|').map(line=>line.split(':')).filter(parts=>parts.length===2));
 return String(sheet?.armasTexto||'').split('|').flatMap(line=>{
   const match=line.trim().match(/^(.+?):\s*(\d+d\d+(?:[+-](?:\d+|MD))?|0)$/i);
   if(!match)return [];
   const [,name,damage]=match;
   return [{name,damage,skill:links[name]}];
 });
}
function creatureCombatNotice(message){
 document.getElementById('gmCreatureStatus').textContent=translateSiteText(message);
}
function refreshCreatureCombatControls(){
 const ent=gmCombatCreature();
 const toggle=document.getElementById('gmCreatureAuto');
 document.getElementById('gmCreatureCombat').hidden=!ent;
 if(displayedCreature!==ent){
   displayedCreature=ent;
   const select=document.getElementById('gmCreatureMove');
   select.replaceChildren(new Option(translateSiteText('Ataque básico'),''));
   creatureMoveList(ent).forEach((move,i)=>select.add(new Option(move.name+' · '+move.damage,String(i))));
   const text=ent?.mesaSourceSheet?.habilidadesTexto||'';
   document.getElementById('gmCreatureActivities').hidden=!text;
   document.getElementById('gmCreatureActivityText').textContent=text;
 }
 toggle.checked=Boolean(ent?.autoCreatureAttack);
 document.getElementById('gmCreatureAttack').setAttribute('aria-pressed',String(Boolean(ent&&gmCreatureAttack===ent)));
}
function armCreatureAttack(){
 const ent=gmCombatCreature();
 if(!ent)return;
 const value=document.getElementById('gmCreatureMove').value;
 armedCreatureMove=value===''?null:creatureMoveList(ent)[Number(value)];
 if(armedCreatureMove?.damage==='0'){
   const skill=ent.skillsD100?.find(skill=>skill.name===armedCreatureMove.skill&&Number.isFinite(skill.total));
   const result=skill?' · D100 '+(Math.floor(Math.random()*100)+1)+' / '+skill.total+'%':'';
   const message=ent.name+' · '+armedCreatureMove.name+result;
   creatureCombatNotice(message);logEvent(message);
   return;
 }
 if(gmRestoreArmed)toggleGmRestore();
 gmRosterPlacementIds=null;gmPlacementTemplate=null;
 gmCreatureOrder=null;
 gmCreatureAttack=gmCreatureAttack===ent?null:ent;
 refreshCreatureCombatControls();
 creatureCombatNotice(gmCreatureAttack?'Clique no personagem que a criatura vai atacar.':'');
}
function setCreatureAutonomy(enabled){
 const ent=gmCombatCreature();
 if(!ent)return;
 beginEdit();ent.autoCreatureAttack=enabled;finishEdit();saveBank();
 refreshCreatureCombatControls();
}

function creatureMeleeAttack(attacker,target,floor,now,move=null,hunt=false){
 if(attacker.hp<=0||target.hp<=0||Math.hypot(target.x-attacker.x,target.y-attacker.y)>creatureAttackReach(attacker)||
   crossesWall(floor,attacker.x,attacker.y,target.x,target.y))return false;
 if((creatureAttackReady.get(attacker)||0)>now)return false;
 creatureAttackReady.set(attacker,now+1800);
 const chance=Math.max(5,Math.min(95,attacker.skillsD100?.find(s=>(move?.skill?s.name===move.skill:/combate desarmado/i.test(s.name))&&Number.isFinite(s.total))?.total||
   (attacker.attrs.FOR+attacker.attrs.DES)));
 const roll=Math.floor(Math.random()*100)+1;
 creatureStrike={floor,x0:attacker.x,y0:attacker.y,x:target.x,y:target.y,hit:roll<=chance,until:now+270};
 playGameSound('melee',.29);
 if(roll<=chance)playGameSound('hit',.24);
 markBattleMotion(attacker,'melee',target.x-attacker.x,target.y-attacker.y);
 if(roll<=chance){
   markBattleMotion(target,'hit',target.x-attacker.x,target.y-attacker.y);
   const profile=move?.damage?.match(/^(\d+)d(\d+)(?:([+-])(\d+|MD))?$/i);
   const bonus=Math.max(0,Math.floor((attacker.attrs.FOR-10)/5));
   let damage=0;
   for(let i=0;i<Number(profile?.[1]||1);i++)damage+=1+Math.floor(Math.random()*Number(profile?.[2]||6));
   if(!profile||profile[4]?.toUpperCase()==='MD')damage+=bonus;
   else if(profile[4])damage+=Number(profile[3]+profile[4]);
   damage=damageAfterArmor(target,Math.max(0,damage));
   beginEdit();target.hp=Math.max(0,target.hp-damage);
   noteCreatureAttacked(target,attacker,damage);
   if(hunt&&target.hp<=0)attacker.hunger=Math.min(100,attacker.hunger+55);
   finishEdit();updateUI();saveBank();
 }
 if(roll>chance)noteCreatureAttacked(target,attacker);
 const message=attacker.name+(move?' · '+move.name:'')+' → '+target.name+' · '+translateSiteText(roll<=chance?'Acertou.':'Errou.')+' D100 '+roll+'/'+chance+'% · '+target.hp+'/'+target.maxHp+' PV';
 if(state.mode==='player')worldNotice(message);else creatureCombatNotice(message);
 return true;
}
function creatureAttackReach(attacker){
 return 32+(attacker.creature?creatureMapWidth(attacker)*.22:8);
}
function handleCreatureAttackClick(x,y){
 const attacker=gmCreatureAttack;
 if(!attacker)return false;
 const target=gmActors().filter(ent=>ent!==attacker&&ent.hp>0&&(ent.type==='pc'||ent.type==='npc'||combatCreature(ent))&&
   (Math.hypot(ent.x-x,ent.y-y)<24||Math.hypot(ent.x-x,ent.y-15-y)<22))
   .sort((a,b)=>Math.hypot(a.x-x,a.y-7-y)-Math.hypot(b.x-x,b.y-7-y))[0];
 if(!gmActors().includes(attacker)||!target){
   creatureCombatNotice('Clique em um alvo vivo: personagem, NPC ou criatura.');
   return true;
 }
 gmCreatureAttack=null;
 gmCreatureOrder={attacker,target,move:armedCreatureMove};
 refreshCreatureCombatControls();
 creatureCombatNotice(translateSiteText('Alvo selecionado.')+' '+target.name);
 return true;
}
function advanceCreatureAttack(attacker,target,floor,now,elapsed,move=null,hunt=false){
 if(crossesWall(floor,attacker.x,attacker.y,target.x,target.y))return 'blocked';
 const dx=target.x-attacker.x,dy=target.y-attacker.y,distance=Math.hypot(dx,dy);
 if(distance<=creatureAttackReach(attacker)){
   return creatureMeleeAttack(attacker,target,floor,now,move,hunt)?'done':'waiting';
 }
 const speed=Math.min(4,elapsed*65);
 const stepX=dx/distance*speed,stepY=dy/distance*speed;
 for(const [x,y] of [[attacker.x+stepX,attacker.y+stepY],[attacker.x+stepX,attacker.y],[attacker.x,attacker.y+stepY]]){
   if((x===attacker.x&&y===attacker.y)||!canWalkStep(attacker,x,y))continue;
   attacker.x=x;attacker.y=y;markEntityWalking(attacker,130);
   return 'moving';
 }
 return 'blocked';
}
const creatureBehaviour=new WeakMap();
const creatureHungerClock=new WeakMap();

function noteCreatureAttacked(creature,attacker,damage=0){
 if(!combatCreature(creature)||creature===attacker)return;
 const now=performance.now();
 const previous=creatureBehaviour.get(creature);
 const fleeUntil=creature.hp>0&&damage>0&&(creature.hp<=creature.maxHp*.25||damage>=creature.maxHp*.4)
   ?now+6500:previous?.fleeUntil||0;
 creatureBehaviour.set(creature,{target:attacker,provokedUntil:now+11000,fleeUntil});
}

function creatureSpeciesKey(ent){
 const sheet=ent.mesaSourceSheet;
 return String(sheet?.especie||sheet?.raca||ent.spawnedFrom||ent.species||ent.name)
   .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}

function creatureIsOrganic(ent){
 const species=creatureSpeciesKey(ent);
 return !/^(robo|maquina|sentinela|drone)/.test(species);
}

function creaturePower(ent){
 return (ent.attrs?.FOR||10)+(ent.attrs?.TAM||10)+ent.hp;
}

function closestCreatureTarget(attacker,candidates,floor,range){
 let closest=null,best=range;
 for(const target of candidates){
   const distance=Math.hypot(target.x-attacker.x,target.y-attacker.y);
   if(distance>best||crossesWall(floor,attacker.x,attacker.y,target.x,target.y))continue;
   closest=target;best=distance;
 }
 return closest;
}
function fleeCreature(attacker,threat,elapsed){
 const dx=attacker.x-threat.x,dy=attacker.y-threat.y;
 const angle=Math.atan2(dy,dx);
 const speed=Math.min(4,elapsed*98);
 for(const turn of [0,.6,-.6,1.15,-1.15]){
   const x=attacker.x+Math.cos(angle+turn)*speed,y=attacker.y+Math.sin(angle+turn)*speed;
   if(!canWalkStep(attacker,x,y))continue;
   attacker.x=x;attacker.y=y;markEntityWalking(attacker,130);
   break;
 }
}
function chooseCreatureBehaviour(attacker,actors,players,floor,now){
 const memory=creatureBehaviour.get(attacker);
 const threat=memory?.target;
 if(threat&&actors.includes(threat)&&threat.hp>0&&memory.fleeUntil>now)
   return {target:threat,flee:true};
 if(threat&&actors.includes(threat)&&threat.hp>0&&memory.provokedUntil>now&&Math.hypot(threat.x-attacker.x,threat.y-attacker.y)<=300)
   return {target:threat};
 if(attacker.attitude==='Hostil'){
   const target=closestCreatureTarget(attacker,players,floor,170);
   if(target)return {target};
 }
 if(attacker.attitude==='Aliado'||!creatureIsOrganic(attacker)||attacker.hunger>30)return null;
 const species=creatureSpeciesKey(attacker);
 const prey=actors.filter(target=>target!==attacker&&target.hp>0&&creatureIsOrganic(target)&&
   (target.type==='pc'||combatCreature(target))&&creatureSpeciesKey(target)!==species&&creaturePower(target)<creaturePower(attacker)*.82);
 const target=closestCreatureTarget(attacker,prey,floor,120);
 return target?{target,hunt:true}:null;
}

function updateCreatureAutonomy(elapsed){
 if(state.mode==='architect'||document.querySelector('dialog[open]'))return;
 const floor=getScene().floors[state.currentFloor],now=performance.now();
 const actors=gmActors(),players=actors.filter(ent=>ent.type==='pc'&&ent.hp>0);
 const orderedAttacker=gmCreatureOrder?.attacker;
 if(gmCreatureOrder){
   const {attacker,target,move}=gmCreatureOrder;
   if(state.mode!=='gm'||attacker.hp<=0||!actors.includes(attacker)||!actors.includes(target)||target.hp<=0)gmCreatureOrder=null;
   else {
     const result=advanceCreatureAttack(attacker,target,floor,now,elapsed,move);
     if(result==='done'||result==='blocked')gmCreatureOrder=null;
     if(result==='blocked')creatureCombatNotice('O caminho ou a linha de ataque está bloqueada.');
   }
 }
 const manualMovement=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].some(key=>keys[key]);
 for(const attacker of actors){
   if(!attacker.autoCreatureAttack||attacker.hp<=0||attacker===orderedAttacker||
      attacker===draggingEntity||attacker===gmCreatureAttack||attacker.sleepPose||!combatCreature(attacker))continue;
   if(attacker===getGmControlledEntity()&&manualMovement)continue;
   if(creatureIsOrganic(attacker)){
     const seconds=(creatureHungerClock.get(attacker)||0)+elapsed;
     if(seconds>=30){attacker.hunger=Math.max(0,attacker.hunger-1);creatureHungerClock.set(attacker,seconds-30);}
     else creatureHungerClock.set(attacker,seconds);
   }
   const behaviour=chooseCreatureBehaviour(attacker,actors,players,floor,now);
   if(!behaviour)continue;
   if(behaviour.flee)fleeCreature(attacker,behaviour.target,elapsed);
   else advanceCreatureAttack(attacker,behaviour.target,floor,now,elapsed,null,behaviour.hunt);
 }
}
function drawCreatureStrike(floor){
 if(creatureStrike?.floor!==floor)return;
 const {x0,y0,x,y,hit,until}=creatureStrike;
 const remaining=(until-performance.now())/270;
 if(remaining<=0)return;
 const angle=Math.atan2(y-y0,x-x0);
 ctx.save();ctx.translate(x,y-4);ctx.rotate(angle);
 ctx.globalAlpha=remaining;ctx.strokeStyle=hit?'#ffc097':'#c5c8c4';ctx.lineWidth=2;
 for(const offset of [-4,0,4]){
   ctx.beginPath();ctx.moveTo(-16,offset-7);ctx.quadraticCurveTo(-2,offset-5,3,offset+4);ctx.stroke();
 }
 ctx.restore();
}
