import { useGameStore } from '../../store/gameStore';

/**
 * Game controls panel and help instructions.
 * Provides a button to toggle pause/resume.
 *
 * @returns {JSX.Element} The controls component.
 */
export function Controls() {
  const isPaused = useGameStore((state) => state.isPaused);
  const togglePause = useGameStore((state) => state.togglePause);

  return (
    <>
      <div className="panel controls-panel">
        <button
          className={`control-button ${isPaused ? 'paused' : ''}`}
          onClick={togglePause}
          aria-pressed={isPaused ? 'true' : 'false'}
          aria-label={isPaused ? 'Resume game' : 'Pause game'}
        >
          {isPaused ? '▶️ Resume' : '⏸️ Pause'}
        </button>
      </div>
      <div className="instructions">
        <p>🖱️ Drag to rotate camera • Scroll to zoom</p>
        <p>Watch the balls break bricks automatically!</p>
        <p>⎵ Space to pause/resume • U to upgrade damage</p>
      </div>
    </>
  );
}
