# [TASK007] BallsInstanced & Rendering Swap

**Status:** Pending  
**Added:** 2025-12-01  
**Updated:** 2025-12-01

## Original Request

Implement the instanced ball renderer that reads transforms directly from the Rapier world and update `GameScene` and brick lifecycle hooks to support Rapier-driven visuals.

## Thought Process

To avoid React reconciliation for position-only updates, ball transforms should be applied imperatively to an `InstancedMesh`. `BallsInstanced` will query `rapierWorld.getBallStates()` in `useFrame`, update instance matrices, and keep instance count in sync with the number of active balls. `GameScene` should render `BallsInstanced` when Rapier is active and keep legacy components for fallback and debugging.

## Implementation Plan

- Add `src/components/BallsInstanced.tsx` with an imperative update loop inside `useFrame`.
- Update `src/components/GameScene.tsx` to render `BallsInstanced` when `useRapierPhysics` is true; keep legacy ball components accessible behind the fallback path.
- Update `src/components/bricks/useInstancedBricks.ts` to call `rapierWorld.addBrick`/`removeBrick` and maintain `brickId→colliderId` mapping.
- Verify with `react` profiler that ball components do not re-render per-frame when using instanced updates.

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID  | Description                                            | Status        | Updated    | Notes |
| --- | ------------------------------------------------------ | ------------- | ---------- | ----- |
| 3.1 | Implement `BallsInstanced.tsx`                          | Not Started   | 2025-12-01 |       |
| 3.2 | Update `GameScene.tsx` rendering logic                   | Not Started   | 2025-12-01 |       |
| 3.3 | Sync `useInstancedBricks.ts` with Rapier colliders       | Not Started   | 2025-12-01 |       |

## Progress Log

### 2025-12-01

- Task created; will proceed after PoC confirms API shapes.

---
