# Idle Bricks 3D

A 3D "idle breakout" style game built with React, TypeScript, and React Three Fiber.

![Game Screenshot](https://github.com/user-attachments/assets/222a29b0-f1c8-4134-9c5b-62c82498325c)

## Features

- 🎮 **3D Breakout Gameplay**: Watch balls automatically bounce and break bricks in a 3D arena
- 🏗️ **Multiple Brick Layers**: Bricks are arranged in multiple rows and layers with varying health
- ⚡ **Idle Mechanics**: The game plays itself - no input required!
- 📈 **Upgrade System**: Spend points to upgrade ball damage, speed, or add more balls
- 🎨 **Beautiful Visuals**: Colorful bricks, glowing edges, starfield background
- 🖱️ **Interactive Camera**: Rotate and zoom to view the action from any angle
- ⏸️ **Pause/Resume**: Control the game flow

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Three Fiber** - React renderer for Three.js
- **Drei** - Useful helpers for R3F
- **Three.js** - 3D graphics library
- **Zustand** - State management
- **Vitest** - Testing framework

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## How to Play

1. **Watch**: Balls automatically bounce around and break bricks
2. **Earn Points**: Each brick destroyed awards points based on its layer
3. **Upgrade**: Spend points on upgrades:
   - ⚔️ **Ball Damage**: Increase damage per hit
   - 💨 **Ball Speed**: Make balls move faster
   - 🔮 **New Ball**: Add more balls (up to 20)
4. **Progress**: When all bricks are destroyed, a new wave spawns

## Controls

- **Mouse Drag**: Rotate camera
- **Scroll**: Zoom in/out
- **Pause Button**: Pause/resume the game

## Project Structure

```
src/
├── components/
│   ├── Arena.tsx      # 3D arena boundaries
│   ├── Ball.tsx       # Ball physics and rendering
│   ├── Brick.tsx      # Brick rendering with damage states
│   ├── GameScene.tsx  # Main 3D scene with lighting
│   ├── UI.tsx         # HUD and upgrade panel
│   └── UI.css         # UI styles
├── store/
│   └── gameStore.ts   # Zustand game state
├── test/
│   ├── setup.ts       # Test setup
│   └── gameStore.test.ts  # Store unit tests
├── App.tsx            # Main app component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## License

MIT License - see [LICENSE](LICENSE) for details.
