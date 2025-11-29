# System Patterns

## Architecture overview

- React + React Three Fiber for rendering
- Zustand for global game state
- Vite for bundling and dev server

## Key technical decisions

- Keep game logic (ball physics, scoring, upgrades) separated from rendering components

## Design patterns

- Store acts as single source of truth; UI subscribes to slices
- Components are small and focused (Ball, Brick, Arena, UI)

## Component relationships

- App -> GameScene -> (Arena, Balls[], Bricks[])
