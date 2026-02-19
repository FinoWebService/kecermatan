// ============================================================
// FIREBASE IMPORTS
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// ============================================================
// FIREBASE INIT
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyBvAuX66peHvmpKtvdh9MIk9Em3WnxDLLU",
  authDomain:        "cat-kecermatan-cb9d1.firebaseapp.com",
  projectId:         "cat-kecermatan-cb9d1",
  storageBucket:     "cat-kecermatan-cb9d1.firebasestorage.app",
  messagingSenderId: "1081198055610",
  appId:             "1:1081198055610:web:d5e9de4f650d86fce57283"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ============================================================
// APP STATE
// ============================================================
let currentAdmin       = null;
let allUsers           = [];
let allTests           = [];
let allAdmins          = [];
let pendingDeleteUserId  = null;
let pendingDeleteTestId  = null;
let pendingRevokeAdminId = null;

// Chart instances (stored for destruction before re-render)
let actChart, distChart, trendChart, userBarChart;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/** Shorthand getElementById */
function $(id){ return document.getElementById(id); }

/** Show a toast notification */
function showToast(msg, type = 'info'){
  const t = $('toast');
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  t.textContent = `${icon} ${msg}`;
  t.className   = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

/** Format a Firestore timestamp to Indonesian locale string */
function formatDate(ts){
  if(!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/** Format a Firestore timestamp to short date only */
function formatDateShort(ts){
  if(!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Get initials (max 2 chars) from a name */
function initials(name){ return name ? name.slice(0, 2).toUpperCase() : '??'; }

/** Return a CSS color string based on score value */
function scoreColor(v){
  if(v >= 80) return '#3dbf7e';   /* green  */
  if(v >= 60) return '#5dd9c1';   /* accent mint */
  if(v >= 40) return '#d4a843';   /* gold   */
  return '#e05555';               /* red    */
}

// ============================================================
// LIVE CLOCK
// ============================================================
setInterval(() => {
  $('liveTime').textContent = new Date().toLocaleTimeString('id-ID');
}, 1000);

// ============================================================
// LOGIN
// ============================================================
$('btnLogin').addEventListener('click', handleLogin);
$('loginPass').addEventListener('keydown', e => { if(e.key === 'Enter') handleLogin(); });

async function handleLogin(){
  const username = $('loginUser').value.trim();
  const password = $('loginPass').value;
  $('loginErr').textContent = '';

  if(!username || !password){
    $('loginErr').textContent = 'Username dan password wajib diisi!';
    return;
  }

  $('btnLogin').textContent = 'Memeriksa...';
  $('btnLogin').disabled    = true;

  try {
    const q    = query(
      collection(db, 'admins'),
      where('username', '==', username),
      where('password', '==', password),
      where('status',   '==', 'active')
    );
    const snap = await getDocs(q);

    if(snap.empty){
      $('loginErr').textContent = 'Username atau password salah!';
      return;
    }

    const d    = snap.docs[0];
    currentAdmin = { id: d.id, ...d.data() };
    localStorage.setItem('cermatrix_admin', JSON.stringify(currentAdmin));
    bootApp();

  } catch(e){
    $('loginErr').textContent = 'Terjadi kesalahan: ' + e.message;
  } finally {
    $('btnLogin').textContent = 'MASUK KE PANEL';
    $('btnLogin').disabled    = false;
  }
}

// Auto-login from saved session
(function checkSavedSession(){
  const saved = localStorage.getItem('cermatrix_admin');
  if(!saved) return;
  try {
    const admin = JSON.parse(saved);
    if(admin?.username){ currentAdmin = admin; bootApp(); }
    else throw new Error('Invalid session');
  } catch {
    localStorage.removeItem('cermatrix_admin');
  }
})();

// ============================================================
// BOOT APP
// ============================================================
function bootApp(){
  $('loginScreen').classList.add('hidden');
  $('adminApp').classList.add('visible');
  $('sbUsername').textContent = currentAdmin.username;
  $('sbAvatar').textContent   = initials(currentAdmin.username);

  // Show invite section only if admin has the inviteAdmin permission
  if(currentAdmin.permissions?.inviteAdmin){
    $('inviteSection').style.display = 'block';
  }

  loadAll();
}

// ============================================================
// FETCH DATA FROM FIREBASE
// ============================================================
async function fetchUsers(){
  const snap = await getDocs(collection(db, 'users'));
  allUsers   = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchTests(){
  const snap = await getDocs(collection(db, 'hasilTes'));
  allTests   = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  allTests.sort((a, b) => (b.waktu?.seconds || 0) - (a.waktu?.seconds || 0));
}

async function fetchAdmins(){
  const snap  = await getDocs(collection(db, 'admins'));
  allAdmins   = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Fetch all data in parallel, then render all sections */
async function loadAll(){
  await Promise.all([fetchUsers(), fetchTests(), fetchAdmins()]);
  renderDashboard();
  renderUsers();
  renderTests();
  renderAdmins();
  renderAnalytics();
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard(){
  const scores   = allTests.map(t => t.nilai || 0);
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const topScore = scores.length ? Math.max(...scores) : 0;

  $('kpi-users').textContent = allUsers.length;
  $('kpi-tests').textContent = allTests.length;
  $('kpi-avg').textContent   = avgScore;
  $('kpi-top').textContent   = topScore;

  // Sub-labels
  const weekMs      = 7 * 24 * 3600 * 1000;
  const recentUsers = allUsers.filter(u => {
    if(!u.createdAt) return false;
    const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
    return Date.now() - d.getTime() < weekMs;
  });
  $('kpi-users-sub').textContent = `+${recentUsers.length} minggu ini`;
  $('kpi-tests-sub').textContent = `dari ${allUsers.length} user`;
  $('kpi-avg-sub').textContent   = `dari ${allTests.length} tes`;

  const topEntry = allTests.find(t => t.nilai === topScore);
  $('kpi-top-sub').textContent = topEntry ? `oleh ${topEntry.nama}` : '';

  renderActivityChart();
  renderDistChart();
  renderRecentTests();
  renderTopPerformers();
}

function renderActivityChart(){
  // Build last-30-days buckets
  const buckets = {};
  const now     = new Date();
  for(let i = 29; i >= 0; i--){
    const d   = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    buckets[key] = 0;
  }
  allTests.forEach(t => {
    if(!t.waktu) return;
    const key = t.waktu.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    if(key in buckets) buckets[key]++;
  });

  if(actChart) actChart.destroy();
  actChart = new Chart($('activityChart'), {
    type: 'line',
    data: {
      labels:   Object.keys(buckets),
      datasets: [{
        data:            Object.values(buckets),
        borderColor:     '#1a6b6b',
        backgroundColor: 'rgba(26,107,107,0.12)',
        borderWidth:     2.5,
        tension:         0.4,
        fill:            true,
        pointRadius:     3,
        pointBackgroundColor: '#5dd9c1'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#527070', maxTicksLimit: 8, font: { size: 11 } }, grid: { color: '#1f4040' } },
        y: { ticks: { color: '#527070', font: { size: 11 } }, grid: { color: '#1f4040' }, beginAtZero: true }
      }
    }
  });
}

function renderDistChart(){
  const buckets = { '0–20': 0, '21–40': 0, '41–60': 0, '61–80': 0, '81–100': 0 };
  allTests.forEach(t => {
    const v = t.nilai || 0;
    if     (v <= 20) buckets['0–20']++;
    else if(v <= 40) buckets['21–40']++;
    else if(v <= 60) buckets['41–60']++;
    else if(v <= 80) buckets['61–80']++;
    else             buckets['81–100']++;
  });

  if(distChart) distChart.destroy();
  distChart = new Chart($('distChart'), {
    type: 'doughnut',
    data: {
      labels:   Object.keys(buckets),
      datasets: [{
        data:            Object.values(buckets),
        backgroundColor: ['#e05555', '#d4a843', '#4a9ed6', '#1a6b6b', '#3dbf7e'],
        borderWidth:     0,
        hoverOffset:     6
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#a3d5d3', padding: 12, font: { size: 11 } }
        }
      }
    }
  });
}

function renderRecentTests(){
  const el     = $('recentTests');
  const recent = allTests.slice(0, 6);
  if(!recent.length){
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>Belum ada tes</p></div>';
    return;
  }
  el.innerHTML = recent.map(t => `
    <div class="activity-item">
      <div class="act-avatar">${initials(t.nama)}</div>
      <div class="act-info">
        <div class="act-name">${t.nama}</div>
        <div class="act-date">${formatDate(t.waktu)}</div>
      </div>
      <div class="act-score" style="color:${scoreColor(t.nilai)}">${t.nilai}</div>
    </div>
  `).join('');
}

function renderTopPerformers(){
  const byUser = {};
  allTests.forEach(t => {
    if(!byUser[t.userId]) byUser[t.userId] = { nama: t.nama, best: t.nilai, count: 1 };
    else {
      if(t.nilai > byUser[t.userId].best) byUser[t.userId].best = t.nilai;
      byUser[t.userId].count++;
    }
  });
  const sorted = Object.values(byUser).sort((a, b) => b.best - a.best).slice(0, 7);
  const el     = $('topPerformers');

  if(!sorted.length){
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div><p>Belum ada data</p></div>';
    return;
  }
  el.innerHTML = sorted.map((u, i) => {
    const cls   = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'other';
    const medal = i === 0 ? '🥇'  : i === 1 ? '🥈'    : i === 2 ? '🥉'    : i + 1;
    return `
      <div class="rank-item">
        <div class="rank-pos ${cls}">${medal}</div>
        <div class="rank-info">
          <div class="rank-name">${u.nama}</div>
          <div class="rank-tests">${u.count} tes</div>
        </div>
        <div class="rank-score" style="color:${scoreColor(u.best)}">${u.best}</div>
      </div>
    `;
  }).join('');
}

// ============================================================
// USERS TABLE
// ============================================================
function renderUsers(filter = 'all', search = ''){
  const body     = $('usersTableBody');
  const weekMs   = 7 * 24 * 3600 * 1000;

  // Build per-user test stats
  const statsMap = {};
  allTests.forEach(t => {
    if(!statsMap[t.userId]) statsMap[t.userId] = { best: 0, sum: 0, count: 0 };
    statsMap[t.userId].count++;
    statsMap[t.userId].sum  += (t.nilai || 0);
    if(t.nilai > statsMap[t.userId].best) statsMap[t.userId].best = t.nilai;
  });

  let filtered = allUsers.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase())
  );
  if(filter === 'active') filtered = filtered.filter(u => statsMap[u.id]?.count > 0);
  if(filter === 'new')    filtered = filtered.filter(u => {
    if(!u.createdAt) return false;
    const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
    return Date.now() - d.getTime() < weekMs;
  });

  if(!filtered.length){
    body.innerHTML = `<tr><td colspan="6">
      <div class="empty-state"><div class="empty-icon">👥</div><p>Tidak ada data</p></div>
    </td></tr>`;
    return;
  }

  body.innerHTML = filtered.map(u => {
    const st  = statsMap[u.id] || { best: 0, sum: 0, count: 0 };
    const avg = st.count ? Math.round(st.sum / st.count) : 0;
    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-avatar">${initials(u.username)}</div>
            <div>
              <div class="user-name">${u.username}</div>
              <div class="user-id">#${u.id.slice(0, 8)}</div>
            </div>
          </div>
        </td>
        <td>${st.count}</td>
        <td><span class="score-val" style="color:${scoreColor(st.best)}">${st.best || '—'}</span></td>
        <td><span class="score-val" style="color:${scoreColor(avg)}">${st.count ? avg : '—'}</span></td>
        <td>${formatDateShort(u.createdAt)}</td>
        <td>
          <div class="td-actions">
            <button class="btn-sm btn-view" onclick="window.viewUser('${u.id}')">👁 Detail</button>
            ${currentAdmin.permissions?.manageUsers
              ? `<button class="btn-sm btn-del" onclick="window.promptDeleteUser('${u.id}','${u.username}')">🗑</button>`
              : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Search input
$('userSearch').addEventListener('input', e => {
  const active = document.querySelector('#sec-users .filter-tab.active');
  renderUsers(active?.dataset.filter || 'all', e.target.value);
});

// Filter tabs
document.querySelectorAll('#sec-users .filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#sec-users .filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderUsers(btn.dataset.filter, $('userSearch').value);
  });
});

// View user detail modal
window.viewUser = function(uid){
  const user      = allUsers.find(u => u.id === uid);
  if(!user) return;

  const userTests = allTests.filter(t => t.userId === uid);
  const scores    = userTests.map(t => t.nilai || 0);
  const best      = scores.length ? Math.max(...scores) : 0;
  const avg       = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  $('modalUserTitle').textContent      = user.username;
  $('modalUserDesc').textContent       = `ID: ${user.id}`;
  $('btnDeleteUserModal').dataset.uid  = uid;

  $('userDetailGrid').innerHTML = `
    <div class="detail-item"><div class="detail-label">Total Tes</div><div class="detail-val accent">${userTests.length}</div></div>
    <div class="detail-item"><div class="detail-label">Best Score</div><div class="detail-val accent">${best || '—'}</div></div>
    <div class="detail-item"><div class="detail-label">Avg Score</div><div class="detail-val accent">${userTests.length ? avg : '—'}</div></div>
    <div class="detail-item"><div class="detail-label">Bergabung</div><div class="detail-val">${formatDateShort(user.createdAt)}</div></div>
  `;

  const recentUserTests = userTests.slice(0, 5);
  $('userHistoryWrap').innerHTML = recentUserTests.length ? `
    <div style="margin-top:16px;">
      <div style="font-size:12px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
        Riwayat Tes
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${recentUserTests.map(t => `
          <div style="display:flex;justify-content:space-between;align-items:center;background:var(--panel2);border-radius:8px;padding:10px 14px;">
            <span style="font-size:13px;color:var(--muted);">${formatDate(t.waktu)}</span>
            <span style="font-family:var(--mono);font-weight:700;color:${scoreColor(t.nilai)}">${t.nilai}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Hide delete button if no permission
  $('btnDeleteUserModal').style.display =
    currentAdmin.permissions?.manageUsers ? '' : 'none';

  $('userModal').classList.add('show');
};

$('closeUserModal').addEventListener('click', () => $('userModal').classList.remove('show'));
$('btnCancelModal').addEventListener('click',  () => $('userModal').classList.remove('show'));
$('btnDeleteUserModal').addEventListener('click', () => {
  const uid  = $('btnDeleteUserModal').dataset.uid;
  const user = allUsers.find(u => u.id === uid);
  $('userModal').classList.remove('show');
  window.promptDeleteUser(uid, user?.username);
});

window.promptDeleteUser = function(uid, uname){
  $('confirmTitle').textContent = 'Hapus User';
  $('confirmDesc').textContent  = `Yakin hapus user "${uname}"? Semua tesnya juga akan dihapus.`;
  pendingDeleteUserId           = uid;
  $('confirmModal').classList.add('show');
  $('btnConfirmYes').onclick    = confirmDeleteUser;
};

async function confirmDeleteUser(){
  $('confirmModal').classList.remove('show');
  try {
    await deleteDoc(doc(db, 'users', pendingDeleteUserId));
    const userTests = allTests.filter(t => t.userId === pendingDeleteUserId);
    await Promise.all(userTests.map(t => deleteDoc(doc(db, 'hasilTes', t.id))));
    showToast('User berhasil dihapus', 'success');
    await Promise.all([fetchUsers(), fetchTests()]);
    renderUsers(); renderTests(); renderDashboard(); renderAnalytics();
  } catch(e){ showToast('Gagal: ' + e.message, 'error'); }
}

// ============================================================
// TESTS TABLE
// ============================================================
function renderTests(search = ''){
  const body     = $('testsTableBody');
  const filtered = allTests.filter(t =>
    !search || t.nama.toLowerCase().includes(search.toLowerCase())
  );
  $('totalTestsCount').textContent = filtered.length;

  if(!filtered.length){
    body.innerHTML = `<tr><td colspan="6">
      <div class="empty-state"><div class="empty-icon">📭</div><p>Tidak ada hasil tes</p></div>
    </td></tr>`;
    return;
  }

  body.innerHTML = filtered.map((t, i) => `
    <tr>
      <td style="color:var(--muted);font-family:var(--mono);font-size:12px;">${i + 1}</td>
      <td>
        <div class="user-cell">
          <div class="user-avatar" style="width:30px;height:30px;font-size:11px;">${initials(t.nama)}</div>
          <span style="font-weight:600;">${t.nama}</span>
        </div>
      </td>
      <td><span class="score-val" style="color:${scoreColor(t.nilai)}">${t.nilai}</span></td>
      <td>
        <div class="score-bar-wrap">
          <div class="score-bar">
            <div class="score-bar-fill" style="width:${t.nilai}%"></div>
          </div>
          <span style="font-size:12px;color:var(--muted);">${t.nilai}%</span>
        </div>
      </td>
      <td style="font-size:13px;color:var(--muted);">${formatDate(t.waktu)}</td>
      <td>
        ${currentAdmin.permissions?.deleteTests
          ? `<button class="btn-sm btn-del" onclick="window.promptDeleteTest('${t.id}','${t.nama}')">🗑 Hapus</button>`
          : '<span style="color:var(--muted);font-size:12px;">—</span>'}
      </td>
    </tr>
  `).join('');
}

$('testSearch').addEventListener('input', e => renderTests(e.target.value));

window.promptDeleteTest = function(tid, uname){
  $('confirmTitle').textContent = 'Hapus Hasil Tes';
  $('confirmDesc').textContent  = `Yakin hapus tes dari "${uname}"?`;
  pendingDeleteTestId           = tid;
  $('confirmModal').classList.add('show');
  $('btnConfirmYes').onclick    = confirmDeleteTest;
};

async function confirmDeleteTest(){
  $('confirmModal').classList.remove('show');
  try {
    await deleteDoc(doc(db, 'hasilTes', pendingDeleteTestId));
    showToast('Tes berhasil dihapus', 'success');
    await fetchTests();
    renderTests(); renderDashboard(); renderAnalytics();
  } catch(e){ showToast('Gagal: ' + e.message, 'error'); }
}

// ============================================================
// ADMINS PANEL
// ============================================================
function renderAdmins(){
  const grid = $('adminsGrid');
  if(!allAdmins.length){
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">👨‍💼</div><p>Tidak ada admin</p></div>';
    return;
  }
  grid.innerHTML = allAdmins.map(a => {
    const isMe     = a.id === currentAdmin.id;
    const isActive = a.status === 'active';
    const perms    = [];
    if(a.permissions?.manageUsers) perms.push('Users');
    if(a.permissions?.deleteTests) perms.push('Tests');
    if(a.permissions?.inviteAdmin) perms.push('Invite');
    if(a.permissions?.viewAnalytics) perms.push('Analytics');

    return `
      <div class="admin-card ${isActive && isMe ? 'active-card' : ''}">
        <div class="admin-card-top">
          <div class="admin-ava">${initials(a.username)}</div>
          <div class="admin-meta">
            <div class="admin-uname">
              ${a.username}
              ${isMe ? '<span style="font-size:11px;color:var(--teal);"> (Saya)</span>' : ''}
            </div>
            <div class="admin-status">
              <span class="badge ${isActive ? 'badge-active' : 'badge-admin'}">
                ${isActive ? 'Active' : 'Revoked'}
              </span>
            </div>
          </div>
        </div>
        <div class="admin-perms">
          ${perms.map(p => `<span class="perm-chip">${p}</span>`).join('')}
          ${!perms.length ? '<span style="font-size:12px;color:var(--muted);">Tidak ada permission</span>' : ''}
        </div>
        <div class="admin-actions-row">
          ${!isMe && isActive && currentAdmin.permissions?.inviteAdmin
            ? `<button class="btn-revoke-full" onclick="window.promptRevokeAdmin('${a.id}','${a.username}')">⛔ Revoke</button>`
            : `<div style="flex:1;text-align:center;font-size:12px;color:var(--muted);">${isMe ? 'Akun Anda' : 'Sudah direvoke'}</div>`}
        </div>
      </div>
    `;
  }).join('');
}

window.promptRevokeAdmin = function(aid, uname){
  $('confirmTitle').textContent = 'Revoke Admin';
  $('confirmDesc').textContent  = `Yakin revoke akses admin "${uname}"?`;
  pendingRevokeAdminId          = aid;
  $('confirmModal').classList.add('show');
  $('btnConfirmYes').onclick    = confirmRevoke;
};

async function confirmRevoke(){
  $('confirmModal').classList.remove('show');
  try {
    await updateDoc(doc(db, 'admins', pendingRevokeAdminId), { status: 'revoked' });
    showToast('Admin berhasil direvoke', 'success');
    await fetchAdmins();
    renderAdmins();
  } catch(e){ showToast('Gagal: ' + e.message, 'error'); }
}

// Generate Invitation
$('btnGenerate')?.addEventListener('click', async () => {
  const username = $('newAdminUser').value.trim();
  if(!username || username.length < 4){
    showToast('Username minimal 4 karakter!', 'error'); return;
  }
  const permissions = {
    manageUsers:  $('p-users').checked,
    deleteTests:  $('p-tests').checked,
    inviteAdmin:  $('p-invite').checked,
    viewAnalytics: $('p-analytics').checked
  };
  try {
    // Check for duplicate username
    const [snapAdmins, snapUsers] = await Promise.all([
      getDocs(query(collection(db, 'admins'), where('username', '==', username))),
      getDocs(query(collection(db, 'users'),  where('username', '==', username)))
    ]);
    if(!snapAdmins.empty || !snapUsers.empty){
      showToast('Username sudah digunakan!', 'error'); return;
    }

    const code   = Array.from({ length: 8 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    const expiry = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    await addDoc(collection(db, 'admin_invitations'), {
      invitedUsername: username,
      invitedBy:       currentAdmin.id,
      inviteCode:      code,
      status:          'pending',
      permissions,
      expiresAt:       expiry,
      createdAt:       new Date()
    });

    $('res-username').textContent = username;
    $('res-code').textContent     = code;
    $('res-expiry').textContent   = expiry.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    $('inviteResult').classList.add('show');
    showToast('Invitation berhasil dibuat!', 'success');

  } catch(e){ showToast('Gagal: ' + e.message, 'error'); }
});

$('btnCopyInvite')?.addEventListener('click', () => {
  const code = $('res-code').textContent;
  const user = $('res-username').textContent;
  navigator.clipboard.writeText(
    `CERMATRIX Admin Invitation\n\nUsername: ${user}\nCode: ${code}\n\nBuka admin.html → Manage Admins → masukkan invitation code.`
  );
  showToast('Code berhasil di-copy!', 'success');
});

$('btnWA')?.addEventListener('click', () => {
  const code = $('res-code').textContent;
  const user = $('res-username').textContent;
  window.open(
    `https://wa.me/?text=${encodeURIComponent(`CERMATRIX Admin\n\nUsername: ${user}\nCode: ${code}`)}`,
    '_blank'
  );
});

// ============================================================
// ANALYTICS
// ============================================================
function renderAnalytics(){
  renderTrendChart();
  renderUserBarChart();
  renderScoreDist();
  renderStatsDetail();
}

function renderTrendChart(){
  const byDay = {};
  allTests.forEach(t => {
    if(!t.waktu) return;
    const key = t.waktu.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    if(!byDay[key]) byDay[key] = { sum: 0, count: 0 };
    byDay[key].sum   += (t.nilai || 0);
    byDay[key].count++;
  });
  const labels = Object.keys(byDay).slice(-14);
  const data   = labels.map(l => Math.round(byDay[l].sum / byDay[l].count));

  if(trendChart) trendChart.destroy();
  trendChart = new Chart($('trendChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:           'Avg Score',
        data,
        borderColor:     '#5dd9c1',
        backgroundColor: 'rgba(93,217,193,0.08)',
        borderWidth:     2.5,
        tension:         0.4,
        fill:            true,
        pointRadius:     4,
        pointBackgroundColor: '#5dd9c1'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#527070', font: { size: 11 } }, grid: { color: '#1f4040' } },
        y: { ticks: { color: '#527070', font: { size: 11 } }, grid: { color: '#1f4040' }, min: 0, max: 100 }
      }
    }
  });
}

function renderUserBarChart(){
  const byUser = {};
  allTests.forEach(t => {
    if(!byUser[t.nama]) byUser[t.nama] = 0;
    if(t.nilai > byUser[t.nama]) byUser[t.nama] = t.nilai;
  });
  const sorted = Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(e => e[0]);
  const data   = sorted.map(e => e[1]);

  if(userBarChart) userBarChart.destroy();
  userBarChart = new Chart($('userBarChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map(v => scoreColor(v)),
        borderRadius:    6,
        borderSkipped:   false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#527070', font: { size: 11 } }, grid: { color: '#1f4040' }, min: 0, max: 100 },
        y: { ticks: { color: '#a3d5d3', font: { size: 11 } }, grid: { display: false } }
      }
    }
  });
}

function renderScoreDist(){
  const ranges = [
    { label: '0–20',   color: '#e05555', min: 0,  max: 20  },
    { label: '21–40',  color: '#d4a843', min: 21, max: 40  },
    { label: '41–60',  color: '#4a9ed6', min: 41, max: 60  },
    { label: '61–80',  color: '#1a6b6b', min: 61, max: 80  },
    { label: '81–100', color: '#3dbf7e', min: 81, max: 100 }
  ];
  const total = allTests.length || 1;
  $('scoreDist').innerHTML = ranges.map(r => {
    const count = allTests.filter(t => t.nilai >= r.min && t.nilai <= r.max).length;
    const pct   = Math.round(count / total * 100);
    return `
      <div class="dist-row">
        <div class="dist-label">${r.label}</div>
        <div class="dist-bar-wrap">
          <div class="dist-bar" style="width:${pct}%;background:${r.color}"></div>
        </div>
        <div class="dist-count">${count}</div>
      </div>
    `;
  }).join('');
}

function renderStatsDetail(){
  const scores = allTests.map(t => t.nilai || 0);
  if(!scores.length){
    $('statsDetail').innerHTML = '<p style="color:var(--muted);font-size:13px;">Belum ada data</p>';
    return;
  }
  const avg     = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const max     = Math.max(...scores);
  const min     = Math.min(...scores);
  const sorted  = [...scores].sort((a, b) => a - b);
  const med     = sorted[Math.floor(sorted.length / 2)];
  const above70 = scores.filter(s => s >= 70).length;

  const items = [
    { label: 'Total Tes',  value: scores.length },
    { label: 'Rata-rata',  value: avg },
    { label: 'Tertinggi',  value: max },
    { label: 'Terendah',   value: min },
    { label: 'Median',     value: med },
    { label: 'Score ≥70',  value: `${above70} tes` }
  ];
  $('statsDetail').innerHTML = items.map(it => `
    <div class="dist-row" style="gap:14px;">
      <div class="dist-label" style="width:110px;">${it.label}</div>
      <div style="flex:1;font-weight:700;color:var(--teal);font-family:var(--mono);">${it.value}</div>
    </div>
  `).join('');
}

// ============================================================
// NAVIGATION
// ============================================================
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  users:     'Manage Users',
  tests:     'Test Results',
  analytics: 'Analytics',
  admins:    'Manage Admins'
};

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const sec = btn.dataset.section;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('sec-' + sec)?.classList.add('active');
    $('pageTitle').textContent = PAGE_TITLES[sec] || sec;
    $('pageCrumb').textContent = PAGE_TITLES[sec] || sec;
    closeSidebar();
  });
});

// Refresh button
$('btnRefresh').addEventListener('click', async () => {
  $('btnRefresh').textContent = '⏳';
  await loadAll();
  $('btnRefresh').textContent = '🔄 Refresh';
  showToast('Data berhasil diperbarui', 'success');
});

// Logout
$('btnLogout').addEventListener('click', () => {
  $('confirmTitle').textContent = 'Logout';
  $('confirmDesc').textContent  = 'Yakin ingin logout dari panel admin?';
  $('confirmModal').classList.add('show');
  $('btnConfirmYes').onclick = () => {
    localStorage.removeItem('cermatrix_admin');
    location.reload();
  };
});

// Confirm modal — cancel
$('btnConfirmNo').addEventListener('click', () => $('confirmModal').classList.remove('show'));

// ============================================================
// SIDEBAR (mobile toggle)
// ============================================================
$('hamburgerBtn').addEventListener('click', () => {
  const sb  = $('sidebar');
  const ov  = $('sideOverlay');
  const open = sb.classList.toggle('open');
  ov.style.display = open ? 'block' : 'none';
});

window.closeSidebar = function(){
  $('sidebar').classList.remove('open');
  $('sideOverlay').style.display = 'none';
};