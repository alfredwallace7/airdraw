import { getStroke } from 'perfect-freehand';
import { performance } from 'perf_hooks';

const POINTS_COUNT = 500;
const FRAMES_PER_POINT = 2; // Add a point every 2 frames (simulating 30hz input on 60hz display)
const TOTAL_FRAMES = POINTS_COUNT * FRAMES_PER_POINT;

// Generate points
const allPoints = [];
for (let i = 0; i < POINTS_COUNT; i++) {
    allPoints.push({
        x: i * 2 + Math.random(),
        y: i * 2 + Math.random(),
        pressure: Math.random()
    });
}

function runWithoutCache() {
    const currentPoints = [];
    let start = performance.now();

    for (let f = 0; f < TOTAL_FRAMES; f++) {
        // Update model
        if (f % FRAMES_PER_POINT === 0) {
            const ptIdx = Math.floor(f / FRAMES_PER_POINT);
            if (ptIdx < allPoints.length) {
                currentPoints.push(allPoints[ptIdx]);
            }
        }

        // Render (always calculate)
        if (currentPoints.length > 1) {
             getStroke(currentPoints, {
                size: 8,
                thinning: 0.5,
                smoothing: 0.5,
                streamline: 0.5,
                simulatePressure: true,
            });
        }
    }

    return performance.now() - start;
}

function runWithCache() {
    const currentPoints = [];
    let lastCalculatedLength = 0;
    let cachedStroke = null;

    let start = performance.now();

    for (let f = 0; f < TOTAL_FRAMES; f++) {
        // Update model
        if (f % FRAMES_PER_POINT === 0) {
            const ptIdx = Math.floor(f / FRAMES_PER_POINT);
            if (ptIdx < allPoints.length) {
                currentPoints.push(allPoints[ptIdx]);
            }
        }

        // Render (check cache)
        if (currentPoints.length > 1) {
            if (!cachedStroke || currentPoints.length !== lastCalculatedLength) {
                 cachedStroke = getStroke(currentPoints, {
                    size: 8,
                    thinning: 0.5,
                    smoothing: 0.5,
                    streamline: 0.5,
                    simulatePressure: true,
                });
                lastCalculatedLength = currentPoints.length;
            } else {
                // Cache hit - do nothing (simulate reusing result)
                const _ = cachedStroke;
            }
        }
    }

    return performance.now() - start;
}

console.log(`Benchmarking ${TOTAL_FRAMES} frames, adding point every ${FRAMES_PER_POINT} frames.`);
console.log(`Max points: ${POINTS_COUNT}`);

// Warmup
runWithoutCache();
runWithCache();

const timeNoCache = runWithoutCache();
const timeCache = runWithCache();

console.log(`Without Cache: ${timeNoCache.toFixed(2)}ms`);
console.log(`With Cache:    ${timeCache.toFixed(2)}ms`);
console.log(`Improvement:   ${((timeNoCache - timeCache) / timeNoCache * 100).toFixed(1)}%`);
