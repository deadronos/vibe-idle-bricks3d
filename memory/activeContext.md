# Active Context

**Last updated:** 2025-11-29

## Current focus

- Performance profiling and optimizations, especially around rendering and `useFrame` loops.  
- UI polish including accessibility and clearer achievement feedback.  
- Continue to expand test coverage for integrations and edge cases.

## Recent changes

- Project initial structure with R3F components and Zustand store (see src/)

## Next steps

- Profile `GameScene` and `Ball` physics to reduce per-frame allocations and re-renders.  
- Propose UI tweaks for achievements display and wave feedback.  
- Add migration path and versioning for persisted meta when needed.

## Active decisions

- Use Zustand for state management
-- Keep physics deterministic and mostly frame-rate independent
- Persist only meta progression and reconstruct runtime entities on hydrate using Zustand persist partialize + onRehydrateStorage guard
