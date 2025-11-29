import { create } from 'zustand'
import type { Vector3Tuple } from 'three'

export interface Brick {
  id: string
  position: Vector3Tuple
  health: number
  maxHealth: number
  color: string
  value: number
}

export interface Ball {
  id: string
  position: Vector3Tuple
  velocity: Vector3Tuple
  radius: number
  damage: number
  color: string
}

export interface Upgrade {
  id: string
  name: string
  description: string
  baseCost: number
  costMultiplier: number
  level: number
  maxLevel: number
  effect: () => void
}

interface GameState {
  // Game stats
  score: number
  bricksDestroyed: number
  
  // Game entities
  bricks: Brick[]
  balls: Ball[]
  
  // Upgrades
  ballDamage: number
  ballSpeed: number
  ballCount: number
  
  // Game controls
  isPaused: boolean
  
  // Actions
  addScore: (amount: number) => void
  spawnBall: () => void
  removeBall: (id: string) => void
  updateBallPosition: (id: string, position: Vector3Tuple) => void
  updateBallVelocity: (id: string, velocity: Vector3Tuple) => void
  damageBrick: (id: string, damage: number) => void
  removeBrick: (id: string) => void
  regenerateBricks: () => void
  togglePause: () => void
  
  // Upgrades
  upgradeBallDamage: () => void
  upgradeBallSpeed: () => void
  upgradeBallCount: () => void
  
  // Costs
  getBallDamageCost: () => number
  getBallSpeedCost: () => number
  getBallCountCost: () => number
}

const BRICK_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
const ARENA_SIZE = { width: 12, height: 10, depth: 8 }

const generateBrickId = () => `brick-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
const generateBallId = () => `ball-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

const createInitialBricks = (): Brick[] => {
  const bricks: Brick[] = []
  const rows = 4
  const cols = 6
  const layers = 3
  const spacing = 1.8
  
  for (let layer = 0; layer < layers; layer++) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const health = (layer + 1) * 3
        bricks.push({
          id: generateBrickId(),
          position: [
            (col - cols / 2 + 0.5) * spacing,
            (row - rows / 2 + 0.5) * spacing + 2,
            (layer - layers / 2 + 0.5) * spacing - 1
          ],
          health,
          maxHealth: health,
          color: BRICK_COLORS[(row + col + layer) % BRICK_COLORS.length],
          value: (layer + 1) * 10
        })
      }
    }
  }
  
  return bricks
}

const createInitialBall = (speed: number, damage: number): Ball => {
  const angle = Math.random() * Math.PI * 2
  const elevation = (Math.random() - 0.5) * Math.PI * 0.5
  
  return {
    id: generateBallId(),
    position: [0, -3, 0],
    velocity: [
      Math.cos(angle) * Math.cos(elevation) * speed,
      Math.abs(Math.sin(elevation)) * speed + 0.5,
      Math.sin(angle) * Math.cos(elevation) * speed
    ],
    radius: 0.3,
    damage,
    color: '#FFFFFF'
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial stats
  score: 0,
  bricksDestroyed: 0,
  
  // Initial entities
  bricks: createInitialBricks(),
  balls: [createInitialBall(0.1, 1)],
  
  // Initial upgrades
  ballDamage: 1,
  ballSpeed: 0.1,
  ballCount: 1,
  
  // Game state
  isPaused: false,
  
  // Actions
  addScore: (amount) => set((state) => ({
    score: state.score + amount
  })),
  
  spawnBall: () => set((state) => ({
    balls: [...state.balls, createInitialBall(state.ballSpeed, state.ballDamage)]
  })),
  
  removeBall: (id) => set((state) => ({
    balls: state.balls.filter((ball) => ball.id !== id)
  })),
  
  updateBallPosition: (id, position) => set((state) => ({
    balls: state.balls.map((ball) =>
      ball.id === id ? { ...ball, position } : ball
    )
  })),
  
  updateBallVelocity: (id, velocity) => set((state) => ({
    balls: state.balls.map((ball) =>
      ball.id === id ? { ...ball, velocity } : ball
    )
  })),
  
  damageBrick: (id, damage) => set((state) => {
    const brick = state.bricks.find((b) => b.id === id)
    if (!brick) return state
    
    const newHealth = brick.health - damage
    
    if (newHealth <= 0) {
      return {
        bricks: state.bricks.filter((b) => b.id !== id),
        score: state.score + brick.value,
        bricksDestroyed: state.bricksDestroyed + 1
      }
    }
    
    return {
      bricks: state.bricks.map((b) =>
        b.id === id ? { ...b, health: newHealth } : b
      )
    }
  }),
  
  removeBrick: (id) => set((state) => ({
    bricks: state.bricks.filter((brick) => brick.id !== id)
  })),
  
  regenerateBricks: () => set({
    bricks: createInitialBricks()
  }),
  
  togglePause: () => set((state) => ({
    isPaused: !state.isPaused
  })),
  
  // Upgrade costs
  getBallDamageCost: () => {
    const { ballDamage } = get()
    return Math.floor(50 * Math.pow(1.5, ballDamage - 1))
  },
  
  getBallSpeedCost: () => {
    const { ballSpeed } = get()
    const level = Math.round((ballSpeed - 0.1) / 0.02)
    return Math.floor(30 * Math.pow(1.3, level))
  },
  
  getBallCountCost: () => {
    const { ballCount } = get()
    return Math.floor(100 * Math.pow(2, ballCount - 1))
  },
  
  // Upgrade actions
  upgradeBallDamage: () => set((state) => {
    const cost = get().getBallDamageCost()
    if (state.score >= cost) {
      return {
        score: state.score - cost,
        ballDamage: state.ballDamage + 1,
        balls: state.balls.map((ball) => ({
          ...ball,
          damage: state.ballDamage + 1
        }))
      }
    }
    return state
  }),
  
  upgradeBallSpeed: () => set((state) => {
    const cost = get().getBallSpeedCost()
    if (state.score >= cost) {
      const newSpeed = state.ballSpeed + 0.02
      return {
        score: state.score - cost,
        ballSpeed: newSpeed,
        balls: state.balls.map((ball) => {
          const currentSpeed = Math.sqrt(
            ball.velocity[0] ** 2 + ball.velocity[1] ** 2 + ball.velocity[2] ** 2
          )
          const scale = currentSpeed > 0 ? newSpeed / currentSpeed : 1
          return {
            ...ball,
            velocity: [
              ball.velocity[0] * scale,
              ball.velocity[1] * scale,
              ball.velocity[2] * scale
            ] as Vector3Tuple
          }
        })
      }
    }
    return state
  }),
  
  upgradeBallCount: () => set((state) => {
    const cost = get().getBallCountCost()
    if (state.score >= cost && state.ballCount < 20) {
      const newBall = createInitialBall(state.ballSpeed, state.ballDamage)
      return {
        score: state.score - cost,
        ballCount: state.ballCount + 1,
        balls: [...state.balls, newBall]
      }
    }
    return state
  })
}))

// Export for testing
export { ARENA_SIZE, createInitialBricks, createInitialBall }
