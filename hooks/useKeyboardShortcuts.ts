/**
 * Keyboard Shortcuts Hook - Power user keyboard navigation
 *
 * Shortcuts:
 * - ArrowLeft/ArrowRight: Navigate versions
 * - C: Toggle comparison view
 * - H: Toggle history drawer
 * - Escape: Close overlays
 * - Enter: Submit prompt (when focused)
 *
 * Mobile-First:
 * - All shortcuts are optional enhancements
 * - Touch interactions remain primary
 * - No shortcuts interfere with text input
 */

import { useEffect } from 'react';

interface KeyboardShortcutConfig {
  // Version navigation
  onPreviousVersion?: () => void;
  onNextVersion?: () => void;

  // Overlays
  onToggleCompare?: () => void;
  onToggleHistory?: () => void;
  onCloseOverlays?: () => void;

  // State flags
  isInputFocused?: boolean;
  hasVersions?: boolean;
  canCompare?: boolean;
}

export function useKeyboardShortcuts({
  onPreviousVersion,
  onNextVersion,
  onToggleCompare,
  onToggleHistory,
  onCloseOverlays,
  isInputFocused = false,
  hasVersions = false,
  canCompare = false
}: KeyboardShortcutConfig) {
  useEffect(() => {
    console.log('[KeyboardShortcuts] Initializing keyboard shortcuts...');

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept keys when input is focused
      if (isInputFocused) {
        console.log('[KeyboardShortcuts] Input focused, ignoring shortcut');
        return;
      }

      const key = event.key;
      console.log('[KeyboardShortcuts] Key pressed:', key);

      switch (key) {
        case 'ArrowLeft':
          if (hasVersions && onPreviousVersion) {
            event.preventDefault();
            console.log('[KeyboardShortcuts] Previous version');
            onPreviousVersion();
          }
          break;

        case 'ArrowRight':
          if (hasVersions && onNextVersion) {
            event.preventDefault();
            console.log('[KeyboardShortcuts] Next version');
            onNextVersion();
          }
          break;

        case 'c':
        case 'C':
          if (canCompare && onToggleCompare) {
            event.preventDefault();
            console.log('[KeyboardShortcuts] Toggle compare');
            onToggleCompare();
          }
          break;

        case 'h':
        case 'H':
          if (onToggleHistory) {
            event.preventDefault();
            console.log('[KeyboardShortcuts] Toggle history');
            onToggleHistory();
          }
          break;

        case 'Escape':
          if (onCloseOverlays) {
            event.preventDefault();
            console.log('[KeyboardShortcuts] Close overlays');
            onCloseOverlays();
          }
          break;

        default:
          // Ignore other keys
          break;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    console.log('[KeyboardShortcuts] Keyboard shortcuts active');

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('[KeyboardShortcuts] Keyboard shortcuts deactivated');
    };
  }, [
    onPreviousVersion,
    onNextVersion,
    onToggleCompare,
    onToggleHistory,
    onCloseOverlays,
    isInputFocused,
    hasVersions,
    canCompare
  ]);
}
