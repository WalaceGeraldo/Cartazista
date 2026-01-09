
// Authentication Module

const DEFAULT_ADMIN = {
    id: 1,
    name: 'Administrador',
    email: 'admin@admin.com',
    pass: 'admin',
    role: 'admin'
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
        role: 'user'
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
