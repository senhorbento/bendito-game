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

export function selectCategory(categoryKey = "random") {
  const keys = Object.keys(categories);
  const selectedKey = categoryKey === "random" ? keys[Math.floor(Math.random() * keys.length)] : categoryKey;
  return { key: selectedKey, ...categories[selectedKey] };
}

export function selectWordPair(categoryKey = "random", previousWord = "") {
  const category = selectCategory(categoryKey);
  const availablePairs = category.pairs.filter((pair) => pair.word !== previousWord);
  const pool = availablePairs.length > 0 ? availablePairs : category.pairs;
  return { category, pair: pool[Math.floor(Math.random() * pool.length)] };
}
