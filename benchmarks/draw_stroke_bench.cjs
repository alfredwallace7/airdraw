const { performance } = require('perf_hooks');

// Mock Canvas Context
class MockContext {
  beginPath() {}
  moveTo(x, y) {}
  quadraticCurveTo(x1, y1, x2, y2) {}
  closePath() {}
}

const generateStroke = (points) => {
  const stroke = [];
  for (let i = 0; i < points; i++) {
    stroke.push([Math.random() * 1000, Math.random() * 1000]);
  }
  return stroke;
};

const drawStrokeOriginal = (ctx, stroke) => {
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

const drawStrokeOptimized = (ctx, stroke) => {
  ctx.beginPath();
  const len = stroke.length;
  if (len < 2) return;

  const [firstX, firstY] = stroke[0];
  ctx.moveTo(firstX, firstY);

  const lenMinus1 = len - 1;
  for (let i = 0; i < lenMinus1; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[i + 1];
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
  }

  // Wrap around case
  const [x0, y0] = stroke[lenMinus1];
  const [x1, y1] = stroke[0];
  const midX = (x0 + x1) / 2;
  const midY = (y0 + y1) / 2;
  ctx.quadraticCurveTo(x0, y0, midX, midY);

  ctx.closePath();
};

const runBenchmark = () => {
  const ctx = new MockContext();
  const strokeSmall = generateStroke(100);
  const strokeMedium = generateStroke(1000);
  const strokeLarge = generateStroke(5000);

  const iterations = 10000;

  console.log('Running benchmark...');

  // Small stroke (100 points)
  let start = performance.now();
  for (let i = 0; i < iterations; i++) drawStrokeOriginal(ctx, strokeSmall);
  let end = performance.now();
  const originalSmall = end - start;

  start = performance.now();
  for (let i = 0; i < iterations; i++) drawStrokeOptimized(ctx, strokeSmall);
  end = performance.now();
  const optimizedSmall = end - start;

  console.log(`Small Stroke (100 pts): Original=${originalSmall.toFixed(2)}ms, Optimized=${optimizedSmall.toFixed(2)}ms, Improvement=${((originalSmall - optimizedSmall) / originalSmall * 100).toFixed(2)}%`);

  // Medium stroke (1000 points)
  start = performance.now();
  for (let i = 0; i < iterations; i++) drawStrokeOriginal(ctx, strokeMedium);
  end = performance.now();
  const originalMedium = end - start;

  start = performance.now();
  for (let i = 0; i < iterations; i++) drawStrokeOptimized(ctx, strokeMedium);
  end = performance.now();
  const optimizedMedium = end - start;

  console.log(`Medium Stroke (1000 pts): Original=${originalMedium.toFixed(2)}ms, Optimized=${optimizedMedium.toFixed(2)}ms, Improvement=${((originalMedium - optimizedMedium) / originalMedium * 100).toFixed(2)}%`);

  // Large stroke (5000 points)
  start = performance.now();
  for (let i = 0; i < iterations; i++) drawStrokeOriginal(ctx, strokeLarge);
  end = performance.now();
  const originalLarge = end - start;

  start = performance.now();
  for (let i = 0; i < iterations; i++) drawStrokeOptimized(ctx, strokeLarge);
  end = performance.now();
  const optimizedLarge = end - start;

  console.log(`Large Stroke (5000 pts): Original=${originalLarge.toFixed(2)}ms, Optimized=${optimizedLarge.toFixed(2)}ms, Improvement=${((originalLarge - optimizedLarge) / originalLarge * 100).toFixed(2)}%`);
};

runBenchmark();
