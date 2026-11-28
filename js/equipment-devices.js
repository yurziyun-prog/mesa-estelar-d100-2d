const COMMUNICATORS=new Set(['Comunicador pessoal','Comunicador portátil','Comunicador Completo']);
function isCommunicator(name){return COMMUNICATORS.has(name);}
function twoHandedItem(name){
 const item=characterItems[name];
 return item?.slot==='hand'&&/rifle|carabina|canhao|lancador|escopeta|metralhadora|lanca|cajado|^arco|besta/.test(normalizeEquipmentName(item.data?.id||name));
}
function normalizeEquipmentName(name){
 return String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function canEquipInSlot(name,slot){
 const preferred=characterItems[name]?.slot;
 return Boolean(preferred)&&(preferred===slot||preferred==='hand'&&slot==='leftHand'&&!twoHandedItem(name));
}
function setEquippedItem(ent,name,slot,fromSlot){
 const equipment=ent.equipment??={};
 if(fromSlot&&fromSlot!==slot){delete equipment[fromSlot];clearEquipmentLight(ent,fromSlot);}
 if(slot==='leftHand'&&twoHandedItem(equipment.hand)){delete equipment.hand;clearEquipmentLight(ent,'hand');}
 if(slot==='hand'&&twoHandedItem(name)){delete equipment.leftHand;clearEquipmentLight(ent,'leftHand');}
 if(equipment[slot]!==name)clearEquipmentLight(ent,slot);
 equipment[slot]=name;
}
function migrateEquipmentSlots(ent){
 const equipment=ent.equipment;
 if(!equipment?.light)return;
 if(!equipment.leftHand&&!twoHandedItem(equipment.hand)){
  equipment.leftHand=equipment.light;
  if(ent.lanternLit)(ent.equipmentLights??={}).leftHand=equipment.light;
 }
 delete equipment.light;
 delete ent.lanternLit;
}
function equipmentLightCapable(ent,slot){
 const name=ent.equipment?.[slot];
 if(slot==='head')return Boolean(name&&/capacete/.test(normalizeEquipmentName(name)));
 if(slot==='wrist')return isCommunicator(name);
 return characterItems[name]?.use==='light';
}
function equipmentLightOn(ent,slot){
 return Boolean(ent.equipmentLights?.[slot]&&ent.equipmentLights[slot]===ent.equipment?.[slot]&&equipmentLightCapable(ent,slot));
}
function clearEquipmentLight(ent,slot){if(ent.equipmentLights)delete ent.equipmentLights[slot];}
function toggleEquipmentLight(ent,slot){
 if(ent!==getSelectedEntity()||!['gm','player'].includes(state.mode)||!equipmentLightCapable(ent,slot))return;
 beginEdit();
 if(equipmentLightOn(ent,slot))clearEquipmentLight(ent,slot);
 else (ent.equipmentLights??={})[slot]=ent.equipment[slot];
 finishEdit();updateUI();saveBank();
}
function damageAfterArmor(target,damage,penetration=0){
 const worn=['body','head','feet'].map(slot=>Number(characterItems[target.equipment?.[slot]]?.data?.pa)||0);
 const sheet=target.mesaSourceSheet||{};
 const specified=target.naturalArmor??sheet.armaduraNatural??sheet.paNatural??sheet.pa??(typeof sheet.armadura==='number'?sheet.armadura:undefined);
 const form=target.creature?.form;
 const natural=specified!==undefined&&specified!==null&&specified!==''?Number(specified)||0:
   ({rock:4,reptile:2,insect:2,serpent:1,beast:1}[form]||0);
 const protection=Math.max(natural,...worn);
 return Math.max(0,damage-Math.max(0,protection-penetration));
}
function equippedCommunicator(ent){
 return isCommunicator(ent?.equipment?.wrist)&&ent.inventory.includes(ent.equipment.wrist);
}
function openCharacterMessages(){
 if(!equippedCommunicator(activeActor()))return;
 const actor=activeActor();
 if(actor.unreadCommunications){actor.unreadCommunications=0;saveBank();updateCharacterClock();}
 renderCharacterMessages();
 document.getElementById('characterMessages').showModal();
}
function renderCharacterMessages(){
 const actor=activeActor();if(!equippedCommunicator(actor))return;
 const dialog=document.getElementById('characterMessages');
 const select=dialog.querySelector('[name=recipient]'),previous=select.value;
 select.replaceChildren(...state.entities.filter(ent=>ent!==actor&&ent.inventory?.some(isCommunicator)).map(ent=>new Option(ent.name,ent.id)));
 if([...select.options].some(o=>o.value===previous))select.value=previous;
 const zh=siteLanguage==='zh-CN';
 dialog.querySelector('h3').textContent=zh?'角色通讯':'Comunicações';
 dialog.querySelector('[name=message]').placeholder=zh?'输入消息':'Escreva uma mensagem';
 dialog.querySelector('[type=submit]').textContent=zh?'发送':'Enviar';
 dialog.querySelector('[type=submit]').disabled=!select.options.length;
 dialog.querySelector('[data-close]').textContent=zh?'关闭':'Fechar';
 const inbox=dialog.querySelector('[data-messages]');
 const messages=actor.communications||[];
 inbox.replaceChildren(...messages.map(message=>{
  const entry=document.createElement('p');
  entry.textContent=message.direction+' '+message.name+' · '+message.text;
  return entry;
 }));
}
function sendCharacterMessage(form){
 const actor=activeActor();
 if(!equippedCommunicator(actor))return;
 const recipient=state.entities.find(ent=>ent.id===form.elements.recipient.value&&ent!==actor&&ent.inventory?.some(isCommunicator));
 const text=form.elements.message.value.trim().slice(0,500);
 if(!recipient||!text)return;
 beginEdit();
 (actor.communications??=[]).push({direction:'→',name:recipient.name,text});
 (recipient.communications??=[]).push({direction:'←',name:actor.name,text});
 const unread=recipient.unreadCommunications||0;
 recipient.unreadCommunications=unread+1;
 if(!saveBank()){actor.communications.pop();recipient.communications.pop();recipient.unreadCommunications=unread;finishEdit();return;}
 finishEdit();
 form.elements.message.value='';
 renderCharacterMessages();
}
