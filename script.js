// ===============================
// IMPORT FIREBASE
// ===============================
import { 
    registerUser, 
    loginUser, 
    simpanNilai,
    getRiwayatTes,
    getLeaderboard
} from "./firebase.js";


// ===============================
// GLOBAL STATE
// ===============================
let currentUser = null;


// ===============================
// DOM ELEMENTS
// ===============================
const hamburger       = document.getElementById('hamburger');
const sidebar         = document.getElementById('sidebar');
const sidebarOverlay  = document.getElementById('sidebarOverlay');
const sidebarClose    = document.getElementById('sidebarClose');
const btnSidebarLogin = document.getElementById('btnSidebarLogin');
const menuItems       = document.querySelectorAll('.menu-item[data-page]');
const quickBtns       = document.querySelectorAll('.quick-btn');
const pages           = document.querySelectorAll('.page-content');

const loginModal    = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');

const btnStartTest    = document.getElementById('btnStartTest');
const btnStartFromPage = document.getElementById('btnStartFromPage');
const btnLogin        = document.getElementById('btnLogin');
const btnRegister     = document.getElementById('btnRegister');

const examScreen  = document.getElementById('examScreen');
const btnExitExam = document.getElementById('btnExitExam');


// ===============================
// SESSION CHECK ON LOAD
// ===============================
window.addEventListener('DOMContentLoaded', function(){
    const savedUser = localStorage.getItem('currentUser');
    if(savedUser){
        try {
            const userData = JSON.parse(savedUser);
            // Only restore regular user sessions (not admin)
            if(userData && userData.username && userData.role !== 'admin'){
                currentUser = userData;
                updateUILoggedIn();
            } else {
                throw new Error("Invalid or admin session");
            }
        } catch(e){
            localStorage.removeItem('currentUser');
            currentUser = null;
        }
    }

    // Restore ongoing exam if any
    const savedExam = localStorage.getItem('ongoingExam');
    if(savedExam){
        try {
            restoreExam(JSON.parse(savedExam));
        } catch(e){
            localStorage.removeItem('ongoingExam');
        }
    }
});


// ===============================
// SIDEBAR TOGGLE
// ===============================
hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
});

sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

// User circle click — open login or logout
document.getElementById('userCircle').addEventListener('click', () => {
    if(currentUser){
        showLogoutConfirm();
    } else {
        loginModal.classList.add('active');
    }
});

// Sidebar login/logout button
btnSidebarLogin.addEventListener('click', () => {
    if(currentUser){
        showLogoutConfirm();
    } else {
        loginModal.classList.add('active');
        if(window.innerWidth <= 768){
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        }
    }
});


// ===============================
// NAVIGATION
// ===============================
function navigateTo(pageName){
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    
    const target = document.getElementById(pageName + 'Page');
    if(target) target.classList.add('active');

    menuItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });

    if(pageName === 'progress')    loadProgressData();
    if(pageName === 'leaderboard') loadLeaderboard();
    if(pageName === 'history')     loadHistory();

    if(window.innerWidth <= 768){
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    }
}

window.navigateTo = navigateTo;

menuItems.forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(item.dataset.page);
    });
});

quickBtns.forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});


// ===============================
// MODAL HANDLING
// ===============================
document.getElementById('closeLogin').addEventListener('click', () => {
    loginModal.classList.remove('active');
});

document.getElementById('closeRegister').addEventListener('click', () => {
    registerModal.classList.remove('active');
});

document.getElementById('linkRegister').addEventListener('click', e => {
    e.preventDefault();
    loginModal.classList.remove('active');
    registerModal.classList.add('active');
});

document.getElementById('linkLogin').addEventListener('click', e => {
    e.preventDefault();
    registerModal.classList.remove('active');
    loginModal.classList.add('active');
});


// ===============================
// REGISTER
// ===============================
btnRegister.addEventListener('click', async () => {
    const username        = document.getElementById('regUsername').value.trim();
    const password        = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    if(!username || !password || !passwordConfirm){
        alert("Semua field harus diisi!"); return;
    }
    if(username.length < 4){ alert("Username minimal 4 karakter!"); return; }
    if(password.length < 6){ alert("Password minimal 6 karakter!"); return; }
    if(password !== passwordConfirm){ alert("Password dan konfirmasi tidak sama!"); return; }

    try {
        const result = await registerUser(username, password);
        if(result.success){
            alert("Registrasi berhasil! Silakan login.");
            document.getElementById('regUsername').value        = "";
            document.getElementById('regPassword').value        = "";
            document.getElementById('regPasswordConfirm').value = "";
            registerModal.classList.remove('active');
            loginModal.classList.add('active');
        } else {
            alert(result.message);
        }
    } catch(e){
        alert("Terjadi kesalahan: " + e.message);
    }
});


// ===============================
// LOGIN (User Only)
// ===============================
btnLogin.addEventListener('click', async () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if(!username || !password){ alert("Username dan password harus diisi!"); return; }

    try {
        const result = await loginUser(username, password);
        if(result.success){
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('loginUsername').value = "";
            document.getElementById('loginPassword').value = "";
            loginModal.classList.remove('active');
            updateUILoggedIn();
        } else {
            alert(result.message);
        }
    } catch(e){
        if(e.message) alert("Terjadi kesalahan: " + e.message);
    }
});


// ===============================
// LOGOUT
// ===============================
function showLogoutConfirm(){
    if(window.confirm("Yakin ingin logout?")){
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUIGuest();
        navigateTo('home');
    }
}
window.showLogoutConfirm = showLogoutConfirm;


// ===============================
// UPDATE UI
// ===============================
function updateUILoggedIn(){
    document.getElementById('homeUserName').innerText  = currentUser.username;
    document.getElementById('topbarUserName').innerText = currentUser.username;

    document.getElementById('sidebarUserInfo').innerHTML = `
        <div class="sidebar-user-name">${currentUser.username}</div>
        <button class="btn-sidebar-logout" id="btnSidebarLogin">Logout</button>
    `;
    document.getElementById('btnSidebarLogin').addEventListener('click', showLogoutConfirm);

    loadProgressData();
    loadLeaderboard();
    loadHistory();
}

function updateUIGuest(){
    document.getElementById('homeUserName').innerText   = 'Guest';
    document.getElementById('topbarUserName').innerText = 'Guest';

    document.getElementById('sidebarUserInfo').innerHTML = `
        <div class="sidebar-user-name">Guest</div>
        <button class="btn-sidebar-login" id="btnSidebarLogin">Login</button>
    `;
    document.getElementById('btnSidebarLogin').addEventListener('click', () => {
        loginModal.classList.add('active');
        if(window.innerWidth <= 768){
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        }
    });
}


// ===============================
// START TEST
// ===============================
btnStartTest.addEventListener('click', () => navigateTo('test'));

btnStartFromPage.addEventListener('click', () => {
    if(!currentUser){
        alert("Silakan login terlebih dahulu untuk memulai tes!");
        loginModal.classList.add('active');
        return;
    }
    startExam();
});


// ===============================
// EXAM LIFECYCLE
// ===============================
function startExam(){
    examScreen.classList.add('active');
    startBreak();
}

window.addEventListener('beforeunload', e => {
    if(localStorage.getItem('ongoingExam') && examScreen.classList.contains('active')){
        e.preventDefault();
        e.returnValue = 'Tes sedang berlangsung. Yakin ingin keluar?';
        return e.returnValue;
    }
});

function saveExamState(){
    localStorage.setItem('ongoingExam', JSON.stringify({
        stage, timeLeft, count, correctCount, scores, mapping, correct,
        timestamp: Date.now()
    }));
}

function restoreExam(data){
    if(Date.now() - data.timestamp > 2 * 60 * 60 * 1000){
        localStorage.removeItem('ongoingExam'); return;
    }
    stage = data.stage; timeLeft = data.timeLeft; count = data.count;
    correctCount = data.correctCount; scores = data.scores;
    mapping = data.mapping; correct = data.correct;
    examScreen.classList.add('active');
    document.getElementById('stageInfo').innerText    = `Kolom ${stage}`;
    document.getElementById('questionCount').innerText = count;
    renderMapping(); createQuestion(); createButtons(); startTimer();
}

function clearExamState(){ localStorage.removeItem('ongoingExam'); }


// ===============================
// EXIT EXAM
// ===============================
btnExitExam.addEventListener('click', () => {
    if(window.confirm("Yakin ingin keluar? Tes akan dibatalkan.")){
        clearInterval(timer);
        clearInterval(breakTimer);
        stage = 1; scores = []; count = 0; correctCount = 0;
        examScreen.classList.remove('active');
        document.getElementById('resultBox').style.display = 'none';
        clearExamState();
    }
});


// ===============================
// PROGRESS DATA
// ===============================
async function loadProgressData(){
    if(!currentUser){
        document.getElementById('statTotal').innerText = '0';
        document.getElementById('statAvg').innerText   = '0';
        document.getElementById('statBest').innerText  = '0';
        document.getElementById('statLast').innerText  = '-';
        document.getElementById('badgesGrid').innerHTML = '<p class="empty">Login untuk melihat badge kamu</p>';
        clearChart();
        return;
    }
    try {
        const history = await getRiwayatTes(currentUser.id);
        if(!history.length){
            document.getElementById('statTotal').innerText = '0';
            document.getElementById('statAvg').innerText   = '0';
            document.getElementById('statBest').innerText  = '0';
            document.getElementById('statLast').innerText  = '-';
            renderBadges([], { totalTests: 0, avgScore: 0, bestScore: 0 });
            clearChart(); return;
        }
        const sc         = history.map(h => h.nilai);
        const totalTests = sc.length;
        const avgScore   = Math.round(sc.reduce((a,b) => a+b, 0) / totalTests);
        const bestScore  = Math.max(...sc);
        const lastScore  = sc[0];
        document.getElementById('statTotal').innerText = totalTests;
        document.getElementById('statAvg').innerText   = avgScore;
        document.getElementById('statBest').innerText  = bestScore;
        document.getElementById('statLast').innerText  = lastScore;
        renderChart(history);
        renderBadges(history, { totalTests, avgScore, bestScore });
    } catch(e){ console.error("Load progress error:", e); }
}


// ===============================
// CHART
// ===============================
let scoreChart = null;

function renderChart(history){
    const canvas = document.getElementById('scoreChart');
    if(!canvas) return;
    if(scoreChart) scoreChart.destroy();
    if(!history.length){ clearChart(); return; }
    const last10 = history.slice(0, 10).reverse();
    scoreChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: last10.map((_, i) => `Tes ${i + 1}`),
            datasets: [{
                label: 'Nilai',
                data: last10.map(h => h.nilai),
                borderColor: '#1a6b6b',
                backgroundColor: 'rgba(26,107,107,0.1)',
                borderWidth: 3, tension: 0.4, fill: true,
                pointRadius: 5, pointBackgroundColor: '#1a6b6b'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

function clearChart(){
    const canvas = document.getElementById('scoreChart');
    if(!canvas) return;
    if(scoreChart) scoreChart.destroy();
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}


// ===============================
// BADGES
// ===============================
const BADGES = [
    { name: 'Pemula',      icon: '🎯', desc: 'Selesaikan tes pertama',  req: s => s.totalTests >= 1  },
    { name: 'Konsisten',   icon: '📚', desc: 'Selesaikan 5 tes',        req: s => s.totalTests >= 5  },
    { name: 'Dedikasi',    icon: '💪', desc: 'Selesaikan 10 tes',       req: s => s.totalTests >= 10 },
    { name: 'Cukup Baik',  icon: '⭐', desc: 'Raih nilai 50+',          req: s => s.bestScore >= 50  },
    { name: 'Bagus!',      icon: '🌟', desc: 'Raih nilai 70+',          req: s => s.bestScore >= 70  },
    { name: 'Luar Biasa',  icon: '✨', desc: 'Raih nilai 85+',          req: s => s.bestScore >= 85  },
    { name: 'Sempurna!',   icon: '🏆', desc: 'Raih nilai 100',          req: s => s.bestScore >= 100 },
    { name: 'Master',      icon: '👑', desc: 'Rata-rata 80+',           req: s => s.avgScore >= 80   }
];

function renderBadges(history, stats){
    document.getElementById('badgesGrid').innerHTML = BADGES.map(badge => {
        const earned = badge.req(stats);
        return `
            <div class="badge-item ${earned ? 'badge-earned' : 'badge-locked'}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-desc">${badge.desc}</div>
            </div>
        `;
    }).join('');
}


// ===============================
// LEADERBOARD
// ===============================
async function loadLeaderboard(){
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p class="loading">Memuat leaderboard...</p>';
    try {
        const data = await getLeaderboard(10);
        if(!data.length){ list.innerHTML = '<p class="empty">Belum ada data leaderboard.</p>'; return; }
        list.innerHTML = data.map((entry, i) => {
            const rank    = i + 1;
            const rankCls = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
            const medal   = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
            const dateStr = entry.waktu.toDate().toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });
            return `
                <div class="lb-item ${rankCls}">
                    <div class="lb-rank">${medal}</div>
                    <div class="lb-info">
                        <div class="lb-name">${entry.nama}</div>
                        <div class="lb-date">${dateStr}</div>
                    </div>
                    <div class="lb-score">${entry.nilai}</div>
                </div>
            `;
        }).join('');
    } catch(e){
        list.innerHTML = '<p class="error">Gagal memuat leaderboard.</p>';
    }
}


// ===============================
// HISTORY
// ===============================
async function loadHistory(){
    const list = document.getElementById('historyList');
    if(!currentUser){ list.innerHTML = '<p class="empty">Login untuk melihat riwayat tes.</p>'; return; }
    list.innerHTML = '<p class="loading">Memuat riwayat...</p>';
    try {
        const history = await getRiwayatTes(currentUser.id);
        if(!history.length){ list.innerHTML = '<p class="empty">Belum ada riwayat tes.</p>'; return; }
        list.innerHTML = history.map((item, i) => {
            const dateStr = item.waktu.toDate().toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            return `
                <div class="history-item">
                    <div class="history-num">#${history.length - i}</div>
                    <div class="history-info">
                        <div class="history-date">${dateStr}</div>
                        <div class="history-score">Nilai: <strong>${item.nilai}</strong></div>
                    </div>
                </div>
            `;
        }).join('');
    } catch(e){
        list.innerHTML = '<p class="error">Gagal memuat riwayat.</p>';
    }
}


// ===============================
// EXAM LOGIC
// ===============================
const TOTAL_STAGE = 10;
const MAX_QUESTION = 50;
const STAGE_TIME   = 60;
const PREP_FIRST   = 10;
const PREP_NEXT    = 5;

const symbols = ['×','=','-','Γ','/','+','<','>','%','#'];
const letters = ['A','B','C','D','E'];

let stage = 1, timeLeft = STAGE_TIME;
let timer = null, breakTimer = null;
let mapping = {}, correct = '';
let count = 0, correctCount = 0, scores = [];

function shuffle(arr){ return arr.sort(() => Math.random() - 0.5); }

function createMapping(){
    const pool = shuffle([...symbols]).slice(0, 5);
    mapping = {};
    letters.forEach((l, i) => { mapping[l] = pool[i]; });
    renderMapping();
}

function renderMapping(){
    const div = document.getElementById('mapping');
    div.innerHTML = '';
    letters.forEach(l => {
        const item = document.createElement('div');
        item.className = 'map-item';
        item.innerHTML = `<div class="map-symbol">${mapping[l]}</div><div class="map-letter">${l}</div>`;
        div.appendChild(item);
    });
}

function createQuestion(){
    const used    = shuffle([...Object.values(mapping)]);
    const missing = used.pop();
    correct = Object.keys(mapping).find(k => mapping[k] === missing);
    const div = document.getElementById('question');
    div.innerHTML = '';
    used.forEach(s => {
        const item = document.createElement('div');
        item.className = 'q-item';
        item.innerText = s;
        div.appendChild(item);
    });
}

function createButtons(){
    const div = document.getElementById('buttons');
    div.innerHTML = '';
    letters.forEach(l => {
        const btn = document.createElement('button');
        btn.className = 'btn-answer';
        btn.innerText = l;
        btn.onclick   = () => answer(l);
        div.appendChild(btn);
    });
}

function answer(a){
    if(count >= MAX_QUESTION) return;
    count++;
    if(a === correct) correctCount++;
    document.getElementById('questionCount').innerText = count;
    if(count >= MAX_QUESTION){ endStage(); return; }
    createQuestion();
    saveExamState();
}

function startTimer(){
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        document.getElementById('examTimer').innerText =
            `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        if(timeLeft % 5 === 0) saveExamState();
        if(timeLeft <= 0){ clearInterval(timer); endStage(); }
    }, 1000);
}

function startBreak(){
    const isFirst  = stage === 1;
    let breakLeft  = isFirst ? PREP_FIRST : PREP_NEXT;

    document.getElementById('stageInfo').innerText = `Persiapan Kolom ${stage}`;
    document.getElementById('mapping').innerHTML   = '';
    document.getElementById('question').innerHTML  = '';
    document.getElementById('buttons').innerHTML   = '';
    document.getElementById('questionCount').innerText = '0';

    const msg = document.createElement('div');
    msg.style.cssText = 'text-align:center;padding:40px;font-size:18px;color:#666;';
    msg.innerHTML = `<p>Bersiap untuk Kolom ${stage}</p><p style="font-size:32px;font-weight:700;color:#1a6b6b;margin-top:20px;">${breakLeft}</p>`;
    document.getElementById('question').appendChild(msg);

    clearInterval(breakTimer);
    breakTimer = setInterval(() => {
        breakLeft--;
        msg.querySelector('p:last-child').innerText = breakLeft;
        if(breakLeft <= 0){ clearInterval(breakTimer); startStage(); }
    }, 1000);
}

function startStage(){
    count = 0; correctCount = 0; timeLeft = STAGE_TIME;
    document.getElementById('stageInfo').innerText    = `Kolom ${stage}`;
    document.getElementById('questionCount').innerText = '0';
    createMapping(); createQuestion(); createButtons(); startTimer();
    saveExamState();
}

function endStage(){
    clearInterval(timer);
    scores.push(Math.round((correctCount / MAX_QUESTION) * 100));
    if(stage >= TOTAL_STAGE){ finishExam(); return; }
    stage++;
    startBreak();
}

async function finishExam(){
    clearInterval(timer); clearInterval(breakTimer);
    const totalScore = Math.round(scores.reduce((a,b) => a+b, 0) / scores.length);
    document.getElementById('resultBox').style.display = 'block';
    document.getElementById('resultBox').innerHTML = `
        <h2 style="color:#1a6b6b;">Tes Selesai!</h2>
        <p style="font-size:48px;font-weight:700;color:#1a6b6b;margin:20px 0;">${totalScore}</p>
        <p style="font-size:18px;color:#666;">Nilai Akhir</p>
        <button onclick="closeExam()" style="margin-top:20px;padding:15px 40px;background:#1a6b6b;color:white;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;">
            Lihat Hasil Detail
        </button>
    `;
    if(currentUser && currentUser.id){
        try { await simpanNilai(currentUser.id, currentUser.username, totalScore); }
        catch(e){ console.error("Save score error:", e); }
    }
    clearExamState();
}

function closeExam(){
    examScreen.classList.remove('active');
    document.getElementById('resultBox').style.display = 'none';
    stage = 1; scores = []; count = 0; correctCount = 0;
    navigateTo('progress');
    loadProgressData();
}
window.closeExam = closeExam;