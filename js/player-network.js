let sessionPeer=null,hostPeerId=null,hostConnection=null;
const playerConnections=new Map();
const playerBus={
 postMessage(message){
  const connection=guestPage?hostConnection:playerConnections.get(message.to);
  if(connection?.open)connection.send(message);
 }
};
function createSessionPeer(){
 if(sessionPeer&&!sessionPeer.destroyed)return sessionPeer;
 if(typeof Peer!=='function')throw Error('WebRTC indisponível');
 sessionPeer=new Peer();
 sessionPeer.on('error',()=>sessionStatus(sessionLabel('Falha na conexão. Tente novamente.','连接失败，请重试。')));
 sessionPeer.on('disconnected',()=>{if(!sessionPeer.destroyed)sessionPeer.reconnect();});
 return sessionPeer;
}
function startNetworkHost(){
 const peer=createSessionPeer();
 if(peer.open){hostPeerId=peer.id;return;}
 peer.once('open',id=>{hostPeerId=id;});
 peer.on('connection',connection=>{
  const id=connection.connectionId;
  playerConnections.set(id,connection);
  connection.on('data',message=>{
   if(message&&typeof message==='object')receivePlayerSession({data:{...message,from:id}});
  });
  connection.on('close',()=>{playerConnections.delete(id);playerPeers.delete(id);});
 });
}
function joinNetworkHost(host,proof,request){
 const peer=createSessionPeer();
 const connect=()=>{
  if(request!==guestRequest)return;
  const previous=hostConnection;
  const connection=peer.connect(host,{reliable:true});
  hostConnection=connection;
  previous?.close();
  connection.on('data',message=>{
   if(hostConnection===connection&&message&&typeof message==='object')receivePlayerSession({data:{...message,to:playerClientId}});
  });
  connection.on('open',()=>connection.send({type:'join',proof,request}));
  connection.on('close',()=>{
   if(hostConnection!==connection)return;
   guestToken=null;guestActorId=null;guestLastUpdate=0;
   sessionStatus(sessionLabel('Conexão encerrada. Entre novamente.','连接已关闭，请重新登录。'));
   const dialog=document.getElementById('playerSessionLogin');if(!dialog.open)dialog.showModal();
  });
 };
 if(peer.open)connect();else peer.once('open',connect);
}
