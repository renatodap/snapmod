# Real-Time Image Filters Architecture

## Overview
Add Lightroom-style real-time filters with unlimited usage (no AI costs). Users can adjust filters via sliders, create versions, or use filtered images as base for AI prompts.

## Technical Approach

### Filter Processing Strategy
1. **Real-time Preview**: CSS filters (GPU-accelerated, instant)
2. **Version Creation**: Canvas API (high-quality, exportable)
3. **Storage**: Filter state as JSON metadata

### Filters to Implement

```typescript
interface FilterState {
  // Exposure & Tone
  brightness: number;      // -100 to 100
  exposure: number;        // -100 to 100
  contrast: number;        // -100 to 100
  highlights: number;      // -100 to 100
  shadows: number;         // -100 to 100

  // Color
  saturation: number;      // -100 to 100
  vibrance: number;        // -100 to 100
  temperature: number;     // -100 to 100 (warm/cool)
  tint: number;           // -100 to 100 (green/magenta)

  // Detail
  clarity: number;         // -100 to 100
  sharpness: number;       // 0 to 100

  // Effects
  vignette: number;        // 0 to 100
}
```

## Database Schema

### Version Type Update
```sql
-- Add to versions table (or in JSONB metadata)
ALTER TABLE versions ADD COLUMN filter_state JSONB;
ALTER TABLE versions ADD COLUMN is_ai_generated BOOLEAN DEFAULT false;

-- Example filter_state:
{
  "brightness": 10,
  "contrast": 5,
  "saturation": 15,
  "temperature": -5,
  "applied_at": "2025-01-30T12:00:00Z"
}
```

### Usage Tracking Update
```typescript
// Only count AI generations, not manual filter adjustments
interface UsageLog {
  user_id: string;
  action: 'ai_edit' | 'manual_filter'; // Distinguish types
  timestamp: timestamp;
}
```

## Frontend Architecture

### Component Structure
```
components/editor/
├── FilterPanel.tsx              # Main filter panel with all sliders
├── FilterSlider.tsx             # Reusable slider component
├── FilterPresets.tsx            # Quick filter presets (B&W, Vintage, etc.)
├── FilterControls.tsx           # Reset, Save, Apply buttons
└── FilterPreview.tsx            # Handles real-time preview rendering

lib/
├── image-filters.ts             # Core filter logic
├── filter-presets.ts            # Preset definitions
└── filter-storage.ts            # LocalStorage for filter state
```

### State Management
```typescript
// In app/page.tsx
const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTERS);
const [isFilterMode, setIsFilterMode] = useState(false);

// Real-time preview via CSS
const filterCSS = useMemo(() =>
  convertFilterStateToCSS(filterState),
  [filterState]
);
```

### User Flow

```
┌────────────────────────────────────────────────────────┐
│ 1. User uploads photo                                  │
├────────────────────────────────────────────────────────┤
│ 2. Toggle between [AI Edit] and [Filters] tabs        │
├────────────────────────────────────────────────────────┤
│ 3. Adjust sliders → Instant preview (CSS filters)     │
├────────────────────────────────────────────────────────┤
│ 4. Two options:                                        │
│    a) [Save as Version] → Canvas render + save         │
│       → Unlimited, no usage count                      │
│    b) [Use for AI Edit] → Apply filters + AI prompt   │
│       → Counts toward usage limit                      │
└────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. CSS Filters (Real-time Preview)
```typescript
// lib/image-filters.ts
export function convertFilterStateToCSS(filters: FilterState): string {
  return `
    brightness(${1 + filters.brightness / 100})
    contrast(${1 + filters.contrast / 100})
    saturate(${1 + filters.saturation / 100})
    hue-rotate(${filters.temperature * 1.8}deg)
  `.trim();
}
```

### 2. Canvas Processing (High-Quality Export)
```typescript
// lib/image-filters.ts
export async function applyFiltersToCanvas(
  imageUrl: string,
  filters: FilterState
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = await loadImage(imageUrl);

  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original
  ctx.drawImage(img, 0, 0);

  // Apply filters via pixel manipulation
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  applyBrightness(imageData, filters.brightness);
  applyContrast(imageData, filters.contrast);
  applySaturation(imageData, filters.saturation);
  // ... more filters

  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.95);
}
```

### 3. Version Storage Integration
```typescript
// Update lib/version-storage.ts
interface Version {
  id: string;
  image: string;
  prompt?: string;              // AI prompt (if AI-generated)
  filterState?: FilterState;    // Manual filters (if filter edit)
  timestamp: number;
  sessionId: string;
  isAiGenerated: boolean;       // For usage tracking
}

export function saveFilterVersion(
  sessionId: string,
  imageUrl: string,
  filters: FilterState
): Version {
  const version: Version = {
    id: generateId(),
    image: imageUrl,
    filterState: filters,
    timestamp: Date.now(),
    sessionId,
    isAiGenerated: false,  // Manual filter = no AI usage
  };

  // Save to localStorage
  const versions = getVersions(sessionId);
  versions.push(version);
  saveVersions(sessionId, versions);

  return version;
}
```

### 4. Usage Tracking Update
```typescript
// Update lib/usage-limits-supabase.ts
export async function incrementUsageCount(
  userId?: string | null,
  isAiGenerated: boolean = true  // New parameter
): Promise<void> {
  // Only count AI generations
  if (!isAiGenerated) {
    console.log('[Usage] Manual filter edit - not counting toward limit');
    return;
  }

  // Existing AI usage tracking logic...
}
```

## UI Design (Mobile-First)

### Filter Panel Layout
```
┌─────────────────────────────────────┐
│         Photo Preview               │
│    [Live filter applied]            │
│                                     │
├─────────────────────────────────────┤
│  🎨 Filters    🤖 AI Edit          │ ← Tabs
├─────────────────────────────────────┤
│                                     │
│  EXPOSURE                           │
│  Brightness     [────●────]  +10   │
│  Exposure       [──────●──]   +5   │
│  Contrast       [─────●───]    0   │
│                                     │
│  COLOR                              │
│  Saturation     [───────●─]  +15   │
│  Vibrance       [──────●──]  +10   │
│  Temperature    [●────────]  -20   │
│                                     │
│  DETAIL                             │
│  Clarity        [──────●──]   +8   │
│  Sharpness      [─────●───]   +5   │
│                                     │
├─────────────────────────────────────┤
│  [Reset]  [Save Version]            │
│  [Use for AI Edit →]                │
└─────────────────────────────────────┘
```

### Component Props
```typescript
// FilterPanel.tsx
interface FilterPanelProps {
  imageUrl: string;
  initialFilters?: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSaveVersion: (filteredImageUrl: string, filters: FilterState) => void;
  onUseForAI: (filteredImageUrl: string, filters: FilterState) => void;
}

// FilterSlider.tsx
interface FilterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  unit?: string;
}
```

## Performance Optimization

### 1. Debouncing
```typescript
// Debounce slider changes for smooth performance
const debouncedFilterChange = useMemo(
  () => debounce((filters: FilterState) => {
    setFilterState(filters);
  }, 16), // 60fps
  []
);
```

### 2. CSS Transform (GPU Acceleration)
```css
.filtered-image {
  transform: translateZ(0); /* Force GPU rendering */
  will-change: filter;
}
```

### 3. Lazy Canvas Processing
- Only process with Canvas on "Save Version"
- Keep preview lightweight with CSS

## Error Handling

### 1. Canvas API Unavailable
```typescript
function canUseCanvas(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  } catch {
    return false;
  }
}

// Fallback to CSS-only if Canvas unavailable
if (!canUseCanvas()) {
  showNotification('Advanced filters unavailable. Using basic mode.');
}
```

### 2. Image Loading Errors
```typescript
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}
```

### 3. Storage Errors
```typescript
try {
  saveFilterVersion(sessionId, imageUrl, filters);
} catch (error) {
  console.error('[Filters] Save failed:', error);
  showNotification('Failed to save version. Please try again.');
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('image-filters', () => {
  test('converts filter state to CSS', () => {
    const filters = { brightness: 10, contrast: 5, saturation: 0 };
    const css = convertFilterStateToCSS(filters);
    expect(css).toContain('brightness(1.1)');
  });

  test('applies filters to canvas', async () => {
    const result = await applyFiltersToCanvas(mockImage, mockFilters);
    expect(result).toMatch(/^data:image\/jpeg/);
  });
});
```

### Integration Tests
```typescript
describe('FilterPanel', () => {
  test('updates preview in real-time', async () => {
    render(<FilterPanel {...props} />);

    const slider = screen.getByLabelText('Brightness');
    fireEvent.change(slider, { target: { value: 50 } });

    await waitFor(() => {
      expect(props.onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ brightness: 50 })
      );
    });
  });
});
```

## Migration Plan

### Phase 1: Core Infrastructure (2 hours)
- [ ] Create filter types and interfaces
- [ ] Build FilterPanel skeleton
- [ ] Implement CSS filter preview
- [ ] Add filter/AI mode toggle

### Phase 2: Filter Logic (2 hours)
- [ ] Implement CSS filter conversion
- [ ] Build Canvas processing
- [ ] Create individual filter algorithms
- [ ] Add filter presets

### Phase 3: Version Integration (1 hour)
- [ ] Update version storage schema
- [ ] Modify usage tracking
- [ ] Test version creation flow
- [ ] Update version timeline UI

### Phase 4: UI Polish (2 hours)
- [ ] Design beautiful sliders
- [ ] Add smooth animations
- [ ] Implement gestures
- [ ] Mobile optimization

### Phase 5: Testing & Docs (1 hour)
- [ ] Write unit tests
- [ ] Integration tests
- [ ] Update documentation
- [ ] Performance testing

**Total Estimated Time: 8 hours**

## Success Metrics

1. ✅ Filter adjustments update in <16ms (60fps)
2. ✅ Canvas processing completes in <2s
3. ✅ No usage limit on filter-only edits
4. ✅ Smooth slider interaction on mobile
5. ✅ Zero breaking changes to existing features
6. ✅ 100% test coverage for filter logic
7. ✅ Clear separation: AI (limited) vs Filters (unlimited)

## Future Enhancements

1. **Advanced Filters**: Split toning, color grading curves
2. **Filter Presets**: Save custom preset combinations
3. **Before/After Compare**: Swipe to compare filtered/original
4. **Filter History**: Undo/redo filter changes
5. **Batch Processing**: Apply same filters to multiple photos
6. **Export Presets**: Share filter settings with others
