export const MIN_PLAYERS = 3;
export const MAX_NAME_LENGTH = 20;
export const DISCUSSION_DURATION_MS = 2 * 60 * 1000;

export function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateName(value, existingNames = []) {
  const name = normalizeName(value);
  if (!name) return "Digite um nome.";
  if (name.length > MAX_NAME_LENGTH) return `Use no máximo ${MAX_NAME_LENGTH} caracteres.`;
  if (existingNames.some((existingName) => existingName.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    return "Esse nome já foi adicionado.";
  }
  return "";
}

export function getDefaultBenditoCount(playerCount) {
  return playerCount >= MIN_PLAYERS ? 1 : 0;
}

export function getBenditoBounds(playerCount) {
  if (playerCount < MIN_PLAYERS) return { min: 0, max: 0 };
  if (playerCount === 3) return { min: 1, max: 1 };
  return { min: 1, max: playerCount - 1 };
}

export function isValidBenditoCount(playerCount, benditoCount) {
  const bounds = getBenditoBounds(playerCount);
  return benditoCount >= bounds.min && benditoCount <= bounds.max;
}

export function createRoleAssignments(playerCount, benditoCount, random = Math.random) {
  if (!isValidBenditoCount(playerCount, benditoCount)) throw new Error("Invalid Bendito count");
  const indexes = Array.from({ length: playerCount }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }
  const benditoIndexes = new Set(indexes.slice(0, benditoCount));
  return Array.from({ length: playerCount }, (_, index) => benditoIndexes.has(index) ? "bendito" : "regular");
}

export function createSecrets(players, roles, pair) {
  return players.map((player, index) => ({
    player,
    secret: roles[index] === "bendito" ? pair.clue : pair.word
  }));
}

export function normalizeTargetIndexes(targetIndexes) {
  if (targetIndexes === undefined) return [];
  return Array.isArray(targetIndexes) ? [...targetIndexes] : [targetIndexes];
}

export function canVote(voterIndex, targetIndexes, roles, votes, allowBenditoAttempt = false) {
  const targets = normalizeTargetIndexes(targetIndexes);
  return (roles[voterIndex] === "regular" || allowBenditoAttempt)
    && targets.length > 0
    && new Set(targets).size === targets.length
    && targets.every((target) => voterIndex !== target && target >= 0 && target < roles.length)
    && votes[voterIndex] === undefined;
}

export function canAttemptWord(voterIndex, roles, wordAttempt) {
  return roles[voterIndex] === "bendito" && wordAttempt === undefined;
}

export function evaluateVotes(votes, roles, benditoCount = roles.filter((role) => role === "bendito").length, wordAttempts = [], mainWord = "") {
  return roles.map((role, voterIndex) => {
    const targetIndexes = normalizeTargetIndexes(votes[voterIndex]);
    const wordAttempt = wordAttempts[voterIndex];
    return {
      voterIndex,
      targetIndexes,
      wordAttempt,
      correct: targetIndexes.length === benditoCount && targetIndexes.every((target) => roles[target] === "bendito"),
      malandro: role === "bendito" && wordAttempt === mainWord
    };
  });
}

export function getRemainingTime(endsAt, now = Date.now()) {
  return Math.max(0, endsAt - now);
}
