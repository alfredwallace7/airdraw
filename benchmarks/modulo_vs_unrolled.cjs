
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

function withModulo(ctx, stroke) {
  ctx.beginPath();
  if (stroke.length < 2) return;

  const [firstX, firstY] = stroke[0];
  ctx.moveTo(firstX, firstY);

  for (let i = 0; i < stroke.length; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[(i + 1) % stroke.length];
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
  }
  ctx.closePath();
}

function unrolled(ctx, stroke) {
  ctx.beginPath();
  if (stroke.length < 2) return;

  const [firstX, firstY] = stroke[0];
  ctx.moveTo(firstX, firstY);

  const len = stroke.length;
  // Iterate up to the second to last point
  for (let i = 0; i < len - 1; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[i + 1];
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
  }

  // Handle the last point wrapping to the first
  const [xLast, yLast] = stroke[len - 1];
  const [xFirst, yFirst] = stroke[0];
  const midX = (xLast + xFirst) / 2;
  const midY = (yLast + yFirst) / 2;
  ctx.quadraticCurveTo(xLast, yLast, midX, midY);

  ctx.closePath();
}

function unrolledMult(ctx, stroke) {
  ctx.beginPath();
  if (stroke.length < 2) return;

  const [firstX, firstY] = stroke[0];
  ctx.moveTo(firstX, firstY);

  const len = stroke.length;
  // Iterate up to the second to last point
  for (let i = 0; i < len - 1; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[i + 1];
    const midX = (x0 + x1) * 0.5;
    const midY = (y0 + y1) * 0.5;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
  }

  // Handle the last point wrapping to the first
  const [xLast, yLast] = stroke[len - 1];
  const [xFirst, yFirst] = stroke[0];
  const midX = (xLast + xFirst) * 0.5;
  const midY = (yLast + yFirst) * 0.5;
  ctx.quadraticCurveTo(xLast, yLast, midX, midY);

  ctx.closePath();
}

// Warmup
for(let i=0; i<1000; i++) {
    withModulo(ctx, stroke);
    unrolled(ctx, stroke);
    unrolledMult(ctx, stroke);
}

// Test Modulo
const startModulo = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  withModulo(ctx, stroke);
}
const endModulo = performance.now();

// Test Unrolled
const startUnrolled = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  unrolled(ctx, stroke);
}
const endUnrolled = performance.now();

// Test Unrolled Mult
const startUnrolledMult = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  unrolledMult(ctx, stroke);
}
const endUnrolledMult = performance.now();

console.log(`Modulo: ${(endModulo - startModulo).toFixed(2)}ms`);
console.log(`Unrolled: ${(endUnrolled - startUnrolled).toFixed(2)}ms`);
console.log(`UnrolledMult: ${(endUnrolledMult - startUnrolledMult).toFixed(2)}ms`);
