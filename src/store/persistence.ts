/**
 * Exports persistence-related utilities.
 * Includes storage creation, existing storage checks, and rehydration logic.
 */
export { createMetaStorage, hasExistingStorage } from './persistence/metaStorage';
export { handleRehydrate } from './persistence/rehydrate';
export type { RehydrateDeps, RehydrateState } from './persistence/rehydrate';
