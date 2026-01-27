
const ITERATIONS = 10000;
const STROKE_LENGTH = 1000;

// Mock stroke data
const stroke = Array.from({ length: STROKE_LENGTH }, (_, i) => [i, i]);

// Mock Context
const ctx = {
  beginPath: () => {},
  moveTo: () => {},
  quadraticCurveTo: () => {},
  closePath: () => {},
};

function drawStrokeModulo(ctx, stroke) {
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

function drawStrokeUnrolled(ctx, stroke) {
  ctx.beginPath();
  if (stroke.length < 2) return;

  const [firstX, firstY] = stroke[0];
  ctx.moveTo(firstX, firstY);

  const len = stroke.length;
  for (let i = 0; i < len - 1; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[i + 1];
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
  }

  // Handle last segment
  const [x0, y0] = stroke[len - 1];
  const [x1, y1] = stroke[0];
  const midX = (x0 + x1) / 2;
  const midY = (y0 + y1) / 2;
  ctx.quadraticCurveTo(x0, y0, midX, midY);

  ctx.closePath();
}

console.log('Running benchmark...');

const startModulo = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  drawStrokeModulo(ctx, stroke);
}
const endModulo = performance.now();
const timeModulo = endModulo - startModulo;

const startUnrolled = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  drawStrokeUnrolled(ctx, stroke);
}
const endUnrolled = performance.now();
const timeUnrolled = endUnrolled - startUnrolled;

console.log(`Modulo: ${timeModulo.toFixed(2)}ms`);
console.log(`Unrolled: ${timeUnrolled.toFixed(2)}ms`);
console.log(`Improvement: ${((timeModulo - timeUnrolled) / timeModulo * 100).toFixed(2)}%`);
