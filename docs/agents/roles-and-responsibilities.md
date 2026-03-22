# Roles and Responsibilities

These notes extract the role guidance from `AGENTS.md` into smaller, easier-to-load chunks.

## Conductor

- Break work into component-level tasks.
- Consider 3D performance implications.
- Coordinate store and component updates.

## Planning

- Review `gameStore.ts` for state structure.
- Check component props and types.
- Understand ball physics before changing simulation behavior.

## Implementation

- Follow React Three Fiber patterns.
- Use Zustand conventions from the existing store.
- Add explicit TypeScript types.
- Avoid unnecessary render churn.

## Code review

- Check TypeScript strictness.
- Verify game logic correctness.
- Watch for 3D performance regressions.
- Validate state management patterns.
