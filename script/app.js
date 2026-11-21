import { allPairs, categories, getWordPool } from "./word-bank.js";
import {
  canAttemptWord,
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
import { APP_VERSION } from "./version.js";
import { renderHomeScreen as renderHomeScreenModule } from "./screens/home-screen.js";
import { renderRevealScreen } from "./screens/reveal-screen.js";
import { renderDiscussionScreen } from "./screens/discussion-screen.js";
import { renderResultsScreen } from "./screens/results-screen.js";
import { appendVersionFooter as appendScreenVersionFooter, createElement as createScreenElement } from "./screens/screen-helpers.js";

const app = document.querySelector("#app");
let state = loadState();
let timerCleanup = null;
let wakeLock = null;
let setupPlayers = Array.isArray(state?.players) ? [...state.players] : [];
let sessionUsedWords = Array.isArray(state?.usedWords) ? [...state.usedWords] : [];
let sessionLastStarterIndex = Number.isInteger(state?.lastStarterIndex) ? state.lastStarterIndex : null;

if (!isRecoverableState(state)) {
  state = createHomeState(setupPlayers);
}
render();

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.phase === "discussion") requestWakeLock();
});

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
    && Array.isArray(candidate.pair.clues)
    && candidate.pair.clues.length === 3
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

function goHome() {
  if (state.phase !== "home" && state.phase !== "setup" && !window.confirm("Voltar para a home e encerrar a rodada?")) return;
  releaseWakeLock();
  sessionUsedWords = [];
  sessionLastStarterIndex = null;
  state = createHomeState(setupPlayers);
  clearState();
  saveState(state);
  render();
}

function render() {
  if (timerCleanup) {
    timerCleanup();
    timerCleanup = null;
  }
  if (state.phase !== "discussion") releaseWakeLock();
  app.replaceChildren();
  if (state.phase !== "home") appendHomeButton();
  if (state.phase === "home") renderHomeScreen();
  else if (state.phase === "setup") renderSetup();
  else if (state.phase === "reveal") renderReveal();
  else if (state.phase === "discussion") renderDiscussion();
  else if (state.phase === "voting") renderVoting();
  else renderResults();
}

function appendHomeButton() {
  const button = createButton("⌂", "home-button", goHome);
  button.setAttribute("aria-label", "Voltar para a home");
  app.append(button);
}

function renderHomeScreen() {
  renderHomeScreenModule({
    app,
    version: APP_VERSION,
    onStart: () => {
      state = createSetupState(setupPlayers);
      saveState(state);
      render();
    }
  });
}

function renderSetup() {
  const screen = createElement("section", "screen setup-players-screen");
  screen.append(createElement("span", "eyebrow", "Nova rodada"));
  screen.append(createElement("h1", "", "Quem está no bonde?"));
  screen.append(createElement("p", "muted", "Adiciona a galera e organiza o bonde."));

  const playerSummary = createElement("p", "player-summary");
  const updatePlayerSummary = () => {
    playerSummary.textContent = setupPlayers.length === 0
      ? "Ainda não tem ninguém no bonde."
      : `${setupPlayers.length} ${setupPlayers.length === 1 ? "pessoa" : "pessoas"} no bonde`;
  };
  updatePlayerSummary();
  screen.append(playerSummary);

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
    state = createSetupState(setupPlayers, state.categoryKey || "random", state.gameMode || "jj", state.allowBenditoAttempt || false, sessionUsedWords, sessionLastStarterIndex);
    saveState(state);
    appendSetupPlayer(screen, setupPlayers.length - 1);
    updatePlayerSummary();
    input.value = "";
    input.focus();
    refreshSetupControls(screen);
  });
  screen.append(addForm, error);

  const list = createElement("div", "player-list");
  list.id = "setup-player-list";
  if (setupPlayers.length === 0) {
    list.append(createElement("p", "empty-player-list", "Adicione pelo menos 3 pessoas para começar."));
  } else {
    setupPlayers.forEach((_, index) => appendSetupPlayer(screen, index, list));
  }
  screen.append(list);

  const nextButton = createButton(setupPlayers.length < 3 ? `Bora organizar · faltam ${3 - setupPlayers.length}` : "Bora organizar", "button", () => renderRoundSetup(), setupPlayers.length < 3);
  nextButton.id = "setup-next-button";
  screen.append(nextButton);
  app.replaceChildren(screen);
  appendVersionFooter(screen);
}

function renderRoundSetup() {
  const screen = createElement("section", "screen setup-options-screen");
  screen.append(createElement("span", "eyebrow", "Configura a resenha"));
  screen.append(createElement("h1", "", "Qual vai ser?"));

  const countField = createElement("div", "field");
  const countLabel = createElement("label", "", "Quantidade de BENDITOS");
  const countControl = createElement("div", "number-control");
  const bounds = getBenditoBounds(setupPlayers.length);
  const currentCount = Math.min(Math.max(Number(state.benditoCount) || getDefaultBenditoCount(setupPlayers.length), bounds.min), bounds.max);
  const countValue = createElement("output", "count-value", bounds.max > 0 ? String(currentCount) : "—");
  countValue.setAttribute("aria-live", "polite");
  const decrementButton = createButton("−", "icon-button", () => updateBenditoCount(currentCount - 1), bounds.max === 0 || currentCount <= bounds.min);
  decrementButton.setAttribute("aria-label", "Diminuir quantidade de BENDITOS");
  const incrementButton = createButton("+", "icon-button", () => updateBenditoCount(currentCount + 1), bounds.max === 0 || currentCount >= bounds.max);
  incrementButton.setAttribute("aria-label", "Aumentar quantidade de BENDITOS");
  countControl.append(decrementButton, countValue, incrementButton);
  countField.append(countLabel, countControl);
  screen.append(countField);

  const modeField = createElement("div", "field");
  modeField.append(createElement("label", "", "Modo de jogo"));
  const modeSelect = createElement("select", "select");
  modeSelect.setAttribute("aria-label", "Modo de jogo");
  [["jj", "Modo JJ — geral junto"], ["free-for-all", "Cada um por si"]].forEach(([value, label]) => {
    const option = createElement("option", "", label);
    option.value = value;
    modeSelect.append(option);
  });
  modeSelect.value = state.gameMode || "jj";
  modeSelect.addEventListener("change", () => {
    state = { ...state, gameMode: modeSelect.value, allowBenditoAttempt: modeSelect.value === "free-for-all" ? true : false };
    saveState(state);
    renderRoundSetup();
  });
  modeField.append(modeSelect);
  screen.append(modeField);

  const attemptField = createElement("label", "toggle-field");
  const attemptInput = document.createElement("input");
  attemptInput.type = "checkbox";
  attemptInput.setAttribute("aria-label", "Permitir o BENDITO se salvar");
  attemptInput.checked = state.gameMode === "free-for-all" && state.allowBenditoAttempt === true;
  attemptInput.disabled = state.gameMode === "jj";
  attemptInput.addEventListener("change", () => { state = { ...state, allowBenditoAttempt: state.gameMode === "free-for-all" && attemptInput.checked }; saveState(state); });
  attemptField.append(attemptInput, createElement("span", "", state.gameMode === "jj" ? "BENDITO não pode se salvar no modo JJ" : "Permitir o BENDITO se salvar"));
  screen.append(attemptField);

  const categoryField = createElement("div", "field");
  categoryField.append(createElement("label", "", "Categoria"));
  const categorySelect = createElement("select", "select");
  categorySelect.setAttribute("aria-label", "Categoria da rodada");
  const wordCounter = createElement("p", "word-counter");
  const randomOption = createElement("option", "", "Aleatória — todos os temas");
  randomOption.value = "random";
  categorySelect.append(randomOption);
  Object.entries(categories).forEach(([key, category]) => {
    const option = createElement("option", "", category.label);
    option.value = key;
    categorySelect.append(option);
  });
  categorySelect.value = state.categoryKey || "random";
  const updateWordCounter = () => {
    wordCounter.textContent = `${sessionUsedWords.length} / ${getWordPool(categorySelect.value).length} palavras usadas`;
  };
  categorySelect.addEventListener("change", () => {
    state = { ...state, categoryKey: categorySelect.value };
    saveState(state);
    updateWordCounter();
  });
  categoryField.append(categorySelect);
  screen.append(categoryField);
  updateWordCounter();
  screen.append(wordCounter);

  const actions = createElement("div", "actions");
  actions.append(createButton("Partiu", "button", () => {
    const nextState = createRoundState(setupPlayers, currentCount, categorySelect.value, sessionUsedWords, modeSelect.value, attemptInput.checked, sessionLastStarterIndex);
    sessionUsedWords = [...nextState.usedWords];
    updateState(nextState);
  }));
  actions.append(createButton("Voltar para jogadores", "button secondary", () => renderSetup()));
  screen.append(actions);
  app.replaceChildren(screen);
  appendVersionFooter(screen);
}

function appendSetupPlayer(screen, index, list = screen.querySelector("#setup-player-list")) {
  const player = setupPlayers[index];
  const item = createElement("article", "player-item setup-player-card");
  item.dataset.index = index;
  item.dataset.playerIndex = index;
  const identity = createElement("span", "setup-player-identity");
  identity.append(createElement("span", "setup-player-number", String(index + 1).padStart(2, "0")));
  identity.append(createElement("span", "drag-handle", player));
  item.append(identity);
  const reorderActions = createElement("div", "player-reorder-actions");
  const moveUpButton = createButton("↑", "icon-button reorder-button", (event) => {
    event.stopPropagation();
    movePlayer(index, index - 1);
  }, index === 0);
  moveUpButton.setAttribute("aria-label", `Subir ${player}`);
  const moveDownButton = createButton("↓", "icon-button reorder-button", (event) => {
    event.stopPropagation();
    movePlayer(index, index + 1);
  }, index === setupPlayers.length - 1);
  moveDownButton.setAttribute("aria-label", `Descer ${player}`);
  reorderActions.append(moveUpButton, moveDownButton);
  item.append(reorderActions);
  const removeButton = createButton("", "icon-button trash-button", (event) => {
    event.stopPropagation();
    removePlayer(index);
  }, false);
  removeButton.setAttribute("aria-label", `Remover ${player}`);
  removeButton.title = "Remover participante";
  removeButton.append(createElement("span", "trash-icon", ""));
  item.append(removeButton);
  list.append(item);
}

function movePlayer(from, to) {
  if (to < 0 || to >= setupPlayers.length) return;
  const nextPlayers = [...setupPlayers];
  [nextPlayers[from], nextPlayers[to]] = [nextPlayers[to], nextPlayers[from]];
  setupPlayers = nextPlayers;
  state = createCurrentSetupState(setupPlayers);
  saveState(state);
  render();
}

function refreshSetupControls(screen) {
  const nextButton = screen.querySelector("#setup-next-button");
  if (!nextButton) return;
  const remainingPlayers = Math.max(0, 3 - setupPlayers.length);
  nextButton.disabled = remainingPlayers > 0;
  nextButton.textContent = remainingPlayers > 0 ? `Bora organizar · faltam ${remainingPlayers}` : "Bora organizar";
}

function createCurrentSetupState(players, benditoCount = state.benditoCount) {
  const bounds = getBenditoBounds(players.length);
  const safeCount = bounds.max > 0
    ? Math.min(Math.max(Number(benditoCount) || getDefaultBenditoCount(players.length), bounds.min), bounds.max)
    : 0;
  return {
    ...createSetupState(
      players,
      state.categoryKey || "random",
      state.gameMode || "jj",
      state.allowBenditoAttempt === true,
      sessionUsedWords,
      sessionLastStarterIndex
    ),
    benditoCount: safeCount
  };
}

function reorderPlayer(from, to) {
  if (to < 0 || to >= setupPlayers.length) return;
  const nextPlayers = [...setupPlayers];
  [nextPlayers[from], nextPlayers[to]] = [nextPlayers[to], nextPlayers[from]];
  setupPlayers = nextPlayers;
  state = createCurrentSetupState(setupPlayers);
  saveState(state);
  render();
}

function updateBenditoCount(count) {
  const bounds = getBenditoBounds(setupPlayers.length);
  if (count < bounds.min || count > bounds.max) return;
  state = createCurrentSetupState(setupPlayers, count);
  saveState(state);
  render();
}

function removePlayer(index) {
  setupPlayers = setupPlayers.filter((_, playerIndex) => playerIndex !== index);
  state = createCurrentSetupState(setupPlayers);
  saveState(state);
  render();
}

function appendVersionFooter(screen) {
  screen.append(createElement("small", "app-version", `BENDITO · versão ${APP_VERSION}`));
}

function renderReveal() {
  renderRevealScreen({
    app,
    state,
    version: APP_VERSION,
    onReveal: () => {
      if (!state.revealShown) updateState({ ...state, revealShown: true });
    },
    onNext: () => {
      if (state.revealIndex === state.players.length - 1) updateState(startDiscussion(state));
      else updateState({ ...state, revealIndex: state.revealIndex + 1, revealShown: false });
    }
  });
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch {
    wakeLock = null;
  }
}

function releaseWakeLock() {
  if (!wakeLock) return;
  wakeLock.release();
  wakeLock = null;
}

function renderDiscussion() {
  renderDiscussionScreen({
    app,
    state,
    version: APP_VERSION,
    allPairsCount: allPairs.length,
    remainingTime: () => formatRemainingTime(getRemainingTime(state.timerEndsAt)),
    onVote: () => updateState(startVoting(state)),
    requestWakeLock,
    onTimerUpdate: (timer, onTimerEnd) => {
      timerCleanup = startTimer(state.timerEndsAt, (remaining) => {
        timer.textContent = formatRemainingTime(remaining);
      }, onTimerEnd);
    },
    onTimerEnd: () => updateState(startVoting(state))
  });
}

function renderVoting() {
  if (state.gameMode === "jj") {
    renderGroupVoting();
    return;
  }
  const screen = createElement("section", "screen centered");
  const voter = state.players[state.votingIndex];
  if (!state.votingReady) {
    screen.append(createElement("span", "eyebrow", `Hora da verdade — ${state.votingIndex + 1} de ${state.players.length}`));
    screen.append(createElement("h1", "", voter));
    screen.append(createElement("p", "muted", "Passe o celular para esta pessoa.") , createButton("Votar", "button", () => updateState(beginVotingStep(state))));
    app.append(screen);
    appendVersionFooter(screen);
    return;
  }
  const voterIsBendito = state.roles[state.votingIndex] === "bendito";
  screen.append(createElement("span", "eyebrow", `Votação ${state.votingIndex + 1} de ${state.players.length}`));
  screen.append(createElement("h1", "", `Vez de ${voter}`));
  screen.append(createElement("p", "muted", voterIsBendito ? "Hora de se salvar, se você for malandro mesmo, qual era a palavra?" : "Escolha quem você acha que é BENDITO. Seu voto é secreto."));

  if (!voterIsBendito || state.allowBenditoAttempt) {
    const voteList = createElement("div", "vote-list");
    let selectedTarget;
    let selectedWordAttempt;
    const wordPool = getWordPool(state.categoryKey || "random");
    const options = voterIsBendito ? [state.pair.word, ...wordPool.filter((pair) => pair.word !== state.pair.word).sort(() => Math.random() - 0.5).slice(0, 5).map((pair) => pair.word)] : state.players.map((player, index) => ({ player, index })).filter(({ index }) => index !== state.votingIndex);
    options.forEach((optionValue) => {
      const player = voterIsBendito ? optionValue : optionValue.player;
      const index = voterIsBendito ? undefined : optionValue.index;
      const option = createButton(player, "vote-option", () => {
        selectedTarget = voterIsBendito ? undefined : index;
        selectedWordAttempt = voterIsBendito ? player : undefined;
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
      if (voterIsBendito) {
        if (!canAttemptWord(state.votingIndex, state.roles, state.wordAttempts[state.votingIndex])) return;
        submitVote(undefined, selectedWordAttempt);
        return;
      }
      if (selectedTarget === undefined || !canVote(state.votingIndex, selectedTarget, state.roles, state.votes)) return;
      submitVote(selectedTarget);
    }, false));
  } else {
    screen.append(createButton("Entendi, passar o celular", "button", () => submitVote(undefined)));
  }
  app.append(screen);
  appendVersionFooter(screen);
}

function renderGroupVoting() {
  const screen = createElement("section", "screen centered");
  let selectedTarget;
  screen.append(createElement("span", "eyebrow", "Votação em grupo"));
  screen.append(createElement("h1", "", "Cheguem em um consenso"));
  screen.append(createElement("p", "muted", "Todos discutem e escolhem um único nome. Todos os participantes aparecem na votação."));

  const voteList = createElement("div", "vote-list");
  state.players.forEach((player, targetIndex) => {
    const option = createButton(player, "vote-option", () => {
      selectedTarget = targetIndex;
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
  screen.append(createButton("Confirmar consenso", "button", () => {
    if (selectedTarget === undefined) return;
    const votes = state.roles.map((role) => role === "regular" ? selectedTarget : undefined);
    updateState(completeRound({ ...state, votes, wordAttempts: [], results: evaluateVotes(votes, state.roles, [], state.pair.word) }));
  }));
  app.append(screen);
  appendVersionFooter(screen);
}

function submitVote(targetIndex, wordAttempt) {
  const votes = [...state.votes];
  const wordAttempts = [...(state.wordAttempts || [])];
  votes[state.votingIndex] = targetIndex;
  wordAttempts[state.votingIndex] = wordAttempt;
  const nextIndex = state.votingIndex + 1;
  if (nextIndex >= state.players.length) updateState(completeRound({ ...state, votes, wordAttempts, results: evaluateVotes(votes, state.roles, wordAttempts, state.pair.word), votingReady: false }));
  else updateState({ ...state, votes, wordAttempts, votingIndex: nextIndex, votingReady: false });
}

function renderResults() {
  const wordPool = state.categoryKey === "random" ? allPairs : getWordPool(state.categoryKey || "random");
  renderResultsScreen({
    app,
    state,
    version: APP_VERSION,
    wordPoolLength: wordPool.length,
    onReplay: () => {
      const nextState = createRoundState(state.players, state.benditoCount, state.categoryKey || "random", sessionUsedWords, state.gameMode || "jj", state.allowBenditoAttempt || false, state.lastStarterIndex);
      sessionUsedWords = [...nextState.usedWords];
      updateState(nextState);
    },
    onPlayers: () => {
      setupPlayers = [...state.players];
      sessionUsedWords = [];
      sessionLastStarterIndex = null;
      clearState();
      state = createSetupState(setupPlayers);
      saveState(state);
      render();
    }
  });
}
