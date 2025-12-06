import { ACHIEVEMENTS, DEFAULT_BALL_SPEED } from './constants';
import type { AchievementDefinition, GameState } from './types';

/**
 * Subset of GameState required to check achievement progress.
 */
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

/**
 * Calculates the ball speed level based on the raw speed value.
 *
 * @param {number} speed - The current ball speed.
 * @returns {number} The calculated level (integer).
 */
export const getBallSpeedLevel = (speed: number) =>
  Math.round((speed - DEFAULT_BALL_SPEED) / 0.02) + 1;

/**
 * Creates a view of the game state for achievement checking, potentially overriding some values.
 *
 * @param {GameState} state - The current game state.
 * @param {Partial<AchievementView>} [overrides={}] - Optional overrides for state properties.
 * @returns {AchievementView} The constructed view.
 */
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

/**
 * Checks if a specific achievement condition is met.
 *
 * @param {AchievementDefinition} achievement - The achievement to check.
 * @param {AchievementView} state - The current state view.
 * @returns {boolean} True if the achievement is met.
 */
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

/**
 * Merges a list of existing unlocked achievement IDs with new ones.
 *
 * @param {string[]} current - The current list of unlocked IDs.
 * @param {string[]} additions - The new IDs to add.
 * @returns {string[]} The merged, unique list of IDs.
 */
export const mergeUnlocks = (current: string[], additions: string[]) => {
  const unique = new Set([...current, ...additions]);
  return Array.from(unique);
};

/**
 * Checks for any newly unlocked achievements based on the current state.
 *
 * @param {GameState} state - The current game state.
 * @param {Partial<AchievementView>} [overrides={}] - Optional state overrides.
 * @returns {string[]} The updated list of unlocked achievement IDs.
 */
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
