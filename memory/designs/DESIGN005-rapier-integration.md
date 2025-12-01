# DESIGN005 — Rapier3D Integration for Physics

Date: 2025-12-01
Author: GitHub Copilot (on behalf of repo maintainers)

Summary
-------
This design describes integrating Rapier3D (WASM) as the authoritative physics engine for ball movement, collisions with bricks, and arena boundaries. The goal is to replace the current O(balls * bricks) JS collision loop with Rapier's broad-/narrow-phase solver, reduce per-frame JS work, and eliminate per-frame React churn by rendering positions imperatively (instanced meshes).

Goals
-----
- Reduce per-frame CPU from the JS collision loop and scale better with many balls.
- Prevent React re-renders for position-only updates by using an imperative instanced renderer for balls.
- Preserve gameplay feel (configurable Rapier parameters) and provide a fallback to the current engine.
- Keep the migration incremental, testable, and gated behind a feature flag.

Requirements (EARS-style)
------------------------
1. WHEN many balls are active (>= 10), THE SYSTEM SHALL use Rapier broad-phase to limit narrow-phase checks (Acceptance: average candidates per-ball <= 20 on harness).
2. WHEN balls collide with bricks, THE SYSTEM SHALL produce contact normals and impulse data used to apply damage and effect logic (Acceptance: brick damage events match expectations across parity tests).
3. WHEN ball positions update each frame, THE SYSTEM SHALL avoid full React re-renders of ball components (Acceptance: React profiler shows near-zero re-renders for position-only updates).
4. WHEN the Rapier path is disabled, THE SYSTEM SHALL fall back to existing collision code with identical external events (Acceptance: existing tests pass with flag=false).

Overview & Rationale
--------------------
The repo's current physics is a JS loop that checks each ball against many bricks (O(balls * bricks)) and writes ball arrays to the store each frame, causing allocation and React reconciliation. Rapier3D (compiled to WASM) provides a C/WASM-optimized solver with efficient broad-phase and native contact resolution; running it imperatively outside React can drastically reduce JS CPU and allow updating visuals via `InstancedMesh` without setState churn.

Integration Options
-------------------
Option A — Imperative Rapier (recommended)
- Implementation: async-load Rapier WASM, create one `World` instance in an engine module, map bricks → static colliders and balls → dynamic sphere bodies, step the world from `FrameManager` and read back transforms.
- Pros: minimal React churn, good performance for many objects, full control over lifecycle and batching of game events.
- Cons: more glue code, explicit lifecycle maintenance (create/destroy colliders), async WASM init.

Option B — `@react-three/rapier` (R3F bindings)
- Implementation: declarative `<RigidBody>` / `<Collider>` components and hooks.
- Pros: easier to prototype, declarative API.
- Cons: each collider is a React node (bad at high brick counts), harder to keep instanced visuals and performance.

Recommendation: Use Option A (imperative Rapier) to preserve instancing and minimize React re-renders.

PoC Plan (minimal, safe)
-----------------------
Packages to install
- Primary: `@dimforge/rapier3d-compat` (preferred WASM entry for browser).  
- Optional for prototyping: `@react-three/rapier` (only for small-scale testing).

Vite/WASM notes
- Add `assetsInclude: ['**/*.wasm']` to `vite.config.ts` or copy the `.wasm` to `public/`.  
- Dynamically import and await the Rapier initializer at runtime (do not import top-level) to avoid blocking startup.

Files to add
- `src/engine/rapier/rapierInit.ts` — async Rapier WASM loader and initializer helper.  
- `src/engine/rapier/rapierWorld.ts` — thin wrapper exposing `createWorld()`, `step(dt)`, `addBall(ballId, params)`, `removeBall(ballId)`, `addBrick(brickId, params)`, `removeBrick(brickId)`, and `pollContacts()` or `drainContactEvents()`.
- `src/components/BallsInstanced.tsx` — InstancedMesh renderer that reads transforms from `rapierWorld.getBallStates()` under `useFrame` and updates instance matrices imperatively.
- `src/test/rapier.poc.test.ts` — small parity PoC asserting collisions and contact normals.

Files to modify (minimal surface changes)
- `src/engine/FrameManager.tsx` — initialize Rapier on mount, call `rapierWorld.step(dt)` when feature-flag enabled, and forward compact game events (brick hits) into `src/store/gameStore.ts` (no per-frame balls setState).
- `src/components/GameScene.tsx` — conditionally render `<BallsInstanced />` when Rapier is enabled (feature-flag). Keep legacy render path as fallback.
- `src/components/bricks/useInstancedBricks.ts` — maintain `brickId → colliderId` mapping and call `rapierWorld.addBrick`/`removeBrick` on lifecycle changes.
- `src/store/gameStore.ts` — add `useRapierPhysics` flag and minimal APIs for event forwarding.

Minimal runtime flow (PoC)
1. On `GameScene` mount: `await initRapier()` then `rapierWorld.createWorld()`.
2. On level/wave load: iterate bricks and call `rapierWorld.addBrick(brickId, {position, size, isStatic: true})`.
3. When balls spawn: `rapierWorld.addBall(ballId, {position, velocity, radius})` (dynamic body).
4. Each frame: `rapierWorld.step(dt)`; `BallsInstanced` reads `rapierWorld.getBallStates()` and updates `InstancedMesh` matrices imperatively. Collect contact events and forward compact events to `gameStore` for damage/effects.
5. On brick destroy: call `rapierWorld.removeBrick(brickId)` and update instanced visuals.

Migration Plan (high-level, 1 dev estimates)
-----------------------------------------
1. PoC Rapier world + single-ball parity test (1–2 days)
   - Implement `rapierInit` and `rapierWorld`, test one ball vs one brick and verify contact event.
2. Integrate stepping into `FrameManager` behind `useRapierPhysics` (1–2 days)
   - Replace per-frame collision loop only when flag is on; keep legacy path untouched.
3. Implement `BallsInstanced` and swap rendering (1 day)
   - Remove per-frame `setState` for ball positions; render directly from Rapier transforms.
4. Tune physics parameters and run perf harness (1–2 days)
   - Adjust restitution/friction/CCD to match feel; tune time-step and event batching.
5. Tests, CI and rollback validation (1–2 days)
   - Add parity unit tests, perf harness comparisons, and ensure CI can run WASM tests or gate them separately.

Tests & Acceptance Criteria
--------------------------
- Unit parity test: `src/test/rapier.poc.test.ts` — single-ball single-brick scenarios match reference outcomes within epsilon (positions/velocities/contact normals).
- Integration perf test: `src/test/perf/rapier_vs_native.test.ts` — baseline vs Rapier for ≥10 balls; acceptance: JS CPU time reduced by a configurable threshold (e.g., 25–40%).
- React render test: `tests/components/BallsInstanced.test.tsx` — assert that per-frame transforms do not cause React reconcilations of ball components.
- Regression: all existing tests pass with `useRapierPhysics=false`.

Risk Matrix & Rollback
----------------------
- Gameplay divergence (Medium likelihood, High impact): tune Rapier restitution/friction and provide debug overlay to compare trajectories; keep legacy path behind `useRapierPhysics` flag for rollback.
- WASM bundling/CI issues (Low–Medium likelihood, High impact): ensure `.wasm` is included in Vite assets and add a smoke test; fallback: copy wasm into `public/`.
- Startup latency (Medium likelihood): lazy-init Rapier on scene mount and optionally run legacy physics until ready.
- High static collider count memory/time (Low–Medium): group static colliders into compounds or use a hybrid approach (spatial-hash for bricks + Rapier narrow-phase for tricky collisions).

Fallback strategies
-------------------
- Feature flag: `useRapierPhysics` toggles Rapier on/off. Default `false` until validated.
- Hybrid: Use Rapier for broad-phase queries only, or for balls while keeping bricks handled in spatial-hash (intermediate step).

File map (summary)
-------------------
- Add: `src/engine/rapier/rapierInit.ts`
- Add: `src/engine/rapier/rapierWorld.ts`
- Add: `src/components/BallsInstanced.tsx`
- Add: `src/test/rapier.poc.test.ts`
- Modify: `src/engine/FrameManager.tsx`
- Modify: `src/components/GameScene.tsx`
- Modify: `src/components/bricks/useInstancedBricks.ts`
- Modify: `src/store/gameStore.ts`

Decision log
------------
- Imperative Rapier chosen because the repo already uses instanced bricks and needs minimal React churn.
- Keep legacy collision code as a compatibility fallback and an executable reference for parity tests.

Next steps
----------
1. If you want, I can implement the PoC scaffolding now: `rapierInit`, `rapierWorld`, and a single parity test.  
2. Otherwise, merge this design into memory and we can schedule the PoC as a small patch.

If you'd like me to proceed with the PoC implementation, say "Implement PoC" and I'll start the patch set.
