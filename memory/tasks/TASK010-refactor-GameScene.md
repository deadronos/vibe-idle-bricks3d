# TASK010 - Refactor `GameScene` (DESIGN008)

**Status:** In Progress  
**Added:** 2025-12-04  
**Updated:** 2025-12-04

## Original Request

Create a task for DESIGN008 — Refactor `src/components/GameScene.tsx` into scoped subcomponents and utilities per the design doc.

## Thought Process

- `GameScene` currently mixes scene setup, lighting, arena bounds, bricks, balls, and helpers, making refactors and performance tuning harder.
- DESIGN008 proposes a `src/components/GameScene/` folder with `SceneSetup`, `Lighting`, `ArenaLayer`, `BricksLayer`, `BallsLayer`, and shared `utils.ts`.
- Refactor should preserve behavior, localize `useFrame` to the layers that need it, and favor typed selectors/callbacks to keep render scope tight.
- Plan incremental moves to keep reviews small and maintain parity while updating tests where feasible.

## Implementation Plan

1. Scaffold `src/components/GameScene/` and extract shared helpers into `utils.ts`, keeping existing exports intact.
2. Create `SceneSetup` and `Lighting` components and compose them in `GameScene` without behavior changes.
3. Move arena rendering/colliders into an `ArenaLayer` component using existing props/selectors.
4. Move brick rendering into `BricksLayer` with instancing logic and targeted tests; keep it independent from ball rendering.
5. Move ball rendering and frame hooks into `BallsLayer`, using store selectors/refs to minimize re-renders.
6. Update `GameScene.tsx` composition to use the new layers and adjust any imports/exports and tests accordingly.
7. Run `npm run typecheck`, `npm run lint`, `npm run test:run`, and `npm run build`; add/update tests for the new layers where practical.

## Progress Tracking

**Overall Status:** In Progress - 80%

### Subtasks

| ID  | Description                                             | Status      | Updated    | Notes |
| --- | ------------------------------------------------------- | ----------- | ---------- | ----- |
| 1.1 | Scaffold folder and move helpers into `GameScene/utils.ts` | Completed | 2025-12-04 |       |
| 2.1 | Implement `SceneSetup` and `Lighting` and compose in `GameScene` | Completed | 2025-12-04 |       |
| 3.1 | Extract `ArenaLayer` for bounds/colliders               | Completed | 2025-12-04 |       |
| 4.1 | Extract `BricksLayer` with instancing and tests         | Completed | 2025-12-04 | Added targeted tests for layers |
| 5.1 | Extract `BallsLayer` with localized `useFrame` hooks    | Completed | 2025-12-04 |       |
| 6.1 | Update tests and run full validation suite              | In Progress | 2025-12-04 | Typecheck passing; lint/build pending; new layer tests run |

## Progress Log

### 2025-12-04

- Task created to track DESIGN008 refactor of `GameScene` into composable layers/components.
- Implemented folder split (`SceneSetup`, `Lighting`, `ArenaLayer`, `BricksLayer`, `BallsLayer`, `utils`) and rewired `GameScene` to compose them. Updated helpers/imports (including tests) to new utils path. Pending: add targeted tests for bricks layer; lint/tests/build still to run. Ran `npm run typecheck` (pass).
- Added targeted layer tests (`gameScene.layers.test.tsx`) covering BricksLayer regenerate timing and BallsLayer render mode. Ran `npx vitest run src/test/gameScene.layers.test.tsx` (pass). Lint/build still pending.

---

**References:**
- Design doc: [DESIGN008 — Refactor `GameScene`](../designs/DESIGN008-refactor-GameScene.md)
