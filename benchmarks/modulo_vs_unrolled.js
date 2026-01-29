
import { performance } from 'perf_hooks';

const ITERATIONS = 10000;
const STROKE_LENGTH = 1000;

// Create a mock stroke
const stroke = Array.from({ length: STROKE_LENGTH }, (_, i) => [i, i]);

function withModulo(stroke) {
  let result = 0;
  for (let i = 0; i < stroke.length; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[(i + 1) % stroke.length];
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    result += midX + midY; // dummy work
  }
  return result;
}

function unrolled(stroke) {
  let result = 0;
  const len = stroke.length;
  for (let i = 0; i < len - 1; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[i + 1];
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    result += midX + midY;
  }

  // Wrap around
  const [x0, y0] = stroke[len - 1];
  const [x1, y1] = stroke[0];
  const midX = (x0 + x1) / 2;
  const midY = (y0 + y1) / 2;
  result += midX + midY;

  return result;
}

// Warmup
for (let i = 0; i < 1000; i++) {
  withModulo(stroke);
  unrolled(stroke);
}

// Measure Modulo
const startModulo = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  withModulo(stroke);
}
const endModulo = performance.now();

// Measure Unrolled
const startUnrolled = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  unrolled(stroke);
}
const endUnrolled = performance.now();

console.log(`Modulo: ${(endModulo - startModulo).toFixed(2)}ms`);
console.log(`Unrolled: ${(endUnrolled - startUnrolled).toFixed(2)}ms`);
console.log(`Improvement: ${(100 * (1 - (endUnrolled - startUnrolled) / (endModulo - startModulo))).toFixed(2)}%`);
