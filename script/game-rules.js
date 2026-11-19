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
  return Math.max(1, playerCount - 2);
}

export function getBenditoBounds(playerCount) {
  if (playerCount < MIN_PLAYERS) return { min: 0, max: 0 };
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

export function canVote(voterIndex, targetIndex, roles, votes) {
  return roles[voterIndex] === "regular"
    && voterIndex !== targetIndex
    && targetIndex >= 0
    && targetIndex < roles.length
    && votes[voterIndex] === undefined;
}

export function evaluateVotes(votes, roles) {
  return votes.map((targetIndex, voterIndex) => ({
    voterIndex,
    targetIndex,
    correct: targetIndex !== undefined && roles[targetIndex] === "bendito"
  }));
}

export function getRemainingTime(endsAt, now = Date.now()) {
  return Math.max(0, endsAt - now);
}
