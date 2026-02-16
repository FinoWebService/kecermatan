import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

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


export async function registerUser(username, password){
    
    try {
        
        const q = query(
            collection(db, "users"), 
            where("username", "==", username)
        );
        
        const snapshot = await getDocs(q);
        
        if(!snapshot.empty){
            return {
                success: false,
                message: "Username sudah digunakan!"
            };
        }
        
        const userRef = doc(collection(db, "users"));
        
        await setDoc(userRef, {
            username: username,
            password: password,
            createdAt: new Date()
        });
        
        return {
            success: true,
            message: "Registrasi berhasil!"
        };
        
    } catch(e){
        console.error("Register error:", e);
        throw e;
    }
}


export async function loginUser(username, password){
    
    try {
        
        const q = query(
            collection(db, "users"),
            where("username", "==", username),
            where("password", "==", password)
        );
        
        const snapshot = await getDocs(q);
        
        if(snapshot.empty){
            return {
                success: false,
                message: "Username atau password salah!"
            };
        }
        
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        
        return {
            success: true,
            user: {
                id: userDoc.id,
                username: userData.username
            }
        };
        
    } catch(e){
        console.error("Login error:", e);
        throw e;
    }
}


export async function simpanNilai(userId, nama, nilai){
    
    await addDoc(collection(db, "hasilTes"), {
        userId: userId,
        nama: nama,
        nilai: nilai,
        waktu: new Date()
    });
}


export async function getRiwayatTes(userId){
    
    try {
        
        const q = query(
            collection(db, "hasilTes"),
            where("userId", "==", userId)
        );
        
        const snapshot = await getDocs(q);
        
        const history = [];
        
        snapshot.forEach(doc => {
            history.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        history.sort((a, b) => {
            return b.waktu.seconds - a.waktu.seconds;
        });
        
        return history;
        
    } catch(e){
        console.error("Get history error:", e);
        throw e;
    }
}


export async function getLeaderboard(limit = 10){
    
    try {
        
        const q = query(collection(db, "hasilTes"));
        
        const snapshot = await getDocs(q);
        
        const allScores = [];
        
        snapshot.forEach(doc => {
            allScores.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        allScores.sort((a, b) => {
            if(b.nilai !== a.nilai){
                return b.nilai - a.nilai;
            }
            return b.waktu.seconds - a.waktu.seconds;
        });
        
        return allScores.slice(0, limit);
        
    } catch(e){
        console.error("Get leaderboard error:", e);
        throw e;
    }
}