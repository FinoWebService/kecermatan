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
// AUTH NAVIGATION
// ===============================
window.showRegister = function(){
    document.getElementById("registerPage").style.display = "flex";
    document.getElementById("loginPage").style.display = "none";
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
        currentUser = null;
        
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
// BACK TO DASHBOARD
// ===============================
window.backToDashboard = function(){
    
    const confirm = window.confirm("Yakin ingin kembali? Tes akan dibatalkan.");
    
    if(confirm){
        
        // Reset exam
        clearInterval(timer);
        clearInterval(breakTimer);
        
        stage = 1;
        scores = [];
        
        document.getElementById("exam").style.display = "none";
        document.getElementById("result").style.display = "none";
        
        showDashboard();
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

    } catch (e){

        console.error("Firebase error:", e);
        alert("Gagal simpan nilai!");
    }
}


// ===============================
// FINISH EXAM
// ===============================
window.finishExam = function(){
    
    // Reset exam
    stage = 1;
    scores = [];
    
    document.getElementById("exam").style.display = "none";
    document.getElementById("result").style.display = "none";
    
    showDashboard();
}