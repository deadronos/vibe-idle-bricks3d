# TASK002 - Performance Profiling & UX Polish

**Status:** In Progress
**Added:** 2025-11-29
**Updated:** 2025-11-29

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

## Progress Tracking

**Overall Status:** In Progress - 10%

### Subtasks

| ID  | Description                                      | Status       | Updated    | Notes |
| --- | ------------------------------------------------ | ------------ | ---------- | ----- |
| 1.1 | Setup profiling harness & PerfOverlay            | In Progress  | 2025-11-29 | Minimal harness started |
| 2.1 | Create FrameManager & collision engine           | Not Started  | 2025-11-29 | Centralize loop |
| 2.2 | Refactor Ball to render-only component           | Not Started  | 2025-11-29 | Driven by FrameManager |
| 3.1 | Create BricksInstanced component                 | Not Started  | 2025-11-29 | Use InstancedMesh |
| 3.2 | Implement batch updates & picking                | Not Started  | 2025-11-29 | Matrix updates |
| 4.1 | Add UI a11y (aria-live, keyboard shortcuts)      | Not Started  | 2025-11-29 | Space, U keys |
| 5.1 | Validation tests (picking & perf)                | Not Started  | 2025-11-29 | Ensure >45 FPS |

## Progress Log

### 2025-11-29

- Refined task based on DESIGN002: adopting FrameManager and InstancedMesh architecture.
- Created task to profile and optimize GameScene render and update loops.
- Added initial plan and harness ideas.
