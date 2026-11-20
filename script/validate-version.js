import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const versionFile = "script/version.js";
const versionSource = readFileSync(versionFile, "utf8");
const currentMatch = versionSource.match(/APP_VERSION\s*=\s*["'](\d+)\.(\d+)\.(\d+)["']/);
if (!currentMatch) fail("APP_VERSION ausente ou inválida em script/version.js.");

const current = currentMatch.slice(1).map(Number);
const parent = process.argv[2] || "HEAD^";
const subject = process.argv[3] || "";
const type = subject.match(/^(feat|fix)(?:\([^)]*\))?:/)?.[1];
if (!type) fail("O commit deve começar com feat: ou fix:.");

let previousSource;
try {
  previousSource = execFileSync("git", ["show", `${parent}:${versionFile}`], { encoding: "utf8" });
} catch {
  process.stdout.write("Versionamento inicial: nenhuma versão anterior encontrada.\n");
  process.exit(0);
}

const previousMatch = previousSource.match(/APP_VERSION\s*=\s*["'](\d+)\.(\d+)\.(\d+)["']/);
if (!previousMatch) fail("Não foi possível ler a versão anterior.");
const previous = previousMatch.slice(1).map(Number);
const expected = type === "feat"
  ? [previous[0], previous[1] + 1, previous[2]]
  : [previous[0], previous[1], previous[2] + 1];

if (current.join(".") !== expected.join(".")) {
  fail(`${type} exige versão ${expected.join(".")}; encontrada ${current.join(".")}.`);
}

if (type === "fix") {
  const changedFiles = execFileSync("git", ["diff-tree", "--no-commit-id", "--name-only", "-r", parent, "HEAD"], { encoding: "utf8" });
  if (!changedFiles.split("\n").some((file) => /(^|\/)(script-test|tests?)(\/|\.)/.test(file))) {
    fail("Todo fix deve incluir um teste de regressão em script-test/.");
  }
}

process.stdout.write(`Versão ${current.join(".")} validada para ${type}.\n`);

function fail(message) {
  process.stderr.write(`Validação de versão falhou: ${message}\n`);
  process.exit(1);
}
