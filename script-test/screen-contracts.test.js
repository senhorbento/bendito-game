const output = document.querySelector("#test-output");
const app = document.querySelector("#app");
const contracts = [
  ["home uses the Jogar action", () => app.querySelector(".home-screen .button")?.textContent === "Jogar"],
  ["home exposes the Bendito logo", () => app.querySelector('.home-screen img[alt="BENDITO"]') !== null],
  ["version footer is present", () => app.querySelector(".app-version")?.textContent.startsWith("BENDITO · versão ")],
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
