# AI Agent Development Guide

This document describes how AI agents should interact with and develop on the Idle Bricks 3D codebase.

Also see copilot instructions in `.github/copilot-instructions.md`.

## Project Context

Idle Bricks 3D is a 3D idle breakout game. Agents working on this project should understand:

- **Game Mechanics**: Balls bounce automatically, breaking bricks and earning points
- **Upgrade System**: Players spend points on damage, speed, and additional balls
- **3D Rendering**: Uses React Three Fiber for WebGL rendering
- **State Management**: Zustand store manages all game state
- **Physics**: Rapier3D via `@dimforge/rapier3d-compat`

## Repository Structure

```
├── src/
│   ├── components/       # React and R3F components
│   │   ├── Arena.tsx     # 3D boundaries
│   │   ├── Ball.tsx      # Ball physics and rendering
│   │   ├── Brick.tsx     # Brick rendering
│   │   ├── GameScene.tsx # Main 3D scene
│   │   └── UI.tsx        # HUD and upgrade panel
│   ├── store/
│   │   ├── index.ts      # Main store entry point
│   │   ├── gameStore.ts  # Zustand game state (shim/legacy)
│   │   └── slices/       # Store slices
│   ├── test/             # Unit and integration test files
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── .github/
│   ├── agents/           # Agent configuration files
│   └── instructions/     # Development instructions
├── memory/               # Memory bank for context persistence
├── tests/                # E2E tests and global setup
└── public/               # Static assets
```

## Development Workflow

### Before Making Changes

1. Read relevant source files to understand context
2. Run `pnpm lint` to check current lint status
3. Run `pnpm typecheck` to verify types
4. Run `pnpm test:run` to ensure tests pass

### Making Changes

1. Make minimal, focused changes
2. Follow existing code patterns
3. Maintain TypeScript strict mode compliance
4. Run `pnpm format` to ensure consistent formatting
5. Run `pnpm lint:fix` to auto-fix lint issues

### After Making Changes

1. Run `pnpm typecheck` to verify type safety
2. Run `pnpm lint` to check for issues
3. Run `pnpm test:run` to verify tests pass
4. Run `pnpm build` to ensure production build works

## Code Quality Standards

### Required Checks

All changes must pass:

- `pnpm typecheck` - TypeScript compilation
- `pnpm lint` - ESLint rules
- `pnpm test:run` - All tests
- `pnpm build` - Production build

### Formatting

Code must be formatted with Prettier:

```bash
pnpm format  # Auto-format all files
```

Configuration is in `.prettierrc`:

- Single quotes
- Semicolons
- 2-space indentation
- 100 char line width

## Agent-Specific Guidelines

### Conductor Agent

Orchestrates planning, implementation, and review cycles. For this project:

- Break down features into component-level tasks
- Consider 3D performance implications
- Coordinate store changes with component updates

### Planning Agent

When researching context:

- Review `src/store/index.ts` and `src/store/slices/` for state structure
- Check component props and types
- Understand game physics in `Ball.tsx` and `src/engine/`

### Implementation Agent

When implementing changes:

- Follow React Three Fiber patterns
- Use Zustand patterns from existing store
- Add appropriate TypeScript types
- Consider render performance (allocations in loop, etc.)

### Code Review Agent

When reviewing changes:

- Check for TypeScript strictness
- Verify game logic correctness
- Ensure 3D performance best practices
- Validate state management patterns

## Key Technologies

| Technology        | Version | Purpose                  |
| ----------------- | ------- | ------------------------ |
| React             | 19.x    | UI framework             |
| TypeScript        | 5.9.x   | Type safety              |
| React Three Fiber | 9.x     | React renderer for WebGL |
| Three.js          | 0.182.x | 3D graphics              |
| Zustand           | 5.x     | State management         |
| Vite              | 7.x     | Build tool               |
| Vitest            | 4.x     | Testing                  |
| ESLint            | 9.x     | Code linting             |
| Prettier          | 3.x     | Code formatting          |

## Testing Approach

- **Unit/Integration Tests**: Store logic and pure functions
- **Location**: `src/test/`
- **Framework**: Vitest with React Testing Library
- **Run**: `pnpm test:run`

## Common Tasks

### Adding a New Component

1. Create file in `src/components/`
2. Use TypeScript with proper prop types
3. Follow existing component patterns (PascalCase)
4. Add to parent component as needed

### Modifying Game State

1. Update types in `src/store/types.ts`
2. Add/modify actions in the store slices (`src/store/slices/`)
3. Update selectors if needed
4. Add tests for new logic

### Adding a New Feature

1. Plan the state changes needed
2. Implement store modifications first
3. Build UI/3D components
4. Add tests
5. Verify with full test suite

## Memory Bank

The `/memory` directory stores persistent context:

- `designs/` - Design documents
- `tasks/` - Task tracking

Agents should consult these for project context between sessions.

Important Details for the memory bank and spec driven workflows are in `.github/instructions/memory-bank.instructions.md` and `.github/instructions/spec-driven-workflow-v1.instructions.md`.
