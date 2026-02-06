
const CURSOR_COLORS = [
  { hover: '#38bdf8', drawing: '#f472b6' }, // Hand 1: Sky blue / Pink
  { hover: '#a3e635', drawing: '#fb923c' }, // Hand 2: Lime / Orange
];

const cache = new Map<string, HTMLCanvasElement>();

/**
 * Returns a cached canvas sprite for the cursor.
 * ⚡ OPTIMIZATION: Caching cursor sprites prevents per-frame vector rasterization overhead (beginPath/arc/stroke)
 * which was consuming ~0.5ms per frame in the main render loop.
 */
export const getCursorSprite = (handIndex: number, isDrawing: boolean, isEraserPreview: boolean): HTMLCanvasElement => {
    // Generate a unique key for the cache
    const key = isEraserPreview ? 'eraser' : `hand-${handIndex}-${isDrawing}`;

    if (cache.has(key)) {
        return cache.get(key)!;
    }

    const size = 32; // Sufficient for 12px radius + stroke + crosshair
    const center = size / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) return canvas; // Should not happen in browser

    if (isEraserPreview) {
        // Eraser Preview
        // Center is transparent to show content underneath

        // Outer White Outline
        ctx.beginPath();
        ctx.arc(center, center, 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner Red Dashed Line
        ctx.beginPath();
        ctx.arc(center, center, 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff0000';
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1;
        ctx.stroke();
    } else {
        // Normal Cursor (Hover or Drawing)
        const colors = CURSOR_COLORS[handIndex] || CURSOR_COLORS[0];
        const color = isDrawing ? colors.drawing : colors.hover;

        ctx.beginPath();
        ctx.arc(center, center, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Target crosshair
        ctx.beginPath();
        // center is 16. crosshair is +/- 4px
        ctx.moveTo(center - 4, center);
        ctx.lineTo(center + 4, center);
        ctx.moveTo(center, center - 4);
        ctx.lineTo(center, center + 4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    cache.set(key, canvas);
    return canvas;
};
