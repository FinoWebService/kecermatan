import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvAuX66peHvmpKtvdh9MIk9Em3WnxDLLU",
  authDomain: "cat-kecermatan-cb9d1.firebaseapp.com",
  projectId: "cat-kecermatan-cb9d1",
  storageBucket: "cat-kecermatan-cb9d1.firebasestorage.app",
  messagingSenderId: "1081198055610",
  appId: "1:1081198055610:web:d5e9de4f650d86fce57283"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function simpanNilai(nama, nilai){

  await addDoc(collection(db, "hasilTes"), {
    nama,
    nilai,
    waktu: new Date()
  });

}
