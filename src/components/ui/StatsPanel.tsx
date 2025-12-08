import { useGameStore } from '../../store/gameStore';

/**
 * Displays current game statistics (ball count, damage, speed).
 *
 * @returns {JSX.Element} The stats panel component.
 */
export function StatsPanel() {
  const ballCount = useGameStore((state) => state.ballCount);
  const ballDamage = useGameStore((state) => state.ballDamage);
  const ballSpeed = useGameStore((state) => state.ballSpeed);

  return (
    <div className="panel stats-panel" role="region" aria-labelledby="stats-heading">
      <h2 id="stats-heading">Stats</h2>
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
  );
}
