import type { GameStoreSlice } from '../types';
import type { GameActions } from '../../types';
import { createScoreSlice } from './score';
import { createUpgradesSlice } from './upgrades';
import { createPrestigeSlice } from './prestige';
import { createHitsSlice } from './hits';

/**
 * Progression-related actions for the game store.
 */
type ProgressionActions = Pick<
  GameActions,
  | 'addScore'
  | 'damageBrick'
  | 'removeBrick'
  | 'regenerateBricks'
  | 'upgradeBallDamage'
  | 'upgradeBallSpeed'
  | 'upgradeBallCount'
  | 'getBallDamageCost'
  | 'getBallSpeedCost'
  | 'getBallCountCost'
  | 'performPrestige'
  | 'getPrestigeReward'
  | 'resetCombo'
  | 'applyHits'
>;

/**
 * Creates the aggregated progression slice.
 * Combines score, upgrades, prestige, and hits slices.
 *
 * @param {Function} set - The Zustand set function.
 * @param {Function} get - The Zustand get function.
 * @returns {ProgressionActions} The aggregated progression actions.
 */
export const createProgressionSlice: GameStoreSlice<ProgressionActions> = (set, get) => ({
  ...createScoreSlice(set),
  ...createUpgradesSlice(set, get),
  ...createPrestigeSlice(set, get),
  ...createHitsSlice(set, get),
});
