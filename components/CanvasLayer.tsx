import React, { useEffect, useRef, MutableRefObject } from 'react';
import { getStroke } from 'perfect-freehand';
import { DrawPath, Point } from '../types';
import { getCursorSprite } from '../utils/cursorRenderer';

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
  const len = stroke.length;
  if (len < 2) return;

  const [firstX, firstY] = stroke[0];
  ctx.moveTo(firstX, firstY);

  // ⚡ OPTIMIZATION: Unroll loop to avoid modulo operator overhead in hot path
  // Iterate up to the second to last point
  for (let i = 0; i < len - 1; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[i + 1];
    const midX = (x0 + x1) * 0.5;
    const midY = (y0 + y1) * 0.5;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
  }

  // Handle the last point wrapping to the first
  const [xLast, yLast] = stroke[len - 1];
  const [xFirst, yFirst] = stroke[0];
  const midX = (xLast + xFirst) * 0.5;
  const midY = (yLast + yFirst) * 0.5;
  ctx.quadraticCurveTo(xLast, yLast, midX, midY);

  ctx.closePath();
};

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

  // Refs to decouple animation loop from React renders
  const pathsRef = useRef(paths);
  const activeToolRef = useRef(activeTool);

  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

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

  // ⚡ OPTIMIZATION: Track rendering state for incremental updates
  const renderedPathsCount = useRef(0);
  const prevWidth = useRef(width);
  const prevHeight = useRef(height);

  // 1. Static Layer: Draws completed paths
  // ⚡ OPTIMIZATION: Use incremental drawing to avoid O(N) redraws on every new stroke.
  // Instead of clearing and redrawing all paths (O(N)) when a new path is added,
  // we only draw the newly added paths (O(1)) on top of the existing canvas.
  // Full redraws are only performed when:
  // 1. The canvas is resized (invalidation)
  // 2. The paths history is modified non-additively (e.g. undo/clear)
  useEffect(() => {
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isResize = width !== prevWidth.current || height !== prevHeight.current;
    // If paths array shrank (undo/clear), we must full redraw
    const isReset = paths.length < renderedPathsCount.current;

    // Check for full redraw condition
    if (isResize || isReset) {
      // Full Redraw (O(N))
      // Required when canvas is invalidated or history changes retroactively
      ctx.clearRect(0, 0, width, height);
      paths.forEach(path => renderPath(ctx, path, true));

      // Update tracking refs
      renderedPathsCount.current = paths.length;
      prevWidth.current = width;
      prevHeight.current = height;
    } else {
      // Incremental Draw (O(1) amortized)
      // Only draw paths that have been added since the last render
      for (let i = renderedPathsCount.current; i < paths.length; i++) {
        renderPath(ctx, paths[i], true);
      }
      renderedPathsCount.current = paths.length;
    }

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
      // ⚡ OPTIMIZATION: Only copy static canvas when ACTUALLY drawing with eraser.
      // Previously, we copied the full 1080p canvas every frame even when just hovering with eraser tool.
      const isErasing = currentPaths.some(p => p && p.color === 'eraser');

      ctx.clearRect(0, 0, width, height);

      // If erasing, redraw ALL paths first so eraser can affect them in real-time
      if (isErasing) {
        // ⚡ OPTIMIZATION: Copy static canvas bitmap (O(1)) instead of re-rendering all vector paths (O(N))
        if (staticCanvasRef.current) {
          ctx.drawImage(staticCanvasRef.current, 0, 0);
        } else {
          // Fallback
          pathsRef.current.forEach(path => renderPath(ctx, path, true));
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
          const isEraserPreview = activeToolRef.current === 'eraser' && !isDrawing;

          // ⚡ OPTIMIZATION: Use cached sprite to avoid vector drawing overhead per frame
          const sprite = getCursorSprite(handIndex, isDrawing, isEraserPreview);

          // Draw sprite centered at cursor position (sprite is 32x32, so offset by 16)
          ctx.drawImage(sprite, cursorPos.x - 16, cursorPos.y - 16);
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
  }, [width, height]); // Only restart loop if dimensions change

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
