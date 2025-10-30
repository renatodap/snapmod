'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MoveHorizontal, Grid2x2, Zap, Layers } from 'lucide-react';

interface ComparisonModesProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  onClose: () => void;
}

type ComparisonMode = 'slider' | 'sidebyside' | 'flicker' | 'onion';

/**
 * Enhanced Comparison Modes
 *
 * Features:
 * - Slider: Draggable vertical split (original)
 * - Side-by-side: Two images next to each other
 * - Flicker: Tap to toggle between before/after
 * - Onion skin: Overlay with opacity control
 */
export function ComparisonModes({
  beforeImage,
  afterImage,
  beforeLabel = 'Original',
  afterLabel = 'Edited',
  onClose
}: ComparisonModesProps) {
  const [mode, setMode] = useState<ComparisonMode>('slider');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [flickerState, setFlickerState] = useState<'before' | 'after'>('before');
  const [onionOpacity, setOnionOpacity] = useState(50);

  console.log('[ComparisonModes] Mode:', mode);

  // Handle slider drag
  const handleSliderDrag = (_event: any, info: any) => {
    const percentage = (info.point.x / window.innerWidth) * 100;
    const clampedPosition = Math.max(0, Math.min(100, percentage));
    setSliderPosition(clampedPosition);
  };

  // Flicker toggle
  const handleFlickerToggle = () => {
    setFlickerState(prev => prev === 'before' ? 'after' : 'before');
  };

  // Auto-flicker on spacebar (desktop)
  useEffect(() => {
    if (mode !== 'flicker') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setFlickerState('after');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setFlickerState('before');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Header with Mode Selector */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 to-transparent p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Compare</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition p-2"
            aria-label="Close comparison"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <ModeButton
            icon={MoveHorizontal}
            label="Slider"
            active={mode === 'slider'}
            onClick={() => setMode('slider')}
          />
          <ModeButton
            icon={Grid2x2}
            label="Side by Side"
            active={mode === 'sidebyside'}
            onClick={() => setMode('sidebyside')}
          />
          <ModeButton
            icon={Zap}
            label="Flicker"
            active={mode === 'flicker'}
            onClick={() => setMode('flicker')}
          />
          <ModeButton
            icon={Layers}
            label="Overlay"
            active={mode === 'onion'}
            onClick={() => setMode('onion')}
          />
        </div>
      </div>

      {/* Comparison Content */}
      <div className="relative w-full h-full pt-32 pb-20">
        <AnimatePresence mode="wait">
          {/* SLIDER MODE */}
          {mode === 'slider' && (
            <motion.div
              key="slider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full"
            >
              {/* After Image (Full) */}
              <div className="absolute inset-0">
                <img
                  src={afterImage}
                  alt={afterLabel}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {afterLabel}
                </div>
              </div>

              {/* Before Image (Clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={beforeImage}
                  alt={beforeLabel}
                  className="w-full h-full object-contain"
                  style={{ width: `${(100 / sliderPosition) * 100}%` }}
                />
                {sliderPosition > 20 && (
                  <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                    {beforeLabel}
                  </div>
                )}
              </div>

              {/* Slider Handle */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: window.innerWidth }}
                dragElastic={0}
                dragMomentum={false}
                onDrag={handleSliderDrag}
                className="absolute top-0 bottom-0 cursor-ew-resize touch-none"
                style={{
                  left: `${sliderPosition}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="absolute top-0 bottom-0 w-0.5 bg-white/80" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center">
                  <MoveHorizontal className="w-6 h-6 text-gray-800" />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* SIDE-BY-SIDE MODE */}
          {mode === 'sidebyside' && (
            <motion.div
              key="sidebyside"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-1 h-full"
            >
              <div className="flex-1 relative">
                <img
                  src={beforeImage}
                  alt={beforeLabel}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                  {beforeLabel}
                </div>
              </div>
              <div className="flex-1 relative">
                <img
                  src={afterImage}
                  alt={afterLabel}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {afterLabel}
                </div>
              </div>
            </motion.div>
          )}

          {/* FLICKER MODE */}
          {mode === 'flicker' && (
            <motion.div
              key="flicker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full cursor-pointer"
              onClick={handleFlickerToggle}
              onMouseDown={() => setFlickerState('after')}
              onMouseUp={() => setFlickerState('before')}
              onTouchStart={() => setFlickerState('after')}
              onTouchEnd={() => setFlickerState('before')}
            >
              <AnimatePresence mode="wait">
                {flickerState === 'before' ? (
                  <motion.div
                    key="before"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="absolute inset-0"
                  >
                    <img
                      src={beforeImage}
                      alt={beforeLabel}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                      {beforeLabel}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="after"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="absolute inset-0"
                  >
                    <img
                      src={afterImage}
                      alt={afterLabel}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {afterLabel}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                Hold to view {flickerState === 'before' ? 'edited' : 'original'}
              </div>
            </motion.div>
          )}

          {/* ONION SKIN MODE */}
          {mode === 'onion' && (
            <motion.div
              key="onion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full"
            >
              {/* Before Image (Base) */}
              <div className="absolute inset-0">
                <img
                  src={beforeImage}
                  alt={beforeLabel}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                  {beforeLabel}
                </div>
              </div>

              {/* After Image (Overlay with opacity) */}
              <div
                className="absolute inset-0"
                style={{ opacity: onionOpacity / 100 }}
              >
                <img
                  src={afterImage}
                  alt={afterLabel}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {afterLabel}
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-64 bg-black/60 backdrop-blur-sm rounded-full p-4">
                <div className="flex items-center gap-3">
                  <span className="text-white/60 text-sm">Blend</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={onionOpacity}
                    onChange={(e) => setOnionOpacity(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(59,130,246,0.8) ${onionOpacity}%, rgba(255,255,255,0.2) ${onionOpacity}%)`
                    }}
                  />
                  <span className="text-white/60 text-sm w-8">{onionOpacity}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mode-specific instructions */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-white/40 text-sm">
        {mode === 'slider' && 'Drag slider to compare'}
        {mode === 'sidebyside' && 'Pinch to zoom (coming soon)'}
        {mode === 'flicker' && 'Tap or hold to toggle • Press Space on desktop'}
        {mode === 'onion' && 'Adjust blend to see differences'}
      </div>
    </motion.div>
  );
}

// Mode button component
function ModeButton({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl transition whitespace-nowrap
        ${active
          ? 'bg-blue-500 text-white'
          : 'bg-white/10 text-white/60 hover:bg-white/20'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
