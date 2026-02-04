// ===============================
// IMPORT FIREBASE
// ===============================
import { simpanNilai } from "./firebase.js";


// ===============================
// GLOBAL USER
// ===============================
let userNameGlobal = "";


// ===============================
// LOGIN
// ===============================
function startExam(){

    let name = document.getElementById("nameInput").value;

    if(name === ""){
        alert("Masukkan nama dulu!");
        return;
    }

    userNameGlobal = name;

    document.getElementById("login").style.display = "none";
    document.getElementById("exam").style.display = "block";

    document.getElementById("userName").innerText =
        "Peserta: " + name;

    startBreak();
}

window.startExam = startExam; // supaya bisa dipanggil dari HTML


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

    resultDiv.style.display = "block";
    resultDiv.innerHTML = html;

    // ===============================
    // SIMPAN KE FIREBASE
    // ===============================
    try {
  console.log("Mencoba simpan ke Firebase:", userNameGlobal, avg);

  await simpanNilai(userNameGlobal, avg);

  alert("Nilai berhasil disimpan!");
} catch (e) {
  console.error("Error simpan nilai:", e);
  alert("Gagal simpan nilai: " + e.message);
}

}
