const output = document.querySelector("#test-output");
const app = document.querySelector("#app");
const contracts = [
  ["home uses the Jogar action", () => app.querySelector(".home-screen .button")?.textContent === "Jogar"],
  ["home exposes the Bendito logo", () => app.querySelector('.home-screen img[alt="BENDITO"]') !== null],
  ["setup keeps the missing-player count accurate", () => {
    const button = app.querySelector("#setup-next-button");
    return !button || button.textContent === "Bora organizar" || button.textContent === `Bora organizar · faltam ${Math.max(0, 3 - document.querySelectorAll(".setup-player-card").length)}`;
  }],
  ["version footer is present", () => app.querySelector(".app-version")?.textContent.startsWith("BENDITO · versão ")],
  ["main has no outer padding", () => getComputedStyle(app).padding === "0px"],
  ["results expose word and clue containers", () => document.querySelector(".results-word-reveal") === null || Boolean(document.querySelector(".results-word") && document.querySelector(".results-clue"))],
  ["results allow vertical scrolling", () => document.querySelector(".results-screen") === null || getComputedStyle(document.querySelector(".results-screen")).overflowY === "auto"],
  ["results remove trailing footer space", () => document.querySelector(".results-screen") === null || getComputedStyle(document.querySelector(".results-screen")).paddingBottom === "0px"],
  ["test runner remains browser compatible", () => typeof document.createElement === "function"]
];

contracts.forEach(([name, test]) => {
  const item = document.createElement("li");
  try {
    if (!test()) throw new Error("failed");
    item.textContent = `OK — ${name}`;
    item.className = "passed";
  } catch (error) {
    item.textContent = `FALHOU — ${name}: ${error.message}`;
    item.className = "failed";
  }
  output.append(item);
});
