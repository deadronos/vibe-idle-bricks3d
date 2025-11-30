# Active Context

**Last updated:** 2025-11-30

## Current focus

- Bug fix: Ball count mismatch after page reload (ballCount upgraded to 8 but only 1 ball visible)
- Performance profiling and optimizations, especially around rendering and `useFrame` loops.  
- UI polish including accessibility and clearer achievement feedback.

## Recent changes

- Fixed ball count persistence issue where rehydration wasn't properly rebuilding balls array to match ballCount
- Added safety check to validate and fix ball count mismatch during rehydration
- Added regression test for 8+ balls reload scenario

## Next steps

- Profile `GameScene` and `Ball` physics to reduce per-frame allocations and re-renders.  
- Propose UI tweaks for achievements display and wave feedback.  
- Add migration path and versioning for persisted meta when needed.

## Active decisions

- Use Zustand for state management
- Keep physics deterministic and mostly frame-rate independent
- Persist only meta progression and reconstruct runtime entities on hydrate using Zustand persist partialize + onRehydrateStorage guard
- Add post-rehydration validation to ensure balls array length matches ballCount (handles race conditions)
