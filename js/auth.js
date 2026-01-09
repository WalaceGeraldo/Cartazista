
// Authentication Module

const DEFAULT_ADMIN = {
    id: 1,
    name: 'Administrador',
    email: 'admin@admin.com',
    pass: 'admin',
    role: 'admin',
    plan: 'pro',
    printsCount: 0
};

export const PLANS = {
    free: { label: 'Gratuito', limit: 5 },
    basic: { label: 'Básico', limit: 25 },
    pro: { label: 'Pro', limit: 100 }
};

export function getUsers() {
    const stored = localStorage.getItem('cartazista_users');
    if (!stored) {
        const initial = [DEFAULT_ADMIN];
        localStorage.setItem('cartazista_users', JSON.stringify(initial));
        return initial;
    }
    return JSON.parse(stored);
}

export function saveUser(name, email, pass) {
    const users = getUsers();
    if (!name || !email || !pass) return { success: false, message: 'Preencha todos os campos.' };
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'E-mail já cadastrado.' };
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        pass: pass,
        role: 'user',
        plan: 'free',
        printsCount: 0
    };

    users.push(newUser);
    localStorage.setItem('cartazista_users', JSON.stringify(users));
    return { success: true };
}

export function deleteUser(id) {
    let users = getUsers();
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete && userToDelete.email === 'admin@admin.com') {
        return { success: false, message: 'Não é possível remover o super-admin!' };
    }

    users = users.filter(u => u.id !== id);
    localStorage.setItem('cartazista_users', JSON.stringify(users));
    return { success: true };
}

export function updateUser(id, newData) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return { success: false, message: 'Usuário não encontrado.' };

    // Prevent duplicate email if changing email
    if (newData.email && newData.email !== users[index].email) {
        if (users.find(u => u.email === newData.email)) {
            return { success: false, message: 'E-mail já está em uso.' };
        }
    }

    users[index] = { ...users[index], ...newData };
    localStorage.setItem('cartazista_users', JSON.stringify(users));
    return { success: true };
}

export function checkPrintQuota(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has invalid

    const plan = PLANS[user.plan || 'free'];
    // Allow if count is less than limit
    return (user.printsCount || 0) < plan.limit;
}

export function consumePrintQuota(userId) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return false;

    const user = users[index];
    if (user.role !== 'admin') {
        user.printsCount = (user.printsCount || 0) + 1;
        users[index] = user;
        localStorage.setItem('cartazista_users', JSON.stringify(users));

        // Update session if it's the current user
        const session = getSession();
        if (session && session.id === userId) {
            session.printsCount = user.printsCount;
            localStorage.setItem('cartazista_session', JSON.stringify(session));
        }
    }
    return true;
}

export function login(email, password) {
    const users = getUsers();
    const foundUser = users.find(u => u.email === email && u.pass === password);

    if (foundUser) {
        localStorage.setItem('cartazista_session', JSON.stringify(foundUser));
        return { success: true, user: foundUser };
    } else {
        return { success: false, message: 'Credenciais inválidas.' };
    }
}

export function logout() {
    localStorage.removeItem('cartazista_session');
}

export function getSession() {
    const session = localStorage.getItem('cartazista_session');
    return session ? JSON.parse(session) : null;
}
