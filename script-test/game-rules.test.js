import {
  canVote,
  createRoleAssignments,
  evaluateVotes,
  getBenditoBounds,
  getRemainingTime,
  validateName
} from "../script/game-rules.js";

const tests = [
  ["rejects empty names", () => validateName("", []) !== ""],
  ["rejects names over twenty characters", () => validateName("a".repeat(21), []) !== ""],
  ["accepts three players", () => getBenditoBounds(3).max === 2],
  ["keeps one regular player", () => getBenditoBounds(5).max === 4],
  ["assigns the requested Benditos", () => createRoleAssignments(5, 2).filter((role) => role === "bendito").length === 2],
  ["blocks self voting", () => !canVote(0, 0, ["regular", "bendito"], [])],
  ["evaluates a correct vote", () => evaluateVotes([1], ["regular", "bendito"])[0].correct],
  ["calculates remaining time", () => getRemainingTime(1500, 1000) === 500]
];

const output = document.querySelector("#test-output");
tests.forEach(([name, test]) => {
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
