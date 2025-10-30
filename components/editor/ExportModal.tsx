'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, X, Image as ImageIcon, Smartphone, Monitor, Printer, Globe } from 'lucide-react';

interface ExportSettings {
  format: 'jpg' | 'png' | 'webp';
  quality: number; // 1-100
  preset: 'original' | 'instagram' | 'web' | 'print' | '4k' | 'custom';
  width?: number;
  height?: number;
  preserveMetadata: boolean;
}

interface ExportModalProps {
  imageDataUrl: string;
  originalWidth: number;
  originalHeight: number;
  filename?: string;
  onClose: () => void;
}

const EXPORT_PRESETS: Record<string, Partial<ExportSettings> & { description: string; icon: any }> = {
  original: {
    description: 'Keep original dimensions and quality',
    format: 'jpg',
    quality: 95,
    icon: ImageIcon,
  },
  instagram: {
    description: 'Optimized for Instagram (1080x1080)',
    format: 'jpg',
    quality: 90,
    width: 1080,
    height: 1080,
    icon: Smartphone,
  },
  web: {
    description: 'Optimized for web (max 1920px, 85% quality)',
    format: 'webp',
    quality: 85,
    width: 1920,
    icon: Globe,
  },
  '4k': {
    description: 'High resolution for displays (3840x2160)',
    format: 'jpg',
    quality: 95,
    width: 3840,
    height: 2160,
    icon: Monitor,
  },
  print: {
    description: 'Print quality (300 DPI equivalent)',
    format: 'png',
    quality: 100,
    icon: Printer,
  },
};

export function ExportModal({
  imageDataUrl,
  originalWidth,
  originalHeight,
  filename = 'snapmod-edit',
  onClose,
}: ExportModalProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'jpg',
    quality: 95,
    preset: 'original',
    preserveMetadata: false,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<string>('');

  // Calculate estimated file size
  const calculateEstimatedSize = () => {
    const pixels = (settings.width || originalWidth) * (settings.height || originalHeight);
    const bytesPerPixel = settings.format === 'png' ? 4 : 3;
    const compressionRatio = settings.quality / 100;
    const estimatedBytes = pixels * bytesPerPixel * compressionRatio;

    if (estimatedBytes > 1024 * 1024) {
      setEstimatedSize(`~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`);
    } else {
      setEstimatedSize(`~${(estimatedBytes / 1024).toFixed(0)} KB`);
    }
  };

  // Handle preset selection
  const selectPreset = (presetKey: string) => {
    const preset = EXPORT_PRESETS[presetKey];
    setSettings({
      ...settings,
      ...preset,
      preset: presetKey as any,
    });
  };

  // Export image with settings
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Load original image
      const img = new Image();
      img.src = imageDataUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Create canvas with target dimensions
      const canvas = document.createElement('canvas');
      const targetWidth = settings.width || originalWidth;
      const targetHeight = settings.height || originalHeight;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Draw image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Export with settings
      const mimeType = `image/${settings.format}`;
      const qualityValue = settings.quality / 100;

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          mimeType,
          qualityValue
        );
      });

      if (!blob) throw new Error('Failed to create blob');

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${settings.preset}.${settings.format}`;
      a.click();
      URL.revokeObjectURL(url);

      console.log('[ExportModal] Exported:', {
        format: settings.format,
        quality: settings.quality,
        dimensions: `${targetWidth}x${targetHeight}`,
        size: `${(blob.size / 1024).toFixed(0)} KB`,
      });

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('[ExportModal] Export failed:', error);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Update estimated size when settings change
  useState(() => {
    calculateEstimatedSize();
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Export Options</h2>
              <p className="text-white/60 text-sm">Choose quality and format</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Preset Buttons */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(EXPORT_PRESETS).map(([key, preset]) => {
                const Icon = preset.icon;
                const isSelected = settings.preset === key;

                return (
                  <button
                    key={key}
                    onClick={() => selectPreset(key)}
                    className={`
                      p-4 rounded-xl border-2 transition text-left
                      ${isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-blue-400' : 'text-white/60'}`} />
                      <div>
                        <div className="font-medium text-white capitalize mb-1">
                          {key === '4k' ? '4K' : key}
                        </div>
                        <div className="text-xs text-white/60 leading-tight">
                          {preset.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Format
            </label>
            <div className="flex gap-2">
              {(['jpg', 'png', 'webp'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => setSettings({ ...settings, format })}
                  className={`
                    flex-1 px-4 py-2 rounded-xl transition font-medium
                    ${settings.format === format
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }
                  `}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/40 mt-2">
              {settings.format === 'jpg' && 'Best for photos, smaller file size'}
              {settings.format === 'png' && 'Lossless, supports transparency'}
              {settings.format === 'webp' && 'Modern format, best compression'}
            </p>
          </div>

          {/* Quality Slider */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Quality: {settings.quality}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={settings.quality}
              onChange={(e) => {
                setSettings({ ...settings, quality: parseInt(e.target.value) });
                calculateEstimatedSize();
              }}
              className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgba(59,130,246,0.8) 0%, rgba(59,130,246,0.8) ${settings.quality}%, rgba(255,255,255,0.2) ${settings.quality}%)`
              }}
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>

          {/* Custom Dimensions (if custom preset) */}
          {settings.preset === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/80 mb-2">Width (px)</label>
                <input
                  type="number"
                  value={settings.width || originalWidth}
                  onChange={(e) => {
                    setSettings({ ...settings, width: parseInt(e.target.value) || originalWidth });
                    calculateEstimatedSize();
                  }}
                  className="w-full px-4 py-2 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Height (px)</label>
                <input
                  type="number"
                  value={settings.height || originalHeight}
                  onChange={(e) => {
                    setSettings({ ...settings, height: parseInt(e.target.value) || originalHeight });
                    calculateEstimatedSize();
                  }}
                  className="w-full px-4 py-2 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/60 mb-1">Original</div>
                <div className="text-white font-medium">
                  {originalWidth} × {originalHeight}
                </div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Output</div>
                <div className="text-white font-medium">
                  {settings.width || originalWidth} × {settings.height || originalHeight}
                </div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Format</div>
                <div className="text-white font-medium uppercase">
                  {settings.format}
                </div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Est. Size</div>
                <div className="text-white font-medium">
                  {estimatedSize}
                </div>
              </div>
            </div>
          </div>

          {/* Options */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.preserveMetadata}
              onChange={(e) => setSettings({ ...settings, preserveMetadata: e.target.checked })}
              className="w-5 h-5 rounded bg-white/10 border-white/20"
            />
            <span className="text-white/80 text-sm">
              Preserve metadata (EXIF data)
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg hover:shadow-blue-500/50 text-white rounded-xl transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
