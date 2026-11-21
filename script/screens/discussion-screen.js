import { appendVersionFooter, createButton, createElement, focusPrimaryHeading } from "./screen-helpers.js";

export function renderDiscussionScreen({ app, state, version, allPairsCount, remainingTime, onVote, onTimerUpdate, onTimerEnd, requestWakeLock }) {
  const screen = createElement("section", "screen centered");
  screen.append(createElement("span", "word-counter", `${state.usedWords.length} / ${allPairsCount} palavras usadas`));
  screen.append(createElement("h1", "", "Solta a conversa"));
  screen.append(createElement("span", "eyebrow", `Clima da rodada: ${state.categoryLabel}`));
  const starter = createElement("p", "discussion-starter", "Começa falando: ");
  starter.append(createElement("strong", "", state.players[state.starterIndex]));
  screen.append(starter, createElement("p", "muted", "Fale sobre sua palavra, mas sem entregar o ouro."));
  const timer = createElement("strong", "timer", remainingTime());
  timer.setAttribute("aria-live", "polite");
  timer.setAttribute("aria-label", "Tempo restante");
  screen.append(timer, createButton("Partiu votação", "button", onVote));
  app.append(screen);
  appendVersionFooter(screen, version);
  focusPrimaryHeading(screen);
  requestWakeLock();
  onTimerUpdate(timer, onTimerEnd);
}
