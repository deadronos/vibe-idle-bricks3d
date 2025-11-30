# TASK002 - Performance Profiling & UX Polish

**Status:** In Progress
**Added:** 2025-11-29
**Updated:** 2025-11-30

## Original Request

Profile and optimize rendering and update loops in `GameScene` and `Ball` to support larger numbers of entities with stable framerate; polish HUD and improve clarity/accessibility of achievements and wave feedback.

## Thought Process

Refined approach based on [DESIGN002](../designs/DESIGN002-performance-and-ux.md). The initial profiling plan is now expanded into a concrete architectural refactor.

Key changes:

- **Centralized Loop**: Moving logic from individual components to a single `FrameManager` to control update order and batching.
- **Instanced Rendering**: Migrating `Brick` components to `InstancedMesh` to drastically reduce draw calls.
- **Batch Updates**: Updating matrices and colors in bulk rather than per-object.
- **Accessibility**: Explicit focus on keyboard navigation and `aria-live` regions.

## Implementation Plan

1. **Profiling & Harness**
   - Add `src/test/perf/performance.harness.test.ts` for baseline measurements.
   - Add `PerfOverlay` component (toggle via `?perf=1`).

2. **Core Engine Refactor**
   - Create `src/engine/FrameManager.tsx`: Centralize the loop.
   - Create `src/engine/collision.ts`: Pure, allocation-free collision helpers.
   - Refactor `Ball.tsx`: Make it a dumb render component driven by `FrameManager`.

3. **Instanced Rendering**
   - Create `src/components/BricksInstanced.tsx`.
   - Implement batch updates for `InstancedMesh` (matrices/colors).
   - Implement picking via `InstancedMesh.raycast` or spatial grid fallback.

4. **UI & Accessibility**
   - Update `UI.tsx`: Add `aria-live` region, keyboard listeners (Space=Pause, U=Upgrade), and focus management.

5. **Validation**
   - Verify picking accuracy with `tests/e2e/picking.spec.ts`.
   - Verify performance targets with the harness.

## Error Handling Matrix

| Scenario | Detection | Response |
| --- | --- | --- |
| Pointer events report `instanceId` as `null`/`undefined` | `ThreeEvent.instanceId` guard fires | Call `clearHoveredInstance()` so no stale highlight remains |
| Hovered brick is destroyed while highlighted | Hover id not found inside bricks array during layout effect | Drop refs + skip recoloring so removed meshes do not throw |
| Picking helper receives out-of-range index | `getBrickFromInstance` bounds checks | Return `null`; tests/e2e verify behavior |
| Perf harness detects physics drift | Harness expect failures | Inspect `stepBallFrame` for regression before shipping |

## Progress Tracking

**Overall Status:** In Progress - 80%

### Subtasks

| ID  | Description                                      | Status       | Updated    | Notes |
| --- | ------------------------------------------------ | ------------ | ---------- | ----- |
| 1.1 | Setup profiling harness & PerfOverlay            | Complete     | 2025-11-29 | PerfOverlay gated by ?perf=1; perf harness test added |
| 2.1 | Create FrameManager & collision engine           | Complete     | 2025-11-29 | Centralized physics loop + helpers |
| 2.2 | Refactor Ball to render-only component           | Complete     | 2025-11-29 | Driven by FrameManager |
| 3.1 | Create BricksInstanced component                 | Complete     | 2025-11-29 | InstancedMesh renderer |
| 3.2 | Implement batch updates & picking                | Complete     | 2025-11-30 | Hover state now imperatively updates single instances |
| 4.1 | Add UI a11y (aria-live, keyboard shortcuts)      | Complete     | 2025-11-29 | Space, U keys + live region |
| 5.1 | Validation tests (picking & perf)                | Complete     | 2025-11-30 | Added tests/e2e/picking.spec.ts (plus perf harness) |

## Progress Log

### 2025-11-29

- Refined task based on DESIGN002: adopting FrameManager and InstancedMesh architecture.
- Created task to profile and optimize GameScene render and update loops.
- Added initial plan and harness ideas.

### 2025-11-29 (later)

- Implemented FrameManager with centralized collision step and refactored Ball into a render-only mesh.
- Added InstancedMesh-based brick renderer with instance picking hover, plus PerfOverlay toggle via `?perf=1`.
- Introduced perf harness test scaffold for collision loop; added UI aria-live announcements and keyboard shortcuts (Space pause, U upgrade).

### 2025-11-30

- Reworked `BricksInstanced` batching so pointer hover only updates the targeted instance color and persists correctly across store changes.
- Added guards for destroyed bricks to avoid stale highlights and reuse a single highlight color buffer per frame.
- Created `tests/e2e/picking.spec.ts` to validate `getBrickFromInstance` mapping and ran `npm run test:run` (115 tests passing).
- Observed that enabling `vertexColors` zeroed lighting (geometry lacks per-vertex color buffer), so we standardized on `instanceColor`-only materials until a gradient buffer exists.
