// State Management Module

export const state = {
    config: {
        theme: "vector",
        paper: "A4",
        orientation: "portrait",
        layout: 1,
        backgroundImage: null // New field
    },
    defaults: {
        offer: "OFERTA",
        name: "BANANA PRATA",
        category: "",
        detail: "GRAÚDA",
        price: "88,88",
        unit: ""
    },
    cards: []
};

// History Stacks
const past = [];
const future = [];

// Observer Pattern
const listeners = [];

export function subscribe(callback) {
    listeners.push(callback);
}

export function notify() {
    listeners.forEach(cb => cb(state));
    saveToStorage();
}

function cloneState() {
    return JSON.parse(JSON.stringify(state));
}

function pushHistory() {
    past.push(cloneState());
    if (past.length > 50) past.shift(); // Limit history
    future.length = 0; // Clear future on new action
}

export function undo() {
    if (past.length === 0) return;

    future.push(cloneState());
    const previous = past.pop();

    // Apply previous state
    state.config = previous.config;
    state.defaults = previous.defaults;
    state.cards = previous.cards;

    notify();
}

export function redo() {
    if (future.length === 0) return;

    past.push(cloneState());
    const next = future.pop();

    state.config = next.config;
    state.defaults = next.defaults;
    state.cards = next.cards;

    notify();
}

// Actions
export function updateConfig(key, value) {
    pushHistory();
    state.config[key] = value;
    notify();
}

export function updateDefault(key, value) {
    pushHistory();
    state.defaults[key] = value;
    state.cards = state.cards.map(card => ({
        ...card,
        [key]: value
    }));
    notify();
}

export function updateCard(index, key, value) {
    if (state.cards[index]) {
        // Optimization: Don't push history for every keystroke if called frequently.
        // Assuming this is called on blur, it's fine.
        pushHistory();
        state.cards[index][key] = value;
        notify();
    }
}

export function setCards(newCards) {
    pushHistory();
    state.cards = newCards;
    notify();
}

// Persistence
export function saveToStorage() {
    try {
        localStorage.setItem('cartazista_state', JSON.stringify(state));
    } catch (e) {
        console.warn('Storage full or error', e);
    }
}

export function loadFromStorage() {
    const stored = localStorage.getItem('cartazista_state');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            state.config = { ...state.config, ...parsed.config };
            state.defaults = { ...state.defaults, ...parsed.defaults };
            state.cards = parsed.cards || [];
            if (!state.cards.length) resizeCardsArray();
            notify();
        } catch (e) {
            console.error("Error loading state", e);
            resizeCardsArray();
        }
    } else {
        resizeCardsArray();
    }
}

export function resizeCardsArray() {
    pushHistory();
    const targetLength = state.config.layout;
    if (state.cards.length < targetLength) {
        for (let i = state.cards.length; i < targetLength; i++) {
            state.cards.push({ ...state.defaults });
        }
    } else if (state.cards.length > targetLength) {
        state.cards.length = targetLength;
    }
    notify();
}
