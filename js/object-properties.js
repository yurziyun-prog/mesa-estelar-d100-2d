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
 put('objectDialogStyle',obj.style||'normal');
 put('objectDialogMaterial',['wood','stone','brick','castle','masonry','metal','rust','sandstone'].includes(obj.material)?obj.material:'wood');
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
 if(['windows','walls'].includes(target.kind)&&(!Number.isFinite(width)||width<16||width>224)){
   alert('Largura inválida.');return;
 }
 const lock=get('objectDoorLock'),value=get('objectDoorLockValue').trim();
 if(target.kind==='doors'&&lock!=='none'&&!value){
   alert('Digite um código ou nome de chave.');return;
 }
 beginEdit();
 const floor=getScene().floors[state.currentFloor];
 obj.style=get('objectDialogStyle');
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
