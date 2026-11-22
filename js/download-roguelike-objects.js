// Oito sprites recortados do Kenney Roguelike RPG Pack (CC0).
// Fonte: Spritesheet/roguelikeSheet_transparent.png, grid 16 px + margem 1 px.
const KENNEY_ROGUELIKE_OBJECTS={
 kenney_rl_tree:{col:0,row:0,label:'Árvore Roguelike',solid:true},
 kenney_rl_pine:{col:1,row:0,label:'Pinheiro Roguelike',solid:true},
 kenney_rl_bush:{col:2,row:0,label:'Arbusto Roguelike',solid:true},
 kenney_rl_torch:{col:3,row:0,label:'Tocha de parede',solid:false},
 kenney_rl_fire:{col:0,row:1,label:'Fogueira',solid:true},
 kenney_rl_stone:{col:1,row:1,label:'Pedra',solid:true},
 kenney_rl_flowers:{col:2,row:1,label:'Flores',solid:false},
 kenney_rl_stairs:{col:3,row:1,label:'Escadaria decorativa',solid:false}
};
const KENNEY_ROGUELIKE_IMAGE=new Image();
KENNEY_ROGUELIKE_IMAGE.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAABACAMAAADlCI9NAAAAYFBMVEUAAAB6rCuqt7hkjDKSl5ePZz+0g1WIvTLGZSfd3d1jlTWjVCKQhXCZcEjZyqnFj1zm2r+0p4zGxsbs4s3IpIDEt5v/2QD/yQ51f3+Ghoa5xMXj4+MAAAAAAAAAAAAAAABKatNuAAAAIHRSTlMA////////////////////////////////////AAAAAEwhjZUAAAINSURBVHja5ZlrV4MwDEDLygaIOEXdEP///5SQhfQNe5yzgPeDztMDuSNpaKvSOkugtRrQuijckaLAsbvZjIB2iMWr63UKxMcoeOEQlqjrstyegB+cJUICThJWIBAqQbMMUcAf3ZLALXqhqVoPnE6OwtMF5gI8UmA/sS2B+WnMAl8j0gTSjWbuEV8ncBiRJ4CvE/tCs9E+TgAUvCIUIWAnwrwMlxfhm8fHwgKYhEh4AQJKNQ2USNOoYIpii66UoH2Xruv73a7vu259AvcIuq3ophSIF1g2Ll0AL4/f4t5xUpj5/psXSPB0gTC7BHmuVDbD/xHIR9YuUI/cKlBVcYFXD6kCZelunJYIwMNv26pqW0yDmQ4SeLeQK+ArpMOTQDVwPsNPFOB0sMDHhFQBDH69wMsIBoXfdjrWIrDfm+HNrcMSAXMauukggU8L2QKocE0RogJ+MtMBkMCbhUSB4xEU4AjJLsN0eGrFGJbaD09DEgDkCtDBEQqgAhfiMgEOy+nA1Jhf83tCmgAsJLEIOQW0jU6HJwG7/UBgSIq/IKEESBM4jpitCP6OC3B4FrDbT5ZVF9yGH5gDAgSQwwFF8BgpVoTwiM2rw+0HBX4H/JeePAH7CNE9SrRD28HtVmy2HxRoB0ILH5kCVHb8CcknwnsJbjlm+0kLBHftTxfgRUjgXwoJzBcxtx8U+BkQL/AHpstbubhdRT8AAAAASUVORK5CYII=';
function isKenneyRoguelikeObject(type){return Object.prototype.hasOwnProperty.call(KENNEY_ROGUELIKE_OBJECTS,type);}
function drawKenneyRoguelikeObject(p){
 const obj=KENNEY_ROGUELIKE_OBJECTS[p.type];
 if(!obj)return false;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(((p.rot||0)%4)*Math.PI/2);
 ctx.imageSmoothingEnabled=false;
 const size=['kenney_rl_tree','kenney_rl_pine'].includes(p.type)?56:40;
 if(KENNEY_ROGUELIKE_IMAGE.complete&&KENNEY_ROGUELIKE_IMAGE.naturalWidth){
  ctx.drawImage(KENNEY_ROGUELIKE_IMAGE,obj.col*32,obj.row*32,32,32,-size/2,-size/2,size,size);
 }else{ctx.fillStyle='#789c63';ctx.fillRect(-12,-12,24,24);}
 ctx.restore();return true;
}
