# Progress

**Last updated:** 2025-11-29

## What works

- Project scaffolding, core components, and store present in src/  
- Wave-based progression, achievements, and meta-only persistence implemented and covered by tests (`gameStore`).  
- UI exposes wave stats and unlocked achievements.

## What's left

- Performance profiling and optimization of `GameScene` and `Ball` updates for large numbers of entities.  
- UX polish and accessibility improvements for HUD and achievements.  
- More achievements and progression tune-ups based on playtesting.

## Current status

In active development: core gameplay implemented; follow-up tasks in memory/tasks/\_index.md

**Active tasks:** TASK002 - Performance Profiling & UX Polish (In Progress)

## Known issues

- Minor lint/type warnings may exist; run project checks before major changes
- Potential rehydrate/persist race: `should persist meta progression and rebuild runtime entities on hydrate` test fails intermittently (tracked in TASK003)
