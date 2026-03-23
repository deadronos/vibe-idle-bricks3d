import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MAX_BALL_COUNT, MAX_CRIT_CHANCE } from '../../store/constants';
import { PrestigeModal } from './PrestigeModal';
import type { BuyMultiplier } from '../../store/types';

/**
 * Mobile-friendly upgrades drawer.
 * Supports touch interactions and a quick-upgrades toolbar.
 *
 * @returns {JSX.Element} The mobile upgrades component.
 */
export function MobileUpgrades() {
  const score = useGameStore((state) => state.score);
  const ballCount = useGameStore((state) => state.ballCount);
  const vibeCrystals = useGameStore((state) => state.vibeCrystals);
  const buyMultiplier = useGameStore((state) => state.buyMultiplier || 1);
  const setBuyMultiplier = useGameStore((state) => state.setBuyMultiplier);

  const upgradeBallDamage = useGameStore((state) => state.upgradeBallDamage);
  const upgradeBallSpeed = useGameStore((state) => state.upgradeBallSpeed);
  const upgradeBallCount = useGameStore((state) => state.upgradeBallCount);
  const upgradeCritChance = useGameStore((state) => state.upgradeCritChance);

  const damageCost = useGameStore((state) => state.getBallDamageCost());
  const speedCost = useGameStore((state) => state.getBallSpeedCost());
  const ballCost = useGameStore((state) => state.getBallCountCost());
  const critCost = useGameStore((state) => state.getCritChanceCost());
  const critChance = useGameStore((state) => state.critChance);

  const [open, setOpen] = useState(false);
  const [showPrestige, setShowPrestige] = useState(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', onKeyDown);
    const onResize = () => {
      if (window.innerWidth > 768) setOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const multipliers: BuyMultiplier[] = [1, 10, 100, 'max'];

  // Handle pointer interactions for dragging
  useDrawerDrag({
    open,
    setOpen,
    drawerRef,
    headerRef,
    translateY,
    setTranslateY,
    setIsDragging,
  });

  // Handle focus trapping and keyboard accessibility when open
  useEffect(() => {
    if (!open || !drawerRef.current) return;
    const root = drawerRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (first) first.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (focusables.length === 0) return;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            (last as HTMLElement)?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            (first as HTMLElement)?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

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
          disabled={score < ballCost || ballCount >= MAX_BALL_COUNT}
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
        <div
          className="mobile-upgrades-drawer-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Upgrades drawer"
          onClick={() => setOpen(false)}
        >
          <div
            className={`mobile-upgrades-drawer ${isDragging ? 'dragging' : ''}`}
            role="region"
            aria-labelledby="mobile-upgrades-heading"
            onClick={(e) => e.stopPropagation()}
            ref={drawerRef}
            data-testid="mobile-upgrades-drawer"
            // CSS variable is updated by useDrawerDrag to avoid inline styles
            data-translate-y={translateY}
          >
            <div
              className="mobile-upgrades-header"
              ref={headerRef}
              data-testid="mobile-upgrades-drawer-header"
            >
              <div
                className="mobile-upgrades-handle"
                role="button"
                tabIndex={0}
                aria-label="Drag to close upgrades drawer"
                data-testid="mobile-upgrades-handle"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    setOpen(false);
                    e.preventDefault();
                  }
                }}
                onClick={() => setOpen(false)}
              />
              <h3 id="mobile-upgrades-heading">Upgrades</h3>
              <button
                className="close-button"
                onClick={() => setOpen(false)}
                aria-label="Close upgrades"
              >
                ✕
              </button>
            </div>

            <div className="mobile-upgrades-content">
              <div className="multiplier-selector">
                {multipliers.map((m) => (
                  <button
                    key={m}
                    className={`multiplier-button ${buyMultiplier === m ? 'active' : ''}`}
                    onClick={() => setBuyMultiplier?.(m)}
                  >
                    {m === 'max' ? 'MAX' : `x${m}`}
                  </button>
                ))}
              </div>

              <button
                className="upgrade-button"
                onClick={upgradeBallDamage}
                disabled={score < damageCost}
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
              >
                <div className="upgrade-info">
                  <span className="upgrade-name">⚡ Crit Chance</span>
                  <span className="upgrade-cost">
                    {(critChance || 0) >= MAX_CRIT_CHANCE ? 'MAX' : `${critCost.toLocaleString()} pts`}
                  </span>
                </div>
              </button>

              <div className="spacer" />
              <div className="prestige-section">
                <button
                  className={`prestige-trigger ${vibeCrystals > 0 ? 'available' : ''}`}
                  onClick={() => setShowPrestige(true)}
                >
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

// Implement pointer drag behavior via a lightweight hook on mount
// to avoid re-creating handlers when not open.
/**
 * Hook to handle pointer interactions for dragging the drawer.
 */
function useDrawerDrag({
  open,
  setOpen,
  drawerRef,
  headerRef,
  translateY,
  setTranslateY,
  setIsDragging,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  drawerRef: React.RefObject<HTMLDivElement | null>;
  headerRef: React.RefObject<HTMLDivElement | null>;
  translateY: number;
  setTranslateY: (n: number) => void;
  setIsDragging: (b: boolean) => void;
}) {
  const startYRef = useRef<number | null>(null);
  const lastPointerId = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    const drawer = drawerRef.current;
    if (!header || !drawer) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      startYRef.current = e.clientY;
      lastPointerId.current = e.pointerId;
      setIsDragging(true);
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (startYRef.current === null) return;
      if (e.pointerId !== lastPointerId.current) return;
      const delta = Math.max(0, e.clientY - (startYRef.current ?? 0));
      const height = Math.max(0, drawer.getBoundingClientRect().height || 0);
      const capped = Math.min(delta, height);
      setTranslateY(capped);
      try {
        drawer.style.setProperty('--mobile-upgrades-translate', `${capped}px`);
      } catch {
        /* ignore */
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (startYRef.current === null) return;
      if (e.pointerId !== lastPointerId.current) return;
      const height = Math.max(0, drawer.getBoundingClientRect().height || 0);
      const threshold = height * 0.33;
      if (translateY > threshold) {
        setOpen(false);
      } else {
        setTranslateY(0);
      }
      setIsDragging(false);
      startYRef.current = null;
      lastPointerId.current = null;
      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    header.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    return () => {
      header.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [open, headerRef, drawerRef, setOpen, setTranslateY, setIsDragging, translateY]);
}
