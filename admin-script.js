// ===============================
// ADMIN SCRIPT - OPTIMIZED & BUG-FIXED
// ===============================

window.addEventListener('DOMContentLoaded', function() {
    setTimeout(initAdminFeatures, 100);
});

function initAdminFeatures() {
    const userCircle = document.getElementById('userCircle');
    if(userCircle) {
        const newUserCircle = userCircle.cloneNode(true);
        userCircle.parentNode.replaceChild(newUserCircle, userCircle);
        
        newUserCircle.addEventListener('click', () => {
            if(window.currentUser){
                window.showLogoutConfirm();
            } else {
                document.getElementById('loginSelectionModal')?.classList.add('active');
            }
        });
    }
    
    setupAdminEventListeners();
}

function setupAdminEventListeners() {
    // Login selection
    document.getElementById('closeLoginSelection')?.addEventListener('click', () => {
        document.getElementById('loginSelectionModal').classList.remove('active');
    });
    
    document.getElementById('btnSelectUserLogin')?.addEventListener('click', () => {
        document.getElementById('loginSelectionModal').classList.remove('active');
        document.getElementById('loginModal').classList.add('active');
    });
    
    document.getElementById('btnSelectAdminLogin')?.addEventListener('click', () => {
        document.getElementById('loginSelectionModal').classList.remove('active');
        document.getElementById('adminLoginModal').classList.add('active');
    });
    
    // Admin login/invitation
    document.getElementById('closeAdminLogin')?.addEventListener('click', () => {
        document.getElementById('adminLoginModal').classList.remove('active');
    });
    
    document.getElementById('btnAdminLogin')?.addEventListener('click', handleAdminLogin);
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
        window.navigateTo('manageUsers');
        loadManageUsers();
    });
    
    document.getElementById('btnManageAdmins')?.addEventListener('click', () => {
        window.navigateTo('manageAdmins');
        loadManageAdmins();
    });
    
    document.getElementById('btnViewAllTests')?.addEventListener('click', () => {
        if(!window.currentUser?.permissions?.viewAnalytics) {
            alert("Anda tidak memiliki permission!");
            return;
        }
        window.navigateTo('viewAllTests');
        loadAllTests();
    });
}

async function handleAdminLogin() {
    const username = document.getElementById('adminLoginUsername').value.trim();
    const password = document.getElementById('adminLoginPassword').value;
    
    if(!username || !password){
        alert("Username dan password harus diisi!");
        return;
    }
    
    try {
        const result = await window.loginAdmin(username, password);
        
        if(result.success){
            // Set current user
            window.currentUser = result.admin;
            localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
            
            // ✅ FIX: Update ALL UI elements immediately
            document.getElementById('homeUserName').innerText = window.currentUser.username;
            document.getElementById('topbarUserName').innerText = window.currentUser.username;
            
            // Update sidebar
            document.getElementById('sidebarUserInfo').innerHTML = `
                <div class="sidebar-user-name">${window.currentUser.username}</div>
                <button class="btn-sidebar-logout" onclick="window.showLogoutConfirm()">
                    Logout
                </button>
            `;
            
            // ✅ FIX: Show admin menu AND attach listeners
            showAdminMenu();
            
            // Clear form
            document.getElementById('adminLoginUsername').value = "";
            document.getElementById('adminLoginPassword').value = "";
            
            // Close modal
            document.getElementById('adminLoginModal').classList.remove('active');
            
            // Navigate to dashboard
            window.navigateTo('adminDashboard');
            
            // Load dashboard data
            await loadAdminDashboard();
            
            console.log("✅ Admin login successful!");
        } else {
            alert(result.message);
        }
    } catch(e){
        console.error("Admin login error:", e);
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
            window.navigateTo('adminDashboard');
            await loadAdminDashboard();
            
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
    console.log("📊 Loading admin dashboard...");
    
    if(!window.currentUser || window.currentUser.role !== 'admin'){
        console.error("Not admin, redirecting...");
        window.navigateTo('home');
        return;
    }
    
    const displayNameEl = document.getElementById('adminDisplayName');
    if(displayNameEl) {
        displayNameEl.innerText = window.currentUser.username;
    }
    
    try {
        console.log("Fetching data...");
        const users = await window.getAllUsers();
        const tests = await window.getAllTestResults();
        const admins = await window.getAllAdmins();
        
        console.log(`✅ Data loaded: ${users.length} users, ${tests.length} tests, ${admins.length} admins`);
        
        document.getElementById('statTotalUsers').innerText = users.length;
        document.getElementById('statTotalTests').innerText = tests.length;
        document.getElementById('statTotalAdmins').innerText = admins.length;
        
        if(tests.length > 0){
            const avgScore = Math.round(tests.reduce((s, t) => s + t.nilai, 0) / tests.length);
            document.getElementById('statAvgScore').innerText = avgScore;
        }
    } catch(e){
        console.error("Dashboard error:", e);
        alert("Gagal memuat data dashboard: " + e.message);
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

// ✅ FIX: Ensure admin menu items have proper event listeners
function attachAdminMenuListeners() {
    console.log("📎 Attaching admin menu listeners...");
    
    // Find ALL admin menu items
    const adminMenuItems = document.querySelectorAll('.menu-item.admin-only');
    
    adminMenuItems.forEach(item => {
        // Clone to remove old listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Add new listener
        newItem.addEventListener('click', (e) => {
            e.preventDefault();
            const page = newItem.dataset.page;
            console.log("🖱️ Admin menu clicked:", page);
            
            if(page === 'adminDashboard'){
                window.navigateTo('adminDashboard');
                loadAdminDashboard();
            } else if(page === 'manageUsers'){
                if(!window.currentUser?.permissions?.manageUsers){
                    alert("Tidak ada permission!");
                    return;
                }
                window.navigateTo('manageUsers');
                loadManageUsers();
            } else if(page === 'manageAdmins'){
                window.navigateTo('manageAdmins');
                loadManageAdmins();
            } else if(page === 'viewAllTests'){
                if(!window.currentUser?.permissions?.viewAnalytics){
                    alert("Tidak ada permission!");
                    return;
                }
                window.navigateTo('viewAllTests');
                loadAllTests();
            }
            
            // Close sidebar on mobile
            if(window.innerWidth <= 768){
                document.getElementById('sidebar').classList.remove('active');
                document.getElementById('sidebarOverlay').classList.remove('active');
            }
        });
    });
    
    console.log("✅ Admin menu listeners attached:", adminMenuItems.length, "items");
}

// Call this after showing admin menu
function showAdminMenu() {
    document.querySelectorAll('.admin-only').forEach(el => {
        if(el.classList.contains('sidebar-divider')){
            el.style.display = 'block';
        } else {
            el.style.display = 'flex';
        }
    });
    
    // ✅ FIX: Attach listeners after showing
    attachAdminMenuListeners();
}

// ✅ FIX: Better auto-redirect with session check
window.addEventListener('load', () => {
    setTimeout(() => {
        const savedUser = localStorage.getItem('currentUser');
        if(savedUser){
            try {
                const user = JSON.parse(savedUser);
                if(user.role === 'admin'){
                    const currentPage = document.querySelector('.page-content.active');
                    if(currentPage && currentPage.id === 'homePage'){
                        console.log("🔄 Auto-redirecting admin to dashboard...");
                        window.navigateTo('adminDashboard');
                        loadAdminDashboard();
                    }
                }
            } catch(e){
                console.error("Session error:", e);
            }
        }
    }, 300);
});