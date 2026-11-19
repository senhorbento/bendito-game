const STORAGE_KEY = "bendito-game-state-v1";

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState() {
  try {
    const rawState = localStorage.getItem(STORAGE_KEY);
    if (!rawState) return null;
    const state = JSON.parse(rawState);
    if (!state || typeof state !== "object" || !Array.isArray(state.players)) return null;
    return state;
  } catch {
    return null;
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
