/* =============================
   FUNGSI ACAK (SHUFFLE)
============================= */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {

    let j = Math.floor(Math.random() * (i + 1));

    // Tukar posisi
    [array[i], array[j]] = [array[j], array[i]];
  }
}


/* =============================
   BANK SOAL
============================= */
const questions = [

  {
    pattern: ["★","★","☆","★","?","☆"],
    answer: "★",
    options: ["★","☆","▲","●","■","◆"]
  },

  {
    pattern: ["▲","●","▲","●","▲","?"],
    answer: "●",
    options: ["●","▲","■","◆","★","☆"]
  },

  {
    pattern: ["■","■","◆","■","?","◆"],
    answer: "■",
    options: ["■","◆","★","●","▲","☆"]
  },

  {
    pattern: ["☆","★","☆","★","☆","?"],
    answer: "★",
    options: ["★","☆","▲","■","◆","●"]
  },

  {
    pattern: ["●","▲","●","▲","●","?"],
    answer: "▲",
    options: ["▲","●","■","◆","★","☆"]
  },

  {
    pattern: ["●","▲","●","▲","●","?"],
    answer: "▲",
    options: ["▲","●","■","◆","★","☆"]
  }
];


/* =============================
   VARIABEL
============================= */
let currentQuestion = 0;
let score = 0;
let timeLeft = 600;
let timer;
let userName = "";


/* =============================
   AMBIL ELEMEN HTML
============================= */
const startBtn = document.getElementById("startBtn");

const nameInput = document.getElementById("nameInput");

const loginBox = document.getElementById("login");
const testBox = document.getElementById("test");
const resultBox = document.getElementById("result");

const questionBox = document.getElementById("question");
const optionsBox = document.getElementById("options");

const timerLabel = document.getElementById("timer");

const userNameLabel = document.getElementById("userName");

const finalName = document.getElementById("finalName");
const finalScore = document.getElementById("finalScore");


/* =============================
   EVENT BUTTON
============================= */
startBtn.addEventListener("click", startTest);


/* =============================
   MULAI UJIAN
============================= */
function startTest() {

  userName = nameInput.value;

  if (userName === "") {
    alert("Masukkan nama terlebih dahulu!");
    return;
  }

  // ACAK SOAL
  shuffle(questions);

  loginBox.classList.add("hidden");
  testBox.classList.remove("hidden");

  userNameLabel.innerText = "Peserta: " + userName;

  startTimer();
  showQuestion();
}


/* =============================
   TIMER
============================= */
function startTimer() {

  timer = setInterval(function() {

    timeLeft--;

    let menit = Math.floor(timeLeft / 60);
    let detik = timeLeft % 60;

    if (detik < 10) {
      detik = "0" + detik;
    }

    timerLabel.innerText = "Waktu: " + menit + ":" + detik;

    if (timeLeft <= 0) {
      finishTest();
    }

  }, 1000);

}


/* =============================
   TAMPILKAN SOAL
============================= */
function showQuestion() {

  if (currentQuestion >= questions.length) {
    finishTest();
    return;
  }

  let q = questions[currentQuestion];

  // ACAK PILIHAN JAWABAN
  shuffle(q.options)

  questionBox.innerText = q.pattern.join(" ");

  optionsBox.innerHTML = "";

  q.options.forEach(function(opt) {

    let btn = document.createElement("button");

    btn.innerText = opt;

    btn.onclick = function() {
      checkAnswer(opt);
    };

    optionsBox.appendChild(btn);

  });

}


/* =============================
   CEK JAWABAN
============================= */
function checkAnswer(answer) {

  let correct = questions[currentQuestion].answer;

  if (answer === correct) {
    score++;
  }

  currentQuestion++;

  showQuestion();

}


/* =============================
   SELESAI
============================= */
function finishTest() {

  clearInterval(timer);

  testBox.classList.add("hidden");
  resultBox.classList.remove("hidden");

  let total = questions.length;

  let nilai = Math.round((score / total) * 100);

  finalName.innerText = "Nama: " + userName;

  finalScore.innerText =
    "Skor: " + score + "/" + total +
    " | Nilai: " + nilai;

}
