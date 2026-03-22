# Project Context

Idle Bricks 3D is a 3D idle breakout game built with:

- React 19
- TypeScript
- Vite
- React Three Fiber
- Drei
- Three.js
- Zustand
- Vitest

## Core gameplay context

- Balls bounce automatically and break bricks.
- Upgrades affect damage, speed, and ball count.
- 3D rendering and physics performance matter.
- Store logic lives in Zustand and should stay predictable.

## Repository shape

- `src/components/` — React and R3F components.
- `src/store/` — global game state and helpers.
- `src/engine/` — physics, collision, and runtime integration.
- `src/test/` — Vitest coverage.
- `memory/` — long-lived project memory for designs and tasks.
