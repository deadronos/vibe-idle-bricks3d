# Active Context

**Last updated:** 2025-06-15

## Current focus

- ✅ TASK003 RESOLVED: Fixed persist/rehydrate race condition causing "loaded balls not spawned"
- Ball spawning after page reload now works correctly
- Performance profiling and optimizations

## Recent changes

### CRITICAL FIX: Ball Spawning Rehydration Bug (2025-06-15)

**Root Cause:** The `onRehydrateStorage` callback in Zustand's persist middleware was trying to pass `useGameStore` as a dependency to `handleRehydrate`. However, `onRehydrateStorage` runs DURING the `create()` call, BEFORE `useGameStore` is assigned. This caused a silent `ReferenceError: Cannot access 'useGameStore' before initialization`, preventing rehydration from ever running.

**Solution:** Wrapped the `handleRehydrate` call in `setTimeout(0)` to defer execution until after store initialization. The state is captured synchronously and passed to the deferred function.

**Files Modified:**

1. `src/store/gameStore.ts` - Added setTimeout(0) deferral in onRehydrateStorage
2. `src/store/persistence.ts` - Cleaned up debug logging
3. `src/engine/FrameManager.tsx` - Cleaned up debug logging
4. `src/components/GameScene.tsx` - Cleaned up debug logging
5. `src/test/rehydration.test.ts` - Updated tests for async behavior

**Verification:** All 212 tests pass, TypeScript/ESLint clean, browser testing confirms fix.

### Previous: Gradual ball spawning system

- When reloading with 8+ purchased balls, balls spawn every 0.5s instead of all at once
- Added `ballSpawnQueue` and `lastBallSpawnTime` to track pending spawns
- Added `tryProcessBallSpawnQueue()` in FrameManager

## Next steps

- Profile `GameScene` and `Ball` physics to reduce per-frame allocations
- UI tweaks for achievements display and wave feedback
- Add migration path and versioning for persisted meta when needed

## Active decisions

- Use Zustand for state management
- Keep physics deterministic and mostly frame-rate independent
- Persist only meta progression (ballCount, ballDamage, ballSpeed, etc) - reconstruct runtime entities on hydrate
- Spawn missing balls gradually (0.5s interval) to smooth reload experience
- **NEW:** Defer `handleRehydrate` via `setTimeout(0)` to avoid store initialization race
