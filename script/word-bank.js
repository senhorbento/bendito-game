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

const additionalClues = {
  Cachorro: ["Latido", "Canino"], Gato: ["Miau", "Felino"], Girafa: ["Pescoço", "Manchas"], Elefante: ["Grande", "Manada"], Leão: ["Selva", "Rugido"], Tigre: ["Listras", "Rugido"], Zebra: ["Listras", "Manada"], Macaco: ["Banana", "Primata"], Coelho: ["Cenoura", "Orelhas"], Cavalo: ["Galope", "Crina"], Vaca: ["Pasto", "Rebanho"], Porco: ["Lama", "Grunhido"], Ovelha: ["Lã", "Rebanho"], Cabra: ["Chifres", "Montanha"], Galinha: ["Ovos", "Penas"], Galo: ["Canto", "Crista"], Pato: ["Penas", "Quáquá"], Ganso: ["Penas", "Bando"], Peru: ["Ave", "Penas"], Pinguim: ["Gelo", "Antártida"], Urso: ["Mel", "Hibernação"], Panda: ["Bambu", "China"], Lobo: ["Uivo", "Floresta"], Raposa: ["Astúcia", "Cauda"], Onça: ["Pintada", "Amazônia"], Guepardo: ["Velocidade", "Manchas"], Hipopótamo: ["Grande", "África"], Rinoceronte: ["Chifre", "África"], Hiena: ["Riso", "Alcateia"], Canguru: ["Bolsa", "Austrália"], Coala: ["Eucalipto", "Austrália"], Preguiça: ["Lentidão", "Garras"], Morcego: ["Noite", "Asas"], Esquilo: ["Nozes", "Cauda"], Ouriço: ["Espinhos", "Bola"], Lontra: ["Rio", "Bigodes"], Foca: ["Gelo", "Bigodes"], Baleia: ["Oceano", "Sopro"], Golfinho: ["Oceano", "Inteligência"], Tubarão: ["Oceano", "Predador"], Polvo: ["Tentáculos", "Tinta"], Caranguejo: ["Pinças", "Praia"], Tartaruga: ["Casco", "Ovos"], Crocodilo: ["Pântano", "Répteis"], Iguana: ["Réptil", "Cauda"], Cobra: ["Veneno", "Rastejo"], Sapo: ["Salto", "Anfíbio"], Águia: ["Garras", "Predador"], Coruja: ["Olhos", "Voo"], Arara: ["Amazônia", "Bico"]
};

function normalizePair(pair) {
  if (Array.isArray(pair)) {
    const [word, clue] = pair;
    return { word, clues: [clue, ...(additionalClues[word] || ["Pista", "Sinal"])] };
  }
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
