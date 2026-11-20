import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const versionFile = "script/version.js";
const versionSource = readFileSync(versionFile, "utf8");
const current = parseVersion(versionSource, "APP_VERSION ausente ou inválida em script/version.js.");
const parent = process.argv[2] || "HEAD^";
const subject = process.argv[3] || "";
const type = subject.match(/^(feat|fix)(?:\([^)]*\))?:/)?.[1];
if (!type) fail("O commit deve começar com feat: ou fix:.");

const previous = getVersionAtCommit(parent);
const expected = type === "feat"
  ? [previous[0], previous[1] + 1, previous[2]]
  : [previous[0], previous[1], previous[2] + 1];

if (current.join(".") !== expected.join(".")) {
  fail(`${type} exige versão ${expected.join(".")}; encontrada ${current.join(".")}.`);
}

if (type === "fix") {
  const stagedFiles = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], { encoding: "utf8" });
  if (!stagedFiles.split("\n").some((file) => /(^|\/)(script-test|tests?)(\/|\.)/.test(file))) {
    fail("Todo fix deve incluir um teste de regressão em script-test/.");
  }
}

validateHistory(parent);
process.stdout.write(`Versão ${current.join(".")} validada para ${type}.\n`);

function getVersionAtCommit(commit) {
  let source;
  try {
    source = execFileSync("git", ["show", `${commit}:${versionFile}`], { encoding: "utf8" });
  } catch {
    fail(`Não foi possível encontrar ${versionFile} em ${commit}.`);
  }
  return parseVersion(source, `Versão inválida em ${commit}.`);
}

function validateHistory(commit) {
  const commits = execFileSync("git", ["rev-list", "--reverse", commit], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  let previousVersion = null;
  commits.forEach((hash) => {
    let source;
    try {
      source = execFileSync("git", ["show", `${hash}:${versionFile}`], { encoding: "utf8" });
    } catch {
      previousVersion = null;
      return;
    }
    const version = parseVersion(source, `Versão inválida em ${hash}.`);
    if (previousVersion && version.some((value, index) => value < previousVersion[index])) {
      fail(`A versão retrocedeu no histórico em ${hash}: ${version.join(".")}.`);
    }
    previousVersion = version;
  });
}

function parseVersion(source, message) {
  const match = source.match(/APP_VERSION\s*=\s*["'](\d+)\.(\d+)\.(\d+)["']/);
  if (!match) fail(message);
  return match.slice(1).map(Number);
}

function fail(message) {
  process.stderr.write(`Validação de versão falhou: ${message}\n`);
  process.exit(1);
}
