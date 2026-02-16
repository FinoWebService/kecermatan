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
let currentPage = 'home';


// ===============================
// SESSION CHECK ON PAGE LOAD
// ===============================
window.addEventListener('DOMContentLoaded', function(){
    
    console.log("Checking session...");
    
    const savedUser = localStorage.getItem('currentUser');
    
    if(savedUser){
        try {
            currentUser = JSON.parse(savedUser);
            console.log("Session found:", currentUser.username);
            updateUIForLoggedIn();
            loadUserData();
        } catch(e){
            console.error("Invalid session data:", e);
            localStorage.removeItem('currentUser');
        }
    } else {
        console.log("No session found, showing guest mode");
    }
});


// ===============================
// SIDEBAR TOGGLE
// ===============================
window.toggleSidebar = function(){
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}


// ===============================
// PAGE NAVIGATION
// ===============================
window.showPage = function(pageName){
    
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active to clicked nav item
    event.target.closest('.nav-item').classList.add('active');
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const pageMap = {
        'home': 'homePage',
        'test': 'testPage',
        'progress': 'progressPage',
        'leaderboard': 'leaderboardPage',
        'history': 'historyPage'
    };
    
    const pageId = pageMap[pageName];
    if(pageId){
        document.getElementById(pageId).classList.add('active');
        currentPage = pageName;
        
        // Load data for specific pages
        if(pageName === 'progress' && currentUser){
            loadProgressData();
        } else if(pageName === 'leaderboard'){
            loadLeaderboardData();
        } else if(pageName === 'history' && currentUser){
            loadHistory();
        }
    }
    
    // Close sidebar on mobile
    if(window.innerWidth <= 768){
        toggleSidebar();
    }
}


// ===============================
// MODAL FUNCTIONS
// ===============================
window.showLoginModal = function(){
    document.getElementById('loginModal').classList.add('active');
}

window.showRegisterModal = function(){
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('registerModal').classList.add('active');
}

window.closeModal = function(){
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('registerModal').classList.remove('active');
}


// ===============================
// REGISTER
// ===============================
window.register = async function(){
    
    const username = document.getElementById("regUsername").value.trim();
    const namaLengkap = document.getElementById("regNamaLengkap").value.trim();
    const password = document.getElementById("regPassword").value;
    const passwordConfirm = document.getElementById("regPasswordConfirm").value;
    
    if(!username || !namaLengkap || !password || !passwordConfirm){
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
        alert("Password dan konfirmasi password tidak sama!");
        return;
    }
    
    try {
        
        const result = await registerUser(username, namaLengkap, password);
        
        if(result.success){
            alert("Registrasi berhasil! Silakan login.");
            
            // Clear form
            document.getElementById("regUsername").value = "";
            document.getElementById("regNamaLengkap").value = "";
            document.getElementById("regPassword").value = "";
            document.getElementById("regPasswordConfirm").value = "";
            
            // Show login modal
            showLoginModal();
        } else {
            alert(result.message);
        }
        
    } catch(e){
        console.error("Register error:", e);
        alert("Terjadi kesalahan saat registrasi!");
    }
}


// ===============================
// LOGIN
// ===============================
window.login = async function(){
    
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    
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
            console.log("Session saved for:", currentUser.username);
            
            // Clear form
            document.getElementById("loginUsername").value = "";
            document.getElementById("loginPassword").value = "";
            
            // Close modal
            closeModal();
            
            // Update UI
            updateUIForLoggedIn();
            loadUserData();
            
            alert(`Selamat datang, ${currentUser.namaLengkap}!`);
            
        } else {
            alert(result.message);
        }
        
    } catch(e){
        console.error("Login error:", e);
        alert("Terjadi kesalahan saat login!");
    }
}


// ===============================
// LOGOUT
// ===============================
window.logout = function(){
    
    const confirm = window.confirm("Yakin ingin logout?");
    
    if(confirm){
        
        // Clear session
        currentUser = null;
        localStorage.removeItem('currentUser');
        console.log("Session cleared");
        
        // Update UI
        updateUIForGuest();
        
        // Go to home
        showPage('home');
        
        alert("Logout berhasil!");
    }
}


// ===============================
// UPDATE UI FOR LOGGED IN USER
// ===============================
function updateUIForLoggedIn(){
    
    // Update home page greeting
    document.getElementById('homeUserName').innerText = currentUser.namaLengkap;
    
    // Update topbar
    document.getElementById('topbarUser').innerHTML = `
        <div class="user-badge">
            <span class="user-badge-name">${currentUser.namaLengkap}</span>
            <button class="btn-logout-small" onclick="logout()">Logout</button>
        </div>
    `;
    
    // Update sidebar
    document.getElementById('sidebarUser').innerHTML = `
        <div class="user-avatar">👤</div>
        <div class="user-info">
            <div class="user-name">${currentUser.namaLengkap}</div>
            <button class="btn-logout-sidebar" onclick="logout()">Logout</button>
        </div>
    `;
}


// ===============================
// UPDATE UI FOR GUEST
// ===============================
function updateUIForGuest(){
    
    // Reset home page greeting
    document.getElementById('homeUserName').innerText = 'Guest';
    
    // Reset topbar
    document.getElementById('topbarUser').innerHTML = `
        <button class="btn-login-top" onclick="showLoginModal()">Login</button>
    `;
    
    // Reset sidebar
    document.getElementById('sidebarUser').innerHTML = `
        <div class="user-avatar">👤</div>
        <div class="user-info">
            <div class="user-name">Guest</div>
            <button class="btn-login-sidebar" onclick="showLoginModal()">Login</button>
        </div>
    `;
}


// ===============================
// LOAD USER DATA
// ===============================
async function loadUserData(){
    if(currentPage === 'progress'){
        await loadProgressData();
    } else if(currentPage === 'history'){
        await loadHistory();
    }
}


// ===============================
// START TEST FROM HOME
// ===============================
window.startTestFromHome = function(){
    if(!currentUser){
        alert("Silakan login terlebih dahulu untuk memulai tes!");
        showLoginModal();
        return;
    }
    
    startExam();
}


// ===============================
// START TEST FROM PAGE
// ===============================
window.startTestFromPage = function(){
    if(!currentUser){
        alert("Silakan login terlebih dahulu untuk memulai tes!");
        showLoginModal();
        return;
    }
    
    startExam();
}


// ===============================
// START EXAM
// ===============================
function startExam(){
    
    document.querySelector('.main-content').style.display = 'none';
    document.getElementById('examScreen').classList.add('active');
    
    document.getElementById('examUserName').innerText = "Peserta: " + currentUser.namaLengkap;
    
    startBreak();
}


// ===============================
// EXIT EXAM
// ===============================
window.exitExam = function(){
    
    const confirm = window.confirm("Yakin ingin keluar? Tes akan dibatalkan.");
    
    if(confirm){
        
        // Reset exam
        clearInterval(timer);
        clearInterval(breakTimer);
        
        stage = 1;
        scores = [];
        count = 0;
        correctCount = 0;
        
        // Hide exam
        document.getElementById('examScreen').classList.remove('active');
        document.querySelector('.main-content').style.display = 'block';
        
        // Reset result
        document.getElementById('result').style.display = 'none';
    }
}


// ===============================
// LOAD PROGRESS DATA
// ===============================
async function loadProgressData(){
    
    if(!currentUser){
        // Show guest message
        document.getElementById('totalTests2').innerText = '0';
        document.getElementById('avgScore2').innerText = '0';
        document.getElementById('bestScore2').innerText = '0';
        document.getElementById('lastScore2').innerText = '-';
        document.getElementById('badgesContent').innerHTML = '<p class="empty">Login untuk melihat badge kamu</p>';
        return;
    }
    
    try {
        
        const history = await getRiwayatTes(currentUser.id);
        
        if(history.length === 0){
            document.getElementById('totalTests2').innerText = '0';
            document.getElementById('avgScore2').innerText = '0';
            document.getElementById('bestScore2').innerText = '0';
            document.getElementById('lastScore2').innerText = '-';
            renderScoreChart([]);
            loadBadges([], {totalTests: 0, avgScore: 0, bestScore: 0});
            return;
        }
        
        // Calculate statistics
        const scores = history.map(h => h.nilai);
        const totalTests = scores.length;
        const avgScore = Math.round(scores.reduce((a,b) => a+b, 0) / totalTests);
        const bestScore = Math.max(...scores);
        const lastScore = scores[0];
        
        // Update UI
        document.getElementById('totalTests2').innerText = totalTests;
        document.getElementById('avgScore2').innerText = avgScore;
        document.getElementById('bestScore2').innerText = bestScore;
        document.getElementById('lastScore2').innerText = lastScore;
        
        // Render chart
        renderScoreChart(history);
        
        // Load badges
        loadBadges(history, {totalTests, avgScore, bestScore});
        
    } catch(e){
        console.error("Load progress error:", e);
    }
}


// ===============================
// RENDER SCORE CHART
// ===============================
let scoreChart = null;

function renderScoreChart(history){
    
    const canvas = document.getElementById("scoreChart");
    
    if(!canvas) return;
    
    const ctx = canvas.getContext("2d");
    
    // Destroy previous chart if exists
    if(scoreChart){
        scoreChart.destroy();
    }
    
    if(history.length === 0){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('Belum ada data tes', canvas.width/2, canvas.height/2);
        return;
    }
    
    // Get last 10 tests
    const last10 = history.slice(0, 10).reverse();
    
    const labels = last10.map((_, index) => `Tes ${index + 1}`);
    const data = last10.map(h => h.nilai);
    
    scoreChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nilai',
                data: data,
                borderColor: '#0d9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#0d9488',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value;
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}


// ===============================
// BADGE SYSTEM
// ===============================
const BADGES = [
    {
        id: 'first_test',
        name: 'Pemula',
        icon: '🎯',
        description: 'Selesaikan tes pertama',
        requirement: (stats) => stats.totalTests >= 1
    },
    {
        id: 'five_tests',
        name: 'Konsisten',
        icon: '📚',
        description: 'Selesaikan 5 tes',
        requirement: (stats) => stats.totalTests >= 5
    },
    {
        id: 'ten_tests',
        name: 'Dedikasi',
        icon: '💪',
        description: 'Selesaikan 10 tes',
        requirement: (stats) => stats.totalTests >= 10
    },
    {
        id: 'score_50',
        name: 'Cukup Baik',
        icon: '⭐',
        description: 'Raih nilai 50+',
        requirement: (stats) => stats.bestScore >= 50
    },
    {
        id: 'score_70',
        name: 'Bagus!',
        icon: '🌟',
        description: 'Raih nilai 70+',
        requirement: (stats) => stats.bestScore >= 70
    },
    {
        id: 'score_85',
        name: 'Luar Biasa',
        icon: '✨',
        description: 'Raih nilai 85+',
        requirement: (stats) => stats.bestScore >= 85
    },
    {
        id: 'perfect',
        name: 'Sempurna!',
        icon: '🏆',
        description: 'Raih nilai 100',
        requirement: (stats) => stats.bestScore >= 100
    },
    {
        id: 'avg_80',
        name: 'Master',
        icon: '👑',
        description: 'Rata-rata 80+',
        requirement: (stats) => stats.avgScore >= 80
    }
];

function loadBadges(history, stats){
    
    const badgesDiv = document.getElementById("badgesContent");
    let html = '';
    
    BADGES.forEach(badge => {
        
        const earned = badge.requirement(stats);
        const badgeClass = earned ? 'badge-earned' : 'badge-locked';
        
        html += `
            <div class="badge-item ${badgeClass}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-desc">${badge.description}</div>
            </div>
        `;
    });
    
    badgesDiv.innerHTML = html || '<p class="empty">Belum ada badge.</p>';
}


// ===============================
// LOAD LEADERBOARD
// ===============================
async function loadLeaderboardData(){
    
    const contentDiv = document.getElementById('leaderboardContent');
    contentDiv.innerHTML = '<p class="loading">Memuat leaderboard...</p>';
    
    try {
        
        const leaderboard = await getLeaderboard();
        
        if(leaderboard.length === 0){
            contentDiv.innerHTML = '<p class="empty">Belum ada data leaderboard.</p>';
            return;
        }
        
        let html = '<div class="leaderboard-list">';
        
        leaderboard.forEach((entry, index) => {
            
            const rank = index + 1;
            let rankClass = '';
            let medal = '';
            
            if(rank === 1){
                rankClass = 'rank-1';
                medal = '🥇';
            } else if(rank === 2){
                rankClass = 'rank-2';
                medal = '🥈';
            } else if(rank === 3){
                rankClass = 'rank-3';
                medal = '🥉';
            }
            
            const date = entry.waktu.toDate();
            const dateStr = date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            html += `
                <div class="leaderboard-item ${rankClass}">
                    <div class="lb-rank">${medal || rank}</div>
                    <div class="lb-info">
                        <div class="lb-name">${entry.nama}</div>
                        <div class="lb-date">${dateStr}</div>
                    </div>
                    <div class="lb-score">${entry.nilai}</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        contentDiv.innerHTML = html;
        
    } catch(e){
        console.error("Load leaderboard error:", e);
        contentDiv.innerHTML = '<p class="error">Gagal memuat leaderboard.</p>';
    }
}


// ===============================
// LOAD HISTORY
// ===============================
async function loadHistory(){
    
    const historyDiv = document.getElementById("historyList");
    historyDiv.innerHTML = '<p class="loading">Memuat riwayat...</p>';
    
    if(!currentUser){
        historyDiv.innerHTML = '<p class="empty">Login untuk melihat riwayat tes kamu.</p>';
        return;
    }
    
    try {
        
        const history = await getRiwayatTes(currentUser.id);
        
        if(history.length === 0){
            historyDiv.innerHTML = '<p class="empty">Belum ada riwayat tes.</p>';
            return;
        }
        
        let html = '<div class="history-items">';
        
        history.forEach((item, index) => {
            
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
                    <div class="history-number">#${history.length - index}</div>
                    <div class="history-info">
                        <div class="history-date">${dateStr}</div>
                        <div class="history-score">Nilai: <strong>${item.nilai}</strong></div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        historyDiv.innerHTML = html;
        
    } catch(e){
        console.error("Load history error:", e);
        historyDiv.innerHTML = '<p class="error">Gagal memuat riwayat.</p>';
    }
}


// ===============================
// EXAM CONFIGURATION
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


// ===============================
// EXAM ELEMENTS
// ===============================
const mappingDiv = document.getElementById('mapping');
const questionDiv = document.getElementById('question');
const buttonsDiv = document.getElementById('buttons');
const countSpan = document.getElementById('count');
const timerDiv = document.getElementById('timer');
const stageInfo = document.getElementById('stageInfo');
const resultDiv = document.getElementById('result');


// ===============================
// UTILITY
// ===============================
function shuffle(arr){
    return arr.sort(()=>Math.random()-0.5);
}


// ===============================
// MAPPING
// ===============================
function createMapping(){

    let pool = shuffle([...symbols]).slice(0,5);

    mapping = {};

    letters.forEach((l,i)=>{
        mapping[l] = pool[i];
    });

    renderMapping();
}

function renderMapping(){

    mappingDiv.innerHTML = '';

    letters.forEach(l=>{

        const div = document.createElement('div');
        div.className = 'map-item';

        div.innerHTML = `
            <div class="map-symbol">${mapping[l]}</div>
            <div class="map-letter">${l}</div>
        `;

        mappingDiv.appendChild(div);
    });
}


// ===============================
// QUESTION
// ===============================
function createQuestion(){

    let used = Object.values(mapping);
    let temp = shuffle([...used]);

    let missing = temp.pop();

    correct = Object.keys(mapping)
        .find(k => mapping[k] === missing);

    questionDiv.innerHTML = '';

    temp.forEach(s=>{

        const div = document.createElement('div');
        div.className = 'q-item';
        div.innerText = s;

        questionDiv.appendChild(div);
    });
}


// ===============================
// BUTTONS
// ===============================
function createButtons(){

    buttonsDiv.innerHTML = '';

    letters.forEach(l=>{

        const btn = document.createElement('button');
        btn.innerText = l;
        btn.onclick = ()=>answer(l);

        buttonsDiv.appendChild(btn);
    });
}


// ===============================
// ANSWER
// ===============================
function answer(a){

    if(count >= MAX_QUESTION) return;

    count++;

    if(a === correct){
        correctCount++;
    }

    countSpan.innerText = count;

    if(count >= MAX_QUESTION){
        endStage();
        return;
    }

    createQuestion();
}


// ===============================
// TIMER
// ===============================
function startTimer(){

    clearInterval(timer);

    timer = setInterval(()=>{

        timeLeft--;

        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;

        timerDiv.innerText =
            `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

        if(timeLeft <= 0){
            clearInterval(timer);
            endStage();
        }

    },1000);
}


// ===============================
// STAGE
// ===============================
function startStage(){

    clearInterval(breakTimer);

    stageInfo.innerText = `Kolom ${stage}`;

    timeLeft = STAGE_TIME;
    count = 0;
    correctCount = 0;

    countSpan.innerText = 0;

    createMapping();
    createQuestion();
    createButtons();
    startTimer();
}


// ===============================
// BREAK
// ===============================
function startBreak(){

    let sec = (stage === 1) ? PREP_FIRST : PREP_NEXT;

    stageInfo.innerText =
        `Kolom ${stage} mulai dalam ${sec} detik`;

    questionDiv.innerHTML = '';
    mappingDiv.innerHTML = '';
    buttonsDiv.innerHTML = '';

    breakTimer = setInterval(()=>{

        sec--;

        stageInfo.innerText =
            `Kolom ${stage} mulai dalam ${sec} detik`;

        if(sec <= 0){

            clearInterval(breakTimer);
            startStage();
        }

    },1000);
}


// ===============================
// END STAGE
// ===============================
function endStage(){

    clearInterval(timer);

    let score = Math.round((correctCount / MAX_QUESTION) * 100);
    scores.push(score);

    if(stage < TOTAL_STAGE){

        stage++;
        startBreak();

    }else{
        showResult();
    }
}


// ===============================
// SHOW RESULT
// ===============================
async function showResult(){

    let total = 0;
    let html = "<h3>Hasil Akhir</h3>";

    scores.forEach((s,i)=>{
        html += `Kolom ${i+1}: ${s}<br>`;
        total += s;
    });

    let avg = Math.round(total / TOTAL_STAGE);

    html += `<br><b>Nilai Akhir: ${avg}</b>`;
    html += `<br><br><button onclick="finishExam()" class="btn-result">Kembali ke Home</button>`;

    resultDiv.style.display = "block";
    resultDiv.innerHTML = html;

    try {

        console.log("Kirim data:", currentUser.namaLengkap, avg);

        await simpanNilai(currentUser.id, currentUser.namaLengkap, avg);
        
        console.log("Data berhasil disimpan!");

    } catch (e){

        console.error("Firebase error:", e);
        alert("Gagal simpan nilai!");
    }
}


// ===============================
// FINISH EXAM
// ===============================
window.finishExam = async function(){
    
    console.log("Finish exam, returning to home...");
    
    // Wait for Firebase
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset exam state
    stage = 1;
    scores = [];
    count = 0;
    correctCount = 0;
    
    // Clear timers
    clearInterval(timer);
    clearInterval(breakTimer);
    
    // Hide exam screen
    document.getElementById('examScreen').classList.remove('active');
    document.querySelector('.main-content').style.display = 'block';
    
    // Reset result
    document.getElementById('result').style.display = 'none';
    
    // Go to home page
    showPage('home');
    
    alert("Tes selesai! Lihat hasil di halaman Progress atau Riwayat Tes.");
    
    console.log("Returned to home!");
}