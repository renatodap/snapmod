'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, Download, X, Maximize2, History as HistoryIcon } from 'lucide-react';
import { PromptInput } from '@/components/editor/PromptInput';
import { VersionTimeline } from '@/components/editor/VersionTimeline';
import { ComparisonSlider } from '@/components/editor/ComparisonSlider';
import { HistoryDrawer } from '@/components/editor/HistoryDrawer';
import { useNanoBanana } from '@/hooks/useNanoBanana';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { compressImage, downloadImage } from '@/lib/image-utils';
import { versionStorage, type Version } from '@/lib/version-storage';
import { promptHistory } from '@/lib/prompt-history';

type Step = 'start' | 'photo' | 'processing' | 'result';

export default function Home() {
  const [step, setStep] = useState<Step>('start');
  const [photo, setPhoto] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(0);
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [compareMode, setCompareMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generate, isGenerating, progress, error } = useNanoBanana();

  const currentVersion = versions[currentVersionIndex];
  const displayImage = currentVersion?.image || photo;

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

    console.log('[Submit] Starting processing with prompt:', prompt);
    console.log('[Submit] Prompt length:', prompt.length, 'characters');

    // Save prompt to history
    try {
      await promptHistory.add(prompt.trim());
      console.log('[Submit] Prompt added to history');
    } catch (historyError) {
      console.error('[Submit] Failed to save prompt to history:', historyError);
      // Continue anyway
    }

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

        // Create new version
        const newVersion: Version = {
          id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          prompt: prompt.trim(),
          image: result.image,
          timestamp: Date.now(),
          sessionId
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

        // Use userMessage if available from API, otherwise use generic error
        const errorMessage = result.userMessage || result.error || 'Failed to process image. Please try again.';
        alert(errorMessage);
        setStep('photo');
        console.log('[Submit] Returning to photo step due to error');
      }
    } catch (err) {
      console.error('[Submit] Unexpected error during generation:', err);
      alert('An unexpected error occurred. Please try again.');
      setStep('photo');
    }
  };

  // Navigate versions
  const handleVersionChange = (index: number) => {
    console.log('[Version] Navigating to version:', index);
    setCurrentVersionIndex(index);
  };

  // Toggle comparison mode
  const toggleCompare = () => {
    console.log('[Compare] Toggling comparison mode');
    if (!photo || versions.length === 0) {
      console.log('[Compare] Cannot compare - no versions yet');
      return;
    }
    setCompareMode(!compareMode);
  };

  // Toggle history drawer
  const toggleHistory = () => {
    console.log('[History] Toggling history drawer');
    setHistoryOpen(!historyOpen);
  };

  // Handle prompt selection from history
  const handlePromptSelect = (selectedPrompt: string) => {
    console.log('[History] Prompt selected from history:', selectedPrompt);
    setPrompt(selectedPrompt);
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
              className="h-full flex flex-col items-center justify-center p-6"
            >
              <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 text-center">
                AI Photo Magic
              </h2>
              <p className="text-white/60 text-center mb-12">
                Transform your photos instantly
              </p>

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
                  />
                )}

                {/* Header Overlay */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h1 className="text-xl font-bold text-white">SnapMod</h1>
                    </div>
                    <button
                      onClick={reset}
                      className="text-white/60 hover:text-white transition p-2"
                    >
                      <X className="w-6 h-6" />
                    </button>
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
                <div className="absolute right-4 bottom-32 flex flex-col gap-3">
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

              {/* Prompt Input - Floating Bottom */}
              <PromptInput
                value={prompt}
                onChange={setPrompt}
                onSubmit={handleSubmit}
                onFocusChange={setIsInputFocused}
                disabled={isGenerating}
              />
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

      {/* Comparison Slider - Full Screen Overlay */}
      <AnimatePresence>
        {compareMode && photo && currentVersion && (
          <ComparisonSlider
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
    </div>
  );
}
