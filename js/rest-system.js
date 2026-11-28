// Night rest uses the map clock. Short breaks and sprinting use elapsed play time.
const REST_SEATS={
 chair:[34,34,1], bench:[78,32,2], armchair:[47,46,1],
 sofa:[98,49,2], sofaBlue:[98,49,2], sofaRed:[98,49,2], sofaGreen:[98,49,2],
 sofaBooth:[112,52,3], loungeChair:[47,46,1], loungeSofa:[106,50,3], cushions:[38,34,1]
};
const DAY_MINUTES=1440, NIGHT_START=1320, NIGHT_END=360;
const restMenuText={
 'Sentar no chão':'坐在地上','Sentar':'坐下','Levantar':'起身','Dormir 1 hora':'睡一小时','Dormir 8 horas':'睡八小时',
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
function updateRestControls(){
 const ent=activeActor();
 for(const id of ['playerRestControls','gmRestControls']){
  const panel=document.getElementById(id);
  panel.hidden=id==='gmRestControls'&&(state.mode!=='gm'||!ent);
  panel.querySelector('[data-sit]').disabled=!ent||ent.hp<=0;
  panel.querySelector('[data-sit]').textContent=restLabel(ent?.seatPose||ent?.sleepPose?'Levantar':'Sentar no chão');
  panel.querySelectorAll('[data-sleep]').forEach(button=>{
   button.hidden=ent?.sleepPose!=='sleeping';
   button.textContent=restLabel('Dormir '+button.dataset.sleep+(button.dataset.sleep==='1'?' hora':' horas'));
  });
 }
}
function tickActorFatigue(ent,elapsed,moved,sprinting){
 if(ent.sleepPose==='sleeping')return;
 const rate=moved?(sprinting?3:0):ent.seatPose?-1.5:-.45;
 if(rate)changeFatigue(ent,rate*elapsed);
 if(getSelectedEntity()===ent)showFatigue(ent);
}
function advanceRestClock(start,minutes){
 for(let minute=start;minute<start+minutes;minute++){
  const time=minute%DAY_MINUTES;
  const night=time>=NIGHT_START||time<NIGHT_END;
  for(const ent of state.entities){
   if(!ent.sceneId||ent.hp<=0)continue;
   if(ent.sleepPose==='sleeping'){
    ent.sleepMinutes=(ent.sleepMinutes||0)+1;
    if(night)ent.nightSleepMinutes=(ent.nightSleepMinutes||0)+1;
    if(ent.sleepMinutes>=480)ent.fatigue=0;
    else if(fatigueValue(ent)>1)ent.fatigue=Math.max(1,fatigueValue(ent)-.15);
   }
   if(time===NIGHT_START)ent.nightTracked=true;
   if(time===NIGHT_END-1){
    if(ent.nightTracked&&(ent.nightSleepMinutes||0)<360)ent.fatigue=Math.min(Number.MAX_SAFE_INTEGER,Math.max(1,fatigueValue(ent)*2));
    ent.nightSleepMinutes=0;
    ent.nightTracked=false;
   }
  }
 }
 const selected=getSelectedEntity();if(selected)showFatigue(selected);
}
function sleepForHours(hours){
 const ent=activeActor();
 if(ent?.sleepPose!=='sleeping'||ent.hp<=0)return;
 const start=daylightMinute(),minutes=hours*60;
 advanceRestClock(start,minutes);
 setMapDaylight(start+minutes);
 saveBank();
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
 updateRestControls();
}
function standFromSeat(ent){
 if(!ent.seatPose)return;
 const {x,y}=ent.seatPose;
 delete ent.seatPose;
 ent.x=x;ent.y=y;
 updateRestControls();
}
function toggleGroundSeat(){
 const ent=activeActor();
 if(!ent||ent.hp<=0||ent.sceneId!==state.activeSceneId||ent.stairClimb||liftRides.has(ent))return;
 if(ent.sleepPose){awakenEntity(ent);return;}
 if(ent.seatPose){standFromSeat(ent);return;}
 const floor=getScene().floors[ent.floor];
 if(!floor||waterDepthAt(floor,ent.x,ent.y))return;
 ent.seatPose={x:ent.x,y:ent.y,angle:0};
 updateRestControls();
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
