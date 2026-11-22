// Segunda seleção de assets reais extraídos do Kenney RPG Base (CC0).
// Cada célula ocupa 32 x 32 pixels, miniatura nearest-neighbor do tile original 64 x 64.
const KENNEY_OBJECTS={
 kenney_tree_green:{col:0,row:0,label:'Árvore verde',solid:true},
 kenney_pine:{col:1,row:0,label:'Conífera',solid:true},
 kenney_tree_autumn:{col:2,row:0,label:'Árvore outonal',solid:true},
 kenney_bush:{col:3,row:0,label:'Arbusto',solid:true},
 kenney_arch:{col:0,row:1,label:'Arco de pedra decorativo',solid:true},
 kenney_window:{col:1,row:1,label:'Janela decorativa',solid:false},
 kenney_crate:{col:2,row:1,label:'Caixote',solid:true},
 kenney_barrel:{col:3,row:1,label:'Barril',solid:true},
 kenney_ladder:{col:0,row:2,label:'Escada de mão',solid:false},
 kenney_door:{col:1,row:2,label:'Porta decorativa',solid:true},
 kenney_urn:{col:2,row:2,label:'Vaso de pedra',solid:true},
 kenney_fence:{col:3,row:2,label:'Cerca',solid:true}
};
const KENNEY_OBJECT_IMAGE=new Image();
KENNEY_OBJECT_IMAGE.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAABgCAMAAADipIp7AAAAYFBMVEUAAACmeE6zhlmAtCx2pyrGkV7Cdhqio5fEt5tCnmTf0rROTk6uaxs6j1p6iotfYScvVCRgXVLq38lbVxora0NILxFQOCBtb2UzSBKGVR0xek1MRzuHfWiSh3FXUEM9RUZn+0rqAAAAIHRSTlMA/v7//f///v////37/f6UVl3/b5otS5M6o8Mwl6g/P870Im8AAARYSURBVHja7ZnZcuMgEEUB4WBbaPeSff7/L0csWoAGYxlJ8zBdFccVsO/hdtNQCkKvBn/zB0frxzUIkJ6A0mgDxAi/JtffFYCqiC6B5EWgAeo4Ap66BugUXWQRJnWAzuORA5zz5A4o5SyzAW6c+wDSZyATId5Us4GOgxYsTID97WNUSp9qhHArUgmAAIo+Lj7xikL7zFr/4MG8Cri7epkDqwlchPrpVBTBLDsLNIdGgGAdcmWCvfqTiqL49OmPC/QAzGbQdx+A9v+Nf9jun4YoAkUuVmnu9BFuykFmVoqZA5kBpwKE+4pAZOGz9i1//NVBAGMdWDn4mBC4fuXct3yVhRoAUD+DQA1WBwwAFGLn+i8tGAuhBi2eK7j5MXNgKhjdgNsbQBowk3fqYBDwAJi7EHLAMMEuP7EBioFh0P90O4ClUAMZCgH0JuhwRi4DwLwM3O+3ACoDMDMAMrBdYRVA/zu5YTRE6hAYAlYFDhO65wDsjYCiAez0eJOAiYilAFOntU88ECB7GsCoQSsFNaXOaTP2WlgfsODqBaiBIijA684k/8gAoAoqogA68BQO1aD4cEWtQOhZB5QBoAXocinMVlyE73zUrQ8IgEYDmCbAV4KugvRrGkiBSRAGQPWl0FshdCV5R1YPrH36XgvwzXvhE8qFexJGXkYjOsEH3IcSXMd9AO/of6SMb6bj1zOhUcMryTN2HIKx79AM9rOCPJnkFQKgP42mJ1BfzuQ+1u8baAph0gb2tYY+wWNIgquV//5PeU5InovBFdKP50EcETElVwB5agsaRx8gYFJ/ADgSs4KgeC4BGLsEjPgBTHvIwQ0QoKoq96T4YUb+Z3XA4gGc9UMAWJxWGPMYAyTBfCckAMDaG/u8gg2wLRCzhlgG0OvrIdMDUYKQvqyChAB8nNR7YHz4GAvwWgrwNOdg3Fl8JSCLYAWAPhEHUu0JYOdgawCyDsDjRjRuAgFQ7QMwVgFeBhDahhEARBMcVgDAwFmEIQDNhlOnIA6AaASyBoDbxjBCXsh9AGb7cCcHNEFfAnulQG0EMbbgLAheuGIAuLqNiEuJeSHYCkDdh2QFYLQLwA0rBLwMwG50T/eB6UEmR0sAggF+3DOxAs4Iz0ONwFDC+DcAPGEB3Esdf1IDEE8YAGXJxijvmwPkM3mJsDGAllfPDxRBs2UNSP1Zs0npQcwukPoGWkKCCICmtPX7npqMIAIA0Fce5NsA3M38zwjKbQBAAxRBs8kuKGF9wAK1Q5vEfaBhsQDsLMN6yNnhFwFyHwCxALT++Wyc4r2P+DUAXwkIC0pIv/fg94kjdQ2AM3sSIFiEkQDN+RWA0FAkADMAvqIWKC9uqwAc71EplrfrZAAtnIPtAMTCZewG0CqE/rW1AB7XQIJdwM7nIQmt7cAmfUCkoG2Hl50AevG2BYrwYQqSASzehmlqwNsJN9kFwbNgi07oPY63Ogvkf/+U/DfaCUDdXxvg0UFA/y8ypGjByWEXjwAAAABJRU5ErkJggg==';
function isKenneyObject(type){return Object.prototype.hasOwnProperty.call(KENNEY_OBJECTS,type);}
function drawKenneyObject(p){
 const obj=KENNEY_OBJECTS[p.type];if(!obj)return false;
 const {x,y}=p;
 ctx.save();ctx.translate(x,y);ctx.rotate(((p.rot||0)%4)*Math.PI/2);
 ctx.imageSmoothingEnabled=false;
 if(KENNEY_OBJECT_IMAGE.complete&&KENNEY_OBJECT_IMAGE.naturalWidth) {
   const scale=['kenney_tree_green','kenney_tree_autumn','kenney_pine','kenney_arch'].includes(p.type)?2:1.6;
   const size=32*scale;
   ctx.drawImage(KENNEY_OBJECT_IMAGE,obj.col*32,obj.row*32,32,32,-size/2,-size/2,size,size);
 }else{
   ctx.fillStyle='#799b6a';ctx.fillRect(-16,-16,32,32);
 }
 ctx.restore();return true;
}
