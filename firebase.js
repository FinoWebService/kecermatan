// ===============================
// IMPORT FIREBASE SDK
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";


// ===============================
// KONFIG FIREBASE
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyBvAuX66peHvmpKtvdh9MIk9Em3WnxDLLU",
  authDomain: "cat-kecermatan-cb9d1.firebaseapp.com",
  projectId: "cat-kecermatan-cb9d1",
  storageBucket: "cat-kecermatan-cb9d1.firebasestorage.app",
  messagingSenderId: "1081198055610",
  appId: "1:1081198055610:web:d5e9de4f650d86fce57283",
  measurementId: "G-6F8G5PN134"
};


// ===============================
// INIT FIREBASE
// ===============================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ===============================
// FUNGSI SIMPAN NILAI
// ===============================
export async function simpanNilai(nama, nilai){

  try {

    await addDoc(collection(db, "hasil_ujian"), {

      nama: nama,
      nilai: nilai,
      waktu: serverTimestamp()

    });

    console.log("Data masuk Firebase!");

  } catch (error){

    console.error("Error simpan:", error);

  }

}
