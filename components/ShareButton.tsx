'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Check, Copy } from 'lucide-react';
import { trackShare } from '@/lib/analytics';

interface ShareButtonProps {
  imageUrl: string;
  prompt?: string;
  className?: string;
}

export function ShareButton({ imageUrl, prompt, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Convert data URL to blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'snapmod-edit.jpg', { type: 'image/jpeg' });

    const shareText = prompt
      ? `I just edited this with AI using "${prompt}" ✨\n\nMade with SnapMod`
      : 'Check out my AI-edited photo! ✨\n\nMade with SnapMod';

    // Try native share first (mobile)
    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My SnapMod Edit',
          text: shareText,
        });
        trackShare('native');
      } catch (err) {
        // User cancelled or error occurred
        console.log('[Share] Native share cancelled or failed:', err);
      }
      return;
    }

    // Fallback: Copy link to clipboard (desktop)
    try {
      // For now, just copy a message since we don't have a backend to host images
      const fallbackText = `${shareText}\n\nTry it yourself: https://snapmod.app`;
      await navigator.clipboard.writeText(fallbackText);
      setCopied(true);
      trackShare('copy');

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[Share] Failed to copy:', err);
    }
  };

  return (
    <motion.button
      onClick={handleShare}
      className={`flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition active:scale-95 ${className}`}
      whileTap={{ scale: 0.95 }}
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 text-green-400" />
          <span className="text-white font-medium">Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5 text-white" />
          <span className="text-white font-medium">Share</span>
        </>
      )}
    </motion.button>
  );
}

// Floating share button variant
export function FloatingShareButton({ imageUrl, prompt }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'snapmod-edit.jpg', { type: 'image/jpeg' });

    const shareText = prompt
      ? `I just edited this with AI using "${prompt}" ✨\n\nMade with SnapMod`
      : 'Check out my AI-edited photo! ✨\n\nMade with SnapMod';

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My SnapMod Edit',
          text: shareText,
        });
        trackShare('native');
      } catch (err) {
        console.log('[Share] Cancelled');
      }
      return;
    }

    try {
      const fallbackText = `${shareText}\n\nTry it yourself: https://snapmod.app`;
      await navigator.clipboard.writeText(fallbackText);
      setCopied(true);
      trackShare('copy');

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[Share] Failed:', err);
    }
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={handleShare}
      className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/50 active:scale-95 transition"
      aria-label="Share"
      title="Share your edit"
    >
      {copied ? (
        <Check className="w-6 h-6" />
      ) : (
        <Share2 className="w-6 h-6" />
      )}
    </motion.button>
  );
}
