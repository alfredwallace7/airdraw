// Mock Canvas Context
class MockContext {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 0;
    this.globalCompositeOperation = 'source-over';
  }
  beginPath() {}
  arc() {}
  moveTo() {}
  lineTo() {}
  fill() {}
  stroke() {}
  setLineDash() {}
  drawImage() {}
}

const ITERATIONS = 1_000_000;
const ctx = new MockContext();
const cursorPos = { x: 100, y: 100 };
const colors = { drawing: '#ff0000', hover: '#00ff00' };

// Scenario A: Current Vector Drawing (Normal Cursor)
const runVector = () => {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    // Simulate Normal Cursor Drawing
    ctx.beginPath();
    ctx.arc(cursorPos.x, cursorPos.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = colors.drawing;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Target crosshair
    ctx.beginPath();
    ctx.moveTo(cursorPos.x - 4, cursorPos.y);
    ctx.lineTo(cursorPos.x + 4, cursorPos.y);
    ctx.moveTo(cursorPos.x, cursorPos.y - 4);
    ctx.lineTo(cursorPos.x, cursorPos.y + 4);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  return performance.now() - start;
};

// Scenario B: Sprite Drawing (Normal Cursor)
const runSprite = () => {
  // Mock sprite object
  const sprite = {};
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    ctx.drawImage(sprite, cursorPos.x - 12, cursorPos.y - 12);
  }
  return performance.now() - start;
};

// Scenario C: Current Vector Drawing (Eraser)
const runEraserVector = () => {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
      // Eraser preview: Clear the center
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Draw outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner dashed line
      ctx.beginPath();
      ctx.arc(cursorPos.x, cursorPos.y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff0000'; // Red for eraser
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
  }
  return performance.now() - start;
};

// Scenario D: Optimized Eraser (Hybrid)
const runEraserHybrid = () => {
  const sprite = {};
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
      // Punch hole
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cursorPos.x, cursorPos.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Draw rings sprite
      ctx.drawImage(sprite, cursorPos.x - 16, cursorPos.y - 16);
  }
  return performance.now() - start;
};

console.log(`Running ${ITERATIONS} iterations...`);

const timeVector = runVector();
const timeSprite = runSprite();
console.log(`Normal Cursor (Vector): ${timeVector.toFixed(2)}ms`);
console.log(`Normal Cursor (Sprite): ${timeSprite.toFixed(2)}ms`);
console.log(`Speedup: ${(timeVector / timeSprite).toFixed(2)}x`);

const timeEraserVector = runEraserVector();
const timeEraserHybrid = runEraserHybrid();
console.log(`Eraser Cursor (Vector): ${timeEraserVector.toFixed(2)}ms`);
console.log(`Eraser Cursor (Hybrid): ${timeEraserHybrid.toFixed(2)}ms`);
console.log(`Speedup: ${(timeEraserVector / timeEraserHybrid).toFixed(2)}x`);
