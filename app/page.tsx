'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, Download, Share2, X, Check } from 'lucide-react';
import { FILTER_PRESETS, combinePrompts, type FilterPreset } from '@/lib/filter-presets';
import { useNanoBanana } from '@/hooks/useNanoBanana';
import { compressImage, downloadImage } from '@/lib/image-utils';

type Mode = 'home' | 'upload' | 'filters' | 'result';

export default function Home() {
  const [mode, setMode] = useState<Mode>('home');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<FilterPreset[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generate, isGenerating, progress, error } = useNanoBanana();

  // Handle image upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setOriginalImage(compressed);
      setMode('filters');
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  // Handle camera capture
  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Create video element to capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setOriginalImage(imageData);
      setMode('filters');

      // Stop camera
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Camera access failed:', err);
      alert('Camera access denied or not available');
    }
  };

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

  // Apply filters
  const applyFilters = async () => {
    if (!originalImage || selectedFilters.length === 0) return;

    const prompt = combinePrompts(selectedFilters);

    const result = await generate({
      prompt,
      imageUrl: originalImage,
      mode: 'edit'
    });

    if (result.success && result.image) {
      setResultImage(result.image);
      setMode('result');
    }
  };

  // Reset to start
  const reset = () => {
    setMode('home');
    setOriginalImage(null);
    setResultImage(null);
    setSelectedFilters([]);
  };

  // Filter by category
  const categories = ['all', 'retro', 'lighting', 'color', 'art', 'creative'];
  const filteredPresets = activeCategory === 'all'
    ? FILTER_PRESETS
    : FILTER_PRESETS.filter(f => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">SnapMod</h1>
          {mode !== 'home' && (
            <button
              onClick={reset}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4">
        <AnimatePresence mode="wait">
          {/* Home Screen */}
          {mode === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[70vh]"
            >
              <div className="mb-8 text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  AI Photo Magic
                </h2>
                <p className="text-gray-600">
                  Transform your photos with Nano Banana AI
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-sm">
                <button
                  onClick={handleCamera}
                  className="flex items-center justify-center gap-3 bg-blue-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:bg-blue-700 transition active:scale-95"
                >
                  <Camera className="w-6 h-6" />
                  Take Photo
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 bg-white text-gray-800 py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:bg-gray-50 transition active:scale-95"
                >
                  <Upload className="w-6 h-6" />
                  Upload Photo
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <p className="text-sm text-gray-500 mt-8 text-center max-w-xs">
                🔒 Your photos never leave your device<br />
                All processing happens securely
              </p>
            </motion.div>
          )}

          {/* Filter Selection Screen */}
          {mode === 'filters' && originalImage && (
            <motion.div
              key="filters"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Image Preview */}
              <div className="relative aspect-square w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
                {selectedFilters.length > 0 && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {selectedFilters.length} selected
                  </div>
                )}
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                      activeCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
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
                      className={`relative p-4 rounded-xl text-left transition ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-800 hover:bg-gray-50 shadow'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-3xl mb-2">{filter.icon}</div>
                      <div className="font-semibold mb-1">{filter.name}</div>
                      <div className="text-xs opacity-80">{filter.description}</div>

                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-blue-600" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Apply Button */}
              {selectedFilters.length > 0 && (
                <motion.button
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  onClick={applyFilters}
                  disabled={isGenerating}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-2xl hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating... {progress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Apply Filters
                    </>
                  )}
                </motion.button>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  Error: {error}
                </div>
              )}
            </motion.div>
          )}

          {/* Result Screen */}
          {mode === 'result' && resultImage && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="space-y-4"
            >
              {/* Before/After Comparison */}
              <div className="relative aspect-square w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={resultImage}
                  alt="Result"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => downloadImage(resultImage, 'snapmod-edit.jpg')}
                  className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  Save
                </button>

                <button
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        const blob = await (await fetch(resultImage)).blob();
                        const file = new File([blob], 'snapmod.jpg', { type: 'image/jpeg' });
                        await navigator.share({
                          files: [file],
                          title: 'Check out my SnapMod edit!'
                        });
                      } catch (err) {
                        console.error('Share failed:', err);
                      }
                    }
                  }}
                  className="flex-1 bg-white text-gray-800 py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition active:scale-95"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>

              {/* Edit More Button */}
              <button
                onClick={() => {
                  setOriginalImage(resultImage);
                  setResultImage(null);
                  setSelectedFilters([]);
                  setMode('filters');
                }}
                className="w-full bg-white text-gray-800 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Apply More Filters
              </button>

              <button
                onClick={reset}
                className="w-full text-gray-600 py-3 px-6 rounded-xl font-medium hover:bg-gray-100 transition"
              >
                Start Over
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
