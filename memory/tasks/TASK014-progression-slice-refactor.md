# TASK014 - Progression Slice Refactor (DESIGN012)

**Status:** Pending
**Added:** 2025-12-05
**Updated:** 2025-12-05

## Original Request

Create a task for DESIGN012 — Refactor `src/store/slices/progression.ts` into smaller modules and a composed slice.

Summary: Split `progression.ts` into focused modules under `src/store/slices/progression/` (score, upgrades, prestige, hits, index), add unit tests, and maintain API parity. Migrate side-effects (effectBus) behind a small adapter where needed for testability.

## Thought Process

- `progression.ts` currently mixes scoring, upgrades, prestige, and hits logic; splitting increases testability and clarity.
- The design aims to extract pure helpers (score math, cost math) and keep the slice's public API identical to avoid consumer changes.
- Side-effects (calls to `effectBus.emit`) should be wrapped behind an adapter so tests can mock or assert emissions.
- Avoid subtly changing behavior: keep control-flow identical and add regression tests for `applyHits` and `performPrestige`.

## Implementation Plan

1. Create `src/store/slices/progression/` with the following modules:
   - `score.ts`: `addScore`, `calculateScoreFromBrick`, and scoring helpers.
   - `upgrades.ts`: cost calculators and upgrade actions (`upgradeBallDamage`, `upgradeBallSpeed`, `upgradeBallCount`), `updateBallDamages`, `updateBallSpeeds` integration.
   - `prestige.ts`: `getPrestigeReward`, `performPrestige`, and state reset helpers.
   - `hits.ts`: `damageBrick`, `applyHits`, `resetCombo`, and combo logic; add a small `effects` wrapper to isolate `effectBus.emit`.
   - `index.ts`: `createProgressionSlice` which composes the modules and re-exports public API used by `createStore.ts`.
2. Extract pure helpers and add unit tests for `score`, `upgrades`, `prestige`, and `hits`.
3. Replace `src/store/slices/progression.ts` with a thin adapter that re-exports from `progression/` (or update imports to new path), while keeping the public API identical.
4. Add integration tests around common scenarios (score accumulation, upgrades, `performPrestige`, and `applyHits` combos) to detect regressions.
5. Run `npm run typecheck`, `npm run lint`, `npm run test:run`, and `npm run build` to verify parity.

## Testing Plan

- Unit tests per module validating math (score, costs), upgrades, and prestige behavior.
- Integration tests for `createProgressionSlice` parity across scenario scripts: e.g., sequence: add score → purchase upgrade → hit bricks → perform prestige → validate resets and awarded crystals.
- Add regression tests for `applyHits` and combo ordering (ensure identical behavior).

## Progress Tracking

**Overall Status:** Pending — 0%

### Subtasks

| ID  | Description                                                    | Status     | Updated    | Notes |
| --- | -------------------------------------------------------------- | ---------- | ---------- | ----- |
| 1.1 | Create `progression/` folder and stub modules                   | Not Started| 2025-12-05 |       |
| 2.1 | Move helpers to `score.ts` and add unit tests                   | Not Started| 2025-12-05 |       |
| 2.2 | Move upgrade logic to `upgrades.ts` and add unit tests          | Not Started| 2025-12-05 |       |
| 2.3 | Move prestige logic to `prestige.ts` and add unit tests         | Not Started| 2025-12-05 |       |
| 2.4 | Move hits/combo logic to `hits.ts` and adapt effects wrapper     | Not Started| 2025-12-05 |       |
| 3.1 | Replace `progression.ts` with composed `index.ts` adapter       | Not Started| 2025-12-05 |       |
| 4.1 | Add integration tests for parity scenarios                      | Not Started| 2025-12-05 |       |
| 5.1 | Run full validation suite & CI updates                          | Not Started| 2025-12-05 |       |

## Progress Log

### 2025-12-05

- Task created to track DESIGN012: Progression slice refactor.

---

**References:**

- Design doc: [DESIGN012 — Progression Slice Refactor](../designs/DESIGN012-progression-slice-refactor.md)
