# Tech Context

## Stack

- React 19.x
- TypeScript 5.x
- React Three Fiber (R3F)
- Three.js
- Zustand
- Vite
- Vitest for tests

## Dev setup

- npm install
- npm run dev to start
- npm run build to produce production assets

## Runtime persistence

- Uses Zustand `persist` middleware to save meta-only progression under localStorage key `idle-bricks3d:game:v1`.  
- Hydration uses `onRehydrateStorage` to guard and reconstruct runtime entities (bricks and balls).  

## Constraints and deps

- Keep dependencies minimal to reduce bundle size
- Target modern browsers; polyfills only when necessary
