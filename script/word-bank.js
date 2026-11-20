import { animals } from "./categories/animals.js";
import { food } from "./categories/food.js";
import { movies } from "./categories/movies.js";
import { objects } from "./categories/objects.js";
import { places } from "./categories/places.js";
import { sports } from "./categories/sports.js";

export const categories = {
  food: { label: "Comidas", pairs: food },
  animals: { label: "Animais", pairs: animals },
  places: { label: "Lugares", pairs: places },
  sports: { label: "Esportes", pairs: sports },
  movies: { label: "Filmes e cinema", pairs: movies },
  objects: { label: "Objetos", pairs: objects }
};

export const allPairs = Object.entries(categories).flatMap(([key, category]) => category.pairs.map((pair) => ({ ...pair, categoryKey: key, categoryLabel: category.label })));

export function getWordPool(categoryKey = "random") {
  return categoryKey === "random" ? allPairs : (categories[categoryKey]?.pairs || []).map((pair) => ({ ...pair, categoryKey, categoryLabel: categories[categoryKey].label }));
}

export function selectWordPair(categoryKey = "random", usedWords = [], random = Math.random) {
  const pool = getWordPool(categoryKey);
  const availablePairs = pool.filter((pair) => !usedWords.includes(pair.word));
  const candidates = availablePairs.length > 0 ? availablePairs : pool;
  return candidates[Math.floor(random() * candidates.length)];
}
