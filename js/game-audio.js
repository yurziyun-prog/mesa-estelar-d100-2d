const soundClips={
 laser:['laser'],energy:['energy'],shot:['shot'],hit:['hit'],metal:['metal-hit'],
 melee:['melee'],dice:['dice-throw-1','dice-throw-2'],grab:['dice-grab-1'],
 open:['door-open'],close:['door-close'],click:['click'],
 grass:['step-grass-a','step-grass-b'],wood:['step-wood-a','step-wood-b'],stone:['step-stone-a','step-stone-b']
};
const playingSounds=new Set();
const actorStepAt=new WeakMap();
const audioPreference='mesa2d-sound-muted';
let soundMuted=localStorage.getItem(audioPreference)==='true';

function playGameSound(kind,volume=.32){
 const clips=soundClips[kind];
 if(soundMuted||!clips||playingSounds.size>=8||document.hidden)return;
 const clip=clips[Math.floor(Math.random()*clips.length)];
 const voice=new Audio('assets/audio/'+clip+'.ogg');
 voice.volume=volume;
 const release=()=>playingSounds.delete(voice);
 voice.addEventListener('ended',release,{once:true});
 voice.addEventListener('error',release,{once:true});
 playingSounds.add(voice);
 voice.play().catch(release);
}
function refreshGameSoundButton(){
 const button=document.getElementById('gameSoundButton');
 button.textContent=translateSiteText(soundMuted?'🔇 Som desligado':'🔊 Som ligado');
 button.setAttribute('aria-pressed',String(!soundMuted));
}
function toggleGameSound(){
 soundMuted=!soundMuted;
 localStorage.setItem(audioPreference,String(soundMuted));
 if(soundMuted){
   for(const voice of playingSounds)voice.pause();
   playingSounds.clear();
 }
 refreshGameSoundButton();
}
function playActorStep(ent){
 if(soundMuted||ent!==activeActor()||ent.sceneId!==state.activeSceneId||ent.floor!==state.currentFloor)return;
 const now=performance.now();
 if((actorStepAt.get(ent)||0)>now)return;
 actorStepAt.set(ent,now+(keys.shift?210:330));
 const floor=getScene().floors[ent.floor];
 if(waterDepthAt(floor,ent.x,ent.y))return;
 const mat=topMapSurfaceAt(floor,ent.x,ent.y)?.mat||floor.baseTerrain||'';
 const kind=/wood|bridge|madeira/i.test(mat)?'wood':/stone|paving|cobble|marble/i.test(mat)?'stone':'grass';
 playGameSound(kind,.19);
}
function initGameSound(){
 refreshGameSoundButton();
 document.addEventListener('click',event=>{
   const button=event.target.closest?.('button');
   if(!button||button.id==='gameSoundButton'||button.disabled||button.matches('[data-dice]'))return;
   if(button.matches('.mode-btn, [data-world-action], #gmCreatureAttack'))playGameSound('click',.14);
 });
}
