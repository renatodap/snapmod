'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, Download, X, Maximize2, History as HistoryIcon, Save, Sliders } from 'lucide-react';
import { PromptInput } from '@/components/editor/PromptInput';
import { VersionTimeline } from '@/components/editor/VersionTimeline';
import { ComparisonModes } from '@/components/editor/ComparisonModes';
import { HistoryDrawer } from '@/components/editor/HistoryDrawer';
import { PromptPresets, type Preset } from '@/components/editor/PromptPresets';
import { UpgradeModal } from '@/components/UpgradeModal';
import { FloatingShareButton } from '@/components/ShareButton';
import { ExportModal } from '@/components/editor/ExportModal';
import { CustomPresetsPanel } from '@/components/editor/CustomPresetsPanel';
import { type CustomPreset } from '@/lib/custom-presets';
import { PromptBuilder, type ComposedPrompt, type PromptModifier } from '@/components/editor/PromptBuilder';
import { useNanoBanana } from '@/hooks/useNanoBanana';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { compressImage, downloadImage, getImageDimensions } from '@/lib/image-utils';
import { versionStorage, type Version } from '@/lib/version-storage';
import { promptHistory } from '@/lib/prompt-history';
import { checkUsageLimit as checkUsageLimitSupabase, incrementUsageCount as incrementUsageCountSupabase } from '@/lib/usage-limits-supabase';
import { track, trackImageUpload, trackEditStart, trackEditComplete, trackEditFailed, trackPresetUsed, trackDownload, trackVersionChange, trackComparisonView, trackHistoryOpened } from '@/lib/analytics';
import { useAuth } from '@/components/providers/AuthProvider';
import { SignInModal } from '@/components/auth/SignInModal';
import { FilterPanel } from '@/components/editor/FilterPanel';
import { convertFilterStateToCSS, applyFiltersToCanvas, hasActiveFilters } from '@/lib/image-filters';
import { DEFAULT_FILTERS, type FilterState } from '@/lib/types/filters';

type Step = 'start' | 'photo' | 'processing' | 'result';

export default function Home() {
  // Auth
  const { user, isPro, isLoading: authLoading, signOut } = useAuth();

  // State
  const [step, setStep] = useState<Step>('start');
  const [photo, setPhoto] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(0);
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [compareMode, setCompareMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [usageData, setUsageData] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [showCustomPresets, setShowCustomPresets] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [composedPrompt, setComposedPrompt] = useState<ComposedPrompt>({
    basePrompt: '',
    modifiers: [],
  });
  const [editMode, setEditMode] = useState<'ai' | 'filters'>('ai');
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generate, isGenerating, progress, error } = useNanoBanana();

  const currentVersion = versions[currentVersionIndex];
  const displayImage = currentVersion?.image || photo;

  // CSS filter string for preview
  const filterCSS = useMemo(() => {
    if (editMode === 'filters' && displayImage) {
      const cssFilter = convertFilterStateToCSS(filterState);
      console.log('[Filters] Applying CSS filter:', cssFilter);
      return cssFilter;
    }
    return '';
  }, [editMode, filterState, displayImage]);

  // Load usage data (with auth support)
  useEffect(() => {
    const loadUsage = async () => {
      const usage = await checkUsageLimitSupabase(user?.id, isPro);
      setUsageData(usage);
    };
    if (!authLoading) {
      loadUsage();
    }
  }, [user, isPro, authLoading]);

  // Get image dimensions when displayImage changes
  useEffect(() => {
    if (displayImage) {
      getImageDimensions(displayImage).then(setImageDimensions).catch(console.error);
    }
  }, [displayImage]);

  // Sync composed prompt base with simple prompt
  useEffect(() => {
    if (!advancedMode) {
      setComposedPrompt(prev => ({ ...prev, basePrompt: prompt }));
    }
  }, [prompt, advancedMode]);

  // Handle export
  const handleExport = () => {
    if (!displayImage) return;
    console.log('[Export] Opening export modal');
    setShowExportModal(true);
  };

  // Handle camera - triggers native camera app to take a photo
  const handleCamera = () => {
    console.log('[Camera] User clicked camera button');
    console.log('[Camera] Triggering native camera app via file input');

    // Create a temporary file input to trigger the native camera
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // This triggers the camera app directly

    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) {
        console.log('[Camera] No photo taken');
        return;
      }

      console.log('[Camera] Photo captured:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      try {
        console.log('[Camera] Compressing image...');
        const compressed = await compressImage(file);
        console.log('[Camera] Image compressed, size:', compressed.length);

        trackImageUpload(file);
        setPhoto(compressed);
        setStep('photo');
        console.log('[Camera] Photo set, moving to photo step');
      } catch (err) {
        console.error('[Camera] Error:', err);
        console.error('[Camera] Error details:', err instanceof Error ? err.message : String(err));

        let errorMessage = 'Failed to process camera photo. Please try again.';
        if (err instanceof Error) {
          if (err.message.includes('size')) {
            errorMessage = 'Photo is too large. Please try again.';
          } else if (err.message.includes('type') || err.message.includes('format')) {
            errorMessage = 'Unsupported photo format. Please try again.';
          }
        }

        alert(errorMessage);
      }
    };

    // Trigger the file input
    input.click();
  };

  // Handle upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[Upload] File input changed');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('[Upload] No file selected');
      return;
    }

    console.log('[Upload] File selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    try {
      console.log('[Upload] Compressing image...');
      const compressed = await compressImage(file);
      console.log('[Upload] Image compressed, size:', compressed.length);

      trackImageUpload(file);
      setPhoto(compressed);
      setStep('photo');
      console.log('[Upload] Photo set, moving to photo step');
    } catch (err) {
      console.error('[Upload] Error:', err);
      console.error('[Upload] Error details:', err instanceof Error ? err.message : String(err));

      let errorMessage = 'Failed to upload image. Please try a different file.';
      if (err instanceof Error) {
        if (err.message.includes('size')) {
          errorMessage = 'Image is too large. Please choose a smaller file.';
        } else if (err.message.includes('type') || err.message.includes('format')) {
          errorMessage = 'Unsupported file type. Please upload a JPG or PNG image.';
        }
      }

      alert(errorMessage);
    }
  };

  // Save filtered version (no AI, unlimited)
  const handleSaveFilterVersion = async () => {
    if (!displayImage) return;

    console.log('[Filters] Saving filter version');

    try {
      // Apply filters via Canvas for high quality
      const filteredImage = await applyFiltersToCanvas(displayImage, filterState);

      // Create new version (not AI-generated = unlimited)
      const newVersion: Version = {
        id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        image: filteredImage,
        filterState,
        timestamp: Date.now(),
        sessionId,
        isAiGenerated: false,  // Manual filter = no usage count
      };

      // Save to IndexedDB
      try {
        await versionStorage.save(newVersion);
        console.log('[Filters] Version saved to storage');
      } catch (storageError) {
        console.error('[Filters] Failed to save version:', storageError);
      }

      // Add to versions array
      const newVersions = [...versions, newVersion];
      setVersions(newVersions);
      setCurrentVersionIndex(newVersions.length - 1);

      console.log('[Filters] Filter version saved successfully');

      // Reset filters and close panel
      setFilterState(DEFAULT_FILTERS);
      setShowFilterPanel(false);
      setEditMode('ai');
    } catch (error) {
      console.error('[Filters] Save failed:', error);
      alert('Failed to save filtered version. Please try again.');
    }
  };

  // Use filtered image as base for AI edit
  const handleUseFilteredForAI = async () => {
    if (!displayImage) return;

    console.log('[Filters] Using filtered image for AI edit');

    try {
      // Apply filters first
      const filteredImage = await applyFiltersToCanvas(displayImage, filterState);

      // Set as current photo for AI editing
      setPhoto(filteredImage);

      // Reset filters and switch to AI mode
      setFilterState(DEFAULT_FILTERS);
      setShowFilterPanel(false);
      setEditMode('ai');

      console.log('[Filters] Switched to AI mode with filtered image');
    } catch (error) {
      console.error('[Filters] Apply failed:', error);
      alert('Failed to apply filters. Please try again.');
    }
  };

  // Submit for processing
  const handleSubmit = async () => {
    console.log('[Submit] User clicked submit');

    if (!photo) {
      console.error('[Submit] No photo available');
      alert('Please take or upload a photo first.');
      return;
    }

    if (prompt.trim().length === 0) {
      console.error('[Submit] No prompt provided');
      alert('Please describe what you want to do with your photo.');
      return;
    }

    // Check usage limits (with auth support)
    const usage = await checkUsageLimitSupabase(user?.id, isPro);
    if (!usage.allowed) {
      console.log('[Submit] Usage limit reached, showing upgrade modal');
      setUpgradeModalOpen(true);
      return;
    }

    console.log('[Submit] Starting processing with prompt:', prompt);
    console.log('[Submit] Prompt length:', prompt.length, 'characters');
    console.log('[Submit] Edits remaining today:', usage.remaining);

    // Save prompt to history
    try {
      await promptHistory.add(prompt.trim());
      console.log('[Submit] Prompt added to history');
    } catch (historyError) {
      console.error('[Submit] Failed to save prompt to history:', historyError);
      // Continue anyway
    }

    trackEditStart(prompt.trim(), 'edit');
    const startTime = Date.now();

    setStep('processing');

    try {
      const result = await generate({
        prompt: prompt.trim(),
        imageUrl: displayImage || undefined, // Use current display image (could be a version)
        mode: 'edit'
      });

      console.log('[Submit] Generation result:', {
        success: result.success,
        cached: result.cached,
        hasImage: !!result.image,
        imageSize: result.image?.length
      });

      if (result.success && result.image) {
        console.log('[Submit] Image generated successfully. Creating version...');

        // Track success
        const duration = Date.now() - startTime;
        trackEditComplete(prompt.trim(), duration, result.cached || false);

        // Increment usage count (with auth support) - AI edit counts toward limit
        await incrementUsageCountSupabase(user?.id, true);
        const updatedUsage = await checkUsageLimitSupabase(user?.id, isPro);
        setUsageData(updatedUsage);

        // Create new version
        const newVersion: Version = {
          id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          prompt: prompt.trim(),
          image: result.image,
          timestamp: Date.now(),
          sessionId,
          isAiGenerated: true,  // AI edit = counts toward usage
        };

        // Save to IndexedDB
        try {
          await versionStorage.save(newVersion);
          console.log('[Submit] Version saved to storage');
        } catch (storageError) {
          console.error('[Submit] Failed to save version to storage:', storageError);
          // Continue anyway - version still in memory
        }

        // Add to versions array
        const newVersions = [...versions, newVersion];
        setVersions(newVersions);
        setCurrentVersionIndex(newVersions.length - 1);
        console.log('[Submit] Version added. Total versions:', newVersions.length);

        // Clear prompt for next iteration
        setPrompt('');
        setStep('photo');
        console.log('[Submit] Ready for next iteration');
      } else {
        console.error('[Submit] Generation failed:', result.error);

        // Track failure
        trackEditFailed(result.error || 'Unknown error', prompt.trim());

        // Use userMessage if available from API, otherwise use generic error
        const errorMessage = result.userMessage || result.error || 'Failed to process image. Please try again.';
        alert(errorMessage);
        setStep('photo');
        console.log('[Submit] Returning to photo step due to error');
      }
    } catch (err) {
      console.error('[Submit] Unexpected error during generation:', err);

      // Track failure
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      trackEditFailed(errorMsg, prompt.trim());

      alert('An unexpected error occurred. Please try again.');
      setStep('photo');
    }
  };

  // Navigate versions
  const handleVersionChange = (index: number) => {
    console.log('[Version] Navigating to version:', index);
    trackVersionChange(currentVersionIndex, index);
    setCurrentVersionIndex(index);
  };

  // Toggle comparison mode
  const toggleCompare = () => {
    console.log('[Compare] Toggling comparison mode');
    if (!photo || versions.length === 0) {
      console.log('[Compare] Cannot compare - no versions yet');
      return;
    }
    if (!compareMode) {
      trackComparisonView();
    }
    setCompareMode(!compareMode);
  };

  // Toggle history drawer
  const toggleHistory = () => {
    console.log('[History] Toggling history drawer');
    if (!historyOpen) {
      trackHistoryOpened();
    }
    setHistoryOpen(!historyOpen);
  };

  // Handle prompt selection from history
  const handlePromptSelect = (selectedPrompt: string) => {
    console.log('[History] Prompt selected from history:', selectedPrompt);
    setPrompt(selectedPrompt);
  };

  // Handle preset selection
  const handlePresetSelect = (preset: Preset) => {
    console.log('[Preset] Preset selected:', preset.label);
    trackPresetUsed(preset.label, preset.prompt);
    setPrompt(preset.prompt);
  };

  // Handle custom preset selection
  const handleCustomPresetSelect = (preset: CustomPreset) => {
    console.log('[CustomPreset] Custom preset selected:', preset.name);
    trackPresetUsed(preset.name, preset.basePrompt);

    if (advancedMode && preset.modifiers) {
      // Apply to composed prompt if in advanced mode
      setComposedPrompt({
        basePrompt: preset.basePrompt,
        modifiers: preset.modifiers as PromptModifier[],
      });
    } else {
      // Apply to simple prompt
      setPrompt(preset.basePrompt);
    }
    setShowCustomPresets(false);
  };

  // Handle advanced prompt generation
  const handleAdvancedGenerate = (finalPrompt: string) => {
    console.log('[AdvancedPrompt] Generated prompt:', finalPrompt);
    setPrompt(finalPrompt);
    // Trigger submit with the composed prompt
    setTimeout(() => handleSubmit(), 100);
  };

  // Reset
  const reset = () => {
    console.log('[Reset] Resetting app to start');
    setStep('start');
    setPhoto(null);
    setPrompt('');
    setVersions([]);
    setCurrentVersionIndex(0);
    setCompareMode(false);
    setHistoryOpen(false);
    console.log('[Reset] App reset complete');
  };

  // Keyboard shortcuts for power users
  useKeyboardShortcuts({
    onPreviousVersion: () => {
      if (currentVersionIndex > -1) {
        handleVersionChange(currentVersionIndex - 1);
      }
    },
    onNextVersion: () => {
      if (currentVersionIndex < versions.length - 1) {
        handleVersionChange(currentVersionIndex + 1);
      }
    },
    onToggleCompare: toggleCompare,
    onToggleHistory: toggleHistory,
    onCloseOverlays: () => {
      if (compareMode) setCompareMode(false);
      if (historyOpen) setHistoryOpen(false);
    },
    isInputFocused,
    hasVersions: versions.length > 0,
    canCompare: versions.length > 0 && !!photo
  });

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">SnapMod</h1>
          </div>
          {step !== 'start' && (
            <button
              onClick={reset}
              className="text-white/60 hover:text-white transition p-2"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-safe">
        <AnimatePresence mode="wait">
          {/* Start: Camera or Upload */}
          {step === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center p-6 relative"
            >
              {/* Auth Button in Top Right */}
              <div className="absolute top-6 right-6">
                {!user ? (
                  <button
                    onClick={() => setShowSignInModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 active:scale-95 transition shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                  >
                    <Sparkles className="w-4 h-4" />
                    Sign In / Sign Up
                  </button>
                ) : (
                  <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-white/80 text-sm">{user.email}</span>
                    </div>
                    {isPro && (
                      <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        PRO
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 text-center">
                AI Photo Magic
              </h2>
              <p className="text-white/60 text-center mb-8">
                Transform your photos instantly
              </p>

              {/* Show usage info */}
              {!authLoading && usageData && (
                <div className="mb-6 text-center">
                  {isPro ? (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 px-4 py-2 rounded-full">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-white/90 text-sm font-medium">Unlimited Edits</span>
                    </div>
                  ) : user ? (
                    <div className="text-white/60 text-sm">
                      {usageData.remaining} free edits remaining today
                    </div>
                  ) : (
                    <div className="text-white/60 text-sm">
                      5 free edits per day • Sign in to track your usage
                    </div>
                  )}
                </div>
              )}

              <div className="w-full max-w-sm space-y-4">
                <button
                  onClick={handleCamera}
                  className="w-full bg-blue-500 text-white py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 active:scale-95 transition shadow-2xl shadow-blue-500/50"
                >
                  <Camera className="w-6 h-6" />
                  Take Photo
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white/10 text-white py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 active:scale-95 transition hover:bg-white/20"
                >
                  <Upload className="w-6 h-6" />
                  Upload Photo
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </div>
            </motion.div>
          )}

          {/* Photo + Prompt Input */}
          {step === 'photo' && photo && (
            <motion.div
              key="photo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              {/* Photo Display - Full Screen */}
              <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {displayImage && (
                  <img
                    src={displayImage}
                    alt="Your photo"
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: filterCSS,
                      transition: 'filter 0.1s ease-out',
                      transform: 'translateZ(0)', // Force GPU acceleration
                      willChange: editMode === 'filters' ? 'filter' : 'auto',
                    }}
                  />
                )}

                {/* Header Overlay */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h1 className="text-xl font-bold text-white">SnapMod</h1>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAdvancedMode(!advancedMode)}
                        className={`transition p-2 flex items-center gap-1 ${
                          advancedMode ? 'text-blue-400' : 'text-white/60 hover:text-white'
                        }`}
                        aria-label="Advanced Mode"
                      >
                        <Sliders className="w-5 h-5" />
                        <span className="text-sm hidden sm:inline">Advanced</span>
                      </button>
                      <button
                        onClick={() => setShowCustomPresets(true)}
                        className="text-white/60 hover:text-white transition p-2 flex items-center gap-1"
                        aria-label="My Presets"
                      >
                        <Save className="w-5 h-5" />
                        <span className="text-sm hidden sm:inline">Presets</span>
                      </button>
                      {!user ? (
                        <button
                          onClick={() => setShowSignInModal(true)}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1 active:scale-95 transition shadow-sm"
                          aria-label="Sign In"
                        >
                          Sign In
                        </button>
                      ) : (
                        <div className="relative group">
                          <button
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition"
                            aria-label="Account menu"
                          >
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span className="text-white text-xs max-w-[80px] truncate">
                              {user.email?.split('@')[0]}
                            </span>
                            {isPro && (
                              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                PRO
                              </span>
                            )}
                          </button>

                          {/* Dropdown menu */}
                          <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
                            <div className="p-2">
                              <div className="px-3 py-2 text-white/60 text-xs border-b border-white/10">
                                {user.email}
                              </div>
                              <button
                                onClick={async () => {
                                  await signOut();
                                }}
                                className="w-full px-3 py-2 text-left text-white/80 hover:bg-white/10 rounded-lg transition text-sm mt-1"
                              >
                                Sign Out
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={reset}
                        className="text-white/60 hover:text-white transition p-2"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Version Counter */}
                  {versions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-white/60 text-sm"
                    >
                      Version {currentVersionIndex + 1} of {versions.length + 1}
                    </motion.div>
                  )}
                </div>

                {/* Floating Action Buttons */}
                <div className="absolute right-4 bottom-32 z-30 flex flex-col gap-3 pr-safe pb-safe">
                  {/* Export Button */}
                  {displayImage && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={handleExport}
                      className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition shadow-lg active:scale-95"
                      aria-label="Export"
                    >
                      <Download className="w-6 h-6" />
                    </motion.button>
                  )}

                  {/* Share Button */}
                  {versions.length > 0 && displayImage && (
                    <FloatingShareButton
                      imageUrl={displayImage}
                      prompt={currentVersion?.prompt}
                    />
                  )}

                  {/* Compare Button */}
                  {versions.length > 0 && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={toggleCompare}
                      className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition shadow-lg active:scale-95"
                      aria-label="Compare"
                    >
                      <Maximize2 className="w-6 h-6" />
                    </motion.button>
                  )}

                  {/* History Button */}
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onClick={toggleHistory}
                    className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition shadow-lg active:scale-95"
                    aria-label="History"
                  >
                    <HistoryIcon className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>

              {/* Version Timeline - Above Prompt Input */}
              {photo && (
                <VersionTimeline
                  versions={versions}
                  currentIndex={currentVersionIndex}
                  originalImage={photo}
                  onChange={handleVersionChange}
                />
              )}

              {/* Mode Toggle - AI Edit or Filters */}
              {photo && !isGenerating && !advancedMode && (
                <div className="px-4 pb-3">
                  <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                    <button
                      onClick={() => {
                        setEditMode('ai');
                        setShowFilterPanel(false);
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
                        editMode === 'ai'
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white'
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
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      🎨 Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Preset Prompts - Above Prompt Input (only in AI mode) */}
              {photo && !isGenerating && !advancedMode && editMode === 'ai' && (
                <div className={`px-4 pb-4 ${versions.length > 0 ? 'mb-44' : 'mb-32'}`}>
                  <PromptPresets
                    onSelectPreset={handlePresetSelect}
                    disabled={isGenerating}
                  />
                </div>
              )}

              {/* Prompt Input or Advanced Builder (only in AI mode) */}
              {editMode === 'ai' && (
                <>
                  {!advancedMode ? (
                    <PromptInput
                      value={prompt}
                      onChange={setPrompt}
                      onSubmit={handleSubmit}
                      onFocusChange={setIsInputFocused}
                      disabled={isGenerating}
                    />
                  ) : (
                    <div className="bg-gradient-to-t from-black via-black/95 to-transparent p-4 pb-safe">
                      <div className="max-w-2xl mx-auto">
                        <PromptBuilder
                          value={composedPrompt}
                          onChange={setComposedPrompt}
                          onGenerate={handleAdvancedGenerate}
                          disabled={isGenerating}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Filter Panel (in filters mode) */}
              {editMode === 'filters' && showFilterPanel && (
                <FilterPanel
                  filters={filterState}
                  onFiltersChange={setFilterState}
                  onSaveVersion={handleSaveFilterVersion}
                  onUseForAI={handleUseFilteredForAI}
                  disabled={isGenerating}
                />
              )}
            </motion.div>
          )}

          {/* Processing */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center p-6"
            >
              <div className="w-24 h-24 mb-8 relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-blue-500"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="absolute inset-0 rounded-full bg-blue-500 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                Creating magic...
              </h3>
              <p className="text-white/60 mb-6">
                AI is applying your filters
              </p>

              <div className="w-full max-w-xs">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="text-center mt-2 text-white/60 text-sm">
                  {progress}%
                </div>
              </div>

              {error && (
                <div className="mt-6 text-red-400 text-sm text-center max-w-xs">
                  {error}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Comparison Modes - Full Screen Overlay */}
      <AnimatePresence>
        {compareMode && photo && currentVersion && (
          <ComparisonModes
            beforeImage={photo}
            afterImage={currentVersion.image}
            beforeLabel="Original"
            afterLabel={`Version ${currentVersionIndex + 1}`}
            onClose={() => setCompareMode(false)}
          />
        )}
      </AnimatePresence>

      {/* History Drawer - Swipe Up Panel */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectPrompt={handlePromptSelect}
      />

      {/* Upgrade Modal */}
      {usageData && (
        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          remaining={usageData.remaining}
          resetsAt={usageData.resetsAt}
          onSignInClick={() => {
            setUpgradeModalOpen(false);
            setShowSignInModal(true);
          }}
        />
      )}

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && displayImage && (
          <ExportModal
            imageDataUrl={displayImage}
            originalWidth={imageDimensions.width}
            originalHeight={imageDimensions.height}
            filename={currentVersion ? `snapmod-v${currentVersionIndex + 1}` : 'snapmod-edit'}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Custom Presets Panel */}
      <AnimatePresence>
        {showCustomPresets && (
          <CustomPresetsPanel
            currentPrompt={advancedMode ? composedPrompt.basePrompt : prompt}
            currentModifiers={advancedMode ? composedPrompt.modifiers : []}
            beforeImage={photo || undefined}
            afterImage={displayImage || undefined}
            onSelectPreset={handleCustomPresetSelect}
            onClose={() => setShowCustomPresets(false)}
          />
        )}
      </AnimatePresence>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      {/* Usage Indicator - Top Right */}
      {step === 'photo' && usageData && !usageData.isPro && (
        <div className="fixed top-24 right-4 z-20 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full text-white/80 text-sm">
          {usageData.remaining} edits left today
        </div>
      )}
    </div>
  );
}
