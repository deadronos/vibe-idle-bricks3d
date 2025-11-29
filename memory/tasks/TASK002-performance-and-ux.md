# TASK002 - Performance Profiling & UX Polish

**Status:** In Progress  
**Added:** 2025-11-29  
**Updated:** 2025-11-29

## Original Request

Profile and optimize rendering and update loops in `GameScene` and `Ball` to support larger numbers of entities with stable framerate; polish HUD and improve clarity/accessibility of achievements and wave feedback.

## Thought Process

Performance is key to keeping a smooth experience when multiple balls and layers of bricks are present. Use `useFrame` sparingly, minimize per-frame allocations, and prefer stable references for arrays and vectors. Improve UI affordances (a11y, clarity) without heavy redesign.

## Implementation Plan

1. **Profiling setup**: Add a small benchmark harness to stress the scene; use browser performance tools and `console.profile` to capture traces.
2. **Render loop analysis**: Audit `useFrame` callbacks in `GameScene`, `Ball`, and other components to minimize repeated allocations and event subscriptions.
3. **Memory & object reuse**: Reuse Vector3 objects and limit per-frame array copies; consider `instancedMesh` for large brick counts if needed.
4. **UI polish**: Add accessible labels, keyboard shortcuts for pause/resume, and clear achievement reveals.
5. **Instrumentation & tests**: Add a Vitest harness that simulates high entity counts and asserts no significant memory or CPU regression.

## Progress Tracking

**Overall Status:** In Progress - 10%

### Subtasks

| ID  | Description                                 | Status       | Updated    | Notes |
| --- | ------------------------------------------- | ------------ | ---------- | ----- |
| 1.1 | Setup profiling harness                      | In Progress  | 2025-11-29 | Minimal harness added for trace capture |
| 2.1 | Audit `useFrame` and render paths            | Not Started  | 2025-11-29 | Initial profiling pending |
| 3.1 | Implement object re-use and reduce allocations | Not Started  | 2025-11-29 | --- |
| 4.1 | Add UI/accessibility polish                  | Not Started  | 2025-11-29 | --- |
| 5.1 | Add tests for performance and memory         | Not Started  | 2025-11-29 | --- |

## Progress Log

### 2025-11-29

- Created task to profile and optimize GameScene render and update loops.  
- Added initial plan and harness ideas.
