# Learning Log

Use this file to capture fixes, learnings, and documentation follow-ups so future work benefits from the last resolved issue instead of re-solving it.

## What to record

Add an entry here when any of these happen:

- A bug is found and fixed.
- A behavior change affects how the repo should be used.
- A documentation gap is discovered and closed.
- A test or validation step reveals a new pattern worth remembering.

## Entry template

```md
## YYYY-MM-DD — short title

- Symptom: what went wrong.
- Fix: what changed.
- Docs updated: which file(s) were updated.
- Follow-up: any test, rule, or workflow improvement that should persist.
```

## Practical rule

If a fix changes future agent behavior, update this file and the relevant guidance file in `docs/agents/` in the same change.

## 2026-06-18 — dependency upgrade lint compatibility

- Symptom: upgrading the toolchain surfaced a `react-hooks/set-state-in-effect` error in `SettingsPanel`, and the prior lockfiles also resolved `postprocessing@6.39.0`, which warned about `three@0.184.0`.
- Fix: moved the SAB status refresh trigger from the mount effect to the modal ref callback so the settings panel still refreshes on open without tripping the new React hooks lint rule, then refreshed the npm and pnpm lockfiles so both resolve `postprocessing@6.39.1`.
- Docs updated: `README.md`, `memory/techContext.md`, `docs/agents/learning-log.md`.
- Follow-up: after future dependency bumps, watch for React compiler lint rules becoming stricter even when runtime behavior stays correct, and keep both tracked lockfiles synchronized.
