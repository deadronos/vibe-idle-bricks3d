# Contributing

Thanks for helping with Idle Bricks 3D — your contributions matter.

## Rapier default flip gating

- Because Rapier relies on WASM initialization which can behave differently across CI environments, any PR that flips the default `useRapierPhysics` flag to `true` MUST include a successful `rapier-init-smoke` CI run.
- The `rapier-init-smoke` CI job runs `src/test/rapier.smoke.test.ts` and will fail fast if `initRapier()` or a minimal `createWorld()` call fails.

Local testing:

```bash
# run the Rapier smoke test locally
npm run test:rapier-smoke

# override CI gating / debug on platforms where WASM fails
RAPIER=false npm run test:rapier-smoke
```

If the smoke test fails on your CI environment, consult the project maintainers before flipping the default — we may need to add platform-specific fixes or a rollout plan with feature flags.
