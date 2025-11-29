# GitHub Copilot Instructions for Idle Bricks 3D

This document provides guidelines for GitHub Copilot when assisting with development on this project.

## Project Overview

Idle Bricks 3D is a 3D idle breakout game built with:

- **React 19** - UI framework with functional components and hooks
- **TypeScript** - Strict type checking enabled
- **Vite** - Build tool and dev server
- **React Three Fiber** - React renderer for Three.js
- **Drei** - Helper components for R3F
- **Three.js** - 3D graphics library
- **Zustand** - Lightweight state management
- **Vitest** - Testing framework

## Code Style Guidelines

### TypeScript

- Use strict TypeScript - all types must be explicitly defined
- Prefer interfaces over type aliases for object shapes
- Use `type` for unions, intersections, and mapped types
- Avoid `any` - use `unknown` if type is truly unknown
- Use const assertions where appropriate

### React

- Use functional components exclusively
- Use hooks for state and side effects
- Prefer composition over inheritance
- Keep components small and focused
- Use React Three Fiber patterns for 3D components

### Formatting

- Code is formatted with Prettier (see `.prettierrc`)
- Single quotes for strings
- Semicolons required
- 2-space indentation
- 100 character line width
- Trailing commas in ES5-compatible positions

### State Management

- Use Zustand for global game state
- Keep store actions simple and focused
- Use selectors for derived state
- Colocate related state and actions

## File Structure

```
src/
├── components/     # React components (UI and 3D)
├── store/         # Zustand state stores
├── test/          # Test files
├── App.tsx        # Main app component
└── main.tsx       # Entry point
```

## Development Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run lint:fix   # Run ESLint with auto-fix
npm run format     # Format code with Prettier
npm run typecheck  # Run TypeScript type checking
npm run test       # Run tests in watch mode
npm run test:run   # Run tests once
```

## Testing Guidelines

- Write unit tests for store logic
- Use Vitest with React Testing Library
- Test behavior, not implementation
- Keep tests focused and isolated

## 3D/Game Development Notes

- Game uses physics simulation for ball movement
- Bricks are arranged in a 3D grid with layers
- Camera uses OrbitControls for user interaction
- Performance is important - avoid unnecessary re-renders
- Use `useFrame` hook for animation loops

## When Generating Code

1. Follow existing patterns in the codebase
2. Maintain type safety
3. Keep components pure and functional
4. Consider performance implications for 3D code
5. Add appropriate TypeScript types
6. Follow the established file organization
