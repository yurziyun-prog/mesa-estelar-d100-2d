const extraKenneySprites=new Map();
const extraKenneyImages=new Map();
const curatedSciFiSizes=new Map(curatedSciFiProps.map(([id,,size])=>[id,size]));
for(const [pack,label,cell,names] of kenneyExtraPacks){
 names.forEach((name,index)=>extraKenneySprites.set('kenney_extra_'+pack+'_'+index,{
   pack,label:label+' · '+name,cell,x:(index%16)*cell,y:Math.floor(index/16)*cell
 }));
}
function extraKenneyImage(pack){
 if(!extraKenneyImages.has(pack)){
   const image=new Image();
   image.src='assets/downloads/kenney-extra/'+pack+'.webp';
   extraKenneyImages.set(pack,image);
 }
 return extraKenneyImages.get(pack);
}
function drawExtraKenneySprite(g,sprite,x,y,size){
 const image=extraKenneyImage(sprite.pack);
 if(!image.complete||!image.naturalWidth)return false;
 g.imageSmoothingEnabled=false;
 g.drawImage(image,sprite.x,sprite.y,sprite.cell,sprite.cell,x,y,size,size);
 return true;
}
function drawExtraKenneyProp(prop){
 const sprite=extraKenneySprites.get(prop.type);
 if(!sprite)return false;
 const size=curatedSciFiSizes.get(prop.type)??(['pirates','space','starships','ultimate_spaceships'].includes(sprite.pack)?78:34);
 ctx.save();
 ctx.translate(prop.x,prop.y);
 ctx.rotate((prop.rot||0)*Math.PI/2);
 drawExtraKenneySprite(ctx,sprite,-size/2,-size/2,size);
 ctx.restore();
 return true;
}
function extraKenneyThumbnail(id){
 const sprite=extraKenneySprites.get(id);
 if(!sprite)return null;
 const thumb=document.createElement('canvas');
 thumb.width=36;thumb.height=36;thumb.className='library-thumb';
 const g=thumb.getContext('2d');
 if(!drawExtraKenneySprite(g,sprite,1,1,34)){
   extraKenneyImage(sprite.pack).addEventListener('load',()=>drawExtraKenneySprite(g,sprite,1,1,34),{once:true});
 }
 return thumb;
}
function extraKenneyEntries(pack){
 return [...extraKenneySprites].filter(([,sprite])=>sprite.pack===pack)
   .map(([id,sprite])=>[id,'',sprite.label,'downloadProp']);
}
