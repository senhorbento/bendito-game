import { categories } from "./word-bank.js";
import {
  canVote,
  evaluateVotes,
  getBenditoBounds,
  getDefaultBenditoCount,
  getRemainingTime,
  validateName
} from "./game-rules.js";
import { beginVotingStep, createHomeState, createRoundState, createSetupState, completeRound, startDiscussion, startVoting } from "./game-state.js";
import { clearState, loadState, saveState } from "./persistence.js";
import { formatRemainingTime, startTimer } from "./timer.js";

const app = document.querySelector("#app");
let state = loadState();
let timerCleanup = null;
let setupPlayers = Array.isArray(state?.players) ? [...state.players] : [];

if (!isRecoverableState(state)) {
  state = createHomeState(setupPlayers);
}
render();

function isRecoverableState(candidate) {
  if (!candidate || typeof candidate !== "object") return false;
  if (!["home", "setup", "reveal", "discussion", "voting", "results"].includes(candidate.phase)) return false;
  if (!Array.isArray(candidate.players)) return false;
  if (candidate.phase === "home") return true;
  if (candidate.phase === "setup") return true;
  return Array.isArray(candidate.roles)
    && candidate.roles.length === candidate.players.length
    && Array.isArray(candidate.secrets)
    && candidate.secrets.length === candidate.players.length
    && candidate.pair
    && typeof candidate.pair.word === "string"
    && typeof candidate.pair.clue === "string"
    && (candidate.phase === "setup" || typeof candidate.categoryKey === "string")
    && (candidate.phase !== "discussion" || Number.isInteger(candidate.starterIndex))
    && (candidate.phase !== "voting" || typeof candidate.votingReady === "boolean");
}

function updateState(nextState) {
  state = nextState;
  saveState(state);
  render();
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createButton(text, className = "button", handler, disabled = false) {
  const button = createElement("button", className, text);
  button.type = "button";
  button.disabled = disabled;
  if (handler) button.addEventListener("click", handler);
  return button;
}

function render() {
  if (timerCleanup) {
    timerCleanup();
    timerCleanup = null;
  }
  app.replaceChildren();
  if (state.phase === "home") renderHomeScreen();
  else if (state.phase === "setup") renderSetup();
  else if (state.phase === "reveal") renderReveal();
  else if (state.phase === "discussion") renderDiscussion();
  else if (state.phase === "voting") renderVoting();
  else renderResults();
}

function renderHomeScreen() {
  const screen = createElement("section", "screen centered home-screen");
  const logo = document.createElement("img");
  logo.className = "brand-art";
  logo.src = "./assets/bendito-logo.png";
  logo.alt = "Bendito";
  screen.append(logo);
  const characterBanner = document.createElement("img");
  characterBanner.className = "home-character-banner";
  characterBanner.src = "./assets/sprites/banner.png";
  characterBanner.alt = "Policial, Bendito e participante confuso em pixel art";
  screen.append(characterBanner);
  screen.append(createElement("p", "home-how-to-play", "A galera recebe uma palavra secreta.\nO Bendito recebe só uma pista.\nTroca ideia, vota e vê quem tava no sapatinho."));
  screen.append(createButton("Jogar", "button", () => {
    state = createSetupState(setupPlayers);
    saveState(state);
    render();
  }));
  app.append(screen);
}

function renderSetup() {
  const screen = createElement("section", "screen");
  screen.append(createElement("span", "eyebrow", "Nova rodada"));
  screen.append(createElement("h1", "", "Quem está no bonde?"));
  screen.append(createElement("p", "muted", "Monte a turma e prepare o celular para circular."));

  const addForm = createElement("form", "row");
  const input = createElement("input", "input");
  input.type = "text";
  input.maxLength = 20;
  input.placeholder = "Nome do participante";
  input.setAttribute("aria-label", "Nome do participante");
  const error = createElement("p", "error");
  const addButton = createButton("+", "button secondary add-player-button");
  addButton.type = "submit";
  addButton.setAttribute("aria-label", "Adicionar participante");
  addForm.append(input, addButton);
  addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = validateName(input.value, setupPlayers);
    if (message) {
      error.textContent = message;
      return;
    }
    setupPlayers = [...setupPlayers, input.value.trim().replace(/\s+/g, " ")];
    state = createSetupState(setupPlayers);
    saveState(state);
    appendSetupPlayer(screen, setupPlayers.length - 1);
    input.value = "";
    input.focus();
    refreshSetupControls(screen);
  });
  screen.append(addForm, error);

  const list = createElement("div", "player-list");
  list.id = "setup-player-list";
  let draggedIndex = null;
  setupPlayers.forEach((_, index) => appendSetupPlayer(screen, index, list, () => draggedIndex));
  screen.append(list);

  const countField = createElement("div", "field");
  const countLabel = createElement("label", "", "Quantidade de Benditos");
  const countControl = createElement("div", "number-control");
  const bounds = getBenditoBounds(setupPlayers.length);
  const currentCount = Math.min(Math.max(Number(state.benditoCount) || getDefaultBenditoCount(setupPlayers.length), bounds.min), bounds.max);
  const countValue = createElement("output", "count-value", bounds.max > 0 ? String(currentCount) : "—");
  countValue.id = "setup-count-value";
  countValue.setAttribute("aria-live", "polite");
  const decrementButton = createButton("−", "icon-button", () => updateBenditoCount(currentCount - 1), bounds.max === 0 || currentCount <= bounds.min);
  decrementButton.setAttribute("aria-label", "Diminuir quantidade de Benditos");
  const incrementButton = createButton("+", "icon-button", () => updateBenditoCount(currentCount + 1), bounds.max === 0 || currentCount >= bounds.max);
  incrementButton.setAttribute("aria-label", "Aumentar quantidade de Benditos");
  countControl.append(decrementButton, countValue, incrementButton);
  countField.append(countLabel, countControl);
  screen.append(countField);

  const categoryField = createElement("div", "field");
  const categoryLabel = createElement("label", "", "Categoria");
  const categorySelect = createElement("select", "select");
  categorySelect.setAttribute("aria-label", "Categoria da rodada");
  const randomOption = createElement("option", "", "Aleatória");
  randomOption.value = "random";
  categorySelect.append(randomOption);
  Object.entries(categories).forEach(([key, category]) => {
    const option = createElement("option", "", category.label);
    option.value = key;
    option.selected = (state.categoryKey || "random") === key;
    categorySelect.append(option);
  });
  categorySelect.value = state.categoryKey || "random";
  categorySelect.addEventListener("change", () => {
    state = { ...state, categoryKey: categorySelect.value };
    saveState(state);
  });
  categoryField.append(categoryLabel, categorySelect);
  screen.append(categoryField);

  const actions = createElement("div", "actions");
  const startButton = createButton("Iniciar", "button", () => {
    const nextState = createRoundState(setupPlayers, state.benditoCount, state.categoryKey || "random");
    updateState(nextState);
  }, setupPlayers.length < 3);
  startButton.id = "setup-start-button";
  actions.append(startButton);
  screen.append(actions);
  app.replaceChildren(screen);
}

function appendSetupPlayer(screen, index, list = screen.querySelector("#setup-player-list"), getDraggedIndex = () => null) {
  const player = setupPlayers[index];
  const item = createElement("div", "player-item");
  item.draggable = true;
  item.dataset.index = index;
  item.append(createElement("span", "drag-handle", `☷ ${player}`));
  item.append(createButton("×", "icon-button", () => removePlayer(index), false));
  item.addEventListener("dragstart", () => { item.classList.add("dragging"); });
  item.addEventListener("dragend", () => { item.classList.remove("dragging"); });
  item.addEventListener("dragover", (event) => event.preventDefault());
  item.addEventListener("drop", (event) => {
    event.preventDefault();
    const draggedItem = list.querySelector(".dragging");
    const draggedIndex = draggedItem ? Number(draggedItem.dataset.index) : getDraggedIndex();
    if (Number.isInteger(draggedIndex) && draggedIndex !== index) reorderPlayer(draggedIndex, index);
  });
  list.append(item);
}

function refreshSetupControls(screen) {
  const bounds = getBenditoBounds(setupPlayers.length);
  const count = Math.min(Math.max(Number(state.benditoCount) || getDefaultBenditoCount(setupPlayers.length), bounds.min), bounds.max);
  const countValue = screen.querySelector("#setup-count-value");
  const startButton = screen.querySelector("#setup-start-button");
  if (countValue) countValue.textContent = bounds.max > 0 ? String(count) : "—";
  if (startButton) startButton.disabled = setupPlayers.length < 3;
}

function reorderPlayer(from, to) {
  if (to < 0 || to >= setupPlayers.length) return;
  const nextPlayers = [...setupPlayers];
  [nextPlayers[from], nextPlayers[to]] = [nextPlayers[to], nextPlayers[from]];
  setupPlayers = nextPlayers;
  state = { ...createSetupState(setupPlayers), benditoCount: Math.min(Math.max(state.benditoCount || 0, getBenditoBounds(setupPlayers.length).min), getBenditoBounds(setupPlayers.length).max) };
  saveState(state);
  render();
}

function updateBenditoCount(count) {
  const bounds = getBenditoBounds(setupPlayers.length);
  if (count < bounds.min || count > bounds.max) return;
  state = { ...createSetupState(setupPlayers), benditoCount: count };
  saveState(state);
  render();
}

function removePlayer(index) {
  setupPlayers = setupPlayers.filter((_, playerIndex) => playerIndex !== index);
  const bounds = getBenditoBounds(setupPlayers.length);
  const benditoCount = bounds.max > 0 ? Math.min(Math.max(state.benditoCount || bounds.min, bounds.min), bounds.max) : 0;
  state = { ...createSetupState(setupPlayers), benditoCount };
  saveState(state);
  render();
}

function renderReveal() {
  const screen = createElement("section", "screen centered");
  const player = state.players[state.revealIndex];
  screen.append(createElement("span", "eyebrow", `Segredo ${state.revealIndex + 1} / ${state.players.length}`));
  screen.append(createElement("h1", "", player));
  const instruction = createElement("p", "muted", state.revealShown ? "Memorize sua palavra e oculte a tela antes de passar o celular." : "Toque para revelar sua palavra.");
  const card = createElement("button", "secret-card reveal-card", "");
  card.type = "button";
  card.setAttribute("aria-label", state.revealShown ? "Sua palavra secreta" : "Toque para revelar sua palavra");
  if (state.revealShown) card.append(createElement("strong", "secret", state.secrets[state.revealIndex].secret));
  else {
    card.append(createElement("span", "reveal-icon", "✦"));
    card.append(createElement("span", "hint", "Toque para revelar"));
  }
  screen.append(instruction, card);

  const reveal = () => {
    if (!state.revealShown) updateState({ ...state, revealShown: true });
  };
  card.addEventListener("click", reveal);
  card.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") reveal();
  });

  if (state.revealShown) {
    const nextButton = createButton(state.revealIndex === state.players.length - 1 ? "Começar discussão" : "Ocultar e passar", "button", () => {
      if (state.revealIndex === state.players.length - 1) updateState(startDiscussion(state));
      else updateState({ ...state, revealIndex: state.revealIndex + 1, revealShown: false });
    });
    screen.append(nextButton);
  }
  app.append(screen);
}

function renderDiscussion() {
  const screen = createElement("section", "screen centered");
  screen.append(createElement("h1", "", "Solta a conversa"));
  screen.append(createElement("span", "eyebrow", `Clima da rodada: ${state.categoryLabel}`));
  const starter = createElement("p", "discussion-starter", "Começa falando: ");
  starter.append(createElement("strong", "", state.players[state.starterIndex]));
  screen.append(starter);
  screen.append(createElement("p", "muted", "Fale sobre sua palavra, mas sem entregar o ouro."));
  const timer = createElement("strong", "timer", formatRemainingTime(getRemainingTime(state.timerEndsAt)));
  screen.append(timer);
  screen.append(createButton("Partiu votação", "button", () => updateState(startVoting(state))));
  app.append(screen);
  timerCleanup = startTimer(state.timerEndsAt, (remaining) => { timer.textContent = formatRemainingTime(remaining); }, () => updateState(startVoting(state)));
}

function renderVoting() {
  const screen = createElement("section", "screen centered");
  const voter = state.players[state.votingIndex];
  if (!state.votingReady) {
    screen.append(createElement("span", "eyebrow", `Próximo participante — ${state.votingIndex + 1} de ${state.players.length}`));
    screen.append(createElement("h1", "", voter));
    screen.append(createElement("p", "muted", "Passe o celular para esta pessoa.") , createButton("Votar", "button", () => updateState(beginVotingStep(state))));
    app.append(screen);
    return;
  }
  const voterIsBendito = state.roles[state.votingIndex] === "bendito";
  screen.append(createElement("span", "eyebrow", `Votação ${state.votingIndex + 1} de ${state.players.length}`));
  screen.append(createElement("h1", "", `Vez de ${voter}`));
  screen.append(createElement("p", "muted", voterIsBendito ? "Você é Bendito. Não precisa votar. Confirme para passar o celular." : "Escolha quem você acha que é Bendito. Seu voto é secreto."));

  if (!voterIsBendito) {
    const voteList = createElement("div", "vote-list");
    let selectedTarget;
    state.players.forEach((player, index) => {
      if (index === state.votingIndex) return;
      const option = createButton(player, "vote-option", () => {
        selectedTarget = index;
        [...voteList.children].forEach((child) => {
          child.classList.remove("selected");
          child.blur();
        });
        option.classList.add("selected");
        option.focus();
      });
      voteList.append(option);
    });
    screen.append(voteList);
    screen.append(createButton("Confirmar voto", "button", () => {
      if (selectedTarget === undefined || !canVote(state.votingIndex, selectedTarget, state.roles, state.votes)) return;
      submitVote(selectedTarget);
    }, false));
  } else {
    screen.append(createButton("Entendi, passar o celular", "button", () => submitVote(undefined)));
  }
  app.append(screen);
}

function submitVote(targetIndex) {
  const votes = [...state.votes];
  votes[state.votingIndex] = targetIndex;
  const nextIndex = state.votingIndex + 1;
  if (nextIndex >= state.players.length) updateState(completeRound({ ...state, votes, results: evaluateVotes(votes, state.roles), votingReady: false }));
  else updateState({ ...state, votes, votingIndex: nextIndex, votingReady: false });
}

function renderResults() {
  const screen = createElement("section", "screen results-screen");
  const results = (state.results || []).filter((result) => result.targetIndex !== undefined);
  const correctResults = results.filter((result) => result.correct);
  const incorrectResults = results.filter((result) => !result.correct);
  const benditoNames = state.players.filter((_, index) => state.roles[index] === "bendito");

  screen.append(createElement("span", "eyebrow", "Revelação final"));
  screen.append(createElement("h1", "", "Quem estava no disfarce?"));

  const stage = createElement("div", "results-stage");
  stage.append(createResultsPanel("results-correct", "Tirou onda", "police", correctResults.map((result) => state.players[result.voterIndex])));
  stage.append(createMalandroFigure(benditoNames));
  stage.append(createResultsPanel("results-incorrect", "Deu mole", "otario", incorrectResults.map((result) => state.players[result.voterIndex])));
  screen.append(stage);

  const actions = createElement("div", "actions");
  actions.append(createButton("Vamo de novo", "button", () => updateState(createRoundState(state.players, state.benditoCount, state.categoryKey || "random", state.pair.word))));
  actions.append(createButton("Chegou mais gente", "button secondary", () => {
    setupPlayers = [...state.players];
    clearState();
    state = createSetupState(setupPlayers);
    saveState(state);
    render();
  }));
  screen.append(actions);
  app.append(screen);
}

function createResultsPanel(className, title, characterType, names) {
  const panel = createElement("section", `results-side-panel ${className}`);
  panel.append(createCharacter(characterType));
  panel.append(createElement("h2", "results-panel-title", title));
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

function createMalandroFigure(names) {
  const figure = createElement("section", "results-malandro");
  figure.append(createCharacter("malandro"));
  figure.append(createElement("span", "results-role", "Bendito"));
  figure.append(createElement("strong", "results-bendito-name", names.join(" + ")));
  return figure;
}
