import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, Trash2, Camera as CameraIcon, Info } from 'lucide-react';
import { HandTrackingService } from './services/mediaPipe';
import CanvasLayer from './components/CanvasLayer';
import Toolbar, { COLORS, SIZES } from './components/Toolbar';
import { DrawPath, Point, CameraQuality } from './types';
import { Results } from '@mediapipe/hands';
import { processMultipleHands, calculateLayoutMetrics, LayoutMetrics } from './utils/handProcessor';
import { Settings, X as CloseIcon } from 'lucide-react';

const CAMERA_QUALITIES: CameraQuality[] = [
  { id: '360p', label: '360p (Low)', width: 640, height: 360 },
  { id: '720p', label: '720p (Medium)', width: 1280, height: 720 },
  { id: '1080p', label: '1080p (High)', width: 1920, height: 1080 },
];

const App: React.FC = () => {
  // --- State ---
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraQuality, setCameraQuality] = useState<CameraQuality>(CAMERA_QUALITIES[1]); // Default 720p
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Multi-hand state (Index 0 = Hand 1, Index 1 = Hand 2)
  const cursorPositionsRef = useRef<(Point | null)[]>([null, null]);
  const isDrawingHandsRef = useRef<boolean[]>([false, false]);

  const [paths, setPaths] = useState<DrawPath[]>([]);
  const debugInfoRef = useRef<HTMLDivElement>(null);

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

  const handleToggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  const [videoOpacity, setVideoOpacity] = useState(0.25); // Default 25% opacity

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  // ⚡ OPTIMIZATION: Cache video dimensions to avoid layout thrashing during frame processing
  const videoDimensionsRef = useRef({ width: 0, height: 0 });
  // ⚡ OPTIMIZATION: Memoize layout metrics to avoid recalculation per frame (60fps)
  const layoutMetricsRef = useRef<LayoutMetrics | null>(null);
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

  // ⚡ OPTIMIZATION: Update layout metrics when dimensions change, avoiding loop-invariant calculation
  useEffect(() => {
    layoutMetricsRef.current = calculateLayoutMetrics(dimensions, videoDimensionsRef.current);
  }, [dimensions]);

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

  // Close Settings on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSettingsOpen) return;

      // Ignore if modifier keys are pressed (Ctrl, Alt, Meta) to avoid conflicting with browser shortcuts
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key.toLowerCase();

      switch (key) {
        case 'p':
          setActiveTool('pencil');
          break;
        case 'e':
          setActiveTool('eraser');
          break;
        case 'h':
          handleToggleHelp();
          break;
        case '[': {
          const currentIndex = SIZES.indexOf(brushSize);
          if (currentIndex > 0) {
            handleSizeChange(SIZES[currentIndex - 1]);
          }
          break;
        }
        case ']': {
          const currentIndex = SIZES.indexOf(brushSize);
          if (currentIndex < SIZES.length - 1) {
            handleSizeChange(SIZES[currentIndex + 1]);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, brushSize, handleSizeChange, handleToggleHelp]);

  // Process MediaPipe Results
  const onResults = useCallback((results: Results) => {
    const dims = dimensionsRef.current;
    const isHelpVisible = showHelpRef.current;

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      cursorPositionsRef.current[0] = null;
      cursorPositionsRef.current[1] = null;
      isDrawingHandsRef.current[0] = false;
      isDrawingHandsRef.current[1] = false;

      // Clear current paths if hands are lost during drawing?
      // Or just keep them suspended? Existing logic cleared tracking but not paths explicitly.
      // Let's keep existing behavior but reset histories.

      if (frameCountRef.current % 10 === 0 && debugInfoRef.current) {
        debugInfoRef.current.textContent = 'No hands detected';
        debugInfoRef.current.style.display = 'block';
      }
      frameCountRef.current++;
      lastCursorPositions.current = [null, null];
      gestureHistories.current = [[], []];
      return;
    }

    // Capture previous drawing state for Hand 0 (Rising edge detection)
    const wasDrawingHand0 = isDrawingHandsRef.current[0];

    // Process all detected hands
    // ⚡ OPTIMIZATION: Pass refs to be updated in-place to avoid GC pressure
    processMultipleHands(
      results.multiHandLandmarks,
      dims,
      layoutMetricsRef.current,
      lastCursorPositions,
      gestureHistories,
      GESTURE_HISTORY_SIZE,
      cursorPositionsRef.current,
      isDrawingHandsRef.current
    );

    // --- Drawing Logic Optimized (Moved from useEffect to reduce re-renders) ---
    const newCurrentPaths = [...currentPathsRef.current];
    let pathsUpdated = false;

    for (let i = 0; i < 2; i++) {
        const isDrawing = isDrawingHandsRef.current[i];
        const pos = cursorPositionsRef.current[i];
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
    }
    // -------------------------------------------------------------------------

    // cursorPositionsRef and isDrawingHandsRef are already updated in place

    // Update debug info every 10 frames
    if (frameCountRef.current % 10 === 0 && debugInfoRef.current) {
      const handCount = results.multiHandLandmarks.length;
      const drawingCount = isDrawingHandsRef.current.filter(d => d).length;
      debugInfoRef.current.textContent = `${handCount} hand${handCount !== 1 ? 's' : ''} | ${drawingCount} drawing`;
      debugInfoRef.current.style.display = 'block';
    }
    frameCountRef.current++;

    // Simple UI interaction for first hand only (to avoid conflicts)
    const firstPos = cursorPositionsRef.current[0];
    if (firstPos) {
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
      // ⚡ OPTIMIZATION: Only query DOM on the "mousedown" event (rising edge of pinch)
      // This avoids running expensive elementFromPoint checks (layout thrashing) on every frame of a stroke
      const isDrawingHand0 = isDrawingHandsRef.current[0];

      if (isDrawingHand0 && !wasDrawingHand0 && !clickCooldown.current) {
        const element = document.elementFromPoint(firstPos.x, firstPos.y);
        const isClickable = element?.getAttribute('data-clickable') === 'true';

        if (isClickable) {
          (element as HTMLElement).click();
          clickCooldown.current = true;
          setTimeout(() => { clickCooldown.current = false; }, 500);
        }
      }
    }

  }, []);

  // Initialize Camera & Tracking
  const startCamera = useCallback(async () => {
    if (videoRef.current && !handTrackingService.current) {
      handTrackingService.current = new HandTrackingService(onResults);
      handTrackingService.current.start(videoRef.current, cameraQuality.width, cameraQuality.height);
      setIsCameraActive(true);
    }
  }, [onResults, cameraQuality]);

  const handleQualityChange = useCallback(async (newQuality: CameraQuality) => {
    setCameraQuality(newQuality);
    if (isCameraActive) {
      // Restart camera with new constraints
      if (handTrackingService.current) {
        handTrackingService.current.stop();
        handTrackingService.current = null;
      }
      
      // Short delay to ensure hardware is released
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) {
        handTrackingService.current = new HandTrackingService(onResults);
        handTrackingService.current.start(videoRef.current, newQuality.width, newQuality.height);
      }
    }
  }, [isCameraActive, onResults]);

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
    cursorPositionsRef.current = [null, null];
    isDrawingHandsRef.current = [false, false];
  }, []);


  const clearCanvas = useCallback(() => {
    setPaths([]);
    currentPathsRef.current = [null, null];
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-slate-900 overflow-hidden" ref={containerRef}>

      {/* Background Video Feed (Mirrored) */}
      <video
        ref={videoRef}
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isCameraActive ? 'block' : 'hidden'}`}
        style={{ opacity: videoOpacity }}
        onLoadedMetadata={(e) => {
          const video = e.currentTarget;
          videoDimensionsRef.current = { width: video.videoWidth, height: video.videoHeight };
          layoutMetricsRef.current = calculateLayoutMetrics(dimensions, videoDimensionsRef.current);
        }}
      />

      {/* Drawing Overlay */}
      <CanvasLayer
        paths={paths}
        currentPathsRef={currentPathsRef}
        cursorPositionsRef={cursorPositionsRef}
        isDrawingHandsRef={isDrawingHandsRef}
        width={dimensions.width}
        height={dimensions.height}
        activeTool={activeTool}
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
        <div className="flex items-center gap-3 px-3 border-r border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-bold tracking-wider flex items-center gap-2">
              <Palette size={18} /> AirDraw
            </span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded-md hover:bg-slate-800/50 cursor-pointer"
              title="Settings (Mouse Only)"
              aria-label="Open settings"
            >
              <Settings size={14} />
            </button>
          </div>
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
          aria-label="Clear canvas"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Status Indicators */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-40 select-none">
        <div
          ref={debugInfoRef}
          className="bg-slate-900/60 backdrop-blur-sm p-2 rounded-xl border border-slate-700 text-xs font-mono text-cyan-400"
          style={{ display: 'none' }}
        />
      </div>

      {/* Instructions */}
      <div
        aria-hidden={!showHelp}
        className={`absolute bottom-6 right-6 max-w-xs bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700 text-sm text-slate-300 z-40 transition-opacity duration-300 select-none ${showHelp ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsSettingsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 id="settings-title" className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="text-sky-400" size={24} /> Settings
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                aria-label="Close settings"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Camera Quality
                </label>
                <div className="grid gap-2">
                  {CAMERA_QUALITIES.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleQualityChange(q)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        cameraQuality.id === q.id
                          ? 'bg-sky-500/10 border-sky-500/50 text-sky-400 ring-1 ring-sky-500/50'
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-semibold">{q.label}</div>
                        <div className="text-xs opacity-60">{q.width} × {q.height}</div>
                      </div>
                      {cameraQuality.id === q.id && (
                        <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Higher quality requires more processing power and may affect performance.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-full shadow-lg shadow-sky-500/20 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;