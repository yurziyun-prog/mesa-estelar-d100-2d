// Biblioteca do Arquiteto, independente da ficha do Mestre e do Jogador.
const ARCHITECT_LIBRARY = {
 downloads:[
  ['kenney_grass','🌿','RPG Base · Grama','mat'],['kenney_sand','🏜️','RPG Base · Terra arenosa','mat'],
  ['kenney_water','💧','RPG Base · Água','mat'],['kenney_stone','🏛️','RPG Base · Pedra clara','mat'],
  ['kenney_wood','🪵','Roguelike · Madeira','mat'],['kenney_brick','🪨','Roguelike · Pedra cinza','mat'],
  ['kenney_masonry','🧱','Roguelike · Alvenaria','mat'],['kenney_flowers','🌷','Roguelike · Flores','mat'],
  ['kenney_tree_green','🌳','RPG Base · Árvore verde','downloadProp'],
  ['kenney_pine','🌲','RPG Base · Conífera','downloadProp'],
  ['kenney_tree_autumn','🍂','RPG Base · Árvore outonal','downloadProp'],
  ['kenney_bush','🌿','RPG Base · Arbusto','downloadProp'],
  ['kenney_arch','🏛️','RPG Base · Arco decorativo','downloadProp'],
  ['kenney_window','🪟','RPG Base · Janela decorativa','downloadProp'],
  ['kenney_crate','📦','RPG Base · Caixote','downloadProp'],
  ['kenney_barrel','🛢️','RPG Base · Barril','downloadProp'],
  ['kenney_ladder','🪜','RPG Base · Escada de mão decorativa','downloadProp'],
  ['kenney_door','🚪','RPG Base · Porta decorativa','downloadProp'],
  ['kenney_urn','🏺','RPG Base · Vaso de pedra','downloadProp'],
  ['kenney_fence','🪵','RPG Base · Cerca','downloadProp'],
  ['kenney_rl_tree','🌳','Roguelike · Árvore','downloadProp'],
  ['kenney_rl_pine','🌲','Roguelike · Pinheiro','downloadProp'],
  ['kenney_rl_bush','🌿','Roguelike · Arbusto','downloadProp'],
  ['kenney_rl_torch','🔥','Roguelike · Tocha','downloadProp'],
  ['kenney_rl_fire','🔥','Roguelike · Fogueira','downloadProp'],
  ['kenney_rl_stone','🪨','Roguelike · Pedra','downloadProp'],
  ['kenney_rl_flowers','🌼','Roguelike · Flores','downloadProp'],
  ['kenney_rl_stairs','🪜','Roguelike · Escadaria decorativa','downloadProp']
 ],
 terrain:[['grass','🌿','Grama','mat'],['sand','🏜️','Areia','mat'],['dirt','🟤','Terra','mat'],['snow','❄️','Neve','mat'],['water','🌊','Água','mat'],['cave','🕳️','Chão de caverna','mat'],['mud','🌧️','Lama','mat']],
 furniture:[['carpet','🟥','Tapete de área','mat'],['rug','🧶','Tapete decorativo','prop'],['table','🪵','Mesa','prop'],['chair','🪑','Cadeira','prop'],['bed','🛏️','Cama de solteiro','prop'],['bedDouble','🛏️','Cama de casal','prop'],['sleepingBag','⛺','Saco de dormir','prop'],['capsuleBed','🛸','Cápsula de sono','prop'],['portableLadder','🪜','Escada de mão móvel','prop'],['foldingLadder','🪜','Escada dobrável portátil','prop'],['bookshelf','📚','Estante','prop'],['hearth','🔥','Lareira','prop'],['barrel','🛢️','Barril','prop'],['bench','🪑','Banco','prop'],['cabinet','🚪','Armário','prop'],['desk','🗄️','Escrivaninha','prop'],['sofa','🛋️','Sofá (cor personalizável)','prop'],['lowTable','🫖','Mesa baixa','prop'],['console','🖥️','Console','prop'],['lamp','💡','Luminária','prop']],
 nature:[['tree','🌳','Carvalho','prop'],['pine','🌲','Pinheiro','prop'],['fruitTree','🍎','Frutífera','prop'],['bush','🌿','Arbusto','prop'],['rock','🪨','Rocha','prop'],['palm','🌴','Palmeira','prop'],['desertTree','🌳','Árvore de deserto','prop'],['cactus','🌵','Cacto','prop'],['flowers','🌸','Flores','prop'],['reeds','🌾','Juncos','prop'],['crystal','💎','Cristal','prop']],
 props:[['tent','⛺','Tenda','prop'],['oilLamp','🪔','Lâmpada de óleo','prop'],['cushions','🧵','Almofadas','prop'],['log','🪵','Tronco móvel','prop'],['urn','🏺','Ânfora','prop'],['crate','📦','Caixote','prop'],['screen','🪟','Biombo','prop'],['fountain','⛲','Fonte','prop'],['torch','🔥','Tocha','prop']],
 architecture:[
  ['checker','🔲','Ladrilho','mat'],['wood','🪵','Parquê de madeira','mat'],['marble','🏛️','Mármore','mat'],['stone','🪨','Piso de pedra','mat'],['cobble','🧱','Calçamento','mat'],['metal','🔩','Piso metálico','mat'],['mosaic','🌀','Mosaico','mat'],['bridge','🌉','Piso de ponte','mat'],
  ['wall','🧱','Parede','tool'],['door','🚪','Porta','tool'],['window','🪟','Janela','tool'],
  ['stairs','🪜','Escada','tool'],['bridgeWood','🌉','Ponte','bridgeVariant'],
  ['chest','🧰','Baú','tool'],['chestFuture','🧰','Baú futurista','chestVariant']
 ],
 characters:[['warrior','⚔️','Guerreiro','character'],['mage','🪄','Maga','character'],['ranger','🏹','Arqueira','character'],['villager','🧑','Aldeão','character'],['guard','🛡️','Guarda','character'],['merchant','🧳','Mercadora','character'],['goblin','👺','Goblin','character'],['skeleton','💀','Esqueleto','character'],['wolf','🐺','Lobo','character'],['dragon','🐉','Dragão','character']]
};
const LIBRARY_LABELS={brush:'Pincel e texturas',create:'Criar (futuro)',downloads:'Packs baixados',terrain:'Terrenos naturais',furniture:'Móveis',nature:'Árvores e natureza',props:'Objetos e decoração',architecture:'Elementos de construção',characters:'Personagens e NPCs'};
let architectCategory='furniture';
let architectCharacterTemplate=null;
function openArchitectLibrary(category){
 if(!ARCHITECT_LIBRARY[category] && !['brush','create','downloads'].includes(category))return;
 architectCategory=category;
 const search=document.getElementById('architectLibrarySearch');
 if(search)search.value='';
 renderArchitectLibrary();
}
function renderArchitectLibrary(){
 const grid=document.getElementById('architectLibraryGrid');if(!grid)return;
 const brush=document.getElementById('brushSettings'),create=document.getElementById('createSettings'),search=document.getElementById('architectLibrarySearch');
 refreshArchitectProperties();
 if(brush)brush.classList.toggle('hidden',architectCategory!=='brush');
 if(create)create.classList.toggle('hidden',architectCategory!=='create');
 if(search)search.classList.toggle('hidden',['brush','create'].includes(architectCategory));
 grid.classList.toggle('hidden',['brush','create'].includes(architectCategory));
 if(architectCategory==='brush'){selectTool('brush');syncArchitectBrushUI();}

 document.getElementById('architectLibraryTitle').textContent=LIBRARY_LABELS[architectCategory];
 document.getElementById('architectLibraryDescription').textContent=architectCategory==='brush'?'Pinte diretamente no mapa com formatos e texturas diferentes.':architectCategory==='create'?'Um espaço preparado para editores futuros.':architectCategory==='downloads'?'Texturas reais dos pacotes Kenney RPG Base e Kenney Roguelike RPG. Licença CC0.':architectCategory==='terrain'?'Terrenos naturais: grama, água, areia, lama e solo de cavernas. Pisos de construção ficam em Elementos de construção.':
  architectCategory==='characters'?'Selecione um modelo e clique no mapa para colocá-lo.':
  'Os novos itens seguem a coleção de construção selecionada, sem modificar os anteriores.';
 const query=(document.getElementById('architectLibrarySearch')?.value||'').toLocaleLowerCase('pt-BR');
 grid.replaceChildren();
 for(const [id,icon,label,kind] of (ARCHITECT_LIBRARY[architectCategory]||[])){
  if(!label.toLocaleLowerCase('pt-BR').includes(query))continue;
  if(!isItemInBuildCollection(id,architectCategory))continue;
  const button=document.createElement('button');button.type='button';button.className='library-card';
  const emoji=document.createElement('span');emoji.className='emoji';emoji.textContent=icon;
  const name=document.createElement('span');name.textContent=label;
  if(architectCategory==='downloads'){
    const preview=createDownloadThumbnail(id);
    button.append(preview||emoji,name);
  }else button.append(emoji,name);
  button.onclick=()=>selectArchitectLibraryItem(id,label,kind);
  grid.append(button);
 }
}
function selectArchitectLibraryItem(id,label,kind){
 architectCharacterTemplate=null;
 selectedMapObject=null;
 if(kind==='mat')selectMaterial(id);
 else if(kind==='prop'||kind==='downloadProp')selectProp(id);
 else if(kind==='tool'){
   if(id==='wall')state.wallVariant=null;
   if(id==='door')state.doorVariant=null;
   if(id==='chest')state.chestVariant=null;
   if(id==='stairs')state.stairVariant=null;
   selectTool(id);
 }
 else if(kind==='doorVariant'){state.doorVariant=id;selectTool('door');}
 else if(kind==='chestVariant'){state.chestVariant=id;selectTool('chest');}
 else if(kind==='bridgeVariant'){selectMaterial('bridge');}
 else if(kind==='character'){architectCharacterTemplate=id;selectTool('character');}
 document.getElementById('architectLibrarySelected').textContent='Selecionado: '+label+' • Clique no mapa para colocar.';
 refreshArchitectProperties();
 for(const card of document.querySelectorAll('.library-card'))card.classList.toggle('active',card.textContent.trim().endsWith(label));
}
function placeArchitectCharacter(x,y){
 if(!architectCharacterTemplate)return;
 const template=GM_TEMPLATES.find(t=>t.id===architectCharacterTemplate);if(!template)return;
 const entity=normalizeD100Character(instantiateTemplate(template,x,y));
 state.entities.push(entity);state.selectedEntityId=entity.id;
 logEvent('🎭 '+entity.name+' colocado pelo Arquiteto.');
}

function isItemInBuildCollection(id,category){
 const style=state?.buildStyle||'normal';
 // Terrenos são universais. Os itens básicos podem coexistir em todos os estilos.
 if(category==='terrain'||category==='architecture'||category==='characters'||category==='downloads')return true;
 if(id==='capsuleBed')return style==='futurist';
 const arabia=new Set(['palm','desertTree','cactus','tent','oilLamp','cushions','lowTable','urn','rug','fountain']);
 const futurist=new Set(['console','lamp','crystal','capsuleBed']);
 if(style==='arabia')return !futurist.has(id);
 if(style==='futurist')return !arabia.has(id) || id==='palm';
 return !futurist.has(id) && !arabia.has(id);
}

function setArchitectBrush(key,value){
 if(!state.brush)state.brush={shape:'redondo',size:32,texture:'solida',mat:'grass'};
 state.brush[key]=value;
 if(key==='size')document.getElementById('brushSizeLabel').textContent=value;
 selectTool('brush');
}
function syncArchitectBrushUI(){
 const b=state.brush||{shape:'redondo',size:32,texture:'solida',mat:'grass'};
 for(const [id,key] of [['brushShape','shape'],['brushTexture','texture'],['brushMaterial','mat'],['brushSize','size']]){
  const el=document.getElementById(id);if(el)el.value=b[key];
 }
 document.getElementById('brushSizeLabel').textContent=b.size;
}

function createDownloadThumbnail(id){
 let image=null,col=0,row=0;
 if(typeof KENNEY_DOWNLOAD_TILES!=='undefined'&&KENNEY_DOWNLOAD_TILES[id]){
   const t=KENNEY_DOWNLOAD_TILES[id];image=KENNEY_DOWNLOAD_IMAGE;col=t.col;row=t.row;
 }else if(typeof KENNEY_OBJECTS!=='undefined'&&KENNEY_OBJECTS[id]){
   const t=KENNEY_OBJECTS[id];image=KENNEY_OBJECT_IMAGE;col=t.col;row=t.row;
 }else if(typeof KENNEY_ROGUELIKE_OBJECTS!=='undefined'&&KENNEY_ROGUELIKE_OBJECTS[id]){
   const t=KENNEY_ROGUELIKE_OBJECTS[id];image=KENNEY_ROGUELIKE_IMAGE;col=t.col;row=t.row;
 }else return null;
 const thumb=document.createElement('canvas');thumb.width=36;thumb.height=36;thumb.className='library-thumb';
 const context=thumb.getContext('2d');context.imageSmoothingEnabled=false;
 context.fillStyle='#29352f';context.fillRect(0,0,36,36);
 if(image.complete&&image.naturalWidth)context.drawImage(image,col*32,row*32,32,32,2,2,32,32);
 else if(!image.complete)image.addEventListener('load',()=>{if(architectCategory==='downloads')renderArchitectLibrary();},{once:true});
 return thumb;
}

function selectedArchitectItem(){
 if(!selectedMapObject)return null;
 const floor=getScene()?.floors?.[state.currentFloor];
 return floor?.[selectedMapObject.kind]?.[selectedMapObject.index]||null;
}
function supportsObjectColor(item){return Boolean(item && (item.type || item.mat==='carpet' || ('material' in item && 'x1' in item)));}
let architectEyedropper=false;
function setArchitectObjectColor(value){
 value=String(value).trim().toLowerCase();
 if(/^#[0-9a-f]{3}$/.test(value))value='#'+[...value.slice(1)].map(c=>c+c).join('');
 if(!/^#[0-9a-f]{6}$/.test(value)){logEvent('Use uma cor hexadecimal #RRGGBB.');return;}
 const selected=selectedArchitectItem();
 beginEdit();
 if(selected && supportsObjectColor(selected))selected.color=value;
 else state.propColor=value;
 finishEdit();syncArchitectColorUI();
}
function syncArchitectColorUI(){
 const el=document.getElementById('objectColorPicker');if(!el)return;
 const selected=selectedArchitectItem();
 const value=selected?.color||state.propColor||'#a35d64';
 el.value=value;
 const hex=document.getElementById('objectColorHex');
 if(hex&&document.activeElement!==hex)hex.value=value;
 const hint=document.getElementById('objectColorHint');
 if(hint)hint.textContent=selected&&supportsObjectColor(selected)?'Editando objeto selecionado':'Cor dos próximos objetos';
}
function setWallThickness(n){
 if(!Number.isFinite(n))return;
 n=Math.max(8,Math.min(40,Math.round(n/2)*2));
 const item=selectedArchitectItem();
 beginEdit();if(item&&'x1' in item)item.width=n;else state.wallWidth=n;
 finishEdit();syncWallThicknessUI();
}
function syncWallThicknessUI(){
 const item=selectedArchitectItem();
 const value=item&&'x1' in item?(item.width||16):(state.wallWidth||16);
 const slider=document.getElementById('wallThickness'),label=document.getElementById('wallThicknessLabel');
 if(slider)slider.value=value;if(label)label.textContent=value;
}

function onArchitectSelectionChange(){refreshArchitectProperties();}
const CONSTRUCTION_WALL_MATERIALS={wood:'wallWood',stone:'wallCastle',brick:'wallBrick',castle:'wallCastle',masonry:'wallMasonry',metal:'wallMetal',rust:'wallRust',sandstone:'wallSandstone'};
function selectedConstructionKind(){
 const kind=selectedMapObject?.kind;
 if(kind==='walls')return 'wall';
 if(kind==='stairs')return 'stairs';
 if(['doors','chests','windows'].includes(kind))return kind;
 if(architectCategory==='architecture'&&['wall','stairs','door','chest','window'].includes(state.tool))return state.tool;
 return null;
}
function refreshArchitectProperties(){
 const item=selectedArchitectItem(),kind=selectedConstructionKind();
 const furniture=Boolean(item?.type)||item?.mat==='carpet'||(!item&&(['furniture','props'].includes(architectCategory)||(architectCategory==='furniture'&&state.material==='carpet')));
 const showColors=kind==='wall'?Boolean(state.wallCustomColor||item?.color):!kind&&furniture;
 document.getElementById('objectColorSettings')?.classList.toggle('hidden',!showColors);
 const tileSelected=(selectedMapObject?.kind==='areas'&&item?.mat==='checker')||(['terrain','architecture'].includes(architectCategory)&&state.material==='checker'&&!item);
 document.getElementById('tileOptions')?.classList.toggle('hidden',!tileSelected);
 if(tileSelected)syncTileOptions();
 document.getElementById('constructionOptions')?.classList.toggle('hidden',!kind);
 document.getElementById('wallThicknessOptions')?.classList.toggle('hidden',kind!=='wall');
 document.getElementById('stairShapeOptions')?.classList.toggle('hidden',kind!=='stairs');
 const checkbox=document.getElementById('wallColorException');if(checkbox)checkbox.style.display=kind==='wall'?'flex':'none';
 const check=document.getElementById('wallColorEnabled');if(check)check.checked=Boolean(state.wallCustomColor||item?.color);
 const mat=document.getElementById('constructionMaterial');
 if(mat&&kind)mat.value=kind==='wall'
    ?(Object.keys(CONSTRUCTION_WALL_MATERIALS).find(k=>CONSTRUCTION_WALL_MATERIALS[k]===(item?.material||state.wallVariant))||'masonry')
    :(item?.material||(kind==='stairs'?state.stairMaterial:state.constructionMaterial)||'wood');
 const shape=document.getElementById('stairShape');if(shape)shape.value=stairVisualShape(item?.shape||state.stairShape);
 const title=document.getElementById('constructionOptionTitle');
 if(title)title.textContent=kind==='wall'?'Parede · material e espessura':kind==='stairs'?'Escada · material e formato':'Construção · material';
 syncWallThicknessUI();syncArchitectColorUI();
}
function changeConstructionMaterial(material){
 if(!CONSTRUCTION_WALL_MATERIALS[material])return;
 const kind=selectedConstructionKind(),item=selectedArchitectItem();
 beginEdit();
 if(kind==='wall'){if(item)item.material=CONSTRUCTION_WALL_MATERIALS[material];else state.wallVariant=CONSTRUCTION_WALL_MATERIALS[material];}
 else if(kind==='stairs'){if(item){item.material=material;syncLinkedStair(item,'material',material);}else state.stairMaterial=material;}
 else if(item)item.material=material;
 else state.constructionMaterial=material;
 finishEdit();refreshArchitectProperties();
}
function changeStairShape(shape){
 if(!STAIR_SHAPES.includes(shape))return;
 const item=selectedArchitectItem();
 beginEdit();
 if(item&&selectedMapObject?.kind==='stairs'){item.shape=shape;syncLinkedStair(item,'shape',shape);}else state.stairShape=shape;
 finishEdit();refreshArchitectProperties();
}
function toggleWallColorEditor(on){
 state.wallCustomColor=Boolean(on);
 const item=selectedArchitectItem();
 if(!on&&item&&selectedMapObject?.kind==='walls'){beginEdit();delete item.color;finishEdit();}
 refreshArchitectProperties();
}
function startArchitectEyedropper(){
 architectEyedropper=true;
 document.getElementById('architectLibrarySelected').textContent='🎯 Clique em um objeto colorido no mapa. Esc cancela.';
}
function sampleArchitectColorAt(wx,wy){
 if(!architectEyedropper)return false;
 architectEyedropper=false;
 const hit=hitArchitectObjectAt(wx,wy);
 if(!hit){logEvent('Nenhum objeto para copiar a cor.');return true;}
 const item=getScene().floors[state.currentFloor][hit.kind][hit.index];
 const base={wallWood:'#966a40',wallBrick:'#ae6047',wallMasonry:'#adb5b4',wallCastle:'#91918b',wallMetal:'#c3d5de',wallRust:'#917762',wallSandstone:'#d8b982'};
 const color=item.color||(item.mat==='carpet'?'#8c1d28':null)||(item.material?base[item.material]:null)||(item.type==='sofa'?'#c7b5a4':null)||(item.type==='rug'?'#744b79':null)||(item.type==='bed'?'#9e6473':null)||state.propColor;
 setArchitectObjectColor(color);
 document.getElementById('architectLibrarySelected').textContent='Cor copiada: '+color;
 return true;
}

function syncLinkedStair(source,key,value){
 const floors=getScene().floors||[];
 for(let i=0;i<floors.length;i++){
  if(i===state.currentFloor)continue;
  for(const stair of floors[i].stairs||[]){
   if(source.linkId?stair.linkId===source.linkId:(Math.hypot(stair.x-source.x,stair.y-source.y)<2&&stair.dir!==source.dir))stair[key]=value;
  }
 }
}

function selectedTileConfig(){
 const item=selectedArchitectItem();
 if(item?.mat==='checker')return item.tile||state.tileConfig;
 return state.tileConfig;
}
function syncTileOptions(){
 const t=selectedTileConfig()||{material:'ceramic',pattern:'checker',size:32,color1:'#667388',color2:'#a9b7bf'};
 for(const [id,key] of [['tileMaterial','material'],['tilePattern','pattern'],['tileSize','size'],['tileColor1','color1'],['tileColor2','color2']]){
  const el=document.getElementById(id);if(el&&t[key]!=null)el.value=t[key];
 }
 const label=document.getElementById('tileSizeLabel');if(label)label.textContent=t.size||32;
}
function setTileOption(key,value){
 const valid=['material','pattern','size','color1','color2'];if(!valid.includes(key))return;
 if(key==='size')value=Math.min(96,Math.max(16,Number(value)||32));
 const item=selectedArchitectItem();
 beginEdit();
 if(item?.mat==='checker'){item.tile={...state.tileConfig,...(item.tile||{}),[key]:value};}
 else state.tileConfig={...state.tileConfig,[key]:value};
 finishEdit();syncTileOptions();
}
