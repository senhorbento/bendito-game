import { normalizeTargetIndexes } from "./game-rules.js";

export function getEligibleTargets(players, voterIndex) {
  return players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => index !== voterIndex);
}

export function getWordAttemptOptions(mainWord, wordPool, random = Math.random) {
  return [
    mainWord,
    ...wordPool
      .filter(({ word }) => word !== mainWord)
      .sort(() => random() - 0.5)
      .slice(0, 5)
      .map(({ word }) => word)
  ];
}

export function hasRequiredTargets(targetIndexes, targetLimit) {
  return normalizeTargetIndexes(targetIndexes).length === targetLimit;
}

export function toggleTarget(targetIndexes, targetIndex, targetLimit) {
  const selected = normalizeTargetIndexes(targetIndexes);
  if (selected.includes(targetIndex)) return selected.filter((target) => target !== targetIndex);
  return selected.length < targetLimit ? [...selected, targetIndex] : selected;
}
