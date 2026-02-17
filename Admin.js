// ===============================
// ADMIN SCRIPT
// Additional script for admin features
// This should be loaded AFTER main script.js
// ===============================

// Get modal elements
const loginSelectionModal = document.getElementById('loginSelectionModal');
const adminLoginModal = document.getElementById('adminLoginModal');
const adminInvitationModal = document.getElementById('adminInvitationModal');
const inviteAdminModal = document.getElementById('inviteAdminModal');

// Override user circle click to show selection modal
document.getElementById('userCircle').addEventListener('click', (e) => {
    e.stopPropagation();
    
    if(currentUser){
        // If logged in, show logout
        showLogoutConfirm();
    } else {
        // Show login selection
        loginSelectionModal.classList.add('active');
    }
});

// Close login selection modal
document.getElementById('closeLoginSelection')?.addEventListener('click', () => {
    loginSelectionModal.classList.remove('active');
});

// Select user login
document.getElementById('btnSelectUserLogin')?.addEventListener('click', () => {
    loginSelectionModal.classList.remove('active');
    document.getElementById('loginModal').classList.add('active');
});

// Select admin login
document.getElementById('btnSelectAdminLogin')?.addEventListener('click', () => {
    loginSelectionModal.classList.remove('active');
    adminLoginModal.classList.add('active');
});

// Close admin login modal
document.getElementById('closeAdminLogin')?.addEventListener('click', () => {
    adminLoginModal.classList.remove('active');
});

// Admin login
document.getElementById('btnAdminLogin')?.addEventListener('click', async () => {
    const username = document.getElementById('adminLoginUsername').value.trim();
    const password = document.getElementById('adminLoginPassword').value;
    
    if(!username || !password){
        alert("Username dan password harus diisi!");
        return;
    }
    
    try {
        const result = await loginAdmin(username, password);
        
        if(result.success){
            currentUser = result.admin;
            
            // Save session
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Clear form
            document.getElementById('adminLoginUsername').value = "";
            document.getElementById('adminLoginPassword').value = "";
            
            // Close modal
            adminLoginModal.classList.remove('active');
            
            // Navigate to admin dashboard
            navigateTo('admin-dashboard');
            loadAdminDashboard();
            
            alert(`Selamat datang, Admin ${currentUser.username}!`);
        } else {
            alert(result.message);
        }
        
    } catch(e){
        console.error("Admin login error:", e);
        alert("Terjadi kesalahan saat login admin!");
    }
});

// Show admin invitation modal
document.getElementById('linkAdminInvitation')?.addEventListener('click', (e) => {
    e.preventDefault();
    adminLoginModal.classList.remove('active');
    adminInvitationModal.classList.add('active');
});

// Close admin invitation modal
document.getElementById('closeAdminInvitation')?.addEventListener('click', () => {
    adminInvitationModal.classList.remove('active');
});

// Validate invitation code
document.getElementById('btnValidateCode')?.addEventListener('click', async () => {
    const code = document.getElementById('inviteCode').value.trim().toUpperCase();
    
    if(code.length !== 8){
        alert("Invitation code harus 8 karakter!");
        return;
    }
    
    try {
        const result = await validateInvitationCode(code);
        
        if(result.success){
            // Show password form
            document.getElementById('inviteUsername').innerText = result.invitation.username;
            
            const perms = [];
            if(result.invitation.permissions.manageUsers) perms.push("Manage Users");
            if(result.invitation.permissions.deleteTests) perms.push("Delete Tests");
            if(result.invitation.permissions.inviteAdmin) perms.push("Invite Admin");
            if(result.invitation.permissions.viewAnalytics) perms.push("View Analytics");
            
            document.getElementById('invitePermissions').innerText = perms.join(", ");
            document.getElementById('inviteDetails').style.display = 'block';
            
            // Store invitation ID for later
            window.currentInvitationId = result.invitation.id;
        } else {
            alert(result.message);
        }
    } catch(e){
        console.error(e);
        alert("Terjadi kesalahan saat validasi code!");
    }
});

// Accept invitation
document.getElementById('btnAcceptInvitation')?.addEventListener('click', async () => {
    const password = document.getElementById('adminRegPassword').value;
    const passwordConfirm = document.getElementById('adminRegPasswordConfirm').value;
    
    if(!password || !passwordConfirm){
        alert("Password harus diisi!");
        return;
    }
    
    if(password.length < 8){
        alert("Password minimal 8 karakter!");
        return;
    }
    
    if(password !== passwordConfirm){
        alert("Password tidak sama!");
        return;
    }
    
    try {
        const result = await acceptAdminInvitation(window.currentInvitationId, password);
        
        if(result.success){
            alert("Akun admin berhasil dibuat! Silakan login.");
            
            // Save admin session
            currentUser = result.admin;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Close modal & redirect to admin dashboard
            adminInvitationModal.classList.remove('active');
            navigateTo('admin-dashboard');
            loadAdminDashboard();
        } else {
            alert(result.message);
        }
    } catch(e){
        console.error(e);
        alert("Terjadi kesalahan saat aktivasi akun!");
    }
});

// Load admin dashboard
async function loadAdminDashboard(){
    if(!currentUser || currentUser.role !== 'admin'){
        navigateTo('home');
        return;
    }
    
    document.getElementById('adminDisplayName').innerText = currentUser.username;
    
    try {
        // Get stats
        const users = await getAllUsers();
        const tests = await getAllTestResults();
        const admins = await getAllAdmins();
        
        document.getElementById('statTotalUsers').innerText = users.length;
        document.getElementById('statTotalTests').innerText = tests.length;
        document.getElementById('statTotalAdmins').innerText = admins.length;
        
        if(tests.length > 0){
            const avgScore = Math.round(
                tests.reduce((sum, t) => sum + t.nilai, 0) / tests.length
            );
            document.getElementById('statAvgScore').innerText = avgScore;
        }
        
    } catch(e){
        console.error("Load dashboard error:", e);
    }
}

// Invite admin button
document.getElementById('btnInviteAdmin')?.addEventListener('click', () => {
    if(!currentUser.permissions.inviteAdmin){
        alert("Anda tidak memiliki permission untuk invite admin!");
        return;
    }
    
    inviteAdminModal.classList.add('active');
});

// Close invite admin modal
document.getElementById('closeInviteAdmin')?.addEventListener('click', () => {
    inviteAdminModal.classList.remove('active');
    // Reset form
    document.getElementById('newAdminUsername').value = "";
    document.getElementById('inviteResult').style.display = 'none';
});

// Generate invitation
document.getElementById('btnGenerateInvite')?.addEventListener('click', async () => {
    const username = document.getElementById('newAdminUsername').value.trim();
    
    if(!username){
        alert("Username harus diisi!");
        return;
    }
    
    if(username.length < 4){
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
        const result = await createAdminInvitation(username, permissions, currentUser.id);
        
        if(result.success){
            // Show result
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
        alert("Terjadi kesalahan saat membuat invitation!");
    }
});

// Copy invitation code
document.getElementById('btnCopyCode')?.addEventListener('click', () => {
    const code = document.getElementById('resultCode').innerText;
    const username = document.getElementById('resultUsername').innerText;
    
    const text = `INVITATION ADMIN CERMATIX

Username: ${username}
Code: ${code}

Buka website, pilih Login Admin, lalu klik "Punya invitation code?" dan masukkan code di atas.`;
    
    navigator.clipboard.writeText(text);
    alert("Invitation code berhasil di-copy!");
});

// Share via WhatsApp
document.getElementById('btnShareWhatsApp')?.addEventListener('click', () => {
    const code = document.getElementById('resultCode').innerText;
    const username = document.getElementById('resultUsername').innerText;
    
    const text = encodeURIComponent(`INVITATION ADMIN CERMATIX

Username: ${username}
Code: ${code}

Buka website, pilih Login Admin, lalu klik "Punya invitation code?" dan masukkan code di atas.`);
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
});

// Manage users button
document.getElementById('btnManageUsers')?.addEventListener('click', () => {
    if(!currentUser.permissions.manageUsers){
        alert("Anda tidak memiliki permission untuk manage users!");
        return;
    }
    
    navigateTo('manage-users');
    loadManageUsers();
});

// Load manage users page
async function loadManageUsers(){
    try {
        const users = await getAllUsers();
        
        document.getElementById('userCount').innerText = users.length;
        
        let html = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        users.forEach(user => {
            const date = user.createdAt.toDate().toLocaleDateString('id-ID');
            html += `
                <tr>
                    <td>${user.username}</td>
                    <td>${date}</td>
                    <td>
                        <button class="btn-delete" onclick="deleteUserConfirm('${user.id}', '${user.username}')">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        document.getElementById('usersList').innerHTML = html;
        
    } catch(e){
        console.error("Load users error:", e);
    }
}

// Delete user confirm
window.deleteUserConfirm = function(userId, username){
    const confirm = window.confirm(`Yakin ingin menghapus user "${username}"?\n\nSemua data tes user ini juga akan terhapus!`);
    
    if(confirm){
        deleteUserAction(userId);
    }
}

// Delete user action
async function deleteUserAction(userId){
    try {
        await deleteUser(userId);
        alert("User berhasil dihapus!");
        loadManageUsers(); // Reload list
    } catch(e){
        console.error("Delete user error:", e);
        alert("Terjadi kesalahan saat menghapus user!");
    }
}

// Manage admins button
document.getElementById('btnManageAdmins')?.addEventListener('click', () => {
    navigateTo('manage-admins');
    loadManageAdmins();
});

// Load manage admins page
async function loadManageAdmins(){
    try {
        const admins = await getAllAdmins();
        
        document.getElementById('adminCount').innerText = admins.length;
        
        let html = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Status</th>
                        <th>Permissions</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        admins.forEach(admin => {
            const perms = [];
            if(admin.permissions?.manageUsers) perms.push("Manage Users");
            if(admin.permissions?.deleteTests) perms.push("Delete Tests");
            if(admin.permissions?.inviteAdmin) perms.push("Invite Admin");
            if(admin.permissions?.viewAnalytics) perms.push("View Analytics");
            
            const statusBadge = admin.status === 'active' ? 
                '<span class="badge-active">Active</span>' : 
                '<span class="badge-revoked">Revoked</span>';
            
            html += `
                <tr>
                    <td>${admin.username}</td>
                    <td>${statusBadge}</td>
                    <td class="perms-cell">${perms.join(", ")}</td>
                    <td>
                        ${admin.status === 'active' && admin.id !== currentUser.id ? 
                            `<button class="btn-revoke" onclick="revokeAdminConfirm('${admin.id}', '${admin.username}')">
                                ⛔ Revoke
                            </button>` : 
                            '-'
                        }
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        document.getElementById('adminsList').innerHTML = html;
        
    } catch(e){
        console.error("Load admins error:", e);
    }
}

// Revoke admin confirm
window.revokeAdminConfirm = function(adminId, username){
    const confirm = window.confirm(`Yakin ingin revoke admin "${username}"?\n\nAdmin ini tidak akan bisa login lagi!`);
    
    if(confirm){
        revokeAdminAction(adminId);
    }
}

// Revoke admin action
async function revokeAdminAction(adminId){
    try {
        await revokeAdminAccess(adminId);
        alert("Admin berhasil di-revoke!");
        loadManageAdmins(); // Reload list
    } catch(e){
        console.error("Revoke admin error:", e);
        alert("Terjadi kesalahan saat revoke admin!");
    }
}

// View all tests button
document.getElementById('btnViewAllTests')?.addEventListener('click', () => {
    if(!currentUser.permissions.viewAnalytics){
        alert("Anda tidak memiliki permission untuk view analytics!");
        return;
    }
    
    navigateTo('view-all-tests');
    loadAllTests();
});

// Load all tests page
async function loadAllTests(){
    try {
        const tests = await getAllTestResults();
        
        document.getElementById('testCount').innerText = tests.length;
        
        // Sort by date desc
        tests.sort((a, b) => b.waktu.seconds - a.waktu.seconds);
        
        let html = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Score</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        tests.forEach(test => {
            const date = test.waktu.toDate().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            html += `
                <tr>
                    <td>${test.nama}</td>
                    <td><strong>${test.nilai}</strong></td>
                    <td>${date}</td>
                    <td>
                        ${currentUser.permissions.deleteTests ?
                            `<button class="btn-delete" onclick="deleteTestConfirm('${test.id}', '${test.nama}')">
                                🗑️ Delete
                            </button>` :
                            '-'
                        }
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        document.getElementById('allTestsList').innerHTML = html;
        
    } catch(e){
        console.error("Load tests error:", e);
    }
}

// Delete test confirm
window.deleteTestConfirm = function(testId, username){
    const confirm = window.confirm(`Yakin ingin menghapus hasil tes dari "${username}"?`);
    
    if(confirm){
        deleteTestAction(testId);
    }
}

// Delete test action
async function deleteTestAction(testId){
    try {
        await deleteTestResult(testId);
        alert("Test result berhasil dihapus!");
        loadAllTests(); // Reload list
    } catch(e){
        console.error("Delete test error:", e);
        alert("Terjadi kesalahan saat menghapus test result!");
    }
}

// Check if logged in as admin on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if(savedUser){
        try {
            const user = JSON.parse(savedUser);
            if(user.role === 'admin'){
                // Auto redirect to admin dashboard if coming from admin login
                setTimeout(() => {
                    const currentPage = document.querySelector('.page-content.active');
                    if(currentPage && currentPage.id === 'homePage'){
                        navigateTo('admin-dashboard');
                        loadAdminDashboard();
                    }
                }, 500);
            }
        } catch(e){
            // ignore
        }
    }
});