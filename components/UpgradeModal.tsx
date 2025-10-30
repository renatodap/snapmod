'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Zap } from 'lucide-react';
import { formatTimeUntilReset } from '@/lib/usage-limits';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  remaining: number;
  resetsAt: Date;
}

export function UpgradeModal({ isOpen, onClose, remaining, resetsAt }: UpgradeModalProps) {
  const timeUntilReset = formatTimeUntilReset(resetsAt);

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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition p-2"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Daily Limit Reached
                </h2>
                <p className="text-white/60">
                  You've used all {5 - remaining} free edits today
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {/* Wait Option */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">Wait & Continue Free</h3>
                    <span className="text-blue-400 font-bold">{timeUntilReset}</span>
                  </div>
                  <p className="text-sm text-white/60">
                    Your free edits reset at midnight
                  </p>
                </div>

                {/* Pro Option */}
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-4 border-2 border-blue-500/50 relative overflow-hidden">
                  {/* Badge */}
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    BEST VALUE
                  </div>

                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg mb-1">SnapMod Pro</h3>
                      <p className="text-2xl font-bold text-white">
                        $4.99<span className="text-sm text-white/60 font-normal">/month</span>
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-white/90 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      Unlimited AI edits
                    </li>
                    <li className="flex items-center gap-2 text-white/90 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      No watermarks
                    </li>
                    <li className="flex items-center gap-2 text-white/90 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      Higher quality AI models
                    </li>
                    <li className="flex items-center gap-2 text-white/90 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      Batch processing (coming soon)
                    </li>
                    <li className="flex items-center gap-2 text-white/90 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      Priority support
                    </li>
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      // TODO: Implement Stripe checkout
                      alert('Stripe integration coming soon! For now, DM @renatodap on Twitter for early access.');
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition active:scale-95"
                  >
                    Upgrade to Pro
                  </button>

                  <p className="text-xs text-white/40 text-center mt-2">
                    Cancel anytime • 7-day money-back guarantee
                  </p>
                </div>
              </div>

              {/* Footer */}
              <button
                onClick={onClose}
                className="w-full text-white/60 hover:text-white transition text-sm font-medium"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
