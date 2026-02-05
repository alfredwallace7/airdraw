const { performance } = require('perf_hooks');

// Mock data
const POINTS = 5000;
const stroke = new Array(POINTS).fill(0).map(() => [Math.random() * 1000, Math.random() * 1000]);

const ITERATIONS = 10000;

// Mock Context
const ctx = {
  beginPath: () => {},
  moveTo: () => {},
  quadraticCurveTo: () => {},
  closePath: () => {},
};

function original(ctx, stroke) {
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

function optimized(ctx, stroke) {
  ctx.beginPath();
  const len = stroke.length;
  if (len < 2) return;

  let x0 = stroke[0][0];
  let y0 = stroke[0][1];

  ctx.moveTo(x0, y0);

  for (let i = 0; i < len - 1; i++) {
    const p1 = stroke[i + 1];
    const x1 = p1[0];
    const y1 = p1[1];

    const midX = (x0 + x1) * 0.5;
    const midY = (y0 + y1) * 0.5;
    ctx.quadraticCurveTo(x0, y0, midX, midY);

    x0 = x1;
    y0 = y1;
  }

  const xLast = stroke[len - 1][0];
  const yLast = stroke[len - 1][1];
  const xFirst = stroke[0][0];
  const yFirst = stroke[0][1];

  const midX = (xLast + xFirst) * 0.5;
  const midY = (yLast + yFirst) * 0.5;
  ctx.quadraticCurveTo(xLast, yLast, midX, midY);

  ctx.closePath();
}

console.log(`Running benchmark with ${POINTS} points and ${ITERATIONS} iterations...`);

const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  original(ctx, stroke);
}
const end1 = performance.now();
console.log(`Original: ${(end1 - start1).toFixed(2)}ms`);

const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  optimized(ctx, stroke);
}
const end2 = performance.now();
console.log(`Optimized: ${(end2 - start2).toFixed(2)}ms`);

const improvement = ((end1 - start1) - (end2 - start2)) / (end1 - start1) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);
