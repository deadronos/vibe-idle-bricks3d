# DESIGN002 - Performance & UX

**Status:** Draft
**Created:** 2025-11-29
**Updated:** 2025-11-29

## Summary

This design proposes a focused performance refactor and UX polish to maintain a smooth framerate under high entity counts. Key technical changes include consolidating per-frame logic into a single `FrameManager`, migrating bricks to `InstancedMesh` with batched updates, and improving accessibility (keyboard shortcuts, `aria-live`).

## Context & Current Progress

- **Goals**: Optimize `GameScene` and `Ball` update loops; support 200+ bricks/5+ balls stable; polish HUD and accessibility.
- **Current Status**: Profiling harness started (TASK002).
- **Constraints**: Keep `gameStore` as the source of truth for meta-progression; ensure `InstancedMesh` picking works reliably.

## Requirements (EARS)

1. **WHEN** the scene is stressed (200 bricks, 5 balls), **THEN** the game **SHALL** maintain >45 FPS (median frame time <22ms) on reference hardware.
2. **WHEN** physics updates occur, **THEN** the system **SHALL** minimize per-frame allocations (reuse Vector3s) and batch React updates.
3. **WHEN** rendering bricks, **THEN** the system **SHALL** use `InstancedMesh` with batched matrix/color updates (set `needsUpdate` once per frame).
4. **WHEN** interacting with bricks, **THEN** the system **SHALL** support pointer events via instance-based picking (preferring `InstancedMesh.raycast`).
5. **WHEN** using keyboard/assistive tech, **THEN** the UI **SHALL** provide shortcuts (Pause, Upgrade) and `aria-live` announcements for achievements.

## Architecture & Data Flow

```mermaid
flowchart LR
  A[GameScene] --> B[FrameManager]
  B --> C[Physics/Collision (Pure)]
  B --> D[BricksInstanced (InstancedMesh)]
  B --> E[Ball Meshes (Render-only)]
  B --> F[Store Sync (Throttled)]
  F --> G[UI/HUD]
```

- **FrameManager**: Owns the render loop (`useFrame`). Calculates physics, updates `InstancedMesh` matrices in bulk, and syncs to Zustand store at a throttled rate (e.g., 200ms) or on critical events (brick destruction).
- **BricksInstanced**: Renders all bricks via one draw call. Updates are pushed by `FrameManager`.
- **Picking**: Uses `raycaster.intersectObjects` on the `InstancedMesh` to get `instanceId`, mapping back to brick data.

## Detailed Implementation Plan

1. **Profiling & Harness**
   - Add `src/test/perf/performance.harness.test.ts` for baseline measurements.
   - Add `PerfOverlay` component (toggle via `?perf=1`).

2. **Core Engine Refactor**
   - Create `src/engine/FrameManager.tsx`: Centralize the loop.
   - Create `src/engine/collision.ts`: Pure, allocation-free collision helpers.
   - Refactor `Ball.tsx`: Make it a dumb render component driven by `FrameManager`.

3. **Instanced Rendering**
   - Create `src/components/BricksInstanced.tsx`.
   - **Batch Updates**: `FrameManager` calculates all changes, updates the `InstancedMesh` array buffers, and sets `instanceMatrix.needsUpdate = true` **once** at the end of the frame.
   - **Picking**: Implement `src/engine/picking.ts`. Prefer `InstancedMesh.raycast` to retrieve `instanceId`. Fallback to CPU-side spatial grid only if WebGL picking proves unreliable.

4. **UI & Accessibility**
   - Update `UI.tsx`: Add `aria-live` region, keyboard listeners (Space=Pause, U=Upgrade), and focus management.

5. **Validation**
   - Verify picking accuracy with `tests/e2e/picking.spec.ts`.
   - Verify performance targets with the harness.

## Risks & Mitigations

- **Risk**: `InstancedMesh` picking complexity.
  - **Mitigation**: Use Three.js built-in instance raycasting first. If performance is poor, implement a simple CPU spatial hash for pointer checks.
- **Risk**: State desync between `FrameManager` and Store.
  - **Mitigation**: `FrameManager` is the source of truth for *position/velocity*; Store is source of truth for *existence/score*. Sync is one-way (Manager -> Store) for display, except for initial load.

## Decision Records

- **Use InstancedMesh**: Essential for reducing draw calls with high brick counts.
- **Batch Updates**: Updating uniforms/attributes individually is too slow; bulk update + single commit flag is required.
- **Raycast Picking**: Native GPU-accelerated (or BVH-accelerated) picking via Three.js is preferred over maintaining a duplicate CPU collider set for pointers.
