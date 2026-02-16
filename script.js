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
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarClose = document.getElementById('sidebarClose');
const btnSidebarLogin = document.getElementById('btnSidebarLogin');
const menuItems = document.querySelectorAll('.menu-item');
const quickBtns = document.querySelectorAll('.quick-btn');
const pages = document.querySelectorAll('.page-content');

const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const userCircle = document.getElementById('userCircle');

const btnStartTest = document.getElementById('btnStartTest');
const btnStartFromPage = document.getElementById('btnStartFromPage');
const btnLogin = document.getElementById('btnLogin');
const btnRegister = document.getElementById('btnRegister');

const examScreen = document.getElementById('examScreen');
const btnExitExam = document.getElementById('btnExitExam');


// ===============================
// SESSION CHECK ON LOAD
// ===============================
window.addEventListener('DOMContentLoaded', function(){
    
    console.log("Checking session...");
    
    const savedUser = localStorage.getItem('currentUser');
    
    if(savedUser){
        try {
            currentUser = JSON.parse(savedUser);
            console.log("Session found:", currentUser.username);
            updateUILoggedIn();
        } catch(e){
            console.error("Invalid session:", e);
            localStorage.removeItem('currentUser');
        }
    }
});


// ===============================
// SIDEBAR TOGGLE (MOBILE)
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

// Sidebar login/logout button
btnSidebarLogin.addEventListener('click', () => {
    if(currentUser){
        // If logged in, logout
        showLogoutConfirm();
    } else {
        // If guest, show login modal
        loginModal.classList.add('active');
        // Close sidebar on mobile
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
    
    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const targetPage = document.getElementById(pageName + 'Page');
    if(targetPage){
        targetPage.classList.add('active');
    }
    
    // Update menu active state
    menuItems.forEach(item => {
        if(item.dataset.page === pageName){
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Load data for specific pages
    if(pageName === 'progress'){
        loadProgressData();
    } else if(pageName === 'leaderboard'){
        loadLeaderboard();
    } else if(pageName === 'history'){
        loadHistory();
    }
    
    // Close sidebar on mobile
    if(window.innerWidth <= 768){
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    }
}

// Make navigateTo globally accessible
window.navigateTo = navigateTo;

// Menu items click
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        navigateTo(page);
    });
});

// Quick buttons click
quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        navigateTo(page);
    });
});


// ===============================
// MODAL HANDLING
// ===============================
userCircle.addEventListener('click', () => {
    if(currentUser){
        showLogoutConfirm();
    } else {
        loginModal.classList.add('active');
    }
});

document.getElementById('closeLogin').addEventListener('click', () => {
    loginModal.classList.remove('active');
});

document.getElementById('closeRegister').addEventListener('click', () => {
    registerModal.classList.remove('active');
});

document.getElementById('linkRegister').addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.classList.remove('active');
    registerModal.classList.add('active');
});

document.getElementById('linkLogin').addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.classList.remove('active');
    loginModal.classList.add('active');
});


// ===============================
// REGISTER
// ===============================
btnRegister.addEventListener('click', async () => {
    
    console.log("Register button clicked");
    
    const usernameInput = document.getElementById('regUsername');
    const passwordInput = document.getElementById('regPassword');
    const passwordConfirmInput = document.getElementById('regPasswordConfirm');
    
    if(!usernameInput || !passwordInput || !passwordConfirmInput){
        console.error("Input elements not found!");
        alert("Error: Form tidak ditemukan. Silakan refresh halaman.");
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;
    
    console.log("Username:", username);
    console.log("Password length:", password.length);
    
    if(!username || !password || !passwordConfirm){
        alert("Semua field harus diisi!");
        return;
    }
    
    if(username.length < 4){
        alert("Username minimal 4 karakter!");
        return;
    }
    
    if(password.length < 6){
        alert("Password minimal 6 karakter!");
        return;
    }
    
    if(password !== passwordConfirm){
        alert("Password dan konfirmasi tidak sama!");
        return;
    }
    
    console.log("Validation passed, calling registerUser...");
    
    try {
        const result = await registerUser(username, password);
        
        console.log("Register result:", result);
        
        if(result.success){
            alert("Registrasi berhasil! Silakan login.");
            
            // Clear form safely
            if(usernameInput) usernameInput.value = "";
            if(passwordInput) passwordInput.value = "";
            if(passwordConfirmInput) passwordConfirmInput.value = "";
            
            // Show login modal
            registerModal.classList.remove('active');
            loginModal.classList.add('active');
        } else {
            alert(result.message);
        }
        
    } catch(e){
        console.error("Register error:", e);
        alert("Terjadi kesalahan saat registrasi: " + e.message);
    }
});


// ===============================
// LOGIN
// ===============================
btnLogin.addEventListener('click', async () => {
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if(!username || !password){
        alert("Username dan password harus diisi!");
        return;
    }
    
    try {
        const result = await loginUser(username, password);
        
        if(result.success){
            currentUser = result.user;
            
            // Save session
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Clear form
            document.getElementById('loginUsername').value = "";
            document.getElementById('loginPassword').value = "";
            
            // Close modal
            loginModal.classList.remove('active');
            
            // Update UI
            updateUILoggedIn();
            
            alert(`Selamat datang, ${currentUser.username}!`);
        } else {
            alert(result.message);
        }
        
    } catch(e){
        console.error("Login error:", e);
        alert("Terjadi kesalahan saat login!");
    }
});


// ===============================
// LOGOUT
// ===============================
function showLogoutConfirm(){
    const confirm = window.confirm("Yakin ingin logout?");
    
    if(confirm){
        currentUser = null;
        localStorage.removeItem('currentUser');
        
        updateUIGuest();
        navigateTo('home');
        
        alert("Logout berhasil!");
    }
}


// ===============================
// UPDATE UI
// ===============================
function updateUILoggedIn(){
    document.getElementById('homeUserName').innerText = currentUser.username;
    document.getElementById('topbarUserName').innerText = currentUser.username;
    
    // Update sidebar footer
    document.getElementById('sidebarUserInfo').innerHTML = `
        <div class="sidebar-user-name">${currentUser.username}</div>
        <button class="btn-sidebar-logout" id="btnSidebarLogin">
            Logout
        </button>
    `;
    
    // Re-attach event listener
    const newBtn = document.getElementById('btnSidebarLogin');
    newBtn.addEventListener('click', () => {
        showLogoutConfirm();
    });
}

function updateUIGuest(){
    document.getElementById('homeUserName').innerText = 'Guest';
    document.getElementById('topbarUserName').innerText = 'Guest';
    
    // Update sidebar footer
    document.getElementById('sidebarUserInfo').innerHTML = `
        <div class="sidebar-user-name">Guest</div>
        <button class="btn-sidebar-login" id="btnSidebarLogin">
            Login
        </button>
    `;
    
    // Re-attach event listener
    const newBtn = document.getElementById('btnSidebarLogin');
    newBtn.addEventListener('click', () => {
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
btnStartTest.addEventListener('click', () => {
    // Navigate to test info page instead of starting immediately
    navigateTo('test');
});

btnStartFromPage.addEventListener('click', () => {
    if(!currentUser){
        alert("Silakan login terlebih dahulu untuk memulai tes!");
        loginModal.classList.add('active');
        return;
    }
    
    startExam();
});


// ===============================
// START EXAM
// ===============================
function startExam(){
    examScreen.classList.add('active');
    document.getElementById('examUserDisplay').innerText = "Peserta: " + currentUser.username;
    
    startBreak();
}


// ===============================
// EXIT EXAM
// ===============================
btnExitExam.addEventListener('click', () => {
    const confirm = window.confirm("Yakin ingin keluar? Tes akan dibatalkan.");
    
    if(confirm){
        clearInterval(timer);
        clearInterval(breakTimer);
        
        stage = 1;
        scores = [];
        count = 0;
        correctCount = 0;
        
        examScreen.classList.remove('active');
        document.getElementById('resultBox').style.display = 'none';
    }
});


// ===============================
// LOAD PROGRESS DATA
// ===============================
async function loadProgressData(){
    
    if(!currentUser){
        document.getElementById('statTotal').innerText = '0';
        document.getElementById('statAvg').innerText = '0';
        document.getElementById('statBest').innerText = '0';
        document.getElementById('statLast').innerText = '-';
        document.getElementById('badgesGrid').innerHTML = '<p class="empty">Login untuk melihat badge kamu</p>';
        clearChart();
        return;
    }
    
    try {
        const history = await getRiwayatTes(currentUser.id);
        
        if(history.length === 0){
            document.getElementById('statTotal').innerText = '0';
            document.getElementById('statAvg').innerText = '0';
            document.getElementById('statBest').innerText = '0';
            document.getElementById('statLast').innerText = '-';
            renderBadges([], {totalTests: 0, avgScore: 0, bestScore: 0});
            clearChart();
            return;
        }
        
        const scores = history.map(h => h.nilai);
        const totalTests = scores.length;
        const avgScore = Math.round(scores.reduce((a,b) => a+b, 0) / totalTests);
        const bestScore = Math.max(...scores);
        const lastScore = scores[0];
        
        document.getElementById('statTotal').innerText = totalTests;
        document.getElementById('statAvg').innerText = avgScore;
        document.getElementById('statBest').innerText = bestScore;
        document.getElementById('statLast').innerText = lastScore;
        
        renderChart(history);
        renderBadges(history, {totalTests, avgScore, bestScore});
        
    } catch(e){
        console.error("Load progress error:", e);
    }
}


// ===============================
// CHART
// ===============================
let scoreChart = null;

function renderChart(history){
    const canvas = document.getElementById('scoreChart');
    if(!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if(scoreChart){
        scoreChart.destroy();
    }
    
    if(history.length === 0){
        clearChart();
        return;
    }
    
    const last10 = history.slice(0, 10).reverse();
    const labels = last10.map((_, i) => `Tes ${i + 1}`);
    const data = last10.map(h => h.nilai);
    
    scoreChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nilai',
                data: data,
                borderColor: '#1a6b6b',
                backgroundColor: 'rgba(26, 107, 107, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: '#1a6b6b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function clearChart(){
    const canvas = document.getElementById('scoreChart');
    if(!canvas) return;
    
    if(scoreChart){
        scoreChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}


// ===============================
// BADGES
// ===============================
const BADGES = [
    {
        name: 'Pemula',
        icon: '🎯',
        desc: 'Selesaikan tes pertama',
        req: (s) => s.totalTests >= 1
    },
    {
        name: 'Konsisten',
        icon: '📚',
        desc: 'Selesaikan 5 tes',
        req: (s) => s.totalTests >= 5
    },
    {
        name: 'Dedikasi',
        icon: '💪',
        desc: 'Selesaikan 10 tes',
        req: (s) => s.totalTests >= 10
    },
    {
        name: 'Cukup Baik',
        icon: '⭐',
        desc: 'Raih nilai 50+',
        req: (s) => s.bestScore >= 50
    },
    {
        name: 'Bagus!',
        icon: '🌟',
        desc: 'Raih nilai 70+',
        req: (s) => s.bestScore >= 70
    },
    {
        name: 'Luar Biasa',
        icon: '✨',
        desc: 'Raih nilai 85+',
        req: (s) => s.bestScore >= 85
    },
    {
        name: 'Sempurna!',
        icon: '🏆',
        desc: 'Raih nilai 100',
        req: (s) => s.bestScore >= 100
    },
    {
        name: 'Master',
        icon: '👑',
        desc: 'Rata-rata 80+',
        req: (s) => s.avgScore >= 80
    }
];

function renderBadges(history, stats){
    const grid = document.getElementById('badgesGrid');
    
    let html = '';
    BADGES.forEach(badge => {
        const earned = badge.req(stats);
        const cls = earned ? 'badge-earned' : 'badge-locked';
        
        html += `
            <div class="badge-item ${cls}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-desc">${badge.desc}</div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}


// ===============================
// LEADERBOARD
// ===============================
async function loadLeaderboard(){
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p class="loading">Memuat leaderboard...</p>';
    
    try {
        const data = await getLeaderboard(10);
        
        if(data.length === 0){
            list.innerHTML = '<p class="empty">Belum ada data leaderboard.</p>';
            return;
        }
        
        let html = '';
        data.forEach((entry, i) => {
            const rank = i + 1;
            let rankCls = '';
            let medal = '';
            
            if(rank === 1){ rankCls = 'rank-1'; medal = '🥇'; }
            else if(rank === 2){ rankCls = 'rank-2'; medal = '🥈'; }
            else if(rank === 3){ rankCls = 'rank-3'; medal = '🥉'; }
            
            const date = entry.waktu.toDate();
            const dateStr = date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            html += `
                <div class="lb-item ${rankCls}">
                    <div class="lb-rank">${medal || rank}</div>
                    <div class="lb-info">
                        <div class="lb-name">${entry.nama}</div>
                        <div class="lb-date">${dateStr}</div>
                    </div>
                    <div class="lb-score">${entry.nilai}</div>
                </div>
            `;
        });
        
        list.innerHTML = html;
        
    } catch(e){
        console.error("Load leaderboard error:", e);
        list.innerHTML = '<p class="error">Gagal memuat leaderboard.</p>';
    }
}


// ===============================
// HISTORY
// ===============================
async function loadHistory(){
    const list = document.getElementById('historyList');
    list.innerHTML = '<p class="loading">Memuat riwayat...</p>';
    
    if(!currentUser){
        list.innerHTML = '<p class="empty">Login untuk melihat riwayat tes.</p>';
        return;
    }
    
    try {
        const history = await getRiwayatTes(currentUser.id);
        
        if(history.length === 0){
            list.innerHTML = '<p class="empty">Belum ada riwayat tes.</p>';
            return;
        }
        
        let html = '';
        history.forEach((item, i) => {
            const date = item.waktu.toDate();
            const dateStr = date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            html += `
                <div class="history-item">
                    <div class="history-num">#${history.length - i}</div>
                    <div class="history-info">
                        <div class="history-date">${dateStr}</div>
                        <div class="history-score">Nilai: <strong>${item.nilai}</strong></div>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
        
    } catch(e){
        console.error("Load history error:", e);
        list.innerHTML = '<p class="error">Gagal memuat riwayat.</p>';
    }
}


// ===============================
// EXAM LOGIC
// ===============================
const TOTAL_STAGE = 10;
const MAX_QUESTION = 50;
const STAGE_TIME = 60;
const PREP_FIRST = 10;
const PREP_NEXT = 5;

const symbols = ['×','=','-','Γ','/','+','<','>','%','#'];
const letters = ['A','B','C','D','E'];

let stage = 1;
let timeLeft = STAGE_TIME;
let timer = null;
let breakTimer = null;
let mapping = {};
let correct = '';
let count = 0;
let correctCount = 0;
let scores = [];

function shuffle(arr){
    return arr.sort(() => Math.random() - 0.5);
}

function createMapping(){
    let pool = shuffle([...symbols]).slice(0, 5);
    mapping = {};
    letters.forEach((l, i) => {
        mapping[l] = pool[i];
    });
    renderMapping();
}

function renderMapping(){
    const div = document.getElementById('mapping');
    div.innerHTML = '';
    
    letters.forEach(l => {
        const item = document.createElement('div');
        item.className = 'map-item';
        item.innerHTML = `
            <div class="map-symbol">${mapping[l]}</div>
            <div class="map-letter">${l}</div>
        `;
        div.appendChild(item);
    });
}

function createQuestion(){
    let used = Object.values(mapping);
    let temp = shuffle([...used]);
    let missing = temp.pop();
    
    correct = Object.keys(mapping).find(k => mapping[k] === missing);
    
    const div = document.getElementById('question');
    div.innerHTML = '';
    
    temp.forEach(s => {
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
        btn.innerText = l;
        btn.onclick = () => answer(l);
        div.appendChild(btn);
    });
}

function answer(a){
    if(count >= MAX_QUESTION) return;
    
    count++;
    
    if(a === correct){
        correctCount++;
    }
    
    document.getElementById('questionCount').innerText = count;
    
    if(count >= MAX_QUESTION){
        endStage();
        return;
    }
    
    createQuestion();
}

function startTimer(){
    clearInterval(timer);
    
    timer = setInterval(() => {
        timeLeft--;
        
        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;
        
        document.getElementById('examTimer').innerText = 
            `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        
        if(timeLeft <= 0){
            clearInterval(timer);
            endStage();
        }
    }, 1000);
}

function startStage(){
    clearInterval(breakTimer);
    
    document.getElementById('stageInfo').innerText = `Kolom ${stage}`;
    
    timeLeft = STAGE_TIME;
    count = 0;
    correctCount = 0;
    
    document.getElementById('questionCount').innerText = 0;
    
    createMapping();
    createQuestion();
    createButtons();
    startTimer();
}

function startBreak(){
    let sec = (stage === 1) ? PREP_FIRST : PREP_NEXT;
    
    document.getElementById('stageInfo').innerText = 
        `Kolom ${stage} mulai dalam ${sec} detik`;
    
    document.getElementById('mapping').innerHTML = '';
    document.getElementById('question').innerHTML = '';
    document.getElementById('buttons').innerHTML = '';
    
    breakTimer = setInterval(() => {
        sec--;
        
        document.getElementById('stageInfo').innerText = 
            `Kolom ${stage} mulai dalam ${sec} detik`;
        
        if(sec <= 0){
            clearInterval(breakTimer);
            startStage();
        }
    }, 1000);
}

function endStage(){
    clearInterval(timer);
    
    let score = Math.round((correctCount / MAX_QUESTION) * 100);
    scores.push(score);
    
    if(stage < TOTAL_STAGE){
        stage++;
        startBreak();
    } else {
        showResult();
    }
}

async function showResult(){
    let total = 0;
    let html = '<h3>Hasil Akhir</h3>';
    
    scores.forEach((s, i) => {
        html += `Kolom ${i+1}: ${s}<br>`;
        total += s;
    });
    
    let avg = Math.round(total / TOTAL_STAGE);
    
    html += `<br><b>Nilai Akhir: ${avg}</b>`;
    html += '<br><br><button onclick="finishExam()">Kembali ke Home</button>';
    
    const resultBox = document.getElementById('resultBox');
    resultBox.style.display = 'block';
    resultBox.innerHTML = html;
    
    try {
        await simpanNilai(currentUser.id, currentUser.username, avg);
        console.log("Data tersimpan!");
    } catch(e){
        console.error("Firebase error:", e);
        alert("Gagal simpan nilai!");
    }
}

window.finishExam = async function(){
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    stage = 1;
    scores = [];
    count = 0;
    correctCount = 0;
    
    clearInterval(timer);
    clearInterval(breakTimer);
    
    examScreen.classList.remove('active');
    document.getElementById('resultBox').style.display = 'none';
    
    navigateTo('home');
    
    alert("Tes selesai! Lihat hasil di Progress atau Riwayat Tes.");
}