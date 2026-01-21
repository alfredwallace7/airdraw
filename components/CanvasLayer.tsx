import React, { useEffect, useLayoutEffect, useRef } from 'react';
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

  // Helper to draw a path using perfect-freehand
  const renderPath = (ctx: CanvasRenderingContext2D, path: DrawPath) => {
    if (path.points.length < 2) return;

    const stroke = getStroke(path.points, {
      size: path.width,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: true,
    });

    const p = new Path2D();
    if (stroke.length > 0) {
      p.moveTo(stroke[0][0], stroke[0][1]);
      for (let i = 0; i < stroke.length; i++) {
        const [x0, y0] = stroke[i];
        const [x1, y1] = stroke[(i + 1) % stroke.length];
        p.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      }
      p.closePath();
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

  // Check if any hand is using eraser (derived state for rendering optimizations)
  const isErasing = currentPaths.some(p => p && p.color === 'eraser');

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
  // ⚡ Use useLayoutEffect to prevent flickering when hiding the static layer
  useLayoutEffect(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // If erasing, redraw ALL paths first so eraser can affect them in real-time
    if (isErasing) {
      // ⚡ OPTIMIZATION: Copy static canvas bitmap (O(1)) instead of re-rendering all vector paths (O(N))
      // This significantly improves performance when erasing in drawings with many strokes.
      if (staticCanvasRef.current) {
        ctx.drawImage(staticCanvasRef.current, 0, 0);
      } else {
        // Fallback (should normally not be reached if refs are set)
        paths.forEach(path => renderPath(ctx, path));
      }
    }

    // Draw current active paths for all hands
    currentPaths.forEach((currentPath) => {
      if (currentPath) {
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
  }, [paths, currentPaths, cursorPositions, isDrawingHands, width, height, isErasing]);

  return (
    <>
      {/* Static Layer */}
      <canvas
        ref={staticCanvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        style={{ opacity: isErasing ? 0 : 1 }} // Hide static layer when erasing to show active layer's composited view
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
