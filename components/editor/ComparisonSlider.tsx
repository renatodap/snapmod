'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MoveHorizontal } from 'lucide-react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  onClose: () => void;
}

/**
 * ComparisonSlider - Before/After image comparison
 *
 * Features:
 * - Vertical split with draggable slider
 * - Pull down gesture to activate
 * - Swipe to close
 * - Labels for before/after
 * - Full-screen overlay
 *
 * Mobile-First:
 * - Touch-optimized slider
 * - Large drag handle
 * - Smooth animations
 * - Haptic feedback (when supported)
 */
export function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Original',
  afterLabel = 'Edited',
  onClose
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  console.log('[ComparisonSlider] Render:', { beforeLabel, afterLabel, sliderPosition });

  // Handle slider drag
  const handleDrag = (_event: any, info: any) => {
    const percentage = (info.point.x / window.innerWidth) * 100;
    const clampedPosition = Math.max(0, Math.min(100, percentage));
    setSliderPosition(clampedPosition);
    console.log('[ComparisonSlider] Slider moved to:', clampedPosition);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(_event, info) => {
        // Swipe down to close
        if (info.velocity.y > 500 || info.offset.y > 100) {
          console.log('[ComparisonSlider] Swipe down detected, closing');
          onClose();
        }
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MoveHorizontal className="w-5 h-5 text-white/60" />
            <h2 className="text-white font-semibold">Compare</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition p-2"
            aria-label="Close comparison"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-white/40 text-sm mt-1">Drag slider to compare</p>
      </div>

      {/* Images Container */}
      <div className="relative w-full h-full">
        {/* After Image (Full) */}
        <div className="absolute inset-0">
          <img
            src={afterImage}
            alt={afterLabel}
            className="w-full h-full object-contain"
          />
          {/* After Label */}
          <div className="absolute top-20 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
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
          {/* Before Label */}
          {sliderPosition > 20 && (
            <div className="absolute top-20 left-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
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
          onDrag={handleDrag}
          className="absolute top-0 bottom-0 cursor-ew-resize touch-none"
          style={{
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)'
          }}
        >
          {/* Vertical Line */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-white/80" />

          {/* Drag Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center">
            <MoveHorizontal className="w-6 h-6 text-gray-800" />
          </div>
        </motion.div>
      </div>

      {/* Bottom Instruction */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-white/40 text-sm">
        Swipe down to close
      </div>
    </motion.div>
  );
}
