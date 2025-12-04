/**
 * Compatibility shim: the store now lives in slice-based composition under createStore.ts.
 * Keep this file so existing imports continue to work during the migration.
 */
export * from './index';
