# DESIGN008 — Refactor `src/components/GameScene.tsx`

**Status:** Draft  
**Added:** 2025-12-04  
**Updated:** 2025-12-04

## Goal
Decompose the large `GameScene` component into focused, testable subcomponents and small utility modules to improve readability and make targeted changes safer.

## Problem Statement
`src/components/GameScene.tsx` mixes scene setup, object creation, rendering layers, and some game logic. This makes it hard to reason about rendering performance, reuse pieces across modes, and write focused tests.

## Requirements (EARS)
- WHEN rendering the scene, THE SYSTEM SHALL separate presentation (lighting, camera) from game-layer composition.  
  Acceptance: Scene setup component only configures camera/controls/lighting; layers are independent components.
- WHEN changing brick rendering, THE SYSTEM SHALL allow updating `BricksLayer` without affecting other layers.  
  Acceptance: `BricksLayer` compiles independently and has its own unit/visual tests.
- WHEN optimizing performance, THE SYSTEM SHALL localize `useFrame` and instancing logic to the minimal component.  
  Acceptance: frame hooks live only in components that need them and are covered by smoke checks.

## Proposed Component Split
Create a `src/components/GameScene/` folder with the following components:
- `SceneSetup.tsx` — Camera, `Canvas` props, global controls, and environment.  
- `Lighting.tsx` — All lights and environment/background objects.
- `ArenaLayer.tsx` — Static arena bounds and colliders.
- `BricksLayer.tsx` — Brick instanced meshes and per-brick behaviors (stateless rendering + event hooks).  
- `BallsLayer.tsx` — Ball visuals and per-frame movement/render hooks.  
- `GameScene.tsx` (index) — Compose the above components and pass required selectors/actions.
- `utils.ts` — Pure helpers used by layers (many helpers already exist in `GameScene.utils.ts`).

## Types & Props
- Define small, clear props for each layer (e.g., `BricksLayerProps` accepting brick data selectors or a stable `bricksRef` delegate).
- Prefer selectors and callbacks over passing large store objects to keep re-render scope small.

## Implementation Plan
1. Scaffold `src/components/GameScene/` and move small utilities into `utils.ts`.  
2. Implement `SceneSetup` and `Lighting` and use them in `GameScene` (no behavior change).  
3. Move brick rendering into `BricksLayer` — use existing instancing helpers (or `Bricks.*`).  
4. Move ball rendering and frame logic into `BallsLayer` and ensure it subscribes only to ball slice selectors.  
5. Run tests and visually validate scene in dev mode.

## Performance & Testing Notes
- Keep `useFrame` calls as localized as possible; avoid a single global frame hook doing many responsibilities.  
- Use `memo`, `useRef`, and instanced meshes where appropriate.  
- Add snapshot/visual regression tests for the scene composition where feasible.

## Rollout
- Make small PRs per component move to simplify review.  
- Keep `GameScene.tsx` as a top-level composition file and replace internals incrementally.

---
