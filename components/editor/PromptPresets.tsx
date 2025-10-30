'use client';

import { motion } from 'framer-motion';
import { Sparkles, Sun, Film, Briefcase, Palette, Moon, Camera, Flame, Snowflake, Star } from 'lucide-react';

export interface Preset {
  id: string;
  label: string;
  icon: any;
  prompt: string;
  description: string;
  category: 'lighting' | 'style' | 'color' | 'mood';
}

export const PRESET_PROMPTS: Preset[] = [
  {
    id: 'cinematic',
    label: 'Cinematic',
    icon: Film,
    prompt: 'cinematic film look with dramatic lighting and teal orange color grading',
    description: 'Movie-like quality with dramatic tones',
    category: 'style',
  },
  {
    id: 'golden-hour',
    label: 'Golden Hour',
    icon: Sun,
    prompt: 'warm golden hour sunset lighting with soft glow',
    description: 'Warm, soft sunset lighting',
    category: 'lighting',
  },
  {
    id: 'bw-film',
    label: 'B&W Film',
    icon: Camera,
    prompt: 'black and white film photography with high contrast',
    description: 'Classic monochrome look',
    category: 'style',
  },
  {
    id: 'professional',
    label: 'Professional',
    icon: Briefcase,
    prompt: 'professional studio lighting with subtle contrast boost',
    description: 'Clean, professional look',
    category: 'lighting',
  },
  {
    id: 'vibrant',
    label: 'Vibrant',
    icon: Palette,
    prompt: 'vibrant saturated colors with increased clarity',
    description: 'Bold, eye-catching colors',
    category: 'color',
  },
  {
    id: 'moody',
    label: 'Moody',
    icon: Moon,
    prompt: 'dark moody atmospheric lighting with deep shadows',
    description: 'Dark, atmospheric vibes',
    category: 'mood',
  },
  {
    id: 'vintage',
    label: 'Vintage',
    icon: Star,
    prompt: 'vintage film look with grain and faded colors',
    description: 'Retro film aesthetic',
    category: 'style',
  },
  {
    id: 'warm',
    label: 'Warm',
    icon: Flame,
    prompt: 'warm color temperature with cozy lighting',
    description: 'Cozy, inviting warmth',
    category: 'color',
  },
  {
    id: 'cool',
    label: 'Cool',
    icon: Snowflake,
    prompt: 'cool blue tones with crisp clarity',
    description: 'Fresh, clean cool tones',
    category: 'color',
  },
  {
    id: 'hdr',
    label: 'HDR',
    icon: Sparkles,
    prompt: 'enhanced dynamic range with detail in shadows and highlights',
    description: 'Maximum detail and depth',
    category: 'style',
  },
];

interface PromptPresetsProps {
  onSelectPreset: (preset: Preset) => void;
  disabled?: boolean;
}

export function PromptPresets({ onSelectPreset, disabled = false }: PromptPresetsProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-white/80">Quick Styles</h3>
        <span className="text-xs text-white/40">Tap to apply</span>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-5 gap-2">
        {PRESET_PROMPTS.map((preset, index) => {
          const Icon = preset.icon;
          return (
            <motion.button
              key={preset.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                if (!disabled) {
                  onSelectPreset(preset);
                }
              }}
              disabled={disabled}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
              title={preset.description}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-[10px] text-white/70 text-center leading-tight">
                {preset.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Category Legend (optional) */}
      <div className="flex flex-wrap gap-2 px-1">
        <span className="text-[10px] text-white/30">
          💡 Tip: Combine with your own text for custom results
        </span>
      </div>
    </div>
  );
}
