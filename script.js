// ================== MOBILE NAVBAR LOGIC ==================
function toggleMenu() {
  const navLinks = document.getElementById('navLinks');
  navLinks.classList.toggle('active');
}

// ================== NAVIGATION ==================
function nav(pageId) {
  // 1. Pindah Halaman
  document.querySelectorAll('.page-section').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.navbar button').forEach((b) => b.classList.remove('active'));

  const target = document.getElementById('page-' + pageId);
  const btn = document.getElementById('tab-' + pageId);

  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');

  // 2. Tutup Menu Mobile otomatis setelah klik
  const navLinks = document.getElementById('navLinks');
  if (navLinks.classList.contains('active')) {
    navLinks.classList.remove('active');
  }
}

// ================== DATE & TIME ==================
function updateDateTime() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const now = new Date();

  const el = document.getElementById('datetime');
  if (el) {
    el.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} (${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')})`;
  }
}
setInterval(updateDateTime, 1000);
document.addEventListener('DOMContentLoaded', updateDateTime);

// ================== SHA-256 HELPER ==================
async function sha256(msg) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(msg));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ================== HASH PAGE ==================
const hashIn = document.getElementById('hash-input');
if (hashIn) {
  hashIn.addEventListener('input', async (e) => {
    document.getElementById('hash-output').textContent = await sha256(e.target.value);
  });
}

// ================== BLOCK PAGE ==================
const blockData = document.getElementById('block-data');
const blockNonce = document.getElementById('block-nonce');
const blockHash = document.getElementById('block-hash');
const blockTimestamp = document.getElementById('block-timestamp');
const speedControl = document.getElementById('speed-control');
const btnMine = document.getElementById('btn-mine');

if (blockNonce) {
  blockNonce.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    updateBlockHash();
  });
}
if (blockData) blockData.addEventListener('input', updateBlockHash);

async function updateBlockHash() {
  const data = blockData.value;
  const nonce = blockNonce.value || '0';
  blockHash.textContent = await sha256(data + nonce);
}

if (btnMine) {
  btnMine.addEventListener('click', async () => {
    const data = blockData.value;
    const speedMultiplier = parseInt(speedControl.value) || 1;
    const baseBatch = 1000;
    const batchSize = baseBatch * speedMultiplier;
    const difficulty = '0000';
    const status = document.getElementById('mining-status');
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });

    blockTimestamp.value = timestamp;
    blockHash.textContent = '';
    blockNonce.value = '0';
    let nonce = 0;

    if (status) status.textContent = 'Mining dimulai... ⛏️';

    async function mineStep() {
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        promises.push(sha256(data + timestamp + (nonce + i)));
      }
      const results = await Promise.all(promises);
      for (let i = 0; i < results.length; i++) {
        const h = results[i];
        if (h.startsWith(difficulty)) {
          blockNonce.value = nonce + i;
          blockHash.textContent = h;
          if (status) status.textContent = `Selesai! Nonce: ${nonce + i} 🎉`;
          return;
        }
      }
      nonce += batchSize;
      blockNonce.value = nonce;
      if (status) status.textContent = `Mining... Nonce: ${nonce}`;
      setTimeout(mineStep, 0);
    }
    mineStep();
  });
}

// ================== BLOCKCHAIN PAGE ==================
const ZERO_HASH = '0'.repeat(64);
let blocks = [];
const chainDiv = document.getElementById('blockchain');

function renderChain() {
  if (!chainDiv) return;
  chainDiv.innerHTML = '';
  blocks.forEach((blk, i) => {
    const div = document.createElement('div');
    div.className = 'blockchain-block';
    div.innerHTML = `
      <h3>Block #${blk.index}</h3>
      <label>Prev Hash:</label><div class="output" style="font-size:10px;">${blk.previousHash}</div>
      <label>Data:</label><textarea rows="2" id="c-data-${i}">${blk.data}</textarea>
      <label>Time:</label><div class="output" id="timestamp-${i}">${blk.timestamp}</div>
      <label>Nonce:</label><div class="output" id="nonce-${i}">${blk.nonce}</div>
      <label>Hash:</label><div class="output" id="hash-${i}" style="font-size:10px;">${blk.hash}</div>
      <button id="mine-${i}" class="mine">Mine Block</button>
      <div id="status-${i}" class="status"></div>`;
    chainDiv.appendChild(div);

    document.getElementById(`c-data-${i}`).addEventListener('input', (e) => {
      onChainDataChange(i, e.target.value);
    });
    document.getElementById(`mine-${i}`).addEventListener('click', () => {
      mineChainBlock(i);
    });
  });
}

function addChainBlock() {
  const idx = blocks.length;
  const prev = idx ? blocks[idx - 1].hash : ZERO_HASH;
  blocks.push({ index: idx, data: '', previousHash: prev, timestamp: '', nonce: 0, hash: '' });
  renderChain();
}

function onChainDataChange(i, val) {
  blocks[i].data = val;
  blocks[i].nonce = 0;
  blocks[i].timestamp = '';
  blocks[i].hash = '';
  for (let j = i + 1; j < blocks.length; j++) {
    blocks[j].previousHash = blocks[j - 1].hash;
    blocks[j].nonce = 0;
    blocks[j].timestamp = '';
    blocks[j].hash = '';
  }
  renderChain();
}

async function mineChainBlock(i) {
  const blk = blocks[i];
  const prev = blk.previousHash;
  const data = blk.data;
  const difficulty = '0000';
  const batchSize = 5000;

  blk.nonce = 0;
  blk.timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });

  const status = document.getElementById(`status-${i}`);
  const ndiv = document.getElementById(`nonce-${i}`);
  const hdiv = document.getElementById(`hash-${i}`);
  const tdiv = document.getElementById(`timestamp-${i}`);

  status.textContent = 'Mining...';

  async function step() {
    const promises = [];
    for (let j = 0; j < batchSize; j++) promises.push(sha256(prev + data + blk.timestamp + (blk.nonce + j)));

    const results = await Promise.all(promises);
    for (let j = 0; j < results.length; j++) {
      const h = results[j];
      if (h.startsWith(difficulty)) {
        blk.nonce += j;
        blk.hash = h;
        ndiv.textContent = blk.nonce;
        hdiv.textContent = h;
        tdiv.textContent = blk.timestamp;
        status.textContent = 'Valid! ✅';
        return;
      }
    }
    blk.nonce += batchSize;
    ndiv.textContent = blk.nonce;
    setTimeout(step, 0);
  }
  step();
}

const btnAdd = document.getElementById('btn-add-block');
if (btnAdd) {
  btnAdd.onclick = addChainBlock;
  addChainBlock();
}

// ================== ECC SIGNATURE ==================
let ec;
try {
  if (typeof elliptic !== 'undefined') ec = new elliptic.ec('secp256k1');
} catch (e) {}

const btnGenKey = document.getElementById('btn-generate-key');
if (btnGenKey) {
  btnGenKey.onclick = () => {
    if (!ec) return;
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    const priv = Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const key = ec.keyFromPrivate(priv, 'hex');
    const pub = '04' + key.getPublic().getX().toString('hex').padStart(64, '0') + key.getPublic().getY().toString('hex').padStart(64, '0');

    document.getElementById('ecc-private').value = priv;
    document.getElementById('ecc-public').value = pub;
    document.getElementById('ecc-signature').value = '';
    document.getElementById('ecc-verify-result').textContent = '';
  };
}

const btnSign = document.getElementById('btn-sign');
if (btnSign) {
  btnSign.onclick = async () => {
    const msg = document.getElementById('ecc-message').value;
    const priv = document.getElementById('ecc-private').value.trim();
    if (!msg || !priv) return alert('Isi pesan & private key!');

    const hash = await sha256(msg);
    const sig = ec.keyFromPrivate(priv, 'hex').sign(hash, { canonical: true }).toDER('hex');
    document.getElementById('ecc-signature').value = sig;
  };
}

const btnVerify = document.getElementById('btn-verify');
if (btnVerify) {
  btnVerify.onclick = async () => {
    try {
      const msg = document.getElementById('ecc-message').value;
      const sig = document.getElementById('ecc-signature').value.trim();
      const pub = document.getElementById('ecc-public').value.trim();

      const key = ec.keyFromPublic(pub, 'hex');
      const valid = key.verify(await sha256(msg), sig);

      const res = document.getElementById('ecc-verify-result');
      res.textContent = valid ? '✅ VALID' : '❌ TIDAK VALID';
      res.style.color = valid ? 'green' : 'red';
    } catch (e) {
      document.getElementById('ecc-verify-result').textContent = 'Error Format';
    }
  };
}

// ================== KONSENSUS LOGIC ==================
let balances = { A: 100, B: 100, C: 100 };
let txPool = [];
let chainsConsensus = { A: [], B: [], C: [] };

function updateBalancesDOM() {
  ['A', 'B', 'C'].forEach((u) => {
    const el = document.getElementById('saldo-' + u);
    if (el) el.textContent = balances[u];
  });
}

function parseTx(line) {
  const m = line.match(/^([A-C])\s*->\s*([A-C])\s*:\s*(\d+)$/);
  if (!m) return null;
  return { from: m[1], to: m[2], amt: parseInt(m[3]) };
}

async function shaMine(prev, data, timestamp) {
  const diff = '000';
  const base = 1000;
  const batch = base * 50;
  return new Promise((resolve) => {
    let nonce = 0;
    async function loop() {
      const promises = [];
      for (let i = 0; i < batch; i++) promises.push(sha256(prev + data + timestamp + (nonce + i)));
      const results = await Promise.all(promises);
      for (let i = 0; i < results.length; i++) {
        const h = results[i];
        if (h.startsWith(diff)) {
          resolve({ nonce: nonce + i, hash: h });
          return;
        }
      }
      nonce += batch;
      setTimeout(loop, 0);
    }
    loop();
  });
}

async function createGenesisConsensus() {
  const ts = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  const r = await shaMine(ZERO_HASH, 'Genesis Block: 100 coins', ts);

  const genesisBlock = {
    index: 0,
    prev: ZERO_HASH,
    data: 'Genesis Block: 100 coins',
    timestamp: ts,
    nonce: r.nonce,
    hash: r.hash,
    invalid: false,
  };

  for (let u of ['A', 'B', 'C']) {
    chainsConsensus[u] = [JSON.parse(JSON.stringify(genesisBlock))];
  }
  renderConsensusChains();
  updateBalancesDOM();
}

function renderConsensusChains() {
  ['A', 'B', 'C'].forEach((u) => {
    const cont = document.getElementById('chain-' + u);
    if (!cont) return;
    cont.innerHTML = '';
    chainsConsensus[u].forEach((blk, i) => {
      const d = document.createElement('div');
      d.className = 'chain-block' + (blk.invalid ? ' invalid' : '');
      d.innerHTML = `
        <div class="small">Block #${blk.index}</div>
        <div class="small">Prev:</div><input class="small" value="${blk.prev}" readonly>
        <div class="small">Data:</div><textarea id="con-data-${u}-${i}" class="data" rows="2">${blk.data}</textarea>
        <div class="small">Nonce: ${blk.nonce}</div>
        <div class="small">Hash:</div><input class="small" value="${blk.hash}" readonly>`;

      cont.appendChild(d);

      document.getElementById(`con-data-${u}-${i}`).addEventListener('input', (e) => {
        chainsConsensus[u][i].data = e.target.value;
      });
    });
  });
}

['A', 'B', 'C'].forEach((u) => {
  const btn = document.getElementById('send-' + u);
  if (btn) {
    btn.onclick = () => {
      const amt = parseInt(document.getElementById('amount-' + u).value);
      const to = document.getElementById('receiver-' + u).value;
      if (amt <= 0) return alert('Jumlah harus > 0');
      if (balances[u] < amt) return alert('Saldo tidak cukup!');

      const tx = `${u} -> ${to} : ${amt}`;
      txPool.push(tx);
      document.getElementById('mempool').value = txPool.join('\n');
    };
  }
});

const btnMineAll = document.getElementById('btn-mine-all');
if (btnMineAll) {
  btnMineAll.onclick = async () => {
    if (txPool.length === 0) return alert('Tidak ada transaksi.');
    const parsed = [];
    const tmp = { ...balances };
    for (const t of txPool) {
      const tx = parseTx(t);
      if (!tx) return alert('Format salah: ' + t);
      if (tmp[tx.from] < tx.amt) return alert('Saldo ' + tx.from + ' kurang.');
      tmp[tx.from] -= tx.amt;
      tmp[tx.to] += tx.amt;
      parsed.push(tx);
    }

    const ts = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    const data = txPool.join(' | ');

    const mining = ['A', 'B', 'C'].map(async (u) => {
      const prev = chainsConsensus[u].at(-1).hash;
      const r = await shaMine(prev, data, ts);
      chainsConsensus[u].push({
        index: chainsConsensus[u].length,
        prev,
        data,
        timestamp: ts,
        nonce: r.nonce,
        hash: r.hash,
        invalid: false,
      });
    });

    await Promise.all(mining);
    balances = tmp;
    updateBalancesDOM();
    txPool = [];
    document.getElementById('mempool').value = '';
    renderConsensusChains();
    alert('Mining Sukses!');
  };
}

const btnVerCon = document.getElementById('btn-verify-consensus');
if (btnVerCon) {
  btnVerCon.onclick = async () => {
    for (const u of ['A', 'B', 'C']) {
      for (let i = 1; i < chainsConsensus[u].length; i++) {
        const blk = chainsConsensus[u][i];
        const expectedPrev = chainsConsensus[u][i - 1].hash;
        const recomputed = await sha256(blk.prev + blk.data + blk.timestamp + blk.nonce);
        if (recomputed !== blk.hash || blk.prev !== expectedPrev) {
          blk.invalid = true;
        } else {
          blk.invalid = false;
        }
      }
    }
    renderConsensusChains();
    alert('Verifikasi Selesai.');
  };
}

const btnResolve = document.getElementById('btn-consensus');
if (btnResolve) {
  btnResolve.onclick = async () => {
    const users = ['A', 'B', 'C'];
    const maxLen = Math.max(...users.map((u) => chainsConsensus[u].length));
    for (let i = 0; i < maxLen; i++) {
      const candidates = users.map((u) => chainsConsensus[u][i]).filter((b) => b && !b.invalid);
      if (candidates.length === 0) continue;
      const freq = {};
      let majority = candidates[0];
      for (const blk of candidates) {
        const key = blk.hash + blk.data;
        freq[key] = (freq[key] || 0) + 1;
        if (freq[key] > (freq[majority.hash + majority.data] || 0)) {
          majority = blk;
        }
      }
      for (const u of users) {
        if (!chainsConsensus[u][i] || chainsConsensus[u][i].invalid) {
          chainsConsensus[u][i] = JSON.parse(JSON.stringify(majority));
          chainsConsensus[u][i].invalid = false;
        }
        if (i > 0) chainsConsensus[u][i].prev = chainsConsensus[u][i - 1].hash;
      }
    }
    renderConsensusChains();
    alert('Konsensus Tercapai!');
  };
}

createGenesisConsensus();
