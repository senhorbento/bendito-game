import {
  createRoleAssignments,
  createSecrets,
  getDefaultBenditoCount,
  DISCUSSION_DURATION_MS
} from "./game-rules.js";
import { selectClue, selectWordPair } from "./word-bank.js";

export function createHomeState(players = []) {
  return { phase: "home", players };
}

export function createSetupState(players = [], categoryKey = "random", gameMode = "jj", allowBenditoAttempt = false, usedWords = [], lastStarterIndex = null) {
  return { phase: "setup", players, categoryKey, gameMode, allowBenditoAttempt, usedWords, lastStarterIndex, benditoCount: players.length >= 3 ? getDefaultBenditoCount(players.length) : 0 };
}

export function createRoundState(players, benditoCount, categoryKey = "random", usedWords = [], gameMode = "jj", allowBenditoAttempt = false, lastStarterIndex = null) {
  const pair = selectWordPair(categoryKey, usedWords);
  const roundPair = { ...pair, clue: selectClue(pair) };
  const nextUsedWords = [...usedWords, pair.word];
  const roles = createRoleAssignments(players.length, benditoCount);
  return {
    phase: "reveal",
    players: [...players],
    benditoCount,
    categoryKey: roundPair.categoryKey,
    categoryLabel: roundPair.categoryLabel,
    pair: roundPair,
    usedWords: nextUsedWords,
    gameMode,
    allowBenditoAttempt,
    roles,
    secrets: createSecrets(players, roles, roundPair),
    revealIndex: 0,
    revealShown: false,
    timerEndsAt: null,
    starterIndex: null,
    votingIndex: 0,
    votingReady: false,
    votes: [],
    previousWord: pair.word,
    lastStarterIndex,
    wordAttempts: [],
    results: null
  };
}

export function startDiscussion(state, now = Date.now(), random = Math.random) {
  const available = state.players.map((_, index) => index).filter((index) => index !== state.lastStarterIndex);
  const starterIndex = available[Math.floor(random() * available.length)];
  return { ...state, phase: "discussion", timerEndsAt: now + DISCUSSION_DURATION_MS, starterIndex, lastStarterIndex: starterIndex };
}

export function startVoting(state) {
  return { ...state, phase: "voting", votingIndex: 0, votingReady: false };
}

export function beginVotingStep(state) {
  return { ...state, votingReady: true };
}

export function completeRound(state) {
  return { ...state, phase: "results" };
}
