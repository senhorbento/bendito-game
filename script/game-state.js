import {
  createRoleAssignments,
  createSecrets,
  getDefaultBenditoCount,
  DISCUSSION_DURATION_MS
} from "./game-rules.js";
import { selectWordPair } from "./word-bank.js";

export function createHomeState(players = []) {
  return { phase: "home", players };
}

export function createSetupState(players = []) {
  return { phase: "setup", players, benditoCount: players.length >= 3 ? getDefaultBenditoCount(players.length) : 0 };
}

export function createRoundState(players, benditoCount, previousWord = "") {
  const pair = selectWordPair(previousWord);
  const roles = createRoleAssignments(players.length, benditoCount);
  return {
    phase: "reveal",
    players: [...players],
    benditoCount,
    pair,
    roles,
    secrets: createSecrets(players, roles, pair),
    revealIndex: 0,
    revealShown: false,
    timerEndsAt: null,
    starterIndex: null,
    votingIndex: 0,
    votingReady: false,
    votes: [],
    previousWord,
    results: null
  };
}

export function startDiscussion(state, now = Date.now(), random = Math.random) {
  const starterIndex = Math.floor(random() * state.players.length);
  return { ...state, phase: "discussion", timerEndsAt: now + DISCUSSION_DURATION_MS, starterIndex };
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
