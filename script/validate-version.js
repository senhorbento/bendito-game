import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const versionFile = "script/version.js";
const subject = process.argv[2] || "";
const type = subject.match(/^(feat|fix)(?:\([^)]*\))?:/)?.[1];
if (!type) fail("O commit deve começar com feat: ou fix:.");

const stagedFiles = getOutput(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]).split("\n").filter(Boolean);
const stagedVersionSource = getStagedFile(versionFile);
const current = parseVersion(stagedVersionSource, "APP_VERSION ausente ou inválida em script/version.js.");
const parent = getOutput(["rev-parse", "HEAD"]);
const previous = parseVersion(getCommittedFile(parent, versionFile), "Não foi possível ler a versão anterior.");
const expected = type === "feat"
  ? [previous[0], previous[1] + 1, previous[2]]
  : [previous[0], previous[1], previous[2] + 1];

if (!stagedFiles.includes(versionFile)) fail(`O commit ${type} deve alterar ${versionFile}.`);
if (current.join(".") !== expected.join(".")) {
  fail(`${type} exige versão ${expected.join(".")}; encontrada ${current.join(".")}.`);
}

if (type === "fix" && !stagedFiles.some((file) => /(^|\/)(script-test|tests?)(\/|\.)/.test(file))) {
  fail("Todo fix deve incluir um teste de regressão em script-test/.");
}

process.stdout.write(`Versão ${current.join(".")} validada para ${type}.\n`);

function getStagedFile(file) {
  try {
    return execFileSync("git", ["show", `:${file}`], { encoding: "utf8" });
  } catch {
    fail(`${file} precisa estar staged para validar o commit.`);
  }
}

function getCommittedFile(commit, file) {
  try {
    return execFileSync("git", ["show", `${commit}:${file}`], { encoding: "utf8" });
  } catch {
    fail(`${file} não existe no commit anterior ${commit}.`);
  }
}

function parseVersion(source, message) {
  const match = source.match(/APP_VERSION\s*=\s*["'](\d+)\.(\d+)\.(\d+)["']/);
  if (!match) fail(message);
  return match.slice(1).map(Number);
}

function getOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function fail(message) {
  process.stderr.write(`Validação de versão falhou: ${message}\n`);
  process.exit(1);
}
