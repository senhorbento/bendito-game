# Bendito - Project Instructions

## 1. Project Overview

**Bendito** is a mobile-first social deduction party game. The objective
is for the players to identify who does not belong to the group.

At the beginning of each round, most players receive the same secret
word. The Bendito players receive a clue related to that word instead.
Players discuss the topic and then vote to identify the Bendito players.

The game interface and all player-facing content must be written in
**Brazilian Portuguese (pt-BR)**. This instruction document is written
in English.

## 2. Technology Constraints

-   Use only vanilla HTML, CSS, and JavaScript.
-   Do not introduce frameworks, UI libraries, build tools, package
    managers, or backend services unless explicitly requested.
-   The game must run in a modern mobile browser.
-   Build the experience mobile-first, while keeping it usable on
    desktop browsers.
-   Store the word bank locally in JavaScript files.
-   Persist the current game state locally so an interrupted game can be
    restored after a page refresh or browser restart. Use an appropriate
    browser storage mechanism such as `localStorage`.
-   Do not require an internet connection for core gameplay.

## 3. Required Project Structure

Keep the project inside `Bendito-Game/` and use this structure:

``` text
Bendito-Game/
├── index.html
├── assets/
├── script/
│   ├── categories/
│   └── ...
├── script-test/
└── styles/
```

-   `index.html` is the application entry point.
-   `assets/` contains image and other static visual assets.
-   `script/` contains application JavaScript.
-   `script/categories/` contains separate word-bank files, organized by
    category.
-   `script-test/` contains automated tests.
-   `styles/` contains CSS files.
-   You may create additional files and subdirectories inside
    `Bendito-Game/` whenever useful.
-   You may freely use commands to create, move, or edit files and
    directories, provided all project files remain inside
    `Bendito-Game/`.

## 4. Product Language and Visual Identity

### Language

-   All visible game text, labels, buttons, instructions, validation
    messages, and accessibility labels must be in Brazilian Portuguese.
-   Use natural, concise Brazilian Portuguese for the visual interface only.
-   All code must be written in English, including identifiers, variables,
    functions, module names, constants, and code comments.
-   Keep filenames and technical documentation in English unless there is
    a strong project-specific reason not to.

### Visual direction

-   Redesign the interface as a polished mobile party game, never as a
    Windows Forms application, dashboard, CRUD interface, business tool, or
    traditional desktop website.
-   Use an original visual direction inspired by a tropical nightlife,
    neon-lit Vice City atmosphere: summer nights, sunsets, urban culture,
    street aesthetics, digital art, and generative visual elements.
-   Use this design-system palette: Neon Pink `#FF4FA3`, Deep Purple
    `#7138B8`, Electric Blue `#36B9E9`, Sunset Orange `#FF873D`, Tropical
    Yellow `#F9D65C`, Dark Background `#171522`, and Warm White `#FFF4E8`.
-   Prefer dark backgrounds with deliberate neon accents. Gradients may
    combine pink, purple, orange, and blue, but do not use every color in
    every component; preserve hierarchy and consistency.
-   The Bendito logo must be a clearly legible, graffiti-inspired mark that
    combines street art with modern digital culture. Do not copy GTA logos,
    artwork, characters, or other protected assets.
-   Use expressive typography for headings and branding, paired with a
    clean, readable sans-serif for functional interface text. Avoid generic
    system fonts and default browser typography when choosing visual assets
    or local fonts.
-   Use layered surfaces, transparency, gradients, rounded or custom shapes,
    subtle neon glows, and shadows instead of generic white rectangles or
    excessive borders.
-   Use full viewport layouts with safe-area support, no horizontal scroll,
    large touch targets, generous spacing, clear thumb-reachable actions,
    and portrait-first responsive behavior that also works in landscape.
-   Add lightweight transitions, pressed states, reveal effects, countdown
    motion, and result feedback only where they improve the game experience.
    Respect `prefers-reduced-motion` and avoid distracting animation.
-   Keep all visual effects readable and practical on small screens.
-   Do **not** include written labels such as "AI GENERATED" or equivalent
    claims in the interface.

## 5. Game Flow and Screens

Implement the following screen sequence.

### Screen 1: Home

-   Display only the Bendito logo and a button labeled **"Jogar"**.
-   The logo should be graffiti-inspired.
-   Keep this screen visually focused and uncluttered.
-   Tapping "Jogar" opens the participant setup screen.

### Screen 2: Participant Setup

-   Allow the user to add participant names to a list.
-   Each newly added participant must appear as a new list row.
-   Allow participants to be removed.
-   Allow the list to be reordered.
-   Each name must contain no more than 20 characters.
-   Require at least 3 players to start a game.
-   The **"Iniciar"** button must remain disabled until the minimum
    player count is reached.
-   Allow the user to configure the number of Benditos once the minimum
    player count has been reached.
-   The initial number of Benditos is always 1 once there are at least 3
    participants. The maximum allowed number increases with the participant
    count while always preserving at least one regular player: 3 players
    allow only 1 Bendito, 4 players allow up to 2, and larger groups allow
    up to participant count minus 1. The game must always have at least one
    non-Bendito player.
-   Make the selected number of Benditos clear before the game starts.
-   Preserve the participant list when the user returns to this screen
    from the results screen.

### Screen 3: Private Word Reveal

-   Show participants one at a time, following the participant list
    order.
-   Initially show only the current participant's name and an
    instruction to swipe upward.
-   When the participant swipes upward, reveal their assigned secret:
    -   Regular players see the main word.
    -   Benditos see the clue associated with the main word.
-   The secret must be hidden before handing the device to the next
    participant.
-   Provide a clear way to proceed after the participant has viewed
    their secret.
-   Do not expose another participant's secret during transitions.
-   Continue until every participant has viewed their assigned secret.
-   Ensure the reveal interaction works with touch input on mobile and
    remains usable with a mouse or keyboard on desktop.

### Screen 4: Discussion Timer

-   Start a 2-minute countdown only after all participants have viewed
    their secrets.
-   Before the countdown begins, randomly select one participant to start
    speaking and display that participant's name above the timer.
-   Display the remaining time clearly.
-   Provide an action to move to the voting screen before the 2 minutes
    expire, in addition to automatically moving there when the timer reaches
    zero.
-   Avoid relying only on a running in-memory interval for timer
    correctness. Store enough timing information to restore the correct
    remaining time after a refresh.

### Screen 5: Voting

-   Voting takes place on the same device, which is passed from
    participant to participant.
-   Before each participant's voting step, display a neutral transition
    screen with that participant's name and a button to begin voting. This
    prevents the participant's role from being inferred while the device is
    passed between players.
-   Each participant gets a private voting step after pressing the voting
    button.
-   A participant must not be able to vote for themselves.
-   Votes must remain secret. Do not display vote counts, previous
    selections, or voting results before the final results screen.
-   Benditos do not cast a vote.
-   When a Bendito reaches their voting step, show an instruction or
    notice telling them that they are the Bendito and do not need to
    vote. Do not record a vote for them.
-   The voting flow must still acknowledge and complete the Bendito's
    step so the device can be passed to the next participant.
-   A vote is complete only when every eligible non-Bendito participant
    has voted.
-   Do not reveal the identity of any Bendito or any vote before all
    required voting steps are complete.
-   Prevent duplicate votes and invalid selections.
-   After voting is complete, proceed to the results screen.

### Screen 6: Results

-   Reveal all Bendito players.
-   Show which participants voted correctly.
-   Keep the results clear and easy to understand.
-   Provide two actions:
    -   **"Jogar novamente"**: start a new round with the same
        participants and configured player count, but select a new
        word/clue pair and new Bendito players.
    -   **"Alterar jogadores"**: return to participant setup.
-   A new round must not reuse the previous round's assignments. Avoid
    repeating the previous word immediately when other valid word pairs
    are available.

## 6. Word Bank

-   Store all word and clue data locally in JavaScript.
-   Organize the bank into separate JavaScript files by category under
    `script/categories/`.
-   Every category must contain exactly 50 word-and-clue entries.
-   The initial categories are food, animals, places, sports, movies, and
    objects; adding another category must not require changing the game
    engine.
-   After participant setup, allow the user to select exactly one category
    or choose the random category option. Persist the selected mode for the
    active round and use it when starting a new round.
-   Each entry must associate one main word with a clue consisting of
    exactly one related word, without being identical to or an obvious
    spelling variation of the main word.
-   Keep the data structure consistent across categories.
-   Select a valid word/clue pair for each round.
-   Avoid selecting a clue that is identical to, or an obvious spelling
    variation of, the main word.
-   Make it straightforward to add new categories and entries without
    changing the game engine.
-   The game must work without an external API.

Example data shape (the exact implementation may be adapted):

``` js
export const animals = [
  {
    word: "Girafa",
    clue: "Savanna"
  }
];
```

## 7. Game Rules and State

-   There must be at least 3 participants.
-   There must always be at least one Bendito and at least one regular
    player.
-   The main word is shared by all regular players in a round.
-   All Benditos in a round receive the clue associated with that main
    word.
-   Each participant may see only their own assignment during the reveal
    flow.
-   The voting phase starts only after the 2-minute discussion timer has
    ended.
-   Benditos are excluded from voting, but their turn in the
    pass-the-device flow must still be shown and acknowledged.
-   A player cannot vote for themselves.
-   Votes and assignments remain private until the results screen.
-   The results screen identifies every Bendito and every participant
    who voted correctly.

## 8. Persistence and Recovery

The game must recover its current state if the page is refreshed or the
browser is closed and reopened.

Persist the information needed to restore the active round, including as
applicable:

-   Current screen or game phase.
-   Participant names and their order.
-   Configured number of Benditos.
-   Main word and clue for the active round.
-   Participant role assignments.
-   Current participant index in the reveal flow.
-   Discussion timer start/end information or equivalent timestamp data.
-   Current participant index in the voting flow.
-   Votes already submitted.
-   Any other state required to resume without losing progress.

Recovery requirements:

-   Restore the game to the correct phase and step.
-   Restore the correct remaining timer duration, accounting for time
    elapsed while the page was closed.
-   Do not reveal secrets belonging to other participants during
    recovery.
-   Do not discard votes already submitted.
-   Clear or replace persisted round data only when the user
    intentionally starts a new round, returns to participant setup in a
    way that resets the game, or otherwise confirms an action that
    should discard the current round.
-   Handle missing, malformed, or outdated stored data safely. If
    recovery is impossible, return to a safe screen without crashing.

## 9. Testing and Bug Fix Policy

Testing is a required part of development, not an optional final step.

-   Create tests for core functions and basic game rules.
-   Cover participant validation, name length, player-count validation,
    Bendito-count validation, role assignment, word selection, secret
    assignment, voting restrictions, vote evaluation, timer
    calculations, and state persistence/recovery.
-   Whenever a bug is found and fixed, add a new regression test that
    reproduces the bug and verifies the fix.
-   Do not consider a bug fixed until its regression test passes.
-   Keep tests in `script-test/`.
-   Prefer tests that can run locally in a browser or with a lightweight
    test harness without introducing a framework dependency.
-   Keep application logic modular and testable. Avoid tightly coupling
    game rules to DOM manipulation.
-   Run the relevant tests after changes and run the full test suite
    when practical.
-   Do not remove or weaken an existing test merely to make a change
    pass.

## 10. Code Quality and Implementation Practices

-   Use clear, descriptive names for variables and functions.
-   Keep modules focused and avoid unnecessarily large files.
-   Separate game logic, state management, persistence, UI rendering,
    and word-bank data.
-   Avoid duplicating business rules in multiple places.
-   Validate user input before using or persisting it.
-   Handle unexpected or invalid state without crashing the application.
-   Keep DOM updates predictable and avoid unsafe HTML insertion for
    user-provided names.
-   Do not add dependencies without a clear need and explicit approval.
-   Do not add backend functionality or external services.
-   Keep the application responsive and optimize for touch interaction.
-   Ensure buttons and interactive controls have practical touch
    targets.
-   Respect reduced-motion preferences where animations are used.
-   Do not add code comments unless they are necessary to explain a
    genuinely non-obvious implementation detail.

## 11. Development Workflow

When working on this project:

1.  Inspect the entire existing application, project structure, relevant
    files, current screen structure, and shared UI components before
    changing any file.
2.  For a visual redesign, identify CSS and DOM patterns that cause a
    desktop-form, dashboard, or generic CRUD appearance.
3.  Before implementing a visual redesign, identify required assets,
    fonts, and visual resources, then present a visual implementation plan
    and wait for the project owner's approval.
4.  Preserve existing game logic and working functionality unless a product
    requirement explicitly calls for changing it. Visual work must not
    modify game rules, voting behavior, assignments, persistence, or timer
    logic.
5.  Make focused changes that fit the existing architecture and keep the
    project structure consistent with this document.
6.  Use responsive CSS and necessary DOM adjustments for visual work, without
    introducing frameworks, UI libraries, or unnecessary dependencies.
7.  Add or update tests alongside implementation changes.
8.  Run the existing automated tests and verify every affected user flow.
9.  Test visual changes on mobile-sized viewports in portrait and landscape,
    checking touch targets, safe areas, readability, overflow, transitions,
    and reduced-motion behavior.
10. For every bug fix, add a regression test.
11. Keep all created and modified project files inside `Bendito-Game/`.
12. After every change, create a git commit and push it to the configured
    remote repository.
13. Do not generate or rewrite this `CLAUDE.md` unless explicitly asked
    by the project owner.

## 12. Product Owner Decisions

The following decisions are explicit requirements:

-   The game is called **Bendito**.
-   The product is mobile-first.
-   The application uses only HTML, CSS, and vanilla JavaScript.
-   The player-facing language is Brazilian Portuguese.
-   The home screen contains only the Bendito logo and the "Jogar"
    button.
-   The minimum number of participants is 3.
-   Names are limited to 20 characters.
-   The participant list can be reordered.
-   The initial number of Benditos is always 1 for a valid group. The user
    may increase it with the interface controls within valid bounds: 3
    participants allow only 1 Bendito, and larger groups increase the
    maximum while always keeping at least one regular player.
-   There is no fixed maximum number of participants. The interface must
    remain usable with long participant lists through appropriate scrolling
    and layout behavior.
-   Secrets are revealed one participant at a time through a primary tap
    interaction labeled "Toque para revelar sua palavra", with accessible
    keyboard support and optional gesture support.
-   The discussion timer lasts 2 minutes.
-   Voting is performed by passing one device between participants.
-   Benditos do not vote, but their voting step is still displayed with
    an instruction that they do not need to vote.
-   Before each voting step, show only the participant's name and a neutral
    button to begin voting; do not reveal whether that participant is a
    Bendito on this transition screen.
-   Participants cannot vote for themselves.
-   Each regular participant casts one vote for one participant, and a vote
    is correct when its target is any Bendito.
-   Votes remain secret until the results screen.
-   A new round reuses the same participants but generates new
    assignments.
-   The game state must be recoverable after refresh or reopening the
    browser.
-   The word bank is local and split into category-specific JavaScript
    files.
-   A regression test must be added for every bug fix.
-   The project owner authorizes creating files and directories freely
    inside `Bendito-Game/`.
