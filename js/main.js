
import { loadFromStorage, subscribe } from './state.js';
import { logout, login, saveUser, checkPrintQuota, consumePrintQuota, getSession, PLANS } from './auth.js';
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
            showView('adminDashboard');
            renderDashboardRPC(); // Helper to render dashboard
        } else {
            showView('userDashboard');
            // Populate user name in user dashboard
            showView('userDashboard');
            // Populate user name in user dashboard
            const userDisplay = document.getElementById('currentUserDisplay');
            if (userDisplay) userDisplay.innerText = user.name;

            // Update Avatar Initials
            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const avatars = document.querySelectorAll('.user-avatar-circle, .user-avatar-large');
            avatars.forEach(el => el.innerText = initials);

            // Update Plan Pill & Card
            const planKey = user.plan || 'free';
            const planData = PLANS[planKey] || PLANS['free'];
            const limit = planData.limit;
            const used = user.printsCount || 0;
            const remaining = Math.max(0, limit - used);
            const pct = Math.min(100, (used / limit) * 100);

            const planPill = document.querySelector('.user-pill span');
            if (planPill) planPill.innerText = `👤 ${planData.label}`;

            const dName = document.getElementById('dashboardPlanName');
            if (dName) dName.innerText = planData.label;

            const dLimit = document.getElementById('dashboardPlanLimit');
            if (dLimit) dLimit.innerHTML = `Restam <b>${remaining}</b> de ${limit}`;

            const dProg = document.getElementById('dashboardPlanProgress');
            if (dProg) dProg.style.width = `${pct}%`;
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

    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
        logout();
        showView('login');
    });

    document.getElementById('appLogoutBtn')?.addEventListener('click', () => {
        logout();
        showView('login');
    });

    document.getElementById('backToDashBtn')?.addEventListener('click', () => {
        checkAuthAndRedirect();
    });

    document.getElementById('createPosterBtn')?.addEventListener('click', () => {
        showView('app');
    });

    // Menu Toggle (User Avatar Click)
    const userAvatarBtn = document.getElementById('userAvatarBtn');
    const menuDropdown = document.getElementById('menuDropdown');

    userAvatarBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown?.classList.toggle('hidden');

        // Populate user info in menu header
        const session = getSession();
        if (session) {
            const menuUserName = document.getElementById('menuUserName');
            const menuUserEmail = document.getElementById('menuUserEmail');
            const menuAvatar = document.querySelector('.menu-avatar');

            if (menuUserName) menuUserName.innerText = session.name;
            if (menuUserEmail) menuUserEmail.innerText = session.email;

            // Update menu avatar initials
            if (menuAvatar) {
                const initials = session.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                menuAvatar.innerText = initials;
            }
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (menuDropdown && !menuDropdown.classList.contains('hidden')) {
            if (!userAvatarBtn?.contains(e.target) && !menuDropdown?.contains(e.target)) {
                menuDropdown.classList.add('hidden');
            }
        }
    });

    // User Logout from Menu
    document.getElementById('userLogoutBtn')?.addEventListener('click', () => {
        logout();
        showView('login');
    });

    // Menu: Edit Profile
    document.getElementById('menuEditProfileBtn')?.addEventListener('click', () => {
        menuDropdown?.classList.add('hidden');
        alert('🎨 Funcionalidade "Editar Perfil" em desenvolvimento!\n\nEm breve você poderá:\n• Alterar nome e foto de perfil\n• Atualizar informações da loja\n• Personalizar preferências');
    });

    // Menu: Settings
    document.getElementById('menuSettingsBtn')?.addEventListener('click', () => {
        menuDropdown?.classList.add('hidden');
        alert('⚙️ Funcionalidade "Configurações" em desenvolvimento!\n\nEm breve você poderá:\n• Configurar tema (claro/escuro)\n• Ajustar preferências de impressão\n• Gerenciar notificações\n• Configurar moeda e idioma');
    });

    // Menu: Templates
    document.getElementById('menuTemplatesBtn')?.addEventListener('click', () => {
        menuDropdown?.classList.add('hidden');
        alert('📋 Funcionalidade "Meus Templates" em desenvolvimento!\n\nEm breve você poderá:\n• Salvar templates personalizados\n• Carregar templates salvos\n• Compartilhar templates\n• Importar templates da comunidade');
    });

    // Menu: Upgrade Plan
    document.getElementById('menuUpgradeBtn')?.addEventListener('click', () => {
        menuDropdown?.classList.add('hidden');
        const session = getSession();
        if (session) {
            const planKey = session.plan || 'free';
            const planData = PLANS[planKey] || PLANS['free'];
            alert(`👑 UPGRADE DE PLANO\n\nPlano Atual: ${planData.label}\nLimite: ${planData.limit} cartazes/mês\n\n📊 PLANOS DISPONÍVEIS:\n\n🆓 Gratuito - 5 cartazes/mês\n⭐ Básico - 25 cartazes/mês - R$ 19,90/mês\n👑 Pro - 100 cartazes/mês - R$ 49,90/mês\n\n💡 Funcionalidade de pagamento em breve!`);
        }
    });

    // Menu: Help & Support
    document.getElementById('menuHelpBtn')?.addEventListener('click', () => {
        menuDropdown?.classList.add('hidden');
        alert('❓ AJUDA & SUPORTE\n\n📚 Recursos disponíveis:\n• Tutoriais em vídeo\n• Documentação completa\n• FAQ - Perguntas frequentes\n• Suporte por e-mail\n\n📧 Contato: suporte@cartazista.com\n💬 WhatsApp: (11) 99999-9999\n\n🕐 Horário de atendimento:\nSeg-Sex: 9h às 18h');
    });

    // Menu: About
    document.getElementById('menuAboutBtn')?.addEventListener('click', () => {
        menuDropdown?.classList.add('hidden');
        alert('ℹ️ SOBRE O CARTAZISTA\n\n🎨 Versão: 2.0.0\n📅 Última atualização: Janeiro 2026\n\n💡 Cartazista é a solução completa para criar cartazes profissionais de ofertas para seu comércio.\n\n✨ Recursos:\n• Editor visual intuitivo\n• Múltiplos layouts\n• Exportação em PDF\n• Templates personalizáveis\n\n👨‍💻 Desenvolvido com ❤️ para pequenos e médios comerciantes\n\n© 2026 Cartazista - Todos os direitos reservados');
    });



    // Sidebar Toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', (e) => {
        const app = document.querySelector('.app-container');
        app.classList.toggle('collapsed');
        e.target.innerText = app.classList.contains('collapsed') ? '▶' : '◀';
        setTimeout(updatePreviewScale, 305);
    });

    // --- Printing & Quota ---
    const handleQuotaAction = (actionCallback) => {
        const session = getSession();
        if (!session) {
            alert('Você precisa estar logado.');
            return;
        }

        if (checkPrintQuota(session.id)) {
            consumePrintQuota(session.id);
            actionCallback();
        } else {
            alert('Limite de impressões do seu plano atingido! 🛑\n\nAtualize seu plano para continuar imprimindo.');
        }
    };

    document.getElementById('btnDownloadPdf')?.addEventListener('click', () => {
        handleQuotaAction(() => {
            // Assuming downloadPDF is global or we need to import it. 
            // It was likely defined separately. Ideally we import it.
            // For now, if it was global, window.downloadPDF works.
            if (window.downloadPDF) window.downloadPDF();
        });
    });

    document.getElementById('btnPrint')?.addEventListener('click', () => {
        handleQuotaAction(() => {
            window.print();
        });
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

// In a real app this would be its own module 'dashboard.js'
function renderDashboardRPC() {
    // 1. Render Global Stats
    import('./stats.js').then(({ getGlobalStats }) => {
        const stats = getGlobalStats();
        // Only run if elements exist (Admin View)
        const totalel = document.getElementById('statTotalPosters');
        if (totalel) totalel.innerText = stats.totalPosters || 0;
    });

    import('./auth.js').then(({ getUsers, deleteUser, updateUser, PLANS }) => {
        const users = getUsers();
        const statUsers = document.getElementById('statTotalUsers');
        if (statUsers) statUsers.innerText = users.length;

        const tbody = document.getElementById('userTableBody');
        const searchInput = document.getElementById('userSearchInput');

        if (!tbody) return;

        // Render Function
        const renderTable = (filterText = '') => {
            tbody.innerHTML = '';
            const filtered = users.filter(u =>
                u.name.toLowerCase().includes(filterText.toLowerCase()) ||
                u.email.toLowerCase().includes(filterText.toLowerCase())
            );

            filtered.forEach(u => {
                // Mapping
                const planKey = u.plan || (u.role === 'admin' ? 'pro' : 'free');
                const planLabel = PLANS[planKey]?.label || 'Gratuito';

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #333';
                tr.innerHTML = `
                    <td style="padding: 12px; color: #f0f0f0;">${u.name}</td>
                    <td style="padding: 12px; color: #ccc;">${u.email}</td>
                     <td style="padding: 12px; color: #ccc;">${planLabel}</td>
                    <td style="padding: 12px; text-align:right;">
                        <button class="edit-btn" data-id="${u.id}" style="margin-right: 10px; border:none; background:none; cursor:pointer; font-size: 1.2rem;" title="Editar">✏️</button>
                        ${u.role !== 'admin' ? `<button class="delete-btn" data-id="${u.id}" style="border:none; background:none; cursor:pointer; font-size: 1.2rem;" title="Excluir">🗑️</button>` : ''}
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Re-attach listeners
            attachActionListeners();
        };

        const attachActionListeners = () => {
            // Delete
            tbody.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Prevent multiple clicks
                    e.stopPropagation();
                    if (confirm('Tem certeza que deseja remover este usuário?')) {
                        const id = parseInt(btn.dataset.id); // Use btn.dataset directly
                        const res = deleteUser(id);
                        if (res.success) {
                            renderDashboardRPC();
                        } else {
                            alert(res.message);
                        }
                    }
                });
            });

            // Edit
            tbody.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    const userToEdit = users.find(u => u.id === id);
                    if (userToEdit) {
                        openEditModal(userToEdit);
                    }
                });
            });
        };

        // Initial Render
        renderTable();

        // Search Listener
        if (searchInput) {
            // Remove old listener to prevent duplicates (simple way: clone node or just direct assignment logic if careful)
            // For RPC style, we just re-assign.
            searchInput.onkeyup = (e) => {
                renderTable(e.target.value);
            };
        }

        // --- Edit Modal Logic ---
        const editModal = document.getElementById('editUserModal');
        const confirmEditBtn = document.getElementById('confirmEditEditBtn') || document.getElementById('confirmEditUserBtn'); // ID might be tricky check HTML

        function openEditModal(user) {
            if (!editModal) return;
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUserName').value = user.name;
            document.getElementById('editUserEmail').value = user.email;
            document.getElementById('editUserPlan').value = user.plan || 'free';
            document.getElementById('editUserPass').value = ''; // Don't show pass
            editModal.classList.remove('hidden');
        }

        // Bind Edit Modal Buttons (Only once preferably, but here inside render is okay if we use ID checks)
        // A better place is initAuthListeners, but updateUser is imported here.
        // Let's bind it here but safeguard against multiple bindings? 
        // Actually, let's move the bind to `initAuthListeners` and expose `updateUser` or keep it here and use `onclick` to avoid stack.

        const closeEditBtn = document.getElementById('cancelEditUserBtn');
        if (closeEditBtn) closeEditBtn.onclick = () => editModal.classList.add('hidden');

        if (confirmEditBtn) confirmEditBtn.onclick = () => {
            const id = parseInt(document.getElementById('editUserId').value);
            const name = document.getElementById('editUserName').value;
            const email = document.getElementById('editUserEmail').value;
            const plan = document.getElementById('editUserPlan').value;
            const pass = document.getElementById('editUserPass').value;

            const newData = { name, email, plan };
            if (pass) newData.pass = pass;

            const res = updateUser(id, newData);
            if (res.success) {
                alert('Usuário atualizado!');
                editModal.classList.add('hidden');
                renderDashboardRPC();
            } else {
                alert(res.message);
            }
        };

    });
}
