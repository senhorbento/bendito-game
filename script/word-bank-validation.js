export function normalizeWord(value) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLocaleLowerCase();
}

export function validateWordBank(categories, expectedCategoryCount = 10) {
  const categoryEntries = Object.entries(categories);
  if (categoryEntries.length !== expectedCategoryCount) return false;
  return categoryEntries.every(([key, category]) => /^[a-z][A-Za-z0-9]*$/.test(key)
    && Array.isArray(category.pairs)
    && category.pairs.length >= 50
    && category.pairs.length <= 100
    && new Set(category.pairs.map(({ word }) => normalizeWord(word))).size === category.pairs.length
    && category.pairs.every(({ word, clues }) => {
      const normalizedWord = normalizeWord(word);
      return typeof word === "string"
        && Array.isArray(clues)
        && clues.length === 3
        && new Set(clues.map(normalizeWord)).size === 3
        && clues.every((clue) => typeof clue === "string" && /^\S+(?:\s+\S+)?$/.test(clue.trim()) && normalizeWord(clue) !== normalizedWord);
    }));
}
