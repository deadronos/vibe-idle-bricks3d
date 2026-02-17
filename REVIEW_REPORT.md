# Repository Review Report

Date: February 17, 2026
Scope: Full repository review (`src/`, `tests/`, config, scripts, docs-adjacent signals from build/test output)

## Findings (Ordered by Severity)

### 1. High: Browser-incompatible `require(...)` in per-frame runtime path can disable worker physics and spam warnings
- Evidence:
  - `src/engine/FrameManager.tsx:282` uses `require('./multithread/runtime')` inside `useFrame`.
  - `src/engine/FrameManager.tsx:467` logs a warning in the catch path.
- Why this matters:
  - The app is ESM-first (`"type": "module"` in `package.json`), and browser runtime does not provide Node `require` by default.
  - If `require` fails in-browser, this code executes every frame, repeatedly taking fallback logic and emitting warnings, creating avoidable overhead/noise.
- Risk:
  - Multithread/SAB code paths may be effectively unavailable in real browser sessions.
  - Console spam and per-frame exception handling can degrade performance on long sessions.

### 2. High: Settings SAB controls depend on `require(...)`, likely making SAB init/shutdown UI non-functional in browser ESM
- Evidence:
  - `src/components/ui/SettingsPanel.tsx:39`, `src/components/ui/SettingsPanel.tsx:44`
  - `src/components/ui/SettingsPanel.tsx:163`, `src/components/ui/SettingsPanel.tsx:166`
  - `src/components/ui/SettingsPanel.tsx:185`, `src/components/ui/SettingsPanel.tsx:188`
- Why this matters:
  - Same ESM incompatibility concern as above, but directly user-facing in the settings panel.
  - The code catches failures and only logs warnings, so this can fail silently from a player perspective.
- Risk:
  - “Initialize SAB” and “Shutdown SAB” controls may appear but not actually operate in production browser builds.

### 3. Medium: Rapier world lifecycle is not explicitly torn down when physics is toggled off at runtime
- Evidence:
  - Physics frame logic only enters Rapier branch when enabled: `src/engine/FrameManager.tsx:56`.
  - Teardown occurs on component unmount (`src/engine/FrameManager.tsx:32`) but there is no explicit “toggle-off” destroy path when `useRapierPhysics` flips from `true` to `false`.
- Why this matters:
  - Resources can remain allocated longer than needed if users switch physics modes in-session.
  - Internal registration refs (`regBallIds`, `regBrickIds`) are not reset on toggle-off.
- Risk:
  - Resource retention/stale runtime state during long play sessions with mode switching.

### 4. Medium: Production build output is very large and flagged by Vite chunk warnings
- Evidence:
  - Build output contains large bundles:
    - `dist/assets/index--HyLKBe_.js` ~1.36 MB minified
    - `dist/assets/rapier-DBjBuyhF.js` ~2.24 MB minified
  - Vite warns about chunks over 500 kB.
- Why this matters:
  - Startup/download time and mobile performance can be impacted.
- Risk:
  - Slower first load and weaker UX on constrained networks/devices.

### 5. Low: Test suite includes a placeholder skipped file that can hide accidental duplicate test coverage drift
- Evidence:
  - `tests/e2e/mobile-drawer.spec.ts:1` is a placeholder and `describe.skip(...)`.
  - Test run reports this file as skipped (`0 test`) while real tests live in `tests/e2e/mobile-drawer.spec.tsx`.
- Why this matters:
  - Noise in CI output and potential confusion when reviewing test coverage.

### 6. Low: Offline-progress logging is left as `console.log` in persisted rehydrate path
- Evidence:
  - `src/store/slices/persistence.ts:178`
- Why this matters:
  - This path runs for real users and can generate noisy production logs.
- Risk:
  - Log noise and reduced signal-to-noise for diagnosing actual runtime issues.

## Additional Signals Worth Tracking

- Build warning indicates Node core module externalization:
  - `src/engine/rapier/rapierInit.ts:74` dynamically imports `'module'`.
  - Vite warning during build: Node `"module"` externalized for browser compatibility.
- Tests pass, but many test workers emitted:
  - `Warning: --localstorage-file was provided without a valid path`
  - I did not find this flag configured in repository files, so it may be environment/tooling-injected. It should still be investigated for clean CI output.

## Checks Executed

- `npm run typecheck` ✅ pass
- `npm run lint` ✅ pass
- `npm run test:run` ✅ pass (43 files passed, 1 skipped)
- `npm run build` ✅ pass (with chunk-size and module-externalization warnings)

## Recommended Remediation Order

1. Replace browser-side `require(...)` usage with ESM-safe patterns (`import(...)` or static imports with code-splitting) in:
   - `src/engine/FrameManager.tsx`
   - `src/components/ui/SettingsPanel.tsx`
2. Add explicit Rapier teardown when `useRapierPhysics` transitions from enabled to disabled.
3. Reduce initial bundle size (lazy-load heavy physics/runtime modules, tune chunking strategy).
4. Remove or consolidate placeholder skipped test files.
5. Gate noisy `console.log` calls behind development flags or remove them.
