const { performance } = require('perf_hooks');

const ITERATIONS = 10000;
const POINT_COUNT = 1000;
const stroke = Array.from({ length: POINT_COUNT }, (_, i) => [i, i]);

// Mock Context
const ctx = {
  beginPath: () => {},
  moveTo: () => {},
  quadraticCurveTo: () => {},
  closePath: () => {},
};

function testDestructuring() {
  const len = stroke.length;
  ctx.beginPath();
  const [firstX, firstY] = stroke[0];
  ctx.moveTo(firstX, firstY);

  for (let i = 0; i < len - 1; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[i + 1];
    const midX = (x0 + x1) * 0.5;
    const midY = (y0 + y1) * 0.5;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
  }
  ctx.closePath();
}

function testIndexing() {
  const len = stroke.length;
  ctx.beginPath();
  const p0 = stroke[0];
  ctx.moveTo(p0[0], p0[1]);

  for (let i = 0; i < len - 1; i++) {
    const p0 = stroke[i];
    const p1 = stroke[i + 1];
    const x0 = p0[0];
    const y0 = p0[1];
    const x1 = p1[0];
    const y1 = p1[1];
    const midX = (x0 + x1) * 0.5;
    const midY = (y0 + y1) * 0.5;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
  }
  ctx.closePath();
}

console.log('Running benchmarks...');

const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  testDestructuring();
}
const end1 = performance.now();
console.log(`Destructuring: ${(end1 - start1).toFixed(2)}ms`);

const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  testIndexing();
}
const end2 = performance.now();
console.log(`Indexing:      ${(end2 - start2).toFixed(2)}ms`);

const improvement = ((end1 - start1) - (end2 - start2)) / (end1 - start1) * 100;
console.log(`Improvement:   ${improvement.toFixed(2)}%`);
