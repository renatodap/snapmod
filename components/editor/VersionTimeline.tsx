'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Version } from '@/lib/version-storage';

interface VersionTimelineProps {
  versions: Version[];
  currentIndex: number;
  originalImage: string;
  onChange: (index: number) => void;
}

/**
 * VersionTimeline - Horizontal scrollable timeline of photo versions
 *
 * Features:
 * - Shows original + all edited versions
 * - Horizontal scroll with snap
 * - Current version highlighted
 * - Swipe/tap to switch versions
 * - Auto-scroll to current version
 *
 * Mobile-First:
 * - Touch-optimized thumbnails (64x64px)
 * - Swipe gestures
 * - Large tap targets
 * - Smooth scroll behavior
 */
export function VersionTimeline({ versions, currentIndex, originalImage, onChange }: VersionTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentThumbnailRef = useRef<HTMLButtonElement>(null);

  const allImages = [originalImage, ...versions.map(v => v.image)];

  console.log('[VersionTimeline] Render:', {
    totalVersions: versions.length,
    currentIndex,
    displayCount: allImages.length
  });

  // Auto-scroll to current version
  useEffect(() => {
    if (currentThumbnailRef.current && scrollRef.current) {
      console.log('[VersionTimeline] Auto-scrolling to current version');
      currentThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentIndex]);

  // Handle version selection
  const handleSelect = (index: number) => {
    console.log('[VersionTimeline] Version selected:', index);
    onChange(index);
  };

  // Only show if there are versions
  if (versions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-28 left-0 right-0 z-30"
    >
      <div className="bg-gradient-to-t from-black/90 to-transparent pt-6 pb-4">
        {/* Timeline */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto px-4 snap-x snap-mandatory scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Original */}
          <button
            ref={currentIndex === -1 ? currentThumbnailRef : undefined}
            onClick={() => handleSelect(-1)}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden relative snap-center touch-manipulation transition-all ${
              currentIndex === -1
                ? 'ring-4 ring-blue-500 scale-110'
                : 'ring-2 ring-white/20 opacity-60 hover:opacity-100'
            }`}
          >
            <img
              src={originalImage}
              alt="Original"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5">
              <span className="text-white text-xs font-medium">Orig</span>
            </div>
          </button>

          {/* Versions */}
          {versions.map((version, index) => (
            <motion.button
              key={version.id}
              ref={currentIndex === index ? currentThumbnailRef : undefined}
              onClick={() => handleSelect(index)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden relative snap-center touch-manipulation transition-all ${
                currentIndex === index
                  ? 'ring-4 ring-blue-500 scale-110'
                  : 'ring-2 ring-white/20 opacity-60 hover:opacity-100 active:scale-95'
              }`}
            >
              <img
                src={version.image}
                alt={`Version ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5">
                <span className="text-white text-xs font-medium">{index + 1}</span>
              </div>

              {/* Prompt preview on hover/long press */}
              <motion.div
                className="absolute inset-0 bg-black/90 p-2 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100"
                whileTap={{ opacity: 1 }}
              >
                <p className="text-white text-xs text-center line-clamp-3">
                  {version.prompt}
                </p>
              </motion.div>
            </motion.button>
          ))}
        </div>

        {/* Timeline Label */}
        <div className="text-center mt-2 text-white/40 text-xs">
          Swipe to browse {versions.length + 1} version{versions.length + 1 > 1 ? 's' : ''}
        </div>
      </div>
    </motion.div>
  );
}
