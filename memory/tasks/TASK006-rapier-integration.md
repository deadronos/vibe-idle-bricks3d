# [TASK006] Rapier Integration — FrameManager & Store

**Status:** Pending  
**Added:** 2025-12-01  
**Updated:** 2025-12-01

## Original Request

Integrate Rapier stepping into the engine loop (`FrameManager`), forward compact collision events to `gameStore`, and add a controlled `useRapierPhysics` flag (default flip gated by CI smoke job).

## Thought Process

The `FrameManager` is the authoritative per-frame orchestrator. To make Rapier default we must attempt `initRapier()` on mount, wire `rapierWorld.step(dt)` into the frame loop, and ensure that `drainContactEvents()` is translated into the same compact events the rest of the code expects. We must also ensure runtime fallback if init fails and provide an environment override (`RAPIER=false`) for emergency rollbacks.

## Implementation Plan

- Modify `src/engine/FrameManager.tsx` to call `await initRapier()` on mount (non-blocking for UI — but block the default flip in CI), and to call `rapierWorld.step(dt)` per frame when `useRapierPhysics` is active.
- Implement event draining: translate Rapier contacts into compact `BrickHitEvent` objects and forward them to `gameStore` via a new `receiveRapierEvents(events)` API.
- Add `useRapierPhysics` flag to `src/store/gameStore.ts` with a runtime toggle and an env-controlled default (flip only after CI gate).
- Ensure legacy collision loop is retained as a fallback and that tests can run with `useRapierPhysics=false`.

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID  | Description                                            | Status        | Updated    | Notes |
| --- | ------------------------------------------------------ | ------------- | ---------- | ----- |
| 2.1 | Update `FrameManager` to init Rapier and step world     | Not Started   | 2025-12-01 |       |
| 2.2 | Add event translation and forward API in `gameStore`    | Not Started   | 2025-12-01 |       |
| 2.3 | Add env override `RAPIER=false`                         | Not Started   | 2025-12-01 | CI gating planned |

## Progress Log

### 2025-12-01

- Task created and scoped; awaiting PoC verification before integration begins.

---
