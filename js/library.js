// Biblioteca do Arquiteto, independente da ficha do Mestre e do Jogador.
const ARCHITECT_LIBRARY = {
 terrain:[['grass','🌿','Grama','mat'],['sand','🏜️','Areia','mat'],['dirt','🟤','Terra','mat'],['snow','❄️','Neve','mat'],['water','🌊','Água','mat'],['bridge','🌉','Ponte','mat'],['wood','🪵','Madeira','mat'],['checker','🔲','Ladrilho','mat'],['marble','🏛️','Mármore','mat'],['carpet','🟥','Tapete','mat'],['stone','🪨','Pedra irregular','mat'],['cobble','🧱','Calçamento','mat'],['metal','🔩','Piso metálico','mat'],['mosaic','🌀','Mosaico','mat']],
 furniture:[['table','🪵','Mesa','prop'],['chair','🪑','Cadeira','prop'],['bed','🛏️','Cama','prop'],['bookshelf','📚','Estante','prop'],['hearth','🔥','Lareira','prop'],['barrel','🛢️','Barril','prop'],['bench','🪑','Banco','prop'],['cabinet','🚪','Armário','prop'],['desk','🗄️','Escrivaninha','prop'],['sofa','🛋️','Sofá','prop'],['lowTable','🫖','Mesa baixa','prop'],['console','🖥️','Console','prop'],['lamp','💡','Luminária','prop']],
 nature:[['tree','🌳','Carvalho','prop'],['pine','🌲','Pinheiro','prop'],['fruitTree','🍎','Frutífera','prop'],['bush','🌿','Arbusto','prop'],['rock','🪨','Rocha','prop'],['palm','🌴','Palmeira','prop'],['desertTree','🌳','Árvore de deserto','prop'],['cactus','🌵','Cacto','prop'],['flowers','🌸','Flores','prop'],['reeds','🌾','Juncos','prop'],['crystal','💎','Cristal','prop']],
 props:[['tent','⛺','Tenda','prop'],['oilLamp','🪔','Lâmpada de óleo','prop'],['cushions','🧵','Almofadas','prop'],['log','🪵','Tronco móvel','prop'],['urn','🏺','Ânfora','prop'],['crate','📦','Caixote','prop'],['rug','🧶','Tapete decorativo','prop'],['screen','🪟','Biombo','prop'],['fountain','⛲','Fonte','prop'],['torch','🔥','Tocha','prop']],
 architecture:[['wall','🧱','Parede','tool'],['window','🪟','Janela','tool'],['door','🚪','Porta','tool'],['stairs','🪜','Escada','tool'],['chest','🧰','Baú','tool']],
 characters:[['warrior','⚔️','Guerreiro','character'],['mage','🪄','Maga','character'],['ranger','🏹','Arqueira','character'],['villager','🧑','Aldeão','character'],['guard','🛡️','Guarda','character'],['merchant','🧳','Mercadora','character'],['goblin','👺','Goblin','character'],['skeleton','💀','Esqueleto','character'],['wolf','🐺','Lobo','character'],['dragon','🐉','Dragão','character']]
};
const LIBRARY_LABELS={terrain:'Terrenos e texturas',furniture:'Móveis',nature:'Árvores e natureza',props:'Objetos e decoração',architecture:'Construção',characters:'Personagens e NPCs'};
let architectCategory='furniture';
let architectCharacterTemplate=null;
function openArchitectLibrary(category){
 if(!ARCHITECT_LIBRARY[category])return;
 architectCategory=category;
 const search=document.getElementById('architectLibrarySearch');
 if(search)search.value='';
 renderArchitectLibrary();
}
function renderArchitectLibrary(){
 const grid=document.getElementById('architectLibraryGrid');if(!grid)return;
 document.getElementById('architectLibraryTitle').textContent=LIBRARY_LABELS[architectCategory];
 document.getElementById('architectLibraryDescription').textContent=architectCategory==='terrain'?'Pisos independentes dos estilos arquitetônicos.':
  architectCategory==='characters'?'Selecione um modelo e clique no mapa para colocá-lo.':
  'Os novos itens seguem a coleção de construção selecionada, sem modificar os anteriores.';
 const query=(document.getElementById('architectLibrarySearch')?.value||'').toLocaleLowerCase('pt-BR');
 grid.replaceChildren();
 for(const [id,icon,label,kind] of ARCHITECT_LIBRARY[architectCategory]){
  if(!label.toLocaleLowerCase('pt-BR').includes(query))continue;
  if(!isItemInBuildCollection(id,architectCategory))continue;
  const button=document.createElement('button');button.type='button';button.className='library-card';
  const emoji=document.createElement('span');emoji.className='emoji';emoji.textContent=icon;
  const name=document.createElement('span');name.textContent=label;
  button.append(emoji,name);button.onclick=()=>selectArchitectLibraryItem(id,label,kind);
  grid.append(button);
 }
}
function selectArchitectLibraryItem(id,label,kind){
 architectCharacterTemplate=null;
 if(kind==='mat')selectMaterial(id);
 else if(kind==='prop')selectProp(id);
 else if(kind==='tool')selectTool(id);
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
 if(category==='terrain'||category==='architecture'||category==='characters')return true;
 const arabia=new Set(['palm','desertTree','cactus','tent','oilLamp','cushions','lowTable','urn','rug','fountain']);
 const futurist=new Set(['console','lamp','crystal']);
 if(style==='arabia')return !futurist.has(id);
 if(style==='futurist')return !arabia.has(id) || id==='palm';
 return !futurist.has(id) && !arabia.has(id);
}
