// Importa fichas do Mesa Estelar para a reserva, usando o ID de origem para evitar duplicatas.
function mesaImportedCharacter(sheet,kind){
 const id='mesa-'+kind+'-'+sheet.id;
 const visualSeed=Array.from(id).reduce((seed,char)=>(Math.imul(seed,31)+char.codePointAt(0))>>>0,0);
 const attrs=Object.fromEntries(D100_ATTRIBUTES.map(key=>[
   key,(Number(sheet.atributos?.[key]??sheet[key])||10)+(Number(sheet.bonus?.[key])||0)
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
 for(const text of [sheet.periciasTexto,sheet.especializacoesTexto]){
   for(const line of String(text||'').split('|')){
     const match=line.trim().match(/^(.+):\s*(\d+(?:[.,]\d+)?)%?$/);
     if(match)skillsD100.push({name:match[1].trim(),base:null,training:null,total:Number(match[2].replace(',','.'))});
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
 if(!sheet.inventario)for(const list of [sheet.inventarioTexto,sheet.equipamentoBaseTexto]){
   for(const item of String(list||'').split('|').map(name=>name.trim()).filter(Boolean))inventory.push(item);
 }
 const maxHp=Math.max(1,Math.ceil((attrs.CON+attrs.TAM)/2));
 const hp=sheet.combate?.pvGlobalAtual;
 const role=kind==='monster'?sheet.especie||'':typeof sheet.carreira==='string'?sheet.carreira:'';
 const species={Jacaranás:'Crocodiliano',Draconiana:'Dracônico',Humana:'Humano'}[sheet.raca]||sheet.raca||'Humano';
 const body={Leve:'slim',Pesado:'broad'}[sheet.tipoCorporal]||'balanced';
 const {dono,donoUid,fichaAprovadaPor,ativoNaCampanhaAlteradoPor,...sourceSheet}=sheet;
 return normalizeD100Character({
   id,type:kind==='pc'?'pc':'npc',name:sheet.nome,role,species,sex:sheet.sexo,
   appearance:kind==='pc'?{body}:{body,clothing:['#526b79','#756647','#77566d','#4e7161','#875846'][visualSeed%5],
     hairStyle:['short','long','shaved'][visualSeed%3],hair:['#493626','#543e32','#38363e'][visualSeed%3]},
   creature:kind==='monster'?mesaCreatureDesign(sheet,visualSeed):undefined,
   icon:kind==='monster'?'🐾':kind==='pc'?'🛡️':'🎭',
   attitude:kind==='pc'?'Aliado':'Neutro',sceneId:null,floor:-1,x:0,y:0,
   hp:Number.isFinite(hp)?Math.max(0,Math.min(maxHp,hp)):maxHp,maxHp,hunger:100,
   attrs,skillsD100,d100SheetConfigured:true,inventory,equipment,credits:sheet.recursos,
   mesaSourceSheet:sourceSheet
 });
}

function importMesaSheets(data){
 if(data.versao!==1||!Array.isArray(data.jogadores))throw new Error('Formato de fichas inválido.');
 const existing=new Set(state.entities.map(ent=>ent.id));
 const additions=[];
 const groups=[
   ['pc',data.jogadores,'Personagens jogadores'],
   ['npc',data.npcs?.fichasAvancadas,'NPCs com ficha avançada'],
   ['npc-bank',data.npcs?.banco,'NPCs do banco'],
   ['monster',data.monstros,'Monstros']
 ];
 const counts=[];
 for(const [kind,sheets,label] of groups){
   const before=additions.length;
   for(const sheet of Array.isArray(sheets)?sheets:[]){
     const name=typeof sheet?.nome==='string'?sheet.nome.trim():'';
     if(!name||name==='Novo Personagem'||typeof sheet.id!=='string'||!sheet.id||(kind==='pc'&&!sheet.atributos))continue;
     const id='mesa-'+kind+'-'+sheet.id;
     if(existing.has(id))continue;
     existing.add(id);
     additions.push(mesaImportedCharacter({...sheet,nome:name},kind));
   }
   if(additions.length>before)counts.push(translateSiteText(label)+' · '+(additions.length-before));
 }
 if(!additions.length){
   alert(translateSiteText('Nenhuma ficha nova para importar.'));
   return;
 }
 if(!confirm(translateSiteText('Importar para a reserva do Mestre?')+'\n\n'+counts.join('\n')))return;
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
