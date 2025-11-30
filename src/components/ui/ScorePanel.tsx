import { useGameStore } from '../../store/gameStore';

export function ScorePanel() {
  const score = useGameStore((state) => state.score);
  const bricksDestroyed = useGameStore((state) => state.bricksDestroyed);
  const wave = useGameStore((state) => state.wave);
  const maxWaveReached = useGameStore((state) => state.maxWaveReached);

  return (
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
  );
}
