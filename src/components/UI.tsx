import { useGameStore } from '../store/gameStore'
import './UI.css'

export function UI() {
  const score = useGameStore((state) => state.score)
  const bricksDestroyed = useGameStore((state) => state.bricksDestroyed)
  const ballCount = useGameStore((state) => state.ballCount)
  const ballDamage = useGameStore((state) => state.ballDamage)
  const ballSpeed = useGameStore((state) => state.ballSpeed)
  const isPaused = useGameStore((state) => state.isPaused)
  
  const togglePause = useGameStore((state) => state.togglePause)
  const upgradeBallDamage = useGameStore((state) => state.upgradeBallDamage)
  const upgradeBallSpeed = useGameStore((state) => state.upgradeBallSpeed)
  const upgradeBallCount = useGameStore((state) => state.upgradeBallCount)
  
  const damageCost = useGameStore((state) => state.getBallDamageCost())
  const speedCost = useGameStore((state) => state.getBallSpeedCost())
  const ballCost = useGameStore((state) => state.getBallCountCost())
  
  return (
    <div className="ui-container">
      {/* Score Panel */}
      <div className="panel score-panel">
        <h2>Score</h2>
        <div className="score-value">{score.toLocaleString()}</div>
        <div className="stat">
          <span>Bricks Destroyed:</span>
          <span>{bricksDestroyed}</span>
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
        
        <button 
          className="upgrade-button"
          onClick={upgradeBallSpeed}
          disabled={score < speedCost}
        >
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
      
      {/* Controls */}
      <div className="panel controls-panel">
        <button 
          className={`control-button ${isPaused ? 'paused' : ''}`}
          onClick={togglePause}
        >
          {isPaused ? '▶️ Resume' : '⏸️ Pause'}
        </button>
      </div>
      
      {/* Instructions */}
      <div className="instructions">
        <p>🖱️ Drag to rotate camera • Scroll to zoom</p>
        <p>Watch the balls break bricks automatically!</p>
      </div>
    </div>
  )
}
