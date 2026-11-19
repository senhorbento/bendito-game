# Bendito

Bendito is a mobile-first social deduction party game. Most players receive the same secret word, while Benditos receive a related clue. After a discussion, the players vote to identify the Benditos.

## Features

- Brazilian Portuguese player interface.
- Mobile-first responsive layout.
- Vanilla HTML, CSS, and JavaScript.
- Local food word bank with 20 word-and-clue pairs.
- Private word and clue reveal flow.
- Two-minute discussion timer.
- Private pass-the-device voting.
- Benditos are excluded from voting.
- Round results with vote evaluation.
- New rounds with new assignments.
- Recovery through `localStorage`.
- No image assets or external runtime dependencies.

## Run locally

Serve the project directory with any static web server. For example:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in a modern browser.

Opening `index.html` directly with `file://` may prevent ES modules from loading in some browsers.

## Tests

The lightweight browser test runner is available at:

```text
script-test/test-runner.html
```

JavaScript syntax can also be checked with Node.js:

```bash
node --check script/app.js
node --check script/game-rules.js
node --check script/game-state.js
node --check script/persistence.js
node --check script/timer.js
node --check script/word-bank.js
node --check script/categories/food.js
```

## Project structure

```text
├── assets/
├── index.html
├── script/
│   ├── categories/
│   │   └── food.js
│   ├── app.js
│   ├── game-rules.js
│   ├── game-state.js
│   ├── persistence.js
│   ├── timer.js
│   └── word-bank.js
├── script-test/
├── styles/
└── CNAME
```

The custom domain configured for GitHub Pages is `bendito.senhorbento.com.br`.
