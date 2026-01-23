/*************************************************
 * CAT KECERMATAN AKPOL
 * File : script.js
 * Fungsi : Mengatur logika ujian
 *************************************************/


/* ===============================================
   BAGIAN 1 : DATA SOAL
   =============================================== */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {

    let j = Math.floor(Math.random() * (i + 1));

    // Tukar posisi
    [array[i], array[j]] = [array[j], array[i]];
  }
}
const questions = [

  {
    pattern: ["★","★","☆","★","?","☆"],
    answer: "★",
    options: ["★","☆","▲","●","■","◆"]
  },

  {
    pattern: ["▲","●","▲","●","▲","?"],
    answer: "●",
    options: ["●","▲","★","■","◆","☆"]
  },

  {
    pattern: ["■","■","◆","■","■","?"],
    answer: "◆",
    options: ["■","◆","▲","●","☆","★"]
  },

  {
    pattern: ["○","●","○","●","○","?"],
    answer: "●",
    options: ["○","●","■","▲","★","◆"]
  },

  {
    pattern: ["◆","▲","■","◆","▲","?"],
    answer: "■",
    options: ["■","◆","▲","●","☆","★"]
  },

  {
    pattern: ["◆","▲","■","◆","▲","?"],
    answer: "■",
    options: ["■","◆","▲","●","☆","★"]
  }

];


/* ===============================================
   BAGIAN 2 : VARIABEL GLOBAL
   =============================================== */

let currentQuestion = 0;   // Nomor soal
let score = 0;             // Skor
let timeLeft = 600;        // Waktu (detik)
let timer;                 // Timer
let userName = "";         // Nama peserta


/* ===============================================
   BAGIAN 3 : AMBIL ELEMEN HTML
   =============================================== */

const startBtn   = document.getElementById("startBtn");
const loginBox   = document.getElementById("login");
const testBox    = document.getElementById("test");
const resultBox  = document.getElementById("result");

const nameInput  = document.getElementById("nameInput");
const userLabel  = document.getElementById("userName");

const timerLabel = document.getElementById("timer");
const questionBox= document.getElementById("question");
const optionsBox = document.getElementById("options");

const finalName  = document.getElementById("finalName");
const finalScore = document.getElementById("finalScore");


/* ===============================================
   BAGIAN 4 : EVENT BUTTON
   =============================================== */

startBtn.addEventListener("click", startTest);


/* ===============================================
   BAGIAN 5 : MULAI UJIAN
   =============================================== */

function startTest() {

  userName = nameInput.value;

  // Validasi nama
  if (userName === "") {
    alert("Nama wajib diisi!");
    return;
  }

  shuffle(questions);
  // Tampilkan halaman ujian
  loginBox.classList.add("hidden");
  testBox.classList.remove("hidden");

  userLabel.innerText = "Peserta: " + userName;

  startTimer();
  showQuestion();
}


/* ===============================================
   BAGIAN 6 : TIMER
   =============================================== */

function startTimer() {

  timer = setInterval(function() {

    timeLeft--;

    let menit = Math.floor(timeLeft / 60);
    let detik = timeLeft % 60;

    if (detik < 10) {
      detik = "0" + detik;
    }

    timerLabel.innerText =
      "Waktu: " + menit + ":" + detik;

    if (timeLeft <= 0) {
      finishTest();
    }

  }, 1000);
}


/* ===============================================
   BAGIAN 7 : TAMPILKAN SOAL
   =============================================== */

function showQuestion() {

  // Jika soal habis
  if (currentQuestion >= questions.length) {
    finishTest();
    return;
  }

  let q = questions[currentQuestion];

  shuffle(q.options);

  // Tampilkan pola
  questionBox.innerText =
    q.pattern.join("   ");

  // Bersihkan pilihan lama
  optionsBox.innerHTML = "";

  // Buat pilihan baru
  q.options.forEach(function(pilihan) {

    let btn = document.createElement("div");

    btn.className = "option";
    btn.innerText = pilihan;

    btn.onclick = function() {
      checkAnswer(pilihan);
    };

    optionsBox.appendChild(btn);

  });
}


/* ===============================================
   BAGIAN 8 : CEK JAWABAN
   =============================================== */

function checkAnswer(jawabanUser) {

  let jawabanBenar =
    questions[currentQuestion].answer;

  if (jawabanUser === jawabanBenar) {
    score++;
  }

  currentQuestion++;

  showQuestion();
}


/* ===============================================
   BAGIAN 9 : SELESAI UJIAN
   =============================================== */

function finishTest() {

  clearInterval(timer);

  testBox.classList.add("hidden");
  resultBox.classList.remove("hidden");

  finalName.innerText =
    "Nama: " + userName;

  let nilai =
    Math.round((score / questions.length) * 100);

  finalScore.innerText =
    "Skor: " + score +
    " / " + questions.length +
    " (" + nilai + ")";
}
