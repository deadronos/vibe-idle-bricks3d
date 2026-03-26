const fs = require('fs');
let code = fs.readFileSync('src/engine/physics/utils.ts', 'utf8');

const calculateDamageOld = `export function calculateDamage(baseDamage: number, critChance: number): number {
  if (!critChance || critChance <= 0) return baseDamage;

  const guaranteedMult = Math.floor(critChance);
  const fractionalChance = critChance % 1;
  const bonusMult = Math.random() < fractionalChance ? 1 : 0;

  return baseDamage * (1 + guaranteedMult + bonusMult);
}`;

const calculateDamageNew = `export function calculateDamage(baseDamage: number, critChance: number): number {
  if (!critChance || critChance <= 0) return baseDamage;

  const guaranteedMult = Math.floor(critChance);
  const fractionalChance = critChance % 1;
  if (fractionalChance === 0) return baseDamage * (1 + guaranteedMult);

  const bonusMult = Math.random() < fractionalChance ? 1 : 0;

  return baseDamage * (1 + guaranteedMult + bonusMult);
}`;

code = code.replace(calculateDamageOld, calculateDamageNew);

const computeNormalOld = `export function computeContactNormal(velocity: Vec3): Vec3 {
  const speed = Math.sqrt(
    velocity[0] * velocity[0] + velocity[1] * velocity[1] + velocity[2] * velocity[2]
  );
  return speed > 1e-6
    ? [velocity[0] / speed, velocity[1] / speed, velocity[2] / speed]
    : [0, 0, 1];
}`;

const computeNormalNew = `export function computeContactNormal(velocity: Vec3): Vec3 {
  const speedSq =
    velocity[0] * velocity[0] + velocity[1] * velocity[1] + velocity[2] * velocity[2];
  if (speedSq > 1e-12) {
    const invSpeed = 1 / Math.sqrt(speedSq);
    return [velocity[0] * invSpeed, velocity[1] * invSpeed, velocity[2] * invSpeed];
  }
  return [0, 0, 1];
}`;

code = code.replace(computeNormalOld, computeNormalNew);

fs.writeFileSync('src/engine/physics/utils.ts', code);
