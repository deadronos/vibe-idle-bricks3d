import { ACHIEVEMENTS, useGameStore } from '../../store/gameStore';

export function AchievementsPanel() {
  const unlockedAchievements = useGameStore((state) => state.unlockedAchievements);
  const unlockedList = ACHIEVEMENTS.filter((achievement) =>
    unlockedAchievements.includes(achievement.id)
  );

  return (
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
  );
}
