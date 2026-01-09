
import { loadFromStorage, subscribe } from './state.js';
import { logout, login, saveUser } from './auth.js';
import { initEditor } from './editor.js';
import { initMobileScale, updatePreviewScale } from './mobile-scale.js';

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    initMobileScale();
    initEditor(); // Sets up editor listeners
    initAuthListeners();


    checkAuthAndRedirect();
});

// View Management
function showView(viewName) {
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));

    const view = document.getElementById(`${viewName}View`);
    if (view) {
        view.classList.remove('hidden');
        if (viewName === 'app') {
            updatePreviewScale();
        }
    }
}

function checkAuthAndRedirect() {
    // For now, simpler auth: check if session exists
    const session = localStorage.getItem('cartazista_session');
    if (session) {
        // If admin, maybe go to dashboard, else app
        // For this refactor, let's default to App for smoother UX unless specifically requested Dashboard
        // But original app had "Login -> Dashboard -> App".
        // Let's keep it: Login -> Dashboard (if admin) or App (if user)
        const user = JSON.parse(session);
        if (user.role === 'admin') {
            showView('dashboard');
            renderDashboardRPC(); // Helper to render dashboard
        } else {
            showView('app');
        }
    } else {
        showView('login');
    }
}

function initAuthListeners() {
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        const email = document.getElementById('emailInput').value;
        const pass = document.getElementById('passwordInput').value;
        const res = login(email, pass);
        if (res.success) {
            checkAuthAndRedirect();
        } else {
            alert(res.message);
        }
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        logout();
        showView('login');
    });

    document.getElementById('appLogoutBtn')?.addEventListener('click', () => {
        logout();
        showView('login');
    });

    document.getElementById('backToDashBtn')?.addEventListener('click', () => {
        showView('dashboard');
        renderDashboardRPC();
    });

    document.getElementById('createPosterBtn')?.addEventListener('click', () => {
        showView('app');
    });

    // Sidebar Toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', (e) => {
        const app = document.querySelector('.app-container');
        app.classList.toggle('collapsed');
        e.target.innerText = app.classList.contains('collapsed') ? '▶' : '◀';
        setTimeout(updatePreviewScale, 305);
    });

    // --- User Management ---
    const addUserModal = document.getElementById('addUserModal');

    document.getElementById('showAddUserBtn')?.addEventListener('click', () => {
        if (addUserModal) addUserModal.classList.remove('hidden');
    });

    document.getElementById('cancelAddUserBtn')?.addEventListener('click', () => {
        if (addUserModal) addUserModal.classList.add('hidden');
    });

    document.getElementById('confirmAddUserBtn')?.addEventListener('click', () => {
        const name = document.getElementById('newUserName').value;
        const email = document.getElementById('newUserEmail').value;
        const pass = document.getElementById('newUserPass').value;

        const res = saveUser(name, email, pass);
        if (res.success) {
            alert('Usuário criado com sucesso!');
            if (addUserModal) addUserModal.classList.add('hidden');
            // Clear inputs
            document.getElementById('newUserName').value = '';
            document.getElementById('newUserEmail').value = '';
            document.getElementById('newUserPass').value = '';
            // Refresh list
            renderDashboardRPC();
        } else {
            alert(res.message);
        }
    });
}

// Simple Dashboard Renderer (Migrated from script.js)
// In a real app this would be its own module 'dashboard.js'
function renderDashboardRPC() {
    const userDisplay = document.getElementById('currentUserDisplay');
    const session = JSON.parse(localStorage.getItem('cartazista_session') || '{}');
    if (userDisplay) userDisplay.innerText = session.name || 'Admin';

    // Stats and User Table...
    // For now, just ensuring navigation works. 
    // If user wants full dashboard features preserved, we should port 'renderDashboard' fully.
    // I'll leave it as a placeholder for now or copy the basic logic if requested.
    // Given scope "do all", I should probably implement it properly.

    import('./auth.js').then(({ getUsers, deleteUser }) => {
        const users = getUsers();
        document.getElementById('statsUserCount').innerText = users.length;

        const tbody = document.getElementById('userTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td style="text-align:right">
                    ${u.role !== 'admin' ? `<button class="text-btn-danger delete-btn" data-id="${u.id}" title="Excluir">🗑️</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Attach Delete Listeners
        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Tem certeza que deseja remover este usuário?')) {
                    const id = parseInt(e.target.dataset.id);
                    const res = deleteUser(id);
                    if (res.success) {
                        renderDashboardRPC(); // Refresh
                    } else {
                        alert(res.message);
                    }
                }
            });
        });
    });
}
