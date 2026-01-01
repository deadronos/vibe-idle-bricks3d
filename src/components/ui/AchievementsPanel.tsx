import { ACHIEVEMENTS, useGameStore } from '../../store/gameStore';

/**
 * Panel displaying unlocked achievements.
 * Shows a summary count and a list of recently unlocked achievements.
 *
 * @returns {JSX.Element} The achievements panel.
 */
export function AchievementsPanel() {
  const unlockedAchievements = useGameStore((state) => state.unlockedAchievements);
  const unlockedList = ACHIEVEMENTS.filter((achievement) =>
    unlockedAchievements.includes(achievement.id)
  );

  return (
    <div className="panel achievements-panel" role="region" aria-labelledby="achievements-heading">
      <h2 id="achievements-heading">Achievements</h2>
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
  );
}
