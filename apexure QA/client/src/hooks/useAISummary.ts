import { useState } from 'react';
import { AccessibilityResult } from './useAccessibility';

export type AISummaryStatus = 'idle' | 'loading' | 'done' | 'error';

export function useAISummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [status, setStatus] = useState<AISummaryStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async (accessibilityResult: AccessibilityResult) => {
    setStatus('loading');
    setError(null);
    setSummary(null);

    try {
      const response = await fetch('http://localhost:3334/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accessibilityResult),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setSummary(data.summary);
      setStatus('done');
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI summary');
      setStatus('error');
    }
  };

  return { summary, status, error, generateSummary };
}
