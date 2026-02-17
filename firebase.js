import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc
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
    
    console.log("Firebase registerUser called with:", username);
    
    try {
        
        const q = query(
            collection(db, "users"), 
            where("username", "==", username)
        );
        
        console.log("Checking if username exists...");
        const snapshot = await getDocs(q);
        
        if(!snapshot.empty){
            console.log("Username already exists");
            return {
                success: false,
                message: "Username sudah digunakan!"
            };
        }
        
        console.log("Username available, creating user...");
        const userRef = doc(collection(db, "users"));
        
        await setDoc(userRef, {
            username: username,
            password: password,
            createdAt: new Date()
        });
        
        console.log("User created successfully!");
        
        return {
            success: true,
            message: "Registrasi berhasil!"
        };
        
    } catch(e){
        console.error("Register error in Firebase:", e);
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


// ===============================
// ADMIN FUNCTIONS
// ===============================

// Login Admin
export async function loginAdmin(username, password){
    try {
        const q = query(
            collection(db, "admins"),
            where("username", "==", username),
            where("password", "==", password),
            where("status", "==", "active")
        );
        
        const snapshot = await getDocs(q);
        
        if(snapshot.empty){
            return {
                success: false,
                message: "Username atau password admin salah!"
            };
        }
        
        const adminDoc = snapshot.docs[0];
        const adminData = adminDoc.data();
        
        return {
            success: true,
            admin: {
                id: adminDoc.id,
                username: adminData.username,
                permissions: adminData.permissions,
                role: 'admin'
            }
        };
        
    } catch(e){
        console.error("Admin login error:", e);
        throw e;
    }
}

// Create Admin Invitation
export async function createAdminInvitation(invitedUsername, permissions, invitedByAdminId){
    try {
        // Check if username already exists
        const checkUser = query(
            collection(db, "users"),
            where("username", "==", invitedUsername)
        );
        const userCheck = await getDocs(checkUser);
        
        const checkAdmin = query(
            collection(db, "admins"),
            where("username", "==", invitedUsername)
        );
        const adminCheck = await getDocs(checkAdmin);
        
        if(!userCheck.empty || !adminCheck.empty){
            return {
                success: false,
                message: "Username sudah digunakan!"
            };
        }
        
        // Generate random 8-character invite code
        const inviteCode = Array.from({length: 8}, () => 
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
        ).join('');
        
        const invitationRef = await addDoc(collection(db, "admin_invitations"), {
            invitedUsername,
            invitedBy: invitedByAdminId,
            inviteCode,
            status: "pending",
            permissions,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date()
        });
        
        return {
            success: true,
            inviteCode,
            invitationId: invitationRef.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        };
        
    } catch(e){
        console.error("Create invitation error:", e);
        throw e;
    }
}

// Validate Invitation Code
export async function validateInvitationCode(inviteCode){
    try {
        const q = query(
            collection(db, "admin_invitations"),
            where("inviteCode", "==", inviteCode.toUpperCase()),
            where("status", "==", "pending")
        );
        
        const snapshot = await getDocs(q);
        
        if(snapshot.empty){
            return {
                success: false,
                message: "Kode invitation tidak valid atau sudah digunakan!"
            };
        }
        
        const inviteDoc = snapshot.docs[0];
        const inviteData = inviteDoc.data();
        
        // Check if expired
        if(inviteData.expiresAt.toDate() < new Date()){
            return {
                success: false,
                message: "Invitation sudah expired!"
            };
        }
        
        return {
            success: true,
            invitation: {
                id: inviteDoc.id,
                username: inviteData.invitedUsername,
                permissions: inviteData.permissions
            }
        };
        
    } catch(e){
        console.error("Validate invitation error:", e);
        throw e;
    }
}

// Accept Invitation & Create Admin Account
export async function acceptAdminInvitation(invitationId, password){
    try {
        const inviteDoc = await getDoc(doc(db, "admin_invitations", invitationId));
        
        if(!inviteDoc.exists()){
            return {
                success: false,
                message: "Invitation tidak ditemukan!"
            };
        }
        
        const inviteData = inviteDoc.data();
        
        // Create admin account
        const adminRef = doc(collection(db, "admins"));
        
        await setDoc(adminRef, {
            username: inviteData.invitedUsername,
            password: password,
            status: "active",
            invitedBy: inviteData.invitedBy,
            permissions: inviteData.permissions,
            createdAt: new Date()
        });
        
        // Update invitation status
        await updateDoc(doc(db, "admin_invitations", invitationId), {
            status: "accepted",
            acceptedAt: new Date()
        });
        
        return {
            success: true,
            message: "Akun admin berhasil dibuat!",
            admin: {
                id: adminRef.id,
                username: inviteData.invitedUsername,
                permissions: inviteData.permissions,
                role: 'admin'
            }
        };
        
    } catch(e){
        console.error("Accept invitation error:", e);
        throw e;
    }
}

// Get All Admins
export async function getAllAdmins(){
    try {
        const snapshot = await getDocs(collection(db, "admins"));
        
        const admins = [];
        snapshot.forEach(doc => {
            admins.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return admins;
        
    } catch(e){
        console.error("Get admins error:", e);
        throw e;
    }
}

// Get All Users (for admin)
export async function getAllUsers(){
    try {
        const snapshot = await getDocs(collection(db, "users"));
        
        const users = [];
        snapshot.forEach(doc => {
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return users;
        
    } catch(e){
        console.error("Get users error:", e);
        throw e;
    }
}

// Delete User
export async function deleteUser(userId){
    try {
        await deleteDoc(doc(db, "users", userId));
        return { success: true };
    } catch(e){
        console.error("Delete user error:", e);
        throw e;
    }
}

// Delete Test Result
export async function deleteTestResult(testId){
    try {
        await deleteDoc(doc(db, "hasilTes", testId));
        return { success: true };
    } catch(e){
        console.error("Delete test error:", e);
        throw e;
    }
}

// Revoke Admin Access
export async function revokeAdminAccess(adminId){
    try {
        await updateDoc(doc(db, "admins", adminId), {
            status: "revoked"
        });
        return { success: true };
    } catch(e){
        console.error("Revoke admin error:", e);
        throw e;
    }
}

// Get All Test Results (for admin analytics)
export async function getAllTestResults(){
    try {
        const snapshot = await getDocs(collection(db, "hasilTes"));
        
        const results = [];
        snapshot.forEach(doc => {
            results.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return results;
        
    } catch(e){
        console.error("Get all tests error:", e);
        throw e;
    }
}