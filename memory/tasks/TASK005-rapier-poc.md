# [TASK005] Rapier PoC — Rapier world + parity test

**Status:** In Progress  
**Added:** 2025-12-01  
**Updated:** 2025-12-01

## Original Request

Implement a minimal proof-of-concept that integrates Rapier WASM as an imperative physics world, verifies single-ball vs single-brick parity, and proves a safe init/load strategy for CI and runtime fallback.

## Thought Process

We need a small, tightly-scoped PoC to validate three things: 1) Rapier can be initialized in our environment (dev/CI/browser), 2) Rapier produces contact events (normals/impulses) matching legacy behavior within tolerances, and 3) we can read transforms and update an `InstancedMesh` imperatively without per-frame React re-renders. Keep scope intentionally narrow to limit risk.

## Implementation Plan

- Add `src/engine/rapier/rapierInit.ts` — dynamic WASM loader that returns an `initRapier()` promise and exposes the wasm path resolution.
- Add `src/engine/rapier/rapierWorld.ts` — minimal wrapper with `createWorld()`, `step(dt)`, `addBall()`, `removeBall()`, `addBrick()`, `removeBrick()`, `drainContactEvents()`, `getBallStates()`.
- Add `src/components/BallsInstanced.tsx` — simple `InstancedMesh` that reads `rapierWorld.getBallStates()` in `useFrame` and updates matrices imperatively (no store writes).
- Add `src/test/rapier.poc.test.ts` — unit parity test (single ball vs single brick), using epsilon ≈ 1e-2 for numeric assertions and asserting semantic outcomes (damage count) where possible.
- Update `vite.config.ts` (or document) to include `.wasm` in `assetsInclude` if not already set.
- Run the PoC locally and iterate until tests pass; keep the legacy collision loop untouched.

## Progress Tracking

**Overall Status:** In Progress - 10%

### Subtasks

| ID  | Description                                            | Status        | Updated    | Notes |
| --- | ------------------------------------------------------ | ------------- | ---------- | ----- |
| 1.1 | Create `rapierInit.ts`                                  | Not Started   | 2025-12-01 |       |
| 1.2 | Create `rapierWorld.ts`                                 | Not Started   | 2025-12-01 |       |
| 1.3 | Create `BallsInstanced.tsx`                             | Not Started   | 2025-12-01 |       |
| 1.4 | Add `rapier.poc.test.ts`                                | Not Started   | 2025-12-01 | Use eps=1e-2 |
| 1.5 | Add `.wasm` assetsInclude to `vite.config.ts`           | Not Started   | 2025-12-01 | or copy wasm to `public/` |

## Progress Log

### 2025-12-01

- Task created from DESIGN005 update; PoC scoped and subtasks listed.  
- Next: scaffold `rapierInit.ts` and `rapierWorld.ts` (minimal implementations) and add a first test that calls `initRapier()` (smoke).

---
