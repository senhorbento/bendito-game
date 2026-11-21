const STORAGE_KEY = "bendito-game-state-v1";
export const STATE_SCHEMA_VERSION = 2;

function normalizeState(state) {
  if (!state || typeof state !== "object" || !Array.isArray(state.players)) return null;
  return {
    ...state,
    schemaVersion: STATE_SCHEMA_VERSION,
    votes: Array.isArray(state.votes) ? state.votes.map((vote) => vote === undefined ? undefined : Array.isArray(vote) ? [...vote] : [vote]) : [],
    wordAttempts: Array.isArray(state.wordAttempts) ? [...state.wordAttempts] : [],
    usedWords: Array.isArray(state.usedWords) ? [...state.usedWords] : [],
    players: [...state.players]
  };
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, schemaVersion: STATE_SCHEMA_VERSION }));
}

export function loadState() {
  try {
    const rawState = localStorage.getItem(STORAGE_KEY);
    if (!rawState) return null;
    return normalizeState(JSON.parse(rawState));
  } catch {
    return null;
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
