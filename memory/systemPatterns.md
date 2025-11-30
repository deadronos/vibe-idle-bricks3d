# System Patterns

## Architecture overview

- React + React Three Fiber for rendering
- Zustand for global game state
- Vite for bundling and dev server

## Key technical decisions

- Keep game logic (ball physics, scoring, upgrades) separated from rendering components
- Instanced meshes rely on per-instance colors only; `vertexColors` stays disabled until geometry provides its own color attribute to prevent black materials

## Design patterns

- Store acts as single source of truth; UI subscribes to slices
- Components are small and focused (Ball, Brick, Arena, UI)

## Component relationships

- App -> GameScene -> (Arena, Balls[], Bricks[])
