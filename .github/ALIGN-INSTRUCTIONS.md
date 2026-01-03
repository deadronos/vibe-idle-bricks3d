# Instruction Alignment & Audit

This document tracks the alignment and optimization of instruction files in `.github/instructions` and the root `AGENTS.md` to match the project's actual structure, tools, and best practices.

## Overview of Changes

| File | Purpose | Changes Made |
| :--- | :--- | :--- |
| `AGENTS.md` | Main entry point for AI agents | Updated package manager to `pnpm`, corrected store/test paths, updated tech stack versions (React 19, TS 5.9, etc.). |
| `nodejs-javascript-vitest.instructions.md` | Node.js/JS guidelines | Softened the "no comments" rule to allow necessary explanations. |
| `reactjs.instructions.md` | React development standards | Removed deprecated CRA/Webpack references, emphasized Vite/Vitest, updated React version to 19+. |
| `typescript-5-es2022.instructions.md` | TypeScript guidelines | Added exception for PascalCase naming of React components, updated run commands to `pnpm`. |
| `playwright-typescript.instructions.md` | E2E testing guidelines | Updated run command to `pnpm exec playwright test`. |
| `markdown.instructions.md` | Markdown standards | Relaxed strict front-matter requirements that were irrelevant to this project. |

## Rationale

### 1. Package Manager Consistency (`pnpm`)
The repository uses `pnpm` (evidenced by `pnpm-lock.yaml`). Several instruction files incorrectly referenced `npm` or `npx`. These have been updated to ensure agents use the correct commands for installing dependencies, running scripts, and executing binaries.

### 2. Modern Tech Stack Alignment
- **React 19**: The project uses React 19. Instructions were updated to reflect this and remove outdated patterns.
- **Vite/Vitest**: Replaced references to Create React App, Webpack, and Jest with Vite and Vitest, matching the actual build and test setup.
- **Three.js / R3F**: `AGENTS.md` now explicitly mentions the 3D nature of the project and the relevant libraries.

### 3. Path Corrections
- **Store**: Clarified that `src/store/index.ts` is the main entry point, reducing confusion with the legacy/shim `gameStore.ts`.
- **Tests**: Clarified the distinction between unit/integration tests in `src/test/` and E2E tests in `tests/`.

### 4. Pragmatic Coding Standards
- **Comments**: Adjusted the strict "no comments" rule to allow for necessary documentation of complex logic and public APIs, aligning with code review best practices.
- **Naming**: Explicitly allowed PascalCase for React components in TypeScript files, resolving a conflict with the general kebab-case rule.

### 5. Markdown Flexibility
- Removed strict Microsoft-specific front matter requirements from markdown instructions to allow for standard documentation practices without validation errors.
