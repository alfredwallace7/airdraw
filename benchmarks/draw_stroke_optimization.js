
import { performance } from 'perf_hooks';

const ITERATIONS = 10000;
const POINT_COUNT = 1000;

// Mock Context
const ctx = {
    quadraticCurveTo: (x1, y1, x2, y2) => { return x1 + y1 + x2 + y2; },
    beginPath: () => {},
    moveTo: (x, y) => {},
    closePath: () => {}
};

// Generate mock stroke data
const stroke = [];
for (let i = 0; i < POINT_COUNT; i++) {
    stroke.push([Math.random() * 1000, Math.random() * 1000]);
}

// 1. Current Implementation
function drawStrokeCurrent(ctx, stroke) {
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

// 2. Optimized Implementation
function drawStrokeOptimized(ctx, stroke) {
    ctx.beginPath();
    const len = stroke.length;
    if (len < 2) return;

    const [firstX, firstY] = stroke[0];
    ctx.moveTo(firstX, firstY);

    // Unrolled loop (0 to len - 2)
    // We stop at len - 1 because we need i+1 to be valid without modulo
    for (let i = 0; i < len - 1; i++) {
        const [x0, y0] = stroke[i];
        const [x1, y1] = stroke[i + 1];
        const midX = (x0 + x1) / 2;
        const midY = (y0 + y1) / 2;
        ctx.quadraticCurveTo(x0, y0, midX, midY);
    }

    // Handle wrap-around (last point to first point)
    const [lastX, lastY] = stroke[len - 1];
    const [wrapX, wrapY] = stroke[0];
    const midX = (lastX + wrapX) / 2;
    const midY = (lastY + wrapY) / 2;
    ctx.quadraticCurveTo(lastX, lastY, midX, midY);

    ctx.closePath();
}

// Benchmark
console.log(`Benchmarking ${ITERATIONS} iterations with ${POINT_COUNT} points...`);

const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    drawStrokeCurrent(ctx, stroke);
}
const end1 = performance.now();
const time1 = end1 - start1;
console.log(`Current: ${time1.toFixed(2)}ms`);

const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    drawStrokeOptimized(ctx, stroke);
}
const end2 = performance.now();
const time2 = end2 - start2;
console.log(`Optimized: ${time2.toFixed(2)}ms`);

const improvement = ((time1 - time2) / time1) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);
