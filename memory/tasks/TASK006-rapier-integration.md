# [TASK006] Rapier Integration — FrameManager & Store

**Status:** Completed  
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

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                          | Status    | Updated    | Notes                           |
| --- | ---------------------------------------------------- | --------- | ---------- | ------------------------------- |
| 2.1 | Update `FrameManager` to init Rapier and step world  | Completed | 2025-12-01 | init on toggle + per-frame step |
| 2.2 | Add event translation and forward API in `gameStore` | Completed | 2025-12-01 | applyHits + control flags added |
| 2.3 | Add env override `RAPIER=false`                      | Completed | 2025-12-01 | runtime toggle + safe fallback  |

## Progress Log

### 2025-12-01

- Implemented FrameManager integration: lazy init (on toggle), createWorld, per-frame step, event draining + forwarding.
- Added store runtime flags (`useRapierPhysics`, `rapierActive`, `rapierInitError`) and `applyHits` helper.
- Tests added for PoC and store forwarding.

---
