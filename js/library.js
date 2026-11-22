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
 terrain:[['grass','🌿','Grama','mat'],['sand','🏜️','Areia','mat'],['dirt','🟤','Terra','mat'],['snow','❄️','Neve','mat'],['water','🌊','Água','mat'],['bridge','🌉','Ponte','mat'],['wood','🪵','Madeira','mat'],['checker','🔲','Ladrilho','mat'],['marble','🏛️','Mármore','mat'],['carpet','🟥','Tapete','mat'],['stone','🪨','Pedra irregular','mat'],['cobble','🧱','Calçamento','mat'],['metal','🔩','Piso metálico','mat'],['mosaic','🌀','Mosaico','mat']],
 furniture:[['table','🪵','Mesa','prop'],['chair','🪑','Cadeira','prop'],['bed','🛏️','Cama de solteiro','prop'],['bedDouble','🛏️','Cama de casal','prop'],['sleepingBag','⛺','Saco de dormir','prop'],['capsuleBed','🛸','Cápsula de sono','prop'],['bookshelf','📚','Estante','prop'],['hearth','🔥','Lareira','prop'],['barrel','🛢️','Barril','prop'],['bench','🪑','Banco','prop'],['cabinet','🚪','Armário','prop'],['desk','🗄️','Escrivaninha','prop'],['sofa','🛋️','Sofá bege','prop'],['sofaBlue','🛋️','Sofá azul','prop'],['sofaRed','🛋️','Sofá vermelho','prop'],['sofaGreen','🛋️','Sofá verde','prop'],['lowTable','🫖','Mesa baixa','prop'],['console','🖥️','Console','prop'],['lamp','💡','Luminária','prop']],
 nature:[['tree','🌳','Carvalho','prop'],['pine','🌲','Pinheiro','prop'],['fruitTree','🍎','Frutífera','prop'],['bush','🌿','Arbusto','prop'],['rock','🪨','Rocha','prop'],['palm','🌴','Palmeira','prop'],['desertTree','🌳','Árvore de deserto','prop'],['cactus','🌵','Cacto','prop'],['flowers','🌸','Flores','prop'],['reeds','🌾','Juncos','prop'],['crystal','💎','Cristal','prop']],
 props:[['tent','⛺','Tenda','prop'],['oilLamp','🪔','Lâmpada de óleo','prop'],['cushions','🧵','Almofadas','prop'],['log','🪵','Tronco móvel','prop'],['urn','🏺','Ânfora','prop'],['crate','📦','Caixote','prop'],['rug','🧶','Tapete decorativo','prop'],['screen','🪟','Biombo','prop'],['fountain','⛲','Fonte','prop'],['torch','🔥','Tocha','prop']],
 architecture:[
 ['wallWood','🪵','Parede de madeira','wallVariant'],['wallBrick','🧱','Parede de tijolos','wallVariant'],['wallMasonry','🏛️','Parede de alvenaria','wallVariant'],['wallMetal','🔩','Parede metálica','wallVariant'],
 ['window','🪟','Janela','tool'],['door','🚪','Porta padrão','tool'],['doorFuture','🚀','Porta retrátil','doorVariant'],['doorArabia','🕌','Porta árabe','doorVariant'],
 ['stairs','🪜','Escada','tool'],['stairsStone','🏛️','Escada de pedra','stairVariant'],['bridgeWood','🌉','Ponte','bridgeVariant'],['chest','🧰','Baú','tool'],['chestFuture','🧰','Baú futurista','chestVariant']
],
 characters:[['warrior','⚔️','Guerreiro','character'],['mage','🪄','Maga','character'],['ranger','🏹','Arqueira','character'],['villager','🧑','Aldeão','character'],['guard','🛡️','Guarda','character'],['merchant','🧳','Mercadora','character'],['goblin','👺','Goblin','character'],['skeleton','💀','Esqueleto','character'],['wolf','🐺','Lobo','character'],['dragon','🐉','Dragão','character']]
};
const LIBRARY_LABELS={brush:'Pincel e texturas',create:'Criar (futuro)',downloads:'Packs baixados',terrain:'Terrenos e texturas',furniture:'Móveis',nature:'Árvores e natureza',props:'Objetos e decoração',architecture:'Elementos de construção',characters:'Personagens e NPCs'};
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
 if(brush)brush.classList.toggle('hidden',architectCategory!=='brush');
 if(create)create.classList.toggle('hidden',architectCategory!=='create');
 if(search)search.classList.toggle('hidden',['brush','create'].includes(architectCategory));
 grid.classList.toggle('hidden',['brush','create'].includes(architectCategory));
 if(architectCategory==='brush'){selectTool('brush');syncArchitectBrushUI();}

 document.getElementById('architectLibraryTitle').textContent=LIBRARY_LABELS[architectCategory];
 document.getElementById('architectLibraryDescription').textContent=architectCategory==='brush'?'Pinte diretamente no mapa com formatos e texturas diferentes.':architectCategory==='create'?'Um espaço preparado para editores futuros.':architectCategory==='downloads'?'Texturas reais dos pacotes Kenney RPG Base e Kenney Roguelike RPG. Licença CC0.':architectCategory==='terrain'?'Pisos independentes dos estilos arquitetônicos.':
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
 if(kind==='mat')selectMaterial(id);
 else if(kind==='prop'||kind==='downloadProp')selectProp(id);
 else if(kind==='tool'){
   if(id==='wall')state.wallVariant=null;
   if(id==='door')state.doorVariant=null;
   if(id==='chest')state.chestVariant=null;
   if(id==='stairs')state.stairVariant=null;
   selectTool(id);
 }
 else if(kind==='wallVariant'){state.wallVariant=id;selectTool('wall');}
 else if(kind==='doorVariant'){state.doorVariant=id;selectTool('door');}
 else if(kind==='stairVariant'){state.stairVariant=id;selectTool('stairs');}
 else if(kind==='chestVariant'){state.chestVariant=id;selectTool('chest');}
 else if(kind==='bridgeVariant'){selectMaterial('bridge');}
 else if(kind==='character'){architectCharacterTemplate=id;selectTool('character');}
 document.getElementById('architectLibrarySelected').textContent='Selecionado: '+label+' • Clique no mapa para colocar.';
 for(const card of document.querySelectorAll('.library-card'))card.classList.toggle('active',card.textContent.trim().endsWith(label));
}
function placeArchitectCharacter(x,y){
 if(!architectCharacterTemplate)return;
 const template=GM_TEMPLATES.find(t=>t.id===architectCharacterTemplate);if(!template)return;
 const entity=instantiateTemplate(template,x,y);
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
