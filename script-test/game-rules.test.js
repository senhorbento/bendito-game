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
import { beginVotingStep, createRoundState, startDiscussion, startVoting, updateRoundOptions } from "../script/game-state.js";
import { STATE_SCHEMA_VERSION } from "../script/persistence.js";
import { getEligibleTargets, getWordAttemptOptions, hasRequiredTargets, toggleTarget } from "../script/voting-rules.js";
import { normalizeWord, validateWordBank } from "../script/word-bank-validation.js";
import { formatRemainingTime } from "../script/timer.js";
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
  ["evaluates a correct vote", () => evaluateVotes([1], ["regular", "bendito"], 1)[0].correct],
  ["evaluates a correct multi-target vote", () => evaluateVotes([[1, 2]], ["regular", "bendito", "bendito"], 2)[0].correct],
  ["rejects an incomplete multi-target vote", () => !evaluateVotes([[1]], ["regular", "bendito", "bendito"], 2)[0].correct],
  ["assigns every requested Bendito", () => createRoleAssignments(5, 2, () => 0.5).filter((role) => role === "bendito").length === 2],
  ["normalizes single and multiple vote targets", () => normalizeTargetIndexes(1).join() === "1" && normalizeTargetIndexes([1, 2]).join() === "1,2" && normalizeTargetIndexes(undefined).length === 0],
  ["defines a persisted state schema version", () => STATE_SCHEMA_VERSION === 2],
  ["keeps round options in setup phase", () => updateRoundOptions({ phase: "setup", gameMode: "jj" }, { gameMode: "free-for-all" }).phase === "setup"],
  ["builds voting targets without the voter", () => getEligibleTargets(["Ana", "Bia", "Caio"], 1).length === 2],
  ["limits multi-target selection", () => toggleTarget([1], 2, 2).join() === "1,2" && toggleTarget([1, 2], 0, 2).join() === "1,2"],
  ["requires the configured number of targets", () => hasRequiredTargets([1, 2], 2) && !hasRequiredTargets([1], 2)],
  ["keeps the main word in Bendito attempt options", () => getWordAttemptOptions("Pizza", [{ word: "Pizza" }, { word: "Massa" }], () => 0).includes("Pizza")],
  ["normalizes words for category validation", () => normalizeWord("  Árvore ") === "arvore"],
  ["validates the complete word bank", () => validateWordBank(categories)],
  ["rejects duplicate targets in a multi-target vote", () => !canVote(0, [1, 1], ["regular", "bendito"], [])],
  ["recognizes a Bendito word attempt", () => evaluateVotes([undefined], ["bendito"], 1, ["Girafa"], "Girafa")[0].malandro],
  ["allows a Bendito attempt only once", () => canAttemptWord(0, ["bendito"], undefined) && !canAttemptWord(0, ["bendito"], "Girafa")],
  ["calculates remaining time", () => getRemainingTime(1500, 1000) === 500],
  ["formats timer values consistently", () => formatRemainingTime(120000) === "02:00" && formatRemainingTime(0) === "00:00"],
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
    const results = evaluateVotes(votes, roles, 1, [], "Pizza");
    return results.filter((result) => result.targetIndexes.length > 0).length === 2 && results.filter((result) => result.targetIndexes.length > 0).every((result) => result.correct);
  }],
  ["keeps exactly ten categories", () => Object.keys(categories).length === 10 && Boolean(categories.rioDeJaneiro)],
  ["keeps every category between fifty and one hundred words", () => Object.values(categories).every(({ pairs }) => pairs.length >= 50 && pairs.length <= 100)],
  ["keeps category keys in the class naming pattern", () => Object.keys(categories).every((key) => /^[a-z][A-Za-z0-9]*$/.test(key))],
  ["keeps unique words inside each category", () => Object.values(categories).every(({ pairs }) => {
    const words = pairs.map(({ word }) => word.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLocaleLowerCase());
    return new Set(words).size === words.length;
  })],
  ["keeps three distinct clues with at most two words on every word", () => allPairs.every(({ word, clues }) => clues.length === 3 && new Set(clues.map(normalizeWord)).size === 3 && clues.every((clue) => /^\S+(?:\s+\S+)?$/.test(clue.trim()) && normalizeWord(clue) !== normalizeWord(word)))],
  ["allows repeated clues and clues from another word", () => {
    const pairs = Array.from({ length: 50 }, (_, index) => ({
      word: `Palavra${index}`,
      clues: [`Dica${index}`, `Relação${index}`, `Pista${index}`]
    }));
    pairs[0].clues = ["Dica compartilhada", "Rio", "Sol"];
    pairs[1].clues = ["Dica compartilhada", "Calor intenso", "Praia"];
    return validateWordBank({ sample: { pairs } }, 1) === true;
  }],
  ["rejects a clue equal to its own word and clues over two words", () => !validateWordBank({ sample: { pairs: [{ word: "Praia", clues: ["Praia", "Areia fina", "Muito calor hoje"] }] } }, 1)],
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
