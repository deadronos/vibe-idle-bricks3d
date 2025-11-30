# Source Files Overview

This document provides a concise, one-sentence description for every file and folder under `src/` to help contributors quickly understand the codebase layout.

## Top-level

- `src/`: Root source folder containing the application's React components, engine code, store, styles, and tests for Idle Bricks 3D.
- `src/App.css`: Global styles used by the React application and layout-specific CSS rules.
- `src/App.tsx`: Root React component that composes the main UI and bootstraps the game scene and HUD.
- `src/index.css`: Base stylesheet with global CSS resets and app-wide styling.
- `src/main.tsx`: Application entry point that mounts the React app and initializes runtime providers.

## assets

- `src/assets/`: Static assets (images, models, audio, fonts) used by the app and 3D scene.

## components

- `src/components/`: Collection of React and React Three Fiber components that render the game world and UI.
- `src/components/Arena.tsx`: 3D arena component that defines the playable bounds and visual boundaries.
- `src/components/Ball.tsx`: Ball entity component responsible for rendering, movement, and physics integration.
- `src/components/Brick.tsx`: Single brick component representing a destructible block with hit/health visuals.
- `src/components/GameScene.tsx`: Main R3F scene container that composes cameras, lights, and 3D objects for gameplay.
- `src/components/PerfOverlay.tsx`: On-screen performance overlay showing metrics such as FPS and rendering stats.

### components/bricks

- `src/components/bricks/`: Brick-related components and helpers focused on high-performance brick rendering.
- `src/components/bricks/BricksInstanced.tsx`: Instanced mesh component that efficiently renders large numbers of bricks.
- `src/components/bricks/useInstancedBricks.ts`: Hook that manages instanced brick state, updates, and per-instance transforms.
- `src/components/bricks/utils.ts`: Utility functions for brick layout, coordinate transforms, and instancing math.

### components/ui

- `src/components/ui/`: UI components for HUD, panels, and input controls.
- `src/components/ui/AchievementsPanel.tsx`: UI panel that displays player achievements and unlock progress.
- `src/components/ui/Controls.tsx`: Interactive controls (buttons, toggles) for gameplay and UI interactions.
- `src/components/ui/ScorePanel.tsx`: HUD component showing current score, points, and related indicators.
- `src/components/ui/StatsPanel.tsx`: Panel exposing runtime or player statistics for debugging or display.
- `src/components/ui/UI.css`: Styles specifically applied to the UI panels and HUD components.
- `src/components/ui/UI.tsx`: Top-level UI container that lays out HUD, panels, and overlays.
- `src/components/ui/UpgradesPanel.tsx`: Panel for viewing and purchasing player upgrades and progression items.
- `src/components/ui/useKeyboardShortcuts.ts`: Hook that registers and handles keyboard shortcuts for game actions.

## engine

- `src/engine/`: Core engine utilities that drive physics, frame scheduling, and input/picking.
- `src/engine/collision.ts`: Collision detection and resolution utilities used by the physics and game logic.
- `src/engine/FrameManager.tsx`: Frame manager component that coordinates the game loop and per-frame updates.
- `src/engine/picking.ts`: Raycasting and input-picking helpers to detect object intersections and handle selection.

## store

- `src/store/`: Zustand stores, persistence helpers, constants, and type definitions for game state.
- `src/store/achievements.ts`: State and logic for tracking and unlocking achievements.
- `src/store/constants.ts`: Shared constants and configuration values used across the codebase.
- `src/store/createInitials.ts`: Helpers to construct the initial/default game state and seed values.
- `src/store/gameStore.ts`: The primary Zustand store defining game state, actions, and selectors.
- `src/store/persistence.ts`: Functions to persist and rehydrate store state (e.g., localStorage handlers).
- `src/store/types.ts`: TypeScript types and interfaces describing the shape of store state and domain models.

## test

- `src/test/`: Unit and integration tests that validate store logic, utilities, and edge cases.
- `src/test/achievements.test.ts`: Tests validating achievements unlock logic and state transitions.
- `src/test/bricks.utils.test.ts`: Unit tests for brick layout and utility functions.
- `src/test/edgeCases.test.ts`: Tests covering edge cases and unusual runtime scenarios.
- `src/test/gameStore.comprehensive.test.ts`: End-to-end / comprehensive tests for `gameStore` behavior.
- `src/test/gameStore.test.ts`: Unit tests for core `gameStore` actions and state transitions.
- `src/test/rehydration.test.ts`: Tests ensuring persistence and rehydration of state work correctly.
- `src/test/setup.ts`: Shared test setup utilities and fixtures used by the test suite.
- `src/test/timing.test.ts`: Tests validating timing, frame stepping, and time-sensitive logic.

### test/perf

- `src/test/perf/`: Performance-focused tests and harnesses.
- `src/test/perf/performance.harness.test.ts`: Performance harness to measure runtime characteristics and regressions.

---

If you want this doc exported to a different filename, expanded with module-level notes, or converted into a table, tell me which format you prefer and I'll update it.
