// Night rest uses the map clock. Short breaks and sprinting use elapsed play time.
const REST_SEATS={
 chair:[34,34,1], bench:[78,32,2], armchair:[47,46,1],
 sofa:[98,49,2], sofaBlue:[98,49,2], sofaRed:[98,49,2], sofaGreen:[98,49,2],
 sofaBooth:[112,52,3], loungeChair:[47,46,1], loungeSofa:[106,50,3], cushions:[38,34,1]
};
const DAY_MINUTES=1440, NIGHT_START=1320, NIGHT_END=360;
const restMenuText={
 'Este assento está ocupado.':'这个座位已经有人了。','Fadiga':'疲劳'
};
function restLabel(label){return document.documentElement.lang.startsWith('zh')?restMenuText[label]||label:translateSiteText(label);}
function fatigueValue(ent){return Math.max(0,Number(ent.fatigue)||0);}
function changeFatigue(ent,amount){ent.fatigue=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,fatigueValue(ent)+amount));}
function showFatigue(ent){
 const value=fatigueValue(ent);
 document.getElementById('fatigueText').textContent=Math.ceil(value).toLocaleString();
 document.getElementById('fatigueBar').style.width=Math.min(value,100)+'%';
}
function tickActorFatigue(ent,elapsed,moved,sprinting){
 if(ent.sleepPose==='sleeping')return;
 const restRate=ent.seatPose?(ent.seatPose.ground?.035:.045):.02;
 const rate=moved?(sprinting?3:0):-(state.daylightAuto===false?0:restRate*(state.daylightRate||1));
 if(rate)changeFatigue(ent,rate*elapsed);
 if(getSelectedEntity()===ent)showFatigue(ent);
}
function advanceRestClock(start,minutes){
 let shouldSave=false;
 for(let minute=start;minute<start+minutes;minute++){
  const time=minute%DAY_MINUTES;
  const night=time>=NIGHT_START||time<NIGHT_END;
  for(const ent of state.entities){
   if(!ent.sceneId||ent.hp<=0)continue;
   if(ent.sleepPose==='sleeping'){
    ent.sleepMinutes=(ent.sleepMinutes||0)+1;
    if(night)ent.nightSleepMinutes=(ent.nightSleepMinutes||0)+1;
    const onGround=ent.sleepBed?.type==='ground';
    if(fatigueValue(ent)>1)ent.fatigue=Math.max(1,fatigueValue(ent)-(onGround?.06:.15));
    if(ent.sleepMinutes>=480){
     if(!onGround)ent.fatigue=0;
     awakenEntity(ent);
     shouldSave=true;
    }
   }
   if(time===NIGHT_START)ent.nightTracked=true;
   if(time===NIGHT_END-1){
    if(ent.nightTracked&&(ent.nightSleepMinutes||0)<360)ent.fatigue=Math.min(Number.MAX_SAFE_INTEGER,Math.max(1,fatigueValue(ent)*2));
    ent.nightSleepMinutes=0;
    ent.nightTracked=false;
   }
  }
  shouldSave=checkWorldAlarms(minute+1)||shouldSave;
 }
 const selected=getSelectedEntity();if(selected)showFatigue(selected);
 return shouldSave;
}
function seatBlocksPoint(prop,x,y,radius){
 const [width,height]=REST_SEATS[prop.type];
 const angle=(prop.rot||0)*Math.PI/2+(prop.freeAngle||0),scale=prop.scale||1;
 const dx=x-prop.x,dy=y-prop.y;
 return Math.abs(dx*Math.cos(angle)+dy*Math.sin(angle))<width*scale/2+radius&&
        Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle))<height*scale/2+radius;
}
function sitOnSeat(ent,prop){
 const [width,,slots]=REST_SEATS[prop.type];
 const used=new Set(state.entities.filter(other=>other!==ent&&other.sceneId===ent.sceneId&&other.floor===ent.floor&&
  other.seatPose?.seatX===prop.x&&other.seatPose.seatY===prop.y).map(other=>other.seatPose.slot));
 const slot=Array.from({length:slots},(_,index)=>index).find(index=>!used.has(index));
 if(slot===undefined){say(ent,restLabel('Este assento está ocupado.'));return;}
 const angle=(prop.rot||0)*Math.PI/2+(prop.freeAngle||0);
 const offset=((slot+.5)/slots-.5)*width*.8*(prop.scale||1);
 ent.seatPose={x:ent.x,y:ent.y,angle,seatX:prop.x,seatY:prop.y,slot};
 ent.x=prop.x+offset*Math.cos(angle);
 ent.y=prop.y+offset*Math.sin(angle);

}
function standFromSeat(ent){
 if(!ent.seatPose)return;
 const {x,y}=ent.seatPose;
 delete ent.seatPose;
 ent.x=x;ent.y=y;

}
function openRestMapMenu(sx,sy,clientX,clientY){
 const ent=activeActor();
 if(!ent||ent.hp<=0||ent.sceneId!==state.activeSceneId||ent.floor!==state.currentFloor||ent.stairClimb||liftRides.has(ent))return false;
 const floor=getScene().floors[ent.floor],{wx,wy}=screenToWorld(sx,sy);
 const clock=floor.props.find(p=>CLOCK_PROPS[p.type]&&Math.hypot(p.x-wx,p.y-wy)<=22&&Math.hypot(p.x-ent.x,p.y-ent.y)<=110);
 const seat=floor.props.find(p=>REST_SEATS[p.type]&&seatBlocksPoint(p,wx,wy,0)&&seatBlocksPoint(p,ent.x,ent.y,28));
 const bed=floor.props.find(p=>isSleepingFurniture(p)&&Math.hypot(p.x-ent.x,p.y-ent.y)<85&&
  Math.abs(p.x-wx)<sleepFurnitureSize(p).w*(p.scale||1)/2&&Math.abs(p.y-wy)<sleepFurnitureSize(p).h*(p.scale||1)/2);
 const nearby=Math.hypot(wx-ent.x,wy-ent.y)<=70;
 if(!nearby&&!clock&&!seat&&!bed)return false;
 const entries=[];
 if(clock)entries.push([worldClockLabel(),null],['Configurar despertador',()=>configureFurnitureAlarm(clock)]);
 if(ent.sleepPose)entries.push(['Acordar',()=>awakenEntity(ent)]);
 else if(ent.seatPose)entries.push(['Levantar',()=>standFromSeat(ent)]);
 else if(bed)entries.push(['Dormir',()=>interactWithBed(ent,bed)]);
 else if(seat)entries.push(['Sentar',()=>sitOnSeat(ent,seat)]);
 else if(nearby&&!clock&&!waterDepthAt(floor,ent.x,ent.y)&&!waterDepthAt(floor,wx,wy)){
  entries.push(['Sentar no chão',()=>{ent.seatPose={x:ent.x,y:ent.y,angle:0,ground:true};}]);
  entries.push(['Dormir no chão',()=>startEntitySleep(ent,{x:ent.x,y:ent.y,type:'ground'})]);
  if(ent.inventory.includes('Cadeira portátil'))entries.push(['Usar cadeira portátil',()=>{
   ent.seatPose={x:ent.x,y:ent.y,angle:0,portable:true};}]);
  if(ent.inventory.includes('Saco de dormir'))entries.push(['Usar saco de dormir',()=>startEntitySleep(ent,{x:ent.x,y:ent.y,type:'sleepingBag',portable:true})]);
 }
 if(!entries.length)return false;
 closeArchitectContextMenu();
 const menu=document.createElement('div');
 menu.id='architectContextMenu';menu.className='architect-context-menu';
 for(const [label,action] of entries){
  const row=document.createElement(action?'button':'div');row.textContent=clockLabel(label);
  if(!action)row.className='library-hint';
  if(action){row.type='button';row.onclick=()=>{closeArchitectContextMenu();action();saveBank();};}
  menu.append(row);
 }
 document.body.append(menu);
 menu.style.left=Math.max(0,Math.min(clientX,innerWidth-menu.offsetWidth-6))+'px';
 menu.style.top=Math.max(0,Math.min(clientY,innerHeight-menu.offsetHeight-6))+'px';
 return true;
}
function drawRestSeat(p){
 const size=REST_SEATS[p.type];if(!size)return false;
 const [w,h,slots]=size;
 ctx.save();
 ctx.translate(p.x,p.y);ctx.rotate((p.rot||0)*Math.PI/2);
 const fill=p.color||({chair:'#98684e',bench:'#966247',sofa:'#986577',sofaBlue:'#487897',sofaRed:'#a1545b',sofaGreen:'#548469',sofaBooth:'#436984',cushions:'#aa5957'}[p.type])||'#796b87';
 const box=(x,y,width,height,r,color)=>{
  ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,width,height,r);ctx.fill();
 };
 box(-w/2+3,-h/2+4,w,h,7,'#0005');
 box(-w/2,-h/2,w,h,7,'#312a34');
 box(-w/2+2,-h/2+2,w-4,h-7,6,fill);
 box(-w/2+4,-h/2+4,w-8,h*.29,5,'#0003');
 for(let i=0;i<slots;i++){
  const cushion=(w-18)/slots;
  box(-w/2+9+i*cushion,-h/2+h*.37,cushion-1,h*.47,5,'#fff3');
 }
 if(p.type!=='bench'&&p.type!=='cushions'){
  for(const x of [-w/2+2,w/2-9])box(x,-h/2+5,7,h-12,4,'#3b3039');
 }
 ctx.restore();
 return true;
}
