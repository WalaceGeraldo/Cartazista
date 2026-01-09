
// Statistics Module
// Tracks global system usage

const STATS_KEY = 'cartazista_global_stats';

function getStats() {
    const stored = localStorage.getItem(STATS_KEY);
    return stored ? JSON.parse(stored) : {
        totalPosters: 0
    };
}

function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function incrementGlobalPosterCount() {
    const stats = getStats();
    stats.totalPosters = (stats.totalPosters || 0) + 1;
    saveStats(stats);
    return stats.totalPosters;
}

export function getGlobalStats() {
    return getStats();
}
