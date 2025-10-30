'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, Check, Plus, ArrowRight, RotateCcw, Download, X } from 'lucide-react';
import { FILTER_PRESETS, combinePrompts, type FilterPreset } from '@/lib/filter-presets';
import { useNanoBanana } from '@/hooks/useNanoBanana';
import { downloadImage } from '@/lib/image-utils';

type Step = 'filters' | 'camera' | 'preview' | 'processing' | 'result';

export default function Home() {
  const [step, setStep] = useState<Step>('filters');
  const [selectedFilters, setSelectedFilters] = useState<FilterPreset[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { generate, isGenerating, progress, error } = useNanoBanana();

  // Categories for filtering
  const categories = ['all', 'retro', 'lighting', 'color', 'art', 'creative'];
  const filteredPresets = activeCategory === 'all'
    ? FILTER_PRESETS
    : FILTER_PRESETS.filter(f => f.category === activeCategory);

  // Toggle filter selection
  const toggleFilter = (filter: FilterPreset) => {
    setSelectedFilters(prev => {
      const exists = prev.find(f => f.id === filter.id);
      if (exists) {
        return prev.filter(f => f.id !== filter.id);
      } else {
        return [...prev, filter];
      }
    });
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      setStep('camera');
    } catch (err) {
      console.error('Camera access failed:', err);
      alert('Camera access denied. Please allow camera permission.');
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(imageData);

      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setStep('preview');
    }
  };

  // Process with AI
  const processImage = async () => {
    if (!capturedImage || selectedFilters.length === 0) return;

    setStep('processing');
    const prompt = combinePrompts(selectedFilters);

    const result = await generate({
      prompt,
      imageUrl: capturedImage,
      mode: 'edit'
    });

    if (result.success && result.image) {
      setResultImage(result.image);
      setStep('result');
    } else {
      setStep('preview'); // Go back to preview on error
    }
  };

  // Retake photo
  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Start over
  const reset = () => {
    setStep('filters');
    setSelectedFilters([]);
    setCapturedImage(null);
    setResultImage(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <motion.header
        className="relative z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">SnapMod</h1>
          </div>

          {step !== 'filters' && (
            <button
              onClick={reset}
              className="text-white/60 hover:text-white transition p-2"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Progress indicator */}
        {step !== 'filters' && (
          <div className="px-6 pb-3">
            <div className="flex gap-2">
              {['filters', 'camera', 'preview', 'result'].map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    ['filters', 'camera', 'preview', 'processing', 'result'].indexOf(step) >= i
                      ? 'bg-blue-500'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 1: Filter Selection */}
          {step === 'filters' && (
            <motion.div
              key="filters"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32">
                <h2 className="text-3xl font-bold text-white mb-2">Choose your vibe</h2>
                <p className="text-white/60 mb-6">Select one or mix multiple filters</p>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                        activeCategory === cat
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {filteredPresets.map(filter => {
                    const isSelected = selectedFilters.some(f => f.id === filter.id);
                    return (
                      <motion.button
                        key={filter.id}
                        onClick={() => toggleFilter(filter)}
                        className={`relative p-4 rounded-2xl text-left transition-all ${
                          isSelected
                            ? 'bg-blue-500 scale-[0.98]'
                            : 'bg-white/10 hover:bg-white/15 active:scale-95'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="text-3xl mb-3">{filter.icon}</div>
                        <div className="font-semibold text-white text-base mb-1">
                          {filter.name}
                        </div>
                        <div className="text-xs text-white/60">
                          {filter.description}
                        </div>

                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-blue-500" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Continue Button */}
              {selectedFilters.length > 0 && (
                <motion.div
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent"
                >
                  <button
                    onClick={startCamera}
                    className="w-full bg-blue-500 text-white py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 active:scale-95 transition shadow-2xl shadow-blue-500/50"
                  >
                    <Camera className="w-6 h-6" />
                    Open Camera
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="text-center mt-3 text-white/60 text-sm">
                    {selectedFilters.length} filter{selectedFilters.length > 1 ? 's' : ''} selected
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Camera */}
          {step === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col bg-black"
            >
              <div className="flex-1 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Selected Filters Overlay */}
                <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
                  {selectedFilters.map(filter => (
                    <div
                      key={filter.id}
                      className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm flex items-center gap-2"
                    >
                      <span>{filter.icon}</span>
                      <span>{filter.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Camera Controls */}
              <div className="p-6 bg-black">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setStep('filters')}
                    className="px-4 py-2 bg-white/10 rounded-full text-white text-sm hover:bg-white/20 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Edit Filters
                  </button>
                </div>

                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 mx-auto block bg-white rounded-full border-4 border-white/30 active:scale-90 transition shadow-2xl"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && capturedImage && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 relative">
                <img
                  src={capturedImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />

                {/* Applied Filters Overlay */}
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-black/60 backdrop-blur-sm p-3 rounded-2xl">
                    <div className="text-white/60 text-xs mb-2">Will apply:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedFilters.map(filter => (
                        <span key={filter.id} className="text-white text-sm">
                          {filter.icon} {filter.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-black space-y-3">
                <button
                  onClick={processImage}
                  disabled={isGenerating}
                  className="w-full bg-blue-500 text-white py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 active:scale-95 transition disabled:opacity-50 shadow-2xl shadow-blue-500/50"
                >
                  <Sparkles className="w-6 h-6" />
                  Apply Filters
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={retake}
                    className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Retake
                  </button>

                  <button
                    onClick={() => setStep('filters')}
                    className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Change Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Processing */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
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

              <h3 className="text-2xl font-bold text-white mb-2">Creating magic...</h3>
              <p className="text-white/60 mb-4">AI is applying your filters</p>

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
                <div className="mt-4 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 5: Result */}
          {step === 'result' && resultImage && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 relative">
                <img
                  src={resultImage}
                  alt="Result"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Actions */}
              <div className="p-6 bg-black space-y-3">
                <button
                  onClick={() => downloadImage(resultImage, 'snapmod-edit.jpg')}
                  className="w-full bg-blue-500 text-white py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 active:scale-95 transition shadow-2xl shadow-blue-500/50"
                >
                  <Download className="w-6 h-6" />
                  Save to Photos
                </button>

                <button
                  onClick={reset}
                  className="w-full bg-white/10 text-white py-4 rounded-2xl font-medium hover:bg-white/20 transition"
                >
                  Create Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
