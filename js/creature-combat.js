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

function creatureMeleeAttack(attacker,target,floor,now,move=null){
 if(attacker.hp<=0||target.hp<=0||Math.hypot(target.x-attacker.x,target.y-attacker.y)>creatureAttackReach(attacker)||
   crossesWall(floor,attacker.x,attacker.y,target.x,target.y))return false;
 if((creatureAttackReady.get(attacker)||0)>now)return false;
 creatureAttackReady.set(attacker,now+1800);
 const chance=Math.max(5,Math.min(95,attacker.skillsD100?.find(s=>(move?.skill?s.name===move.skill:/combate desarmado/i.test(s.name))&&Number.isFinite(s.total))?.total||
   (attacker.attrs.FOR+attacker.attrs.DES)));
 const roll=Math.floor(Math.random()*100)+1;
 creatureStrike={floor,x0:attacker.x,y0:attacker.y,x:target.x,y:target.y,hit:roll<=chance,until:now+270};
 markBattleMotion(attacker,'melee',target.x-attacker.x,target.y-attacker.y);
 if(roll<=chance){
   markBattleMotion(target,'hit',target.x-attacker.x,target.y-attacker.y);
   const profile=move?.damage?.match(/^(\d+)d(\d+)(?:([+-])(\d+|MD))?$/i);
   const bonus=Math.max(0,Math.floor((attacker.attrs.FOR-10)/5));
   let damage=0;
   for(let i=0;i<Number(profile?.[1]||1);i++)damage+=1+Math.floor(Math.random()*Number(profile?.[2]||6));
   if(!profile||profile[4]?.toUpperCase()==='MD')damage+=bonus;
   else if(profile[4])damage+=Number(profile[3]+profile[4]);
   damage=Math.max(0,damage);
   beginEdit();target.hp=Math.max(0,target.hp-damage);finishEdit();updateUI();saveBank();
 }
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
 const target=gmActors().filter(ent=>ent.type==='pc'&&ent.hp>0&&
   (Math.hypot(ent.x-x,ent.y-y)<24||Math.hypot(ent.x-x,ent.y-15-y)<22))
   .sort((a,b)=>Math.hypot(a.x-x,a.y-7-y)-Math.hypot(b.x-x,b.y-7-y))[0];
 if(!gmActors().includes(attacker)||!target){
   creatureCombatNotice('Clique em um personagem jogador vivo para escolher o alvo.');
   return true;
 }
 gmCreatureAttack=null;
 gmCreatureOrder={attacker,target,move:armedCreatureMove};
 refreshCreatureCombatControls();
 creatureCombatNotice(translateSiteText('Alvo selecionado.')+' '+target.name);
 return true;
}
function advanceCreatureAttack(attacker,target,floor,now,elapsed,move=null){
 if(crossesWall(floor,attacker.x,attacker.y,target.x,target.y))return 'blocked';
 const dx=target.x-attacker.x,dy=target.y-attacker.y,distance=Math.hypot(dx,dy);
 if(distance<=creatureAttackReach(attacker)){
   return creatureMeleeAttack(attacker,target,floor,now,move)?'done':'waiting';
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
function updateCreatureAutonomy(elapsed){
 if(state.mode==='architect'||document.querySelector('dialog[open]'))return;
 const floor=getScene().floors[state.currentFloor],now=performance.now();
 const actors=gmActors(),players=actors.filter(ent=>ent.type==='pc'&&ent.hp>0);
 const orderedAttacker=gmCreatureOrder?.attacker;
 if(gmCreatureOrder){
   const {attacker,target,move}=gmCreatureOrder;
   if(state.mode!=='gm'||attacker.hp<=0||!actors.includes(attacker)||!players.includes(target))gmCreatureOrder=null;
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
   const target=players.filter(ent=>ent.hp>0&&Math.hypot(ent.x-attacker.x,ent.y-attacker.y)<=170&&
     !crossesWall(floor,attacker.x,attacker.y,ent.x,ent.y))
     .sort((a,b)=>Math.hypot(a.x-attacker.x,a.y-attacker.y)-Math.hypot(b.x-attacker.x,b.y-attacker.y))[0];
   if(target)advanceCreatureAttack(attacker,target,floor,now,elapsed);
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
