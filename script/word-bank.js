import { food } from "./categories/food.js";

export const wordPairs = [...food];

export function selectWordPair(previousWord = "") {
  const availablePairs = wordPairs.filter((pair) => pair.word !== previousWord);
  const pool = availablePairs.length > 0 ? availablePairs : wordPairs;
  return pool[Math.floor(Math.random() * pool.length)];
}
