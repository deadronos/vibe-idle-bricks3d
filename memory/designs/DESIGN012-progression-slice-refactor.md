# DESIGN012 — Progression Slice Refactor

**Status:** Proposed  
**Date:** 2025-12-05

Summary
- `src/store/slices/progression.ts` implements a broad set of gameplay progression mechanics (scoring, upgrades, prestige, combo logic, applyHits). Splitting into smaller focused modules improves testability and clarity.

Requirements (EARS)
- WHEN the player gains score (via `addScore` or brick destroy), THE SYSTEM SHALL apply `prestigeMultiplier` and update achievements. [Acceptance: tests asserting `addScore` multiplies and triggers achievement checks]
- WHEN the player purchases an upgrade (damage/speed/count), THE SYSTEM SHALL deduct cost, update stats, and adjust existing entities (balls) accordingly. [Acceptance: unit tests for each upgrade path]
- WHEN `performPrestige` is invoked, THE SYSTEM SHALL reset progression state while awarding `vibeCrystals` and updating `prestigeMultiplier`. [Acceptance: tests for `performPrestige` snapshot and derived values]

Proposed module split (folder `src/store/slices/progression/`)
- `score.ts` — `addScore`, `calculateScoreFromBrick` helpers, scoring-related helpers and tests.
- `upgrades.ts` — cost calculators (`getBallDamageCost`, `getBallSpeedCost`, `getBallCountCost`) and upgrade actions (`upgradeBallDamage`, `upgradeBallSpeed`, `upgradeBallCount`). Unit tests validate cost math and state updates (including `updateBallDamages` and `updateBallSpeeds` usage).
- `prestige.ts` — `getPrestigeReward`, `performPrestige` logic and tests. Keep `buildInitialState` usage centralized.
- `hits.ts` — `damageBrick`, `applyHits`, `resetCombo`, and combo logic; moves `effectBus.emit` calls behind a small `effects` helper to make testing side-effects easier.
- `index.ts` — `createProgressionSlice` that composes the other modules and returns the final slice function used by `createStore.ts`.

Implementation plan (tasks)
1. Create `src/store/slices/progression/` and add modules above.
2. Move pure helpers (cost math, score calc) into their modules and add unit tests.
3. Replace `createProgressionSlice` implementation with a composed implementation that calls into modules above. Keep external API identical.
4. Run tests and adjust for parity.

Testing plan
- Unit tests per module: `score`, `upgrades`, `prestige`, `hits`.
- Integration test: `createProgressionSlice` returns the same behavior as previous version for a set of scenario scripts (upgrade + prestige + brick hits).

Migration strategy
- Extract helpers first and leave `createProgressionSlice` as a thin shim that delegates to the new modules.
- After tests green, fully replace `progression.ts` with `index.ts` and move file path if desired.

Acceptance criteria
- No consumer-facing changes required.
- Tests verify upgrade cost math and prestige reward unchanged.
- Side-effects (effectBus emissions) are accessible via a single small adapter and can be mocked in tests.

Risks & mitigations
- Risk: ordering changes in `applyHits` or combo logic. Mitigate by bringing over identical control-flow code and adding regression tests.
- Risk: subtle rounding differences in cost/payout math. Mitigate with numeric tests around thresholds.

Notes
- Keep `updateBallDamages` and `updateBallSpeeds` co-located (or export from `balls.ts`) to avoid duplication.
- Prefer small PRs per module extraction to make review easier.