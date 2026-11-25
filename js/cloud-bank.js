// Reuse the main Mesa Estelar Firebase app configuration and account.
const mesaFirebaseConfig = {
  apiKey: 'AIzaSyC298c9kpwDc4r6VL2Ryrpgzj0M5LdZSGE',
  authDomain: 'd100-mesa-estelar.firebaseapp.com',
  projectId: 'd100-mesa-estelar',
  appId: '1:1000414403401:web:fae7d2feaad04cc8bd9898'
};
const mesaCloudDialog = document.getElementById('cloudBankDialog');
const mesaCloudStatus = document.getElementById('cloudStatus');
let mesaCloud = null;
let mesaCloudConnection = null;

function setMesaCloudStatus(message) {
  mesaCloudStatus.textContent = message;
}

function refreshMesaCloudAccount(user) {
  document.getElementById('cloudLoginForm').hidden = Boolean(user);
  document.getElementById('cloudAccountControls').hidden = !user;
  document.getElementById('cloudAccountEmail').textContent = user?.email || '';
}

function connectMesaCloud() {
  if (mesaCloudConnection) return mesaCloudConnection;
  mesaCloudConnection = Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
  ]).then(async ([appSdk, authSdk, storeSdk]) => {
    const app = appSdk.initializeApp(mesaFirebaseConfig, 'mesa-estelar-2d');
    const auth = authSdk.getAuth(app);
    const db = storeSdk.getFirestore(app);
    await auth.authStateReady();
    mesaCloud = {auth, db, authSdk, storeSdk};
    authSdk.onAuthStateChanged(auth, refreshMesaCloudAccount);
    refreshMesaCloudAccount(auth.currentUser);
    return mesaCloud;
  }).catch(error => {
    mesaCloudConnection = null;
    throw error;
  });
  return mesaCloudConnection;
}

function openMesaCloud() {
  if (!mesaCloudDialog.open) mesaCloudDialog.showModal();
  if (mesaCloud) return;
  setMesaCloudStatus('Conectando ao Mesa Estelar…');
  connectMesaCloud().then(() => {
    if (!mesaCloudDialog.dataset.busy) setMesaCloudStatus('');
  }).catch(() => setMesaCloudStatus('Não foi possível conectar ao Firebase.'));
}

async function mesaCloudAction(action) {
  if (mesaCloudDialog.dataset.busy) return false;
  mesaCloudDialog.dataset.busy = 'true';
  try {
    const cloud = await connectMesaCloud();
    return await action(cloud);
  } catch (error) {
    const messages = {
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/invalid-email': 'Informe um e-mail válido.',
      'auth/user-disabled': 'Esta conta está desativada.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'permission-denied': 'O Firebase recusou o acesso ao banco desta conta.',
      'unavailable': 'O Firebase está indisponível. Tente novamente.'
    };
    setMesaCloudStatus(messages[error.code] || error.bankMessage || 'Não foi possível concluir a operação no Firebase.');
    return false;
  } finally {
    delete mesaCloudDialog.dataset.busy;
  }
}

function mesaBankError(bankMessage) {
  return Object.assign(new Error(bankMessage), {bankMessage});
}

function loginMesaCloud(event) {
  event.preventDefault();
  const password = document.getElementById('cloudPassword');
  const credentials = [document.getElementById('cloudEmail').value.trim(), password.value];
  password.value = '';
  setMesaCloudStatus('Entrando…');
  return mesaCloudAction(async ({auth, authSdk}) => {
    await authSdk.signInWithEmailAndPassword(auth, ...credentials);
    setMesaCloudStatus('Conta conectada. Agora você pode salvar ou abrir seu banco.');
  });
}

function logoutMesaCloud() {
  return mesaCloudAction(async ({auth, authSdk}) => {
    await authSdk.signOut(auth);
    setMesaCloudStatus('Conta desconectada.');
  });
}

function writeMesaBank(db, store, ref, expected, bank) {
  return store.runTransaction(db, async transaction => {
    const profile = await transaction.get(ref);
    if (!profile.exists()) throw mesaBankError('Abra sua conta no Mesa Estelar principal antes de salvar aqui.');
    if ((profile.data().mesaEstelar2dBank?.revision || null) !== expected) {
      throw mesaBankError('A versão na nuvem mudou. Abra o banco da nuvem antes de sobrescrevê-lo.');
    }
    transaction.update(ref, {mesaEstelar2dBank:bank});
  });
}

function runMesaCloudBank(action) {
  setMesaCloudStatus(action === 'save' ? 'Salvando no site…' : 'Buscando o banco salvo…');
  return mesaCloudAction(async ({auth, db, storeSdk:store}) => {
    const user = auth.currentUser;
    if (!user) throw mesaBankError('Entre com sua conta do Mesa Estelar.');
    const ref = store.doc(db, 'usuarios', user.uid);
    const revisionKey = 'mesa-firebase-bank-revision:' + user.uid;
    if (action === 'save') {
      const snapshot = snapshotState();
      if (new TextEncoder().encode(snapshot).length > 800000) {
        throw mesaBankError('O banco excede o limite de 800 KB.');
      }
      const revision = crypto.randomUUID();
      await writeMesaBank(db, store, ref, localStorage.getItem(revisionKey), {revision, snapshot});
      setMesaCloudStatus('Banco salvo na nuvem.');
      try {
        localStorage.setItem('rpg_vtt_aligned_v8', snapshot);
        localStorage.setItem(revisionKey, revision);
      } catch {
        setMesaCloudStatus('Banco salvo na nuvem. A cópia local não pôde ser salva.');
      }
      logEvent('💾 Banco salvo na nuvem.');
      playMapSavedSound();
      return true;
    }

    const profile = await store.getDocFromServer(ref);
    const bank = profile.data()?.mesaEstelar2dBank;
    if (!bank) throw mesaBankError('Ainda não há banco salvo para esta conta.');
    const incoming = JSON.parse(bank.snapshot);
    if (!incoming.scenes?.[incoming.activeSceneId] || !Array.isArray(incoming.entities) ||
        !Object.values(incoming.scenes).every(scene => Array.isArray(scene.floors) && scene.floors.length)) {
      throw mesaBankError('O banco na nuvem é inválido.');
    }
    if (!confirm(translateSiteText('Abrir este banco no lugar do banco atual? Você pode desfazer com Ctrl+Z.'))) {
      setMesaCloudStatus('Abertura cancelada.');
      return false;
    }
    finishEdit();
    const previous = snapshotState();
    beginEdit();
    try {
      restoreState(bank.snapshot);
      localStorage.setItem('rpg_vtt_aligned_v8', snapshotState());
      localStorage.setItem(revisionKey, bank.revision);
    } catch {
      restoreState(previous);
      throw mesaBankError('Não foi possível abrir o banco na nuvem.');
    } finally {
      finishEdit();
    }
    setMesaCloudStatus('Banco aberto da nuvem.');
    return true;
  });
}

mesaCloudDialog.addEventListener('close', () => {
  document.getElementById('cloudPassword').value = '';
});
connectMesaCloud().catch(() => {});
