import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, Trash2, Camera as CameraIcon, Info } from 'lucide-react';
import { HandTrackingService } from './services/mediaPipe';
import CanvasLayer from './components/CanvasLayer';
import Toolbar, { COLORS, SIZES } from './components/Toolbar';
import { DrawPath, Point } from './types';
import { Results } from '@mediapipe/hands';
import { processMultipleHands } from './utils/handProcessor';

const App: React.FC = () => {
  // --- State ---
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Multi-hand state (Index 0 = Hand 1, Index 1 = Hand 2)
  const [cursorPositions, setCursorPositions] = useState<(Point | null)[]>([null, null]);
  const [isDrawingHands, setIsDrawingHands] = useState<boolean[]>([false, false]);

  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPaths, setCurrentPaths] = useState<(DrawPath | null)[]>([null, null]);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Tool State
  const [activeTool, setActiveTool] = useState<'pencil' | 'eraser'>('pencil');
  const [brushColor, setBrushColor] = useState(COLORS[2]); // Default Yellow

  const [pencilSize, setPencilSize] = useState(SIZES[2]); // Default 3rd size (8px)
  const [eraserSize, setEraserSize] = useState(SIZES[7]); // Default large size (48px)

  const brushSize = activeTool === 'pencil' ? pencilSize : eraserSize;

  const handleSizeChange = useCallback((newSize: number) => {
    if (activeTool === 'pencil') {
      setPencilSize(newSize);
    } else {
      setEraserSize(newSize);
    }
  }, [activeTool]);

  const [videoOpacity, setVideoOpacity] = useState(0.25); // Default 25% opacity

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const handTrackingService = useRef<HandTrackingService | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Smoothing Refs (one per hand)
  const lastCursorPositions = useRef<(Point | null)[]>([null, null]);
  const clickCooldown = useRef(false);

  // Gesture Stabilization - Prevent flickering (one per hand)
  const gestureHistories = useRef<boolean[][]>([[], []]);
  const GESTURE_HISTORY_SIZE = 3; // Number of frames to average

  // --- Effects ---

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Instructions State
  const [showHelp, setShowHelp] = useState(true);

  // Refs for State Access in Callbacks
  const dimensionsRef = useRef(dimensions);
  const showHelpRef = useRef(showHelp);
  const frameCountRef = useRef(0);

  const activeToolRef = useRef(activeTool);
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);
  const currentPathsRef = useRef<(DrawPath | null)[]>([null, null]);

  useEffect(() => { dimensionsRef.current = dimensions; }, [dimensions]);
  useEffect(() => { showHelpRef.current = showHelp; }, [showHelp]);

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);

  // Process MediaPipe Results
  const onResults = useCallback((results: Results) => {
    const dims = dimensionsRef.current;
    const isHelpVisible = showHelpRef.current;

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      setCursorPositions([null, null]);
      setIsDrawingHands([false, false]);

      // Clear current paths if hands are lost during drawing?
      // Or just keep them suspended? Existing logic cleared tracking but not paths explicitly.
      // Let's keep existing behavior but reset histories.

      if (frameCountRef.current % 10 === 0) setDebugInfo('No hands detected');
      frameCountRef.current++;
      lastCursorPositions.current = [null, null];
      gestureHistories.current = [[], []];
      return;
    }

    // Process all detected hands
    const handResults = processMultipleHands(
      results.multiHandLandmarks,
      dims,
      videoRef,
      lastCursorPositions,
      gestureHistories,
      GESTURE_HISTORY_SIZE
    );

    // --- Drawing Logic Optimized (Moved from useEffect to reduce re-renders) ---
    const newCurrentPaths = [...currentPathsRef.current];
    let pathsUpdated = false;

    for (let i = 0; i < 2; i++) {
        const isDrawing = handResults.isDrawing[i];
        const pos = handResults.positions[i];
        const existingPath = newCurrentPaths[i];

        if (isDrawing && pos) {
            if (!existingPath) {
                // Start new path
                newCurrentPaths[i] = {
                    points: [pos],
                    color: activeToolRef.current === 'eraser' ? 'eraser' : brushColorRef.current,
                    width: brushSizeRef.current
                };
            } else {
                // Extend existing path - Mutating for performance (avoid O(N) copy)
                // This is safe because we immediately trigger a state update with a new array reference
                existingPath.points.push(pos);
            }
            pathsUpdated = true;
        } else if (existingPath) {
             // Stop drawing -> Commit
             // We must copy the path here to ensure the committed path is immutable
             setPaths(prev => [...prev, { ...existingPath, points: [...existingPath.points] }]);
             newCurrentPaths[i] = null;
             pathsUpdated = true;
        }
    }

    if (pathsUpdated) {
        currentPathsRef.current = newCurrentPaths;
        setCurrentPaths([...newCurrentPaths]); // Trigger render with new array ref
    }
    // -------------------------------------------------------------------------

    setCursorPositions(handResults.positions);
    setIsDrawingHands(handResults.isDrawing);

    // Update debug info every 10 frames
    if (frameCountRef.current % 10 === 0) {
      const handCount = results.multiHandLandmarks.length;
      const drawingCount = handResults.isDrawing.filter(d => d).length;
      setDebugInfo(`${handCount} hand${handCount !== 1 ? 's' : ''} | ${drawingCount} drawing`);
    }
    frameCountRef.current++;

    // Simple UI interaction for first hand only (to avoid conflicts)
    const firstPos = handResults.positions[0];
    if (firstPos) {
      const element = document.elementFromPoint(firstPos.x, firstPos.y);
      const isClickable = element?.getAttribute('data-clickable') === 'true';

      // Check if hovering over instructions
      const instructionsWidth = 320;
      const instructionsHeight = 200;
      const isOverInstructions =
        firstPos.x > dims.width - instructionsWidth &&
        firstPos.y > dims.height - instructionsHeight;

      if (isOverInstructions && isHelpVisible) {
        setShowHelp(false);
      }

      // UI interaction with first hand
      if (isClickable && handResults.isDrawing[0] && !clickCooldown.current) {
        (element as HTMLElement).click();
        clickCooldown.current = true;
        setTimeout(() => { clickCooldown.current = false; }, 500);
      }
    }

  }, []);

  // Initialize Camera & Tracking
  const startCamera = useCallback(async () => {
    if (videoRef.current && !handTrackingService.current) {
      handTrackingService.current = new HandTrackingService(onResults);
      handTrackingService.current.start(videoRef.current);
      setIsCameraActive(true);
    }
  }, [onResults]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (handTrackingService.current) {
      handTrackingService.current.stop();
      handTrackingService.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCursorPositions([null, null]);
    setIsDrawingHands([false, false]);
  }, []);


  const clearCanvas = useCallback(() => {
    setPaths([]);
    setCurrentPaths([null, null]);
  }, []);

  const handleToggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-slate-900 overflow-hidden" ref={containerRef}>

      {/* Background Video Feed (Mirrored) */}
      <video
        ref={videoRef}
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isCameraActive ? 'block' : 'hidden'}`}
        style={{ opacity: videoOpacity }}
      />

      {/* Drawing Overlay */}
      <CanvasLayer
        paths={paths}
        currentPaths={currentPaths}
        cursorPositions={cursorPositions}
        isDrawingHands={isDrawingHands}
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* Toolbar (Only visible when camera active) */}
      {isCameraActive && (
        <Toolbar
          activeTool={activeTool}
          brushColor={brushColor}
          brushSize={brushSize}
          videoOpacity={videoOpacity}
          showHelp={showHelp}
          onToolChange={setActiveTool}
          onColorChange={setBrushColor}
          onSizeChange={handleSizeChange}
          onOpacityChange={setVideoOpacity}
          onClear={clearCanvas}
          onToggleHelp={handleToggleHelp}
        />
      )}

      {/* Main HUD */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md p-2 rounded-full border border-slate-700 shadow-2xl z-50 transition-all select-none">
        <div className="flex items-center gap-2 px-3 border-r border-slate-700">
          <span className="text-sky-400 font-bold tracking-wider flex items-center gap-2">
            <Palette size={18} /> AirDraw
          </span>
        </div>

        {!isCameraActive ? (
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all bg-slate-700 hover:bg-slate-600 text-white shadow-lg hover:shadow-slate-500/25 border border-slate-600"
          >
            <CameraIcon size={18} />
            Enable Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 shadow-lg"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Stop Camera
          </button>
        )}

        <button
          data-clickable="true"
          onClick={clearCanvas}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors"
          title="Clear Canvas"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Status Indicators */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-40 select-none">
        {debugInfo && (
          <div className="bg-slate-900/60 backdrop-blur-sm p-2 rounded-xl border border-slate-700 text-xs font-mono text-cyan-400">
            {debugInfo}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className={`absolute bottom-6 right-6 max-w-xs bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700 text-sm text-slate-300 z-40 transition-opacity duration-300 select-none ${showHelp ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h3 className="flex items-center gap-2 font-semibold text-white mb-2">
          <Info size={16} /> How to Draw
        </h3>
        <ul className="space-y-2 list-disc pl-4 text-xs">
          <li>Hold your hand(s) up to the camera.</li>
          <li><strong>Open Hand:</strong> Moves the cursor (Hover).</li>
          <li><strong>Index Finger Only:</strong> Draws lines.</li>
          <li><strong>Both Hands:</strong> Draw simultaneously! 🙌</li>
          <li><strong>Interact:</strong> "Draw" over buttons to click.</li>
        </ul>
      </div>

    </div>
  );
};

export default App;