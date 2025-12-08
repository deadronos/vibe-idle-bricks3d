import { useGameStore } from '../../store/gameStore';

/**
 * Panel displaying the main score, wave progress, and bricks destroyed.
 * Also contains the entry point for the settings menu.
 *
 * @param {Object} props - Component props.
 * @param {Function} props.onOpenSettings - Callback to open the settings panel.
 * @returns {JSX.Element} The score panel.
 */
export function ScorePanel({ onOpenSettings }: { onOpenSettings: () => void }) {
  const score = useGameStore((state) => state.score);
  const bricksDestroyed = useGameStore((state) => state.bricksDestroyed);
  const wave = useGameStore((state) => state.wave);
  const maxWaveReached = useGameStore((state) => state.maxWaveReached);

  return (
    <div className="panel score-panel" role="region" aria-labelledby="score-heading">
      <button
        className="gear-icon"
        onClick={onOpenSettings}
        aria-label="Settings"
        aria-controls="settings-heading"
        aria-haspopup="dialog"
      >
        ⚙️
      </button>
      <h2 id="score-heading">Score</h2>
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
