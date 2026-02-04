const { performance } = require('perf_hooks');

// Mock context
const ctx = {
  beginPath: () => {},
  moveTo: () => {},
  quadraticCurveTo: () => {},
  closePath: () => {},
};

// Generate a large path
const points = [];
for (let i = 0; i < 10000; i++) {
  points.push([Math.random() * 1000, Math.random() * 1000]);
}

function drawStrokeCurrent(ctx, stroke) {
  ctx.beginPath();
  const len = stroke.length;
  if (len < 2) return;

  const [firstX, firstY] = stroke[0];
  ctx.moveTo(firstX, firstY);

  for (let i = 0; i < len - 1; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[i + 1];
    const midX = (x0 + x1) * 0.5;
    const midY = (y0 + y1) * 0.5;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
  }

  const [xLast, yLast] = stroke[len - 1];
  const [xFirst, yFirst] = stroke[0];
  const midX = (xLast + xFirst) * 0.5;
  const midY = (yLast + yFirst) * 0.5;
  ctx.quadraticCurveTo(xLast, yLast, midX, midY);

  ctx.closePath();
}

function drawStrokeOptimized(ctx, stroke) {
  ctx.beginPath();
  const len = stroke.length;
  if (len < 2) return;

  const pFirst = stroke[0];
  const firstX = pFirst[0];
  const firstY = pFirst[1];

  ctx.moveTo(firstX, firstY);

  let p0 = stroke[0];
  let x0 = p0[0];
  let y0 = p0[1];

  for (let i = 0; i < len - 1; i++) {
    const p1 = stroke[i + 1];
    const x1 = p1[0];
    const y1 = p1[1];

    const midX = (x0 + x1) * 0.5;
    const midY = (y0 + y1) * 0.5;
    ctx.quadraticCurveTo(x0, y0, midX, midY);

    // Shift
    x0 = x1;
    y0 = y1;
  }

  const pLast = stroke[len - 1];
  const xLast = pLast[0];
  const yLast = pLast[1];

  // firstX, firstY are already extracted

  const midX = (xLast + firstX) * 0.5;
  const midY = (yLast + firstY) * 0.5;
  ctx.quadraticCurveTo(xLast, yLast, midX, midY);

  ctx.closePath();
}

// Warmup
for (let i = 0; i < 100; i++) {
  drawStrokeCurrent(ctx, points);
  drawStrokeOptimized(ctx, points);
}

const ITERATIONS = 10000;

const startCurrent = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  drawStrokeCurrent(ctx, points);
}
const endCurrent = performance.now();

const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  drawStrokeOptimized(ctx, points);
}
const endOptimized = performance.now();

console.log(`Current: ${(endCurrent - startCurrent).toFixed(2)}ms`);
console.log(`Optimized: ${(endOptimized - startOptimized).toFixed(2)}ms`);
console.log(`Improvement: ${((1 - (endOptimized - startOptimized) / (endCurrent - startCurrent)) * 100).toFixed(2)}%`);
