# DESIGN005 — Rapier3D Integration for Physics (default)

Date: 2025-12-01
Author: GitHub Copilot (on behalf of repo maintainers)

## Summary

This design promotes Rapier3D (WASM) to be the project's default physics engine for ball movement, brick collisions, and arena boundaries. Rapier replaces the O(balls \* bricks) JavaScript collision loop with a WASM-backed broad-/narrow-phase solver and contact resolution. Visual updates use imperative instanced updates to avoid React reconciliation.

## Goals

- Make Rapier the default physics engine while preserving a robust runtime fallback.
- Eliminate per-frame store writes for ball transforms and avoid per-frame React re-renders for position-only updates.
- Preserve gameplay parity with the legacy engine within numeric tolerances and gate the default flip with a CI smoke job.
- Keep rollout incremental, measurable, and quickly reversible.

## Requirements (EARS-style)

1. WHEN the game runs in normal builds, THE SYSTEM SHALL use Rapier as the default physics engine for all collisions and movement.  
   Acceptance: The default flip (`useRapierPhysics=true`) is applied only after a PoC and a passing Rapier init smoke CI job; PRs that flip the default must include the green smoke job.

2. WHEN Rapier is active, THE SYSTEM SHALL drive transforms and collision events from `rapierWorld.step(dt)`.  
   Acceptance: `FrameManager` calls `rapierWorld.step(dt)` each frame and per-frame writes of ball transform arrays to the store are removed.

3. WHEN Rapier reports contacts, THE SYSTEM SHALL forward compact hit events (including contact normal and impulse) to the game store.  
   Acceptance: Parity tests show semantic equality (damage counts, combo outcomes) and numeric comparisons within epsilon ≈ 1e-2.

4. WHEN a PR flips the default, THE CI SHALL block merging if Rapier fails to initialize in the smoke job.  
   Acceptance: The dedicated Rapier smoke job fails fast on `initRapier()` errors and prevents the default-flip merge.

5. WHEN Rapier fails at runtime for a user, THE SYSTEM SHALL fall back to the legacy engine and continue the session.  
   Acceptance: Runtime fallback is automatic when `initRapier()` rejects; telemetry/logs indicate fallback and gameplay continues.

6. WHEN positions update each frame, THE SYSTEM SHALL update visuals imperatively (instanced) to avoid React re-renders.  
   Acceptance: `BallsInstanced` updates instance matrices; React profiler reports near-zero reconcilations for ball transforms.

## Overview & Rationale

The current JS collision loop is O(balls \* bricks) and produces per-frame allocations and store writes that cause React reconciliation. Rapier (WASM) provides an efficient broad-phase and native contact resolution. Running Rapier imperatively outside React enables instanced rendering and reduces JS CPU, improving scalability and responsiveness.

## Integration Approach

Recommend Option A — Imperative Rapier:

- Dynamically import Rapier WASM on scene init, maintain one `World` inside `rapierWorld`, register static colliders for bricks and dynamic bodies for balls, step from `FrameManager`, and read back transforms.
- Pros: scales well, minimal React churn, aligns with existing instanced brick primitives.
- Cons: glue code, explicit lifecycle management, async init complexity (mitigated with CI smoke/gating and runtime fallback).

## PoC & Rollout Plan

Packages

- `@dimforge/rapier3d-compat` (browser WASM entry).

Vite/WASM

- Add `assetsInclude: ['**/*.wasm']` to `vite.config.ts` or copy WASM to `public/` and use dynamic import patterns (`new URL(..., import.meta.url)`).
- Lazy-init Rapier with `await initRapier()` during scene mount; do not top-level import Rapier.

Files to add (PoC)

- `src/engine/rapier/rapierInit.ts` — dynamic WASM loader.
- `src/engine/rapier/rapierWorld.ts` — wrapper API: `createWorld()`, `step(dt)`, `addBall()`, `removeBall()`, `addBrick()`, `removeBrick()`, `drainContactEvents()`, `getBallStates()`.
- `src/components/BallsInstanced.tsx` — instanced mesh renderer updating instance matrices in `useFrame`.
- `src/test/rapier.poc.test.ts` — parity PoC with tolerant numeric assertions.

Files to modify

- `src/engine/FrameManager.tsx` — attempt `initRapier()` on mount (fallback to legacy if init fails) and call `rapierWorld.step(dt)` when active.
- `src/components/GameScene.tsx` — render `BallsInstanced` when Rapier is active; keep legacy components for fallback.
- `src/components/bricks/useInstancedBricks.ts` — call `rapierWorld.addBrick`/`removeBrick` and maintain `brickId→colliderId` mapping.
- `src/store/gameStore.ts` — add `useRapierPhysics` flag (default flip controlled by CI gate) and APIs to receive compact Rapier events.
- `vite.config.ts` — include `.wasm` in `assetsInclude`.

Minimal runtime flow

1. `GameScene` mount: attempt `await initRapier()`. If resolved, call `rapierWorld.createWorld()`; if rejected, log and enable legacy fallback.
2. Register bricks: `rapierWorld.addBrick(brickId, {position, size, isStatic: true})`.
3. Spawn balls: `rapierWorld.addBall(ballId, {position, velocity, radius})`.
4. Each frame: `rapierWorld.step(dt)`; `BallsInstanced` reads `getBallStates()` and updates instance matrices imperatively. `drainContactEvents()` yields hit events forwarded to `gameStore`.
5. On destroy: `rapierWorld.removeBrick(brickId)` / `removeBall(ballId)`.

Migration & CI gating

1. PoC: implement Rapier modules + PoC parity test (keep flag default `false` for dev).
2. Add a dedicated CI smoke job that calls `initRapier()` and fails fast on errors. This job blocks the PR that flips the default.
3. After PoC + smoke job green, open a small PR that flips `useRapierPhysics` default to `true`. The PR is gated by the smoke job.
4. Monitor perf/behavior on staging; provide quick env override `RAPIER=false` for emergency rollback.

Tests & Acceptance (tolerant)

- Use epsilon comparisons for numeric assertions. Recommended epsilon: `1e-2` for positions/velocities/contact normals in parity tests.
- Prefer semantic assertions (damage counts, combo outcomes) wherever possible to avoid brittle float equality.
- Add perf harness comparing Rapier vs legacy for ≥10 balls; acceptance: configurable CPU reduction (e.g., 25–40%).

Risk Matrix & Mitigations

- CI WASM init failure: mitigation — dedicated smoke job that blocks default flip; fallback: allow `RAPIER=false` env to run broader tests without blocking CI permanently.
- Gameplay drift: mitigation — parity tests + parameter tuning + debug overlay for trajectory comparison.
- Startup latency: mitigation — lazy init and optional legacy-run-until-ready swap.
- High static collider count: mitigation — compound colliders, hybrid spatial-hash approach, and perf testing.

Fallback & Operational Controls

- Runtime toggle / env override: `RAPIER=false` to force legacy engine.
- Keep legacy collision code compiled and test-covered as a rollback path and parity reference.

File map (summary)

- Add: `src/engine/rapier/rapierInit.ts`
- Add: `src/engine/rapier/rapierWorld.ts`
- Add: `src/components/BallsInstanced.tsx`
- Add: `src/test/rapier.poc.test.ts`
- Modify: `src/engine/FrameManager.tsx`
- Modify: `src/components/GameScene.tsx`
- Modify: `src/components/bricks/useInstancedBricks.ts`
- Modify: `src/store/gameStore.ts`
- Modify: `vite.config.ts`

## Decision log

- Use imperative Rapier for performance and compatibility with instanced rendering.
- Require a passing Rapier init smoke CI job before flipping the default to `true` (CI-blocking policy).

## Next steps

1. Implement PoC scaffolding (`rapierInit`, `rapierWorld`, `BallsInstanced`) and add tolerant parity tests (epsilon ≈ 1e-2).
2. Add Rapier init smoke job in CI and validate across CI environments before merging the default-flip PR.
3. After flip, run perf harness, monitor, and be ready to rollback via `RAPIER=false` if needed.

If you'd like me to implement the PoC now, reply "Implement PoC" and I will scaffold the modules and tests.
