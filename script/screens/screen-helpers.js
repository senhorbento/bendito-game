export function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function createButton(text, className = "button", handler, disabled = false) {
  const button = createElement("button", className, text);
  button.type = "button";
  button.disabled = disabled;
  if (handler) button.addEventListener("click", handler);
  return button;
}

export function appendVersionFooter(screen, version) {
  screen.append(createElement("small", "app-version", `BENDITO · versão ${version}`));
}
