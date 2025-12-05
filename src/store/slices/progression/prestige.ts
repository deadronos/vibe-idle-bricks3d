import { DEFAULT_BALL_DAMAGE, DEFAULT_BALL_SPEED, DEFAULT_WAVE } from '../../constants';
import { createInitialBall, createInitialBricks } from '../../createInitials';
import { buildInitialState } from '../persistence';
import type { GameState } from '../../types';

export const calculatePrestigeReward = (maxWaveReached: number): number => {
  return Math.max(0, Math.floor(Math.sqrt(maxWaveReached - 1)));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createPrestigeSlice = (set: any, get: any) => ({
  getPrestigeReward: () => {
    const { maxWaveReached } = get();
    return calculatePrestigeReward(maxWaveReached);
  },

  performPrestige: () =>
    set((state: GameState) => {
      const reward = calculatePrestigeReward(state.maxWaveReached);
      if (reward <= 0) return state;

      const vibeCrystals = state.vibeCrystals + reward;
      const prestigeLevel = state.prestigeLevel + 1;
      const prestigeMultiplier = 1 + vibeCrystals * 0.1;

      return {
        ...buildInitialState(),
        vibeCrystals,
        prestigeLevel,
        prestigeMultiplier,
        balls: [createInitialBall(DEFAULT_BALL_SPEED, DEFAULT_BALL_DAMAGE)],
        bricks: createInitialBricks(DEFAULT_WAVE),
        latestAnnouncement: `Prestiged: +${reward} Vibe Crystal${reward !== 1 ? 's' : ''} (+${Math.round((prestigeMultiplier - 1) * 100)}% score)`,
      };
    }),
});
