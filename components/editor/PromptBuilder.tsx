'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, X, GripVertical, Sparkles, Sliders } from 'lucide-react';

export interface PromptModifier {
  id: string;
  type: 'lighting' | 'color' | 'mood' | 'technical' | 'custom';
  instruction: string;
  intensity: number; // 0-100
}

export interface ComposedPrompt {
  basePrompt: string;
  modifiers: PromptModifier[];
}

interface PromptBuilderProps {
  value: ComposedPrompt;
  onChange: (prompt: ComposedPrompt) => void;
  onGenerate: (finalPrompt: string) => void;
  disabled?: boolean;
}

const MODIFIER_SUGGESTIONS: Record<string, string[]> = {
  lighting: [
    'golden hour glow',
    'dramatic shadows',
    'soft diffused light',
    'studio lighting',
    'natural sunlight',
    'moody low-key',
    'bright high-key',
    'rim lighting',
  ],
  color: [
    'warmer tones',
    'cooler tones',
    'vibrant saturation',
    'muted colors',
    'teal and orange',
    'monochromatic',
    'pastel tones',
    'deep rich colors',
  ],
  mood: [
    'dreamy atmosphere',
    'dramatic tension',
    'peaceful calm',
    'energetic vibe',
    'mysterious ambiance',
    'nostalgic feeling',
    'modern aesthetic',
    'vintage character',
  ],
  technical: [
    'increase sharpness',
    'add subtle vignette',
    'boost contrast',
    'enhance details',
    'smooth skin tones',
    'reduce noise',
    'increase clarity',
    'add film grain',
  ],
};

/**
 * Advanced Prompt Builder
 *
 * Features:
 * - Stack multiple modifiers
 * - Adjust intensity per modifier
 * - Reorder modifiers (affects final result)
 * - Quick suggestions per category
 * - Real-time preview of final prompt
 */
export function PromptBuilder({
  value,
  onChange,
  onGenerate,
  disabled = false,
}: PromptBuilderProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof MODIFIER_SUGGESTIONS>('lighting');

  // Add new modifier
  const addModifier = (instruction: string, type: string) => {
    const newModifier: PromptModifier = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      instruction,
      intensity: 80, // Default intensity
    };

    onChange({
      ...value,
      modifiers: [...value.modifiers, newModifier],
    });

    console.log('[PromptBuilder] Added modifier:', newModifier);
  };

  // Remove modifier
  const removeModifier = (id: string) => {
    onChange({
      ...value,
      modifiers: value.modifiers.filter(m => m.id !== id),
    });
  };

  // Update modifier intensity
  const updateIntensity = (id: string, intensity: number) => {
    onChange({
      ...value,
      modifiers: value.modifiers.map(m =>
        m.id === id ? { ...m, intensity } : m
      ),
    });
  };

  // Reorder modifiers
  const reorderModifiers = (newOrder: PromptModifier[]) => {
    onChange({
      ...value,
      modifiers: newOrder,
    });
  };

  // Build final prompt
  const buildFinalPrompt = (): string => {
    const base = value.basePrompt;

    if (value.modifiers.length === 0) {
      return base;
    }

    const modifierTexts = value.modifiers.map(m => {
      // Adjust wording based on intensity
      let intensityPrefix = '';
      if (m.intensity >= 90) intensityPrefix = 'very ';
      else if (m.intensity >= 70) intensityPrefix = '';
      else if (m.intensity >= 40) intensityPrefix = 'slightly ';
      else if (m.intensity >= 20) intensityPrefix = 'subtly ';
      else intensityPrefix = 'barely ';

      return `${intensityPrefix}${m.instruction}`;
    });

    return `${base}, ${modifierTexts.join(', ')}`;
  };

  const finalPrompt = buildFinalPrompt();

  return (
    <div className="space-y-4">
      {/* Base Prompt */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Base Style
        </label>
        <input
          type="text"
          value={value.basePrompt}
          onChange={(e) => onChange({ ...value, basePrompt: e.target.value })}
          placeholder="e.g., make it cinematic, professional look, vintage film..."
          className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
      </div>

      {/* Modifiers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-white/80">
            Modifiers ({value.modifiers.length})
          </label>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
            disabled={disabled}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Modifier List (Reorderable) */}
        {value.modifiers.length > 0 && (
          <Reorder.Group
            axis="y"
            values={value.modifiers}
            onReorder={reorderModifiers}
            className="space-y-2"
          >
            {value.modifiers.map((modifier) => (
              <Reorder.Item
                key={modifier.id}
                value={modifier}
                className="bg-white/5 rounded-xl p-3"
              >
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing pt-1 text-white/40">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Modifier Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">
                        {modifier.instruction}
                      </span>
                      <button
                        onClick={() => removeModifier(modifier.id)}
                        className="text-white/40 hover:text-white/80 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Intensity Slider */}
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-white/40" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={modifier.intensity}
                        onChange={(e) => updateIntensity(modifier.id, parseInt(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, rgba(59,130,246,0.8) 0%, rgba(59,130,246,0.8) ${modifier.intensity}%, rgba(255,255,255,0.2) ${modifier.intensity}%)`
                        }}
                      />
                      <span className="text-white/60 text-xs w-8">{modifier.intensity}%</span>
                    </div>

                    {/* Type Badge */}
                    <div className="inline-block px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/60">
                      {modifier.type}
                    </div>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}

        {value.modifiers.length === 0 && (
          <div className="text-center py-6 text-white/40 text-sm">
            No modifiers yet. Add some to fine-tune your style.
          </div>
        )}
      </div>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {Object.keys(MODIFIER_SUGGESTIONS).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category as any)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap
                      ${selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }
                    `}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-2 gap-2">
                {MODIFIER_SUGGESTIONS[selectedCategory].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      addModifier(suggestion, selectedCategory);
                      setShowSuggestions(false);
                    }}
                    className="text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final Prompt Preview */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-white/60 mb-1">Final Prompt</p>
            <p className="text-white text-sm leading-relaxed">
              {finalPrompt || 'Your composed prompt will appear here...'}
            </p>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={() => onGenerate(finalPrompt)}
        disabled={disabled || !finalPrompt.trim()}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        Generate with Composed Prompt
      </button>

      {/* Tips */}
      <div className="text-xs text-white/40 text-center">
        💡 Tip: Drag modifiers to reorder • Higher intensity = stronger effect
      </div>
    </div>
  );
}
