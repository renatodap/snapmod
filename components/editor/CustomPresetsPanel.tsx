'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Star, Trash2, Search, Download, Upload, Plus, Heart } from 'lucide-react';
import { customPresets, type CustomPreset, createThumbnail } from '@/lib/custom-presets';

interface CustomPresetsPanelProps {
  currentPrompt?: string;
  currentModifiers?: any[];
  beforeImage?: string;
  afterImage?: string;
  onSelectPreset: (preset: CustomPreset) => void;
  onClose: () => void;
}

export function CustomPresetsPanel({
  currentPrompt,
  currentModifiers,
  beforeImage,
  afterImage,
  onSelectPreset,
  onClose,
}: CustomPresetsPanelProps) {
  const [presets, setPresets] = useState<CustomPreset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CustomPreset['category']>('custom');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  // Load presets
  useEffect(() => {
    loadPresets();
  }, [filter]);

  const loadPresets = async () => {
    const loaded = filter === 'favorites'
      ? await customPresets.getFavorites()
      : await customPresets.getAll();
    setPresets(loaded);
  };

  // Search presets
  const filteredPresets = searchQuery
    ? presets.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : presets;

  // Save current state as preset
  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return;

    try {
      // Create thumbnails if images available
      let exampleBefore: string | undefined;
      let exampleAfter: string | undefined;

      if (beforeImage && afterImage) {
        exampleBefore = await createThumbnail(beforeImage, 150);
        exampleAfter = await createThumbnail(afterImage, 150);
      }

      const preset = await customPresets.save({
        name: newPresetName.trim(),
        description: newPresetDescription.trim() || undefined,
        basePrompt: currentPrompt || '',
        modifiers: currentModifiers,
        category: selectedCategory,
        exampleBefore,
        exampleAfter,
        tags: [],
      });

      console.log('[CustomPresetsPanel] Preset saved:', preset.name);

      // Reset form
      setNewPresetName('');
      setNewPresetDescription('');
      setShowSaveDialog(false);

      // Reload presets
      loadPresets();
    } catch (error) {
      console.error('[CustomPresetsPanel] Failed to save preset:', error);
      alert('Failed to save preset. Please try again.');
    }
  };

  // Delete preset
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this preset?')) return;

    try {
      await customPresets.delete(id);
      loadPresets();
    } catch (error) {
      console.error('[CustomPresetsPanel] Failed to delete:', error);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string) => {
    try {
      await customPresets.toggleFavorite(id);
      loadPresets();
    } catch (error) {
      console.error('[CustomPresetsPanel] Failed to toggle favorite:', error);
    }
  };

  // Use preset
  const handleUsePreset = async (preset: CustomPreset) => {
    await customPresets.incrementUsage(preset.id);
    onSelectPreset(preset);
    onClose();
  };

  // Export/Import
  const handleExport = async () => {
    const json = await customPresets.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapmod-presets-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = e.target?.result as string;
          await customPresets.importAll(json);
          loadPresets();
          alert('Presets imported successfully!');
        } catch (error) {
          console.error('[CustomPresetsPanel] Import failed:', error);
          alert('Failed to import presets. Invalid file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 w-full max-w-md bg-black/95 backdrop-blur-lg z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">My Presets</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={!currentPrompt}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save Current
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
            title="Export all presets"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
            title="Import presets"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-4 space-y-3 border-b border-white/10">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search presets..."
            className="w-full pl-10 pr-4 py-2 bg-white/10 text-white placeholder-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/60'
            }`}
          >
            All ({presets.length})
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition flex items-center justify-center gap-1 ${
              filter === 'favorites'
                ? 'bg-pink-500 text-white'
                : 'bg-white/10 text-white/60'
            }`}
          >
            <Heart className="w-3 h-3" />
            Favorites
          </button>
        </div>
      </div>

      {/* Presets List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredPresets.length === 0 && (
          <div className="text-center py-12 text-white/40">
            {searchQuery ? 'No presets found' : 'No presets yet'}
            <br />
            <button
              onClick={() => setShowSaveDialog(true)}
              className="mt-4 text-blue-400 hover:text-blue-300 transition inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Create your first preset
            </button>
          </div>
        )}

        {filteredPresets.map((preset) => (
          <motion.div
            key={preset.id}
            layout
            className="bg-white/5 hover:bg-white/10 rounded-xl p-3 cursor-pointer transition"
            onClick={() => handleUsePreset(preset)}
          >
            {/* Preset Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-white font-medium">{preset.name}</h3>
                {preset.description && (
                  <p className="text-white/60 text-sm mt-1">{preset.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(preset.id);
                  }}
                  className={`p-1 rounded transition ${
                    preset.isFavorite
                      ? 'text-pink-500'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${preset.isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(preset.id);
                  }}
                  className="p-1 text-white/40 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Example Images */}
            {preset.exampleBefore && preset.exampleAfter && (
              <div className="flex gap-2 mb-2">
                <img
                  src={preset.exampleBefore}
                  alt="Before"
                  className="w-12 h-12 rounded object-cover"
                />
                <img
                  src={preset.exampleAfter}
                  alt="After"
                  className="w-12 h-12 rounded object-cover"
                />
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>Used {preset.usageCount} times</span>
              {preset.category && (
                <span className="px-2 py-0.5 bg-white/10 rounded-full">
                  {preset.category}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-10"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Save Preset</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="My Awesome Style"
                    className="w-full px-4 py-2 bg-white/10 text-white placeholder-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/80 mb-1">Description (optional)</label>
                  <textarea
                    value={newPresetDescription}
                    onChange={(e) => setNewPresetDescription(e.target.value)}
                    placeholder="Describe what this preset does..."
                    rows={2}
                    className="w-full px-4 py-2 bg-white/10 text-white placeholder-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/80 mb-2">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['portrait', 'landscape', 'product', 'food', 'custom'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-2 rounded-lg text-sm transition ${
                          selectedCategory === cat
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePreset}
                    disabled={!newPresetName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
