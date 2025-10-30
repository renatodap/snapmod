export interface FilterPreset {
  id: string;
  name: string;
  category: 'retro' | 'lighting' | 'color' | 'art' | 'creative';
  prompt: string;
  icon: string;
  description: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  // Retro
  {
    id: '70s-vintage',
    name: '1970s Vintage',
    category: 'retro',
    prompt: 'Transform this into a 1970s vintage photograph. Apply warm peachy tones, kodachrome film color palette, subtle film grain texture, slight vignette, faded highlights, analog camera aesthetic. Make it look authentically shot on 70s film stock.',
    icon: '📷',
    description: 'Warm retro film look'
  },
  {
    id: 'film-camera',
    name: 'Film Camera',
    category: 'retro',
    prompt: 'Convert to analog film photograph style. Add light leaks, chromatic aberration, organic film grain, slightly faded colors, authentic 35mm camera look with imperfect focus and natural color shifts.',
    icon: '🎞️',
    description: 'Classic film aesthetic'
  },

  // Lighting
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    category: 'lighting',
    prompt: 'Transform this photo to look like it was taken during golden hour. Add warm orange-gold sunlight, soft diffused backlighting, gentle natural lens flare, slight haze, dreamy atmosphere, enhanced warmth in highlights.',
    icon: '🌅',
    description: 'Warm sunset glow'
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    category: 'lighting',
    prompt: 'Apply dramatic high contrast look. Deepen shadows significantly, brighten highlights, increase overall contrast, make the image bold and punchy with strong tonal separation.',
    icon: '⚡',
    description: 'Bold dramatic look'
  },
  {
    id: 'soft-light',
    name: 'Soft Light',
    category: 'lighting',
    prompt: 'Apply soft, diffused lighting effect. Add gentle glow, reduce harsh shadows, create ethereal dreamy atmosphere, slightly overexposed highlights, romantic and airy feeling.',
    icon: '✨',
    description: 'Dreamy soft glow'
  },

  // Color
  {
    id: 'bw-classic',
    name: 'Black & White',
    category: 'color',
    prompt: 'Convert to classic black and white photography. Preserve tonal range and luminosity, create timeless monochrome aesthetic with rich grayscale depth and classic film-like quality.',
    icon: '⬛',
    description: 'Timeless monochrome'
  },
  {
    id: 'pop-art',
    name: 'Pop Art',
    category: 'color',
    prompt: 'Transform into vibrant pop art style. Apply bold posterized colors, high saturation, reduced color palette, graphic design aesthetic, Andy Warhol inspired look with punchy contrast.',
    icon: '🎨',
    description: 'Bold colorful style'
  },
  {
    id: 'cool-tone',
    name: 'Cool Tone',
    category: 'color',
    prompt: 'Apply cool color temperature. Shift colors toward blue and cyan tones, create calm refreshing atmosphere, reduce warmth, add slight teal tint for modern clean aesthetic.',
    icon: '❄️',
    description: 'Cool blue tones'
  },
  {
    id: 'warm-tone',
    name: 'Warm Tone',
    category: 'color',
    prompt: 'Apply warm color temperature. Enhance orange and red tones, add golden warmth, create cozy inviting atmosphere, slight magenta tint, sun-kissed feel.',
    icon: '🔥',
    description: 'Warm cozy tones'
  },

  // Art
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    category: 'art',
    prompt: 'Transform into realistic oil painting. Add visible brush strokes, paint texture, artistic interpretation, rich color depth, classical painting aesthetic with impressionistic touches.',
    icon: '🖼️',
    description: 'Painted masterpiece'
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    category: 'art',
    prompt: 'Convert to delicate watercolor painting. Soft blended edges, translucent color washes, paper texture, artistic fluidity, gentle color bleeding, hand-painted aesthetic.',
    icon: '💧',
    description: 'Soft painted look'
  },
  {
    id: 'sketch',
    name: 'Pencil Sketch',
    category: 'art',
    prompt: 'Transform into detailed pencil sketch drawing. Show pencil strokes, graphite texture, hand-drawn aesthetic, artistic line work, shading and hatching, black and white sketch.',
    icon: '✏️',
    description: 'Hand-drawn sketch'
  },

  // Creative
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    category: 'creative',
    prompt: 'Apply cyberpunk aesthetic. Add neon colors (pink, cyan, purple), futuristic mood, high contrast, urban sci-fi vibe, electric atmosphere, Blade Runner inspired look.',
    icon: '🌆',
    description: 'Neon future vibes'
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    category: 'creative',
    prompt: 'Create ethereal dreamy atmosphere. Add soft focus, pastel colors, gentle glow, whimsical fairy-tale mood, magical lighting, fantasy aesthetic with romantic softness.',
    icon: '🌙',
    description: 'Magical fantasy feel'
  }
];

// For combining filters
export function combinePrompts(presets: FilterPreset[]): string {
  if (presets.length === 0) return '';
  if (presets.length === 1) return presets[0].prompt;

  return `Apply the following effects in combination: ${presets.map((p, i) =>
    `${i + 1}) ${p.prompt}`
  ).join(' ')}. Blend these effects naturally together.`;
}
