import React from 'react';
import { useGameStore } from '../../store/gameStore';
import type { GameSettings } from '../../store/types';
import './UI.css';

/**
 * Modal panel for game settings configuration.
 * Allows toggling graphics options, sound, and physics engine.
 *
 * @param {Object} props - Component props.
 * @param {Function} props.onClose - Callback to close the settings panel.
 * @returns {JSX.Element} The settings panel component.
 */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const settings = useGameStore((state) => state.settings);
  const toggleSetting = useGameStore((state) => state.toggleSetting);
  const setGraphicsQuality = useGameStore((state) => state.setGraphicsQuality);
  const modalRef = React.useRef<HTMLDivElement | null>(null);

  const settingLabels: Record<keyof GameSettings, string> = {
    enableBloom: 'Bloom',
    enableShadows: 'Shadows',
    enableSound: 'Sound',
    enableParticles: 'Particles',
    enableFullRigidPhysics: 'Full Rigid Physics (Rapier)',
    compactHudEnabled: 'Compact HUD',
    graphicsQuality: 'Graphics Quality',
    enableSABPhysics: 'SharedArrayBuffer Physics (Experimental)',
  };

  // SAB runtime info and runtime actions (defensive: require at runtime)
  const [sabAvailable, setSabAvailable] = React.useState<boolean>(false);
  const [sabInitialized, setSabInitialized] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      // import at runtime to avoid bundling worker setup into initial app bundle
       
      const mt = require('../../engine/multithread/runtime').default;
      setSabAvailable(Boolean(mt.supportsSharedArrayBuffer));
      try {
        // require the sabRuntime to check initialized state
         
        const sabRuntime = require('../../engine/multithread/sabRuntime').default;
        setSabInitialized(Boolean(sabRuntime && (sabRuntime as any).isInitialized?.()));
      } catch {
        setSabInitialized(false);
      }
    } catch {
      setSabAvailable(false);
      setSabInitialized(false);
    }

    const root = modalRef.current;
    if (!root) return;
    const prevActive = document.activeElement as HTMLElement | null;
    // Focus first focusable element
    const focusables = root.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    if (first) first.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (focusables.length === 0) return;
      // const focusedIndex = Array.prototype.indexOf.call(focusables, document.activeElement);
      if (e.shiftKey) {
        // If shift-tab on first, move to last
        if (document.activeElement === focusables[0]) {
          e.preventDefault();
          focusables[focusables.length - 1].focus();
        }
      } else {
        // Tab: if on last, go to first
        if (document.activeElement === focusables[focusables.length - 1]) {
          e.preventDefault();
          focusables[0].focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keydown', onEsc);
      if (prevActive) prevActive.focus();
    };
  }, [onClose]);

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div
        className="settings-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <h2 id="settings-heading">Settings</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="settings-grid">
          {(() => {
            const settingsRecord = settings as unknown as Record<string, unknown>;
            return (Object.keys(settings) as Array<keyof GameSettings>)
              .filter((k) => typeof settingsRecord[k] === 'boolean')
              .map((key) => (
                <div key={key} className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={!!settings[key]}
                      onChange={() => toggleSetting(key)}
                    />
                    {settingLabels[key]}
                  </label>
                </div>
              ));
          })()}

          <div className="setting-item">
            <label htmlFor="graphics-quality">Graphics Quality</label>
            <select
              id="graphics-quality"
              value={settings.graphicsQuality || 'auto'}
              onChange={(e) =>
                setGraphicsQuality?.(e.target.value as 'auto' | 'low' | 'medium' | 'high')
              }
            >
              <option value="auto">Auto</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="setting-item sab-status">
            <div>
              <strong>SharedArrayBuffer Runtime</strong>
            </div>
            <div id="sab-supported">Supported: {sabAvailable ? 'Yes' : 'No (cross-origin isolation required)'}</div>
            <div id="sab-initialized">Initialized: {sabInitialized ? 'Yes' : 'No'}</div>
            <div className="sab-controls">
              {sabAvailable && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                         
                        const mt = require('../../engine/multithread/runtime').default;
                        mt.ensureSABRuntime(128);
                         
                        const sabRuntime = require('../../engine/multithread/sabRuntime').default;
                        setSabInitialized(Boolean(sabRuntime && (sabRuntime as any).isInitialized?.()));
                      } catch (err) {
                        // ignore
                      }
                    }}
                  >
                    Initialize SAB
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                         
                        const mt = require('../../engine/multithread/runtime').default;
                        mt.destroySABRuntime();
                         
                        const sabRuntime = require('../../engine/multithread/sabRuntime').default;
                        setSabInitialized(Boolean(sabRuntime && (sabRuntime as any).isInitialized?.()));
                      } catch (err) {
                        // ignore
                      }
                    }}
                  >
                    Shutdown SAB
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
