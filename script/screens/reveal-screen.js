import { appendVersionFooter, createButton, createElement, focusPrimaryHeading } from "./screen-helpers.js";

export function renderRevealScreen({ app, state, version, onReveal, onNext }) {
  const screen = createElement("section", "screen centered");
  const player = state.players[state.revealIndex];
  screen.append(createElement("span", "eyebrow", `Fica quieto ${state.revealIndex + 1} / ${state.players.length}`));
  screen.append(createElement("h1", "", player));
  const instruction = createElement("p", "muted", state.revealShown ? "Memorize sua palavra e oculte a tela antes de passar o celular." : "");
  const card = createElement("button", "secret-card reveal-card", "");
  card.type = "button";
  card.setAttribute("aria-label", state.revealShown ? "Sua palavra secreta" : "Dar um bisu");
  if (state.revealShown) card.append(createElement("strong", "secret", state.secrets[state.revealIndex].secret));
  else {
    card.append(createElement("span", "reveal-icon", "✦"));
    card.append(createElement("span", "hint", "Dar um bisu"));
  }
  screen.append(instruction, card);
  card.addEventListener("click", onReveal);
  card.addEventListener("keydown", (event) => {
    if (["ArrowUp", "Enter", " "].includes(event.key)) onReveal();
  });
  if (state.revealShown) screen.append(createButton(state.revealIndex === state.players.length - 1 ? "Hora da resenha" : "Peguei a visão", "button", onNext));
  app.append(screen);
  appendVersionFooter(screen, version);
  focusPrimaryHeading(screen);
}
