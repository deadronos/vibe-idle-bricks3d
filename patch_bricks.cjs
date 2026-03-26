const fs = require('fs');
let code = fs.readFileSync('src/store/createInitials.ts', 'utf8');

const oldSetup = `export const createInitialBricks = (wave: number): Brick[] => {
  const bricks: Brick[] = [];
  const rows = 4;
  const cols = 6;
  const layers = 3;
  const spacing = 1.8;`;

const newSetup = `export const createInitialBricks = (wave: number): Brick[] => {
  const rows = 4;
  const cols = 6;
  const layers = 3;
  const spacing = 1.8;
  const totalBricks = rows * cols * layers;
  const bricks: Brick[] = new Array(totalBricks);
  let idx = 0;`;

code = code.replace(oldSetup, newSetup);

const oldIf = `if (bricks.length === 0) {
          type = 'normal';`;

const newIf = `if (idx === 0) {
          type = 'normal';`;

code = code.replace(oldIf, newIf);

const oldPush = `bricks.push({
          id: generateBrickId(),
          position: [
            (col - cols / 2 + 0.5) * spacing,
            (row - rows / 2 + 0.5) * spacing + 2,
            (layer - layers / 2 + 0.5) * spacing - 1,
          ],
          health,
          maxHealth: health,
          color,
          value,
          type,
          armorMultiplier,
        });`;

const newPush = `bricks[idx++] = {
          id: generateBrickId(),
          position: [
            (col - cols / 2 + 0.5) * spacing,
            (row - rows / 2 + 0.5) * spacing + 2,
            (layer - layers / 2 + 0.5) * spacing - 1,
          ],
          health,
          maxHealth: health,
          color,
          value,
          type,
          armorMultiplier,
        };`;

code = code.replace(oldPush, newPush);

fs.writeFileSync('src/store/createInitials.ts', code);
