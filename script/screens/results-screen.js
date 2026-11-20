import { appendVersionFooter, createButton, createElement } from "./screen-helpers.js";

export function renderResultsScreen({ app, state, version, wordPoolLength, onReplay, onPlayers }) {
  const screen = createElement("section", "screen results-screen");
  const results = (state.results || []).filter((result) => result.targetIndex !== undefined);
  const correctResults = results.filter((result) => result.correct);
  const incorrectResults = results.filter((result) => !result.correct);
  const malandroNames = (state.results || []).filter((result) => result.malandro).map((result) => state.players[result.voterIndex]);
  const benditoNames = state.players.filter((_, index) => state.roles[index] === "bendito");
  screen.append(createElement("span", "eyebrow", "Revelação final"));
  screen.append(createElement("span", "word-counter", `${state.usedWords.length} / ${wordPoolLength} palavras usadas`));
  screen.append(createElement("h1", "", "Quem era o BENDITO?"));
  const wordReveal = createElement("div", "results-word-reveal");
  wordReveal.append(createElement("span", "results-word-label", "Palavra"));
  wordReveal.append(createElement("strong", "results-word", state.pair.word));
  wordReveal.append(createElement("span", "results-word-label", "Dica"));
  wordReveal.append(createElement("strong", "results-clue", state.pair.clue));
  screen.append(wordReveal);
  screen.append(createMalandroFigure(benditoNames, malandroNames));
  const sidePanels = createElement("div", "results-side-panels");
  sidePanels.append(createResultsPanel("results-correct", "Tirou onda", "police", correctResults.map((result) => state.players[result.voterIndex])));
  sidePanels.append(createResultsPanel("results-incorrect", "Deu mole", "otario", incorrectResults.map((result) => state.players[result.voterIndex])));
  screen.append(sidePanels);
  const actions = createElement("div", "actions");
  actions.append(createButton("Vamo de novo", "button", onReplay));
  actions.append(createButton("Chegou mais gente", "button secondary", onPlayers));
  screen.append(actions);
  app.append(screen);
  appendVersionFooter(screen, version);
}

function createResultsPanel(className, title, characterType, names) {
  const panel = createElement("section", `results-side-panel ${className}`);
  panel.append(createCharacter(characterType), createElement("h2", "results-panel-title", title));
  const list = createElement("div", "results-names");
  if (names.length === 0) list.append(createElement("span", "results-empty", "Ninguém desta vez"));
  names.forEach((name) => list.append(createElement("span", "result-name", name)));
  panel.append(list);
  return panel;
}

function createCharacter(type) {
  const character = createElement("div", `results-character character-${type}`);
  character.setAttribute("aria-hidden", "true");
  const sprite = document.createElement("img");
  sprite.src = `./assets/sprites/${type}.png`;
  sprite.alt = "";
  sprite.draggable = false;
  character.append(sprite);
  return character;
}

function createMalandroFigure(names, malandroNames) {
  const figure = createElement("section", "results-malandro");
  figure.append(createCharacter("malandro"), createElement("span", "results-role", "BENDITO"), createElement("strong", "results-bendito-name", names.join(" + ")));
  if (malandroNames.length) figure.append(createElement("span", "result-highlight result-highlight-saved", "BENDITO MALANDRO DEMAIS, SE SALVOU"));
  return figure;
}
