// ===============================
// IMPORT FIREBASE
// ===============================
import { 
    registerUser, 
    loginUser, 
    simpanNilai,
    getRiwayatTes 
} from "./firebase.js";


// ===============================
// GLOBAL USER
// ===============================
let currentUser = null;


// ===============================
// CHECK SESSION ON PAGE LOAD
// ===============================
window.addEventListener('DOMContentLoaded', function(){
    
    console.log("Checking session...");
    
    const savedUser = localStorage.getItem('currentUser');
    
    if(savedUser){
        
        try {
            currentUser = JSON.parse(savedUser);
            console.log("Session found:", currentUser.username);
            
            // Auto login - show dashboard
            showDashboard();
            
        } catch(e){
            console.error("Invalid session data:", e);
            localStorage.removeItem('currentUser');
        }
        
    } else {
        console.log("No session found, showing login page");
    }
});


// ===============================
// AUTH NAVIGATION
// ===============================
window.showRegister = function(){
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("registerPage").style.display = "flex";
}

window.showLogin = function(){
    document.getElementById("registerPage").style.display = "none";
    document.getElementById("loginPage").style.display = "flex";
}


// ===============================
// REGISTER
// ===============================
window.register = async function(){
    
    const username = document.getElementById("regUsername").value.trim();
    const namaLengkap = document.getElementById("regNamaLengkap").value.trim();
    const password = document.getElementById("regPassword").value;
    const passwordConfirm = document.getElementById("regPasswordConfirm").value;
    
    // Validasi
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
            showLogin();
            
            // Clear form
            document.getElementById("regUsername").value = "";
            document.getElementById("regNamaLengkap").value = "";
            document.getElementById("regPassword").value = "";
            document.getElementById("regPasswordConfirm").value = "";
            
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
            
            // Save session to localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log("Session saved for:", currentUser.username);
            
            // Clear form
            document.getElementById("loginUsername").value = "";
            document.getElementById("loginPassword").value = "";
            
            // Show dashboard
            showDashboard();
            
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
        
        document.getElementById("dashboard").style.display = "none";
        document.getElementById("loginPage").style.display = "flex";
    }
}


// ===============================
// DASHBOARD
// ===============================
async function showDashboard(){
    
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("registerPage").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    
    // Set user name
    document.getElementById("dashUserName").innerText = currentUser.namaLengkap;
    
    // Load history
    await loadHistory();
    
    // Load statistics
    await loadStatistics();
    
    // Load badges
    loadBadges();
}


// ===============================
// LOAD HISTORY
// ===============================
async function loadHistory(){
    
    const historyDiv = document.getElementById("historyList");
    historyDiv.innerHTML = '<p class="loading">Memuat riwayat...</p>';
    
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
// LOAD STATISTICS
// ===============================
let scoreChart = null;

async function loadStatistics(){
    
    try {
        
        const history = await getRiwayatTes(currentUser.id);
        
        if(history.length === 0){
            document.getElementById("totalTests").innerText = "0";
            document.getElementById("avgScore").innerText = "0";
            document.getElementById("bestScore").innerText = "0";
            document.getElementById("lastScore").innerText = "-";
            return;
        }
        
        // Calculate statistics
        const scores = history.map(h => h.nilai);
        const totalTests = scores.length;
        const avgScore = Math.round(scores.reduce((a,b) => a+b, 0) / totalTests);
        const bestScore = Math.max(...scores);
        const lastScore = scores[0]; // Already sorted newest first
        
        // Update UI
        document.getElementById("totalTests").innerText = totalTests;
        document.getElementById("avgScore").innerText = avgScore;
        document.getElementById("bestScore").innerText = bestScore;
        document.getElementById("lastScore").innerText = lastScore;
        
        // Render chart
        renderScoreChart(history);
        
    } catch(e){
        console.error("Load statistics error:", e);
    }
}

function renderScoreChart(history){
    
    const canvas = document.getElementById("scoreChart");
    const ctx = canvas.getContext("2d");
    
    // Destroy previous chart if exists
    if(scoreChart){
        scoreChart.destroy();
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
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
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
// START EXAM
// ===============================
window.startExam = function(){
    
    if(!currentUser){
        alert("Anda harus login terlebih dahulu!");
        return;
    }
    
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("exam").style.display = "block";
    
    document.getElementById("userName").innerText = "Peserta: " + currentUser.namaLengkap;
    
    startBreak();
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
        description: 'Raih nilai 50 atau lebih',
        requirement: (stats) => stats.bestScore >= 50
    },
    {
        id: 'score_70',
        name: 'Bagus!',
        icon: '🌟',
        description: 'Raih nilai 70 atau lebih',
        requirement: (stats) => stats.bestScore >= 70
    },
    {
        id: 'score_85',
        name: 'Luar Biasa',
        icon: '✨',
        description: 'Raih nilai 85 atau lebih',
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
        description: 'Rata-rata nilai 80+',
        requirement: (stats) => stats.avgScore >= 80
    }
];

async function loadBadges(){
    
    try {
        
        const history = await getRiwayatTes(currentUser.id);
        
        const scores = history.map(h => h.nilai);
        const stats = {
            totalTests: scores.length,
            avgScore: scores.length > 0 ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : 0,
            bestScore: scores.length > 0 ? Math.max(...scores) : 0
        };
        
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
        
    } catch(e){
        console.error("Load badges error:", e);
    }
}


// ===============================
// BACK TO DASHBOARD
// ===============================
window.backToDashboard = async function(){
    
    const confirm = window.confirm("Yakin ingin kembali? Tes akan dibatalkan.");
    
    if(confirm){
        
        // Reset exam
        clearInterval(timer);
        clearInterval(breakTimer);
        
        stage = 1;
        scores = [];
        count = 0;
        correctCount = 0;
        
        document.getElementById("exam").style.display = "none";
        document.getElementById("result").style.display = "none";
        
        await showDashboard();
    }
}


// ===============================
// KONFIG
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
// ELEMENT
// ===============================
const mappingDiv = document.getElementById('mapping');
const questionDiv = document.getElementById('question');
const buttonsDiv = document.getElementById('buttons');
const countSpan = document.getElementById('count');
const timerDiv = document.getElementById('timer');
const stageInfo = document.getElementById('stageInfo');
const resultDiv = document.getElementById('result');


// ===============================
// UTIL
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
// BUTTON
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
// RESULT + FIREBASE
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
    html += `<br><br><button onclick="finishExam()">Kembali ke Dashboard</button>`;

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
    
    console.log("Finish exam called, returning to dashboard...");
    
    // Wait a bit to ensure Firebase data is saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset exam state
    stage = 1;
    scores = [];
    count = 0;
    correctCount = 0;
    
    // Clear timers
    clearInterval(timer);
    clearInterval(breakTimer);
    
    // Hide exam and result
    document.getElementById("exam").style.display = "none";
    document.getElementById("result").style.display = "none";
    
    // Show dashboard
    document.getElementById("dashboard").style.display = "block";
    
    // Reload all dashboard data
    console.log("Reloading history, statistics, and badges...");
    await loadHistory();
    await loadStatistics();
    loadBadges();
    
    console.log("Dashboard loaded with updated data!");
}