# SharedArrayBuffer / COOP+COEP (local dev)

This project includes an opt-in Vite dev-server flag to make it easy to test SharedArrayBuffer and WASM threaded scenarios locally.

Why: SharedArrayBuffer and WASM threads require the page to be cross-origin isolated. That involves setting two response headers:

- Cross-Origin-Embedder-Policy: require-corp
- Cross-Origin-Opener-Policy: same-origin

How to enable locally

- Set the environment variable `VITE_ENABLE_COOP=1` when running the dev server to enable COOP/COEP for cross-origin isolation.

  - macOS / Linux:

    ```bash
    VITE_ENABLE_COOP=1 npm run dev
    ```

  - Windows (PowerShell):

    ```powershell
    $Env:VITE_ENABLE_COOP = '1'; npm run dev
    ```

- To enable the experimental SharedArrayBuffer-based physics POC, set `VITE_ENABLE_SAB=1` in addition to `VITE_ENABLE_COOP`:

  - macOS / Linux:

    ```bash
    VITE_ENABLE_COOP=1 VITE_ENABLE_SAB=1 npm run dev
    ```

  - Windows (PowerShell):

    ```powershell
    $Env:VITE_ENABLE_COOP = '1'; $Env:VITE_ENABLE_SAB = '1'; npm run dev
    ```

  When enabled, the FrameManager will attempt to initialize a SAB worker and use zero-copy in-place buffers for ball state updates. If SharedArrayBuffer or cross-origin isolation are not available, the runtime will safely fall back to the transferable-worker or main-thread path.

Notes & caveats

- Enabling COOP/COEP may break third-party resources that don't set appropriate CORP/CORS headers. Use it for local testing only unless you have full control over production headers.
- The multithreading runtime will fall back to transferable ArrayBuffer message passing when SharedArrayBuffer is not available.
- See `src/engine/multithread` for the POC kernel (`kernel.ts`) and runtime (`runtime.ts`).

Testing

- After enabling COOP/COEP, open the app and verify `globalThis.crossOriginIsolated` is `true` in the console.
- The multithread runtime exposes `supportsSharedArrayBuffer` so you can gate features or show a UI toggle.

Runtime toggle & inspection

- Open the **Settings** modal (gear icon) and look for **"SharedArrayBuffer Physics (Experimental)"**. Toggle it on to allow the app to try initializing the SAB-based runtime.
- If the runtime is supported by the browser and COOP/COEP is active, an **Initialize SAB** button will appear in the settings. Click it to initialize the worker and buffers.
- After initialization the panel will show **Initialized: Yes** and the runtime will begin accepting zero-copy simulation jobs. Use **Shutdown SAB** to cleanly stop the worker.

Ring-buffer behavior (developer notes)

- The SAB runtime uses a small ring buffer of per-frame slots (default 4) to allow pipelined, in-place simulation of multiple frames without copying between main thread and worker.
- When the ring is full, `submitJobIfIdle` returns `false`, indicating backpressure; the main thread should skip submission that frame and keep using the most recent available result.
- This POC is intentionally conservative; run the app, enable the SAB toggle, and verify simulation results visually and via the settings panel status before relying on it for higher throughput testing.

Manual integration test flow (dev)

1. Start the dev server with COOP and SAB enabled:

   - macOS / Linux:

     ```bash
     VITE_ENABLE_COOP=1 VITE_ENABLE_SAB=1 npm run dev
     ```

   - Windows (PowerShell):

     ```powershell
     $Env:VITE_ENABLE_COOP = '1'; $Env:VITE_ENABLE_SAB = '1'; npm run dev
     ```

2. Open the app in a browser that supports `SharedArrayBuffer` in cross-origin isolated pages (Chrome 92+, etc.).
3. Open Settings → enable **SharedArrayBuffer Physics (Experimental)** and press **Initialize SAB**.
4. Observe the **Initialized: Yes** status and verify the simulation continues to advance.
5. Toggle **Shutdown SAB** to verify the worker shuts down cleanly and the app falls back to the transferable-worker or main-thread path.

Cross-platform dev server (Windows users)

- To start a dev server with COOP/COEP + SAB on any platform you can use the included convenience script (adds `cross-env` for Windows):

```bash
npm run dev:sab
```

- Or run with `npx` explicitly:

```bash
npx cross-env VITE_ENABLE_COOP=1 VITE_ENABLE_SAB=1 npm run dev
```

This avoids errors like `"VITE_ENABLE_COOP" is not recognized` that occur when trying to set env vars directly on Windows shells.

Optional CI: GitHub Actions (manual opt-in)

- A manual GitHub Actions workflow is provided to run the SAB E2E test that starts a dev server with COOP/COEP and runs Playwright against the app.
- Trigger it manually from the repository Actions tab: select **SAB E2E (opt-in)** and click **Run workflow** (you don't need to provide any inputs).
- The workflow installs browsers and runs the `e2e/sab.spec.ts` Playwright test; it will only run when triggered manually or when a PR label `run-sab-e2e` is added to a PR (opt-in by label).
- For local runs, install Playwright locally and run:

```bash
npm ci
npx playwright install --with-deps
npm run test:e2e -- --project=chromium e2e/sab.spec.ts
```

Note: The CI workflow is intentionally opt-in because cross-origin isolation and Playwright browser dependencies can be disruptive in shared CI runs.


Security

- Only enable these headers when you understand the security implications and have reviewed third-party resources used by the page.
