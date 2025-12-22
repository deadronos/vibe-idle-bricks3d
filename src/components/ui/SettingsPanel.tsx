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
  const [checkingCoop, setCheckingCoop] = React.useState<boolean>(false);
  const [coopInfo, setCoopInfo] = React.useState<{
    coop?: string | null;
    coep?: string | null;
    lastChecked?: string;
    error?: string | null;
  } | null>(null);

  const checkCoopEndpoint = React.useCallback(async () => {
    setCheckingCoop(true);
    try {
      const res = await fetch('/coop-check', { method: 'GET', cache: 'no-store' });
      const coop = res.headers.get('Cross-Origin-Opener-Policy');
      const coep = res.headers.get('Cross-Origin-Embedder-Policy');
      setCoopInfo({ coop, coep, lastChecked: new Date().toISOString() });

      // re-evaluate runtime support: crossOriginIsolated and runtime helper
      const isIsolated = !!(globalThis as any).crossOriginIsolated;
      let mtSupports = false;
      try {
        const mtModule = await import('../../engine/multithread/runtime');
        const mt = (mtModule && (mtModule as any).default) || mtModule;
        mtSupports =
          typeof mt?.supportsSharedArrayBuffer === 'function'
            ? mt.supportsSharedArrayBuffer()
            : Boolean(mt?.supportsSharedArrayBuffer);
      } catch {
        // ignore - runtime may not be present in test environments
      }

      // Also attempt to determine initialized state of SAB runtime when available
      try {
        const sabModule = await import('../../engine/multithread/sabRuntime');
        const sabRuntime = (sabModule && (sabModule as any).default) || sabModule;
        setSabInitialized(Boolean(sabRuntime && (sabRuntime as any).isInitialized?.()));
      } catch {
        // ignore
      }

      setSabAvailable((typeof SharedArrayBuffer !== 'undefined' && isIsolated) || mtSupports);
    } catch (err: any) {
      setCoopInfo({ error: String(err), lastChecked: new Date().toISOString() });
    } finally {
      setCheckingCoop(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function detectSAB() {
      try {
        let dynamicAvailable = typeof SharedArrayBuffer !== 'undefined' && !!(globalThis as any).crossOriginIsolated;

        // import at runtime to avoid bundling worker setup into initial app bundle
        try {
          const mtModule = await import('../../engine/multithread/runtime');
          const mt = (mtModule && (mtModule as any).default) || mtModule;
          const mtSupports =
            typeof mt?.supportsSharedArrayBuffer === 'function'
              ? mt.supportsSharedArrayBuffer()
              : Boolean(mt?.supportsSharedArrayBuffer);
          dynamicAvailable = dynamicAvailable || mtSupports;
        } catch {
          // ignore - runtime not present in this environment
        }

        if (mounted) setSabAvailable(dynamicAvailable);

        try {
          // dynamically import sabRuntime to check initialized state
          const sabModule = await import('../../engine/multithread/sabRuntime');
          const sabRuntime = (sabModule && (sabModule as any).default) || sabModule;
          if (mounted) setSabInitialized(Boolean(sabRuntime && (sabRuntime as any).isInitialized?.()));
        } catch {
          if (mounted) setSabInitialized(false);
        }
      } catch {
        if (mounted) {
          setSabAvailable(false);
          setSabInitialized(false);
        }
      }
    }

    void detectSAB();

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
      mounted = false;
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
              <button type="button" onClick={checkCoopEndpoint} disabled={checkingCoop}>
                {checkingCoop ? 'Checking...' : 'Refresh support'}
              </button>

              {sabAvailable && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await checkCoopEndpoint();
                        const mtModule = await import('../../engine/multithread/runtime');
                        const mt = (mtModule && (mtModule as any).default) || mtModule;
                        if (!mt || typeof mt.ensureSABRuntime !== 'function') {
                          throw new Error('SAB runtime not available in this build');
                        }
                        mt.ensureSABRuntime(128);
                        const sabModule = await import('../../engine/multithread/sabRuntime');
                        const sabRuntime = (sabModule && (sabModule as any).default) || sabModule;
                        setSabInitialized(Boolean(sabRuntime && (sabRuntime as any).isInitialized?.()));
                        setCoopInfo((prev) => ({ ...(prev ?? {}), error: null }));
                      } catch (err: any) {
                        // eslint-disable-next-line no-console
                        console.warn('Initialize SAB failed', err);
                        setCoopInfo((prev) => ({ ...(prev ?? {}), error: String(err) }));
                      }
                    }}
                  >
                    Initialize SAB
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const mtModule = await import('../../engine/multithread/runtime');
                        const mt = (mtModule && (mtModule as any).default) || mtModule;
                        if (mt && typeof mt.destroySABRuntime === 'function') mt.destroySABRuntime();
                        const sabModule = await import('../../engine/multithread/sabRuntime');
                        const sabRuntime = (sabModule && (sabModule as any).default) || sabModule;
                        setSabInitialized(Boolean(sabRuntime && (sabRuntime as any).isInitialized?.()));
                        setCoopInfo((prev) => ({ ...(prev ?? {}), error: null }));
                      } catch (err: any) {
                        // eslint-disable-next-line no-console
                        console.warn('Shutdown SAB failed', err);
                        setCoopInfo((prev) => ({ ...(prev ?? {}), error: String(err) }));
                      }
                    }}
                  >
                    Shutdown SAB
                  </button>
                </>
              )}

              {coopInfo && (
                <div className="coop-info">
                  <div>COOP: {coopInfo.coop ?? '—'}</div>
                  <div>COEP: {coopInfo.coep ?? '—'}</div>
                  <div>Last checked: {coopInfo.lastChecked ?? '—'}</div>
                  {coopInfo.error && <div className="error">Error: {coopInfo.error}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
