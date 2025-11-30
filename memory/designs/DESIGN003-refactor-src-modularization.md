# DESIGN003 — Refactor: modularize `src/` (store & components)

**Status:** Proposed
**Author:** GitHub Copilot
**Date:** 2025-11-30

## Context

`src/store/gameStore.ts` and several components (notably `BricksInstanced.tsx` and `UI.tsx`) are the largest, most complex files in the codebase. They mix concerns (types, constants, pure helpers, rendering, pointer handling, persistence, and business rules), which increases cognitive load, makes unit testing harder, and slows incremental refactors. This design describes a small, testable, incremental approach to modularize those areas while preserving existing behavior.

## Goals

- Reduce file size and responsibility of `src/store/gameStore.ts` by extracting types, constants, creators, achievements, and persistence into separate modules.
- Improve testability by isolating pure logic (achievement rules, creation helpers, collision math) into small files with unit tests.
- Reduce re-render scope and complexity for `UI.tsx` and `BricksInstanced.tsx` by splitting them into focused components/hooks.
- Keep runtime behavior and persisted schema unchanged (backwards-compatible persistence key and partial state shape preserved).

## Non-Goals

- Large UI redesigns or gameplay changes.
- Changing persisted storage format (we will maintain `STORAGE_KEY` and partialize contract).

## Requirements (EARS-style)

1. WHEN the application initializes, THE SYSTEM SHALL preserve existing persisted game state and rehydrate into the store without changing external storage keys. [Acceptance: existing tests that exercise rehydration continue to pass]
2. WHEN a developer needs to change achievement rules, THE SYSTEM SHALL allow editing/adding rules in a single `achievements` module with unit tests. [Acceptance: achievement logic tests cover unlocking rules]
3. WHEN `BricksInstanced` pointer events run, THE SYSTEM SHALL only perform instance lookup and color updates — hover bookkeeping should be handled by a small hook to simplify the component. [Acceptance: pointer/hover behavior preserved; smoke test runs]
4. WHEN refactoring is performed incrementally, THE SYSTEM SHALL allow imports to be updated with minimal churn by keeping the `useGameStore` API surface unchanged. [Acceptance: app behavior unchanged and tests green]

## Proposed Module Layout

- `src/store/`
  - `types.ts` — `Brick`, `Ball`, `Upgrade`, `GameState` interfaces and small shared types.
  - `constants.ts` — `ARENA_SIZE`, `BRICK_COLORS`, defaults (BALL_SPEED, BALL_DAMAGE, ...), `ACHIEVEMENTS` definitions.
  - `createInitials.ts` — `createInitialBricks`, `createInitialBall`, `scaleForWave`.
  - `achievements.ts` — `getAchievementView`, `meetsAchievement`, `checkAndUnlockAchievements`, exported helpers with unit tests.
  - `persistence.ts` — persistence-related helpers and custom storage adapter used by `persist` middleware (move meta-key logic and `onRehydrateStorage` implementation here).
  - `gameStore.ts` — thin composition: imports the above modules, composes the `persist` config, and defines action handlers that call small helpers. Keep the exported `useGameStore` API identical.

- `src/components/bricks/` (new folder)
  - `BricksInstanced.tsx` — rendering-only component that maps `bricks` to the instanced mesh and exposes pointer handlers.
  - `useInstancedBricks.ts` — hook for hover bookkeeping, color application, and instance updates; encapsulates `tempObject` and `tempColor` usage.
  - `utils.ts` — `getDamageColor` and small helpers with unit tests.

- `src/components/ui/` (new folder)
  - `UI.tsx` — top-level composition that imports the split panels.
  - `ScorePanel.tsx`, `StatsPanel.tsx`, `UpgradesPanel.tsx`, `AchievementsPanel.tsx`, `Controls.tsx` — focused presentational components each selecting only the slice of state they need.
  - `useKeyboardShortcuts.ts` — keyboard binding hook used by `UI` or `Controls`.

- `src/engine/`
  - Keep `collision.ts` but move small math functions into `collision/math.ts` or split constants out if helpful.
  - Extract `stepBallFrame` tests if missing.

## Data Flow / Interaction Notes

- `gameStore.ts` remains the single source of truth for runtime state and actions. The refactor is internal organization only — components continue to call `useGameStore` selectors and actions unchanged.
- Pure logic (achievements, createInitials) must have no side-effects and be fully testable in isolation.
- `persistence.ts` must implement the same `storage` contract (including the `:meta` companion key behavior).

## Incremental Implementation Plan (tasks)

1. Extract `types.ts` and `constants.ts` (low-risk). Update `gameStore.ts` imports. Run typecheck/tests.
   - Acceptance: compile passes; no behavior change.
2. Extract `createInitials.ts` (createInitialBricks/createInitialBall) and `achievements.ts`. Add unit tests for `achievements.ts` logic. Update imports.
   - Acceptance: new unit tests pass, no behavior change in app.
3. Extract `persistence.ts` and move `onRehydrateStorage` callback and custom storage adapter into it. Keep `STORAGE_KEY` unchanged. Validate rehydration tests (there are rehydration tests in repo).
   - Acceptance: `rehydration.test.ts` passes.
4. Small refactor of `gameStore.ts` action handlers to call out to pure helpers where it simplifies logic (e.g., score/achievement merging). Keep `useGameStore` export identical.
   - Acceptance: existing store tests pass.
5. Split `BricksInstanced` into `useInstancedBricks` + small rendering component. Add unit tests for `getDamageColor` and the hook logic where practical (mock an `InstancedMesh` or test pure utilities).
   - Acceptance: pointer/hover behavior in e2e smoke tests unchanged.
6. Split `UI.tsx` into panels and `useKeyboardShortcuts`, confirm smaller component sizes and reduced re-renders using `useGameStore` selectors.
   - Acceptance: existing UI tests pass and manual smoke test shows same UI.

Notes on ordering: steps 1–3 reduce the size of `gameStore.ts` and are safe first moves. UI & Bricks splitting may be done after the store is modularized so imports are cleaner.

## Acceptance Criteria

- All existing tests in `src/test` continue to pass (especially `rehydration.test.ts`, `gameStore.test.ts`, and `gameStore.comprehensive.test.ts`).
- The app runs locally with identical behavior (manual quick smoke test).
- New unit tests added for `achievements` and `getDamageColor`.
- File sizes: Aim to keep files under ~300 lines where logical (not a hard rule, but a guideline to reduce cognitive load).

## Risks & Mitigations

- Risk: Rehydration timing and side-effects (current code uses setTimeout deferred logic). Mitigation: keep `onRehydrateStorage` behavior intact; move only logic, not scheduling semantics.
- Risk: Import churn may cause many small edits. Mitigation: do this in a dedicated branch and perform automated grep/replace with careful review; run `npm run typecheck` to catch broken imports.

## Testing & Validation

- Run typecheck and full unit tests after each step.

```bash
npm run typecheck
npm run test:run
```

- Perform a quick local dev run and verify: spawn balls, achievements unlock, UI updates, and rehydration after refresh.

## Implementation Notes & Conventions

- Keep existing public API of `useGameStore` stable.
- Prefer `interface` over `type` for object shapes in `types.ts` per project guidelines.
- Add tests in `src/test` alongside modules or in `src/test/unit` following repo conventions.

---

This design is intentionally incremental: start with low-risk extracts (`types`, `constants`, `createInitials`) and add tests before touching persistence or UI. If you want, I can open a branch and implement Step 1 (`types` + `constants`), run tests, and open a PR. 
