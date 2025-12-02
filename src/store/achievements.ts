import { ACHIEVEMENTS, DEFAULT_BALL_SPEED } from './constants';
import type { AchievementDefinition, GameState } from './types';

export type AchievementView = Pick<
  GameState,
  | 'score'
  | 'bricksDestroyed'
  | 'wave'
  | 'maxWaveReached'
  | 'ballDamage'
  | 'ballSpeed'
  | 'ballCount'
  | 'unlockedAchievements'
>;

export const getBallSpeedLevel = (speed: number) =>
  Math.round((speed - DEFAULT_BALL_SPEED) / 0.02) + 1;

export const getAchievementView = (
  state: GameState,
  overrides: Partial<AchievementView> = {}
): AchievementView => ({
  score: overrides.score ?? state.score,
  bricksDestroyed: overrides.bricksDestroyed ?? state.bricksDestroyed,
  wave: overrides.wave ?? state.wave,
  maxWaveReached: overrides.maxWaveReached ?? state.maxWaveReached,
  ballDamage: overrides.ballDamage ?? state.ballDamage,
  ballSpeed: overrides.ballSpeed ?? state.ballSpeed,
  ballCount: overrides.ballCount ?? state.ballCount,
  unlockedAchievements: overrides.unlockedAchievements ?? state.unlockedAchievements,
});

export const meetsAchievement = (achievement: AchievementDefinition, state: AchievementView) => {
  switch (achievement.type) {
    case 'score':
      return state.score >= achievement.threshold;
    case 'bricks':
      return state.bricksDestroyed >= achievement.threshold;
    case 'wave':
      return state.wave >= achievement.threshold || state.maxWaveReached >= achievement.threshold;
    case 'upgrade': {
      if (!achievement.metric) return false;
      if (achievement.metric === 'ballSpeed') {
        return getBallSpeedLevel(state.ballSpeed) >= achievement.threshold;
      }
      if (achievement.metric === 'ballDamage') {
        return state.ballDamage >= achievement.threshold;
      }
      if (achievement.metric === 'ballCount') {
        return state.ballCount >= achievement.threshold;
      }
      return false;
    }
    default:
      return false;
  }
};

export const mergeUnlocks = (current: string[], additions: string[]) => {
  const unique = new Set([...current, ...additions]);
  return Array.from(unique);
};

export const checkAndUnlockAchievements = (
  state: GameState,
  overrides: Partial<AchievementView> = {}
) => {
  const view = getAchievementView(state, overrides);
  const newlyUnlocked = ACHIEVEMENTS.filter(
    (achievement) =>
      !view.unlockedAchievements.includes(achievement.id) && meetsAchievement(achievement, view)
  ).map((achievement) => achievement.id);

  return mergeUnlocks(view.unlockedAchievements, newlyUnlocked);
};
