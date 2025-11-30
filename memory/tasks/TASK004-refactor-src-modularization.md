# TASK004 - Refactor: Modularize `src/` (Store & Components)

**Status:** In Progress  
**Added:** 2025-11-30  
**Updated:** 2025-11-30

## Original Request

Create a task from [DESIGN003 — Refactor: modularize `src/`](../designs/DESIGN003-refactor-src-modularization.md) to break down `gameStore.ts`, `BricksInstanced.tsx`, and `UI.tsx` into smaller, focused modules without changing runtime behavior or persistence schema.

## Thought Process

The current store and key components mix types, constants, helpers, rendering logic, and persistence concerns, making tests harder and slowing refactors. The plan is to extract pure logic into dedicated files with unit tests while keeping the `useGameStore` API and persistence key stable. Bricks and UI will be split into focused components/hooks to reduce render scope and cognitive load.

## Implementation Plan

1. Extract `src/store/types.ts` and `constants.ts`, updating `gameStore.ts` imports; keep behavior identical.  
2. Extract `createInitials.ts` and `achievements.ts`, add unit tests for achievement rules, and wire imports back into the store.  
3. Extract `persistence.ts` for storage adapter and `onRehydrateStorage` logic; preserve `STORAGE_KEY` and partialize contract.  
4. Simplify `gameStore.ts` action handlers to delegate to pure helpers while keeping the `useGameStore` API unchanged.  
5. Split `BricksInstanced` into a rendering component plus `useInstancedBricks` hook and `utils.ts`; add tests for `getDamageColor`/hover logic where feasible.  
6. Split `UI.tsx` into panel components and `useKeyboardShortcuts`; ensure selectors minimize re-renders and behavior stays the same.

## Progress Tracking

**Overall Status:** In Progress - 15%

### Subtasks

| ID  | Description                                                      | Status       | Updated    | Notes |
| --- | ---------------------------------------------------------------- | ------------ | ---------- | ----- |
| 1.1 | Extract store types/constants and update imports                 | Completed    | 2025-11-30 | Created `src/store/types.ts` and `constants.ts`; updated `gameStore.ts` imports/exports and re-ran typecheck |
| 2.1 | Extract createInitials/achievements with unit tests              | Not Started  | 2025-11-30 |  |
| 3.1 | Extract persistence helpers and keep STORAGE_KEY/partialize same | Not Started  | 2025-11-30 |  |
| 4.1 | Slim `gameStore.ts` actions while keeping API stable             | Not Started  | 2025-11-30 |  |
| 5.1 | Split BricksInstanced into hook/utils + add tests                | Not Started  | 2025-11-30 |  |
| 6.1 | Split UI into panels + keyboard hook; preserve behavior          | Not Started  | 2025-11-30 |  |

## Progress Log

### 2025-11-30

- Task created from DESIGN003 to track modularization of store, BricksInstanced, and UI with matching tests and unchanged behavior/persistence.
- Extracted store types/constants into dedicated modules and updated `gameStore.ts` imports/exports; confirmed `npm run typecheck` passes.
