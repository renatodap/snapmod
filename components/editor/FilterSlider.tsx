'use client';

import { motion } from 'framer-motion';

interface FilterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  unit?: string;
}

/**
 * FilterSlider - Beautiful slider for filter adjustments
 *
 * Features:
 * - Smooth animations
 * - Center marker for zero point
 * - Visual value indicator
 * - Touch-optimized
 * - Mobile-first design
 */
export function FilterSlider({
  label,
  value,
  min,
  max,
  onChange,
  disabled = false,
  unit = ''
}: FilterSliderProps) {
  // Calculate percentage for gradient
  const percentage = ((value - min) / (max - min)) * 100;
  const isNegative = value < 0;
  const isPositive = value > 0;

  // Format value display
  const displayValue = value > 0 ? `+${value}` : `${value}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/80">
          {label}
        </label>
        <motion.span
          key={value}
          initial={{ scale: 1.2, color: 'rgb(59, 130, 246)' }}
          animate={{ scale: 1, color: 'rgba(255, 255, 255, 0.6)' }}
          transition={{ duration: 0.2 }}
          className="text-sm font-mono tabular-nums"
        >
          {displayValue}{unit}
        </motion.span>
      </div>

      {/* Slider Track */}
      <div className="relative h-10 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="slider-input w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right,
              ${isNegative ? 'rgb(239, 68, 68)' : 'rgba(255,255,255,0.1)'} 0%,
              ${isNegative ? 'rgb(239, 68, 68)' : 'rgba(255,255,255,0.1)'} ${Math.min(percentage, 50)}%,
              ${percentage > 50 ? 'rgb(59, 130, 246)' : 'rgba(255,255,255,0.1)'} ${Math.max(percentage, 50)}%,
              ${isPositive ? 'rgb(59, 130, 246)' : 'rgba(255,255,255,0.1)'} ${percentage}%,
              rgba(255,255,255,0.1) ${percentage}%,
              rgba(255,255,255,0.1) 100%
            )`
          }}
        />

        {/* Center marker (for ranges that include 0) */}
        {min < 0 && max > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white/30 pointer-events-none"
            style={{ left: '50%' }}
          />
        )}

        {/* Value indicator */}
        {value !== 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className={`absolute -top-8 px-2 py-1 rounded-md text-xs font-bold ${
              isNegative ? 'bg-red-500' : 'bg-blue-500'
            } text-white pointer-events-none`}
            style={{
              left: `${percentage}%`,
              transform: 'translateX(-50%)'
            }}
          >
            {displayValue}
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .slider-input::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s ease;
        }

        .slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .slider-input::-webkit-slider-thumb:active {
          transform: scale(1.4);
        }

        .slider-input::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s ease;
        }

        .slider-input::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        .slider-input::-moz-range-thumb:active {
          transform: scale(1.4);
        }

        .slider-input:disabled::-webkit-slider-thumb {
          background: rgba(255, 255, 255, 0.5);
          cursor: not-allowed;
        }

        .slider-input:disabled::-moz-range-thumb {
          background: rgba(255, 255, 255, 0.5);
          cursor: not-allowed;
        }
      `}</style>
    </motion.div>
  );
}
