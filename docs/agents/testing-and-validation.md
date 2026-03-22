# Testing and Validation

## Standard validation commands

- `npm run typecheck`
- `npm run lint`
- `npm run test:run`
- `npm run build`

## Testing approach

- Favor unit tests for store logic and pure functions.
- Keep tests focused and isolated.
- Prefer behavior over implementation details.
- Use React Testing Library for UI-oriented tests when needed.

## When to add tests

- New gameplay logic.
- Store changes.
- Physics or collision changes.
- Regression fixes.
- Any behavior that previously failed or was ambiguous.
