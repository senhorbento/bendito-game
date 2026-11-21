import {
  canAttemptWord,
  canVote,
  normalizeTargetIndexes,
  createRoleAssignments,
  evaluateVotes,
  getBenditoBounds,
  getRemainingTime,
  validateName
} from "../script/game-rules.js";
import { beginVotingStep, createRoundState, startDiscussion, startVoting } from "../script/game-state.js";
import { categories, allPairs, selectClue } from "../script/word-bank.js";
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
  ["evaluates a correct multi-target vote", () => evaluateVotes([[1, 2]], ["regular", "bendito", "bendito"])[0].correct],
  ["normalizes single and multiple vote targets", () => normalizeTargetIndexes(1).join() === "1" && normalizeTargetIndexes([1, 2]).join() === "1,2" && normalizeTargetIndexes(undefined).length === 0],
  ["rejects duplicate targets in a multi-target vote", () => !canVote(0, [1, 1], ["regular", "bendito"], [])],
  ["recognizes a Bendito word attempt", () => evaluateVotes([undefined], ["bendito"], ["Girafa"], "Girafa")[0].malandro],
  ["allows a Bendito attempt only once", () => canAttemptWord(0, ["bendito"], undefined) && !canAttemptWord(0, ["bendito"], "Girafa")],
  ["calculates remaining time", () => getRemainingTime(1500, 1000) === 500],
  ["selects a discussion starter", () => {
    const round = createRoundState(["Ana", "Bia", "Caio"], 1);
    return startDiscussion(round, 1000, () => 0.99).starterIndex === 2;
  }],
  ["keeps voting behind a neutral step", () => {
    const round = createRoundState(["Ana", "Bia", "Caio"], 1);
    const voting = startVoting(round);
    return voting.votingReady === false && beginVotingStep(voting).votingReady === true;
  }],
  ["keeps JJ rounds unable to use Bendito attempts", () => {
    const round = createRoundState(["Ana", "Bia", "Caio"], 1, "random", [], "jj", false);
    return round.gameMode === "jj" && round.allowBenditoAttempt === false;
  }],
  ["enables Bendito attempts by default in free-for-all", () => {
    const round = createRoundState(["Ana", "Bia", "Caio"], 1, "random", [], "free-for-all", true);
    return round.gameMode === "free-for-all" && round.allowBenditoAttempt === true;
  }],
  ["represents JJ as one consensus vote for regular players", () => {
    const roles = ["regular", "bendito", "regular"];
    const consensusTarget = 1;
    const votes = roles.map((role) => role === "regular" ? consensusTarget : undefined);
    const results = evaluateVotes(votes, roles, [], "Pizza");
    return results.filter((result) => result.targetIndexes.length > 0).length === 2 && results.filter((result) => result.targetIndexes.length > 0).every((result) => result.correct);
  }],
  ["keeps exactly ten categories", () => Object.keys(categories).length === 10 && Boolean(categories.rioDeJaneiro)],
  ["keeps every category between fifty and one hundred words", () => Object.values(categories).every(({ pairs }) => pairs.length >= 50 && pairs.length <= 100)],
  ["keeps category keys in the class naming pattern", () => Object.keys(categories).every((key) => /^[a-z][A-Za-z0-9]*$/.test(key))],
  ["keeps unique words inside each category", () => Object.values(categories).every(({ pairs }) => {
    const words = pairs.map(({ word }) => word.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLocaleLowerCase());
    return new Set(words).size === words.length;
  })],
  ["keeps three distinct meaningful one-word clues on every word", () => allPairs.every(({ word, clues }) => clues.length === 3 && new Set(clues).size === 3 && clues.every((clue) => /^\S+$/.test(clue) && !["Ligado", "Contexto", "Relação"].includes(clue) && clue.toLocaleLowerCase() !== word.toLocaleLowerCase()))],
  ["selects a clue using the supplied random function", () => {
    const pair = allPairs[0];
    return selectClue(pair, () => 0) === pair.clues[0] && selectClue(pair, () => 0.99) === pair.clues[2];
  }],
  ["gives Benditos the selected clue", () => {
    const round = createRoundState(["Ana", "Bia", "Caio"], 1);
    const benditoIndex = round.roles.indexOf("bendito");
    return round.secrets[benditoIndex].secret === round.pair.clue && round.pair.clues.includes(round.secrets[benditoIndex].secret) && typeof round.secrets[benditoIndex].secret === "string";
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
