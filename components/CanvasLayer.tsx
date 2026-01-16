import React, { useEffect, useRef } from 'react';
import { getStroke } from 'perfect-freehand';
import { DrawPath, Point } from '../types';

interface CanvasLayerProps {
  paths: DrawPath[];
  currentPaths: (DrawPath | null)[];
  cursorPositions: (Point | null)[];
  isDrawingHands: boolean[];
  width: number;
  height: number;
}

// Helper to convert stroke points to Path2D directly
// Optimized: avoids string manipulation and parsing overhead
const getPath2DFromStroke = (stroke: number[][]): Path2D => {
  const path = new Path2D();
  if (!stroke.length) return path;

  const [startX, startY] = stroke[0];
  path.moveTo(startX, startY);

  for (let i = 0; i < stroke.length; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[(i + 1) % stroke.length];
    path.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }

  path.closePath();
  return path;
};

// Cursor colors for each hand
const CURSOR_COLORS = [
  { hover: '#38bdf8', drawing: '#f472b6' }, // Hand 1: Sky blue / Pink
  { hover: '#a3e635', drawing: '#fb923c' }, // Hand 2: Lime / Orange
];

const CanvasLayer: React.FC<CanvasLayerProps> = ({
  paths,
  currentPaths,
  cursorPositions,
  isDrawingHands,
  width,
  height
}) => {
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Cache for static paths to avoid re-computing strokes on every frame
  // WeakMap ensures that if path objects are removed, cache is cleaned up
  const pathCache = useRef(new WeakMap<DrawPath, Path2D>());

  // Helper to draw a path using perfect-freehand
  const renderPath = (ctx: CanvasRenderingContext2D, path: DrawPath) => {
    if (path.points.length < 2) return;

    let p = pathCache.current.get(path);

    if (!p) {
      const stroke = getStroke(path.points, {
        size: path.width,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: true,
      });

      p = getPath2DFromStroke(stroke);
      pathCache.current.set(path, p);
    }

    ctx.fillStyle = path.color;

    if (path.color === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill(p);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.fill(p);
    }
  };

  // 1. Static Layer: Draws completed paths
  // Only re-renders when 'paths' or dimensions change
  useEffect(() => {
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    paths.forEach(path => renderPath(ctx, path));

  }, [paths, width, height]);

  // 2. Active Layer: Draws current paths and cursors for all hands
  // Re-renders on every frame (cursor movement)
  useEffect(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Check if any hand is using eraser
    const hasEraserPath = currentPaths.some(p => p && p.color === 'eraser');

    // If erasing, redraw ALL paths first (static + active) so eraser can affect them in real-time
    if (hasEraserPath) {
      paths.forEach(path => renderPath(ctx, path));
    }

    // Draw current active paths for all hands
    currentPaths.forEach((currentPath) => {
      if (currentPath) {
        // Note: currentPaths change every frame (points added), so cache will miss.
        // This is expected and fine for active drawing.
        renderPath(ctx, currentPath);
      }
    });

    // Draw cursors for all hands
    cursorPositions.forEach((cursorPos, handIndex) => {
      if (cursorPos) {
        const isDrawing = isDrawingHands[handIndex];
        const colors = CURSOR_COLORS[handIndex] || CURSOR_COLORS[0];

        ctx.beginPath();
        ctx.arc(cursorPos.x, cursorPos.y, 8, 0, Math.PI * 2);

        ctx.fillStyle = isDrawing ? colors.drawing : colors.hover;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        ctx.fill();
        ctx.stroke();

        // Target crosshair
        ctx.beginPath();
        ctx.moveTo(cursorPos.x - 4, cursorPos.y);
        ctx.lineTo(cursorPos.x + 4, cursorPos.y);
        ctx.moveTo(cursorPos.x, cursorPos.y - 4);
        ctx.lineTo(cursorPos.x, cursorPos.y + 4);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }, [paths, currentPaths, cursorPositions, isDrawingHands, width, height]);

  return (
    <>
      {/* Static Layer */}
      <canvas
        ref={staticCanvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
      />
      {/* Active Layer */}
      <canvas
        ref={activeCanvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-20"
      />
    </>
  );
};

export default React.memo(CanvasLayer);
