import type { GameStoreSlice } from '../types';
import type { GameActions } from '../../types';
import { createScoreSlice } from './score';
import { createUpgradesSlice } from './upgrades';
import { createPrestigeSlice } from './prestige';
import { createHitsSlice } from './hits';

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

export const createProgressionSlice: GameStoreSlice<ProgressionActions> = (set, get) => ({
  ...createScoreSlice(set),
  ...createUpgradesSlice(set, get),
  ...createPrestigeSlice(set, get),
  ...createHitsSlice(set, get),
});
