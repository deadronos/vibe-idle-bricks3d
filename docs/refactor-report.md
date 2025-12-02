# Refactor Candidates — src analysis

Summary

I scanned the `src/` tree and identified the largest files and the best places to split responsibilities to improve testability, readability, and incremental refactoring.

Primary candidates

- **src/store/gameStore.ts**: [src/store/gameStore.ts](src/store/gameStore.ts)
  - Why: by far the largest file; mixes TypeScript types/interfaces, constants, helpers (createInitialBricks/createInitialBall), achievement rules, persistence/rehydration logic, and the Zustand store definition/composition.
  - Suggested refactor:
    - Extract `types` (e.g. `src/store/types.ts`) with `Brick`, `Ball`, `Upgrade`, and `GameState` interfaces.
    - Move constants to `src/store/constants.ts` (ARENA_SIZE, defaults, colors, achievement definitions if static).
    - Move creation helpers to `src/store/createInitials.ts` (createInitialBricks, createInitialBall, scaleForWave).
    - Extract achievements/metrics to `src/store/achievements.ts` with tests for unlock logic.
    - Extract persistence/rehydration helpers to `src/store/persistence.ts` so `useGameStore` focuses on actions/state only.
    - Keep a thin `gameStore.ts` that composes the pieces or split into Zustand slices.

- **src/components/BricksInstanced.tsx**: [src/components/BricksInstanced.tsx](src/components/BricksInstanced.tsx)
  - Why: contains instanced mesh lifecycle, pointer handling, temp object/color reuse, and color/damage logic — fairly dense and DOM/three logic mixed with game logic.
  - Suggested refactor:
    - Extract color and damage helpers (`getDamageColor`) to `src/components/bricks/utils.ts` and unit-test them.
    - Move pointer/hover bookkeeping into a `useInstancedHover` hook and keep rendering minimal.
    - Isolate three.js temp objects and instance update logic into a small utility so the component body is easier to read.

- **src/components/UI.tsx**: [src/components/UI.tsx](src/components/UI.tsx)
  - Why: large component with many selectors, keyboard handlers, and multiple UI panels in one file — causes broad re-renders and long file maintenance.
  - Suggested refactor:
    - Split into `ScorePanel`, `StatsPanel`, `UpgradesPanel`, `AchievementsPanel`, and `Controls` components.
    - Extract keyboard handling into `useKeyboardShortcuts` hook.
    - Use memoized selectors or `useGameStore` slices in the smaller components to minimize re-renders.

- **src/components/GameScene.tsx**: [src/components/GameScene.tsx](src/components/GameScene.tsx)
  - Why: mixes camera, controls, lighting, background, and entity layers. Readability could improve by separating concerns.
  - Suggested refactor:
    - Create `CameraSetup`, `Lighting`, `Background`, `BallsLayer`, `BricksLayer`, and a small `SceneRoot` that composes them.
    - This makes it easier to test/benchmark lighting and camera setup separately.

- **src/engine/collision.ts**: [src/engine/collision.ts](src/engine/collision.ts)
  - Why: contains constants and collision math alongside `stepBallFrame` frame stepping logic.
  - Suggested refactor:
    - Extract pure math helpers (closest-point, axis detection, reflect logic) into `src/engine/collision/math.ts` and constants into `src/engine/collision/constants.ts`.
    - Keep `stepBallFrame` as the coordinator that uses the pure functions.

- **src/engine/FrameManager.tsx**: [src/engine/FrameManager.tsx](src/engine/FrameManager.tsx)
  - Why: small but embeds update loop + hit processing. Moving non-React logic out makes it easier to unit test.
  - Suggested refactor:
    - Delegate per-frame stepping and hit-accumulation to pure engine functions (e.g., `engine/stepFrame`) and keep the component a minimal hook into `useFrame`.

Files likely safe to leave as-is (small and focused)

- `src/components/Ball.tsx` — small, maps ball props to a mesh.
- `src/components/Brick.tsx` — small per-brick mesh with subtle frame animation.
- `src/components/Arena.tsx` — rendering-only scene pieces.
- `src/components/PerfOverlay.tsx` — small dev-only overlay.
- `src/App.tsx`, `src/main.tsx` — already minimal.

Next steps

- If you want, I can start an incremental change: extract `types` and `constants` from `src/store/gameStore.ts` into `src/store/types.ts` and `src/store/constants.ts`, update imports, and run tests. This is a low-risk, high-value first PR.

---

Report generated from a quick static scan of `src/` on 2025-11-30.
