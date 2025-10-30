'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Save, Sparkles, ChevronDown } from 'lucide-react';
import { FilterSlider } from './FilterSlider';
import { hasActiveFilters, resetFilters } from '@/lib/image-filters';
import type { FilterState } from '@/lib/types/filters';
import { FILTER_RANGES, FILTER_GROUPS } from '@/lib/types/filters';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSaveVersion: () => void;
  onUseForAI: () => void;
  disabled?: boolean;
}

/**
 * FilterPanel - Main filter control panel
 *
 * Features:
 * - Organized into collapsible sections
 * - Real-time preview
 * - Reset all filters
 * - Save as version or use for AI
 * - Beautiful mobile-first UI
 */
export function FilterPanel({
  filters,
  onFiltersChange,
  onSaveVersion,
  onUseForAI,
  disabled = false
}: FilterPanelProps) {
  const hasChanges = hasActiveFilters(filters);

  const updateFilter = (key: keyof FilterState, value: number) => {
    console.log('[FilterPanel] Update:', key, '=', value);
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    console.log('[FilterPanel] Reset all filters');
    onFiltersChange(resetFilters());
  };

  const handleSave = () => {
    console.log('[FilterPanel] Save version');
    onSaveVersion();
  };

  const handleUseForAI = () => {
    console.log('[FilterPanel] Use for AI');
    onUseForAI();
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black/98 to-black/95 pt-4 pb-safe max-h-[75vh] overflow-hidden flex flex-col"
    >
      {/* Drag Handle */}
      <div className="flex justify-center pb-2">
        <div className="w-12 h-1 bg-white/20 rounded-full" />
      </div>

      {/* Header */}
      <div className="px-4 pb-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Filters</h3>
            <p className="text-xs text-white/50">Unlimited • No AI cost</p>
          </div>
        </div>

        {hasChanges && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleReset}
            disabled={disabled}
            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 active:scale-95 transition disabled:opacity-30"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </motion.button>
        )}
      </div>

      {/* Scrollable Filter Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
        {FILTER_GROUPS.map((group) => (
          <div key={group.category} className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider">
                {group.label}
              </h4>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Sliders */}
            {group.filters.map((filterKey) => {
              const range = FILTER_RANGES[filterKey];
              return (
                <FilterSlider
                  key={filterKey}
                  label={filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
                  value={filters[filterKey]}
                  min={range.min}
                  max={range.max}
                  onChange={(value) => updateFilter(filterKey, value)}
                  disabled={disabled}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="px-4 pt-4 pb-4 space-y-2 border-t border-white/10 bg-black">
        <AnimatePresence>
          {hasChanges ? (
            <>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleSave}
                disabled={disabled}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 active:scale-98 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save as Version
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.05 }}
                onClick={handleUseForAI}
                disabled={disabled}
                className="w-full bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 active:scale-98 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Use for AI Edit →
              </motion.button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 text-white/40 text-sm"
            >
              Adjust filters above to get started
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
}
