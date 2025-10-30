'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, Check, Download, X, RotateCcw } from 'lucide-react';
import { FILTER_PRESETS, combinePrompts, type FilterPreset } from '@/lib/filter-presets';
import { useNanoBanana } from '@/hooks/useNanoBanana';
import { compressImage, downloadImage } from '@/lib/image-utils';

type Step = 'start' | 'photo' | 'processing' | 'result';

export default function Home() {
  const [step, setStep] = useState<Step>('start');
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<FilterPreset[]>([]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generate, isGenerating, progress, error } = useNanoBanana();

  const categories = ['all', 'retro', 'lighting', 'color', 'art', 'creative'];
  const filteredPresets = activeCategory === 'all'
    ? FILTER_PRESETS
    : FILTER_PRESETS.filter(f => f.category === activeCategory);

  // Handle camera
  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setPhoto(imageData);
      setStep('photo');

      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Camera error:', err);
      alert('Camera access denied');
    }
  };

  // Handle upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setPhoto(compressed);
      setStep('photo');
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  // Toggle filter
  const toggleFilter = (filter: FilterPreset) => {
    setSelectedFilters(prev => {
      const exists = prev.find(f => f.id === filter.id);
      return exists
        ? prev.filter(f => f.id !== filter.id)
        : [...prev, filter];
    });
  };

  // Submit for processing
  const handleSubmit = async () => {
    if (!photo || selectedFilters.length === 0) return;

    setStep('processing');
    const prompt = combinePrompts(selectedFilters);

    const result = await generate({
      prompt,
      imageUrl: photo,
      mode: 'edit'
    });

    if (result.success && result.image) {
      setResultImage(result.image);
      setStep('result');
    } else {
      alert(result.error || 'Failed to process image');
      setStep('photo');
    }
  };

  // Reset
  const reset = () => {
    setStep('start');
    setPhoto(null);
    setSelectedFilters([]);
    setResultImage(null);
  };

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
      <main className="flex-1 overflow-y-auto">
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

          {/* Photo + Filters */}
          {step === 'photo' && photo && (
            <motion.div
              key="photo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-full pb-32"
            >
              {/* Photo Display */}
              <div className="relative bg-black">
                <img
                  src={photo}
                  alt="Your photo"
                  className="w-full max-h-[50vh] object-contain"
                />
                <button
                  onClick={reset}
                  className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm p-2 rounded-full text-white hover:bg-black/80 transition"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
              {/* Filter Selection */}
              <div className="px-6 pt-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Choose filters
                </h3>
                <p className="text-white/60 mb-4">
                  Select one or combine multiple
                </p>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
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
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {filteredPresets.map(filter => {
                    const isSelected = selectedFilters.some(f => f.id === filter.id);
                    return (
                      <motion.button
                        key={filter.id}
                        onClick={() => toggleFilter(filter)}
                        className={`relative p-4 rounded-2xl text-left transition ${
                          isSelected
                            ? 'bg-blue-500'
                            : 'bg-white/10 hover:bg-white/15 active:scale-95'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="text-3xl mb-2">{filter.icon}</div>
                        <div className="font-semibold text-white mb-1">
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

          {/* Result */}
          {step === 'result' && resultImage && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-h-full pb-32"
            >
              <div className="relative bg-black flex items-center justify-center min-h-[70vh]">
                <img
                  src={resultImage}
                  alt="Result"
                  className="w-full max-h-[70vh] object-contain"
                />
              </div>

              <div className="p-6 space-y-3">
                <button
                  onClick={() => downloadImage(resultImage, 'snapmod-edit.jpg')}
                  className="w-full bg-blue-500 text-white py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 active:scale-95 transition shadow-2xl shadow-blue-500/50"
                >
                  <Download className="w-6 h-6" />
                  Save Photo
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

      {/* Fixed Submit Button (only on photo step with filters selected) */}
      {step === 'photo' && selectedFilters.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent"
        >
          <button
            onClick={handleSubmit}
            disabled={isGenerating}
            className="w-full bg-blue-500 text-white py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 active:scale-95 transition disabled:opacity-50 shadow-2xl shadow-blue-500/50"
          >
            <Sparkles className="w-6 h-6" />
            Apply {selectedFilters.length} Filter{selectedFilters.length > 1 ? 's' : ''}
          </button>
        </motion.div>
      )}
    </div>
  );
}
