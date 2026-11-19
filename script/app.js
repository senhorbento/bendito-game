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
  screen.append(createButton("Jogar", "button", () => {
    state = createSetupState(setupPlayers);
    saveState(state);
    render();
  }));
  app.append(screen);
}

function renderSetup() {
  const screen = createElement("section", "screen");
  screen.append(createElement("span", "eyebrow", "Prepare a rodada"));
  screen.append(createElement("h1", "", "Quem vai jogar?"));
  screen.append(createElement("p", "muted", "Adicione os participantes e passe o celular de mão em mão."));

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
    render();
  });
  screen.append(addForm, error);

  const list = createElement("div", "player-list");
  let draggedIndex = null;
  setupPlayers.forEach((player, index) => {
    const item = createElement("div", "player-item");
    item.draggable = true;
    item.dataset.index = index;
    item.append(createElement("span", "drag-handle", `☷ ${player}`));
    item.append(createButton("×", "icon-button", () => removePlayer(index), false));
    item.addEventListener("dragstart", () => { draggedIndex = index; item.classList.add("dragging"); });
    item.addEventListener("dragend", () => { draggedIndex = null; item.classList.remove("dragging"); });
    item.addEventListener("dragover", (event) => event.preventDefault());
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) reorderPlayer(draggedIndex, index);
    });
    list.append(item);
  });
  screen.append(list);

  const countField = createElement("div", "field");
  const countLabel = createElement("label", "", "Quantidade de Benditos");
  const countControl = createElement("div", "number-control");
  const bounds = getBenditoBounds(setupPlayers.length);
  const currentCount = Math.min(Math.max(Number(state.benditoCount) || getDefaultBenditoCount(setupPlayers.length), bounds.min), bounds.max);
  const countValue = createElement("output", "count-value", bounds.max > 0 ? String(currentCount) : "—");
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
  actions.append(startButton);
  screen.append(actions);
  app.replaceChildren(screen);
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
  screen.append(createElement("span", "eyebrow", `Participante ${state.revealIndex + 1} de ${state.players.length}`));
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
  screen.append(createElement("span", "eyebrow", "Hora da conversa"));
  screen.append(createElement("h1", "", "Descubram o Bendito"));
  screen.append(createElement("p", "muted", `Começa falando: ${state.players[state.starterIndex]}`));
  const timer = createElement("strong", "timer", formatRemainingTime(getRemainingTime(state.timerEndsAt)));
  screen.append(timer, createElement("p", "muted", "Conversem sobre as pistas."));
  screen.append(createButton("Ir para votação", "button", () => updateState(startVoting(state))));
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
        [...voteList.children].forEach((child) => child.classList.remove("selected"));
        option.classList.add("selected");
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
  const screen = createElement("section", "screen");
  screen.append(createElement("span", "eyebrow", "Fim da rodada"));
  screen.append(createElement("h1", "", "Quem era Bendito?"));
  const benditoNames = state.players.filter((_, index) => state.roles[index] === "bendito");
  const benditoBox = createElement("div", "result-item");
  benditoBox.append(createElement("strong", "", benditoNames.join(", ")));
  benditoBox.append(createElement("span", "badge", `${benditoNames.length} Bendito${benditoNames.length > 1 ? "s" : ""}`));
  screen.append(benditoBox);
  const resultsList = createElement("div", "stack");
  (state.results || []).filter((result) => result.targetIndex !== undefined).forEach((result) => {
    const item = createElement("div", "result-item");
    item.append(createElement("span", "", `${state.players[result.voterIndex]} → ${state.players[result.targetIndex]}`));
    item.append(createElement("span", `badge ${result.correct ? "good" : "bad"}`, result.correct ? "Acertou" : "Errou"));
    resultsList.append(item);
  });
  screen.append(resultsList);
  const actions = createElement("div", "actions");
  actions.append(createButton("Jogar novamente", "button", () => updateState(createRoundState(state.players, state.benditoCount, state.categoryKey || "random", state.pair.word))));
  actions.append(createButton("Alterar jogadores", "button secondary", () => {
    setupPlayers = [...state.players];
    clearState();
    state = createSetupState(setupPlayers);
    saveState(state);
    render();
  }));
  screen.append(actions);
  app.append(screen);
}
