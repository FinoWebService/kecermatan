// ===============================
// ADMIN SCRIPT - Standalone Version
// Must be loaded AFTER script.js
// ===============================

console.log("✅ Admin script loaded");

// Initialize admin features after DOM loaded
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(initAdminFeatures, 100); // Small delay to ensure script.js is fully loaded
});

function initAdminFeatures() {
    console.log("🔧 Initializing admin features...");
    
    // Check if main functions are available
    if(!window.currentUser && !localStorage.getItem('currentUser')) {
        console.log("No user session found");
    }
    
    // Override user circle click
    const userCircle = document.getElementById('userCircle');
    if(userCircle) {
        const newUserCircle = userCircle.cloneNode(true);
        userCircle.parentNode.replaceChild(newUserCircle, userCircle);
        
        newUserCircle.addEventListener('click', () => {
            if(window.currentUser){
                window.showLogoutConfirm();
            } else {
                const loginSelectionModal = document.getElementById('loginSelectionModal');
                if(loginSelectionModal) {
                    loginSelectionModal.classList.add('active');
                }
            }
        });
        console.log("✅ User circle override successful");
    }
    
    setupAdminEventListeners();
}

function setupAdminEventListeners() {
    // Close login selection
    document.getElementById('closeLoginSelection')?.addEventListener('click', () => {
        document.getElementById('loginSelectionModal').classList.remove('active');
    });
    
    // Select user login
    document.getElementById('btnSelectUserLogin')?.addEventListener('click', () => {
        document.getElementById('loginSelectionModal').classList.remove('active');
        document.getElementById('loginModal').classList.add('active');
    });
    
    // Select admin login
    document.getElementById('btnSelectAdminLogin')?.addEventListener('click', () => {
        document.getElementById('loginSelectionModal').classList.remove('active');
        document.getElementById('adminLoginModal').classList.add('active');
    });
    
    // Close admin login
    document.getElementById('closeAdminLogin')?.addEventListener('click', () => {
        document.getElementById('adminLoginModal').classList.remove('active');
    });
    
    // Admin login
    document.getElementById('btnAdminLogin')?.addEventListener('click', handleAdminLogin);
    
    // Admin invitation
    document.getElementById('linkAdminInvitation')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('adminLoginModal').classList.remove('active');
        document.getElementById('adminInvitationModal').classList.add('active');
    });
    
    document.getElementById('closeAdminInvitation')?.addEventListener('click', () => {
        document.getElementById('adminInvitationModal').classList.remove('active');
    });
    
    document.getElementById('btnValidateCode')?.addEventListener('click', handleValidateCode);
    document.getElementById('btnAcceptInvitation')?.addEventListener('click', handleAcceptInvitation);
    
    // Invite admin
    document.getElementById('btnInviteAdmin')?.addEventListener('click', handleInviteAdmin);
    document.getElementById('closeInviteAdmin')?.addEventListener('click', () => {
        document.getElementById('inviteAdminModal').classList.remove('active');
    });
    document.getElementById('btnGenerateInvite')?.addEventListener('click', handleGenerateInvite);
    document.getElementById('btnCopyCode')?.addEventListener('click', handleCopyCode);
    document.getElementById('btnShareWhatsApp')?.addEventListener('click', handleShareWhatsApp);
    
    // Navigation
    document.getElementById('btnManageUsers')?.addEventListener('click', () => {
        if(!window.currentUser?.permissions?.manageUsers) {
            alert("Anda tidak memiliki permission!");
            return;
        }
        window.navigateTo('manage-users');
        loadManageUsers();
    });
    
    document.getElementById('btnManageAdmins')?.addEventListener('click', () => {
        window.navigateTo('manage-admins');
        loadManageAdmins();
    });
    
    document.getElementById('btnViewAllTests')?.addEventListener('click', () => {
        if(!window.currentUser?.permissions?.viewAnalytics) {
            alert("Anda tidak memiliki permission!");
            return;
        }
        window.navigateTo('view-all-tests');
        loadAllTests();
    });
    
    console.log("✅ All admin event listeners attached");
}

async function handleAdminLogin() {
    const username = document.getElementById('adminLoginUsername').value.trim();
    const password = document.getElementById('adminLoginPassword').value;
    
    console.log("🔐 Admin login attempt:", username);
    
    if(!username || !password){
        alert("Username dan password harus diisi!");
        return;
    }
    
    try {
        console.log("🔐 Attempting admin login...");
        const result = await window.loginAdmin(username, password);
        
        console.log("🔐 Login result:", result);
        
        if(result.success){
            window.currentUser = result.admin;
            localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
            
            console.log("✅ Admin logged in:", window.currentUser);
            
            document.getElementById('adminLoginUsername').value = "";
            document.getElementById('adminLoginPassword').value = "";
            document.getElementById('adminLoginModal').classList.remove('active');
            
            console.log("🔄 Navigating to admin-dashboard...");
            window.navigateTo('admin-dashboard');
            
            console.log("📊 Loading admin dashboard...");
            loadAdminDashboard();
            
            alert(`Selamat datang, Admin ${window.currentUser.username}!`);
        } else {
            alert(result.message);
        }
    } catch(e){
        console.error("❌ Admin login error:", e);
        alert("Terjadi kesalahan: " + e.message);
    }
}

async function handleValidateCode() {
    const code = document.getElementById('inviteCode').value.trim().toUpperCase();
    
    if(code.length !== 8){
        alert("Invitation code harus 8 karakter!");
        return;
    }
    
    try {
        const result = await window.validateInvitationCode(code);
        
        if(result.success){
            document.getElementById('inviteUsername').innerText = result.invitation.username;
            
            const perms = [];
            if(result.invitation.permissions.manageUsers) perms.push("Manage Users");
            if(result.invitation.permissions.deleteTests) perms.push("Delete Tests");
            if(result.invitation.permissions.inviteAdmin) perms.push("Invite Admin");
            if(result.invitation.permissions.viewAnalytics) perms.push("View Analytics");
            
            document.getElementById('invitePermissions').innerText = perms.join(", ");
            document.getElementById('inviteDetails').style.display = 'block';
            window.currentInvitationId = result.invitation.id;
        } else {
            alert(result.message);
        }
    } catch(e){
        console.error(e);
        alert("Terjadi kesalahan saat validasi!");
    }
}

async function handleAcceptInvitation() {
    const password = document.getElementById('adminRegPassword').value;
    const passwordConfirm = document.getElementById('adminRegPasswordConfirm').value;
    
    if(!password || password.length < 8 || password !== passwordConfirm){
        alert("Password minimal 8 karakter dan harus sama!");
        return;
    }
    
    try {
        const result = await window.acceptAdminInvitation(window.currentInvitationId, password);
        
        if(result.success){
            window.currentUser = result.admin;
            localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
            
            document.getElementById('adminInvitationModal').classList.remove('active');
            window.navigateTo('admin-dashboard');
            loadAdminDashboard();
            
            alert("Akun admin berhasil dibuat!");
        } else {
            alert(result.message);
        }
    } catch(e){
        console.error(e);
        alert("Terjadi kesalahan!");
    }
}

function handleInviteAdmin() {
    if(!window.currentUser?.permissions?.inviteAdmin){
        alert("Anda tidak memiliki permission untuk invite admin!");
        return;
    }
    document.getElementById('inviteAdminModal').classList.add('active');
}

async function handleGenerateInvite() {
    const username = document.getElementById('newAdminUsername').value.trim();
    
    if(!username || username.length < 4){
        alert("Username minimal 4 karakter!");
        return;
    }
    
    const permissions = {
        manageUsers: document.getElementById('permManageUsers').checked,
        deleteTests: document.getElementById('permDeleteTests').checked,
        inviteAdmin: document.getElementById('permInviteAdmin').checked,
        viewAnalytics: document.getElementById('permViewAnalytics').checked
    };
    
    try {
        const result = await window.createAdminInvitation(username, permissions, window.currentUser.id);
        
        if(result.success){
            document.getElementById('resultUsername').innerText = username;
            document.getElementById('resultCode').innerText = result.inviteCode;
            document.getElementById('resultExpiry').innerText = 
                result.expiresAt.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            
            document.getElementById('inviteResult').style.display = 'block';
        } else {
            alert(result.message);
        }
    } catch(e){
        console.error(e);
        alert("Terjadi kesalahan!");
    }
}

function handleCopyCode() {
    const code = document.getElementById('resultCode').innerText;
    const username = document.getElementById('resultUsername').innerText;
    
    const text = `INVITATION ADMIN CERMATRIX\n\nUsername: ${username}\nCode: ${code}\n\nBuka website, pilih Login Admin, klik "Punya invitation code?" dan masukkan code.`;
    
    navigator.clipboard.writeText(text);
    alert("Code berhasil di-copy!");
}

function handleShareWhatsApp() {
    const code = document.getElementById('resultCode').innerText;
    const username = document.getElementById('resultUsername').innerText;
    
    const text = encodeURIComponent(`INVITATION ADMIN CERMATRIX\n\nUsername: ${username}\nCode: ${code}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

async function loadAdminDashboard(){
    console.log("📊 loadAdminDashboard called");
    console.log("👤 Current user:", window.currentUser);
    
    if(!window.currentUser || window.currentUser.role !== 'admin'){
        console.error("❌ Not admin, redirecting to home");
        window.navigateTo('home');
        return;
    }
    
    const displayNameEl = document.getElementById('adminDisplayName');
    if(displayNameEl) {
        displayNameEl.innerText = window.currentUser.username;
        console.log("✅ Display name set to:", window.currentUser.username);
    } else {
        console.error("❌ adminDisplayName element not found!");
    }
    
    try {
        console.log("📡 Fetching admin data...");
        const users = await window.getAllUsers();
        const tests = await window.getAllTestResults();
        const admins = await window.getAllAdmins();
        
        console.log("📊 Data fetched:", {users: users.length, tests: tests.length, admins: admins.length});
        
        document.getElementById('statTotalUsers').innerText = users.length;
        document.getElementById('statTotalTests').innerText = tests.length;
        document.getElementById('statTotalAdmins').innerText = admins.length;
        
        if(tests.length > 0){
            const avgScore = Math.round(tests.reduce((s, t) => s + t.nilai, 0) / tests.length);
            document.getElementById('statAvgScore').innerText = avgScore;
        }
        
        console.log("✅ Dashboard loaded successfully");
    } catch(e){
        console.error("❌ Dashboard error:", e);
    }
}

async function loadManageUsers(){
    try {
        const users = await window.getAllUsers();
        document.getElementById('userCount').innerText = users.length;
        
        let html = `<table class="admin-table"><thead><tr><th>Username</th><th>Created</th><th>Actions</th></tr></thead><tbody>`;
        
        users.forEach(user => {
            const date = user.createdAt.toDate().toLocaleDateString('id-ID');
            html += `<tr><td>${user.username}</td><td>${date}</td><td><button class="btn-delete" onclick="deleteUserConfirm('${user.id}', '${user.username}')">🗑️ Delete</button></td></tr>`;
        });
        
        html += `</tbody></table>`;
        document.getElementById('usersList').innerHTML = html;
    } catch(e){
        console.error(e);
    }
}

window.deleteUserConfirm = function(userId, username){
    if(confirm(`Yakin hapus user "${username}"?`)){
        window.deleteUser(userId).then(() => {
            alert("User dihapus!");
            loadManageUsers();
        });
    }
}

async function loadManageAdmins(){
    try {
        const admins = await window.getAllAdmins();
        document.getElementById('adminCount').innerText = admins.length;
        
        let html = `<table class="admin-table"><thead><tr><th>Username</th><th>Status</th><th>Permissions</th><th>Actions</th></tr></thead><tbody>`;
        
        admins.forEach(admin => {
            const perms = [];
            if(admin.permissions?.manageUsers) perms.push("Users");
            if(admin.permissions?.deleteTests) perms.push("Tests");
            if(admin.permissions?.inviteAdmin) perms.push("Invite");
            if(admin.permissions?.viewAnalytics) perms.push("Analytics");
            
            const status = admin.status === 'active' ? '<span class="badge-active">Active</span>' : '<span class="badge-revoked">Revoked</span>';
            const action = (admin.status === 'active' && admin.id !== window.currentUser.id) ? 
                `<button class="btn-revoke" onclick="revokeAdminConfirm('${admin.id}', '${admin.username}')">⛔ Revoke</button>` : '-';
            
            html += `<tr><td>${admin.username}</td><td>${status}</td><td class="perms-cell">${perms.join(", ")}</td><td>${action}</td></tr>`;
        });
        
        html += `</tbody></table>`;
        document.getElementById('adminsList').innerHTML = html;
    } catch(e){
        console.error(e);
    }
}

window.revokeAdminConfirm = function(adminId, username){
    if(confirm(`Yakin revoke admin "${username}"?`)){
        window.revokeAdminAccess(adminId).then(() => {
            alert("Admin di-revoke!");
            loadManageAdmins();
        });
    }
}

async function loadAllTests(){
    try {
        const tests = await window.getAllTestResults();
        document.getElementById('testCount').innerText = tests.length;
        
        tests.sort((a, b) => b.waktu.seconds - a.waktu.seconds);
        
        let html = `<table class="admin-table"><thead><tr><th>User</th><th>Score</th><th>Date</th><th>Actions</th></tr></thead><tbody>`;
        
        tests.forEach(test => {
            const date = test.waktu.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'});
            const action = window.currentUser?.permissions?.deleteTests ? 
                `<button class="btn-delete" onclick="deleteTestConfirm('${test.id}', '${test.nama}')">🗑️ Delete</button>` : '-';
            
            html += `<tr><td>${test.nama}</td><td><strong>${test.nilai}</strong></td><td>${date}</td><td>${action}</td></tr>`;
        });
        
        html += `</tbody></table>`;
        document.getElementById('allTestsList').innerHTML = html;
    } catch(e){
        console.error(e);
    }
}

window.deleteTestConfirm = function(testId, username){
    if(confirm(`Yakin hapus tes dari "${username}"?`)){
        window.deleteTestResult(testId).then(() => {
            alert("Test dihapus!");
            loadAllTests();
        });
    }
}