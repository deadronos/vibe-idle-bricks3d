import { describe, expect, it } from 'vitest';
import {
  checkAndUnlockAchievements,
  getAchievementView,
  getBallSpeedLevel,
  meetsAchievement,
} from '../store/achievements';
import {
  ACHIEVEMENTS,
  DEFAULT_BALL_COUNT,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_SPEED,
  DEFAULT_WAVE,
} from '../store/constants';
import type { GameState } from '../store/types';

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  score: 0,
  bricksDestroyed: 0,
  wave: DEFAULT_WAVE,
  maxWaveReached: DEFAULT_WAVE,
  unlockedAchievements: [],
  settings: { enableBloom: true, enableShadows: true, enableSound: true, enableParticles: true },
  // Prestige / meta
  vibeCrystals: 0,
  prestigeLevel: 0,
  prestigeMultiplier: 1,
  // Combo
  comboCount: 0,
  comboMultiplier: 1,
  lastHitTime: 0,
  bricks: [],
  balls: [],
  isPaused: false,
  ballSpawnQueue: 0,
  lastBallSpawnTime: 0,
  ballDamage: DEFAULT_BALL_DAMAGE,
  ballSpeed: DEFAULT_BALL_SPEED,
  ballCount: DEFAULT_BALL_COUNT,
  critChance: 0,
  addScore: () => {},
  spawnBall: () => {},
  removeBall: () => {},
  updateBallPosition: () => {},
  updateBallVelocity: () => {},
  damageBrick: () => {},
  removeBrick: () => {},
  regenerateBricks: () => {},
  togglePause: () => {},
  upgradeBallDamage: () => {},
  upgradeBallSpeed: () => {},
  upgradeBallCount: () => {},
  upgradeCritChance: () => {},
  getCritChanceCost: () => 0,
  getBallDamageCost: () => 0,
  getBallSpeedCost: () => 0,
  getBallCountCost: () => 0,
  resetGame: () => {},
  queueBallSpawns: () => {},
  tryProcessBallSpawnQueue: () => {},
  forceProcessAllQueuedBalls: () => {},
  toggleSetting: () => {},
  performPrestige: () => {},
  getPrestigeReward: () => 0,
  resetCombo: () => {},
  ...overrides,
});

describe('achievements helpers', () => {
  it('calculates ball speed levels from the default speed', () => {
    expect(getBallSpeedLevel(DEFAULT_BALL_SPEED)).toBe(1);
    expect(getBallSpeedLevel(DEFAULT_BALL_SPEED + 0.08)).toBe(5);
  });

  it('meets wave achievements when maxWaveReached satisfies the threshold', () => {
    const waveFive = ACHIEVEMENTS.find((achievement) => achievement.id === 'wave-5');
    expect(waveFive).toBeDefined();
    if (!waveFive) return;

    const view = getAchievementView(makeState({ wave: 3, maxWaveReached: 5 }));
    expect(meetsAchievement(waveFive, view)).toBe(true);
  });

  it('unlocks score achievements based on overrides without duplicating existing unlocks', () => {
    const state = makeState();
    const unlocked = checkAndUnlockAchievements(state, { score: 1000 });

    expect(unlocked).toContain('score-1k');

    const alreadyUnlocked = checkAndUnlockAchievements(
      makeState({ unlockedAchievements: ['score-1k'] }),
      { score: 1000 }
    );
    expect(alreadyUnlocked).toEqual(['score-1k']);
  });

  it('meets upgrade achievements for ball speed based on level thresholds', () => {
    const speedAchievement = ACHIEVEMENTS.find(
      (achievement) => achievement.id === 'upgrade-speed-5'
    );
    expect(speedAchievement).toBeDefined();
    if (!speedAchievement) return;

    const view = getAchievementView(makeState({ ballSpeed: DEFAULT_BALL_SPEED + 0.08 }));
    expect(meetsAchievement(speedAchievement, view)).toBe(true);
  });
});
