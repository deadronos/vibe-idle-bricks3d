import { GameScene } from './components/GameScene';
import { UI } from './components/UI';
import { PerfOverlay } from './components/PerfOverlay';

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
