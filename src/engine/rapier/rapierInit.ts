/*
 * Lightweight dynamic initializer for @dimforge/rapier3d-compat.
 * The compat package sometimes exposes an initializer (default export)
 * or a namespace directly; handle both shapes and cache the result.
 */

export type RapierModule = any;

let cached: RapierModule | null = null;

export async function initRapier(): Promise<RapierModule> {
  if (cached) return cached;

  try {
    // Dynamic import so bundlers can handle the WASM asset
    const mod = await import('@dimforge/rapier3d-compat');

    // The compat entry sometimes exports an initializer function
    const initializer: any = typeof mod === 'function' ? mod : mod.default || mod.init;

    if (typeof initializer === 'function') {
      // Call initializer if available — some builds return the runtime namespace
      // while others populate the module and return undefined.
      // When running under Node (tests/CI), provide a locateFile helper so WASM
      // can be resolved from the package folder. In browsers bundlers generally
      // take care of WASM assets automatically.
      let maybe: any;
      try {
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          // node environment — use createRequire to resolve the package-relative wasm path
          // Import dynamically so bundlers don't try to polyfill it.
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { createRequire } = await import('module');
          const req = createRequire(import.meta.url);
          maybe = await initializer({ locateFile: (f: string) => req.resolve(`@dimforge/rapier3d-compat/${f}`) });
        } else {
          maybe = await initializer();
        }
      } catch (err) {
        // Retry without options if the above pattern isn't supported by this build
        maybe = await initializer();
      }

      cached = maybe || mod;
    } else {
      cached = mod;
    }

    return cached;
  } catch (err) {
    cached = null;
    // Rethrow a helpful message so CI/consumers can see the failure
    throw new Error(`initRapier failed: ${(err as Error).message}`);
  }
}

export function resetRapier() {
  cached = null;
}
