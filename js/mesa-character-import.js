// Importa fichas do Mesa Estelar para a reserva, usando o ID de origem para evitar duplicatas.
function mesaImportedCharacter(sheet){
 const attrs=Object.fromEntries(D100_ATTRIBUTES.map(key=>[
   key,(Number(sheet.atributos[key])||10)+(Number(sheet.bonus?.[key])||0)
 ]));
 const skillsD100=[];
 for(const source of [sheet.pericias,sheet.especializacoes]){
   for(const [id,record] of Object.entries(source||{})){
     const definition=mesaCharacterSkills.find(row=>row[0]===id);
     const name=definition?.[1]||record?.nomeOriginal||record?.escola||id.replaceAll('_',' ');
     const base=definition?.[4]?mesaSkillBase(definition[4],attrs):null;
     const training=Number(record?.treinoTotal)||0;
     skillsD100.push({name,base,training,total:base===null?null:base+training,provisional:base===null});
   }
 }
 const inventory=[],equipment={};
 for(const compartment of ['equipado','mochila','bolso']){
   for(const item of sheet.inventario?.[compartment]||[]){
     if(!item?.nome)continue;
     inventory.push(item.nome);
     const slot=characterItems[item.nome]?.slot;
     if(compartment==='equipado'&&slot&&!equipment[slot])equipment[slot]=item.nome;
   }
 }
 const maxHp=Math.max(1,Math.ceil((attrs.CON+attrs.TAM)/2));
 const hp=sheet.combate?.pvGlobalAtual;
 const role=typeof sheet.carreira==='string'?sheet.carreira:'';
 const species={Jacaranás:'Crocodiliano',Draconiana:'Dracônico'}[sheet.raca]||sheet.raca||'Humano';
 const body={Leve:'slim',Pesado:'broad'}[sheet.tipoCorporal]||'balanced';
 const {dono,donoUid,fichaAprovadaPor,ativoNaCampanhaAlteradoPor,...sourceSheet}=sheet;
 return normalizeD100Character({
   id:'mesa-pc-'+sheet.id,type:'pc',name:sheet.nome,role,species,sex:sheet.sexo,
   appearance:{body},icon:'🛡️',attitude:'Aliado',sceneId:null,floor:-1,x:0,y:0,
   hp:Number.isFinite(hp)?Math.max(0,Math.min(maxHp,hp)):maxHp,maxHp,hunger:100,
   attrs,skillsD100,d100SheetConfigured:true,inventory,equipment,credits:sheet.recursos,
   mesaSourceSheet:sourceSheet
 });
}

function importMesaPlayerSheets(data){
 if(data.versao!==1||!Array.isArray(data.jogadores))throw new Error('Formato de fichas inválido.');
 const existing=new Set(state.entities.map(ent=>ent.id));
 const additions=[];
 for(const sheet of data.jogadores){
   const name=typeof sheet?.nome==='string'?sheet.nome.trim():'';
   if(!name||name==='Novo Personagem'||typeof sheet.id!=='string'||!sheet.id||!sheet.atributos)continue;
   const id='mesa-pc-'+sheet.id;
   if(existing.has(id))continue;
   existing.add(id);
   additions.push(mesaImportedCharacter({...sheet,nome:name}));
 }
 if(!additions.length){
   alert(translateSiteText('Nenhuma ficha de jogador nova para importar.'));
   return;
 }
 if(!confirm(translateSiteText('Importar para a reserva do Mestre?')+'\n\n'+additions.map(ent=>ent.name).join('\n')))return;
 beginEdit();
 state.entities.push(...additions);
 if(!saveBank()){
   state.entities.splice(-additions.length);
   finishEdit();
   return;
 }
 finishEdit();
 renderGmPullList();
 updateUI();
 alert(translateSiteText('Fichas importadas para a reserva do Mestre.'));
}
