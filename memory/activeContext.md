# Active Context

**Last updated:** 2025-11-30

## Current focus

- Ball spawn queue system for graceful reload behavior
- Performance profiling and optimizations, especially around rendering and `useFrame` loops.  
- UI polish including accessibility and clearer achievement feedback.

## Recent changes

- **NEW: Gradual ball spawning system** - When reloading with 8+ purchased balls, balls now spawn every 0.5s instead of all at once
  - Added `ballSpawnQueue` and `lastBallSpawnTime` to track pending spawns
  - Added `tryProcessBallSpawnQueue()` in FrameManager to spawn queued balls during game loop
  - Added `forceProcessAllQueuedBalls()` for testing and immediate spawn needs

- **Enhanced rehydration validation** - Added comprehensive logging and stat verification:
  - Logs rehydrated state (ballCount, damage, speed, wave, score, bricks, achievements)
  - Validates ball stats match store config after rehydration
  - Automatically rebuilds balls with correct damage/speed if mismatch detected
  - Post-rehydration validation runs after one frame to catch race conditions

- Updated workflow to use `npm` instead of `pnpm` for deploy runner compatibility

## Next steps

- Profile `GameScene` and `Ball` physics to reduce per-frame allocations and re-renders.  
- Propose UI tweaks for achievements display and wave feedback.  
- Add migration path and versioning for persisted meta when needed.

## Active decisions

- Use Zustand for state management
- Keep physics deterministic and mostly frame-rate independent
- Persist only meta progression (ballCount, ballDamage, ballSpeed, etc) - reconstruct runtime entities (bricks, balls) on hydrate
- Spawn missing balls gradually (0.5s interval) rather than all at once to smooth reload experience
- Add comprehensive validation and logging during rehydration to catch and fix stat mismatches
