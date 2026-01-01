import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { PrestigeModal } from './PrestigeModal';
import './UI.css';

/**
 * Mobile-specific upgrade drawer and quick actions.
 * Provides a slide-up drawer for upgrades and a sticky footer with quick upgrade buttons.
 * Includes gesture support for dragging the drawer closed.
 *
 * @returns {JSX.Element} The mobile upgrades component.
 */
export function MobileUpgrades() {
  const [open, setOpen] = React.useState(false);
  const [showPrestige, setShowPrestige] = React.useState(false);
  const [translateY, setTranslateY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const score = useGameStore((s) => s.score);
  const ballCount = useGameStore((s) => s.ballCount);
  const vibeCrystals = useGameStore((s) => s.vibeCrystals);
  const upgradeBallDamage = useGameStore((s) => s.upgradeBallDamage);
  const upgradeBallSpeed = useGameStore((s) => s.upgradeBallSpeed);
  const upgradeBallCount = useGameStore((s) => s.upgradeBallCount);
  const upgradeCritChance = useGameStore((s) => s.upgradeCritChance);
  const getBallDamageCost = useGameStore((s) => s.getBallDamageCost);
  const getBallSpeedCost = useGameStore((s) => s.getBallSpeedCost);
  const getBallCountCost = useGameStore((s) => s.getBallCountCost);
  const getCritChanceCost = useGameStore((s) => s.getCritChanceCost);
  const critChance = useGameStore((s) => s.critChance);

  const damageCost = getBallDamageCost();
  const speedCost = getBallSpeedCost();
  const ballCost = getBallCountCost();
  const critCost = getCritChanceCost();
  const drawerRef = React.useRef<HTMLDivElement | null>(null);
  const headerRef = React.useRef<HTMLDivElement | null>(null);

  // Attach drag handler hook
  useDrawerDrag({ open, setOpen, drawerRef, headerRef, translateY, setTranslateY, setIsDragging });

  // Close when resizing to desktop view
  React.useEffect(() => {
    if (!open) return;
    const onResize = () => {
      if (window.innerWidth > 768) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  // Keep CSS variable in sync with state for transitions & snaps
  React.useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    try {
      drawer.style.setProperty('--mobile-upgrades-translate', `${translateY}px`);
    } catch {
      // ignore in test env
    }
  }, [translateY]);

  // Close via Escape key for accessibility
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open]);

  // Focus trapping for drawer while open
  React.useEffect(() => {
    if (!open) return;
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

              <button
                className="upgrade-button"
                onClick={upgradeCritChance}
                disabled={score < critCost || (critChance || 0) >= 0.5}
              >
                <div className="upgrade-info">
                  <span className="upgrade-name">⚡ Crit Chance +1%</span>
                  <span className="upgrade-cost">
                    {(critChance || 0) >= 0.5 ? 'MAX' : `${critCost.toLocaleString()} pts`}
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
 *
 * @param {Object} props - Hook props.
 * @param {boolean} props.open - Whether the drawer is open.
 * @param {Function} props.setOpen - State setter for drawer visibility.
 * @param {React.RefObject<HTMLDivElement | null>} props.drawerRef - Ref to the drawer element.
 * @param {React.RefObject<HTMLDivElement | null>} props.headerRef - Ref to the drawer header (drag handle).
 * @param {number} props.translateY - Current vertical translation.
 * @param {Function} props.setTranslateY - Setter for vertical translation.
 * @param {Function} props.setIsDragging - Setter for dragging state.
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
  const startYRef = React.useRef<number | null>(null);
  const lastPointerId = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    const drawer = drawerRef.current;
    if (!header || !drawer) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      startYRef.current = e.clientY;
      lastPointerId.current = e.pointerId;
      setIsDragging(true);
      // Prevent default to avoid page scroll on touch devices when dragging
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (startYRef.current === null) return;
      // Only handle primary pointer
      if (e.pointerId !== lastPointerId.current) return;
      const delta = Math.max(0, e.clientY - (startYRef.current ?? 0));
      const height = Math.max(0, drawer.getBoundingClientRect().height || 0);
      const capped = Math.min(delta, height);
      setTranslateY(capped);
      try {
        drawer.style.setProperty('--mobile-upgrades-translate', `${capped}px`);
      } catch {
        // ignore if style property can't be set in this environment
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (startYRef.current === null) return;
      // Only handle primary pointer
      if (e.pointerId !== lastPointerId.current) return;
      // Calculate threshold — 33% of drawer height
      const height = Math.max(0, drawer.getBoundingClientRect().height || 0);
      const threshold = height * 0.33;
      const finalTranslate = translateY;
      if (finalTranslate > threshold) {
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
        // ignore
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
