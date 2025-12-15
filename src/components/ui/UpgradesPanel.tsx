import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { PrestigeModal } from './PrestigeModal';

/**
 * Desktop panel for purchasing upgrades and accessing prestige.
 *
 * @returns {JSX.Element} The upgrades panel.
 */
export function UpgradesPanel() {
  const score = useGameStore((state) => state.score);
  const ballCount = useGameStore((state) => state.ballCount);
  const vibeCrystals = useGameStore((state) => state.vibeCrystals);
  const maxWaveReached = useGameStore((state) => state.maxWaveReached);
  const upgradeBallDamage = useGameStore((state) => state.upgradeBallDamage);
  const upgradeBallSpeed = useGameStore((state) => state.upgradeBallSpeed);
  const upgradeBallCount = useGameStore((state) => state.upgradeBallCount);
  const upgradeCritChance = useGameStore((state) => state.upgradeCritChance);
  const damageCost = useGameStore((state) => state.getBallDamageCost());
  const speedCost = useGameStore((state) => state.getBallSpeedCost());
  const ballCost = useGameStore((state) => state.getBallCountCost());
  const critCost = useGameStore((state) => state.getCritChanceCost());
  const critChance = useGameStore((state) => state.critChance);

  const [showPrestige, setShowPrestige] = React.useState(false);
  const canPrestige = maxWaveReached >= 5;

  return (
    <div className="panel upgrades-panel" role="region" aria-labelledby="upgrades-heading">
      <h2 id="upgrades-heading">Upgrades</h2>

      <button
        className="upgrade-button"
        onClick={upgradeBallDamage}
        disabled={score < damageCost}
        aria-label={`Upgrade Ball Damage — costs ${damageCost.toLocaleString()} points`}
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
        aria-label={`Upgrade Ball Speed — costs ${speedCost.toLocaleString()} points`}
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
        aria-label={`Add Ball — costs ${ballCost.toLocaleString()} points`}
      >
        <div className="upgrade-info">
          <span className="upgrade-name">🔮 New Ball</span>
          <span className="upgrade-cost">{ballCost.toLocaleString()} pts</span>
        </div>
      </button>

      <button
        className="upgrade-button"
        onClick={upgradeCritChance}
        disabled={score < critCost || (critChance || 0) >= 0.5}
        aria-label={`Upgrade Crit Chance — costs ${critCost.toLocaleString()} points`}
      >
        <div className="upgrade-info">
          <span className="upgrade-name">⚡ Crit Chance +1%</span>
          <span className="upgrade-cost">
            {(critChance || 0) >= 0.5 ? 'MAX' : `${critCost.toLocaleString()} pts`}
          </span>
        </div>
      </button>

      <div className="prestige-section">
        <button
          className={`prestige-trigger ${canPrestige ? 'available' : ''}`}
          onClick={() => setShowPrestige(true)}
        >
          <span className="prestige-icon">🌟</span>
          <span className="prestige-label">Prestige</span>
          {vibeCrystals > 0 && <span className="prestige-crystals">{vibeCrystals} 💎</span>}
        </button>
      </div>

      {showPrestige && <PrestigeModal onClose={() => setShowPrestige(false)} />}
    </div>
  );
}
