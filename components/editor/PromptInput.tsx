'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronUp } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocusChange?: (focused: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * PromptInput - Mobile-first floating prompt input
 *
 * Features:
 * - Minimal single-line by default
 * - Expands to multi-line when focused
 * - Swipe up gesture to expand
 * - Auto-resize as user types
 * - Large touch target for submit button
 *
 * Gestures:
 * - Tap to focus and expand
 * - Swipe up to manually expand
 * - Tap outside to collapse
 * - Enter to submit (keyboard)
 */
export function PromptInput({ value, onChange, onSubmit, onFocusChange, disabled = false, placeholder = 'Describe your edit...' }: PromptInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  console.log('[PromptInput] Render:', { expanded, focused, valueLength: value.length, disabled });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Expand on focus
  const handleFocus = () => {
    console.log('[PromptInput] Focused');
    setFocused(true);
    setExpanded(true);
    onFocusChange?.(true);
  };

  // Collapse on blur (only if empty)
  const handleBlur = () => {
    console.log('[PromptInput] Blurred');
    setFocused(false);
    onFocusChange?.(false);
    if (value.trim().length === 0) {
      setExpanded(false);
    }
  };

  // Handle submit
  const handleSubmit = () => {
    if (disabled || value.trim().length === 0) {
      console.log('[PromptInput] Submit blocked:', { disabled, empty: value.trim().length === 0 });
      return;
    }

    console.log('[PromptInput] Submit:', { prompt: value, length: value.length });
    onSubmit();
  };

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    const newExpanded = !expanded;
    console.log('[PromptInput] Toggle expanded:', newExpanded);
    setExpanded(newExpanded);
    if (newExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-safe"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        // Swipe up to expand
        if (info.velocity.y < -500 || info.offset.y < -50) {
          console.log('[PromptInput] Swipe up detected, expanding');
          setExpanded(true);
          textareaRef.current?.focus();
        }
      }}
    >
      <div className="px-4 pb-4">
        {/* Character count (when expanded) */}
        <AnimatePresence>
          {expanded && value.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-right text-xs text-white/40 mb-2"
            >
              {value.length} characters
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-end gap-2">
          {/* Textarea */}
          <motion.textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              console.log('[PromptInput] Changed:', e.target.value.length);
              onChange(e.target.value);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            animate={{
              height: expanded ? 'auto' : '56px',
              maxHeight: expanded ? '40vh' : '56px'
            }}
            className="flex-1 bg-white/10 backdrop-blur-sm text-white placeholder-white/40 px-4 py-3 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: '56px',
              transition: 'max-height 0.3s ease'
            }}
          />

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={disabled || value.trim().length === 0}
            className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center touch-manipulation active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-500/50"
            aria-label="Submit prompt"
          >
            <Send className="w-5 h-5 text-white" />
          </button>

          {/* Expand/Collapse Toggle */}
          {!focused && (
            <button
              onClick={toggleExpanded}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center touch-manipulation active:scale-95 transition"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronUp className="w-5 h-5 text-white/60" />
              </motion.div>
            </button>
          )}
        </div>

        {/* Hints (when expanded and empty) */}
        <AnimatePresence>
          {expanded && value.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-xs text-white/30 space-y-1"
            >
              <p>Try: "increase sharpness, cinematic bokeh"</p>
              <p>Or: "golden hour lighting, film grain"</p>
              <p>Or: "shallow depth of field, vintage"</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
