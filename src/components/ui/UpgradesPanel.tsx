import { useGameStore } from '../../store/gameStore';

export function UpgradesPanel() {
  const score = useGameStore((state) => state.score);
  const ballCount = useGameStore((state) => state.ballCount);
  const upgradeBallDamage = useGameStore((state) => state.upgradeBallDamage);
  const upgradeBallSpeed = useGameStore((state) => state.upgradeBallSpeed);
  const upgradeBallCount = useGameStore((state) => state.upgradeBallCount);
  const damageCost = useGameStore((state) => state.getBallDamageCost());
  const speedCost = useGameStore((state) => state.getBallSpeedCost());
  const ballCost = useGameStore((state) => state.getBallCountCost());

  return (
    <div className="panel upgrades-panel">
      <h2>Upgrades</h2>

      <button className="upgrade-button" onClick={upgradeBallDamage} disabled={score < damageCost}>
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
  );
}
