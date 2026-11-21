import { animals } from "./categories/animals.js";
import { food } from "./categories/food.js";
import { movies } from "./categories/movies.js";
import { music } from "./categories/music.js";
import { objects } from "./categories/objects.js";
import { places } from "./categories/places.js";
import { professions } from "./categories/professions.js";
import { rioDeJaneiro } from "./categories/rio-de-janeiro.js";
import { sports } from "./categories/sports.js";
import { technology } from "./categories/technology.js";

function normalizePair(pair) {
  return { ...pair, clues: [...pair.clues] };
}

export const categories = {
  food: { label: "Comidas", pairs: food.map(normalizePair) },
  animals: { label: "Animais", pairs: animals.map(normalizePair) },
  places: { label: "Lugares", pairs: places.map(normalizePair) },
  sports: { label: "Esportes", pairs: sports.map(normalizePair) },
  movies: { label: "Filmes e cinema", pairs: movies.map(normalizePair) },
  objects: { label: "Objetos", pairs: objects.map(normalizePair) },
  music: { label: "Música", pairs: music.map(normalizePair) },
  professions: { label: "Profissões", pairs: professions.map(normalizePair) },
  rioDeJaneiro: { label: "Rio de Janeiro", pairs: rioDeJaneiro.map(normalizePair) },
  technology: { label: "Tecnologia", pairs: technology.map(normalizePair) }
};

export const allPairs = Object.entries(categories).flatMap(([key, category]) => category.pairs.map((pair) => ({ ...pair, categoryKey: key, categoryLabel: category.label })));

export function getWordPool(categoryKey = "random") {
  return categoryKey === "random" ? allPairs : (categories[categoryKey]?.pairs || []).map((pair) => ({ ...pair, categoryKey, categoryLabel: categories[categoryKey].label }));
}

export function selectClue(pair, random = Math.random) {
  return pair.clues[Math.floor(random() * pair.clues.length)];
}

export function selectWordPair(categoryKey = "random", usedWords = [], random = Math.random) {
  const pool = getWordPool(categoryKey);
  const availablePairs = pool.filter((pair) => !usedWords.includes(pair.word));
  const candidates = availablePairs.length > 0 ? availablePairs : pool;
  return candidates[Math.floor(random() * candidates.length)];
}
