import { GameScene } from './components/GameScene';
import { UI } from './components/ui/UI';
import { PerfOverlay } from './components/PerfOverlay';

/**
 * Root component of the application.
 * Composes the main game scene, user interface, and performance overlay.
 *
 * @returns {JSX.Element} The rendered application.
 */
function App() {
  return (
    <div className="app">
      <GameScene />
      <UI />
      <PerfOverlay />
    </div>
  );
}

export default App;
