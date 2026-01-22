import React, { useState } from 'react';
import { Pencil, Eraser, Palette, Circle, Droplets, Trash2, Check, X, HelpCircle } from 'lucide-react';

interface ToolbarProps {
    activeTool: 'pencil' | 'eraser';
    brushColor: string;
    brushSize: number;
    videoOpacity: number;
    showHelp: boolean;
    onToolChange: (tool: 'pencil' | 'eraser') => void;
    onColorChange: (color: string) => void;
    onSizeChange: (size: number) => void;
    onOpacityChange: (opacity: number) => void;
    onClear: () => void;
    onToggleHelp: () => void;
}

export const COLORS = [
    '#ef4444', // Red 500
    '#f97316', // Orange 500
    '#fde047', // Yellow 300
    '#a3e635', // Lime 400
    '#22c55e', // Green 500
    '#38bdf8', // Sky 400
    '#3b82f6', // Blue 500
    '#a855f7', // Purple 500
    '#f472b6', // Pink 400
    '#ffffff', // White
];

const COLOR_LABELS: Record<string, string> = {
    '#ef4444': 'Red',
    '#f97316': 'Orange',
    '#fde047': 'Yellow',
    '#a3e635': 'Lime',
    '#22c55e': 'Green',
    '#38bdf8': 'Sky Blue',
    '#3b82f6': 'Blue',
    '#a855f7': 'Purple',
    '#f472b6': 'Pink',
    '#ffffff': 'White',
};

export const SIZES = [2, 4, 8, 12, 16, 24, 32, 48, 64];
export const OPACITIES = [0, 0.25, 0.5, 0.75, 1.0];

const Toolbar: React.FC<ToolbarProps> = ({
    activeTool,
    brushColor,
    brushSize,
    videoOpacity,
    showHelp,
    onToolChange,
    onColorChange,
    onSizeChange,
    onOpacityChange,
    onClear,
    onToggleHelp,
}) => {
    const [activeMenu, setActiveMenu] = useState<'colors' | 'sizes' | 'opacity' | 'clear' | null>(null);

    const toggleMenu = (menu: 'colors' | 'sizes' | 'opacity' | 'clear') => {
        setActiveMenu(prev => prev === menu ? null : menu);
    };

    return (
        <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex items-start gap-3 z-50 select-none">

            {/* Main Toolbar Strip */}
            <div className="flex flex-col gap-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-2xl">

                {/* Tools */}
                <button
                    data-clickable="true"
                    onClick={() => { onToolChange('pencil'); setActiveMenu(null); }}
                    className={`p-3 rounded-xl transition-all ${activeTool === 'pencil' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    title="Pencil"
                    aria-label="Select pencil tool"
                >
                    <Pencil size={24} />
                </button>

                <button
                    data-clickable="true"
                    onClick={() => { onToolChange('eraser'); setActiveMenu(null); }}
                    className={`p-3 rounded-xl transition-all ${activeTool === 'eraser' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    title="Eraser"
                    aria-label="Select eraser tool"
                >
                    <Eraser size={24} />
                </button>

                <div className="h-px w-full bg-slate-700 my-1" />

                {/* Menu Toggles */}

                {/* Color Menu Toggle */}
                <button
                    data-clickable="true"
                    onClick={() => toggleMenu('colors')}
                    className={`p-3 rounded-xl transition-all ${activeMenu === 'colors' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    title="Colors"
                    aria-label="Open color menu"
                >
                    <Palette size={24} style={{ color: activeTool === 'pencil' ? brushColor : undefined }} />
                </button>

                {/* Size Menu Toggle */}
                <button
                    data-clickable="true"
                    onClick={() => toggleMenu('sizes')}
                    className={`p-3 rounded-xl transition-all flex items-center justify-center ${activeMenu === 'sizes' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    title="Brush Size"
                    aria-label="Open brush size menu"
                >
                    <Circle size={24} fill="currentColor" className="opacity-50" style={{ transform: `scale(${Math.min(1, Math.max(0.4, brushSize / 24))})` }} />
                </button>

                {/* Opacity Menu Toggle */}
                <button
                    data-clickable="true"
                    onClick={() => toggleMenu('opacity')}
                    className={`p-3 rounded-xl transition-all ${activeMenu === 'opacity' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    title="Camera Opacity"
                    aria-label="Open camera opacity menu"
                >
                    <Droplets size={24} />
                </button>

                <div className="h-px w-full bg-slate-700 my-1" />

                {/* Clear Menu Toggle */}
                <button
                    data-clickable="true"
                    onClick={() => toggleMenu('clear')}
                    className={`p-3 rounded-xl transition-all ${activeMenu === 'clear' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    title="Clear Canvas"
                    aria-label="Open clear canvas menu"
                >
                    <Trash2 size={24} />
                </button>

                {/* Help Toggle */}
                <button
                    data-clickable="true"
                    onClick={onToggleHelp}
                    className={`p-3 rounded-xl transition-all ${showHelp ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    title="Toggle Help"
                    aria-label="Toggle help instructions"
                >
                    <HelpCircle size={24} />
                </button>

            </div>

            {/* Flyout Menus */}
            {activeMenu && (
                <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-200">

                    {/* Colors Flyout */}
                    {activeMenu === 'colors' && (
                        <div className="grid grid-cols-2 gap-3 w-32" role="group" aria-label="Color selection">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    data-clickable="true"
                                    onClick={() => { onColorChange(color); setActiveMenu(null); }}
                                    className={`w-14 h-14 rounded-xl border-2 transition-all ${brushColor === color ? 'border-white scale-105 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                    style={{ backgroundColor: color }}
                                    title={COLOR_LABELS[color] || color}
                                    aria-label={`Select ${COLOR_LABELS[color] || color} color`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Sizes Flyout */}
                    {activeMenu === 'sizes' && (
                        <div className="grid grid-cols-2 gap-3 w-48 items-center justify-items-center" role="group" aria-label="Brush size selection">
                            {SIZES.map(size => (
                                <button
                                    key={size}
                                    data-clickable="true"
                                    onClick={() => { onSizeChange(size); setActiveMenu(null); }}
                                    className={`p-2 rounded-full bg-slate-200 transition-all flex items-center justify-center ${brushSize === size ? 'bg-white scale-110 shadow-lg ring-2 ring-sky-500' : 'bg-slate-500 hover:bg-slate-400'}`}
                                    title={`${size}px`}
                                    aria-label={`Set brush size to ${size} pixels`}
                                >
                                    <div style={{ width: size, height: size, backgroundColor: 'black', borderRadius: '50%' }} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Opacity Flyout */}
                    {activeMenu === 'opacity' && (
                        <div className="flex flex-col gap-3 w-24" role="group" aria-label="Camera opacity selection">
                            {OPACITIES.map(opacity => (
                                <button
                                    key={opacity}
                                    data-clickable="true"
                                    onClick={() => { onOpacityChange(opacity); setActiveMenu(null); }}
                                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${videoOpacity === opacity ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                    aria-label={`Set camera opacity to ${opacity * 100}%`}
                                >
                                    {opacity * 100}%
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Clear Confirmation Flyout */}
                    {activeMenu === 'clear' && (
                        <div className="flex flex-col gap-3 w-32" role="alertdialog" aria-labelledby="clear-dialog-title">
                            <div id="clear-dialog-title" className="text-slate-300 text-sm font-medium text-center mb-1">
                                Clear Canvas?
                            </div>
                            <button
                                data-clickable="true"
                                onClick={() => { onClear(); setActiveMenu(null); }}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/25 transition-all"
                                aria-label="Confirm clear canvas"
                            >
                                <Check size={18} /> Yes
                            </button>
                            <button
                                data-clickable="true"
                                onClick={() => setActiveMenu(null)}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-all"
                                aria-label="Cancel clear canvas"
                            >
                                <X size={18} /> No
                            </button>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
};

export default React.memo(Toolbar);
