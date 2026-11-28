let gmCreatureAttack=null;
const creatureAttackReady=new WeakMap();
let creatureStrike=null;

function gmCombatCreature(){
 if(state.mode!=='gm')return null;
 const ent=gmActors().find(actor=>actor.id===gmPreviewId)||getGmControlledEntity();
 return ent?.hp>0&&combatCreature(ent)?ent:null;
}
function refreshCreatureCombatControls(){
 const ent=gmCombatCreature();
 const toggle=document.getElementById('gmCreatureAuto');
 document.getElementById('gmCreatureCombat').hidden=!ent;
 toggle.checked=Boolean(ent?.autoCreatureAttack);
 document.getElementById('gmCreatureAttack').setAttribute('aria-pressed',String(Boolean(ent&&gmCreatureAttack===ent)));
}
function armCreatureAttack(){
 const ent=gmCombatCreature();
 if(!ent)return;
 if(gmRestoreArmed)toggleGmRestore();
 gmRosterPlacementIds=null;gmPlacementTemplate=null;
 gmCreatureAttack=gmCreatureAttack===ent?null:ent;
 refreshCreatureCombatControls();
 gmRestoreNotice(gmCreatureAttack?'Clique no personagem que a criatura vai atacar.':'');
}
function setCreatureAutonomy(enabled){
 const ent=gmCombatCreature();
 if(!ent)return;
 beginEdit();ent.autoCreatureAttack=enabled;finishEdit();saveBank();
 refreshCreatureCombatControls();
}

function creatureMeleeAttack(attacker,target,floor,now){
 if(attacker.hp<=0||target.hp<=0||Math.hypot(target.x-attacker.x,target.y-attacker.y)>creatureAttackReach(attacker)||
   crossesWall(floor,attacker.x,attacker.y,target.x,target.y))return false;
 if((creatureAttackReady.get(attacker)||0)>now)return false;
 creatureAttackReady.set(attacker,now+1800);
 const chance=Math.max(5,Math.min(95,attacker.skillsD100?.find(s=>/combate desarmado/i.test(s.name)&&Number.isFinite(s.total))?.total||
   (attacker.attrs.FOR+attacker.attrs.DES)));
 const roll=Math.floor(Math.random()*100)+1;
 creatureStrike={floor,x0:attacker.x,y0:attacker.y,x:target.x,y:target.y,hit:roll<=chance,until:now+270};
 if(roll<=chance){
   const damage=1+Math.floor(Math.random()*6)+Math.max(0,Math.floor((attacker.attrs.FOR-10)/5));
   beginEdit();target.hp=Math.max(0,target.hp-damage);finishEdit();updateUI();saveBank();
 }
 const message=attacker.name+' → '+target.name+' · '+translateSiteText(roll<=chance?'Acertou.':'Errou.')+' D100 '+roll+'/'+chance+'% · '+target.hp+'/'+target.maxHp+' PV';
 if(state.mode==='player')worldNotice(message);else gmRestoreNotice(message);
 return true;
}
function creatureAttackReach(attacker){
 return 32+(attacker.creature?creatureMapWidth(attacker)*.22:8);
}
function handleCreatureAttackClick(x,y){
 const attacker=gmCreatureAttack;
 if(!attacker)return false;
 gmCreatureAttack=null;refreshCreatureCombatControls();
 const target=gmActors().filter(ent=>ent.type==='pc'&&ent.hp>0&&Math.hypot(ent.x-x,ent.y-y)<28)
   .sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
 if(!gmActors().includes(attacker)||!target||!creatureMeleeAttack(attacker,target,getScene().floors[state.currentFloor],performance.now()))
   gmRestoreNotice('Ataque indisponível. Selecione um personagem vivo, próximo e sem parede no caminho.');
 return true;
}
function updateCreatureAutonomy(elapsed){
 if(state.mode==='architect'||document.querySelector('dialog[open]'))return;
 const floor=getScene().floors[state.currentFloor],now=performance.now();
 const actors=gmActors();
 const players=actors.filter(ent=>ent.type==='pc'&&ent.hp>0);
 const controlled=getGmControlledEntity();
 for(const attacker of actors){
   if(!attacker.autoCreatureAttack||attacker.hp<=0||attacker===controlled||attacker.sleepPose||!combatCreature(attacker))continue;
   const target=players.filter(ent=>ent.hp>0&&!crossesWall(floor,attacker.x,attacker.y,ent.x,ent.y))
     .sort((a,b)=>Math.hypot(a.x-attacker.x,a.y-attacker.y)-Math.hypot(b.x-attacker.x,b.y-attacker.y))[0];
   if(!target)continue;
   const dx=target.x-attacker.x,dy=target.y-attacker.y,distance=Math.hypot(dx,dy);
   if(distance>170)continue;
   if(distance<=creatureAttackReach(attacker)){creatureMeleeAttack(attacker,target,floor,now);continue;}
   const step=Math.min(4,elapsed*58),x=attacker.x+dx/distance*step,y=attacker.y+dy/distance*step;
   if(canMoveTo(attacker.floor,x,y)){
     attacker.x=x;attacker.y=y;markEntityWalking(attacker,130);
   }
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
