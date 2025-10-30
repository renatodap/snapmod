'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Search, Trash2, History, Clock } from 'lucide-react';
import { promptHistory, type PromptHistoryItem } from '@/lib/prompt-history';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

/**
 * HistoryDrawer - Swipe-up panel for prompt history and favorites
 *
 * Features:
 * - All prompt history with timestamps
 * - Star/unstar favorites
 * - Search prompts
 * - Tap to reuse
 * - Delete prompts
 * - Clear all history (keep favorites)
 *
 * Mobile-First:
 * - Swipe up/down to open/close
 * - 70vh height
 * - Touch-optimized list
 * - Search bar at top
 */
export function HistoryDrawer({ isOpen, onClose, onSelectPrompt }: HistoryDrawerProps) {
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  console.log('[HistoryDrawer] Render:', { isOpen, itemCount: historyItems.length, searchQuery, showFavoritesOnly });

  // Load history when opened
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, showFavoritesOnly]);

  // Load history from IndexedDB
  const loadHistory = async () => {
    console.log('[HistoryDrawer] Loading history...');
    setLoading(true);

    try {
      const items = showFavoritesOnly
        ? await promptHistory.getFavorites()
        : await promptHistory.getAll();

      console.log('[HistoryDrawer] Loaded', items.length, 'items');
      setHistoryItems(items);
    } catch (error) {
      console.error('[HistoryDrawer] Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string) => {
    console.log('[HistoryDrawer] Toggling favorite:', id);

    try {
      await promptHistory.toggleFavorite(id);
      await loadHistory(); // Reload to reflect changes
    } catch (error) {
      console.error('[HistoryDrawer] Failed to toggle favorite:', error);
    }
  };

  // Delete item
  const handleDelete = async (id: string) => {
    console.log('[HistoryDrawer] Deleting item:', id);

    try {
      await promptHistory.delete(id);
      await loadHistory(); // Reload to reflect changes
    } catch (error) {
      console.error('[HistoryDrawer] Failed to delete item:', error);
    }
  };

  // Select prompt
  const handleSelect = (prompt: string) => {
    console.log('[HistoryDrawer] Prompt selected:', prompt.substring(0, 50));
    onSelectPrompt(prompt);
    onClose();
  };

  // Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    console.log('[HistoryDrawer] Searching for:', query);

    if (query.trim().length === 0) {
      loadHistory();
      return;
    }

    try {
      const results = await promptHistory.search(query);
      setHistoryItems(results);
    } catch (error) {
      console.error('[HistoryDrawer] Search failed:', error);
    }
  };

  // Clear all history (keep favorites)
  const handleClearHistory = async () => {
    if (!confirm('Clear all history? (Favorites will be kept)')) {
      return;
    }

    console.log('[HistoryDrawer] Clearing history...');

    try {
      await promptHistory.clearHistory();
      await loadHistory();
    } catch (error) {
      console.error('[HistoryDrawer] Failed to clear history:', error);
    }
  };

  // Filter displayed items
  const displayedItems = historyItems;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_event, info) => {
              // Swipe down to close
              if (info.velocity.y > 500 || info.offset.y > 100) {
                console.log('[HistoryDrawer] Swipe down detected, closing');
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl shadow-2xl"
            style={{ height: '70vh' }}
          >
            {/* Drag Handle */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full" />

            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  <h2 className="text-white font-semibold text-lg">Prompt History</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition p-2"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search prompts..."
                  className="w-full bg-white/10 text-white placeholder-white/40 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowFavoritesOnly(false)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    !showFavoritesOnly
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setShowFavoritesOnly(true)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                    showFavoritesOnly
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  <Star className="w-3 h-3" />
                  Favorites
                </button>
                {!showFavoritesOnly && historyItems.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="ml-auto px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="text-center text-white/40 py-8">Loading...</div>
              ) : displayedItems.length === 0 ? (
                <div className="text-center text-white/40 py-8">
                  {searchQuery ? 'No prompts found' : showFavoritesOnly ? 'No favorites yet' : 'No history yet'}
                </div>
              ) : (
                displayedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start gap-3">
                      {/* Star Button */}
                      <button
                        onClick={() => handleToggleFavorite(item.id)}
                        className="flex-shrink-0 mt-1 touch-manipulation"
                        aria-label={item.favorite ? 'Unstar' : 'Star'}
                      >
                        <Star
                          className={`w-5 h-5 transition ${
                            item.favorite
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-white/30'
                          }`}
                        />
                      </button>

                      {/* Prompt Content */}
                      <button
                        onClick={() => handleSelect(item.prompt)}
                        className="flex-1 text-left"
                      >
                        <p className="text-white text-sm leading-relaxed">
                          {item.prompt}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.lastUsed).toLocaleDateString()}</span>
                          {item.usageCount > 1 && (
                            <span>• Used {item.usageCount}x</span>
                          )}
                        </div>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-shrink-0 text-white/30 hover:text-red-400 transition touch-manipulation p-1"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
