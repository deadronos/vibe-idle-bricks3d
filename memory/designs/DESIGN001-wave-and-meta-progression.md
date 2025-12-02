# DESIGN001 - Wave & Meta Progression

**Status:** Completed  
**Created:** 2025-11-29  
**Updated:** 2025-11-29

## Summary

Introduce explicit wave-based progression, a small achievement system, and meta-only persistence so that players feel long-term growth across sessions without resuming mid-wave state. All gameplay rules remain centralized in `useGameStore`, and React components stay as thin views over store data.

## Requirements (EARS)

1. WHEN all bricks in the current wave are destroyed, THE SYSTEM SHALL increment a wave index and regenerate a new wave of bricks with gently increased health and value.
2. WHEN a new wave starts, THE SYSTEM SHALL preserve the player score and upgrades while scaling brick difficulty linearly with the wave number.
3. WHEN the player reaches specific score, bricks-destroyed, wave, or upgrade thresholds, THE SYSTEM SHALL unlock corresponding achievements and expose them for display in the UI.
4. WHEN the player reloads the game on the same device, THE SYSTEM SHALL restore meta progression (score, bricks destroyed, wave, upgrades, and unlocked achievements) from localStorage, reconstructing a fresh wave and balls for the current progression state.
5. WHEN persistence fails (e.g., localStorage unavailable or corrupted), THE SYSTEM SHALL fall back to a safe default new run without crashing.

## High-Level Design

### State Extensions (gameStore)

- Add progression fields to `GameState`:
  - `wave: number` – current wave index, starting at 1.
  - `maxWaveReached: number` – highest wave reached in this save.
  - `unlockedAchievements: string[]` – list of achievement IDs.
  - `settings: {}` – placeholder object for future user settings (graphics, reduced motion, etc.).
- Initialize progression:
  - `wave = 1`, `maxWaveReached = 1`, `unlockedAchievements = []`, `settings = {}`.
  - Bricks are seeded via `createInitialBricks(1)`.

### Wave Scaling

- Refactor `createInitialBricks` to accept a `wave: number` parameter.
  - Base brick layout (rows, columns, layers, positions) remains unchanged for now.
  - Health scaling: `scaledHealth = baseHealth * (1 + linearFactor * (wave - 1))` with `linearFactor` ≈ `0.2` for gentle growth.
  - Value scaling: `scaledValue = baseValue * (1 + linearFactor * (wave - 1))` using the same factor for simplicity.
- Update `regenerateBricks` action:
  - Read current `wave` and `maxWaveReached` from state.
  - Compute `nextWave = wave + 1`.
  - Set `wave = nextWave`, `maxWaveReached = max(maxWaveReached, nextWave)`.
  - Replace `bricks` with `createInitialBricks(nextWave)`.
  - Optionally award a small wave-clear bonus (e.g., based on wave index) to `score`.
- Keep `GameScene` behavior unchanged:
  - `GameScene` continues to call `regenerateBricks` when `bricks.length === 0`; all progression side-effects stay inside the store.

### Achievements

- Define a static `ACHIEVEMENTS` list (in `gameStore` or a small adjacent module):
  - Each entry: `{ id, label, description, type, threshold }`.
  - Initial achievements (can expand later):
    - Score milestones: `score >= 1_000`, `10_000`, `100_000`.
    - Bricks milestones: `bricksDestroyed >= 100`, `1_000`.
    - Wave milestones: `wave >= 1`, `5`, `10`.
    - Upgrade milestones: `ballDamage >= 5`, `ballCount >= 5`, `ballSpeed` above a chosen level.
- Store-side helper: `checkAndUnlockAchievements(state, changedFields)`:
  - Pure function that, given the new state and hints about what changed, returns a list of newly unlocked achievement IDs.
  - Filter out already-unlocked IDs using `unlockedAchievements`.
- Integrate checks into existing actions:
  - `damageBrick` and any consolidated `addScore` logic: check score and bricks-destroyed achievements.
  - `regenerateBricks` (or a small `onWaveCleared` wrapper): check wave achievements.
  - `upgradeBallDamage`, `upgradeBallSpeed`, `upgradeBallCount`: check upgrade achievements.
- Update `unlockedAchievements` in `GameState` whenever new IDs are returned.

### UI Integration

- Extend `UI` components to read new slices from `useGameStore`:
  - `wave`, `maxWaveReached`, `unlockedAchievements`.
- HUD updates:
  - Score panel: display current wave, e.g., `Wave 3`.
  - Stats panel: optionally show `Max Wave: 5`.
  - New compact Achievements section: show `Achievements: X / N` and a brief list (e.g., last 3 unlocked), using the static `ACHIEVEMENTS` definitions to map IDs to labels.
- Avoid complex UX for now; the goal is lightweight visibility into progression.

### Persistence (Meta Only)

- Persist only meta progression plus achievements and settings:
  - Data shape stored under a single localStorage key, e.g. `idle-bricks3d:game:v1`:
    - `version: 1`.
    - `score`, `bricksDestroyed`.
    - `wave`, `maxWaveReached`.
    - `ballDamage`, `ballSpeed`, `ballCount`.
    - `unlockedAchievements`.
    - `settings`.
- Use Zustand `persist` middleware (preferred):
  - Wrap the `create` call with `persist`.
  - Use `partialize` to include only the fields above.
  - Provide `version` and an optional `migrate` function for future changes.
  - On hydrate, reconstruct derived state:
    - Regenerate `bricks` with `createInitialBricks(wave)`.
    - Recreate `balls` based on `ballCount`, `ballSpeed`, and `ballDamage`.
- Fallback behavior:
  - If hydration fails (invalid JSON, missing fields), `migrate` or a guard returns reasonable defaults (wave 1, base upgrades, empty achievements), effectively starting a new run.

## Error Handling

- If localStorage is unavailable or throws (e.g., private mode restrictions), the store should catch errors and continue with an in-memory default state without blocking gameplay.
- Achievement and progression logic must be idempotent:
  - Checking for achievements on each relevant action must never throw, and adding duplicate IDs must be prevented.
- Scaling safeguards:
  - Clamp wave scaling so that health/value do not overflow reasonable numeric ranges for very large wave values (e.g., cap the linear factor or maximum wave considered in scaling).

## Testing Strategy

- **Store unit tests (Vitest):**
  - Verify wave scaling: clearing all bricks and calling `regenerateBricks` increases `wave`, updates `maxWaveReached`, and produces bricks with higher health/value than wave 1.
  - Verify achievements unlock: simulate state transitions that cross each threshold and confirm that `unlockedAchievements` gains the correct IDs and does not duplicate them on subsequent updates.
  - Verify persistence partialization: ensure that the serialized payload only contains the intended fields and that hydrating reconstructs bricks and balls correctly for a given wave and upgrade state.
  - Verify error paths: test that invalid or missing persisted data falls back to defaults.

## Implementation Plan

1. Extend `GameState` with `wave`, `maxWaveReached`, `unlockedAchievements`, and `settings`; initialize them and wire `createInitialBricks(1)` for the initial brick grid.
2. Refactor `createInitialBricks` to take `wave` and apply gentle linear scaling to brick health and value; update all call sites (initialization and regeneration).
3. Update `regenerateBricks` to increment `wave`, maintain `maxWaveReached`, and regenerate bricks using the new wave-aware generator (plus an optional wave-clear bonus).
4. Introduce the static `ACHIEVEMENTS` list and `checkAndUnlockAchievements` helper, and integrate achievement checks into `damageBrick`, `regenerateBricks`, and upgrade actions.
5. Add new selectors to `UI` for `wave`, `maxWaveReached`, and `unlockedAchievements`, and update HUD components to display wave and a compact achievements summary.
6. Wrap `useGameStore` with Zustand `persist`, configuring key, partialize, and migration; on hydrate, reconstruct bricks and balls from persisted meta progression.
7. Add and update unit tests in `src/test` to cover wave scaling, achievements, and persistence behavior.

## Implementation Summary

- Implemented `wave`, `maxWaveReached`, `unlockedAchievements`, and `settings` in `src/store/gameStore.ts`.
- Added wave-aware brick generation with scaling and wave advancement via `regenerateBricks`.
- Introduced an `ACHIEVEMENTS` list and `checkAndUnlockAchievements` helper; integrated unlock checks into `addScore`, `damageBrick`, `regenerateBricks`, and upgrade actions.
- Integrated Zustand `persist` (partialized storage) to persist only meta progression under the `idle-bricks3d:game:v1` key and rehydrate runtime entities on load.
- Exposed wave and achievements in HUD via `src/components/UI.tsx`.
- Added comprehensive tests in `src/test/gameStore.test.ts` and `src/test/gameStore.comprehensive.test.ts` covering scaling, achievements, upgrades, and persistence.

## Validation

- Unit and integration tests confirm wave and achievement behaviors; tests verify persistence partialization and successful rehydrate into runtime state.
- UI surfaces wave and unlocked achievements and remains lightweight.
- Persistence guards in `onRehydrateStorage` handle malformed data and fallback to safe defaults.

## Next Steps

- Tune the `WAVE_SCALE_FACTOR` and achievement thresholds based on playtesting telemetry and feedback.
- Add more achievement milestones and optionally per-achievement progress tracking.
- Perform performance profiling and UI polish for clarity and accessibility.

## Open Questions

- Exact linear factor for wave scaling (starting with 0.2 per wave, to be tuned via playtesting).
- Exact thresholds and labels for initial achievements, and whether any should be hidden until unlocked.
- Whether to show per-achievement progress (e.g., `73 / 100 bricks`) in the UI or keep the first version binary (locked/unlocked).
