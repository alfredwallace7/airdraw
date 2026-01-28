const { performance } = require('perf_hooks');

// Mock Canvas Context
class MockContext {
  beginPath() {}
  moveTo(x, y) {}
  quadraticCurveTo(cx, cy, x, y) {}
  closePath() {}
}

const drawStrokeModulo = (ctx, stroke) => {
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
};

const drawStrokeUnrolled = (ctx, stroke) => {
  ctx.beginPath();
  const len = stroke.length;
  if (len < 2) return;

  const [firstX, firstY] = stroke[0];
  ctx.moveTo(firstX, firstY);

  // Unrolled loop: Iterate up to len - 1
  for (let i = 0; i < len - 1; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[i + 1];
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
  }

  // Handle the wrap-around case (last point -> first point)
  const [x0, y0] = stroke[len - 1];
  const [x1, y1] = stroke[0];
  const midX = (x0 + x1) / 2;
  const midY = (y0 + y1) / 2;
  ctx.quadraticCurveTo(x0, y0, midX, midY);

  ctx.closePath();
};

// Generate test data
const generateStroke = (points) => {
  const stroke = [];
  for (let i = 0; i < points; i++) {
    stroke.push([Math.random() * 1000, Math.random() * 1000]);
  }
  return stroke;
};

const runBenchmark = (name, fn, strokes, iterations) => {
  const ctx = new MockContext();
  // Warmup
  for (let i = 0; i < 100; i++) {
    fn(ctx, strokes[0]);
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    for (const stroke of strokes) {
      fn(ctx, stroke);
    }
  }
  const end = performance.now();
  return end - start;
};

const main = () => {
  const smallStrokes = Array(100).fill(0).map(() => generateStroke(100));
  const mediumStrokes = Array(50).fill(0).map(() => generateStroke(1000));
  const largeStrokes = Array(10).fill(0).map(() => generateStroke(5000));

  console.log('Running benchmarks...');

  // Small strokes
  const t1_mod = runBenchmark('Small Modulo', drawStrokeModulo, smallStrokes, 1000);
  const t1_unroll = runBenchmark('Small Unrolled', drawStrokeUnrolled, smallStrokes, 1000);
  console.log(`Small Strokes (100pts): Modulo: ${t1_mod.toFixed(2)}ms, Unrolled: ${t1_unroll.toFixed(2)}ms, Improvement: ${((t1_mod - t1_unroll) / t1_mod * 100).toFixed(2)}%`);

  // Medium strokes
  const t2_mod = runBenchmark('Medium Modulo', drawStrokeModulo, mediumStrokes, 500);
  const t2_unroll = runBenchmark('Medium Unrolled', drawStrokeUnrolled, mediumStrokes, 500);
  console.log(`Medium Strokes (1000pts): Modulo: ${t2_mod.toFixed(2)}ms, Unrolled: ${t2_unroll.toFixed(2)}ms, Improvement: ${((t2_mod - t2_unroll) / t2_mod * 100).toFixed(2)}%`);

  // Large strokes
  const t3_mod = runBenchmark('Large Modulo', drawStrokeModulo, largeStrokes, 100);
  const t3_unroll = runBenchmark('Large Unrolled', drawStrokeUnrolled, largeStrokes, 100);
  console.log(`Large Strokes (5000pts): Modulo: ${t3_mod.toFixed(2)}ms, Unrolled: ${t3_unroll.toFixed(2)}ms, Improvement: ${((t3_mod - t3_unroll) / t3_mod * 100).toFixed(2)}%`);

};

main();
