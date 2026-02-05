import { getStroke } from 'perfect-freehand';
import { performance } from 'perf_hooks';

const points = [];
// Create a spiral path with 500 points
for (let i = 0; i < 500; i++) {
  const t = i / 10;
  points.push({
    x: 500 + t * Math.cos(t) * 10,
    y: 500 + t * Math.sin(t) * 10,
    pressure: 0.5
  });
}

const path = {
  points,
  width: 8
};

const options = {
  size: path.width,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: true,
};

// Warmup
getStroke(path.points, options);

// Baseline: No cache (recalculate every frame)
console.log('Running baseline (no cache)...');
const startBase = performance.now();
for (let i = 0; i < 1000; i++) {
  getStroke(path.points, options);
}
const endBase = performance.now();
const baselineTime = endBase - startBase;
console.log(`Baseline time: ${baselineTime.toFixed(2)}ms`);

// Optimized: With "length check" cache
console.log('Running optimized (length check cache)...');
const cache = new WeakMap();
const startOpt = performance.now();

// Simulate 1000 frames where path DOES NOT change
for (let i = 0; i < 1000; i++) {
  let stroke;
  const cached = cache.get(path);

  if (cached && cached.pointsLength === path.points.length) {
    stroke = cached.stroke;
  } else {
    stroke = getStroke(path.points, options);
    cache.set(path, { stroke, pointsLength: path.points.length });
  }
}
const endOpt = performance.now();
const optTime = endOpt - startOpt;
console.log(`Optimized time: ${optTime.toFixed(2)}ms`);

console.log(`Improvement: ${(baselineTime / optTime).toFixed(2)}x speedup`);
