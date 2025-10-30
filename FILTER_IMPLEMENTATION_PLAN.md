# Filter Implementation Plan

## Step-by-Step Implementation

### Phase 1: Types & Core Infrastructure

#### 1.1 Create Filter Types
```typescript
// lib/types/filters.ts
export interface FilterState {
  brightness: number;
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  clarity: number;
  sharpness: number;
  vignette: number;
}

export const DEFAULT_FILTERS: FilterState = {
  brightness: 0,
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  clarity: 0,
  sharpness: 0,
  vignette: 0,
};

export const FILTER_RANGES = {
  brightness: { min: -100, max: 100, step: 1 },
  exposure: { min: -100, max: 100, step: 1 },
  contrast: { min: -100, max: 100, step: 1 },
  // ... etc
};
```

#### 1.2 Update Version Storage Types
```typescript
// lib/version-storage.ts - Update Version interface
export interface Version {
  id: string;
  image: string;
  prompt?: string;
  filterState?: FilterState;  // NEW
  timestamp: number;
  sessionId: string;
  isAiGenerated: boolean;     // NEW
}
```

#### 1.3 Create Filter Utils
```typescript
// lib/image-filters.ts

export function convertFilterStateToCSS(filters: FilterState): string {
  const brightness = 1 + filters.brightness / 100;
  const contrast = 1 + filters.contrast / 100;
  const saturate = 1 + filters.saturation / 100;
  const hueRotate = filters.temperature * 1.8;
  const sepia = filters.tint > 0 ? filters.tint / 200 : 0;

  return `
    brightness(${brightness})
    contrast(${contrast})
    saturate(${saturate})
    hue-rotate(${hueRotate}deg)
    sepia(${sepia})
  `.trim();
}

export async function applyFiltersToCanvas(
  imageUrl: string,
  filters: FilterState
): Promise<string> {
  // Implementation in Phase 2
}

export function resetFilters(): FilterState {
  return { ...DEFAULT_FILTERS };
}

export function hasActiveFilters(filters: FilterState): boolean {
  return Object.values(filters).some(value => value !== 0);
}
```

### Phase 2: UI Components

#### 2.1 FilterSlider Component
```typescript
// components/editor/FilterSlider.tsx

interface FilterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function FilterSlider({
  label,
  value,
  min,
  max,
  onChange,
  disabled = false
}: FilterSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/80">
          {label}
        </label>
        <span className="text-sm text-white/60 font-mono">
          {value > 0 ? '+' : ''}{value}
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer disabled:opacity-30"
          style={{
            background: `linear-gradient(to right,
              rgb(59, 130, 246) 0%,
              rgb(59, 130, 246) ${percentage}%,
              rgba(255,255,255,0.1) ${percentage}%,
              rgba(255,255,255,0.1) 100%)`
          }}
        />

        {/* Center marker */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/20"
        />
      </div>
    </div>
  );
}
```

#### 2.2 FilterPanel Component
```typescript
// components/editor/FilterPanel.tsx

interface FilterPanelProps {
  imageUrl: string;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSaveVersion: () => void;
  onUseForAI: () => void;
  disabled?: boolean;
}

export function FilterPanel({
  imageUrl,
  filters,
  onFiltersChange,
  onSaveVersion,
  onUseForAI,
  disabled = false
}: FilterPanelProps) {
  const hasChanges = hasActiveFilters(filters);

  const updateFilter = (key: keyof FilterState, value: number) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange(resetFilters());
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-safe max-h-[70vh] overflow-y-auto">
      <div className="px-4 pb-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Filters</h3>
          {hasChanges && (
            <button
              onClick={handleReset}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Reset All
            </button>
          )}
        </div>

        {/* Exposure Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Exposure
          </h4>
          <FilterSlider
            label="Brightness"
            value={filters.brightness}
            min={-100}
            max={100}
            onChange={(v) => updateFilter('brightness', v)}
            disabled={disabled}
          />
          <FilterSlider
            label="Exposure"
            value={filters.exposure}
            min={-100}
            max={100}
            onChange={(v) => updateFilter('exposure', v)}
            disabled={disabled}
          />
          <FilterSlider
            label="Contrast"
            value={filters.contrast}
            min={-100}
            max={100}
            onChange={(v) => updateFilter('contrast', v)}
            disabled={disabled}
          />
        </div>

        {/* Color Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Color
          </h4>
          <FilterSlider
            label="Saturation"
            value={filters.saturation}
            min={-100}
            max={100}
            onChange={(v) => updateFilter('saturation', v)}
            disabled={disabled}
          />
          <FilterSlider
            label="Vibrance"
            value={filters.vibrance}
            min={-100}
            max={100}
            onChange={(v) => updateFilter('vibrance', v)}
            disabled={disabled}
          />
          <FilterSlider
            label="Temperature"
            value={filters.temperature}
            min={-100}
            max={100}
            onChange={(v) => updateFilter('temperature', v)}
            disabled={disabled}
          />
        </div>

        {/* Detail Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Detail
          </h4>
          <FilterSlider
            label="Clarity"
            value={filters.clarity}
            min={-100}
            max={100}
            onChange={(v) => updateFilter('clarity', v)}
            disabled={disabled}
          />
          <FilterSlider
            label="Sharpness"
            value={filters.sharpness}
            min={0}
            max={100}
            onChange={(v) => updateFilter('sharpness', v)}
            disabled={disabled}
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4">
          <button
            onClick={onSaveVersion}
            disabled={disabled || !hasChanges}
            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Save as Version
          </button>

          <button
            onClick={onUseForAI}
            disabled={disabled || !hasChanges}
            className="w-full bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Use for AI Edit →
          </button>
        </div>

        <p className="text-xs text-white/40 text-center">
          Manual filters are unlimited • No usage cost
        </p>
      </div>
    </div>
  );
}
```

### Phase 3: Integration with Main App

#### 3.1 Add State to app/page.tsx
```typescript
// New state
const [editMode, setEditMode] = useState<'ai' | 'filters'>('ai');
const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTERS);
const [showFilterPanel, setShowFilterPanel] = useState(false);

// Preview image with filters applied
const displayImageWithFilters = useMemo(() => {
  if (editMode === 'filters' && hasActiveFilters(filterState)) {
    return displayImage; // CSS filters will be applied via style
  }
  return displayImage;
}, [displayImage, editMode, filterState]);

// CSS filter string for preview
const filterCSS = useMemo(() => {
  if (editMode === 'filters') {
    return convertFilterStateToCSS(filterState);
  }
  return '';
}, [editMode, filterState]);
```

#### 3.2 Add Mode Toggle
```typescript
// Add after PromptPresets section
{photo && (
  <div className="px-4 pb-2">
    <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
      <button
        onClick={() => {
          setEditMode('ai');
          setShowFilterPanel(false);
        }}
        className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
          editMode === 'ai'
            ? 'bg-white/10 text-white'
            : 'text-white/60'
        }`}
      >
        🤖 AI Edit
      </button>
      <button
        onClick={() => {
          setEditMode('filters');
          setShowFilterPanel(true);
        }}
        className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
          editMode === 'filters'
            ? 'bg-white/10 text-white'
            : 'text-white/60'
        }`}
      >
        🎨 Filters
      </button>
    </div>
  </div>
)}
```

#### 3.3 Apply Filters to Display Image
```typescript
{/* Photo Display with Filters */}
<img
  src={displayImage}
  alt="Your photo"
  className="max-w-full max-h-full object-contain"
  style={{
    filter: filterCSS,
    transition: 'filter 0.1s ease-out'
  }}
/>
```

#### 3.4 Render FilterPanel
```typescript
{/* Filter Panel */}
{editMode === 'filters' && showFilterPanel && (
  <FilterPanel
    imageUrl={displayImage!}
    filters={filterState}
    onFiltersChange={setFilterState}
    onSaveVersion={handleSaveFilterVersion}
    onUseForAI={handleUseFilteredForAI}
    disabled={isGenerating}
  />
)}
```

#### 3.5 Handler Functions
```typescript
// Save filtered version (no AI, unlimited)
const handleSaveFilterVersion = async () => {
  if (!photo) return;

  try {
    // Apply filters via Canvas for high quality
    const filteredImage = await applyFiltersToCanvas(
      displayImage!,
      filterState
    );

    // Create new version (not AI-generated)
    const newVersion: Version = {
      id: `version_${Date.now()}`,
      image: filteredImage,
      filterState,
      timestamp: Date.now(),
      sessionId,
      isAiGenerated: false,  // No usage count
    };

    setVersions([...versions, newVersion]);
    setCurrentVersionIndex(versions.length);

    // Reset filters after save
    setFilterState(DEFAULT_FILTERS);
    setShowFilterPanel(false);

    console.log('[Filters] Version saved:', newVersion.id);
  } catch (error) {
    console.error('[Filters] Save failed:', error);
    alert('Failed to save filtered version');
  }
};

// Use filtered image as base for AI edit
const handleUseFilteredForAI = async () => {
  try {
    // Apply filters first
    const filteredImage = await applyFiltersToCanvas(
      displayImage!,
      filterState
    );

    // Set as current photo for AI editing
    setPhoto(filteredImage);
    setFilterState(DEFAULT_FILTERS);
    setShowFilterPanel(false);
    setEditMode('ai');

    console.log('[Filters] Switched to AI edit with filtered image');
  } catch (error) {
    console.error('[Filters] Apply failed:', error);
    alert('Failed to apply filters');
  }
};
```

### Phase 4: Canvas Processing Implementation

#### 4.1 Complete Canvas Filter Application
```typescript
// lib/image-filters.ts

export async function applyFiltersToCanvas(
  imageUrl: string,
  filters: FilterState
): Promise<string> {
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // Load image
  const img = await loadImage(imageUrl);
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Apply filters pixel by pixel
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    if (filters.brightness !== 0) {
      const brightnessFactor = filters.brightness * 2.55;
      r = clamp(r + brightnessFactor, 0, 255);
      g = clamp(g + brightnessFactor, 0, 255);
      b = clamp(b + brightnessFactor, 0, 255);
    }

    // Contrast
    if (filters.contrast !== 0) {
      const contrastFactor = (259 * (filters.contrast + 255)) / (255 * (259 - filters.contrast));
      r = clamp(contrastFactor * (r - 128) + 128, 0, 255);
      g = clamp(contrastFactor * (g - 128) + 128, 0, 255);
      b = clamp(contrastFactor * (b - 128) + 128, 0, 255);
    }

    // Saturation
    if (filters.saturation !== 0) {
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      const saturationFactor = 1 + filters.saturation / 100;
      r = clamp(gray + saturationFactor * (r - gray), 0, 255);
      g = clamp(gray + saturationFactor * (g - gray), 0, 255);
      b = clamp(gray + saturationFactor * (b - gray), 0, 255);
    }

    // Write back
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  // Put modified data back
  ctx.putImageData(imageData, 0, 0);

  // Return as data URL
  return canvas.toDataURL('image/jpeg', 0.95);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}
```

### Phase 5: Update Usage Tracking

#### 5.1 Update incrementUsageCount
```typescript
// lib/usage-limits-supabase.ts

export async function incrementUsageCount(
  userId?: string | null,
  isAiGenerated: boolean = true  // NEW PARAMETER
): Promise<void> {
  // Skip usage tracking for manual filter edits
  if (!isAiGenerated) {
    console.log('[Usage] Manual filter edit - unlimited, not counting');
    return;
  }

  // Rest of existing logic for AI usage tracking...
}
```

#### 5.2 Update handleSubmit in app/page.tsx
```typescript
// After successful AI generation
await incrementUsageCountSupabase(user?.id, true); // Explicitly mark as AI
```

#### 5.3 Update Version Creation
```typescript
// When creating AI version
const newVersion: Version = {
  id: `version_${Date.now()}`,
  image: result,
  prompt: finalPrompt,
  timestamp: Date.now(),
  sessionId,
  isAiGenerated: true,  // AI = counts toward limit
};

// When creating filter version
const newVersion: Version = {
  id: `version_${Date.now()}`,
  image: filteredImage,
  filterState,
  timestamp: Date.now(),
  sessionId,
  isAiGenerated: false,  // Manual = unlimited
};
```

## Testing Checklist

### Unit Tests
- [ ] Filter state conversion to CSS
- [ ] Canvas filter application
- [ ] Filter value clamping
- [ ] Reset filters functionality
- [ ] hasActiveFilters detection

### Integration Tests
- [ ] FilterPanel renders correctly
- [ ] Slider updates filter state
- [ ] Save version creates correct Version object
- [ ] AI usage tracked for AI edits only
- [ ] No usage tracking for filter edits

### UI Tests
- [ ] Filters update preview in real-time
- [ ] Mode toggle switches between AI/Filters
- [ ] Reset button clears all filters
- [ ] Save button creates version in timeline
- [ ] Mobile gestures work smoothly

### Performance Tests
- [ ] Filter preview <16ms latency
- [ ] Canvas processing <2s
- [ ] No memory leaks after multiple edits
- [ ] Smooth scrolling with filters active

## Deployment Checklist

- [ ] All tests passing
- [ ] Build succeeds without errors
- [ ] Documentation updated
- [ ] No breaking changes to existing features
- [ ] Mobile tested on real device
- [ ] Performance metrics met
- [ ] Error handling tested
- [ ] Usage tracking verified

## Success Criteria

✅ User can adjust filters with instant preview
✅ Filter edits don't count toward usage limits
✅ Can save filtered versions to timeline
✅ Can use filtered image as base for AI
✅ All existing features work unchanged
✅ Performance <16ms for preview, <2s for save
✅ Beautiful, intuitive mobile-first UI
✅ 100% test coverage for new code
