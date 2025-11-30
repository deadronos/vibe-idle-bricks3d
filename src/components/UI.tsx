import { useEffect } from 'react';
import { ACHIEVEMENTS, useGameStore } from '../store/gameStore';
import './UI.css';

export function UI() {
  const score = useGameStore((state) => state.score);
  const bricksDestroyed = useGameStore((state) => state.bricksDestroyed);
  const wave = useGameStore((state) => state.wave);
  const maxWaveReached = useGameStore((state) => state.maxWaveReached);
  const ballCount = useGameStore((state) => state.ballCount);
  const ballDamage = useGameStore((state) => state.ballDamage);
  const ballSpeed = useGameStore((state) => state.ballSpeed);
  const isPaused = useGameStore((state) => state.isPaused);
  const unlockedAchievements = useGameStore((state) => state.unlockedAchievements);

  const togglePause = useGameStore((state) => state.togglePause);
  const upgradeBallDamage = useGameStore((state) => state.upgradeBallDamage);
  const upgradeBallSpeed = useGameStore((state) => state.upgradeBallSpeed);
  const upgradeBallCount = useGameStore((state) => state.upgradeBallCount);

  const damageCost = useGameStore((state) => state.getBallDamageCost());
  const speedCost = useGameStore((state) => state.getBallSpeedCost());
  const ballCost = useGameStore((state) => state.getBallCountCost());

  const unlockedList = ACHIEVEMENTS.filter((achievement) =>
    unlockedAchievements.includes(achievement.id)
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
      }
      if (event.code === 'KeyU') {
        event.preventDefault();
        upgradeBallDamage();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePause, upgradeBallDamage]);

  const latestAchievementId = unlockedAchievements[unlockedAchievements.length - 1];
  const latestAchievement = ACHIEVEMENTS.find((item) => item.id === latestAchievementId);
  const liveMessage = latestAchievement ? `Achievement unlocked: ${latestAchievement.label}` : '';

  return (
    <div className="ui-container">
      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>

      {/* Score Panel */}
      <div className="panel score-panel">
        <h2>Score</h2>
        <div className="score-value">{score.toLocaleString()}</div>
        <div className="stat">
          <span>Bricks Destroyed:</span>
          <span>{bricksDestroyed}</span>
        </div>
        <div className="stat">
          <span>Wave:</span>
          <span>
            {wave} / {maxWaveReached}
          </span>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="panel stats-panel">
        <h2>Stats</h2>
        <div className="stat">
          <span>Balls:</span>
          <span>{ballCount}</span>
        </div>
        <div className="stat">
          <span>Damage:</span>
          <span>{ballDamage}</span>
        </div>
        <div className="stat">
          <span>Speed:</span>
          <span>{(ballSpeed * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Upgrades Panel */}
      <div className="panel upgrades-panel">
        <h2>Upgrades</h2>

        <button
          className="upgrade-button"
          onClick={upgradeBallDamage}
          disabled={score < damageCost}
        >
          <div className="upgrade-info">
            <span className="upgrade-name">⚔️ Ball Damage +1</span>
            <span className="upgrade-cost">{damageCost.toLocaleString()} pts</span>
          </div>
        </button>

        <button className="upgrade-button" onClick={upgradeBallSpeed} disabled={score < speedCost}>
          <div className="upgrade-info">
            <span className="upgrade-name">💨 Ball Speed +2%</span>
            <span className="upgrade-cost">{speedCost.toLocaleString()} pts</span>
          </div>
        </button>

        <button
          className="upgrade-button"
          onClick={upgradeBallCount}
          disabled={score < ballCost || ballCount >= 20}
        >
          <div className="upgrade-info">
            <span className="upgrade-name">🔮 New Ball</span>
            <span className="upgrade-cost">{ballCost.toLocaleString()} pts</span>
          </div>
        </button>
      </div>

      {/* Achievements Panel */}
      <div className="panel achievements-panel">
        <h2>Achievements</h2>
        <div className="stat">
          <span>Unlocked:</span>
          <span>
            {unlockedList.length} / {ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="achievements-list">
          {unlockedList.slice(0, 4).map((achievement) => (
            <div key={achievement.id} className="achievement-row">
              <span className="achievement-label">{achievement.label}</span>
              <span className="achievement-description">{achievement.description}</span>
            </div>
          ))}
          {unlockedList.length === 0 && <div className="achievement-empty">No unlocks yet.</div>}
        </div>
      </div>

      {/* Controls */}
      <div className="panel controls-panel">
        <button className={`control-button ${isPaused ? 'paused' : ''}`} onClick={togglePause}>
          {isPaused ? '▶️ Resume' : '⏸️ Pause'}
        </button>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <p>🖱️ Drag to rotate camera • Scroll to zoom</p>
        <p>Watch the balls break bricks automatically!</p>
        <p>⎵ Space to pause/resume • U to upgrade damage</p>
      </div>
    </div>
  );
}
