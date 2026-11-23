const CLOUD_BANK_FILE = 'mesa-estelar-bank.json';

function encodeCloudBank(text) {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > 950000) throw Error('O banco excede o limite de 950 KB.');
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

function decodeCloudBank(content) {
  return new TextDecoder('utf-8', {fatal:true}).decode(
    Uint8Array.from(atob(content.replace(/\s/g, '')), char => char.charCodeAt(0))
  );
}

async function runCloudBank(action) {
  const dialog = document.getElementById('cloudBankDialog');
  const form = dialog.querySelector('form');
  if (!form.reportValidity() || dialog.dataset.busy) return;
  const repo = document.getElementById('cloudRepository').value.trim();
  const token = document.getElementById('cloudToken').value.trim();
  const status = document.getElementById('cloudStatus');
  if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(repo) || !token) {
    status.textContent = 'Preencha o repositório e o token.';
    return;
  }

  dialog.dataset.busy = 'true';
  status.textContent = 'Conectando ao GitHub…';
  const endpoint = 'https://api.github.com/repos/' + repo.split('/').map(encodeURIComponent).join('/');
  const revisionKey = 'mesa-cloud-revision:' + repo.toLowerCase();
  const headers = {Authorization:'Bearer ' + token, Accept:'application/vnd.github+json'};
  try {
    const response = await fetch(endpoint, {headers, cache:'no-store'});
    if (!response.ok) throw Error('Não foi possível acessar o repositório privado.');
    if (!(await response.json()).private) throw Error('Escolha um repositório privado.');
    const url = endpoint + '/contents/' + CLOUD_BANK_FILE;
    const fileResponse = await fetch(url, {headers, cache:'no-store'});
    if (!fileResponse.ok && fileResponse.status !== 404) throw Error('Não foi possível consultar o banco na nuvem.');
    const file = fileResponse.ok ? await fileResponse.json() : null;

    if (action === 'load') {
      if (!file) throw Error('Este repositório ainda não tem um banco salvo.');
      if (file.type !== 'file' || file.encoding !== 'base64') throw Error('O banco na nuvem é inválido.');
      const serialized = decodeCloudBank(file.content);
      const incoming = JSON.parse(serialized);
      if (!incoming.scenes?.[incoming.activeSceneId] || !Array.isArray(incoming.entities) ||
          !Object.values(incoming.scenes).every(scene => Array.isArray(scene.floors) && scene.floors.length)) {
        throw Error('O banco na nuvem é inválido.');
      }
      if (!confirm(translateSiteText('Abrir este banco no lugar do banco atual? Você pode desfazer com Ctrl+Z.'))) {
        status.textContent = 'Abertura cancelada.';
        return;
      }
      finishEdit();
      const backup = snapshotState();
      beginEdit();
      try {
        restoreState(serialized);
        localStorage.setItem('rpg_vtt_aligned_v8', snapshotState());
      } catch {
        restoreState(backup);
        finishEdit();
        throw Error('O banco na nuvem é inválido.');
      }
      finishEdit();
      localStorage.setItem(revisionKey, file.sha);
      localStorage.setItem('mesa-cloud-repository', repo);
      status.textContent = 'Banco aberto da nuvem.';
      return;
    }

    if (file && file.sha !== localStorage.getItem(revisionKey)) {
      throw Error('A versão na nuvem mudou. Abra o banco da nuvem antes de sobrescrevê-lo.');
    }
    const serialized = snapshotState();
    const content = encodeCloudBank(serialized);
    const saved = await fetch(url, {
      method:'PUT',
      headers:{...headers, 'Content-Type':'application/json'},
      body:JSON.stringify({message:'Salvar banco Mesa Estelar', content, ...(file ? {sha:file.sha} : {})})
    });
    if (saved.status === 409 || saved.status === 422) {
      throw Error('O GitHub recusou a gravação. Confira se o repositório foi inicializado e se a versão mudou.');
    }
    if (!saved.ok) throw Error('Falha ao salvar. Verifique a permissão de escrita em Contents.');
    const result = await saved.json();
    status.textContent = 'Banco salvo na nuvem.';
    try {
      localStorage.setItem('rpg_vtt_aligned_v8', serialized);
      localStorage.setItem(revisionKey, result.content.sha);
      localStorage.setItem('mesa-cloud-repository', repo);
    } catch {
      status.textContent = 'Banco salvo na nuvem. A cópia local não pôde ser salva.';
    }
    playMapSavedSound();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    delete dialog.dataset.busy;
  }
}

document.getElementById('cloudRepository').value = localStorage.getItem('mesa-cloud-repository') || '';
document.getElementById('cloudBankDialog').addEventListener('close', () => {
  document.getElementById('cloudToken').value = '';
});
