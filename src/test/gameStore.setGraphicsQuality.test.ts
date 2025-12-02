import { useGameStore, buildInitialState } from '../..//src/store/gameStore';

describe('setGraphicsQuality action', () => {
  beforeEach(() => {
    useGameStore.persist?.clearStorage?.();
    // reset state
    const initial = buildInitialState();
    // Merge the initial state to keep store actions intact
    useGameStore.setState(initial);
  });

  test('setGraphicsQuality low updates settings flags', async () => {
    const before = useGameStore.getState().settings.graphicsQuality;
    expect(before).toBe('auto');
    useGameStore.getState().setGraphicsQuality?.('low');
    await new Promise((res) => setTimeout(res, 0));
    const after = useGameStore.getState().settings;
    expect(after.graphicsQuality).toBe('low');
    expect(after.enableBloom).toBe(false);
    expect(after.enableShadows).toBe(false);
    expect(after.enableParticles).toBe(false);
  });

  test('setGraphicsQuality high updates settings flags', async () => {
    useGameStore.getState().setGraphicsQuality?.('high');
    await new Promise((res) => setTimeout(res, 0));
    const after = useGameStore.getState().settings;
    expect(after.graphicsQuality).toBe('high');
    expect(after.enableBloom).toBe(true);
    expect(after.enableShadows).toBe(true);
    expect(after.enableParticles).toBe(true);
  });
});
