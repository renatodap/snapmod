/**
 * Analytics tracking - Privacy-first, GDPR compliant
 *
 * Usage:
 * import { track } from '@/lib/analytics';
 * track('event_name', { property: 'value' });
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

class Analytics {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();

    // Check if user has opted out
    if (typeof window !== 'undefined') {
      this.isEnabled = localStorage.getItem('analytics_opt_out') !== 'true';
    }
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    const existing = sessionStorage.getItem('session_id');
    if (existing) return existing;

    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', newId);
    return newId;
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled || typeof window === 'undefined') return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        // Auto-capture useful context
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        page: window.location.pathname,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    // Store locally for debugging
    this.events.push(analyticsEvent);
    console.log('[Analytics]', event, properties);

    // Store in localStorage for persistence (last 100 events)
    try {
      const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      stored.push(analyticsEvent);
      const recent = stored.slice(-100); // Keep last 100 events
      localStorage.setItem('analytics_events', JSON.stringify(recent));
    } catch (e) {
      console.error('[Analytics] Failed to store event:', e);
    }

    // TODO: Send to analytics service (Plausible, Mixpanel, etc.)
    // For now, just log to console
  }

  // Get analytics summary
  getSummary() {
    if (typeof window === 'undefined') return null;

    try {
      const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      const eventCounts: Record<string, number> = {};

      stored.forEach((e: AnalyticsEvent) => {
        eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
      });

      return {
        totalEvents: stored.length,
        eventCounts,
        sessionId: this.sessionId,
      };
    } catch (e) {
      return null;
    }
  }

  // Opt out of analytics
  optOut() {
    this.isEnabled = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_opt_out', 'true');
    }
  }

  // Opt back in
  optIn() {
    this.isEnabled = true;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics_opt_out');
    }
  }
}

// Singleton instance
const analytics = new Analytics();

// Export convenience function
export const track = (event: string, properties?: Record<string, any>) => {
  analytics.track(event, properties);
};

export const getAnalyticsSummary = () => analytics.getSummary();
export const optOutAnalytics = () => analytics.optOut();
export const optInAnalytics = () => analytics.optIn();

// Common event tracking helpers
export const trackImageUpload = (file: File) => {
  track('image_uploaded', {
    size_kb: Math.round(file.size / 1024),
    type: file.type,
    name: file.name,
  });
};

export const trackEditStart = (prompt: string, mode: 'edit' | 'generate') => {
  track('edit_started', {
    prompt_length: prompt.length,
    prompt_preview: prompt.substring(0, 50),
    mode,
  });
};

export const trackEditComplete = (prompt: string, duration_ms: number, cached: boolean) => {
  track('edit_completed', {
    prompt_length: prompt.length,
    duration_ms,
    cached,
    duration_seconds: Math.round(duration_ms / 1000),
  });
};

export const trackEditFailed = (error: string, prompt: string) => {
  track('edit_failed', {
    error,
    prompt_length: prompt.length,
  });
};

export const trackDownload = (versionNumber: number) => {
  track('download', {
    version_number: versionNumber,
  });
};

export const trackShare = (method: 'native' | 'copy' | 'social') => {
  track('share_attempted', {
    method,
  });
};

export const trackPresetUsed = (presetLabel: string, presetPrompt: string) => {
  track('preset_used', {
    preset_label: presetLabel,
    preset_prompt: presetPrompt,
  });
};

export const trackVersionChange = (fromVersion: number, toVersion: number) => {
  track('version_changed', {
    from_version: fromVersion,
    to_version: toVersion,
  });
};

export const trackComparisonView = () => {
  track('comparison_viewed');
};

export const trackHistoryOpened = () => {
  track('history_opened');
};
