import { APP_VERSION } from "../script/version.js";

const output = document.querySelector("#test-output");
const versionPattern = /^\d+\.\d+\.\d+$/;
const item = document.createElement("li");

if (versionPattern.test(APP_VERSION) && APP_VERSION === "1.9.10") {
  item.textContent = `OK — mantém a versão semântica ${APP_VERSION}`;
  item.className = "passed";
} else {
  item.textContent = `FALHOU — versão inválida: ${APP_VERSION}`;
  item.className = "failed";
}

output.append(item);
