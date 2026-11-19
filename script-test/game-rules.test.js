import {
  canVote,
  createRoleAssignments,
  evaluateVotes,
  getBenditoBounds,
  getRemainingTime,
  validateName
} from "../script/game-rules.js";
import { beginVotingStep, createRoundState, startDiscussion, startVoting } from "../script/game-state.js";
import { getDefaultBenditoCount } from "../script/game-rules.js";

const tests = [
  ["rejects empty names", () => validateName("", []) !== ""],
  ["rejects names over twenty characters", () => validateName("a".repeat(21), []) !== ""],
  ["starts every valid group with one Bendito", () => {
    return getDefaultBenditoCount(3) === 1 && getDefaultBenditoCount(4) === 1 && getDefaultBenditoCount(10) === 1;
  }],
  ["allows exactly one Bendito for three players", () => {
    const bounds = getBenditoBounds(3);
    return bounds.min === 1 && bounds.max === 1;
  }],
  ["keeps one regular player", () => getBenditoBounds(5).max === 4],
  ["assigns the requested Benditos", () => createRoleAssignments(5, 2).filter((role) => role === "bendito").length === 2],
  ["blocks self voting", () => !canVote(0, 0, ["regular", "bendito"], [])],
  ["evaluates a correct vote", () => evaluateVotes([1], ["regular", "bendito"])[0].correct],
  ["calculates remaining time", () => getRemainingTime(1500, 1000) === 500],
  ["selects a discussion starter", () => {
    const round = createRoundState(["Ana", "Bia", "Caio"], 1);
    return startDiscussion(round, 1000, () => 0.99).starterIndex === 2;
  }],
  ["keeps voting behind a neutral step", () => {
    const round = createRoundState(["Ana", "Bia", "Caio"], 1);
    const voting = startVoting(round);
    return voting.votingReady === false && beginVotingStep(voting).votingReady === true;
  }]
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
