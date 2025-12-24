import React from 'react';
import { ACHIEVEMENTS, useGameStore } from '../../store/gameStore';
import { useDrawerDrag } from '../../hooks/useDrawerDrag';
import './UI.css';

/**
 * Panel displaying unlocked achievements.
 * Adapts to screen size:
 * - Desktop: Fixed panel at bottom-right.
 * - Mobile: Collapsed summary bar at bottom that expands into a drawer.
 */
export function AchievementsPanel() {
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const compactHudEnabled = useGameStore((state) => state.settings.compactHudEnabled);

  if (isMobile) {
    return <MobileAchievements />;
  }

  // On desktop, respect the compact HUD setting by hiding the panel
  if (compactHudEnabled) {
    return null;
  }

  return <DesktopAchievements />;
}

function DesktopAchievements() {
  const unlockedAchievements = useGameStore((state) => state.unlockedAchievements);
  const unlockedList = ACHIEVEMENTS.filter((achievement) =>
    unlockedAchievements.includes(achievement.id)
  );

  return (
    <div className="panel achievements-panel" role="region" aria-labelledby="achievements-heading">
      <h2 id="achievements-heading">Achievements</h2>
      <div className="stat">
        <span>Unlocked:</span>
        <span>
          {unlockedList.length} / {ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="achievements-list">
        {unlockedList.slice(0, 4).map((achievement) => (
          <div key={achievement.id} className="achievement-row">
            <span className="achievement-label">{achievement.label}</span>
            <span className="achievement-description">{achievement.description}</span>
          </div>
        ))}
        {unlockedList.length === 0 && <div className="achievement-empty">No unlocks yet.</div>}
      </div>
    </div>
  );
}

function MobileAchievements() {
  const [open, setOpen] = React.useState(false);
  const [translateY, setTranslateY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const drawerRef = React.useRef<HTMLDivElement | null>(null);
  const headerRef = React.useRef<HTMLDivElement | null>(null);

  const unlockedAchievements = useGameStore((state) => state.unlockedAchievements);
  const unlockedList = ACHIEVEMENTS.filter((achievement) =>
    unlockedAchievements.includes(achievement.id)
  );

  // Use the shared drag hook
  useDrawerDrag({ open, setOpen, drawerRef, headerRef, translateY, setTranslateY, setIsDragging });

  return (
    <>
      {/* Minimized Summary Bar */}
      {!open && (
        <div
          className="mobile-achievements-summary panel"
          onClick={() => setOpen(true)}
          role="button"
          aria-label="Open Achievements"
        >
          <div className="summary-content">
            <span className="trophy-icon">🏆</span>
            <span className="summary-text">Achievements</span>
            <span className="summary-count">{unlockedList.length}/{ACHIEVEMENTS.length}</span>
          </div>
        </div>
      )}

      {/* Expanded Drawer */}
      {open && (
        <div
          className="mobile-achievements-overlay"
          onClick={() => setOpen(false)}
        >
          <div
            className={`mobile-achievements-drawer ${isDragging ? 'dragging' : ''}`}
            onClick={(e) => e.stopPropagation()}
            ref={drawerRef}
            // CSS variable for drag translation
            style={{
              '--drawer-translate': `${translateY}px`
            } as React.CSSProperties}
          >
            <div className="mobile-achievements-header" ref={headerRef}>
              <div className="drawer-handle" />
              <h3>Achievements</h3>
              <div className="header-count">{unlockedList.length} / {ACHIEVEMENTS.length}</div>
            </div>

            <div className="mobile-achievements-list">
              {unlockedList.map((achievement) => (
                <div key={achievement.id} className="mobile-achievement-item">
                  <div className="mobile-achievement-icon">🏆</div>
                  <div className="mobile-achievement-details">
                    <span className="mobile-achievement-label">{achievement.label}</span>
                    <span className="mobile-achievement-desc">{achievement.description}</span>
                  </div>
                </div>
              ))}
              {unlockedList.length === 0 && (
                <div className="mobile-achievement-empty">Play to unlock achievements!</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
