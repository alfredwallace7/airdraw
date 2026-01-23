import React, { useEffect, useRef, MutableRefObject } from 'react';
import { getStroke } from 'perfect-freehand';
import { DrawPath, Point } from '../types';

interface CanvasLayerProps {
  paths: DrawPath[];
  currentPathsRef: MutableRefObject<(DrawPath | null)[]>;
  cursorPositionsRef: MutableRefObject<(Point | null)[]>;
  isDrawingHandsRef: MutableRefObject<boolean[]>;
  width: number;
  height: number;
  activeTool: 'pencil' | 'eraser';
}

// Helper to draw a stroke directly to the canvas context
// ⚡ OPTIMIZATION: Avoids O(N) string allocation and Path2D parsing by using direct context calls
const drawStroke = (ctx: CanvasRenderingContext2D, stroke: number[][]) => {
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

// Cursor colors for each hand
const CURSOR_COLORS = [
  { hover: '#38bdf8', drawing: '#f472b6' }, // Hand 1: Sky blue / Pink
  { hover: '#a3e635', drawing: '#fb923c' }, // Hand 2: Lime / Orange
];

const CanvasLayer: React.FC<CanvasLayerProps> = ({
  paths,
  currentPathsRef,
  cursorPositionsRef,
  isDrawingHandsRef,
  width,
  height,
  activeTool
}) => {
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number>(0);

  // ⚡ OPTIMIZATION: Track rendered state to enable incremental drawing
  const renderedPathsCount = useRef(0);
  const prevDimensions = useRef({ width: 0, height: 0 });

  // ⚡ OPTIMIZATION: Cache calculated strokes for completed paths
  // This avoids recalculating perfect-freehand geometry (O(N)) on every static layer redraw
  const strokeCache = useRef(new WeakMap<DrawPath, number[][]>());

  // Helper to draw a path using perfect-freehand
  const renderPath = (ctx: CanvasRenderingContext2D, path: DrawPath, useCache: boolean = false) => {
    if (path.points.length < 2) return;

    let stroke: number[][] | undefined;

    if (useCache) {
      stroke = strokeCache.current.get(path);
    }

    if (!stroke) {
      stroke = getStroke(path.points, {
        size: path.width,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: true,
      });

      if (useCache) {
        strokeCache.current.set(path, stroke);
      }
    }

    // ⚡ OPTIMIZATION: Use direct context calls instead of Path2D
    drawStroke(ctx, stroke);

    ctx.fillStyle = path.color;

    if (path.color === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.fill();
    }
  };

  // 1. Static Layer: Draws completed paths
  // ⚡ OPTIMIZATION: Incremental drawing
  // Instead of clearing and redrawing everything (O(N)) when a new path is added,
  // we only draw the new path (O(1)) unless a full redraw is required (resize/clear).
  useEffect(() => {
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Detect if we need a full redraw
    const isResize = width !== prevDimensions.current.width || height !== prevDimensions.current.height;
    const isReset = paths.length < renderedPathsCount.current;
    const needsFullRedraw = isResize || isReset;

    let startFrom = renderedPathsCount.current;

    if (needsFullRedraw) {
      ctx.clearRect(0, 0, width, height);
      startFrom = 0;
    }

    // Draw only new paths (or all if full redraw)
    for (let i = startFrom; i < paths.length; i++) {
      renderPath(ctx, paths[i], true);
    }

    // Update refs
    renderedPathsCount.current = paths.length;
    prevDimensions.current = { width, height };

  }, [paths, width, height]);

  // 2. Active Layer Loop
  // ⚡ OPTIMIZATION: Use requestAnimationFrame loop instead of React render cycle
  // This prevents the entire App from re-rendering on every frame (60fps)
  useEffect(() => {
    const render = () => {
      const canvas = activeCanvasRef.current;
      if (!canvas) {
        animationFrameIdRef.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      // Read from refs directly
      const currentPaths = currentPathsRef.current;
      const cursorPositions = cursorPositionsRef.current;
      const isDrawingHands = isDrawingHandsRef.current;

      // Check if any hand is using eraser (derived logic inside loop)
      const isErasing = currentPaths.some(p => p && p.color === 'eraser') || activeTool === 'eraser';

      ctx.clearRect(0, 0, width, height);

      // If erasing, redraw ALL paths first so eraser can affect them in real-time
      if (isErasing) {
        // ⚡ OPTIMIZATION: Copy static canvas bitmap (O(1)) instead of re-rendering all vector paths (O(N))
        if (staticCanvasRef.current) {
          ctx.drawImage(staticCanvasRef.current, 0, 0);
        } else {
          // Fallback
          paths.forEach(path => renderPath(ctx, path, true));
        }
      }

      // Draw current active paths for all hands
      currentPaths.forEach((currentPath) => {
        if (currentPath) {
          renderPath(ctx, currentPath, false);
        }
      });

      // Draw cursors for all hands
      cursorPositions.forEach((cursorPos, handIndex) => {
        if (cursorPos) {
          const isDrawing = isDrawingHands[handIndex];
          const colors = CURSOR_COLORS[handIndex] || CURSOR_COLORS[0];
          const isEraserPreview = activeTool === 'eraser' && !isDrawing;

          ctx.beginPath();
          ctx.arc(cursorPos.x, cursorPos.y, isEraserPreview ? 12 : 8, 0, Math.PI * 2);

          if (isEraserPreview) {
            // Eraser preview: Clear the center to show "transparency"
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = '#000000';
            ctx.fill();
            ctx.restore();

            // Draw outline
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner dashed line
            ctx.beginPath();
            ctx.arc(cursorPos.x, cursorPos.y, 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff0000'; // Red for eraser
            ctx.setLineDash([2, 2]);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
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
        }
      });

      // Update static layer visibility imperatively
      if (staticCanvasRef.current) {
        staticCanvasRef.current.style.opacity = isErasing ? '0' : '1';
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    // Start loop
    render();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [width, height, activeTool, paths]); // Re-start loop if these change

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
