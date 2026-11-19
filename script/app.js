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
  const addButton = createButton("Adicionar", "button secondary");
  addButton.type = "submit";
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
  setupPlayers.forEach((player, index) => {
    const item = createElement("div", "player-item");
    item.append(createElement("span", "", player));
    item.append(createButton("↑", "icon-button move-up", () => reorderPlayer(index, index - 1), index === 0));
    item.append(createButton("↓", "icon-button move-down", () => reorderPlayer(index, index + 1), index === setupPlayers.length - 1));
    item.append(createButton("×", "icon-button", () => removePlayer(index), false));
    list.append(item);
  });
  screen.append(list);

  const countField = createElement("div", "field");
  const countLabel = createElement("label", "", "Quantidade de Benditos");
  const countSelect = createElement("select", "select");
  countSelect.setAttribute("aria-label", "Quantidade de Benditos");
  const bounds = getBenditoBounds(setupPlayers.length);
  if (bounds.max > 0) {
    for (let count = bounds.min; count <= bounds.max; count += 1) {
      const option = createElement("option", "", `${count} Bendito${count > 1 ? "s" : ""}`);
      option.value = count;
      if (count === (state.benditoCount || getDefaultBenditoCount(setupPlayers.length))) option.selected = true;
      countSelect.append(option);
    }
  } else {
    const option = createElement("option", "", "Adicione pelo menos 3 jogadores");
    countSelect.append(option);
    countSelect.disabled = true;
  }
  countField.append(countLabel, countSelect);
  screen.append(countField);

  const actions = createElement("div", "actions");
  const startButton = createButton("Iniciar", "button", () => {
    const nextState = createRoundState(setupPlayers, Number(countSelect.value));
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
  state = createSetupState(setupPlayers);
  saveState(state);
  render();
}

function removePlayer(index) {
  setupPlayers = setupPlayers.filter((_, playerIndex) => playerIndex !== index);
  state = createSetupState(setupPlayers);
  saveState(state);
  render();
}

function renderReveal() {
  const screen = createElement("section", "screen centered");
  const player = state.players[state.revealIndex];
  screen.append(createElement("span", "eyebrow", `Participante ${state.revealIndex + 1} de ${state.players.length}`));
  screen.append(createElement("h1", "", player));
  const instruction = createElement("p", "muted", state.revealShown ? "Memorize sua informação e oculte a tela antes de passar o celular." : "Deslize para cima para revelar sua informação.");
  const card = createElement("div", "secret-card swipe-zone");
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", state.revealShown ? "Sua informação secreta" : "Deslize para cima para revelar");
  if (state.revealShown) card.append(createElement("strong", "secret", state.secrets[state.revealIndex].secret));
  else card.append(createElement("span", "hint", "↑ deslize para cima ↑"));
  screen.append(instruction, card);

  const reveal = () => {
    if (!state.revealShown) updateState({ ...state, revealShown: true });
  };
  card.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") reveal();
  });
  let startY = null;
  card.addEventListener("touchstart", (event) => { startY = event.changedTouches[0].clientY; }, { passive: true });
  card.addEventListener("touchend", (event) => {
    if (startY !== null && startY - event.changedTouches[0].clientY > 35) reveal();
    else reveal();
    startY = null;
  }, { passive: true });
  card.addEventListener("mousedown", (event) => { startY = event.clientY; });
  card.addEventListener("mouseup", (event) => {
    if (startY !== null && startY - event.clientY > 35) reveal();
    else reveal();
    startY = null;
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
  actions.append(createButton("Jogar novamente", "button", () => updateState(createRoundState(state.players, state.benditoCount, state.pair.word))));
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
