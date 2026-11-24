// Edição contextual. As propriedades pertencem a cada instância do mapa, não ao tema global.
let architectPropertyTarget=null;
function getArchitectPropertyItem(){
 if(!architectPropertyTarget)return null;
 const floor=getScene()?.floors?.[state.currentFloor];
 return floor?.[architectPropertyTarget.kind]?.[architectPropertyTarget.index]||null;
}
function editArchitectObject(ref=null){
 const target=ref||selectedMapObject||architectSelections?.[0];
 if(!target||!['windows','doors','chests','props','walls','stairs'].includes(target.kind))return;
 architectPropertyTarget={kind:target.kind,index:target.index};
 const obj=getArchitectPropertyItem();if(!obj)return;
 const kind=target.kind;
 const dialog=document.getElementById('architectObjectDialog');if(!dialog)return;
 const el=id=>document.getElementById(id);
 const put=(id,value)=>{const node=el(id);if(node)node.value=value;};
 const durabilityKind={props:'prop',walls:'wall',doors:'door',windows:'window',chests:'chest'}[kind];
 for(const id of ['objectDialogHardnessRow','objectDialogPvRow'])el(id).style.display=durabilityKind?'flex':'none';
 const durability=materialDurability(obj,durabilityKind);
 put('objectDialogHardness',durability.hardness);put('objectDialogPv',durability.maxPv);
 put('objectDialogStyle',obj.style||'normal');
 el('objectDialogScaleRow').style.display=kind==='props'?'flex':'none';
 el('objectDialogSignRow').style.display=kind==='props'&&isWritableSign(obj.type)?'flex':'none';
 el('objectDialogStopsRow').style.display=obj.type==='hoverLift'?'flex':'none';
 el('objectDialogStockRow').style.display=obj.type==='vendingFridge'?'flex':'none';
 el('objectDialogHeightRow').style.display=geologyPropRadius(obj.type)?'flex':'none';
 put('objectDialogHeight',obj.metres||1);
 put('objectDialogStops',(obj.stops||[]).join(', '));
 put('objectDialogStock',(obj.stock||[{name:'Refrigerante',price:2},{name:'Cerveja',price:3},{name:'Comida',price:4}]).map(p=>p.name+':'+p.price).join('\n'));
 put('objectDialogScale',Math.round((obj.scale||1)*100));
 put('objectDialogSign',obj.signText||'');
 const material=kind==='walls'
   ? Object.keys(CONSTRUCTION_WALL_MATERIALS).find(key=>CONSTRUCTION_WALL_MATERIALS[key]===obj.material)
   : obj.material;
 put('objectDialogMaterial',Array.from(el('objectDialogMaterial').options).some(option=>option.value===material)?material:'wood');
 put('objectDialogColor',/^#[0-9a-f]{6}$/i.test(obj.color||'')?obj.color:'#a35d64');
 el('objectDialogUseColor').checked=Boolean(obj.color);
 put('objectDialogWidth',kind==='windows'?(obj.width||40):kind==='doors'?68:kind==='walls'?(obj.width||16):72);
 el('objectDialogWidthRow').style.display=['windows','walls'].includes(kind)?'block':'none';
 el('objectDialogColorRow').style.display='block';
 el('objectDoorOptions').style.display=kind==='doors'?'block':'none';
 if(kind==='doors'){
   put('objectDoorMechanism',obj.mechanism||(obj.style==='futurist'?'sliding':'hinged'));
   put('objectDoorHinge',obj.hingeSide||'left');
   put('objectDoorSwing',obj.swing||'in');
   put('objectDoorLock',obj.lockCode?'code':obj.keyId?'key':'none');
   put('objectDoorLockValue',obj.lockCode||obj.keyLabel||'');
   updateObjectDoorLockUI();
 }
 if(!dialog.open)dialog.showModal();
}
function updateObjectDoorLockUI(){
 const kind=document.getElementById('objectDoorLock').value;
 document.getElementById('objectDoorLockValueRow').style.display=kind==='none'?'none':'block';
}
function resizeWindowOpening(floor,win,oldWidth,newWidth){
 // Ajustar SOMENTE as pontas da parede encostadas nas bordas deste vão.
 // Não altera paredes distantes, outras janelas ou portas.
 if(oldWidth===newWidth)return;
 const horiz=win.orient!=='v';
 const center=horiz?win.x:win.y;
 const cross=horiz?win.y:win.x;
 const oldHalf=oldWidth/2+2,newHalf=newWidth/2+2;
 const tolerance=14;
 for(const wall of floor.walls){
   if(horiz && Math.abs(wall.y1-wall.y2)>1)continue;
   if(!horiz && Math.abs(wall.x1-wall.x2)>1)continue;
   if(Math.abs((horiz?wall.y1:wall.x1)-cross)>4)continue;
   const axis=horiz?'x':'y';
   for(const end of [1,2]){
     const key=axis+end;
     const value=wall[key];
     if(Math.abs(value-(center-oldHalf))<=tolerance)wall[key]=center-newHalf;
     else if(Math.abs(value-(center+oldHalf))<=tolerance)wall[key]=center+newHalf;
   }
 }
}
function saveArchitectObjectProperties(){
 const target=architectPropertyTarget,obj=getArchitectPropertyItem();if(!obj||!target)return;
 const get=id=>document.getElementById(id).value;
 const width=Number(get('objectDialogWidth'));
 const durabilityKind={props:'prop',walls:'wall',doors:'door',windows:'window',chests:'chest'}[target.kind];
 const hardness=Number(get('objectDialogHardness')),maxPv=Number(get('objectDialogPv'));
 if(durabilityKind&&(!Number.isInteger(hardness)||hardness<0||hardness>999||
    !Number.isInteger(maxPv)||maxPv<1||maxPv>9999)){
   alert(translateSiteText('Valores de dureza ou PV inválidos.'));return;
 }
 const scale=Number(get('objectDialogScale'));
 if(target.kind==='props'&&(!Number.isFinite(scale)||scale<20||scale>400)){
   alert(translateSiteText('Escala entre 20% e 400%.'));return;
 }
 if(['windows','walls'].includes(target.kind)&&(!Number.isFinite(width)||width<16||width>224)){
   alert('Largura inválida.');return;
 }
 const lock=get('objectDoorLock'),value=get('objectDoorLockValue').trim();
 if(target.kind==='doors'&&lock!=='none'&&!value){
   alert('Digite um código ou nome de chave.');return;
 }
 const stops=get('objectDialogStops').split(',').map(s=>s.trim()).filter(Boolean);
 if(obj.type==='hoverLift'&&stops.some(s=>!/^[-+]?\d+$/.test(s)||floorIndexForLevel(getScene(),Number(s))<0)){
   alert(translateSiteText('Escolha níveis existentes.'));return;
 }
 const stock=get('objectDialogStock').split('\n').map(s=>s.trim()).filter(Boolean).map(line=>line.match(/^(.+):\s*(\d+)$/));
 if(obj.type==='vendingFridge'&&stock.some(row=>!row||!Number.isSafeInteger(Number(row[2])))){
   alert(translateSiteText('Use nome:preço, um produto por linha.'));return;
 }
 beginEdit();
 const floor=getScene().floors[state.currentFloor];
 if(durabilityKind){
   const old=materialDurability(obj,durabilityKind);
   if(old.hardness!==hardness||old.maxPv!==maxPv){
     obj.hardness=hardness;obj.maxPv=maxPv;
     obj.pv=Math.max(0,maxPv-(old.maxPv-old.pv));
   }
 }
 obj.style=get('objectDialogStyle');
 if(target.kind==='props'){
   obj.scale=scale/100;
   if(isWritableSign(obj.type))obj.signText=get('objectDialogSign').trim().slice(0,32);
   if(obj.type==='hoverLift')obj.stops=[...new Set(stops.map(Number))];
   if(obj.type==='vendingFridge')obj.stock=stock.map(row=>({name:row[1].trim(),price:Number(row[2])}));
   if(geologyPropRadius(obj.type))obj.metres=Math.max(.1,Math.min(2.9,Number(get('objectDialogHeight'))||1));
 }
 obj.material=target.kind==='walls'?(CONSTRUCTION_WALL_MATERIALS[get('objectDialogMaterial')]||'wallMasonry'):get('objectDialogMaterial');
 if(document.getElementById('objectDialogUseColor').checked)obj.color=get('objectDialogColor');
 else delete obj.color;
 if(target.kind==='windows'){
   const old=obj.width||40;
   resizeWindowOpening(floor,obj,old,width);
   obj.width=width;
 }else if(target.kind==='walls')obj.width=width;
 else if(target.kind==='doors'){
   obj.mechanism=get('objectDoorMechanism');
   obj.hingeSide=get('objectDoorHinge');
   obj.swing=get('objectDoorSwing');
   obj.lockType=lock;
   if(lock==='none'){obj.keyId='';delete obj.lockCode;}
   else if(lock==='code'){obj.lockCode=value;obj.keyId='';}
   else{
     const existing=obj.keyId;
     const id=existing||('chave_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6));
     obj.keyId=id;obj.keyLabel=value;delete obj.lockCode;
     if(!existing){
       pendingKeyPlacement={keyId:id,label:value,sceneId:state.activeSceneId,floor:state.currentFloor};
       logEvent('🔑 Clique no mapa para colocar a nova chave.');
     }
   }
 }
 finishEdit();
 document.getElementById('architectObjectDialog').close();
 architectPropertyTarget=null;
 if(typeof refreshArchitectProperties==='function')refreshArchitectProperties();
 logEvent('✏️ Propriedades atualizadas. Ctrl+Z para desfazer.');
 if(typeof saveBank==='function')saveBank();
}
