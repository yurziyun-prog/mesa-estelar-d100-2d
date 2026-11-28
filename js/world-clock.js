const CLOCK_PROPS={clockWall:['Relógio de parede','挂钟'],clockDesk:['Despertador de mesa','桌面闹钟'],clockDigital:['Despertador digital','数字闹钟']};
const CLOCK_ITEMS=new Set(['Relógio de pulso','Comunicador pessoal','Despertador portátil']);
const WORLD_DAY_MS=86400000;
const DEFAULT_WORLD_DATE=Date.UTC(2180,0,1);
const clockText={
 'Alarmes e lembretes':'闹钟与提醒','Adicionar lembrete':'添加提醒','Remover':'删除','Fechar':'关闭',
 'Horário':'时间','Data (opcional)':'日期（可选）','Mensagem':'提醒内容','Alarme':'闹钟',
 'Sentar no chão':'坐在地上','Dormir no chão':'在地上睡觉','Usar cadeira portátil':'使用便携椅',
 'Usar saco de dormir':'使用睡袋','Configurar despertador':'设置闹钟','Local inválido para descansar.':'这里不能休息。',
 'Dormir':'睡觉','Dormir agora?':'现在睡觉吗？','Acordar':'醒来','Levantar':'起身','Sentar':'坐下'
};
function clockLabel(label){return siteLanguage.startsWith('zh')?clockText[label]||label:translateSiteText(label);}
function worldDay(){return Number.isSafeInteger(state.worldDay)?state.worldDay:0;}
function worldDate(){return new Date((state.worldCalendarEpoch??DEFAULT_WORLD_DATE)+worldDay()*WORLD_DAY_MS);}
function worldDateInput(){return worldDate().toISOString().slice(0,10);}
function worldClockStamp(){return worldDay()*DAY_MINUTES+daylightMinute();}
function worldTimeLabel(minute=daylightMinute()){
 return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
}
function worldClockLabel(){
 return new Intl.DateTimeFormat(siteLanguage,{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(worldDate())+' · '+worldTimeLabel();
}
function setWorldDate(value){
 if(state.mode!=='gm'||!value)return;
 const date=Date.parse(value+'T00:00:00Z');
 if(Number.isFinite(date)){state.worldCalendarEpoch=date-worldDay()*WORLD_DAY_MS;updateDaylightControls();saveBank();}
}
function carriesClock(ent){return ent?.inventory?.some(item=>CLOCK_ITEMS.has(item)||isCommunicator(item));}
function updateCharacterClock(){
 const ent=getSelectedEntity(), panel=document.getElementById('characterClock');
 document.getElementById('characterMessagesOpen').hidden=!equippedCommunicator(ent);
 const unread=ent?.unreadCommunications||0;
 document.getElementById('characterMessagesOpen').textContent=(siteLanguage==='zh-CN'?'消息':'Mensagens')+(unread?' ('+unread+')':'');
 panel.hidden=!carriesClock(ent);
 if(panel.hidden)return;
 document.getElementById('characterClockTime').textContent=worldClockLabel();
 document.getElementById('characterClockOpen').textContent=clockLabel('Alarmes e lembretes');
 const notice=document.getElementById('characterClockNotice');
 if(notice.textContent!==(ent.lastWorldReminder||''))notice.textContent=ent.lastWorldReminder||'';
}
let reminderActor=null;
function openWorldReminders(){
 const ent=getSelectedEntity();
 if(!carriesClock(ent)||ent!==activeActor())return;
 reminderActor=ent;
 const dialog=document.getElementById('worldReminderDialog');
 dialog.querySelectorAll('[data-clock-label]').forEach(node=>node.textContent=clockLabel(node.dataset.clockLabel));
 dialog.querySelector('[name=time]').value=worldTimeLabel();
 dialog.querySelector('[name=date]').value='';
 dialog.querySelector('[name=message]').value='';
 renderWorldReminders();
 dialog.showModal();
}
function renderWorldReminders(){
 const root=document.getElementById('worldReminderList');
 root.replaceChildren(...(reminderActor?.worldReminders||[]).map(reminder=>{
  const row=document.createElement('div');
  const time=document.createElement('span');
  const date=new Date((state.worldCalendarEpoch??DEFAULT_WORLD_DATE)+Math.floor(reminder.at/DAY_MINUTES)*WORLD_DAY_MS);
  time.textContent=date.toISOString().slice(0,10)+' '+worldTimeLabel(reminder.at%DAY_MINUTES)+' · '+reminder.message+' ';
  const remove=document.createElement('button');remove.type='button';remove.className='btn';remove.textContent=clockLabel('Remover');
  remove.onclick=()=>{reminderActor.worldReminders=reminderActor.worldReminders.filter(entry=>entry!==reminder);saveBank();renderWorldReminders();};
  row.append(time,remove);return row;
 }));
}
function nextWorldAlarm(time,date=''){
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return null;
 const [hour,minute]=time.split(':').map(Number);
 const day=date?Math.round((Date.parse(date+'T00:00:00Z')-(state.worldCalendarEpoch??DEFAULT_WORLD_DATE))/WORLD_DAY_MS):worldDay();
 let target=day*DAY_MINUTES+hour*60+minute;
 const now=worldClockStamp();
 if(!date&&target<=now)target+=DAY_MINUTES;
 return Number.isFinite(target)&&target>now?target:null;
}
function addWorldReminder(form){
 if(reminderActor!==activeActor()||!carriesClock(reminderActor))return;
 const data=new FormData(form), target=nextWorldAlarm(data.get('time'),data.get('date'));
 if(target===null){alert(siteLanguage.startsWith('zh')?'请选择未来的时间。':'Escolha um horário futuro.');return;}
 const message=String(data.get('message')).trim()||clockLabel('Alarme');
 (reminderActor.worldReminders??=[]).push({at:target,message});
 reminderActor.worldReminders.sort((a,b)=>a.at-b.at);
 saveBank();renderWorldReminders();
}
function ringWorldAlarm(ent,message,personal=false){
 if(ent.sleepPose==='sleeping')awakenEntity(ent);
 if(personal)ent.lastWorldReminder='⏰ '+message;
 else say(ent,'⏰ '+message);
 if(ent===activeActor())playGameSound('alarm',.28);
}
function checkWorldAlarms(to){
 let changed=false;
 for(const ent of state.entities){
  if(!carriesClock(ent))continue;
  const due=ent.worldReminders?.filter(reminder=>reminder.at<=to)||[];
  if(due.length){
   ent.worldReminders=ent.worldReminders.filter(reminder=>reminder.at>to);
   ringWorldAlarm(ent,due.map(reminder=>reminder.message).join(' · '),true);changed=true;
  }
 }
 for(const [sceneId,scene] of Object.entries(state.scenes)){
  scene.floors.forEach((floor,index)=>{
   for(const prop of floor.props){
    if(!CLOCK_PROPS[prop.type]||!Number.isFinite(prop.alarmAt)||prop.alarmAt>to)continue;
    delete prop.alarmAt;changed=true;
    for(const ent of state.entities){
     if(ent.sceneId===sceneId&&ent.floor===index&&ent.hp>0&&Math.hypot(ent.x-prop.x,ent.y-prop.y)<=110)ringWorldAlarm(ent,clockLabel('Alarme'));
    }
   }
  });
 }
 return changed;
}
function configureFurnitureAlarm(prop){
 const time=prompt(clockLabel('Configurar despertador')+' (HH:MM)',worldTimeLabel());
 if(time===null)return;
 if(!time.trim()){delete prop.alarmAt;saveBank();return;}
 const target=nextWorldAlarm(time.trim());
 if(target!==null){prop.alarmAt=target;saveBank();}
}
function drawClockFurniture(prop){
 if(!CLOCK_PROPS[prop.type])return false;
 ctx.save();ctx.translate(prop.x,prop.y);ctx.rotate((prop.rot||0)*Math.PI/2);
 if(prop.type==='clockDigital'){
  ctx.fillStyle='#283747';ctx.beginPath();ctx.roundRect(-18,-10,36,20,4);ctx.fill();
  ctx.fillStyle='#8bfade';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText(worldTimeLabel(),0,3);
 }else{
  const radius=prop.type==='clockWall'?15:11;
  ctx.fillStyle='#5a3f35';ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#eee0bb';ctx.beginPath();ctx.arc(0,0,radius-3,0,Math.PI*2);ctx.fill();
  const minute=daylightMinute();
  for(const [fraction,length] of [[minute/720,radius*.45],[minute/60,radius*.67]]){
   const angle=fraction*2*Math.PI-Math.PI/2;
   ctx.strokeStyle='#30282a';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(angle)*length,Math.sin(angle)*length);ctx.stroke();
  }
 }
 ctx.restore();return true;
}
function hoveredFurnitureClock(){
 if(!tokenPointer||isPanning)return;
 const {wx,wy}=screenToWorld(tokenPointer.x,tokenPointer.y);
 const actor=activeActor();
 const floor=getScene().floors[state.currentFloor];
 const clock=floor?.props.find(prop=>CLOCK_PROPS[prop.type]&&Math.hypot(prop.x-wx,prop.y-wy)<20*(prop.scale||1)&&
  (state.mode!=='player'||actor?.floor===state.currentFloor&&Math.hypot(actor.x-prop.x,actor.y-prop.y)<110));
 if(clock)hoveredToken={name:worldClockLabel(),distance:0};
}
