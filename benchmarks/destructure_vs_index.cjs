
const { performance } = require('perf_hooks');

const POINTS = 1000;
const ITERATIONS = 100000;

// Generate a fake stroke
const stroke = Array.from({ length: POINTS }, (_, i) => [Math.random() * 100, Math.random() * 100]);

// Mock Context
const ctx = {
  beginPath: () => {},
  moveTo: () => {},
  quadraticCurveTo: () => {},
  closePath: () => {},
};

function withDestructuring(ctx, stroke) {
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

function withDirectIndex(ctx, stroke) {
  ctx.beginPath();
  const len = stroke.length;
  if (len < 2) return;

  const p0 = stroke[0];
  ctx.moveTo(p0[0], p0[1]);

  for (let i = 0; i < len - 1; i++) {
    const pA = stroke[i];
    const pB = stroke[i + 1];
    // Access indices directly
    const x0 = pA[0];
    const y0 = pA[1];
    const x1 = pB[0];
    const y1 = pB[1];

    const midX = (x0 + x1) * 0.5;
    const midY = (y0 + y1) * 0.5;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
  }

  const pLast = stroke[len - 1];
  const pFirst = stroke[0];

  const xLast = pLast[0];
  const yLast = pLast[1];
  const xFirst = pFirst[0];
  const yFirst = pFirst[1];

  const midX = (xLast + xFirst) * 0.5;
  const midY = (yLast + yFirst) * 0.5;
  ctx.quadraticCurveTo(xLast, yLast, midX, midY);

  ctx.closePath();
}

// Warmup
for(let i=0; i<1000; i++) {
    withDestructuring(ctx, stroke);
    withDirectIndex(ctx, stroke);
}

// Test Destructuring
const startDestructuring = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  withDestructuring(ctx, stroke);
}
const endDestructuring = performance.now();

// Test Direct Index
const startDirect = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  withDirectIndex(ctx, stroke);
}
const endDirect = performance.now();

console.log(`Destructuring: ${(endDestructuring - startDestructuring).toFixed(2)}ms`);
console.log(`DirectIndex: ${(endDirect - startDirect).toFixed(2)}ms`);
console.log(`Improvement: ${(1 - (endDirect - startDirect) / (endDestructuring - startDestructuring)).toFixed(2) * 100}%`);
