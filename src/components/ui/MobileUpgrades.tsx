import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { PrestigeModal } from './PrestigeModal';
import './UI.css';

export function MobileUpgrades() {
  const [open, setOpen] = React.useState(false);
  const [showPrestige, setShowPrestige] = React.useState(false);
  const score = useGameStore((s) => s.score);
  const ballCount = useGameStore((s) => s.ballCount);
  const vibeCrystals = useGameStore((s) => s.vibeCrystals);
  const upgradeBallDamage = useGameStore((s) => s.upgradeBallDamage);
  const upgradeBallSpeed = useGameStore((s) => s.upgradeBallSpeed);
  const upgradeBallCount = useGameStore((s) => s.upgradeBallCount);
  const getBallDamageCost = useGameStore((s) => s.getBallDamageCost);
  const getBallSpeedCost = useGameStore((s) => s.getBallSpeedCost);
  const getBallCountCost = useGameStore((s) => s.getBallCountCost);

  const damageCost = getBallDamageCost();
  const speedCost = getBallSpeedCost();
  const ballCost = getBallCountCost();

  return (
    <>
      <div className="quick-upgrades-row" role="toolbar" aria-label="Quick upgrades">
        <button
          className="upgrade-button quick-upgrade"
          onClick={() => upgradeBallDamage()}
          disabled={score < damageCost}
          aria-label={`Upgrade Ball Damage — costs ${damageCost.toLocaleString()} points`}
        >
          ⚔️
        </button>
        <button
          className="upgrade-button quick-upgrade"
          onClick={() => upgradeBallSpeed()}
          disabled={score < speedCost}
          aria-label={`Upgrade Ball Speed — costs ${speedCost.toLocaleString()} points`}
        >
          💨
        </button>
        <button
          className="upgrade-button quick-upgrade"
          onClick={() => upgradeBallCount()}
          disabled={score < ballCost || ballCount >= 20}
          aria-label={`Add Ball — costs ${ballCost.toLocaleString()} points`}
        >
          🔮
        </button>
        <button
          className="upgrade-button quick-upgrade open-drawer"
          onClick={() => setOpen(true)}
          aria-label="Open upgrades drawer"
        >
          ⚙️
        </button>
      </div>

      {open && (
        <div className="mobile-upgrades-drawer-overlay" role="dialog" aria-modal="true" aria-label="Upgrades drawer" onClick={() => setOpen(false)}>
          <div className="mobile-upgrades-drawer" role="region" aria-labelledby="mobile-upgrades-heading" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-upgrades-header">
              <h3 id="mobile-upgrades-heading">Upgrades</h3>
              <button className="close-button" onClick={() => setOpen(false)} aria-label="Close upgrades">✕</button>
            </div>

            <div className="mobile-upgrades-content">
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

              <button className="upgrade-button" onClick={upgradeBallCount} disabled={score < ballCost || ballCount >= 20}>
                <div className="upgrade-info">
                  <span className="upgrade-name">🔮 New Ball</span>
                  <span className="upgrade-cost">{ballCost.toLocaleString()} pts</span>
                </div>
              </button>

              <div className="spacer" />
              <div className="prestige-section">
                <button className={`prestige-trigger ${vibeCrystals > 0 ? 'available' : ''}`} onClick={() => setShowPrestige(true)}>
                  <span className="prestige-icon">🌟</span>
                  <span className="prestige-label">Prestige</span>
                  {vibeCrystals > 0 && <span className="prestige-crystals">{vibeCrystals} 💎</span>}
                </button>
              </div>
            </div>
            {showPrestige && <PrestigeModal onClose={() => setShowPrestige(false)} />}
          </div>
        </div>
      )}
    </>
  );
}
