import { useGameStore } from '../../store/gameStore';
import { MAX_BALL_COUNT, MAX_CRIT_CHANCE } from '../../store/constants';

export function UpgradesList() {
  const score = useGameStore((state) => state.score);
  const ballCount = useGameStore((state) => state.ballCount);
  const upgradeBallDamage = useGameStore((state) => state.upgradeBallDamage);
  const upgradeBallSpeed = useGameStore((state) => state.upgradeBallSpeed);
  const upgradeBallCount = useGameStore((state) => state.upgradeBallCount);
  const upgradeCritChance = useGameStore((state) => state.upgradeCritChance);

  const damageCost = useGameStore((state) => state.getBallDamageCost());
  const speedCost = useGameStore((state) => state.getBallSpeedCost());
  const ballCost = useGameStore((state) => state.getBallCountCost());
  const critCost = useGameStore((state) => state.getCritChanceCost());
  const critChance = useGameStore((state) => state.critChance);

  return (
    <>
      <button
        className="upgrade-button"
        onClick={upgradeBallDamage}
        disabled={score < damageCost}
        aria-label={`Upgrade Ball Damage — costs ${damageCost.toLocaleString()} points`}
      >
        <div className="upgrade-info">
          <span className="upgrade-name">⚔️ Ball Damage</span>
          <span className="upgrade-cost">{damageCost.toLocaleString()} pts</span>
        </div>
      </button>

      <button
        className="upgrade-button"
        onClick={upgradeBallSpeed}
        disabled={score < speedCost}
        aria-label={`Upgrade Ball Speed — costs ${speedCost.toLocaleString()} points`}
      >
        <div className="upgrade-info">
          <span className="upgrade-name">💨 Ball Speed</span>
          <span className="upgrade-cost">{speedCost.toLocaleString()} pts</span>
        </div>
      </button>

      <button
        className="upgrade-button"
        onClick={upgradeBallCount}
        disabled={score < ballCost || ballCount >= MAX_BALL_COUNT}
        aria-label={`Add Ball — costs ${ballCost.toLocaleString()} points`}
      >
        <div className="upgrade-info">
          <span className="upgrade-name">🔮 New Ball</span>
          <span className="upgrade-cost">
            {ballCount >= MAX_BALL_COUNT ? 'MAX' : `${ballCost.toLocaleString()} pts`}
          </span>
        </div>
      </button>

      <button
        className="upgrade-button"
        onClick={upgradeCritChance}
        disabled={score < critCost || (critChance || 0) >= MAX_CRIT_CHANCE}
        aria-label={`Upgrade Crit Chance — costs ${critCost.toLocaleString()} points`}
      >
        <div className="upgrade-info">
          <span className="upgrade-name">⚡ Crit Chance</span>
          <span className="upgrade-cost">
            {(critChance || 0) >= MAX_CRIT_CHANCE ? 'MAX' : `${critCost.toLocaleString()} pts`}
          </span>
        </div>
      </button>
    </>
  );
}
