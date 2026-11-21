import { appendVersionFooter, createButton, createElement, focusPrimaryHeading } from "./screen-helpers.js";

export function renderHomeScreen({ app, version, onStart }) {
  const screen = createElement("section", "screen centered home-screen");
  const logo = document.createElement("img");
  logo.className = "brand-art";
  logo.src = "./assets/bendito-logo.png";
  logo.alt = "BENDITO";
  screen.append(logo);
  const characterBanner = document.createElement("img");
  characterBanner.className = "home-character-banner";
  characterBanner.src = "./assets/sprites/banner.png";
  characterBanner.alt = "Policial, BENDITO e participante confuso em pixel art";
  screen.append(characterBanner);
  screen.append(createElement("p", "home-how-to-play", "A galera recebe uma palavra secreta.\nO BENDITO recebe só uma pista.\nTroca ideia, vota e vê quem tava no sapatinho."));
  screen.append(createButton("Jogar", "button", onStart));
  app.append(screen);
  appendVersionFooter(screen, version);
  focusPrimaryHeading(screen);
}
