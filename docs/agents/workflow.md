# Workflow

This file captures the default development workflow for the repository.

## Before making changes

1. Read the relevant source files.
2. Check the current lint status.
3. Run type checking.
4. Run tests that cover the affected area.

## When making changes

- Make minimal, focused edits.
- Follow existing code patterns.
- Keep TypeScript strict.
- Prefer small, testable increments.
- Format code before finishing.

## After making changes

Run the standard validation set:

- `npm run typecheck`
- `npm run lint`
- `npm run test:run`
- `npm run build`

## Documentation update rule

When a fix, behavior change, or error resolution changes how the repo should be worked on, update the relevant docs in `docs/agents/` so the next agent does not rediscover the same lesson the hard way.
