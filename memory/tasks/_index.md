# Memory Tasks Index

## PENDING

## IN PROGRESS

- [TASK002] Performance Profiling & UX Polish - Profile rendering and optimize GameScene/Ball updates; polish UI

## COMPLETED

- [TASK001] Wave & Meta Progression Implementation - Implemented waves, achievements, partial persistence (meta-only), and UI updates (see tests and store updates)
- [TASK003] Investigate Persist/Rehydrate Race - Investigated and implemented companion metadata fix; tests updated and passing
- [TASK004] Refactor: Modularize `src/` (Store & Components) - Modularized store, BricksInstanced, and UI without behavior change
- [TASK005] Rapier PoC — Rapier world + parity test - Implement `rapierInit`, `rapierWorld`, `BallsInstanced`, and add a tolerant parity test (eps ≈ 1e-2)
- [TASK006] Rapier Integration — FrameManager & Store - Wire `rapierWorld.step(dt)` into the frame loop; add event forwarding and fallback controls
- [TASK007] BallsInstanced & Rendering Swap - Implement instanced ball renderer and update `GameScene`/bricks lifecycle for Rapier-driven visuals
- [TASK008] Rapier CI Smoke & Default Flip - Add Rapier init smoke job, gate default flip, and document rollback procedure

- [TASK009] Retrospective: Refactor gameStore (DESIGN007) - Completed retrospective summarizing DESIGN007 implementation

## ABANDONED

none
