# TASK001 - Wave & Meta Progression Implementation

**Status:** Completed  
**Added:** 2025-11-29  
**Updated:** 2025-11-29

## Original Request

Design and implement explicit wave-based progression, a small achievement system, and meta-only persistence (score, upgrades, wave, achievements, settings) for Idle Bricks 3D, based on DESIGN001 Wave & Meta Progression.

## Thought Process

This task implements DESIGN001 by extending the central Zustand store (`useGameStore`) and lightly updating the UI. The goal is to keep all game rules in the store, let `GameScene` continue to focus on rendering and brick regeneration triggers, and have the UI remain a thin reader of progression state.

We will:

- Add new progression fields (wave, maxWaveReached, unlockedAchievements, settings) to `GameState`.
- Make brick generation wave-aware with gentle linear scaling of health and value.
- Advance the wave index and track max wave whenever a wave is cleared.
- Introduce a minimal, extensible achievement system keyed off score, bricks destroyed, waves, and upgrade levels.
- Persist only meta progression via localStorage, reconstructing bricks and balls on load rather than resuming mid-wave.
- Surface wave and achievements in the existing HUD with minimal layout changes.

## Implementation Plan

1. **Extend GameState for progression and settings**
   - Add `wave`, `maxWaveReached`, `unlockedAchievements`, and `settings` fields to `GameState` in `src/store/gameStore.ts`.
   - Initialize `wave = 1`, `maxWaveReached = 1`, `unlockedAchievements = []`, and an empty `settings` object.
   - Ensure initial bricks are created via a wave-aware generator (temporary wrapper until refactor in Step 2).

2. **Refactor brick generation to be wave-aware**
   - Update `createInitialBricks` in `src/store/gameStore.ts` to accept a `wave: number` parameter.
   - Keep the layout (rows, columns, layers, spacing) unchanged for now.
   - Apply gentle linear scaling to brick health and value, e.g., `scaled = base * (1 + factor * (wave - 1))` with an initial factor around `0.2`.
   - Update initial-state and regeneration call sites to pass the appropriate `wave`.

3. **Update regenerateBricks to advance waves**
   - Modify the `regenerateBricks` action to:
     - Compute `nextWave = wave + 1`.
     - Set `wave = nextWave`, `maxWaveReached = max(maxWaveReached, nextWave)`.
     - Replace `bricks` with `createInitialBricks(nextWave)`.
   - Optionally, award a small wave-clear score bonus based on `wave`.
   - Leave `GameScene` logic unchanged so it simply calls `regenerateBricks` when `bricks.length === 0`.

4. **Define achievements and unlock logic**
   - Introduce a static `ACHIEVEMENTS` list (in `src/store/gameStore.ts` or a small adjacent module) describing IDs, labels, descriptions, types, and thresholds.
   - Implement a pure helper `checkAndUnlockAchievements(state, changedHints)` that returns a list of newly unlocked IDs given the new state.
   - Integrate achievement checks into:
     - `damageBrick` (score and bricksDestroyed milestones).
     - `regenerateBricks` or a small `onWaveCleared` hook (wave milestones).
     - `upgradeBallDamage`, `upgradeBallSpeed`, `upgradeBallCount` (upgrade milestones).
   - Update `unlockedAchievements` in `GameState` to append new IDs, avoiding duplicates.

5. **Persist meta progression using Zustand persist**
   - Wrap the `useGameStore` creation in `src/store/gameStore.ts` with Zustand's `persist` middleware.
   - Configure a key such as `idle-bricks3d:game:v1` and a `partialize` function that stores only: `score`, `bricksDestroyed`, `wave`, `maxWaveReached`, `ballDamage`, `ballSpeed`, `ballCount`, `unlockedAchievements`, and `settings`.
   - Provide a `version` and, if needed, a `migrate` function to handle future schema changes.
   - On hydrate, reconstruct `bricks` and `balls` from the restored meta state (calling `createInitialBricks(wave)` and spawning the correct number of balls with current upgrades).
   - Guard against localStorage errors and invalid payloads by falling back to defaults.

6. **Expose wave and achievements in the UI**
   - In `src/components/UI.tsx`, subscribe to `wave`, `maxWaveReached`, and `unlockedAchievements` via `useGameStore`.
   - Update the score and/or stats panels to display the current wave and max wave.
   - Add a compact Achievements section showing `Achievements: X / N` and a short list of unlocked labels using the static definitions.
   - Keep UX changes minimal to avoid a full redesign.

7. **Add and update tests**
   - Extend existing tests in `src/test/gameStore.test.ts` and `src/test/gameStore.comprehensive.test.ts` to cover:
     - Wave increment and scaling behavior.
     - Achievement unlocking for each defined threshold.
     - Persistence behavior (partialization, hydration, and safe fallback).
   - Ensure all tests pass and that the new logic does not break existing upgrade or brick behavior.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                             | Status    | Updated    | Notes                                                                       |
| --- | ------------------------------------------------------- | --------- | ---------- | --------------------------------------------------------------------------- |
| 1.1 | Extend GameState with progression and settings fields   | Completed | 2025-11-29 | Implemented in `src/store/gameStore.ts`                                     |
| 2.1 | Make brick generation wave-aware with linear scaling    | Completed | 2025-11-29 | `createInitialBricks(wave)` implemented and used in regeneration            |
| 3.1 | Update regenerateBricks to manage wave advancement      | Completed | 2025-11-29 | `regenerateBricks` implemented, wave bonus applied                          |
| 4.1 | Implement achievements definitions and unlock helper    | Completed | 2025-11-29 | `ACHIEVEMENTS` and `checkAndUnlockAchievements` implemented                 |
| 4.2 | Wire achievement checks into store actions              | Completed | 2025-11-29 | Integrated into `addScore`, `damageBrick`, `regenerateBricks`, and upgrades |
| 5.1 | Add Zustand persist for meta progression                | Completed | 2025-11-29 | Persistence partialize and onRehydrateStorage implemented                   |
| 5.2 | Implement robust hydrate/fallback behavior              | Completed | 2025-11-29 | Guarding and clamping implemented in `onRehydrateStorage`                   |
| 6.1 | Update UI to display wave and achievements              | Completed | 2025-11-29 | HUD updated in `src/components/UI.tsx`                                      |
| 7.1 | Extend store tests for waves, achievements, persistence | Completed | 2025-11-29 | Tests added/extended under `src/test/`                                      |

## Progress Log

### 2025-11-29

- Task created from DESIGN001 Wave & Meta Progression.
- Implemented wave-aware brick generation, achievements, and Zustand persistence in `src/store/gameStore.ts`.
- Updated UI to show wave and achievements in `src/components/UI.tsx`.
- Added comprehensive tests validating scaling, unlocking, upgrade costs, regeneration, and persistence (`src/test/gameStore.*.ts`).
- Task marked Completed: code, tests, and UI are present and validated.
